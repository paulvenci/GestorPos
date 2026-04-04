<template>
  <!-- POS Principal -->
  <div class="pos-layout">

    <!-- Badge fuera de turno -->
    <div v-if="!hayTurnoActivo && !cajaLoading" class="pos-fuera-turno-badge">
      <i class="pi pi-info-circle" />
      <span>Operando fuera de turno</span>
      <NuxtLink to="/caja">
        <Button label="Abrir turno" icon="pi pi-play" size="small" text severity="warning" />
      </NuxtLink>
    </div>

    <!-- ═══ PANEL IZQUIERDO: Búsqueda y productos ═══ -->
    <div class="pos-panel-left">

      <!-- Barra de búsqueda (auto-focus para scanner) -->
      <div class="pos-search-bar">
        <div class="pos-search-wrapper">
          <i class="pi pi-barcode pos-search-icon" />
          <input
            ref="searchInputRef"
            v-model="posStore.busqueda"
            type="text"
            placeholder="Escanear código o buscar por nombre..."
            class="pos-search-input"
            autocomplete="off"
            @input="onBusqueda"
            @keydown.enter="onEnterBusqueda"
            @keydown.escape="limpiarBusqueda"
          />
          <span v-if="posStore.buscando" class="pos-search-spinner">
            <i class="pi pi-spin pi-spinner" />
          </span>
        </div>

        <!-- Badge offline -->
        <div v-if="!isOnline" class="pos-offline-badge">
          <i class="pi pi-wifi-off" />
          Modo Offline
        </div>
      </div>

      <!-- Resultados de búsqueda -->
      <Transition name="slide-down">
        <div v-if="posStore.resultados.length > 0" class="pos-resultados">
          <div
            v-for="(prod, idx) in posStore.resultados"
            :key="prod.id"
            class="pos-resultado-item"
            :class="{ 'pos-resultado-item--first': idx === 0 }"
            tabindex="0"
            @click="seleccionarProducto(prod)"
            @keydown.enter="seleccionarProducto(prod)"
          >
            <img v-if="prod.imagen_url" :src="prod.imagen_url" class="pos-resultado-thumb" alt="" />
            <div v-else class="pos-resultado-thumb pos-resultado-thumb--empty">
              <i class="pi pi-box" />
            </div>
            <div class="pos-resultado-info">
              <span class="pos-resultado-nombre">{{ prod.nombre }}</span>
              <span class="pos-resultado-sku">{{ prod.sku }}</span>
            </div>
            <div class="pos-resultado-derecha">
              <span class="pos-resultado-precio">{{ formatMonto(prod.precio) }}</span>
              <Tag
                :value="`Stock: ${prod.stock}`"
                :severity="prod.stock > 0 ? 'success' : 'danger'"
                class="pos-resultado-stock"
              />
            </div>
          </div>
        </div>
      </Transition>

      <!-- Catálogo rápido (cuando no hay búsqueda) -->
      <div v-if="!posStore.busqueda && productosDestacados.length > 0" class="pos-catalogo">
        <h3 class="pos-catalogo-title">Acceso Rápido</h3>
        <div class="pos-catalogo-grid">
          <button
            v-for="prod in productosDestacados"
            :key="prod.id"
            class="pos-catalogo-item"
            :disabled="prod.stock === 0"
            @click="seleccionarProducto(prod)"
          >
            <img v-if="prod.imagen_url" :src="prod.imagen_url" class="pos-catalogo-img" alt="" />
            <div v-else class="pos-catalogo-img pos-catalogo-img--empty">
              <i class="pi pi-box" />
            </div>
            <span class="pos-catalogo-nombre">{{ prod.nombre }}</span>
            <span class="pos-catalogo-precio">{{ formatMonto(prod.precio) }}</span>
          </button>
        </div>
      </div>

      <!-- Estado vacío inicial -->
      <div v-if="!posStore.busqueda && productosDestacados.length === 0" class="pos-vacio">
        <i class="pi pi-search" style="font-size: 3rem; color: #334155;" />
        <p>Escanea o escribe para buscar productos</p>
      </div>
    </div>

    <!-- ═══ PANEL DERECHO: Carrito ═══ -->
    <div class="pos-panel-right">

      <!-- Header del carrito -->
      <div class="pos-carrito-header">
        <h2 class="pos-carrito-title">
          <i class="pi pi-shopping-cart" />
          Carrito
          <span v-if="posStore.carrito.length > 0" class="pos-carrito-badge">
            {{ posStore.carrito.length }}
          </span>
        </h2>
        <Button
          v-if="posStore.carrito.length > 0"
          icon="pi pi-trash"
          text
          severity="danger"
          size="small"
          title="Vaciar carrito (Esc)"
          @click="confirmarVaciar"
        />
      </div>

      <!-- Ítems del carrito -->
      <div class="pos-carrito-items">
        <TransitionGroup name="cart-item" tag="div">
          <div
            v-for="item in posStore.carrito"
            :key="item.id_producto"
            class="pos-item"
          >
            <div class="pos-item-info">
              <span class="pos-item-nombre">{{ item.nombre }}</span>
              <span class="pos-item-sku">{{ item.sku }}</span>
            </div>

            <div class="pos-item-controles">
              <button class="pos-item-btn" @click="posStore.setCantidad(item.id_producto, item.cantidad - 1)">
                <i class="pi pi-minus" />
              </button>
              <span class="pos-item-cantidad">{{ item.cantidad }}</span>
              <button class="pos-item-btn" @click="posStore.setCantidad(item.id_producto, item.cantidad + 1)">
                <i class="pi pi-plus" />
              </button>
            </div>

            <div class="pos-item-precio-col">
              <span class="pos-item-precio">{{ formatMonto(item.precio * item.cantidad * (1 - item.descuento / 100)) }}</span>
              <button class="pos-item-eliminar" @click="posStore.quitarItem(item.id_producto)">
                <i class="pi pi-times" />
              </button>
            </div>
          </div>
        </TransitionGroup>

        <!-- Carrito vacío -->
        <div v-if="posStore.carrito.length === 0" class="pos-carrito-vacio">
          <i class="pi pi-shopping-bag" />
          <p>El carrito está vacío</p>
        </div>
      </div>

      <!-- Footer: Total y cobro -->
      <div class="pos-carrito-footer">
        <div class="pos-total-row">
          <span class="pos-total-label">Total</span>
          <span class="pos-total-monto">{{ formatMonto(posStore.total) }}</span>
        </div>

        <!-- Método de pago -->
        <div class="pos-metodo-pago">
          <button
            v-for="metodo in metodosPago"
            :key="metodo.value"
            class="pos-metodo-btn"
            :class="{ 'pos-metodo-btn--activo': metodoPago === metodo.value }"
            @click="metodoPago = metodo.value"
          >
            <i :class="metodo.icon" />
            {{ metodo.label }}
          </button>
        </div>

        <Button
          label="Cobrar (F2)"
          icon="pi pi-check-circle"
          size="large"
          class="pos-cobrar-btn"
          :loading="posStore.procesando"
          :disabled="posStore.carrito.length === 0"
          @click="cobrar"
        />
      </div>
    </div>
  </div>

  <!-- Diálogo de confirmación de pago -->
  <Dialog
    v-model:visible="mostrarConfirmacion"
    modal
    header="Confirmar Venta"
    :style="{ width: '400px' }"
  >
    <div class="dialog-body">
      <div class="confirm-total">
        <span class="confirm-total-label">Total a cobrar</span>
        <span class="confirm-total-monto">{{ formatMonto(posStore.total) }}</span>
      </div>
      <div class="confirm-metodo">
        <i :class="metodosPago.find(m => m.value === metodoPago)?.icon" />
        <span>{{ metodosPago.find(m => m.value === metodoPago)?.label }}</span>
      </div>
    </div>
    <template #footer>
      <Button label="Cancelar" text severity="secondary" @click="mostrarConfirmacion = false" />
      <Button
        label="Confirmar cobro"
        icon="pi pi-check"
        :loading="posStore.procesando"
        class="pos-btn-cta"
        @click="confirmarCobro"
      />
    </template>
  </Dialog>
