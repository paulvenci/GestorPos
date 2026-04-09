BEGIN;

-- =====================================================
-- Multi-tenant base: empresas + empresa_id + RLS por empresa
-- Opcion A: Shared DB + RLS
-- =====================================================

CREATE TABLE IF NOT EXISTS public.empresas (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  nombre TEXT NOT NULL,
  plan TEXT NOT NULL DEFAULT 'basico' CHECK (plan IN ('basico', 'pro')),
  activo BOOLEAN NOT NULL DEFAULT true,
  fecha_vencimiento TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.empresas ENABLE ROW LEVEL SECURITY;

DO $$
DECLARE
  v_empresa_id UUID;
BEGIN
  SELECT id
  INTO v_empresa_id
  FROM public.empresas
  ORDER BY created_at
  LIMIT 1;

  IF v_empresa_id IS NULL THEN
    INSERT INTO public.empresas (nombre, plan, activo)
    VALUES ('Empresa principal', 'pro', true)
    RETURNING id INTO v_empresa_id;
  END IF;

  ALTER TABLE public.perfiles ADD COLUMN IF NOT EXISTS empresa_id UUID;
  ALTER TABLE public.productos ADD COLUMN IF NOT EXISTS empresa_id UUID;
  ALTER TABLE public.turnos_caja ADD COLUMN IF NOT EXISTS empresa_id UUID;
  ALTER TABLE public.ventas ADD COLUMN IF NOT EXISTS empresa_id UUID;
  ALTER TABLE public.detalle_ventas ADD COLUMN IF NOT EXISTS empresa_id UUID;
  ALTER TABLE public.categorias ADD COLUMN IF NOT EXISTS empresa_id UUID;
  ALTER TABLE public.ajustes_stock ADD COLUMN IF NOT EXISTS empresa_id UUID;
  ALTER TABLE public.configuracion ADD COLUMN IF NOT EXISTS empresa_id UUID;

  UPDATE public.perfiles
  SET empresa_id = COALESCE(empresa_id, v_empresa_id)
  WHERE empresa_id IS NULL;

  UPDATE public.productos
  SET empresa_id = COALESCE(empresa_id, v_empresa_id)
  WHERE empresa_id IS NULL;

  UPDATE public.turnos_caja
  SET empresa_id = COALESCE(empresa_id, v_empresa_id)
  WHERE empresa_id IS NULL;

  UPDATE public.ventas v
  SET empresa_id = COALESCE(v.empresa_id, t.empresa_id, v_empresa_id)
  FROM public.turnos_caja t
  WHERE v.id_turno = t.id
    AND v.empresa_id IS NULL;

  UPDATE public.ventas
  SET empresa_id = COALESCE(empresa_id, v_empresa_id)
  WHERE empresa_id IS NULL;

  UPDATE public.detalle_ventas d
  SET empresa_id = COALESCE(
    d.empresa_id,
    v.empresa_id,
    (
      SELECT p.empresa_id
      FROM public.productos p
      WHERE p.id = d.id_producto
      LIMIT 1
    ),
    v_empresa_id
  )
  FROM public.ventas v
  WHERE d.id_venta = v.id
    AND d.empresa_id IS NULL;

  UPDATE public.detalle_ventas
  SET empresa_id = COALESCE(empresa_id, v_empresa_id)
  WHERE empresa_id IS NULL;

  UPDATE public.categorias
  SET empresa_id = COALESCE(empresa_id, v_empresa_id)
  WHERE empresa_id IS NULL;

  UPDATE public.ajustes_stock a
  SET empresa_id = COALESCE(a.empresa_id, p.empresa_id, v_empresa_id)
  FROM public.productos p
  WHERE a.id_producto = p.id
    AND a.empresa_id IS NULL;

  UPDATE public.ajustes_stock
  SET empresa_id = COALESCE(empresa_id, v_empresa_id)
  WHERE empresa_id IS NULL;

  UPDATE public.configuracion
  SET empresa_id = COALESCE(empresa_id, v_empresa_id)
  WHERE empresa_id IS NULL;
END $$;

ALTER TABLE public.perfiles
  ADD CONSTRAINT perfiles_empresa_id_fkey
  FOREIGN KEY (empresa_id) REFERENCES public.empresas(id) ON DELETE RESTRICT;
ALTER TABLE public.productos
  ADD CONSTRAINT productos_empresa_id_fkey
  FOREIGN KEY (empresa_id) REFERENCES public.empresas(id) ON DELETE RESTRICT;
ALTER TABLE public.turnos_caja
  ADD CONSTRAINT turnos_caja_empresa_id_fkey
  FOREIGN KEY (empresa_id) REFERENCES public.empresas(id) ON DELETE RESTRICT;
ALTER TABLE public.ventas
  ADD CONSTRAINT ventas_empresa_id_fkey
  FOREIGN KEY (empresa_id) REFERENCES public.empresas(id) ON DELETE RESTRICT;
ALTER TABLE public.detalle_ventas
  ADD CONSTRAINT detalle_ventas_empresa_id_fkey
  FOREIGN KEY (empresa_id) REFERENCES public.empresas(id) ON DELETE RESTRICT;
ALTER TABLE public.categorias
  ADD CONSTRAINT categorias_empresa_id_fkey
  FOREIGN KEY (empresa_id) REFERENCES public.empresas(id) ON DELETE RESTRICT;
ALTER TABLE public.ajustes_stock
  ADD CONSTRAINT ajustes_stock_empresa_id_fkey
  FOREIGN KEY (empresa_id) REFERENCES public.empresas(id) ON DELETE RESTRICT;
ALTER TABLE public.configuracion
  ADD CONSTRAINT configuracion_empresa_id_fkey
  FOREIGN KEY (empresa_id) REFERENCES public.empresas(id) ON DELETE RESTRICT;

ALTER TABLE public.perfiles ALTER COLUMN empresa_id SET NOT NULL;
ALTER TABLE public.productos ALTER COLUMN empresa_id SET NOT NULL;
ALTER TABLE public.turnos_caja ALTER COLUMN empresa_id SET NOT NULL;
ALTER TABLE public.ventas ALTER COLUMN empresa_id SET NOT NULL;
ALTER TABLE public.detalle_ventas ALTER COLUMN empresa_id SET NOT NULL;
ALTER TABLE public.categorias ALTER COLUMN empresa_id SET NOT NULL;
ALTER TABLE public.ajustes_stock ALTER COLUMN empresa_id SET NOT NULL;
ALTER TABLE public.configuracion ALTER COLUMN empresa_id SET NOT NULL;

DROP INDEX IF EXISTS idx_categorias_nombre_unique;
ALTER TABLE public.categorias DROP CONSTRAINT IF EXISTS categorias_nombre_key;
CREATE UNIQUE INDEX IF NOT EXISTS idx_categorias_empresa_nombre_unique
  ON public.categorias (empresa_id, lower(nombre));

ALTER TABLE public.productos DROP CONSTRAINT IF EXISTS productos_sku_key;
CREATE UNIQUE INDEX IF NOT EXISTS idx_productos_empresa_sku_unique
  ON public.productos (empresa_id, sku)
  WHERE sku IS NOT NULL;

CREATE UNIQUE INDEX IF NOT EXISTS idx_configuracion_empresa_unique
  ON public.configuracion (empresa_id);

CREATE INDEX IF NOT EXISTS idx_productos_empresa_id ON public.productos (empresa_id);
CREATE INDEX IF NOT EXISTS idx_turnos_caja_empresa_id ON public.turnos_caja (empresa_id);
CREATE INDEX IF NOT EXISTS idx_ventas_empresa_id ON public.ventas (empresa_id);
CREATE INDEX IF NOT EXISTS idx_detalle_ventas_empresa_id ON public.detalle_ventas (empresa_id);
CREATE INDEX IF NOT EXISTS idx_categorias_empresa_id ON public.categorias (empresa_id);
CREATE INDEX IF NOT EXISTS idx_ajustes_stock_empresa_id ON public.ajustes_stock (empresa_id);
CREATE INDEX IF NOT EXISTS idx_perfiles_empresa_id ON public.perfiles (empresa_id);

CREATE OR REPLACE FUNCTION public.current_empresa_id()
RETURNS UUID
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT empresa_id
  FROM public.perfiles
  WHERE id = auth.uid()
  LIMIT 1
$$;

CREATE OR REPLACE FUNCTION public.current_user_role()
RETURNS TEXT
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT rol
  FROM public.perfiles
  WHERE id = auth.uid()
  LIMIT 1
$$;

CREATE OR REPLACE FUNCTION public.is_company_admin()
RETURNS BOOLEAN
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT COALESCE(public.current_user_role() IN ('admin', 'supervisor'), false)
$$;

CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_empresa_id UUID;
  v_nombre TEXT;
  v_rol TEXT;
  v_activo BOOLEAN;
BEGIN
  v_empresa_id := NULLIF(NEW.raw_user_meta_data ->> 'empresa_id', '')::UUID;
  v_nombre := NULLIF(NEW.raw_user_meta_data ->> 'nombre', '');
  v_rol := COALESCE(NULLIF(NEW.raw_user_meta_data ->> 'rol', ''), 'cajero');
  v_activo := COALESCE((NEW.raw_user_meta_data ->> 'activo')::BOOLEAN, true);

  INSERT INTO public.perfiles (id, rol, nombre, activo, empresa_id)
  VALUES (NEW.id, v_rol, v_nombre, v_activo, v_empresa_id)
  ON CONFLICT (id) DO UPDATE
    SET rol = EXCLUDED.rol,
        nombre = COALESCE(EXCLUDED.nombre, public.perfiles.nombre),
        activo = EXCLUDED.activo,
        empresa_id = COALESCE(EXCLUDED.empresa_id, public.perfiles.empresa_id);

  RETURN NEW;
END;
$$;

ALTER TABLE public.productos ALTER COLUMN empresa_id SET DEFAULT public.current_empresa_id();
ALTER TABLE public.turnos_caja ALTER COLUMN empresa_id SET DEFAULT public.current_empresa_id();
ALTER TABLE public.ventas ALTER COLUMN empresa_id SET DEFAULT public.current_empresa_id();
ALTER TABLE public.detalle_ventas ALTER COLUMN empresa_id SET DEFAULT public.current_empresa_id();
ALTER TABLE public.categorias ALTER COLUMN empresa_id SET DEFAULT public.current_empresa_id();
ALTER TABLE public.ajustes_stock ALTER COLUMN empresa_id SET DEFAULT public.current_empresa_id();
ALTER TABLE public.configuracion ALTER COLUMN empresa_id SET DEFAULT public.current_empresa_id();

DROP POLICY IF EXISTS "Perfiles visibles para usuarios autenticados" ON public.perfiles;
DROP POLICY IF EXISTS "Solo admins pueden actualizar perfiles" ON public.perfiles;
DROP POLICY IF EXISTS "perfiles_own" ON public.perfiles;
CREATE POLICY "perfiles_select_empresa" ON public.perfiles
  FOR SELECT TO authenticated
  USING (empresa_id = public.current_empresa_id());
CREATE POLICY "perfiles_update_empresa_admin" ON public.perfiles
  FOR UPDATE TO authenticated
  USING (
    empresa_id = public.current_empresa_id()
    AND public.is_company_admin()
  )
  WITH CHECK (empresa_id = public.current_empresa_id());

DROP POLICY IF EXISTS "productos_read" ON public.productos;
DROP POLICY IF EXISTS "productos_write_admin" ON public.productos;
CREATE POLICY "productos_select_empresa" ON public.productos
  FOR SELECT TO authenticated
  USING (empresa_id = public.current_empresa_id());
CREATE POLICY "productos_write_empresa_admin" ON public.productos
  FOR ALL TO authenticated
  USING (
    empresa_id = public.current_empresa_id()
    AND public.is_company_admin()
  )
  WITH CHECK (
    empresa_id = public.current_empresa_id()
    AND public.is_company_admin()
  );

DROP POLICY IF EXISTS "turnos_cajero" ON public.turnos_caja;
CREATE POLICY "turnos_select_empresa" ON public.turnos_caja
  FOR SELECT TO authenticated
  USING (empresa_id = public.current_empresa_id());
CREATE POLICY "turnos_insert_empresa" ON public.turnos_caja
  FOR INSERT TO authenticated
  WITH CHECK (
    empresa_id = public.current_empresa_id()
    AND id_usuario = auth.uid()
  );
CREATE POLICY "turnos_update_empresa" ON public.turnos_caja
  FOR UPDATE TO authenticated
  USING (
    empresa_id = public.current_empresa_id()
    AND (id_usuario = auth.uid() OR public.is_company_admin())
  )
  WITH CHECK (empresa_id = public.current_empresa_id());

DROP POLICY IF EXISTS "ventas_via_turno" ON public.ventas;
CREATE POLICY "ventas_select_empresa" ON public.ventas
  FOR SELECT TO authenticated
  USING (empresa_id = public.current_empresa_id());

DROP POLICY IF EXISTS "detalle_via_venta" ON public.detalle_ventas;
CREATE POLICY "detalle_ventas_select_empresa" ON public.detalle_ventas
  FOR SELECT TO authenticated
  USING (empresa_id = public.current_empresa_id());

DROP POLICY IF EXISTS "Categorias visibles para usuarios autenticados" ON public.categorias;
DROP POLICY IF EXISTS "Solo admins pueden gestionar categorías" ON public.categorias;
DROP POLICY IF EXISTS "Solo admins pueden gestionar categorÃ­as" ON public.categorias;
CREATE POLICY "categorias_select_empresa" ON public.categorias
  FOR SELECT TO authenticated
  USING (empresa_id = public.current_empresa_id());
CREATE POLICY "categorias_write_empresa_admin" ON public.categorias
  FOR ALL TO authenticated
  USING (
    empresa_id = public.current_empresa_id()
    AND public.is_company_admin()
  )
  WITH CHECK (
    empresa_id = public.current_empresa_id()
    AND public.is_company_admin()
  );

DROP POLICY IF EXISTS "Ajustes visibles para usuarios autenticados" ON public.ajustes_stock;
DROP POLICY IF EXISTS "Usuarios autenticados pueden insertar ajustes" ON public.ajustes_stock;
CREATE POLICY "ajustes_stock_select_empresa" ON public.ajustes_stock
  FOR SELECT TO authenticated
  USING (empresa_id = public.current_empresa_id());
CREATE POLICY "ajustes_stock_insert_empresa" ON public.ajustes_stock
  FOR INSERT TO authenticated
  WITH CHECK (
    empresa_id = public.current_empresa_id()
    AND id_usuario = auth.uid()
  );

DROP POLICY IF EXISTS "Lectura configuracion autenticados" ON public.configuracion;
DROP POLICY IF EXISTS "Modificación configuracion admin" ON public.configuracion;
DROP POLICY IF EXISTS "ModificaciÃ³n configuracion admin" ON public.configuracion;
DROP POLICY IF EXISTS "Inserción configuracion admin" ON public.configuracion;
DROP POLICY IF EXISTS "InserciÃ³n configuracion admin" ON public.configuracion;
CREATE POLICY "configuracion_select_empresa" ON public.configuracion
  FOR SELECT TO authenticated
  USING (empresa_id = public.current_empresa_id());
CREATE POLICY "configuracion_write_empresa_admin" ON public.configuracion
  FOR ALL TO authenticated
  USING (
    empresa_id = public.current_empresa_id()
    AND public.is_company_admin()
  )
  WITH CHECK (
    empresa_id = public.current_empresa_id()
    AND public.is_company_admin()
  );

CREATE POLICY "empresas_select_own" ON public.empresas
  FOR SELECT TO authenticated
  USING (id = public.current_empresa_id());

CREATE OR REPLACE FUNCTION public.registrar_venta(
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
  v_es_pesable BOOLEAN;
  v_cantidad NUMERIC(12,3);
  v_cantidad_unidades INTEGER;
  v_empresa_id UUID;
BEGIN
  v_empresa_id := public.current_empresa_id();

  IF v_empresa_id IS NULL THEN
    RAISE EXCEPTION 'Usuario sin empresa asignada';
  END IF;

  IF p_id_turno IS NOT NULL THEN
    PERFORM 1
    FROM public.turnos_caja
    WHERE id = p_id_turno
      AND empresa_id = v_empresa_id;

    IF NOT FOUND THEN
      RAISE EXCEPTION 'Turno no pertenece a la empresa actual';
    END IF;
  END IF;

  INSERT INTO public.ventas (
    empresa_id,
    id_turno,
    subtotal,
    impuestos,
    descuentos,
    total,
    metodo_pago,
    id_usuario
  )
  VALUES (
    v_empresa_id,
    p_id_turno,
    p_subtotal,
    p_impuestos,
    p_descuentos,
    p_total,
    p_metodo_pago,
    COALESCE(p_id_usuario, auth.uid())
  )
  RETURNING id INTO v_venta_id;

  FOR v_item IN
    SELECT * FROM jsonb_to_recordset(p_items) AS x(
      id_producto UUID,
      cantidad NUMERIC,
      precio_unitario NUMERIC,
      subtotal NUMERIC
    )
  LOOP
    v_cantidad := GREATEST(COALESCE(v_item.cantidad, 0), 0.001);

    INSERT INTO public.detalle_ventas (
      empresa_id,
      id_venta,
      id_producto,
      cantidad,
      precio_unitario,
      subtotal
    )
    VALUES (
      v_empresa_id,
      v_venta_id,
      v_item.id_producto,
      v_cantidad,
      v_item.precio_unitario,
      v_item.subtotal
    );

    SELECT COALESCE(p.es_pesable, false)
    INTO v_es_pesable
    FROM public.productos p
    WHERE p.id = v_item.id_producto
      AND p.empresa_id = v_empresa_id;

    IF NOT FOUND THEN
      RAISE EXCEPTION 'Producto no pertenece a la empresa actual';
    END IF;

    IF NOT v_es_pesable THEN
      v_cantidad_unidades := GREATEST(1, CEIL(v_cantidad)::INTEGER);

      UPDATE public.productos
      SET stock = stock - v_cantidad_unidades
      WHERE id = v_item.id_producto
        AND empresa_id = v_empresa_id
        AND stock >= v_cantidad_unidades;

      IF NOT FOUND THEN
        RAISE EXCEPTION 'Stock insuficiente para producto %', v_item.id_producto;
      END IF;
    END IF;
  END LOOP;

  IF p_id_turno IS NOT NULL THEN
    UPDATE public.turnos_caja
    SET ventas_registradas = COALESCE(ventas_registradas, 0) + 1
    WHERE id = p_id_turno
      AND empresa_id = v_empresa_id;
  END IF;

  RETURN v_venta_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

CREATE OR REPLACE FUNCTION public.get_top_productos(dias_historial integer DEFAULT 30)
RETURNS TABLE (
  producto_id UUID,
  nombre TEXT,
  total_cantidad BIGINT,
  total_ingreso NUMERIC
) LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE
  v_empresa_id UUID;
BEGIN
  v_empresa_id := public.current_empresa_id();

  RETURN QUERY
  SELECT 
    p.id AS producto_id,
    p.nombre,
    SUM(d.cantidad)::BIGINT AS total_cantidad,
    SUM(d.subtotal)::NUMERIC AS total_ingreso
  FROM public.detalle_ventas d
  JOIN public.ventas v ON v.id = d.id_venta
  JOIN public.productos p ON p.id = d.id_producto
  WHERE v.empresa_id = v_empresa_id
    AND d.empresa_id = v_empresa_id
    AND p.empresa_id = v_empresa_id
    AND v.fecha >= (NOW() - (dias_historial || ' days')::interval)
  GROUP BY p.id, p.nombre
  ORDER BY total_cantidad DESC
  LIMIT 10;
END;
$$;

CREATE OR REPLACE FUNCTION public.get_productos_sin_rotacion(dias_historial integer DEFAULT 30)
RETURNS TABLE (
  producto_id UUID,
  nombre TEXT,
  stock INTEGER,
  precio NUMERIC
) LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE
  v_empresa_id UUID;
BEGIN
  v_empresa_id := public.current_empresa_id();

  RETURN QUERY
  SELECT 
    p.id AS producto_id,
    p.nombre,
    p.stock,
    p.precio
  FROM public.productos p
  WHERE p.empresa_id = v_empresa_id
    AND p.stock > 0
    AND p.activo = true
    AND NOT EXISTS (
      SELECT 1
      FROM public.detalle_ventas d
      JOIN public.ventas v ON v.id = d.id_venta
      WHERE d.id_producto = p.id
        AND d.empresa_id = v_empresa_id
        AND v.empresa_id = v_empresa_id
        AND v.fecha >= (NOW() - (dias_historial || ' days')::interval)
    )
  ORDER BY p.stock DESC;
END;
$$;

CREATE OR REPLACE FUNCTION public.get_rentabilidad(dias_historial integer DEFAULT 30)
RETURNS TABLE (
  total_ventas NUMERIC,
  total_costos NUMERIC,
  utilidad_bruta NUMERIC,
  margen_porcentaje NUMERIC
) LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE
  v_empresa_id UUID;
BEGIN
  v_empresa_id := public.current_empresa_id();

  RETURN QUERY
  WITH calculos AS (
    SELECT 
      SUM(d.subtotal)::NUMERIC AS ventas,
      SUM(d.cantidad * COALESCE(p.costo, 0))::NUMERIC AS costos
    FROM public.detalle_ventas d
    JOIN public.ventas v ON v.id = d.id_venta
    JOIN public.productos p ON p.id = d.id_producto
    WHERE d.empresa_id = v_empresa_id
      AND v.empresa_id = v_empresa_id
      AND p.empresa_id = v_empresa_id
      AND v.fecha >= (NOW() - (dias_historial || ' days')::interval)
  )
  SELECT 
    COALESCE(c.ventas, 0) AS total_ventas,
    COALESCE(c.costos, 0) AS total_costos,
    COALESCE(c.ventas - c.costos, 0) AS utilidad_bruta,
    CASE
      WHEN c.ventas > 0 THEN ROUND(((c.ventas - c.costos) / c.ventas) * 100, 2)
      ELSE 0
    END AS margen_porcentaje
  FROM calculos c;
END;
$$;

COMMIT;
