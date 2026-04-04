-- =====================================================
-- GestorPOS: Migración 004
-- Fix constraint de rol + Productos demo
-- Ejecutar en Supabase SQL Editor
-- =====================================================

-- ─── 1. Corregir CHECK constraint de rol en perfiles ──────────
-- El valor original era ('administrador', 'cajero') pero el frontend usa ('admin', 'cajero', 'supervisor')
ALTER TABLE public.perfiles DROP CONSTRAINT IF EXISTS perfiles_rol_check;
ALTER TABLE public.perfiles ADD CONSTRAINT perfiles_rol_check
  CHECK (rol IN ('admin', 'cajero', 'supervisor'));

-- Actualizar los registros existentes que tengan 'administrador' al nuevo valor 'admin'
UPDATE public.perfiles SET rol = 'admin' WHERE rol = 'administrador';

-- ─── 2. Productos de demostración ─────────────────────────────
INSERT INTO public.productos (nombre, sku, precio, costo, stock, categoria, activo) VALUES
  -- Panadería
  ('Pan Marraqueta (unidad)', '7801234000001', 200, 100, 500, 'Panadería', true),
  ('Pan Hallulla (unidad)', '7801234000002', 200, 100, 400, 'Panadería', true),
  ('Pan Integral (unidad)', '7801234000003', 300, 150, 200, 'Panadería', true),
  ('Croissant', '7801234000004', 500, 250, 100, 'Panadería', true),
  ('Pan de Molde Blanco', '7801234000005', 1990, 1200, 50, 'Panadería', true),

  -- Bebidas
  ('Coca-Cola 500ml', '7801234000010', 990, 650, 120, 'Bebidas', true),
  ('Coca-Cola 1.5L', '7801234000011', 1790, 1200, 80, 'Bebidas', true),
  ('Agua Mineral 500ml', '7801234000012', 590, 300, 200, 'Bebidas', true),
  ('Jugo Natural Naranja 1L', '7801234000013', 2490, 1500, 40, 'Bebidas', true),
  ('Bebida Energética 250ml', '7801234000014', 1490, 900, 60, 'Bebidas', true),

  -- Lácteos
  ('Leche Entera 1L', '7801234000020', 1190, 800, 80, 'Lácteos', true),
  ('Yogurt Natural 1L', '7801234000021', 1590, 900, 50, 'Lácteos', true),
  ('Queso Gouda Laminado 200g', '7801234000022', 2990, 1800, 35, 'Lácteos', true),
  ('Mantequilla 250g', '7801234000023', 2490, 1500, 40, 'Lácteos', true),

  -- Snacks
  ('Papas Fritas Clásicas 150g', '7801234000030', 1290, 700, 90, 'Snacks', true),
  ('Galletas de Chocolate 120g', '7801234000031', 890, 450, 100, 'Snacks', true),
  ('Barra de Cereal 30g', '7801234000032', 490, 250, 150, 'Snacks', true),
  ('Maní Salado 100g', '7801234000033', 990, 500, 70, 'Snacks', true),

  -- Abarrotes
  ('Arroz Grado 1 (1kg)', '7801234000040', 1390, 900, 60, 'Abarrotes', true),
  ('Fideos Espagueti 400g', '7801234000041', 790, 400, 80, 'Abarrotes', true),
  ('Aceite Vegetal 1L', '7801234000042', 2190, 1400, 45, 'Abarrotes', true),
  ('Azúcar 1kg', '7801234000043', 990, 600, 55, 'Abarrotes', true),
  ('Sal 1kg', '7801234000044', 490, 250, 100, 'Abarrotes', true),
  ('Café Instantáneo 100g', '7801234000045', 3490, 2200, 30, 'Abarrotes', true),
  ('Té en Bolsitas (20 unidades)', '7801234000046', 1290, 700, 50, 'Abarrotes', true),

  -- Limpieza
  ('Detergente Líquido 1L', '7801234000050', 2990, 1800, 40, 'Limpieza', true),
  ('Papel Higiénico (4 rollos)', '7801234000051', 2490, 1500, 50, 'Limpieza', true),
  ('Jabón Líquido Manos 500ml', '7801234000052', 1990, 1100, 35, 'Limpieza', true),

  -- Varios
  ('Bolsa Reutilizable', '7801234000060', 290, 100, 200, 'Varios', true),
  ('Cargador USB-C', '7801234000061', 5990, 3500, 20, 'Varios', true),
  ('Pilas AA (pack 4)', '7801234000062', 2490, 1400, 30, 'Varios', true)
ON CONFLICT (sku) DO NOTHING;

-- ─── 3. Asegurar que las categorías existan ───────────────────
INSERT INTO public.categorias (nombre, activo) VALUES
  ('Panadería', true),
  ('Bebidas', true),
  ('Lácteos', true),
  ('Snacks', true),
  ('Abarrotes', true),
  ('Limpieza', true),
  ('Varios', true)
ON CONFLICT (nombre) DO NOTHING;