</template>

<script setup lang="ts">
import { useToast } from 'primevue/usetoast'
import { storeToRefs } from 'pinia'
import { useCajaStore } from '~/stores/caja'
import { usePosStore } from '~/stores/pos'
import { useFormatMonto } from '~/composables/useFormatMonto'
import { db } from '~/db'
import type { ProductoLocal } from '~/db'
import type { Database } from '~/types/database.types'

const cajaStore = useCajaStore()
const { hayTurnoActivo, loading: cajaLoading } = storeToRefs(cajaStore)
const posStore = usePosStore()
const toast = useToast()
const { formatMonto } = useFormatMonto()

// ─── Refs ─────────────────────────────────────────────────
const searchInputRef = ref<HTMLInputElement | null>(null)
const mostrarConfirmacion = ref(false)
const metodoPago = ref('efectivo')
const isOnline = ref(import.meta.client ? navigator.onLine : true)
const productosDestacados = ref<ProductoLocal[]>([])

const metodosPago = [
  { value: 'efectivo', label: 'Efectivo', icon: 'pi pi-money-bill' },
  { value: 'tarjeta', label: 'Tarjeta', icon: 'pi pi-credit-card' },
  { value: 'transferencia', label: 'Transferencia', icon: 'pi pi-send' }
]

// ─── Inicialización ───────────────────────────────────────
onMounted(async () => {
  await cajaStore.fetchTurnoActivo()
  await posStore.sincronizarCatalogo()

  // Cargar productos destacados (Dexie)
  productosDestacados.value = await db.productos.limit(20).toArray()

  // Auto-focus en el input de búsqueda
  nextTick(() => searchInputRef.value?.focus())

  // Monitorear estado de red
  window.addEventListener('online', onConectado)
  window.addEventListener('offline', () => { isOnline.value = false })
})

