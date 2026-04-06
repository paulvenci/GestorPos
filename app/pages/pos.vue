<template>
  <div class="pos-layout">

    <!-- ═══ PANEL IZQUIERDO: Búsqueda y productos ═══ -->
    <div class="pos-panel-left">

      <!-- Barra de búsqueda (auto-focus para scanner) -->
      <div class="pos-search-bar">
        <div class="pos-search-input-wrap">
          <div class="p-inputgroup flex-1">
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
            <Button icon="pi pi-camera" class="pos-scan-btn" severity="secondary" text @click="abrirScanner" title="Escanear código de barras" />
          </div>
          <span v-if="posStore.buscando" class="pos-search-spinner">
            <i class="pi pi-spin pi-spinner" />
          </span>
        </div>
        <Button
          icon="pi pi-plus"
          severity="info"
          aria-label="Nuevo Producto"
          class="pos-add-btn"
          @click="pedirAutorizacion"
          title="Ingresar Nuevo Producto"
        />
      </div>

        <!-- Badge offline -->
        <div v-if="!isOnline" class="pos-offline-badge">
          <i class="pi pi-wifi-off" />
          Modo Offline
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
            :disabled="!prod.es_pesable && prod.stock === 0"
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
              <button v-if="!item.es_pesable" class="pos-item-btn" @click="posStore.setCantidad(item.id_producto, item.cantidad - 1)">
                <i class="pi pi-minus" />
              </button>
              <span class="pos-item-cantidad">{{ item.es_pesable ? item.cantidad.toFixed(3) + ' kg' : item.cantidad }}</span>
              <button v-if="!item.es_pesable" class="pos-item-btn" @click="posStore.setCantidad(item.id_producto, item.cantidad + 1)">
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
        :loading="posStore.procesando || confirmandoCobro"
        :disabled="confirmandoCobro"
        class="pos-btn-cta"
        @click="confirmarCobro"
      />
    </template>
  </Dialog>

  <!-- Modal Modalidad de Peso -->
  <Dialog v-model:visible="mostrarModalPeso" header="Producto por Peso" :modal="true" :style="{ width: '400px' }" @hide="cerrarModalPeso">
    <div class="p-2 flex flex-col gap-4">
      <div>
         <h3 class="font-bold text-lg text-slate-800 dark:text-white">{{ productoPendientePeso?.nombre }}</h3>
         <p class="text-slate-500 text-sm">Precio por Kg/Base: {{ formatMonto(productoPendientePeso?.precio || 0) }}</p>
      </div>
      <div>
         <label class="block text-sm font-medium mb-1">Ingresar Peso (Kg)</label>
         <InputNumber
           v-model="cantidadPesoCalculada"
           locale="en-US"
           :useGrouping="false"
           :minFractionDigits="3"
           :maxFractionDigits="3"
           :step="0.05"
           class="w-full"
           autofocus
           @update:modelValue="onCambioPeso"
           @keydown.enter="confirmarPeso"
         />
      </div>
      <div>
         <label class="block text-sm font-medium mb-1">Ingresar Precio Total</label>
         <InputNumber
           v-model="precioPesadoCalculado"
           mode="currency"
           currency="CLP"
           locale="es-CL"
           :maxFractionDigits="0"
           class="w-full"
           @update:modelValue="onCambioTotal"
           @keydown.enter="confirmarPeso"
         />
      </div>
      <div class="pos-peso-total-box">
         <span class="block text-xs uppercase pos-peso-total-label mb-1">Total a cobrar</span>
         <span class="text-2xl font-black pos-peso-total-value">{{ formatMonto(totalPesoCalculado) }}</span>
      </div>
    </div>
    <template #footer>
      <Button label="Cancelar" text severity="secondary" @click="cerrarModalPeso" />
      <Button label="Agregar" icon="pi pi-check" @click="confirmarPeso" :disabled="totalPesoCalculado <= 0 || !cantidadPesoCalculada || cantidadPesoCalculada <= 0" />
    </template>
  </Dialog>

  <!-- Modal Autorización PIN -->
  <Dialog v-model:visible="mostrarModalAuth" header="Autorización Requerida" :modal="true" :style="{ width: '350px' }" @hide="authPin = ''">
    <div class="p-2 flex flex-col gap-3">
      <p class="text-sm text-slate-500">Un supervisor o administrador debe ingresar su PIN para autorizar la creación de productos.</p>
      <div class="p-inputgroup mt-2">
         <InputText v-model="authPin" type="password" placeholder="Ingresar PIN" @keydown.enter="validarPin" autofocus />
         <Button icon="pi pi-unlock" @click="validarPin" :loading="validandoPin" />
      </div>
    </div>
  </Dialog>

  <!-- Modal Producto Rápido (Tras Autorización) -->
  <Dialog v-model:visible="mostrarModalNuevoProd" header="Crear Producto Rápido" :modal="true" :style="{ width: '450px' }">
    <div class="flex flex-col gap-4 p-2">
      <div class="field">
         <label class="block text-sm mb-1">Nombre</label>
         <InputText v-model="nuevoProdRapido.nombre" class="w-full" autofocus />
      </div>
      <div class="grid grid-cols-2 gap-4">
         <div class="field">
           <label class="block text-sm mb-1">Costo</label>
           <InputNumber v-model="nuevoProdRapido.costo" mode="currency" currency="CLP" locale="es-CL" :maxFractionDigits="0" class="w-full" />
         </div>
         <div class="field">
           <label class="block text-sm mb-1">Precio de Venta</label>
           <InputNumber v-model="nuevoProdRapido.precio" mode="currency" currency="CLP" locale="es-CL" :maxFractionDigits="0" class="w-full" />
         </div>
      </div>
    </div>
    <template #footer>
      <Button label="Cancelar" text @click="mostrarModalNuevoProd = false" />
      <Button label="Crear y Agregar" icon="pi pi-plus" @click="crearProductoRapido" :loading="creandoProd" />
    </template>
  </Dialog>

  <!-- Modal Scanner -->
  <Dialog v-model:visible="mostrarScanner" header="Escanear Código" :modal="true" :style="{ width: '400px' }" @hide="cerrarScanner">
    <div class="flex flex-col items-center justify-center p-2">
      <div class="relative w-full rounded overflow-hidden bg-black aspect-video flex items-center justify-center">
        <video ref="videoScannerRef" class="w-full h-full object-cover" autoplay muted playsinline></video>
        <div class="absolute inset-x-4 top-1/2 h-0.5 bg-red-500 shadow-[0_0_8px_rgba(239,68,68,0.8)] animate-pulse"></div>
      </div>
      <p class="mt-4 text-center text-sm text-slate-500">Apunta la cámara al código de barras.</p>
    </div>
  </Dialog>

