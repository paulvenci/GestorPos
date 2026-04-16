-- Aumento de Top 10 a Top 20 y refuerzo de multi-tenant
CREATE OR REPLACE FUNCTION get_top_productos(dias_historial integer DEFAULT 30)
RETURNS TABLE (
  producto_id UUID,
  nombre TEXT,
  total_cantidad BIGINT,
  total_ingreso NUMERIC
) LANGUAGE plpgsql SECURITY DEFINER AS $$
BEGIN
  RETURN QUERY
  SELECT 
    p.id AS producto_id,
    p.nombre,
    SUM(d.cantidad)::BIGINT AS total_cantidad,
    SUM(d.subtotal)::NUMERIC AS total_ingreso
  FROM public.detalle_ventas d
  JOIN public.ventas v ON v.id = d.id_venta
  JOIN public.productos p ON p.id = d.id_producto
  WHERE v.fecha >= (NOW() - (dias_historial || ' days')::interval)
  AND (v.empresa_id = public.current_empresa_id() OR public.current_empresa_id() IS NULL)
  GROUP BY p.id, p.nombre
  ORDER BY total_cantidad DESC
  LIMIT 20;
END;
$$;