onUnmounted(() => {
  window.removeEventListener('online', onConectado)
  window.removeEventListener('offline', () => {})
})

async function onConectado() {
  isOnline.value = true
  await sincronizarColaOffline()
}

// ─── Búsqueda ─────────────────────────────────────────────
async function onBusqueda() {
  await posStore.buscarProductos(posStore.busqueda)
}

function onEnterBusqueda() {
  if (posStore.resultados.length === 1) {
    const prod = posStore.resultados[0]
    if (prod) {
      seleccionarProducto(prod)
    }
  }
}

function limpiarBusqueda() {
  posStore.busqueda = ''
  posStore.resultados.length = 0
  posStore.vaciarCarrito()
}

function seleccionarProducto(prod: ProductoLocal) {
  if (prod.stock === 0) {
    toast.add({ severity: 'warn', summary: 'Sin stock', detail: `"${prod.nombre}" no tiene stock disponible`, life: 3000 })
    return
  }
  posStore.agregarItem(prod)
  nextTick(() => searchInputRef.value?.focus())

  // Beep de confirmación (feedback auditivo)
  try {
    const ctx = new AudioContext()
    const oscillator = ctx.createOscillator()
    const gainNode = ctx.createGain()
    oscillator.connect(gainNode)
    gainNode.connect(ctx.destination)
    oscillator.frequency.setValueAtTime(880, ctx.currentTime)
    gainNode.gain.setValueAtTime(0.1, ctx.currentTime)
    gainNode.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.1)
    oscillator.start()
    oscillator.stop(ctx.currentTime + 0.1)
  } catch (_) {}
}

