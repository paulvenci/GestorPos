import { defineStore } from 'pinia'
import { db } from '~/db'
import type { ProductoLocal } from '~/db'
import type { Database } from '~/types/database.types'

export interface ItemCarrito {
  id_producto: string
  nombre: string
  sku: string
  precio: number
  cantidad: number
  descuento: number // % de descuento
}

export const usePosStore = defineStore('pos', () => {
  const supabase = useSupabaseClient<Database>()

  // ─── Estado ───────────────────────────────────────────
  const carrito = ref<ItemCarrito[]>([])
  const busqueda = ref('')
  const resultados = ref<ProductoLocal[]>([])
  const buscando = ref(false)
  const procesando = ref(false)

  // ─── Catálogo Local (Dexie) ───────────────────────────
  async function sincronizarCatalogo() {
    try {
      const { data, error } = await supabase
        .from('productos')
        .select('id, nombre, sku, precio, stock, imagen_url, updated_at')
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
  function agregarItem(producto: ProductoLocal) {
    const existente = carrito.value.find(i => i.id_producto === producto.id)
    if (existente) {
      existente.cantidad += 1
    } else {
      carrito.value.push({
        id_producto: producto.id,
        nombre: producto.nombre,
        sku: producto.sku,
        precio: producto.precio,
        cantidad: 1,
        descuento: 0
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

  // ─── Totales ──────────────────────────────────────────
  const subtotal = computed(() =>
    carrito.value.reduce((acc, i) => acc + i.precio * i.cantidad * (1 - i.descuento / 100), 0)
  )
  const total = computed(() => subtotal.value)

  // ─── Cobrar ───────────────────────────────────────────
  async function registrarVenta(idTurno: string | null, metodoPago: string) {
    if (carrito.value.length === 0) throw new Error('El carrito está vacío')
    procesando.value = true

    const items = carrito.value.map(i => ({
      id_producto: i.id_producto,
      cantidad: i.cantidad,
      precio_unitario: i.precio * (1 - i.descuento / 100),
      subtotal: i.precio * i.cantidad * (1 - i.descuento / 100)
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
        // ── Offline: guardar en cola Dexie ──
        await db.ventas_offline.add({
          turno_id: idTurno as string,
          subtotal: subtotal.value,
          total: total.value,
          detalles: items,
          sync_status: 'pending',
          created_at: new Date().toISOString()
        })
        vaciarCarrito()
        throw new Error('OFFLINE') // señal especial para la UI
      }

      vaciarCarrito()
      return data
    } finally {
      procesando.value = false
    }
  }

  return {
    carrito, busqueda, resultados, buscando, procesando,
    subtotal, total,
    sincronizarCatalogo, buscarProductos,
    agregarItem, quitarItem, setCantidad, setDescuento, vaciarCarrito,
    registrarVenta
  }
})
