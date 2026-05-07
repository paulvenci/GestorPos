import { defineStore } from 'pinia'
import { useAuthStore } from './auth'
import type { Proveedor } from './proveedores'
import type { ProductoLocal } from '~/db'

export interface DetallePedido {
  id?: string
  pedido_id?: string
  producto_id: string
  cantidad_pedida: number
  cantidad_recibida: number
  precio_unitario_estimado: number
  // Relacion
  producto?: ProductoLocal
}

export interface PedidoCompra {
  id?: string
  empresa_id?: string
  proveedor_id: string | null
  estado: 'pendiente_pedido' | 'pedido_realizado' | 'recibido_e_ingresado' | 'anulado'
  total_estimado: number
  notas?: string
  id_usuario?: string
  fecha_pedido?: string
  fecha_recepcion?: string
  created_at?: string
  // Relacion
  proveedor?: Proveedor
  detalles?: DetallePedido[]
}

export const useComprasStore = defineStore('compras', () => {
  const supabase = useSupabaseClient()
  const authStore = useAuthStore()
  
  const pedidos = ref<PedidoCompra[]>([])
  const loading = ref(false)

  async function fetchPedidos() {
    if (!authStore.empresaId) return
    loading.value = true
    try {
      // 1. Cargamos los pedidos y los perfiles por separado para evitar errores de relación
      const [{ data: pedData, error: pedError }, { data: perfData }] = await Promise.all([
        supabase
          .from('pedidos_compra')
          .select('*, proveedor:proveedores(*)')
          .eq('empresa_id', authStore.empresaId)
          .order('created_at', { ascending: false }),
        supabase
          .from('perfiles')
          .select('id, nombre')
          .eq('empresa_id', authStore.empresaId)
      ])
      
      if (pedError) throw pedError
      
      // 2. Mapeamos los nombres de los perfiles a los pedidos
      if (pedData) {
        const perfilesMap = new Map(perfData?.map(p => [p.id, p.nombre]) || [])
        pedidos.value = pedData.map((p: any) => ({
          ...p,
          perfil: { nombre: perfilesMap.get(p.id_usuario) || 'Sistema' }
        }))
      }
    } catch (e: any) {
      console.error('Error cargando pedidos:', e.message)
    } finally {
      loading.value = false
    }
  }

  async function fetchDetalles(pedidoId: string) {
    try {
      const { data, error } = await supabase
        .from('detalle_pedidos')
        .select(`
          *,
          producto:productos(*)
        `)
        .eq('pedido_id', pedidoId)
      
      if (error) throw error
      return data as DetallePedido[]
    } catch (e: any) {
      console.error('Error cargando detalles del pedido:', e.message)
      return []
    }
  }

  async function actualizarEstadoPedido(pedidoId: string, nuevoEstado: string) {
    if (!authStore.empresaId) return
    loading.value = true
    try {
      const updateData: any = { estado: nuevoEstado }
      if (nuevoEstado === 'pedido_realizado') updateData.fecha_pedido = new Date().toISOString()
      if (nuevoEstado === 'recibido_e_ingresado') updateData.fecha_recepcion = new Date().toISOString()

      const { error } = await supabase
        .from('pedidos_compra')
        .update(updateData)
        .eq('id', pedidoId)
        .eq('empresa_id', authStore.empresaId)
        
      if (error) throw error
      
      // Actualizar localmente
      const p = pedidos.value.find(x => x.id === pedidoId)
      if (p) {
        p.estado = nuevoEstado as any
        if (updateData.fecha_pedido) p.fecha_pedido = updateData.fecha_pedido
        if (updateData.fecha_recepcion) p.fecha_recepcion = updateData.fecha_recepcion
      }
    } catch (e: any) {
      console.error('Error actualizando estado:', e.message)
      throw e
    } finally {
      loading.value = false
    }
  }

  // --- LÓGICA INTELIGENTE: Generar pedidos separados desde una lista general ---
  async function generarPedidosAgrupados(itemsFaltantes: { producto: ProductoLocal, cantidad: number }[]) {
    if (!authStore.empresaId || itemsFaltantes.length === 0) return
    loading.value = true
    try {
      // 1. Obtener los últimos proveedores de cada producto (Historial)
      // Buscamos en detalle_pedidos uniéndolo con pedidos_compra
      const productosIds = itemsFaltantes.map(i => i.producto.id)
      
      const { data: historial } = await supabase
        .from('detalle_pedidos')
        .select(`
          producto_id,
          pedidos_compra!inner(proveedor_id, created_at)
        `)
        .in('producto_id', productosIds)
        .order('created_at', { ascending: false })

      // Mapa para saber el proveedor sugerido (el más reciente)
      const mapaProveedores = new Map<string, string>() // productoId -> proveedorId
      
      if (historial) {
        for (const fila of historial as any[]) {
          const prodId = fila.producto_id
          const provId = fila.pedidos_compra?.proveedor_id
          if (provId && !mapaProveedores.has(prodId)) {
            mapaProveedores.set(prodId, provId)
          }
        }
      }

      // 2. Agrupar los items por proveedor
      // Si no tiene proveedor histórico, irá a un grupo 'SIN_ASIGNAR'
      const agrupacion = new Map<string, typeof itemsFaltantes>()

      for (const item of itemsFaltantes) {
        const provId = mapaProveedores.get(item.producto.id!) || 'SIN_ASIGNAR'
        if (!agrupacion.has(provId)) agrupacion.set(provId, [])
        agrupacion.get(provId)!.push(item)
      }

      // 3. Crear las cabeceras y los detalles por cada proveedor
      for (const [provId, items] of agrupacion.entries()) {
        const totalEstimado = items.reduce((sum, item) => sum + (item.cantidad * (item.producto.costo || 0)), 0)
        
        // Crear cabecera
        const { data: pedidoData, error: errPedido } = await supabase
          .from('pedidos_compra')
          .insert({
            empresa_id: authStore.empresaId,
            id_usuario: authStore.user?.id,
            proveedor_id: provId === 'SIN_ASIGNAR' ? null : provId,
            estado: 'pendiente_pedido',
            total_estimado: totalEstimado
          })
          .select()
          .single()

        if (errPedido) throw errPedido

        // Preparar e insertar detalles
        const detallesAInsertar = items.map(item => ({
          pedido_id: pedidoData.id,
          producto_id: item.producto.id,
          cantidad_pedida: item.cantidad,
          precio_unitario_estimado: item.producto.costo || 0
        }))

        const { error: errDetalles } = await supabase
          .from('detalle_pedidos')
          .insert(detallesAInsertar)

        if (errDetalles) throw errDetalles
      }

      // 4. Refrescar la lista de pedidos
      await fetchPedidos()

    } catch (e: any) {
      console.error('Error generando pedidos:', e.message)
      throw e
    } finally {
      loading.value = false
    }
  }

  // --- Pedidos pendientes de recepción (estado = pedido_realizado) ---
  async function fetchPedidosPendientes(proveedorId?: string | null) {
    if (!authStore.empresaId) return []
    try {
      let query = supabase
        .from('pedidos_compra')
        .select(`
          *,
          proveedor:proveedores(*)
        `)
        .eq('empresa_id', authStore.empresaId)
        .eq('estado', 'pedido_realizado')
        .order('created_at', { ascending: false })

      if (proveedorId) {
        query = query.eq('proveedor_id', proveedorId)
      }

      const { data, error } = await query
      if (error) throw error
      return (data || []) as PedidoCompra[]
    } catch (e: any) {
      console.error('Error cargando pedidos pendientes:', e.message)
      return []
    }
  }

  // --- Buscar proveedor por RUT ---
  async function buscarProveedorPorRut(rut: string) {
    if (!authStore.empresaId || !rut) return null
    try {
      const { data } = await supabase
        .from('proveedores')
        .select('*')
        .eq('empresa_id', authStore.empresaId)
        .eq('rut', rut)
        .single()
      return data
    } catch {
      return null
    }
  }

  async function asignarProveedor(pedidoId: string, proveedorId: string) {
    if (!authStore.empresaId) return
    loading.value = true
    try {
      const { error } = await supabase
        .from('pedidos_compra')
        .update({ proveedor_id: proveedorId })
        .eq('id', pedidoId)
        .eq('empresa_id', authStore.empresaId)
      
      if (error) throw error
      await fetchPedidos() // Refrescar lista
    } catch (e: any) {
      console.error('Error asignando proveedor:', e.message)
      throw e
    } finally {
      loading.value = false
    }
  }

  async function actualizarDetallePedido(pedidoId: string, detalleId: string, nuevaCantidad: number) {
    if (!authStore.empresaId) return
    try {
      const { error } = await supabase
        .from('detalle_pedidos')
        .update({ cantidad_pedida: nuevaCantidad })
        .eq('id', detalleId)
      
      if (error) throw error
      
      // Recalcular total del pedido
      const detalles = await fetchDetalles(pedidoId)
      const nuevoTotal = detalles.reduce((sum, d) => sum + (d.cantidad_pedida * d.precio_unitario_estimado), 0)
      
      await supabase
        .from('pedidos_compra')
        .update({ total_estimado: nuevoTotal })
        .eq('id', pedidoId)

      await fetchPedidos() // Refrescar cabeceras
      return detalles
    } catch (e: any) {
      console.error('Error actualizando detalle:', e.message)
      throw e
    }
  }

  async function eliminarDetallePedido(pedidoId: string, detalleId: string) {
    if (!authStore.empresaId) return
    try {
      const { error } = await supabase
        .from('detalle_pedidos')
        .delete()
        .eq('id', detalleId)
      
      if (error) throw error
      
      // Recalcular total
      const detalles = await fetchDetalles(pedidoId)
      const nuevoTotal = detalles.reduce((sum, d) => sum + (d.cantidad_pedida * d.precio_unitario_estimado), 0)
      
      await supabase
        .from('pedidos_compra')
        .update({ total_estimado: nuevoTotal })
        .eq('id', pedidoId)

      await fetchPedidos()
      return detalles
    } catch (e: any) {
      console.error('Error eliminando detalle:', e.message)
      throw e
    }
  }

  async function agregarProductoAPedido(pedidoId: string, producto: any, cantidad: number) {
    if (!authStore.empresaId) return
    try {
      // 1. Insertar detalle
      const { error: errInsert } = await supabase
        .from('detalle_pedidos')
        .insert({
          pedido_id: pedidoId,
          producto_id: producto.id,
          cantidad_pedida: cantidad,
          precio_unitario_estimado: producto.costo || 0
        })
      
      if (errInsert) throw errInsert

      // 2. Recalcular total
      const detalles = await fetchDetalles(pedidoId)
      const nuevoTotal = detalles.reduce((sum, d) => sum + (d.cantidad_pedida * d.precio_unitario_estimado), 0)
      
      await supabase
        .from('pedidos_compra')
        .update({ total_estimado: nuevoTotal })
        .eq('id', pedidoId)

      await fetchPedidos()
      return detalles
    } catch (e: any) {
      console.error('Error agregando producto:', e.message)
      throw e
    }
  }

  async function eliminarPedido(pedidoId: string) {
    if (!authStore.empresaId) return
    loading.value = true
    try {
      console.log('Intentando eliminar pedido:', pedidoId, 'Empresa:', authStore.empresaId)
      
      // 1. Eliminar detalles primero
      const { error: errDet } = await supabase
        .from('detalle_pedidos')
        .delete()
        .eq('pedido_id', pedidoId)
      
      if (errDet) {
        console.error('Error detalles:', errDet)
        throw errDet
      }
      
      // 2. Eliminar cabecera pidiendo los datos de vuelta
      const { data, error } = await supabase
        .from('pedidos_compra')
        .delete()
        .eq('id', pedidoId)
        .select()
      
      if (error) {
        console.error('Error cabecera:', error)
        throw error
      }
      
      if (!data || data.length === 0) {
        console.error('La base de datos NO borró nada. Posible problema de RLS.')
        throw new Error('La base de datos no permitió borrar el pedido.')
      }
      
      // 3. Actualizar localmente
      pedidos.value = pedidos.value.filter(p => p.id !== pedidoId)
      console.log('Borrado exitoso confirmada por DB')
    } catch (e: any) {
      console.error('Error eliminando pedido:', e.message)
      throw e
    } finally {
      loading.value = false
    }
  }

  return { 
    pedidos, 
    loading, 
    fetchPedidos, 
    fetchDetalles, 
    actualizarEstadoPedido,
    generarPedidosAgrupados,
    fetchPedidosPendientes,
    buscarProveedorPorRut,
    asignarProveedor,
    actualizarDetallePedido,
    eliminarPedido,
    eliminarDetallePedido,
    agregarProductoAPedido
  }
})
