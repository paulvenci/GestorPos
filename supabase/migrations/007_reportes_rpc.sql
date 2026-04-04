-- =====================================================
-- GestorPOS: Migración 007
-- Funciones RPC para Soporte de Reportes
-- Ejecutar en Supabase SQL Editor
-- =====================================================

-- 1. Top 10 Productos Más Vendidos
-- Retorna los 10 productos con mayor cantidad vendida en los últimos X días.
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
  GROUP BY p.id, p.nombre
  ORDER BY total_cantidad DESC
  LIMIT 10;
END;
$$;

-- 2. Productos Sin Rotación (Stock Muerto)
-- Retorna productos con stock > 0 que NO han sido vendidos en los últimos X días.
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
    p.stock,
    p.precio
  FROM public.productos p
  WHERE p.stock > 0 
  AND p.activo = true
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
-- Retorna el total vendido, costo estimado y la utilidad para un periodo.
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
      -- Usamos el costo actual del producto para la estimación del costo histórico
      SUM(d.cantidad * COALESCE(p.costo, 0))::NUMERIC AS costos
    FROM public.detalle_ventas d
    JOIN public.ventas v ON v.id = d.id_venta
    JOIN public.productos p ON p.id = d.id_producto
    WHERE v.fecha >= (NOW() - (dias_historial || ' days')::interval)
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