// ─── Cobro ────────────────────────────────────────────────
function cobrar() {
  if (posStore.carrito.length === 0) return
  mostrarConfirmacion.value = true
}

async function confirmarCobro() {
  try {
    const turnoId = cajaStore.turnoActivo?.id ?? null
    await posStore.registrarVenta(turnoId, metodoPago.value)
    mostrarConfirmacion.value = false
    const label = turnoId ? '¡Venta registrada!' : 'Venta fuera de turno registrada'
    toast.add({
      severity: 'success',
      summary: label,
      detail: `Total cobrado: ${formatMonto(posStore.total || 0)}`,
      life: 4000
    })
    nextTick(() => searchInputRef.value?.focus())
  } catch (err: any) {
    if (err.message === 'OFFLINE') {
      toast.add({
        severity: 'warn',
        summary: 'Venta guardada localmente',
        detail: 'Sin conexión. La venta se enviará al servidor cuando vuelva el internet.',
        life: 6000
      })
      mostrarConfirmacion.value = false
    } else {
      toast.add({ severity: 'error', summary: 'Error', detail: err.message, life: 5000 })
    }
  }
}

function confirmarVaciar() {
  posStore.vaciarCarrito()
}

// ─── Sincronización offline ───────────────────────────────
async function sincronizarColaOffline() {
  const pendientes = await db.ventas_offline.where({ sync_status: 'pending' }).toArray()
  if (pendientes.length === 0) return

  const supabase = useSupabaseClient<Database>()
  for (const venta of pendientes) {
    try {
      const { error } = await supabase.rpc('registrar_venta', {
        p_id_turno: venta.turno_id,
        p_subtotal: venta.subtotal,
        p_impuestos: 0,
        p_descuentos: 0,
        p_total: venta.total,
        p_metodo_pago: 'efectivo',
        p_items: venta.detalles
      })
      if (!error) {
        await db.ventas_offline.update(venta.id!, { sync_status: 'synced' })
      }
    } catch (_) {}
  }

  const sincronizadas = pendientes.filter(v => v.sync_status === 'synced').length
  if (sincronizadas > 0) {
    toast.add({ severity: 'info', summary: 'Ventas sincronizadas', detail: `${sincronizadas} venta(s) offline enviadas al servidor`, life: 5000 })
  }
}

// ─── Atajos de teclado ────────────────────────────────────
function onKeydown(e: KeyboardEvent) {
  if (e.key === 'F2') { e.preventDefault(); cobrar() }
  if (e.key === 'Escape') { e.preventDefault(); limpiarBusqueda() }
}

onMounted(() => document.addEventListener('keydown', onKeydown))
onUnmounted(() => document.removeEventListener('keydown', onKeydown))

// ─── Helpers ──────────────────────────────────────────────
</script>

<style scoped>
/* ─── Badge fuera de turno ─── */
.pos-fuera-turno-badge {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  padding: 0.5rem 1rem;
  background: rgba(245, 158, 11, 0.1);
  border: 1px solid rgba(245, 158, 11, 0.3);
  border-radius: 0.5rem;
  color: #fbbf24;
  font-size: 0.85rem;
  position: absolute;
  top: 0.75rem;
  left: 50%;
  transform: translateX(-50%);
  z-index: 10;
  white-space: nowrap;
}

/* ─── Layout principal ─── */
.pos-layout {
  display: flex;
  height: 100vh;
  overflow: hidden;
  background: var(--bg-app);
}

/* ─── Panel izquierdo ─── */
.pos-panel-left {
  flex: 1;
  display: flex;
  flex-direction: column;
  padding: 1.5rem;
  border-right: 1px solid var(--border-subtle);
  overflow-y: auto;
}

.pos-search-bar {
  display: flex;
  align-items: center;
  gap: 1rem;
  margin-bottom: 1.25rem;
}

.pos-search-wrapper {
  position: relative;
  flex: 1;
}

