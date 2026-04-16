-- ==========================================================
-- MIGRACIÓN: PERMITIR STOCK NEGATIVO
-- ==========================================================
-- Ejecutar en el SQL Editor de Supabase
-- ==========================================================

-- 1. Intentar eliminar por nombre estándar
ALTER TABLE public.productos DROP CONSTRAINT IF EXISTS productos_stock_check;

-- 2. Búsqueda y eliminación dinámica por definición (por si tiene otro nombre)
DO $$
DECLARE
    constraint_name text;
BEGIN
    SELECT conname INTO constraint_name
    FROM pg_constraint
    JOIN pg_class ON pg_constraint.conrelid = pg_class.oid
    WHERE relname = 'productos'
      AND contype = 'c'
      AND pg_get_constraintdef(pg_constraint.oid) LIKE '%stock >= 0%';

    IF constraint_name IS NOT NULL THEN
        EXECUTE 'ALTER TABLE public.productos DROP CONSTRAINT ' || constraint_name;
    END IF;
END $$;
