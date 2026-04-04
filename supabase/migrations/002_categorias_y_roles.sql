-- ══════════════════════════════════════════════════════════════
-- Migración: Tabla de Categorías y actualización de Perfiles
-- ══════════════════════════════════════════════════════════════

-- 1. Tabla de categorías
CREATE TABLE IF NOT EXISTS categorias (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  nombre TEXT NOT NULL UNIQUE,
  descripcion TEXT,
  color TEXT DEFAULT '#6366f1',
  activo BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- 2. Habilitar RLS para categorías
ALTER TABLE categorias ENABLE ROW LEVEL SECURITY;

-- Política: todos los usuarios autenticados pueden leer
CREATE POLICY "Categorias visibles para usuarios autenticados"
  ON categorias FOR SELECT
  TO authenticated
  USING (true);

-- Política: solo admins pueden insertar/actualizar/eliminar
CREATE POLICY "Solo admins pueden gestionar categorías"
  ON categorias FOR ALL
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM perfiles
      WHERE perfiles.id = auth.uid()
      AND perfiles.rol = 'admin'
    )
  );

-- 3. Actualizar perfiles para incluir estado activo
ALTER TABLE perfiles ADD COLUMN IF NOT EXISTS activo BOOLEAN DEFAULT true;

-- 4. Política RLS para perfiles (lectura para autenticados)
CREATE POLICY "Perfiles visibles para usuarios autenticados"
  ON perfiles FOR SELECT
  TO authenticated
  USING (true);

-- Política: solo admins pueden actualizar perfiles
CREATE POLICY "Solo admins pueden actualizar perfiles"
  ON perfiles FOR UPDATE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM perfiles
      WHERE perfiles.id = auth.uid()
      AND perfiles.rol = 'admin'
    )
  );

-- 5. Insertar categorías iniciales comunes
INSERT INTO categorias (nombre, descripcion, color) VALUES
  ('abarrote', 'Productos de abarrote y consumo diario', '#22c55e'),
  ('bebidas', 'Refrescos, jugos y agua', '#3b82f6'),
  ('lácteos', 'Leche, queso, yogurt', '#f59e0b'),
  ('limpieza', 'Productos de limpieza del hogar', '#8b5cf6'),
  ('snacks', 'Botanas y dulces', '#ef4444')
ON CONFLICT (nombre) DO NOTHING;
