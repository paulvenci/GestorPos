-- Migration: Nuevos Requerimientos
-- 1. Tabla de configuración global (una sola fila para toda la sucursal)
CREATE TABLE IF NOT EXISTS public.configuracion (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    margen_ganancia_defecto NUMERIC DEFAULT 30,
    stock_minimo_defecto INTEGER DEFAULT 5,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Asegurar RLS en la tabla configuracion
ALTER TABLE public.configuracion ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Lectura configuracion autenticados" 
ON public.configuracion FOR SELECT 
TO authenticated USING (true);

CREATE POLICY "Modificación configuracion admin" 
ON public.configuracion FOR UPDATE 
TO authenticated USING (
    EXISTS (
        SELECT 1 FROM perfiles 
        WHERE id = auth.uid() AND rol = 'admin'
    )
);

CREATE POLICY "Inserción configuracion admin" 
ON public.configuracion FOR INSERT 
TO authenticated WITH CHECK (
    EXISTS (
        SELECT 1 FROM perfiles 
        WHERE id = auth.uid() AND rol = 'admin'
    )
);

-- Insertar fila de configuración por defecto si no existe
INSERT INTO public.configuracion (id, margen_ganancia_defecto, stock_minimo_defecto) 
VALUES ('00000000-0000-0000-0000-000000000001', 30, 5)
ON CONFLICT DO NOTHING;


-- 2. Nuevas columnas en productos
ALTER TABLE public.productos 
    ADD COLUMN IF NOT EXISTS es_pesable BOOLEAN DEFAULT false,
    ADD COLUMN IF NOT EXISTS stock_minimo INTEGER DEFAULT 5,
    ADD COLUMN IF NOT EXISTS margen_ganancia NUMERIC;