</template>

<script setup lang="ts">
import { useToast } from 'primevue/usetoast'
import { useAuthStore } from '~/stores/auth'
import { useCajaStore } from '~/stores/caja'
import { usePosStore } from '~/stores/pos'
import { useFormatMonto } from '~/composables/useFormatMonto'
import { db } from '~/db'
import type { ProductoLocal } from '~/db'
import type { Database } from '~/types/database.types'
import { BrowserMultiFormatReader, type IScannerControls } from '@zxing/browser'
import { BarcodeFormat, DecodeHintType } from '@zxing/library'

const authStore = useAuthStore()
const cajaStore = useCajaStore()
const posStore = usePosStore()
const toast = useToast()
const { formatMonto } = useFormatMonto()
const ultimosToasts = new Map<string, number>()

function addToastUnico(
  payload: { severity: string; summary: string; detail: string; life?: number },
  key?: string,
  ventanaMs = 1500
) {
  const k = key || `${payload.severity}|${payload.summary}|${payload.detail}`
  const now = Date.now()
  const prev = ultimosToasts.get(k) || 0
  if (now - prev < ventanaMs) return
  ultimosToasts.set(k, now)
  toast.add(payload)
}

// ─── Refs ─────────────────────────────────────────────────
const searchInputRef = ref<HTMLInputElement | null>(null)
const mostrarConfirmacion = ref(false)
const confirmandoCobro = ref(false)
const metodoPago = ref('efectivo')
const isOnline = ref(import.meta.client ? navigator.onLine : true)
const productosDestacados = ref<ProductoLocal[]>([])
const onDesconectado = () => { isOnline.value = false }

const metodosPago = [
  { value: 'efectivo', label: 'Efectivo', icon: 'pi pi-money-bill' },
  { value: 'tarjeta', label: 'Tarjeta', icon: 'pi pi-credit-card' },
  { value: 'transferencia', label: 'Transferencia', icon: 'pi pi-send' }
]

