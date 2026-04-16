-- ==========================================================
-- MIGRACIÓN: AUDITORÍA DE EGRESOS DE STOCK
-- ==========================================================
-- Ejecutar en el SQL Editor de Supabase
-- ==========================================================

-- 1. Agregar columnas de auditoría a ajustes_stock
ALTER TABLE IF EXISTS public.ajustes_stock
  ADD COLUMN IF NOT EXISTS revisado_por_admin BOOLEAN DEFAULT FALSE,
  ADD COLUMN IF NOT EXISTS revisado_at TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS revisado_por UUID REFERENCES public.perfiles(id);

-- 2. Asegurar que todos puedan ver (SELECT) e insertar (INSERT)
-- (Ya existen políticas básicas, pero las reforzamos para multi-tenant si fuera necesario)

DROP POLICY IF EXISTS "Admins pueden actualizar estado de revisión" ON public.ajustes_stock;
CREATE POLICY "Admins pueden actualizar estado de revisión"
  ON public.ajustes_stock
  FOR UPDATE
  TO authenticated
  USING (
    EXISTS (SELECT 1 FROM perfiles WHERE perfiles.id = auth.uid() AND perfiles.rol = 'admin')
  )
  WITH CHECK (
    EXISTS (SELECT 1 FROM perfiles WHERE perfiles.id = auth.uid() AND perfiles.rol = 'admin')
  );

-- 3. Índice para acelerar la búsqueda de pendientes
CREATE INDEX IF NOT EXISTS idx_ajustes_no_revisados 
  ON public.ajustes_stock (empresa_id, revisado_por_admin) 
  WHERE revisado_por_admin = FALSE;
