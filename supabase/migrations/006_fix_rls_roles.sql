-- =====================================================
-- GestorPOS: Migración 006
-- Corrección de Políticas RLS por cambio de rol
-- Ejecutar en Supabase SQL Editor
-- =====================================================

-- En la migración 004 cambiamos el rol de 'administrador' a 'admin', 
-- pero las políticas RLS iniciales (001) quedaron buscando 'administrador'.
-- Esto causa el error 403 RLS violation al guardar productos.

-- 1. Actualizar RLS de productos
DROP POLICY IF EXISTS "productos_write_admin" ON public.productos;
CREATE POLICY "productos_write_admin" ON public.productos
  FOR ALL USING (
    EXISTS (SELECT 1 FROM public.perfiles WHERE id = auth.uid() AND rol IN ('admin', 'supervisor'))
  );

-- 2. Actualizar RLS de turnos_caja
DROP POLICY IF EXISTS "turnos_cajero" ON public.turnos_caja;
CREATE POLICY "turnos_cajero" ON public.turnos_caja
  FOR ALL USING (
    id_usuario = auth.uid()
    OR EXISTS (SELECT 1 FROM public.perfiles WHERE id = auth.uid() AND rol IN ('admin', 'supervisor'))
  );

-- 3. Actualizar RLS de ventas
DROP POLICY IF EXISTS "ventas_via_turno" ON public.ventas;
CREATE POLICY "ventas_via_turno" ON public.ventas
  FOR ALL USING (
    EXISTS (SELECT 1 FROM public.turnos_caja WHERE id = id_turno AND id_usuario = auth.uid())
    OR EXISTS (SELECT 1 FROM public.perfiles WHERE id = auth.uid() AND rol IN ('admin', 'supervisor'))
  );

-- 4. Actualizar RLS de detalle_ventas
DROP POLICY IF EXISTS "detalle_via_venta" ON public.detalle_ventas;
CREATE POLICY "detalle_via_venta" ON public.detalle_ventas
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM public.ventas v
      JOIN public.turnos_caja t ON t.id = v.id_turno
      WHERE v.id = id_venta AND t.id_usuario = auth.uid()
    )
    OR EXISTS (SELECT 1 FROM public.perfiles WHERE id = auth.uid() AND rol IN ('admin', 'supervisor'))
  );