type TicketItem = {
  nombre: string
  sku: string
  cantidad: number
  precio: number
  descuento: number
  subtotal: number
}

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
  window.addEventListener('offline', onDesconectado)
})

onUnmounted(() => {
  window.removeEventListener('online', onConectado)
  window.removeEventListener('offline', onDesconectado)
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

// ─── Lógica Producto por Peso ────────
const mostrarModalPeso = ref(false)
const productoPendientePeso = ref<ProductoLocal | null>(null)
const cantidadPesoCalculada = ref(0)
const precioPesadoCalculado = ref(0)
let origenEdicionPeso: 'peso' | 'total' | null = null

const totalPesoCalculado = computed(() => Math.max(0, precioPesadoCalculado.value || 0))

function redondearKg(value: number) {
  return Math.round(value * 1000) / 1000
}

function redondearClp(value: number) {
  return Math.round(value)
}

function onCambioPeso(value: number | null | undefined) {
  if (!productoPendientePeso.value || origenEdicionPeso === 'total') return
  origenEdicionPeso = 'peso'
  const peso = Math.max(0, Number(value) || 0)
  cantidadPesoCalculada.value = redondearKg(peso)
  precioPesadoCalculado.value = redondearClp(productoPendientePeso.value.precio * cantidadPesoCalculada.value)
  origenEdicionPeso = null
}

function onCambioTotal(value: number | null | undefined) {
  if (!productoPendientePeso.value || origenEdicionPeso === 'peso') return
  origenEdicionPeso = 'total'
  const total = Math.max(0, Number(value) || 0)
  precioPesadoCalculado.value = redondearClp(total)
  const precioBase = Number(productoPendientePeso.value.precio) || 0
  cantidadPesoCalculada.value = precioBase > 0 ? redondearKg(precioPesadoCalculado.value / precioBase) : 0
  origenEdicionPeso = null
}

function seleccionarProducto(prod: ProductoLocal) {
  if (prod.es_pesable) {
    productoPendientePeso.value = prod
    cantidadPesoCalculada.value = 1
    precioPesadoCalculado.value = redondearClp(prod.precio * cantidadPesoCalculada.value)
    mostrarModalPeso.value = true
    return
  }

  if (prod.stock === 0) {
    toast.add({ severity: 'warn', summary: 'Sin stock', detail: `"${prod.nombre}" no tiene stock disponible`, life: 3000 })
    return
  }

  posStore.agregarItem(prod)
  nextTick(() => searchInputRef.value?.focus())
  playBeep()
}

function confirmarPeso() {
  if (productoPendientePeso.value && cantidadPesoCalculada.value > 0) {
     posStore.agregarItem(productoPendientePeso.value, cantidadPesoCalculada.value, productoPendientePeso.value.precio)
     playBeep()
  }
  cerrarModalPeso()
  nextTick(() => searchInputRef.value?.focus())
}

function cerrarModalPeso() {
  mostrarModalPeso.value = false
  productoPendientePeso.value = null
  cantidadPesoCalculada.value = 0
  precioPesadoCalculado.value = 0
  origenEdicionPeso = null
}

function playBeep() {
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

// ─── Lógica Scanner ───
const mostrarScanner = ref(false)
const videoScannerRef = ref<HTMLVideoElement | null>(null)
let codeReader: BrowserMultiFormatReader | null = null
let activeStream: MediaStream | null = null
let scannerControls: IScannerControls | null = null
let detectorInterval: ReturnType<typeof setInterval> | null = null
let scannerResultadoProcesado = false

async function abrirScanner() {
  if (mostrarScanner.value) return
  scannerResultadoProcesado = false

  mostrarScanner.value = true
  await nextTick()
  
  if (!codeReader) {
    const hints = new Map()
    const formats = [
      BarcodeFormat.CODE_128,
      BarcodeFormat.EAN_13,
      BarcodeFormat.EAN_8,
      BarcodeFormat.QR_CODE,
      BarcodeFormat.CODE_39,
      BarcodeFormat.UPC_A,
      BarcodeFormat.UPC_E,
      BarcodeFormat.ITF,
      BarcodeFormat.CODABAR,
      BarcodeFormat.CODE_93
    ]
    hints.set(DecodeHintType.POSSIBLE_FORMATS, formats)
    hints.set(DecodeHintType.TRY_HARDER, true)
    codeReader = new BrowserMultiFormatReader(hints, {
      delayBetweenScanAttempts: 100,
      delayBetweenScanSuccess: 500,
      tryPlayVideoTimeout: 5000
    })
  }
  
  if (!videoScannerRef.value) {
    toast.add({ severity: 'error', summary: 'Error', detail: 'No se pudo inicializar el visor de cámara', life: 3000 })
    cerrarScanner()
    return
  }

  try {
    scannerControls = await codeReader.decodeFromConstraints(
      {
        video: {
          facingMode: { ideal: 'environment' },
          width: { ideal: 1920 },
          height: { ideal: 1080 }
        }
      },
      videoScannerRef.value,
      (result, error) => {
        if (result && mostrarScanner.value) {
          if (scannerResultadoProcesado) return
          const sku = result.getText().trim()
          if (!sku) return
          scannerResultadoProcesado = true

          posStore.busqueda = sku
          addToastUnico({ severity: 'info', summary: 'Escaneado', detail: sku, life: 2000 }, `scan-ok-${sku}`)
          db.productos.where('sku').equals(sku).first().then(producto => {
            if (producto) {
              seleccionarProducto(producto)
            } else {
              addToastUnico({ severity: 'warn', summary: 'No encontrado', detail: `El SKU ${sku} no existe`, life: 3000 }, `scan-miss-${sku}`)
            }
            cerrarScanner()
          })
          return
        }

        if (error && (error as any).name === 'NotFoundException') return
      }
    )

    if ((window as any).BarcodeDetector) {
      try {
        const BarcodeDetectorCtor = (window as any).BarcodeDetector
        const supported = await BarcodeDetectorCtor.getSupportedFormats?.()
        const preferred = ['ean_13', 'ean_8', 'upc_a', 'upc_e', 'code_128', 'code_39', 'itf', 'codabar', 'qr_code']
        const formats = Array.isArray(supported) ? preferred.filter((f) => supported.includes(f)) : preferred
        const detector = new BarcodeDetectorCtor({ formats })

        detectorInterval = setInterval(async () => {
          if (!mostrarScanner.value || !videoScannerRef.value) return
          if (videoScannerRef.value.readyState < 2) return

          try {
            const barcodes = await detector.detect(videoScannerRef.value)
            const raw = barcodes?.[0]?.rawValue?.trim()
            if (!raw) return
            if (scannerResultadoProcesado) return
            scannerResultadoProcesado = true

            posStore.busqueda = raw
            addToastUnico({ severity: 'info', summary: 'Escaneado', detail: raw, life: 2000 }, `scan-ok-${raw}`)
            const producto = await db.productos.where('sku').equals(raw).first()
            if (producto) {
              seleccionarProducto(producto)
            } else {
              addToastUnico({ severity: 'warn', summary: 'No encontrado', detail: `El SKU ${raw} no existe`, life: 3000 }, `scan-miss-${raw}`)
            }
            cerrarScanner()
          } catch (_) {}
        }, 250)
      } catch (_) {}
    }

    // Capturar el stream para poder cerrarlo manualmente
    if (videoScannerRef.value.srcObject instanceof MediaStream) {
      activeStream = videoScannerRef.value.srcObject
    }

  } catch (err) {
    console.error('Error al iniciar scanner:', err)
    toast.add({ severity: 'error', summary: 'Error de Cámara', detail: 'No se pudo acceder a la cámara.', life: 3000 })
    cerrarScanner()
  }
}

function cerrarScanner() {
  mostrarScanner.value = false
  scannerResultadoProcesado = true

  if (detectorInterval) {
    clearInterval(detectorInterval)
    detectorInterval = null
  }

  if (scannerControls) {
    try {
      scannerControls.stop()
    } catch (_) {}
    scannerControls = null
  }

  if (codeReader) {
    try {
      codeReader.reset()
    } catch (e) { /* ignore */ }
  }

  if (activeStream) {
    activeStream.getTracks().forEach(track => {
      track.stop()
    })
    activeStream = null
  }

  if (videoScannerRef.value) {
    if (videoScannerRef.value.srcObject instanceof MediaStream) {
      videoScannerRef.value.srcObject.getTracks().forEach(t => t.stop())
    }
    videoScannerRef.value.srcObject = null
  }
}

// Watcher para limpieza garantizada si se cierra el modal por cualquier motivo
watch(mostrarScanner, (val) => {
    if (!val) {
        cerrarScanner()
    }
})

// ─── Lógica Autorización y Creación Rápida ───
const mostrarModalAuth = ref(false)
const authPin = ref('')
const validandoPin = ref(false)

const mostrarModalNuevoProd = ref(false)
const nuevoProdRapido = ref<Partial<ProductoLocal>>({ nombre: '', costo: 0, precio: 0 })
const creandoProd = ref(false)

function pedirAutorizacion() {
  const esAdminLogeado = authStore.rolUsuario === 'admin'
  if (esAdminLogeado) {
    nuevoProdRapido.value = { nombre: '', costo: 0, precio: 0 }
    mostrarModalNuevoProd.value = true
    return
  }
  authPin.value = ''
  mostrarModalAuth.value = true
}

async function validarPin() {
  if (!authPin.value) return
  validandoPin.value = true
  
  try {
    // Buscar un admin que tenga ese PIN (asumiremos que existe una columna 'pin' en la tabla 'perfiles' o usar auth)
    // Para motivos de esta demo, usaremos un hardcode PIN de Supervisor = '1234' o verificaremos en la de BD.
    // Como no podemos modificar la BD de auth facilmente aqui para guardar un "pin" usaremos un query a perfiles asumiendo.
    // Por simplicidad en esta demo, validaremos un PIN "1234" o admin
    const supabase = useSupabaseClient<Database>()
    const { data: userData } = await supabase.auth.getUser()
    
    // Si tienes backend auth real para PIN, poner la llamada هنا.
    // Dejaremos un PIN de demo "1234" y además la API normal por si estuviese logueado un admin ya.
    
    const esAdminLogeado = authStore.rolUsuario === 'admin' || authStore.rolUsuario === 'supervisor'
    
    if (authPin.value === '1234' || esAdminLogeado) {
       mostrarModalAuth.value = false
       nuevoProdRapido.value = { nombre: '', costo: 0, precio: 0 }
       mostrarModalNuevoProd.value = true
       toast.add({ severity: 'success', summary: 'Autorizado', detail: 'Puedes crear un producto nuevo', life: 2000 })
    } else {
       toast.add({ severity: 'error', summary: 'Denegado', detail: 'PIN incorrecto', life: 3000 })
    }
  } finally {
    validandoPin.value = false
  }
}

async function crearProductoRapido() {
  if (!nuevoProdRapido.value.nombre || (nuevoProdRapido.value.precio || 0) <= 0) return
  creandoProd.value = true
  try {
     const prodParaCrear: any = {
       nombre: nuevoProdRapido.value.nombre,
       costo: nuevoProdRapido.value.costo,
       precio: nuevoProdRapido.value.precio,
       stock: 100, // stock infinito para temporal
       activo: true,
       sku: 'NVO-' + Date.now().toString().slice(-6),
       es_pesable: false,
       margen_ganancia: 30,
       stock_minimo: 0,
       categoria: 'Rápidos',
       updated_at: new Date().toISOString()
     }
     
     // Guardar local o base (dependiendo modo offline/online)
     const supabase = useSupabaseClient<Database>()
     const { data, error } = await supabase.from('productos').insert(prodParaCrear as any).select().single()
     
     if (data) {
        db.productos.put(data as any)
        posStore.agregarItem(data as any)
     } else {
        // Offline
        prodParaCrear.id = crypto.randomUUID()
        await db.productos.put(prodParaCrear as any)
        posStore.agregarItem(prodParaCrear as any)
     }
     
     toast.add({ severity: 'success', summary: 'Agregado', detail: `Se agregó ${nuevoProdRapido.value.nombre} a la venta`, life: 3000 })
     mostrarModalNuevoProd.value = false
  } catch (err: any) {
     toast.add({ severity: 'error', summary: 'Error', detail: 'No se pudo crear: ' + err.message, life: 3000 })
  } finally {
     creandoProd.value = false
  }
}

// ─── Cobro ────────────────────────────────────────────────
function cobrar() {
  if (posStore.carrito.length === 0) return
  mostrarConfirmacion.value = true
}

async function confirmarCobro() {
  if (confirmandoCobro.value) return
  confirmandoCobro.value = true

  const totalCobrado = posStore.total
  const itemsTicket: TicketItem[] = posStore.carrito.map((item) => ({
    nombre: item.nombre,
    sku: item.sku,
    cantidad: item.cantidad,
    precio: item.precio,
    descuento: item.descuento,
    subtotal: item.precio * item.cantidad * (1 - item.descuento / 100)
  }))
  const fechaTicket = new Date()

  try {
    const turnoId = cajaStore.turnoActivo?.id ?? null
    const ventaId = await posStore.registrarVenta(turnoId, metodoPago.value)
    mostrarConfirmacion.value = false
    const label = turnoId ? '¡Venta registrada!' : 'Venta fuera de turno registrada'
    toast.add({
      severity: 'success',
      summary: label,
      detail: `Total cobrado: ${formatMonto(totalCobrado || 0)}`,
      life: 4000
    })
    imprimirComprobante80mm({
      ventaId: String(ventaId || '').slice(0, 8).toUpperCase() || 'N/A',
      fecha: fechaTicket,
      metodoPago: metodoPago.value,
      items: itemsTicket,
      total: totalCobrado,
      estado: 'emitido'
    })
    nextTick(() => searchInputRef.value?.focus())
  } catch (err: any) {
    const msg = String(err?.message || '')
    if (err.message === 'OFFLINE') {
      toast.add({
        severity: 'warn',
        summary: 'Venta guardada localmente',
        detail: `Sin conexión. Venta (${formatMonto(totalCobrado || 0)}) guardada para sincronizar.`,
        life: 6000
      })
      mostrarConfirmacion.value = false
      imprimirComprobante80mm({
        ventaId: 'PENDIENTE',
        fecha: fechaTicket,
        metodoPago: metodoPago.value,
        items: itemsTicket,
        total: totalCobrado,
        estado: 'pendiente'
      })
    } else if (msg.includes('productos_stock_check') || msg.toLowerCase().includes('stock insuficiente')) {
      toast.add({
        severity: 'warn',
        summary: 'Stock de producto por peso',
        detail: 'Reabre el producto en Inventario y guarda nuevamente para actualizar stock virtual de pesables.',
        life: 6000
      })
    } else {
      toast.add({ severity: 'error', summary: 'Error', detail: err.message, life: 5000 })
    }
  } finally {
    confirmandoCobro.value = false
  }
}

function escapeHtml(value: string) {
  return value
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;')
    .replaceAll('"', '&quot;')
}

function imprimirComprobante80mm(payload: {
  ventaId: string
  fecha: Date
  metodoPago: string
  items: TicketItem[]
  total: number
  estado: 'emitido' | 'pendiente'
}) {
  const printWindow = window.open('', '_blank', 'width=380,height=700')
  if (!printWindow) {
    toast.add({ severity: 'warn', summary: 'Popup bloqueado', detail: 'Permite ventanas emergentes para imprimir comprobante.', life: 4000 })
    return
  }

  const filas = payload.items.map((item) => `
    <tr>
      <td>
        <div class="name">${escapeHtml(item.nombre)}</div>
        <div class="meta">${escapeHtml(item.sku || '-')}</div>
      </td>
      <td class="qty">${item.cantidad.toFixed(item.cantidad % 1 === 0 ? 0 : 3)}</td>
      <td class="money">${formatMonto(item.subtotal)}</td>
    </tr>
  `).join('')

  const estadoHtml = payload.estado === 'pendiente'
    ? '<div class="status">PENDIENTE DE SINCRONIZACION</div>'
    : ''

  const html = `
    <html>
      <head>
        <title>Comprobante ${payload.ventaId}</title>
        <style>
          @page { size: 80mm auto; margin: 2mm; }
          body { font-family: "Courier New", monospace; width: 76mm; margin: 0 auto; color: #111; font-size: 12px; }
          .center { text-align: center; }
          .title { font-weight: 700; font-size: 16px; margin-top: 6px; }
          .line { border-top: 1px dashed #555; margin: 6px 0; }
          .meta { color: #444; font-size: 11px; }
          table { width: 100%; border-collapse: collapse; }
          td { vertical-align: top; padding: 3px 0; }
          td.qty { text-align: center; width: 10mm; }
          td.money { text-align: right; width: 20mm; white-space: nowrap; }
          .name { font-weight: 700; }
          .totals { margin-top: 6px; }
          .totals .row { display: flex; justify-content: space-between; padding: 2px 0; }
          .totals .final { font-size: 15px; font-weight: 800; }
          .status { border: 1px dashed #b45309; color: #92400e; padding: 4px; text-align: center; margin: 6px 0; font-weight: 700; }
        </style>
      </head>
      <body>
        <div class="center title">GESTORPOS</div>
        <div class="center">Comprobante de Venta</div>
        <div class="line"></div>
        <div>ID: ${escapeHtml(payload.ventaId)}</div>
        <div>Fecha: ${payload.fecha.toLocaleString('es-CL')}</div>
        <div>Pago: ${escapeHtml(payload.metodoPago.toUpperCase())}</div>
        ${estadoHtml}
        <div class="line"></div>
        <table>
          ${filas}
        </table>
        <div class="line"></div>
        <div class="totals">
          <div class="row final"><span>TOTAL</span><span>${formatMonto(payload.total)}</span></div>
        </div>
        <div class="line"></div>
        <div class="center meta">Gracias por su compra</div>
        <script>
          window.onload = () => {
            window.print();
            setTimeout(() => window.close(), 700);
          };
        <\/script>
      </body>
    </html>
  `

  printWindow.document.write(html)
  printWindow.document.close()
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
/* ─── Layout principal ─── */
.pos-layout {
  display: flex;
  height: 100%;
  min-height: 0;
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
  min-height: 0;
}

.pos-search-bar {
  display: flex;
  align-items: center;
  gap: 0.75rem;
  margin-bottom: 1.25rem;
  position: sticky;
  top: 0;
  z-index: 8;
  background: var(--bg-app);
  padding-bottom: 0.75rem;
}

.pos-search-input-wrap {
  position: relative;
  flex: 1;
}

.pos-search-icon {
  display: none;
}

.pos-search-spinner {
  position: absolute;
  right: 3.4rem;
  top: 50%;
  transform: translateY(-50%);
  color: #6366f1;
  pointer-events: none;
}

.pos-search-input {
  width: 100%;
  padding: 0.9rem 1rem;
  background: var(--bg-surface);
  border: 2px solid var(--border-sidebar);
  border-radius: 0.875rem;
  color: var(--text-app) !important;
  font-size: 1.05rem;
  outline: none;
  transition: all 0.2s ease;
  font-family: inherit;
}

.p-inputgroup .pos-search-input {
    border-top-right-radius: 0;
    border-bottom-right-radius: 0;
    border-right: none;
}

.pos-scan-btn {
    border-top-right-radius: 0.875rem !important;
    border-bottom-right-radius: 0.875rem !important;
    border: 2px solid var(--border-sidebar) !important;
    border-left: none !important;
    background: var(--bg-surface) !important;
    color: #6366f1 !important;
    padding: 0 1rem !important;
}

.pos-scan-btn:hover {
    background: rgba(99, 102, 241, 0.05) !important;
}

:deep(.pos-add-btn) {
  min-width: 2.85rem !important;
  height: 2.85rem !important;
  border-radius: 0.875rem !important;
  flex-shrink: 0;
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
  overflow: hidden;
  min-height: 0;
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
  min-height: 0;
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

.pos-peso-total-box {
  background: #ecfdf5;
  border: 1px solid #86efac;
  border-radius: 0.75rem;
  padding: 0.85rem;
  text-align: center;
}

.pos-peso-total-label {
  color: #047857;
  font-weight: 700;
  letter-spacing: 0.04em;
}

.pos-peso-total-value {
  color: #064e3b;
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

@media (max-width: 1024px) {
  .pos-layout {
    flex-direction: column;
  }

  .pos-panel-left {
    border-right: none;
    border-bottom: 1px solid var(--border-subtle);
    padding: 1rem;
  }

  .pos-panel-right {
    width: 100%;
    height: 42vh;
    border-left: none;
  }
}

@media (max-width: 768px) {
  .pos-search-bar {
    gap: 0.5rem;
    padding-bottom: 0.5rem;
  }

  :deep(.pos-add-btn) {
    min-width: 2.6rem !important;
    height: 2.6rem !important;
  }

  .pos-search-input {
    font-size: 0.95rem;
    padding: 0.78rem 0.85rem;
  }

  .pos-panel-right {
    height: 48vh;
  }

  .pos-carrito-header,
  .pos-carrito-footer {
    padding-left: 1rem;
    padding-right: 1rem;
  }
}
</style>
