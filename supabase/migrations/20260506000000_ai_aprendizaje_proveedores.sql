-- =====================================================
-- Aprendizaje de IA por Proveedor
-- Almacena cómo traducir descripciones técnicas a nombres limpios
-- =====================================================

CREATE TABLE IF NOT EXISTS public.ai_mapeo_proveedores (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    empresa_id UUID NOT NULL REFERENCES public.empresas(id) ON DELETE CASCADE,
    rut_proveedor TEXT NOT NULL, -- Identificador único del proveedor
    nombre_proveedor TEXT,       -- Nombre legible (ej: Coca Cola Embonor)
    descripcion_factura TEXT NOT NULL, -- El texto técnico (ej: VRE350X24-TC)
    nombre_limpio TEXT NOT NULL,       -- Tu nombre humano (ej: Agua Tónica 350cc)
    unidades_por_caja INTEGER DEFAULT 1,
    id_producto_asociado UUID REFERENCES public.productos(id) ON DELETE SET NULL,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Índice para búsquedas rápidas por proveedor y descripción
CREATE UNIQUE INDEX IF NOT EXISTS idx_ai_mapeo_unique 
    ON public.ai_mapeo_proveedores (empresa_id, rut_proveedor, descripcion_factura);

-- Habilitar RLS
ALTER TABLE public.ai_mapeo_proveedores ENABLE ROW LEVEL SECURITY;

-- Políticas de seguridad
CREATE POLICY "mapeos_select_empresa" ON public.ai_mapeo_proveedores
    FOR SELECT TO authenticated
    USING (empresa_id = (SELECT empresa_id FROM public.perfiles WHERE id = auth.uid()));

CREATE POLICY "mapeos_insert_empresa" ON public.ai_mapeo_proveedores
    FOR INSERT TO authenticated
    WITH CHECK (empresa_id = (SELECT empresa_id FROM public.perfiles WHERE id = auth.uid()));

CREATE POLICY "mapeos_update_empresa" ON public.ai_mapeo_proveedores
    FOR UPDATE TO authenticated
    USING (empresa_id = (SELECT empresa_id FROM public.perfiles WHERE id = auth.uid()))
    WITH CHECK (empresa_id = (SELECT empresa_id FROM public.perfiles WHERE id = auth.uid()));

CREATE POLICY "mapeos_delete_empresa" ON public.ai_mapeo_proveedores
    FOR DELETE TO authenticated
    USING (empresa_id = (SELECT empresa_id FROM public.perfiles WHERE id = auth.uid()));
