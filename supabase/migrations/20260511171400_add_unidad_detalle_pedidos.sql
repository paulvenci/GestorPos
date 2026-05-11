-- Migración: Añadir campo unidad a detalle_pedidos
ALTER TABLE public.detalle_pedidos ADD COLUMN IF NOT EXISTS unidad TEXT DEFAULT 'Unidades';
