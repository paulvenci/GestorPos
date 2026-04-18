-- 2. Productos Sin Rotación (Stock Muerto)
CREATE OR REPLACE FUNCTION get_productos_sin_rotacion(dias_historial integer DEFAULT 30)
RETURNS TABLE (
  producto_id UUID,
  nombre TEXT,
  stock INTEGER,
  precio NUMERIC
) LANGUAGE plpgsql SECURITY DEFINER AS $$
BEGIN
  RETURN QUERY
  SELECT 
    p.id AS producto_id,
    p.nombre,
    p.stock::INTEGER,
    p.precio
  FROM public.productos p
  WHERE p.stock > 0 
  AND p.activo = true
  AND (p.empresa_id = public.current_empresa_id() OR public.current_empresa_id() IS NULL)
  AND NOT EXISTS (
    SELECT 1 
    FROM public.detalle_ventas d
    JOIN public.ventas v ON v.id = d.id_venta
    WHERE d.id_producto = p.id
    AND v.fecha >= (NOW() - (dias_historial || ' days')::interval)
  )
  ORDER BY p.stock DESC;
END;
$$;

-- 3. Análisis de Rentabilidad (Margen Bruto)
CREATE OR REPLACE FUNCTION get_rentabilidad(dias_historial integer DEFAULT 30)
RETURNS TABLE (
  total_ventas NUMERIC,
  total_costos NUMERIC,
  utilidad_bruta NUMERIC,
  margen_porcentaje NUMERIC
) LANGUAGE plpgsql SECURITY DEFINER AS $$
BEGIN
  RETURN QUERY
  WITH calculos AS (
    SELECT 
      SUM(d.subtotal)::NUMERIC AS ventas,
      SUM(d.cantidad * COALESCE(p.costo, 0))::NUMERIC AS costos
    FROM public.detalle_ventas d
    JOIN public.ventas v ON v.id = d.id_venta
    JOIN public.productos p ON p.id = d.id_producto
    WHERE v.fecha >= (NOW() - (dias_historial || ' days')::interval)
    AND (v.empresa_id = public.current_empresa_id() OR public.current_empresa_id() IS NULL)
  )
  SELECT 
    COALESCE(c.ventas, 0) AS total_ventas,
    COALESCE(c.costos, 0) AS total_costos,
    COALESCE(c.ventas - c.costos, 0) AS utilidad_bruta,
    CASE 
      WHEN coalesce(c.ventas, 0) > 0 THEN ROUND(((c.ventas - c.costos) / c.ventas) * 100, 2)
      ELSE 0
    END AS margen_porcentaje
  FROM calculos c;
END;
$$;