.pos-search-icon {
  position: absolute;
  left: 1rem;
  top: 50%;
  transform: translateY(-50%);
  color: #6366f1;
  font-size: 1.2rem;
  pointer-events: none;
}

.pos-search-spinner {
  position: absolute;
  right: 1rem;
  top: 50%;
  transform: translateY(-50%);
  color: #6366f1;
}

.pos-search-input {
  width: 100%;
  padding: 0.9rem 1rem 0.9rem 3rem;
  background: var(--bg-surface);
  border: 2px solid var(--border-sidebar);
  border-radius: 0.875rem;
  color: var(--text-app);
  font-size: 1.05rem;
  outline: none;
  transition: all 0.2s ease;
  font-family: inherit;
}

.pos-search-input:focus {
  border-color: rgba(99, 102, 241, 0.6);
  box-shadow: 0 0 0 3px rgba(99, 102, 241, 0.15);
}

.pos-search-input::placeholder {
  color: #475569;
}

.pos-offline-badge {
  display: flex;
  align-items: center;
  gap: 0.4rem;
  padding: 0.45rem 0.875rem;
  border-radius: 2rem;
  background: rgba(250, 204, 21, 0.1);
  border: 1px solid rgba(250, 204, 21, 0.3);
  color: #facc15;
  font-size: 0.8rem;
  font-weight: 600;
  white-space: nowrap;
}

/* ─── Resultados ─── */
.pos-resultados {
  background: var(--bg-surface);
  border: 1px solid var(--border-sidebar);
  box-shadow: 0 10px 25px -5px rgba(0, 0, 0, 0.1);
  border-radius: 0.875rem;
  overflow: hidden;
  margin-bottom: 1rem;
}

.pos-resultado-item {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 0.875rem 1.25rem;
  cursor: pointer;
  border-bottom: 1px solid rgba(99, 102, 241, 0.08);
  transition: background 0.15s ease;
}

.pos-resultado-item:last-child {
  border-bottom: none;
}

.pos-resultado-item:hover,
.pos-resultado-item--first {
  background: rgba(99, 102, 241, 0.1);
}

.pos-resultado-thumb {
  width: 40px;
  height: 40px;
  border-radius: 0.5rem;
  object-fit: cover;
  flex-shrink: 0;
}

.pos-resultado-thumb--empty {
  display: flex;
  align-items: center;
  justify-content: center;
  background: rgba(99, 102, 241, 0.1);
  color: var(--text-muted);
  font-size: 1rem;
}

.pos-resultado-info {
  display: flex;
  flex-direction: column;
  gap: 0.2rem;
  flex: 1;
}

.pos-resultado-nombre {
  font-weight: 600;
  color: var(--text-app);
  font-size: 0.95rem;
}

.pos-resultado-sku {
  font-size: 0.75rem;
  color: #475569;
  font-family: monospace;
}

.pos-resultado-derecha {
  display: flex;
  align-items: center;
  gap: 0.75rem;
}

.pos-resultado-precio {
  font-weight: 700;
  color: #4ade80;
  font-size: 1rem;
}

/* ─── Catálogo rápido ─── */
.pos-catalogo {
  flex: 1;
}

.pos-catalogo-title {
  font-size: 0.8rem;
  text-transform: uppercase;
  letter-spacing: 0.08em;
  color: #334155;
  font-weight: 600;
  margin: 0 0 0.75rem;
}

.pos-catalogo-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(160px, 1fr));
  gap: 0.625rem;
}

.pos-catalogo-item {
  background: var(--bg-surface);
  border: 1px solid var(--border-subtle);
  border-radius: 0.75rem;
  padding: 0.875rem;
  cursor: pointer;
  text-align: center;
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 0.5rem;
  transition: all 0.2s ease;
  font-family: inherit;
}

.pos-catalogo-img {
  width: 60px;
  height: 60px;
  border-radius: 0.5rem;
  object-fit: cover;
  flex-shrink: 0;
}

