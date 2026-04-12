import { defineStore } from 'pinia'
import { db } from '~/db'
import type { ProductoLocal, VentaReservadaLocal } from '~/db'
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

  // ─── Estado ───────────────────────────────────────────
  const carrito = ref<ItemCarrito[]>([])
  const busqueda = ref('')
  const resultados = ref<ProductoLocal[]>([])
  const buscando = ref(false)
  const procesando = ref(false)
  const ventasReservadas = ref<VentaReservadaLocal[]>([])

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
      const { data, error } = await supabase
        .from('productos')
        .select('id, empresa_id, nombre, sku, precio, costo, categoria, activo, stock, imagen_url, es_pesable, stock_minimo, margen_ganancia, updated_at')
        .eq('activo', true)
      if (error) return // Puede estar offline, no pasa nada
      if (data) {
        // Limpiar caché local para remover productos desactivados
        await db.productos.clear()
        await db.productos.bulkPut(data as unknown as ProductoLocal[])
      }
    } catch (_) { /* Offline: se usa la caché local */ }
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
    resultados.value = []
    busqueda.value = ''
  }

  function quitarItem(id_producto: string) {
    carrito.value = carrito.value.filter(i => i.id_producto !== id_producto)
  }

  function setCantidad(id_producto: string, cantidad: number) {
    const item = carrito.value.find(i => i.id_producto === id_producto)
    if (item) {
      if (cantidad <= 0) quitarItem(id_producto)
      else item.cantidad = cantidad
    }
  }

  function setDescuento(id_producto: string, descuento: number) {
    const item = carrito.value.find(i => i.id_producto === id_producto)
    if (item) item.descuento = Math.min(100, Math.max(0, descuento))
  }

  function vaciarCarrito() {
    carrito.value = []
  }

  // ─── Totales (con Ley de Redondeo Chile → $10) ──────
  const subtotal = computed(() =>
    carrito.value.reduce((acc, i) => acc + redondearCLP(i.precio * i.cantidad * (1 - i.descuento / 100)), 0)
  )
  const total = computed(() => subtotal.value)

  // ─── Cobrar ───────────────────────────────────────────
  async function registrarVenta(idTurno: string | null, metodoPago: string) {
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
      const { data, error } = await (supabase.rpc as any)('registrar_venta', {
        p_id_turno: idTurno,
        p_id_usuario: currentUser?.id ?? null,
        p_subtotal: subtotal.value,
        p_impuestos: 0,
        p_descuentos: 0,
        p_total: total.value,
        p_metodo_pago: metodoPago,
        p_items: items
      })

      if (error) {
        if (esErrorDeRed(error)) {
          // Offline real: guardar en cola Dexie
          await db.ventas_offline.add({
            turno_id: idTurno as string,
            subtotal: subtotal.value,
            total: total.value,
            metodo_pago: metodoPago,
            detalles: items,
            sync_status: 'pending',
            created_at: new Date().toISOString()
          })
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

  return {
    carrito, busqueda, resultados, buscando, procesando,
    subtotal, total,
    ventasReservadas,
    sincronizarCatalogo, buscarProductos,
    agregarItem, quitarItem, setCantidad, setDescuento, vaciarCarrito,
    registrarVenta,
    cargarReservas, reservarVenta, retomarVenta, eliminarReserva,
    redondearCLP
  }
})

