-- Actualizar función para validar límite de crédito
CREATE OR REPLACE FUNCTION public.incrementar_saldo_cliente(
  p_cliente_id uuid,
  p_monto numeric
)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_saldo_actual numeric;
  v_limite numeric;
  v_nombre text;
BEGIN
  -- Obtener saldo actual, limite y nombre del cliente
  SELECT saldo_pendiente, limite_credito, nombre 
  INTO v_saldo_actual, v_limite, v_nombre
  FROM public.clientes 
  WHERE id = p_cliente_id;
  
  -- Si tiene limite definido, validar que no se exceda
  IF v_limite IS NOT NULL AND (COALESCE(v_saldo_actual, 0) + p_monto) > v_limite THEN
    RAISE EXCEPTION 'Límite de crédito excedido para el cliente %. Saldo actual: %, Venta: %, Límite: %', 
      v_nombre, COALESCE(v_saldo_actual, 0), p_monto, v_limite;
  END IF;

  UPDATE public.clientes
  SET saldo_pendiente = COALESCE(saldo_pendiente, 0) + p_monto,
      updated_at = now()
  WHERE id = p_cliente_id;
END;
$$;
