-- Tabla de Proveedores (Directorio base)
CREATE TABLE IF NOT EXISTS public.proveedores (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    empresa_id UUID NOT NULL REFERENCES public.empresas(id) ON DELETE CASCADE,
    rut TEXT,
    nombre TEXT NOT NULL,
    telefono TEXT,
    email TEXT,
    direccion TEXT,
    notas TEXT,
    activo BOOLEAN DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    UNIQUE(empresa_id, rut) -- Un proveedor no debería repetirse por empresa
);

-- Tabla de Órdenes de Compra (Cabecera)
CREATE TABLE IF NOT EXISTS public.pedidos_compra (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    empresa_id UUID NOT NULL REFERENCES public.empresas(id) ON DELETE CASCADE,
    proveedor_id UUID REFERENCES public.proveedores(id) ON DELETE SET NULL,
    estado TEXT NOT NULL DEFAULT 'pendiente_pedido', -- 'pendiente_pedido', 'pedido_realizado', 'recibido_e_ingresado', 'anulado'
    total_estimado NUMERIC DEFAULT 0,
    notas TEXT,
    fecha_pedido TIMESTAMP WITH TIME ZONE,
    fecha_recepcion TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Tabla de Detalles de Pedido (Ítems)
CREATE TABLE IF NOT EXISTS public.detalle_pedidos (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    pedido_id UUID NOT NULL REFERENCES public.pedidos_compra(id) ON DELETE CASCADE,
    producto_id UUID NOT NULL REFERENCES public.productos(id) ON DELETE CASCADE,
    cantidad_pedida NUMERIC NOT NULL,
    cantidad_recibida NUMERIC DEFAULT 0,
    precio_unitario_estimado NUMERIC DEFAULT 0, -- El último precio conocido al momento de crear el pedido
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Habilitar RLS (Row Level Security) para Multi-Tenant
ALTER TABLE public.proveedores ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.pedidos_compra ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.detalle_pedidos ENABLE ROW LEVEL SECURITY;

-- Políticas RLS: Solo ver datos de la propia empresa
CREATE POLICY "Usuarios pueden ver proveedores de su empresa" ON public.proveedores FOR SELECT USING (empresa_id = auth.uid() OR auth.uid() IN (SELECT id FROM perfiles WHERE empresa_id = proveedores.empresa_id));
CREATE POLICY "Usuarios pueden insertar proveedores de su empresa" ON public.proveedores FOR INSERT WITH CHECK (empresa_id = auth.uid() OR auth.uid() IN (SELECT id FROM perfiles WHERE empresa_id = proveedores.empresa_id));
CREATE POLICY "Usuarios pueden actualizar proveedores de su empresa" ON public.proveedores FOR UPDATE USING (empresa_id = auth.uid() OR auth.uid() IN (SELECT id FROM perfiles WHERE empresa_id = proveedores.empresa_id));

CREATE POLICY "Usuarios pueden ver pedidos_compra de su empresa" ON public.pedidos_compra FOR SELECT USING (empresa_id = auth.uid() OR auth.uid() IN (SELECT id FROM perfiles WHERE empresa_id = pedidos_compra.empresa_id));
CREATE POLICY "Usuarios pueden insertar pedidos_compra de su empresa" ON public.pedidos_compra FOR INSERT WITH CHECK (empresa_id = auth.uid() OR auth.uid() IN (SELECT id FROM perfiles WHERE empresa_id = pedidos_compra.empresa_id));
CREATE POLICY "Usuarios pueden actualizar pedidos_compra de su empresa" ON public.pedidos_compra FOR UPDATE USING (empresa_id = auth.uid() OR auth.uid() IN (SELECT id FROM perfiles WHERE empresa_id = pedidos_compra.empresa_id));

-- Para el detalle de pedidos, derivamos la seguridad a través de su relación con pedido_compra (que ya tiene RLS por empresa_id).
-- Para simplificar, asumiremos que si el usuario tiene acceso al pedido_id, tiene acceso al detalle.
-- Usaremos una función para validar esto si es necesario, pero en Nuxt lo gestionaremos mediante Server Routes seguras.
-- Por seguridad básica de Supabase Client:
CREATE POLICY "Usuarios pueden gestionar detalle_pedidos" ON public.detalle_pedidos FOR ALL USING (
    pedido_id IN (SELECT id FROM public.pedidos_compra WHERE empresa_id = auth.uid() OR auth.uid() IN (SELECT id FROM perfiles WHERE empresa_id = pedidos_compra.empresa_id))
);

-- Triggers de Updated_At
CREATE OR REPLACE FUNCTION update_modified_column()   
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = now();
    RETURN NEW;   
END;
$$ language 'plpgsql';

CREATE TRIGGER update_proveedores_modtime BEFORE UPDATE ON public.proveedores FOR EACH ROW EXECUTE PROCEDURE update_modified_column();
CREATE TRIGGER update_pedidos_compra_modtime BEFORE UPDATE ON public.pedidos_compra FOR EACH ROW EXECUTE PROCEDURE update_modified_column();
