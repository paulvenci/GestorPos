-- =============================================
-- SISTEMA DE FIADO / VENTA A CRÉDITO
-- Ejecutar en Supabase SQL Editor
-- =============================================

-- 0. Agregar 'fiado' al constraint de metodo_pago en la tabla ventas
ALTER TABLE public.ventas DROP CONSTRAINT IF EXISTS ventas_metodo_pago_check;
ALTER TABLE public.ventas ADD CONSTRAINT ventas_metodo_pago_check 
  CHECK (metodo_pago IN ('efectivo', 'tarjeta', 'transferencia', 'mixto', 'fiado'));

-- 1. Tabla de Clientes
CREATE TABLE IF NOT EXISTS public.clientes (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  empresa_id uuid REFERENCES public.empresas(id),
  nombre text NOT NULL,
  telefono text,
  rut text,
  email text,
  direccion text,
  saldo_pendiente numeric DEFAULT 0,
  limite_credito numeric DEFAULT NULL,
  activo boolean DEFAULT true,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Índices
CREATE INDEX IF NOT EXISTS idx_clientes_empresa ON public.clientes(empresa_id);
CREATE INDEX IF NOT EXISTS idx_clientes_nombre ON public.clientes(nombre);
CREATE INDEX IF NOT EXISTS idx_clientes_telefono ON public.clientes(telefono);

-- RLS
ALTER TABLE public.clientes ENABLE ROW LEVEL SECURITY;

CREATE POLICY "clientes_select" ON public.clientes FOR SELECT USING (true);
CREATE POLICY "clientes_insert" ON public.clientes FOR INSERT WITH CHECK (true);
CREATE POLICY "clientes_update" ON public.clientes FOR UPDATE USING (true);
CREATE POLICY "clientes_delete" ON public.clientes FOR DELETE USING (true);

-- 2. Tabla de Ventas a Crédito
CREATE TABLE IF NOT EXISTS public.ventas_credito (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  id_venta uuid NOT NULL REFERENCES public.ventas(id),
  id_cliente uuid NOT NULL REFERENCES public.clientes(id),
  monto_total numeric NOT NULL,
  monto_pagado numeric DEFAULT 0,
  estado text NOT NULL DEFAULT 'pendiente' CHECK (estado IN ('pendiente', 'parcial', 'pagado')),
  fecha_vencimiento timestamptz DEFAULT NULL,
  created_at timestamptz DEFAULT now()
);

-- Índices
CREATE INDEX IF NOT EXISTS idx_ventas_credito_cliente ON public.ventas_credito(id_cliente);
CREATE INDEX IF NOT EXISTS idx_ventas_credito_estado ON public.ventas_credito(estado);
CREATE INDEX IF NOT EXISTS idx_ventas_credito_venta ON public.ventas_credito(id_venta);

-- RLS
ALTER TABLE public.ventas_credito ENABLE ROW LEVEL SECURITY;

CREATE POLICY "ventas_credito_select" ON public.ventas_credito FOR SELECT USING (true);
CREATE POLICY "ventas_credito_insert" ON public.ventas_credito FOR INSERT WITH CHECK (true);
CREATE POLICY "ventas_credito_update" ON public.ventas_credito FOR UPDATE USING (true);

-- 3. Tabla de Abonos a Crédito
CREATE TABLE IF NOT EXISTS public.abonos_credito (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  id_venta_credito uuid NOT NULL REFERENCES public.ventas_credito(id),
  id_usuario uuid REFERENCES auth.users(id),
  monto numeric NOT NULL CHECK (monto > 0),
  metodo_pago text NOT NULL DEFAULT 'transferencia',
  observaciones text,
  fecha timestamptz DEFAULT now()
);

-- Índices
CREATE INDEX IF NOT EXISTS idx_abonos_credito_venta ON public.abonos_credito(id_venta_credito);

-- RLS
ALTER TABLE public.abonos_credito ENABLE ROW LEVEL SECURITY;

CREATE POLICY "abonos_credito_select" ON public.abonos_credito FOR SELECT USING (true);
CREATE POLICY "abonos_credito_insert" ON public.abonos_credito FOR INSERT WITH CHECK (true);

-- 4. RPC: Registrar Abono de Crédito (atómico)
CREATE OR REPLACE FUNCTION public.registrar_abono_credito(
  p_id_venta_credito uuid,
  p_monto numeric,
  p_metodo_pago text DEFAULT 'transferencia',
  p_observaciones text DEFAULT NULL,
  p_id_usuario uuid DEFAULT NULL
)
RETURNS json
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_credito RECORD;
  v_nuevo_pagado numeric;
  v_nuevo_estado text;
  v_abono_id uuid;
BEGIN
  -- Obtener el crédito actual
  SELECT * INTO v_credito FROM public.ventas_credito WHERE id = p_id_venta_credito;
  
  IF NOT FOUND THEN
    RAISE EXCEPTION 'Crédito no encontrado';
  END IF;
  
  IF v_credito.estado = 'pagado' THEN
    RAISE EXCEPTION 'Este crédito ya está completamente pagado';
  END IF;
  
  -- Validar monto
  IF p_monto <= 0 THEN
    RAISE EXCEPTION 'El monto debe ser mayor a 0';
  END IF;
  
  -- Calcular nuevo pagado (no puede exceder el total)
  v_nuevo_pagado := LEAST(v_credito.monto_pagado + p_monto, v_credito.monto_total);
  
  -- Determinar nuevo estado
  IF v_nuevo_pagado >= v_credito.monto_total THEN
    v_nuevo_estado := 'pagado';
  ELSE
    v_nuevo_estado := 'parcial';
  END IF;
  
  -- Insertar abono
  INSERT INTO public.abonos_credito (id_venta_credito, id_usuario, monto, metodo_pago, observaciones)
  VALUES (p_id_venta_credito, p_id_usuario, p_monto, p_metodo_pago, p_observaciones)
  RETURNING id INTO v_abono_id;
  
  -- Actualizar ventas_credito
  UPDATE public.ventas_credito
  SET monto_pagado = v_nuevo_pagado,
      estado = v_nuevo_estado
  WHERE id = p_id_venta_credito;
  
  -- Actualizar saldo_pendiente del cliente
  UPDATE public.clientes
  SET saldo_pendiente = GREATEST(0, saldo_pendiente - p_monto),
      updated_at = now()
  WHERE id = v_credito.id_cliente;
  
  RETURN json_build_object(
    'abono_id', v_abono_id,
    'nuevo_pagado', v_nuevo_pagado,
    'nuevo_estado', v_nuevo_estado
  );
END;
$$;

-- 5. RPC: Incrementar saldo pendiente del cliente (atómico)
CREATE OR REPLACE FUNCTION public.incrementar_saldo_cliente(
  p_cliente_id uuid,
  p_monto numeric
)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  UPDATE public.clientes
  SET saldo_pendiente = COALESCE(saldo_pendiente, 0) + p_monto,
      updated_at = now()
  WHERE id = p_cliente_id;
END;
$$;
