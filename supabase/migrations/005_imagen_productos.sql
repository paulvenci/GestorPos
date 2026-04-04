-- =====================================================
-- GestorPOS: Migración 005
-- Agregar imagen_url a productos + bucket de storage
-- Ejecutar en Supabase SQL Editor
-- =====================================================

-- ─── 1. Agregar columna imagen_url a productos ───────
ALTER TABLE public.productos
  ADD COLUMN IF NOT EXISTS imagen_url TEXT;

-- ─── 2. Crear bucket de storage para imágenes ────────
INSERT INTO storage.buckets (id, name, public)
VALUES ('productos', 'productos', true)
ON CONFLICT (id) DO NOTHING;

-- ─── 3. Políticas de storage ─────────────────────────
-- Lectura pública (las imágenes se muestran a todos)
CREATE POLICY "Imagenes productos lectura publica"
  ON storage.objects FOR SELECT
  USING (bucket_id = 'productos');

-- Subida solo para usuarios autenticados
CREATE POLICY "Imagenes productos subida autenticados"
  ON storage.objects FOR INSERT
  TO authenticated
  WITH CHECK (bucket_id = 'productos');

-- Actualización solo para usuarios autenticados
CREATE POLICY "Imagenes productos update autenticados"
  ON storage.objects FOR UPDATE
  TO authenticated
  USING (bucket_id = 'productos');

-- Eliminación solo para usuarios autenticados
CREATE POLICY "Imagenes productos delete autenticados"
  ON storage.objects FOR DELETE
  TO authenticated
  USING (bucket_id = 'productos');
