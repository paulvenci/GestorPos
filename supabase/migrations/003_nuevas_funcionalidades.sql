-- ══════════════════════════════════════════════════════════════
-- Migración 003: Nuevas funcionalidades GestorPOS
-- ══════════════════════════════════════════════════════════════

-- ─── 1. Tabla de categorías ───────────────────────────────────
CREATE TABLE IF NOT EXISTS categorias (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  nombre TEXT NOT NULL UNIQUE,
  descripcion TEXT,
  color TEXT DEFAULT '#6366f1',
  activo BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT now()
);

ALTER TABLE categorias ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Categorias visibles para usuarios autenticados"
  ON categorias FOR SELECT TO authenticated USING (true);

CREATE POLICY "Solo admins pueden gestionar categorías"
  ON categorias FOR ALL TO authenticated
  USING (
    EXISTS (SELECT 1 FROM perfiles WHERE perfiles.id = auth.uid() AND perfiles.rol = 'admin')
  );

-- Categorías iniciales
INSERT INTO categorias (nombre, descripcion, color) VALUES
  ('abarrote', 'Productos de abarrote y consumo diario', '#22c55e'),
  ('bebidas', 'Refrescos, jugos y agua', '#3b82f6'),
  ('lácteos', 'Leche, queso, yogurt', '#f59e0b'),
  ('limpieza', 'Productos de limpieza del hogar', '#8b5cf6'),
  ('snacks', 'Botanas y dulces', '#ef4444')
ON CONFLICT (nombre) DO NOTHING;

-- ─── 2. Modificar ventas: id_turno nullable + agregar id_usuario ──
ALTER TABLE ventas ALTER COLUMN id_turno DROP NOT NULL;
ALTER TABLE ventas ADD COLUMN IF NOT EXISTS id_usuario UUID REFERENCES auth.users(id);

-- ─── 3. Agregar columna activo a perfiles ─────────────────────
ALTER TABLE perfiles ADD COLUMN IF NOT EXISTS activo BOOLEAN DEFAULT true;

-- ─── 4. Tabla de ajustes de stock ─────────────────────────────
CREATE TABLE IF NOT EXISTS ajustes_stock (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  id_producto UUID NOT NULL REFERENCES productos(id),
  id_usuario UUID NOT NULL REFERENCES auth.users(id),
  tipo TEXT NOT NULL CHECK (tipo IN ('ingreso', 'egreso')),
  cantidad INTEGER NOT NULL CHECK (cantidad > 0),
  motivo TEXT NOT NULL,
  observaciones TEXT,
  stock_anterior INTEGER NOT NULL,
  stock_nuevo INTEGER NOT NULL,
  created_at TIMESTAMPTZ DEFAULT now()
);

ALTER TABLE ajustes_stock ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Ajustes visibles para usuarios autenticados"
  ON ajustes_stock FOR SELECT TO authenticated USING (true);

CREATE POLICY "Usuarios autenticados pueden insertar ajustes"
  ON ajustes_stock FOR INSERT TO authenticated
  WITH CHECK (id_usuario = auth.uid());

-- ─── 5. Políticas de perfiles ─────────────────────────────────
-- Verificar si ya existen antes de crear
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE tablename = 'perfiles' AND policyname = 'Perfiles visibles para usuarios autenticados'
  ) THEN
    CREATE POLICY "Perfiles visibles para usuarios autenticados"
      ON perfiles FOR SELECT TO authenticated USING (true);
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE tablename = 'perfiles' AND policyname = 'Solo admins pueden actualizar perfiles'
  ) THEN
    CREATE POLICY "Solo admins pueden actualizar perfiles"
      ON perfiles FOR UPDATE TO authenticated
      USING (
        EXISTS (SELECT 1 FROM perfiles p WHERE p.id = auth.uid() AND p.rol = 'admin')
      );
  END IF;
END $$;

-- ─── 6. Actualizar RPC registrar_venta para aceptar turno nullable y usuario ──
CREATE OR REPLACE FUNCTION registrar_venta(
  p_id_turno UUID DEFAULT NULL,
  p_id_usuario UUID DEFAULT NULL,
  p_subtotal NUMERIC DEFAULT 0,
  p_impuestos NUMERIC DEFAULT 0,
  p_descuentos NUMERIC DEFAULT 0,
  p_total NUMERIC DEFAULT 0,
  p_metodo_pago TEXT DEFAULT 'efectivo',
  p_items JSONB DEFAULT '[]'
) RETURNS UUID AS $$
DECLARE
  v_venta_id UUID;
  v_item RECORD;
BEGIN
  -- Insertar la venta (id_turno puede ser null para ventas fuera de turno)
  INSERT INTO ventas (id_turno, subtotal, impuestos, descuentos, total, metodo_pago, id_usuario)
  VALUES (p_id_turno, p_subtotal, p_impuestos, p_descuentos, p_total, p_metodo_pago, COALESCE(p_id_usuario, auth.uid()))
  RETURNING id INTO v_venta_id;

  -- Insertar detalles
  FOR v_item IN SELECT * FROM jsonb_to_recordset(p_items) AS x(
    id_producto UUID, cantidad INT, precio_unitario NUMERIC, subtotal NUMERIC
  ) LOOP
    INSERT INTO detalle_ventas (id_venta, id_producto, cantidad, precio_unitario, subtotal)
    VALUES (v_venta_id, v_item.id_producto, v_item.cantidad, v_item.precio_unitario, v_item.subtotal);

    -- Descontar stock
    UPDATE productos SET stock = stock - v_item.cantidad WHERE id = v_item.id_producto;
  END LOOP;

  -- Actualizar contador de ventas del turno (si tiene turno)
  IF p_id_turno IS NOT NULL THEN
    UPDATE turnos_caja
    SET ventas_registradas = COALESCE(ventas_registradas, 0) + 1
    WHERE id = p_id_turno;
  END IF;

  RETURN v_venta_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
