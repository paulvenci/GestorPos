-- 1. Agregar columnas de desglose de pago
ALTER TABLE "public"."ventas"
  ADD COLUMN "pago_efectivo"      numeric NOT NULL DEFAULT 0,
  ADD COLUMN "pago_tarjeta"       numeric NOT NULL DEFAULT 0,
  ADD COLUMN "pago_transferencia" numeric NOT NULL DEFAULT 0;

-- 2. Actualizar la función RPC para aceptar los nuevos parámetros
CREATE OR REPLACE FUNCTION public.registrar_venta(
  p_id_turno uuid,
  p_id_usuario uuid,
  p_subtotal numeric,
  p_impuestos numeric,
  p_descuentos numeric,
  p_total numeric,
  p_metodo_pago text,
  p_items jsonb,
  p_pago_efectivo numeric DEFAULT 0,
  p_pago_tarjeta numeric DEFAULT 0,
  p_pago_transferencia numeric DEFAULT 0
)
RETURNS uuid
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_empresa_id uuid;
  v_id_venta uuid;
  v_item jsonb;
BEGIN
  -- Obtener empresa del usuario
  SELECT empresa_id INTO v_empresa_id FROM public.perfiles WHERE id = p_id_usuario;

  -- Insertar la venta
  INSERT INTO public.ventas (
    empresa_id, id_turno, id_usuario,
    subtotal, impuestos, descuentos, total,
    metodo_pago, fecha,
    pago_efectivo, pago_tarjeta, pago_transferencia
  )
  VALUES (
    v_empresa_id, p_id_turno, p_id_usuario,
    p_subtotal, p_impuestos, p_descuentos, p_total,
    p_metodo_pago, NOW(),
    p_pago_efectivo, p_pago_tarjeta, p_pago_transferencia
  )
  RETURNING id INTO v_id_venta;

  -- Insertar detalles y descontar stock
  FOR v_item IN SELECT * FROM jsonb_array_elements(p_items)
  LOOP
    INSERT INTO public.detalle_ventas (
      id_venta, id_producto, empresa_id,
      cantidad, precio_unitario, subtotal
    )
    VALUES (
      v_id_venta,
      (v_item->>'id_producto')::uuid,
      v_empresa_id,
      (v_item->>'cantidad')::numeric,
      (v_item->>'precio_unitario')::numeric,
      (v_item->>'subtotal')::numeric
    );

    -- Usar numeric para soportar productos pesables (ej: 0.89 kg)
    UPDATE public.productos
      SET stock = stock - (v_item->>'cantidad')::numeric
      WHERE id = (v_item->>'id_producto')::uuid;
  END LOOP;

  RETURN v_id_venta;
END;
$$;