.pos-catalogo-img--empty {
  display: flex;
  align-items: center;
  justify-content: center;
  background: rgba(99, 102, 241, 0.08);
  color: var(--text-muted);
  font-size: 1.5rem;
}

.pos-catalogo-item:hover:not(:disabled) {
  background: rgba(99, 102, 241, 0.12);
  border-color: rgba(99, 102, 241, 0.3);
  transform: translateY(-2px);
}

.pos-catalogo-item:disabled {
  opacity: 0.4;
  cursor: not-allowed;
}

.pos-catalogo-nombre {
  font-size: 0.875rem;
  font-weight: 600;
  color: var(--text-app);
  line-height: 1.3;
}

.pos-catalogo-precio {
  font-size: 0.95rem;
  font-weight: 700;
  color: #4ade80;
}

.pos-vacio {
  flex: 1;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 1rem;
  color: #334155;
}

/* ─── Panel derecho: Carrito ─── */
.pos-panel-right {
  width: 380px;
  flex-shrink: 0;
  display: flex;
  flex-direction: column;
  background: var(--bg-surface);
  border-left: 1px solid var(--border-subtle);
}

.pos-carrito-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 1.25rem 1.5rem;
  border-bottom: 1px solid var(--border-subtle);
}

.pos-carrito-title {
  display: flex;
  align-items: center;
  gap: 0.6rem;
  font-size: 1rem;
  font-weight: 700;
  color: #e2e8f0;
  margin: 0;
}

.pos-carrito-badge {
  background: #6366f1;
  color: white;
  border-radius: 2rem;
  padding: 0.1rem 0.5rem;
  font-size: 0.75rem;
  font-weight: 700;
}

.pos-carrito-items {
  flex: 1;
  overflow-y: auto;
  padding: 0.75rem 1rem;
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
}

.pos-item {
  display: flex;
  align-items: center;
  gap: 0.75rem;
  padding: 0.75rem 0.875rem;
  background: var(--bg-app);
  border: 1px solid var(--border-subtle);
  border-radius: 0.75rem;
  transition: all 0.2s ease;
}

.pos-item:hover {
  background: rgba(30, 41, 59, 0.8);
}

.pos-item-info {
  flex: 1;
  display: flex;
  flex-direction: column;
  gap: 0.15rem;
  overflow: hidden;
}

