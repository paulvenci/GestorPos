-- =====================================================
-- GestorPOS: Migración inicial de base de datos
-- Ejecutar en Supabase SQL Editor
-- =====================================================

-- 1. Tabla de perfiles de usuario (vinculada a auth.users)
CREATE TABLE IF NOT EXISTS public.perfiles (
  id         UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  rol        TEXT NOT NULL DEFAULT 'cajero' CHECK (rol IN ('administrador', 'cajero')),
  nombre     TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Auto-crear perfil cuando se registra un usuario en Auth
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER LANGUAGE plpgsql SECURITY DEFINER AS $$
BEGIN
  INSERT INTO public.perfiles (id, rol)
  VALUES (NEW.id, 'cajero')
  ON CONFLICT (id) DO NOTHING;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- 2. Tabla de productos (catálogo)
CREATE TABLE IF NOT EXISTS public.productos (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  nombre      TEXT NOT NULL,
  sku         TEXT UNIQUE,
  precio      NUMERIC(12, 2) NOT NULL DEFAULT 0,
  costo       NUMERIC(12, 2) DEFAULT 0,
  stock       INTEGER NOT NULL DEFAULT 0 CHECK (stock >= 0),
  categoria   TEXT,
  activo      BOOLEAN DEFAULT TRUE,
  created_at  TIMESTAMPTZ DEFAULT NOW(),
  updated_at  TIMESTAMPTZ DEFAULT NOW()
);

-- 3. Tabla de turnos de caja
CREATE TABLE IF NOT EXISTS public.turnos_caja (
  id                  UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  id_usuario          UUID NOT NULL REFERENCES auth.users(id),
  fecha_apertura      TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  monto_inicial       NUMERIC(12, 2) NOT NULL DEFAULT 0,
  fecha_cierre        TIMESTAMPTZ,
  ventas_registradas  INTEGER DEFAULT 0,
  monto_declarado     NUMERIC(12, 2),
  observaciones       TEXT,
  estado              TEXT NOT NULL DEFAULT 'abierto' CHECK (estado IN ('abierto', 'cerrado')),
  created_at          TIMESTAMPTZ DEFAULT NOW()
);

-- Un usuario solo puede tener un turno abierto a la vez
CREATE UNIQUE INDEX IF NOT EXISTS idx_un_turno_abierto
  ON public.turnos_caja (id_usuario)
  WHERE estado = 'abierto';

-- 4. Tabla de ventas (cabecera)
CREATE TABLE IF NOT EXISTS public.ventas (
  id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  id_turno      UUID NOT NULL REFERENCES public.turnos_caja(id),
  fecha         TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  subtotal      NUMERIC(12, 2) NOT NULL DEFAULT 0,
  impuestos     NUMERIC(12, 2) DEFAULT 0,
  descuentos    NUMERIC(12, 2) DEFAULT 0,
  total         NUMERIC(12, 2) NOT NULL,
  metodo_pago   TEXT NOT NULL DEFAULT 'efectivo' CHECK (metodo_pago IN ('efectivo', 'tarjeta', 'transferencia', 'mixto')),
  created_at    TIMESTAMPTZ DEFAULT NOW()
);

-- 5. Tabla de detalle de ventas (ítems)
CREATE TABLE IF NOT EXISTS public.detalle_ventas (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  id_venta        UUID NOT NULL REFERENCES public.ventas(id) ON DELETE CASCADE,
  id_producto     UUID NOT NULL REFERENCES public.productos(id),
  cantidad        INTEGER NOT NULL CHECK (cantidad > 0),
  precio_unitario NUMERIC(12, 2) NOT NULL,
  subtotal        NUMERIC(12, 2) NOT NULL,
  created_at      TIMESTAMPTZ DEFAULT NOW()
);

-- =====================================================
-- 6. RPC: Registrar venta (transacción atómica)
-- =====================================================
CREATE OR REPLACE FUNCTION public.registrar_venta(
  p_id_turno    UUID,
  p_subtotal    NUMERIC,
  p_impuestos   NUMERIC,
  p_descuentos  NUMERIC,
  p_total       NUMERIC,
  p_metodo_pago TEXT,
  p_items       JSONB  -- Array: [{id_producto, cantidad, precio_unitario, subtotal}]
)
RETURNS UUID LANGUAGE plpgsql SECURITY DEFINER AS $$
DECLARE
  v_venta_id UUID;
  v_item JSONB;
BEGIN
  -- Insertar cabecera de venta
  INSERT INTO public.ventas (id_turno, subtotal, impuestos, descuentos, total, metodo_pago)
  VALUES (p_id_turno, p_subtotal, p_impuestos, p_descuentos, p_total, p_metodo_pago)
  RETURNING id INTO v_venta_id;

  -- Insertar ítems y descontar stock
  FOR v_item IN SELECT * FROM jsonb_array_elements(p_items)
  LOOP
    INSERT INTO public.detalle_ventas (id_venta, id_producto, cantidad, precio_unitario, subtotal)
    VALUES (
      v_venta_id,
      (v_item->>'id_producto')::UUID,
      (v_item->>'cantidad')::INTEGER,
      (v_item->>'precio_unitario')::NUMERIC,
      (v_item->>'subtotal')::NUMERIC
    );

    -- Descontar stock (falla si queda negativo gracias al CHECK constraint)
    UPDATE public.productos
    SET stock = stock - (v_item->>'cantidad')::INTEGER,
        updated_at = NOW()
    WHERE id = (v_item->>'id_producto')::UUID;
  END LOOP;

  -- Actualizar contador de ventas del turno
  UPDATE public.turnos_caja
  SET ventas_registradas = COALESCE(ventas_registradas, 0) + 1
  WHERE id = p_id_turno;

  RETURN v_venta_id;
END;
$$;

-- =====================================================
-- 7. Row Level Security (RLS)
-- =====================================================
ALTER TABLE public.perfiles       ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.productos      ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.turnos_caja    ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.ventas         ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.detalle_ventas ENABLE ROW LEVEL SECURITY;

-- Perfiles: cada usuario ve el suyo
CREATE POLICY "perfiles_own" ON public.perfiles
  FOR ALL USING (auth.uid() = id);

-- Productos: todos los autenticados pueden leer, solo admins escriben
CREATE POLICY "productos_read" ON public.productos
  FOR SELECT USING (auth.role() = 'authenticated');

CREATE POLICY "productos_write_admin" ON public.productos
  FOR ALL USING (
    EXISTS (SELECT 1 FROM public.perfiles WHERE id = auth.uid() AND rol = 'administrador')
  );

-- Turnos: cada cajero ve sus propios turnos; admins ven todos
CREATE POLICY "turnos_cajero" ON public.turnos_caja
  FOR ALL USING (
    id_usuario = auth.uid()
    OR EXISTS (SELECT 1 FROM public.perfiles WHERE id = auth.uid() AND rol = 'administrador')
  );

-- Ventas: sólo a través del turno propio o admins
CREATE POLICY "ventas_via_turno" ON public.ventas
  FOR ALL USING (
    EXISTS (SELECT 1 FROM public.turnos_caja WHERE id = id_turno AND id_usuario = auth.uid())
    OR EXISTS (SELECT 1 FROM public.perfiles WHERE id = auth.uid() AND rol = 'administrador')
  );

-- Detalle de ventas: idem ventas
CREATE POLICY "detalle_via_venta" ON public.detalle_ventas
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM public.ventas v
      JOIN public.turnos_caja t ON t.id = v.id_turno
      WHERE v.id = id_venta AND t.id_usuario = auth.uid()
    )
    OR EXISTS (SELECT 1 FROM public.perfiles WHERE id = auth.uid() AND rol = 'administrador')
  );
