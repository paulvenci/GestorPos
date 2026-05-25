import { defineStore } from 'pinia'
import { useLocalStorage } from '@vueuse/core'
import { db } from '~/db'
import type { ProductoLocal, VentaReservadaLocal } from '~/db'
import { useAuthStore } from '~/stores/auth'
import type { Database } from '~/types/database.types'

export interface ItemCarrito {
  id_producto: string
  nombre: string
  sku: string
  precio: number
  cantidad: number
  descuento: number // % de descuento
  es_pesable?: boolean
}

/**
 * Redondeo Ley Chile: redondea a la decena más cercana ($10 CLP).
 * Ej: $4.987,50 → $4.990
 */
export function redondearCLP(value: number): number {
  return Math.round(value / 10) * 10
}

export const usePosStore = defineStore('pos', () => {
  const supabase = useSupabaseClient<Database>()
  const authStore = useAuthStore()

  // ─── Estado ───────────────────────────────────────────
  const carrito = ref<ItemCarrito[]>([])
  const busqueda = ref('')
  const resultados = ref<ProductoLocal[]>([])
  const buscando = ref(false)
  const procesando = ref(false)
  const ventasReservadas = ref<VentaReservadaLocal[]>([])
  const ultimoModificadoId = ref<string | null>(null)
  const ultimaVentaRealizada = useLocalStorage<any | null>('gestorpos_ultima_venta', null)
  const notificacionesRealtime = useLocalStorage<any[]>('gestorpos_notificaciones_rt', [])
  const triggerRealtime = ref(0)
  const triggerNotificacion = ref(0)
  const ventasOffline = ref<any[]>([])

  async function cargarVentasOffline() {
    try {
      ventasOffline.value = await db.ventas_offline
        .where('empresa_id')
        .equals(authStore.empresaId || '')
        .toArray()
      
      // Ordenar por fecha descendente
      ventasOffline.value.sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime())
    } catch (_) {
      ventasOffline.value = []
    }
  }

  watch(() => authStore.empresaId, (newId) => {
    if (newId) {
      cargarVentasOffline()
    }
  }, { immediate: true })

  let canalRealtime: any = null
  let canalAjustes: any = null
  let authSubscription: any = null

  function esErrorDeRed(error: any) {
    if (import.meta.client && !navigator.onLine) return true
    const status = error?.status ?? error?.code
    const msg = String(error?.message || '').toLowerCase()
    return (
      status === 0 ||
      msg.includes('failed to fetch') ||
      msg.includes('networkerror') ||
      msg.includes('network request failed') ||
      msg.includes('load failed')
    )
  }

  // ─── Catálogo Local (Dexie) ───────────────────────────
  async function sincronizarCatalogo() {
    try {
      let todosLosProductos: ProductoLocal[] = []
      let desde = 0
      const cantidadPorPagina = 1000
      let huboMas = true

      while (huboMas) {
        const { data, error } = await supabase
          .from('productos')
          .select('id, empresa_id, nombre, sku, precio, costo, categoria, activo, stock, imagen_url, es_pesable, stock_minimo, margen_ganancia, updated_at')
          .eq('empresa_id', authStore.empresaId)
          .eq('activo', true)
          .order('nombre')
          .range(desde, desde + cantidadPorPagina - 1)

        if (error) throw error
        if (data && data.length > 0) {
          todosLosProductos = todosLosProductos.concat(data as any as ProductoLocal[])
          if (data.length < cantidadPorPagina) {
            huboMas = false
          } else {
            desde += cantidadPorPagina
          }
        } else {
          huboMas = false
        }
      }

      if (todosLosProductos.length > 0) {
        // Limpiar caché local para remover productos desactivados
        await db.productos.clear()
        await db.productos.bulkPut(todosLosProductos)
      }

      // Iniciar sincronización en tiempo real después de la carga inicial
      setupRealtime()
    } catch (_) { /* Offline: se usa la caché local */ }
  }

  function setupRealtime() {
    if (canalRealtime || !authStore.empresaId) return

    // Escuchar cambios de autenticación para mantener el token de Realtime al día
    if (!authSubscription) {
      const { data } = supabase.auth.onAuthStateChange((event, session) => {
        if (event === 'TOKEN_REFRESHED' || event === 'SIGNED_IN') {
          console.log('Token de autenticación refrescado, reiniciando canales Realtime')
          cleanupRealtime()
          setTimeout(() => {
            setupRealtime()
          }, 500)
        }
      })
      authSubscription = data.subscription
    }

    canalRealtime = supabase
      .channel('pos-productos-realtime')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'productos',
          filter: `empresa_id=eq.${authStore.empresaId}`
        },
        async (payload: any) => {
          const { eventType, new: newRec, old: oldRec } = payload
          const productosStore = useProductosStore()
          
          if (eventType === 'INSERT' || eventType === 'UPDATE') {
            const producto = newRec as ProductoLocal
            if (producto.activo) {
              await db.productos.put(producto)
              productosStore.actualizarProductoLocal(producto)
            } else {
              await db.productos.delete(producto.id)
              productosStore.actualizarProductoLocal({ id: producto.id, activo: false })
            }

            // Evitar duplicados idénticos en menos de 2 segundos (Supabase puede enviar ráfagas)
            const ultimaNotif = notificacionesRealtime.value[0]
            const esDuplicado = ultimaNotif && 
                               ultimaNotif.id === producto.id && 
                               ultimaNotif.stock === producto.stock && 
                               ultimaNotif.precio === producto.precio &&
                               (Date.now() - new Date(ultimaNotif.timestamp).getTime() < 2000)

            if (!esDuplicado) {
              // Determinar si es un cambio "ruidoso" (solo stock) o relevante (edición/creación)
              const esEdicionRelevante = eventType === 'INSERT' || (
                oldRec && (
                  newRec.nombre !== oldRec.nombre ||
                  newRec.precio !== oldRec.precio ||
                  newRec.costo !== oldRec.costo ||
                  newRec.activo !== oldRec.activo ||
                  newRec.categoria !== oldRec.categoria
                )
              )

              if (esEdicionRelevante) {
                // Añadir a notificaciones persistentes (campanita)
                notificacionesRealtime.value.unshift({
                  id: producto.id,
                  nombre: producto.nombre,
                  stock: producto.stock,
                  precio: producto.precio,
                  tipo: eventType,
                  timestamp: new Date().toISOString(),
                  leido: false
                })
                // Limitar a los últimos 20
                if (notificacionesRealtime.value.length > 20) {
                  notificacionesRealtime.value = notificacionesRealtime.value.slice(0, 20)
                }
                // Disparar trigger de aviso (toast)
                triggerNotificacion.value++
              }
            }
          } else if (eventType === 'DELETE') {
            if (oldRec?.id) {
              await db.productos.delete(oldRec.id)
              productosStore.actualizarProductoLocal({ id: oldRec.id, deleted: true })
            }
          }

          // Disparar trigger de reactividad para componentes
          triggerRealtime.value++
        }
      )
      .subscribe((status, err) => {
        if (status === 'SUBSCRIBED') {
          console.log('Sincronización en tiempo real activa para productos')
        } else if (status === 'CHANNEL_ERROR' || status === 'CLOSED') {
          console.warn(`Canal productos Realtime con estado: ${status}. Reintentando...`, err)
          cleanupRealtime()
          setTimeout(() => {
            setupRealtime()
          }, 5000)
        }
      })

    // Nueva suscripción a ajustes de stock para capturar cambios manuales
    setupRealtimeAjustes()
  }

  function setupRealtimeAjustes() {
    if (canalAjustes || !authStore.empresaId) return

    canalAjustes = supabase
      .channel('pos-ajustes-realtime')
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'ajustes_stock',
          filter: `empresa_id=eq.${authStore.empresaId}`
        },
        async (payload: any) => {
          // Si hay un ajuste de stock, es un evento relevante que merece notificación
          triggerNotificacion.value++
        }
      )
      .subscribe((status, err) => {
        if (status === 'CHANNEL_ERROR' || status === 'CLOSED') {
          console.warn(`Canal ajustes Realtime con estado: ${status}. Reintentando...`, err)
          if (canalAjustes) {
            try {
              supabase.removeChannel(canalAjustes)
            } catch (_) {}
            canalAjustes = null
          }
          setTimeout(() => {
            setupRealtimeAjustes()
          }, 5000)
        }
      })
  }

  function cleanupRealtime() {
    if (canalRealtime) {
      try {
        supabase.removeChannel(canalRealtime)
      } catch (_) {}
      canalRealtime = null
    }
    if (canalAjustes) {
      try {
        supabase.removeChannel(canalAjustes)
      } catch (_) {}
      canalAjustes = null
    }
    if (authSubscription) {
      try {
        authSubscription.unsubscribe()
      } catch (_) {}
      authSubscription = null
    }
  }

  async function buscarProductos(query: string) {
    if (!query.trim()) {
      resultados.value = []
      return
    }
    buscando.value = true
    try {
      // Primero busca en Dexie (instantáneo, funciona offline)
      const q = query.toLowerCase()
      const locales = await db.productos
        .filter(p =>
          p.nombre.toLowerCase().includes(q) ||
          p.sku?.toLowerCase().includes(q)
        )
        .limit(12)
        .toArray()
      resultados.value = locales
    } finally {
      buscando.value = false
    }
  }

  // ─── Carrito ──────────────────────────────────────────
  function agregarItem(producto: ProductoLocal, cantidadEspecial: number = 1, overridePrecio?: number) {
    const pPrecio = overridePrecio !== undefined ? overridePrecio : producto.precio;
    const existente = carrito.value.find(i => i.id_producto === producto.id && i.precio === pPrecio)
    if (existente && !producto.es_pesable) {
      existente.cantidad += cantidadEspecial
    } else {
      carrito.value.push({
        id_producto: producto.id,
        nombre: producto.nombre,
        sku: producto.sku,
        precio: pPrecio,
        cantidad: cantidadEspecial,
        descuento: 0,
        es_pesable: producto.es_pesable
      })
    }
    ultimoModificadoId.value = producto.id
    resultados.value = []
    busqueda.value = ''
  }

  function quitarItem(id_producto: string) {
    carrito.value = carrito.value.filter(i => i.id_producto !== id_producto)
    if (ultimoModificadoId.value === id_producto) ultimoModificadoId.value = null
  }

  function setCantidad(id_producto: string, cantidad: number) {
    const item = carrito.value.find(i => i.id_producto === id_producto)
    if (item) {
      if (cantidad <= 0) quitarItem(id_producto)
      else {
        item.cantidad = cantidad
        ultimoModificadoId.value = id_producto
      }
    }
  }

  function setDescuento(id_producto: string, descuento: number) {
    const item = carrito.value.find(i => i.id_producto === id_producto)
    if (item) item.descuento = Math.min(100, Math.max(0, descuento))
  }

  function vaciarCarrito() {
    carrito.value = []
    ultimoModificadoId.value = null
  }

  // ─── Totales (con Ley de Redondeo Chile → $10) ──────
  const subtotal = computed(() =>
    carrito.value.reduce((acc, i) => acc + redondearCLP(i.precio * i.cantidad * (1 - i.descuento / 100)), 0)
  )
  const total = computed(() => subtotal.value)

  // ─── Cobrar ───────────────────────────────────────────
  async function registrarVenta(
    idTurno: string | null,
    metodoPago: string,
    pagoEfectivo = 0,
    pagoTarjeta = 0,
    pagoTransferencia = 0
  ) {
    if (carrito.value.length === 0) throw new Error('El carrito está vacío')
    procesando.value = true

    const items = carrito.value.map(i => ({
      id_producto: i.id_producto,
      cantidad: i.cantidad,
      precio_unitario: Math.round(i.precio * (1 - i.descuento / 100)),
      subtotal: redondearCLP(i.precio * i.cantidad * (1 - i.descuento / 100))
    }))

    try {
      const { data: { user: currentUser } } = await supabase.auth.getUser()
      const realUserId = currentUser?.id ?? authStore.user?.id ?? null
      const { data, error } = await (supabase.rpc as any)('registrar_venta', {
        p_id_turno: idTurno,
        p_id_usuario: realUserId,
        p_subtotal: subtotal.value,
        p_impuestos: 0,
        p_descuentos: 0,
        p_total: total.value,
        p_metodo_pago: metodoPago,
        p_items: items,
        p_pago_efectivo: pagoEfectivo,
        p_pago_tarjeta: pagoTarjeta,
        p_pago_transferencia: pagoTransferencia
      })

      if (error) {
        if (esErrorDeRed(error)) {
          // Offline real: guardar en cola Dexie
          await db.ventas_offline.add({
            empresa_id: authStore.empresaId,
            turno_id: idTurno as string,
            id_usuario: realUserId || undefined,
            subtotal: subtotal.value,
            total: total.value,
            metodo_pago: metodoPago,
            pago_efectivo: pagoEfectivo,
            pago_tarjeta: pagoTarjeta,
            pago_transferencia: pagoTransferencia,
            detalles: items,
            sync_status: 'pending',
            created_at: new Date().toISOString()
          })
          await cargarVentasOffline()
          vaciarCarrito()
          throw new Error('OFFLINE')
        }

        // Si hay internet y falla el RPC, no debe mostrarse como "sin conexión"
        throw new Error(error.message || 'No se pudo registrar la venta.')
      }

      vaciarCarrito()
      return data
    } finally {
      procesando.value = false
    }
  }

  async function sincronizarColaOffline(): Promise<number> {
    if (import.meta.client && !navigator.onLine) return 0

    const pendientes = await db.ventas_offline
      .filter(v => (v.sync_status === 'pending' || v.sync_status === 'error') && v.empresa_id === authStore.empresaId)
      .toArray()
    if (pendientes.length === 0) return 0

    let sincronizadas = 0
    for (const venta of pendientes) {
      try {
        const metodo = venta.metodo_pago || 'efectivo'
        const pagoEfectivo = venta.pago_efectivo ?? (metodo === 'efectivo' ? venta.total : 0)
        const pagoTarjeta = venta.pago_tarjeta ?? (metodo === 'tarjeta' ? venta.total : 0)
        const pagoTransferencia = venta.pago_transferencia ?? (metodo === 'transferencia' ? venta.total : 0)

        const { error } = await supabase.rpc('registrar_venta', {
          p_id_turno: venta.turno_id,
          p_id_usuario: venta.id_usuario ?? authStore.user?.id ?? null,
          p_subtotal: venta.subtotal,
          p_impuestos: 0,
          p_descuentos: 0,
          p_total: venta.total,
          p_metodo_pago: metodo,
          p_items: venta.detalles,
          p_pago_efectivo: pagoEfectivo,
          p_pago_tarjeta: pagoTarjeta,
          p_pago_transferencia: pagoTransferencia
        })

        if (!error) {
          await db.ventas_offline.update(venta.id!, { sync_status: 'synced' })
          sincronizadas++
        } else {
          console.error('Error sincronizando venta offline:', error)
          await db.ventas_offline.update(venta.id!, { sync_status: 'error' })
        }
      } catch (err) {
        console.error('Excepción sincronizando venta offline:', err)
        await db.ventas_offline.update(venta.id!, { sync_status: 'error' })
      }
    }

    await cargarVentasOffline()
    return sincronizadas
  }

  // ─── Reserva de Ventas (Dexie) ────────────────────────
  async function cargarReservas() {
    try {
      ventasReservadas.value = await db.ventas_reservadas.toArray()
    } catch (_) {
      ventasReservadas.value = []
    }
  }

  async function reservarVenta() {
    if (carrito.value.length === 0) throw new Error('El carrito está vacío')
    if (ventasReservadas.value.length >= 5) throw new Error('Máximo 5 ventas reservadas')

    const reserva: VentaReservadaLocal = {
      items: carrito.value.map(i => ({
        id_producto: i.id_producto,
        nombre: i.nombre,
        sku: i.sku,
        precio: i.precio,
        cantidad: i.cantidad,
        descuento: i.descuento,
        es_pesable: i.es_pesable
      })),
      total: total.value,
      created_at: new Date().toISOString()
    }

    const id = await db.ventas_reservadas.add(reserva)
    reserva.id = id as number
    ventasReservadas.value.push(reserva)
    vaciarCarrito()
  }

  async function retomarVenta(id: number) {
    const reserva = ventasReservadas.value.find(v => v.id === id)
    if (!reserva) return

    // Reemplazar carrito actual con la reserva
    carrito.value = reserva.items.map(i => ({ ...i }))

    // Eliminar de reservas
    await db.ventas_reservadas.delete(id)
    ventasReservadas.value = ventasReservadas.value.filter(v => v.id !== id)
  }

  async function eliminarReserva(id: number) {
    await db.ventas_reservadas.delete(id)
    ventasReservadas.value = ventasReservadas.value.filter(v => v.id !== id)
  }

  // ─── Ventas del Día ───────────────────────────────────
  async function fetchVentasDia(): Promise<any[]> {
    const hoy = new Date()
    hoy.setHours(0, 0, 0, 0)
    const { data, error } = await supabase
      .from('ventas')
      .select('id, fecha, total, subtotal, metodo_pago, estado, created_at, detalle_ventas(id_producto, cantidad, precio_unitario, productos(nombre))')
      .eq('empresa_id', authStore.empresaId)
      .gte('fecha', hoy.toISOString())
      .neq('estado', 'cancelada')
      .order('fecha', { ascending: false })
    if (error) throw error
    return data || []
  }

  async function cancelarVenta(idVenta: string, motivo: string | null, supervisorId: string): Promise<void> {
    const { error } = await (supabase.rpc as any)('cancelar_venta', {
      p_id_venta: idVenta,
      p_motivo: motivo || null,
      p_supervisor_id: supervisorId
    })
    if (error) throw new Error(error.message)
  }

  return {
    carrito, busqueda, resultados, buscando, procesando,
    subtotal, total,
    ventasReservadas,
    ultimoModificadoId,
    ultimaVentaRealizada,
    sincronizarCatalogo, buscarProductos,
    agregarItem, quitarItem, setCantidad, setDescuento, vaciarCarrito,
    registrarVenta,
    cargarReservas, reservarVenta, retomarVenta, eliminarReserva,
    fetchVentasDia, cancelarVenta,
    redondearCLP,
    setupRealtime, cleanupRealtime,
    notificacionesRealtime, triggerRealtime, triggerNotificacion,
    ventasOffline, cargarVentasOffline, sincronizarColaOffline,
    limpiarNotificacionesRealtime: () => { notificacionesRealtime.value = [] }
  }
})