.pos-item-nombre {
  font-size: 0.875rem;
  font-weight: 600;
  color: var(--text-app);
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.pos-item-sku {
  font-size: 0.7rem;
  color: #475569;
  font-family: monospace;
}

.pos-item-controles {
  display: flex;
  align-items: center;
  gap: 0.35rem;
  background: rgba(15, 23, 42, 0.6);
  border: 1px solid rgba(99, 102, 241, 0.15);
  border-radius: 2rem;
  padding: 0.2rem;
}

.pos-item-btn {
  width: 1.6rem;
  height: 1.6rem;
  border-radius: 50%;
  border: none;
  background: transparent;
  color: #94a3b8;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 0.65rem;
  transition: all 0.15s ease;
}

.pos-item-btn:hover {
  background: rgba(99, 102, 241, 0.2);
  color: #a5b4fc;
}

.pos-item-cantidad {
  font-weight: 700;
  color: #f1f5f9;
  font-size: 0.875rem;
  min-width: 1.5rem;
  text-align: center;
}

.pos-item-precio-col {
  display: flex;
  align-items: center;
  gap: 0.5rem;
}

.pos-item-precio {
  font-size: 0.875rem;
  font-weight: 700;
  color: #4ade80;
  white-space: nowrap;
}

.pos-item-eliminar {
  width: 1.4rem;
  height: 1.4rem;
  border-radius: 50%;
  border: none;
  background: rgba(248, 113, 113, 0.1);
  color: #f87171;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 0.6rem;
  transition: all 0.15s ease;
}

.pos-item-eliminar:hover {
  background: rgba(248, 113, 113, 0.25);
}

.pos-carrito-vacio {
  flex: 1;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 0.75rem;
  color: var(--text-muted);
  font-size: 0.875rem;
}

.pos-carrito-vacio .pi {
  font-size: 2.5rem;
}

/* ─── Footer carrito ─── */
.pos-carrito-footer {
  padding: 1.25rem 1.5rem;
  border-top: 1px solid var(--border-subtle);
  display: flex;
  flex-direction: column;
  gap: 1rem;
}

.pos-total-row {
  display: flex;
  align-items: center;
  justify-content: space-between;
}

.pos-total-label {
  font-size: 0.875rem;
  color: var(--text-muted);
  font-weight: 600;
  text-transform: uppercase;
  letter-spacing: 0.06em;
}

.pos-total-monto {
  font-size: 1.75rem;
  font-weight: 800;
  color: var(--text-app);
  letter-spacing: -0.03em;
}

.pos-metodo-pago {
  display: flex;
  gap: 0.4rem;
}

.pos-metodo-btn {
  flex: 1;
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 0.25rem;
  padding: 0.5rem 0.25rem;
  border-radius: 0.6rem;
  border: 1px solid var(--border-sidebar);
  background: var(--bg-app);
  color: var(--text-muted);
  font-size: 0.7rem;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.2s ease;
  font-family: inherit;
}

.pos-metodo-btn .pi {
  font-size: 1rem;
}

.pos-metodo-btn:hover {
  background: rgba(99, 102, 241, 0.1);
  color: #94a3b8;
}

.pos-metodo-btn--activo {
  background: rgba(99, 102, 241, 0.1) !important;
  border-color: var(--color-brand-primary) !important;
  color: var(--color-brand-primary) !important;
}

:deep(.pos-cobrar-btn) {
  width: 100%;
  background: linear-gradient(135deg, #22c55e, #16a34a) !important;
  border: none !important;
  border-radius: 0.75rem !important;
  font-size: 1rem !important;
  font-weight: 700 !important;
  box-shadow: 0 4px 15px rgba(34, 197, 94, 0.3) !important;
  transition: all 0.2s ease !important;
}

:deep(.pos-cobrar-btn:hover:not(:disabled)) {
  transform: translateY(-2px) !important;
  box-shadow: 0 6px 20px rgba(34, 197, 94, 0.45) !important;
}

:deep(.pos-cobrar-btn:disabled) {
  opacity: 0.4 !important;
}

:deep(.pos-btn-cta) {
  background: linear-gradient(135deg, #6366f1, #8b5cf6) !important;
  border: none !important;
  border-radius: 0.7rem !important;
  font-weight: 600 !important;
}

/* ─── Diálogo confirmación ─── */
.dialog-body {
  padding: 0.5rem 0;
}

.confirm-total {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 0.35rem;
  padding: 1.5rem;
  background: var(--bg-app);
  border-radius: 0.75rem;
  margin-bottom: 1rem;
}

.confirm-total-label {
  font-size: 0.8rem;
  color: #64748b;
  text-transform: uppercase;
  letter-spacing: 0.06em;
}

.confirm-total-monto {
  font-size: 2.5rem;
  font-weight: 800;
  color: #4ade80;
  letter-spacing: -0.04em;
}

.confirm-metodo {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 0.5rem;
  color: var(--text-muted);
  font-size: 0.9rem;
}

/* ─── Transiciones ─── */
.slide-down-enter-active,
.slide-down-leave-active {
  transition: all 0.2s ease;
}

.slide-down-enter-from,
.slide-down-leave-to {
  opacity: 0;
  transform: translateY(-8px);
}

.cart-item-enter-active,
.cart-item-leave-active {
  transition: all 0.25s ease;
}

.cart-item-enter-from {
  opacity: 0;
  transform: translateX(20px);
}

.cart-item-leave-to {
  opacity: 0;
  transform: translateX(-20px);
}
</style>
