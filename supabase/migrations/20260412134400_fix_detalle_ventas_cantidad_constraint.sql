-- Fix: eliminar TODAS las constraints CHECK sobre la columna "cantidad"
-- en detalle_ventas y recrear solo la correcta (permite decimales > 0).

BEGIN;

-- 1) Eliminar TODAS las constraints check que afectan "cantidad"
--    (incluye constraints autogeneradas por PostgreSQL con nombres como
--     detalle_ventas_cantidad_check, detalle_ventas_cantidad_check1, etc.)
DO $$
DECLARE
  r RECORD;
BEGIN
  FOR r IN
    SELECT con.conname
    FROM pg_constraint con
    JOIN pg_class rel ON rel.oid = con.conrelid
    JOIN pg_namespace nsp ON nsp.oid = rel.relnamespace
    WHERE rel.relname = 'detalle_ventas'
      AND nsp.nspname = 'public'
      AND con.contype = 'c'  -- check constraint
      AND pg_get_constraintdef(con.oid) ILIKE '%cantidad%'
  LOOP
    EXECUTE format(
      'ALTER TABLE public.detalle_ventas DROP CONSTRAINT IF EXISTS %I',
      r.conname
    );
    RAISE NOTICE 'Eliminada constraint: %', r.conname;
  END LOOP;
END $$;

-- 2) Asegurar el tipo de la columna sea NUMERIC para decimales (productos pesables)
ALTER TABLE public.detalle_ventas
  ALTER COLUMN cantidad TYPE NUMERIC(12,3) USING cantidad::NUMERIC(12,3);

-- 3) Recrear la constraint correcta (cantidad > 0, permite decimales)
ALTER TABLE public.detalle_ventas
  ADD CONSTRAINT detalle_ventas_cantidad_check CHECK (cantidad > 0);

COMMIT;
