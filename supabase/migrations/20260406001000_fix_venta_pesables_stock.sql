-- Fix: permitir venta de productos pesables sin descontar stock
-- y registrar cantidad decimal en detalle de ventas.

BEGIN;

-- 1) Permitir decimales en cantidad (ej: 1.250 kg)
ALTER TABLE public.detalle_ventas
  ALTER COLUMN cantidad TYPE NUMERIC(12,3) USING cantidad::NUMERIC(12,3);

ALTER TABLE public.detalle_ventas
  DROP CONSTRAINT IF EXISTS detalle_ventas_cantidad_check;

ALTER TABLE public.detalle_ventas
  ADD CONSTRAINT detalle_ventas_cantidad_check CHECK (cantidad > 0);

-- 2) RPC registrar_venta:
--    - Mantiene cabecera y detalle
--    - NO descuenta stock cuando el producto es pesable
--    - Para no pesables, descuenta unidades enteras
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
BEGIN
  INSERT INTO public.ventas (id_turno, subtotal, impuestos, descuentos, total, metodo_pago, id_usuario)
  VALUES (p_id_turno, p_subtotal, p_impuestos, p_descuentos, p_total, p_metodo_pago, COALESCE(p_id_usuario, auth.uid()))
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

    INSERT INTO public.detalle_ventas (id_venta, id_producto, cantidad, precio_unitario, subtotal)
    VALUES (v_venta_id, v_item.id_producto, v_cantidad, v_item.precio_unitario, v_item.subtotal);

    SELECT COALESCE(p.es_pesable, false)
    INTO v_es_pesable
    FROM public.productos p
    WHERE p.id = v_item.id_producto;

    IF NOT v_es_pesable THEN
      v_cantidad_unidades := GREATEST(1, CEIL(v_cantidad)::INTEGER);

      UPDATE public.productos
      SET stock = stock - v_cantidad_unidades
      WHERE id = v_item.id_producto
        AND stock >= v_cantidad_unidades;

      IF NOT FOUND THEN
        RAISE EXCEPTION 'Stock insuficiente para producto %', v_item.id_producto;
      END IF;
    END IF;
  END LOOP;

  IF p_id_turno IS NOT NULL THEN
    UPDATE public.turnos_caja
    SET ventas_registradas = COALESCE(ventas_registradas, 0) + 1
    WHERE id = p_id_turno;
  END IF;

  RETURN v_venta_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

COMMIT;

