-- =====================================================
-- FIX: Añadir empresa_id a tablas de créditos para multi-tenancy
-- =====================================================

BEGIN;

-- 1. Añadir columnas de empresa_id
ALTER TABLE public.ventas_credito ADD COLUMN IF NOT EXISTS empresa_id UUID;
ALTER TABLE public.abonos_credito ADD COLUMN IF NOT EXISTS empresa_id UUID;

-- 2. Asignar empresa_id a registros existentes (si los hay)
-- Intentamos obtener el empresa_id del cliente para ventas_credito
UPDATE public.ventas_credito vc
SET empresa_id = c.empresa_id
FROM public.clientes c
WHERE vc.id_cliente = c.id
  AND vc.empresa_id IS NULL;

-- Intentamos obtener el empresa_id de la venta_credito para abonos_credito
UPDATE public.abonos_credito ac
SET empresa_id = vc.empresa_id
FROM public.ventas_credito vc
WHERE ac.id_venta_credito = vc.id
  AND ac.empresa_id IS NULL;

-- 3. Configurar FK y NOT NULL (después de migrar datos)
ALTER TABLE public.ventas_credito 
  ADD CONSTRAINT ventas_credito_empresa_id_fkey 
  FOREIGN KEY (empresa_id) REFERENCES public.empresas(id) ON DELETE RESTRICT;

ALTER TABLE public.abonos_credito 
  ADD CONSTRAINT abonos_credito_empresa_id_fkey 
  FOREIGN KEY (empresa_id) REFERENCES public.empresas(id) ON DELETE RESTRICT;

-- Set default values for future inserts
ALTER TABLE public.ventas_credito ALTER COLUMN empresa_id SET DEFAULT public.current_empresa_id();
ALTER TABLE public.abonos_credito ALTER COLUMN empresa_id SET DEFAULT public.current_empresa_id();

-- 4. Crear Índices
CREATE INDEX IF NOT EXISTS idx_ventas_credito_empresa_id ON public.ventas_credito(empresa_id);
CREATE INDEX IF NOT EXISTS idx_abonos_credito_empresa_id ON public.abonos_credito(empresa_id);

-- 5. Actualizar Políticas RLS para ventas_credito
DROP POLICY IF EXISTS "ventas_credito_select" ON public.ventas_credito;
DROP POLICY IF EXISTS "ventas_credito_insert" ON public.ventas_credito;
DROP POLICY IF EXISTS "ventas_credito_update" ON public.ventas_credito;

CREATE POLICY "ventas_credito_select_empresa" ON public.ventas_credito
  FOR SELECT TO authenticated
  USING (empresa_id = public.current_empresa_id());

CREATE POLICY "ventas_credito_insert_empresa" ON public.ventas_credito
  FOR INSERT TO authenticated
  WITH CHECK (empresa_id = public.current_empresa_id());

CREATE POLICY "ventas_credito_update_empresa" ON public.ventas_credito
  FOR UPDATE TO authenticated
  USING (empresa_id = public.current_empresa_id())
  WITH CHECK (empresa_id = public.current_empresa_id());

-- 6. Actualizar Políticas RLS para abonos_credito
DROP POLICY IF EXISTS "abonos_credito_select" ON public.abonos_credito;
DROP POLICY IF EXISTS "abonos_credito_insert" ON public.abonos_credito;

CREATE POLICY "abonos_credito_select_empresa" ON public.abonos_credito
  FOR SELECT TO authenticated
  USING (empresa_id = public.current_empresa_id());

CREATE POLICY "abonos_credito_insert_empresa" ON public.abonos_credito
  FOR INSERT TO authenticated
  WITH CHECK (empresa_id = public.current_empresa_id());

COMMIT;
