<template>
  <button
    class="consulta-precio-fab"
    type="button"
    aria-label="Consultar precio"
    title="Consultar precio"
    @click="visible = true"
  >
    <i class="pi pi-tag" />
  </button>

  <Dialog
    v-model:visible="visible"
    modal
    header="Consultar precio"
    :style="{ width: 'min(720px, calc(100vw - 2rem))' }"
    class="consulta-precio-dialog"
    @hide="onHide"
  >
    <div class="consulta-precio-body">
      <div class="consulta-precio-search">
        <IconField class="w-full">
          <InputIcon class="pi pi-search" />
          <InputText
            ref="searchInputRef"
            v-model="busqueda"
            fluid
            placeholder="Escribe o escanea un código o nombre..."
            autocomplete="off"
            @input="onBusqueda"
            @keydown.enter.prevent="onEnterBusqueda"
          />
        </IconField>
        <Button
          icon="pi pi-camera"
          severity="secondary"
          outlined
          title="Escanear código"
          @click="abrirScanner"
        />
      </div>

      <div v-if="productoSeleccionado" class="consulta-precio-card">
        <div class="consulta-precio-card-head">
          <div>
            <h3 class="consulta-precio-title">{{ productoSeleccionado.nombre }}</h3>
            <p class="consulta-precio-sku">{{ productoSeleccionado.sku || 'Sin SKU' }}</p>
          </div>
          <Tag
            :value="productoSeleccionado.activo ? 'Activo' : 'Inactivo'"
            :severity="productoSeleccionado.activo ? 'success' : 'secondary'"
          />
        </div>

        <div class="consulta-precio-main">
          <div class="consulta-precio-price">
            <span class="consulta-precio-price-label">Precio de venta</span>
            <strong class="consulta-precio-price-value">{{ formatMonto(productoSeleccionado.precio || 0) }}</strong>
          </div>
          <div class="consulta-precio-meta">
            <div class="consulta-precio-meta-item">
              <span>Stock</span>
              <strong>{{ productoSeleccionado.stock }}</strong>
            </div>
            <div class="consulta-precio-meta-item">
              <span>Costo</span>
              <strong>{{ formatMonto(productoSeleccionado.costo || 0) }}</strong>
            </div>
            <div class="consulta-precio-meta-item">
              <span>Categoría</span>
              <strong>{{ productoSeleccionado.categoria || 'Sin categoría' }}</strong>
            </div>
            <div class="consulta-precio-meta-item">
              <span>Tipo</span>
              <strong>{{ productoSeleccionado.es_pesable ? 'Se vende por peso' : 'Por unidad' }}</strong>
            </div>
          </div>
        </div>
      </div>

      <div v-if="resultados.length > 0" class="consulta-precio-results">
        <button
          v-for="prod in resultados"
          :key="prod.id"
          class="consulta-precio-result"
          type="button"
          @click="seleccionarProducto(prod)"
        >
          <div class="consulta-precio-result-copy">
            <strong>{{ prod.nombre }}</strong>
            <span>{{ prod.sku || 'Sin SKU' }}</span>
          </div>
          <strong class="consulta-precio-result-price">{{ formatMonto(prod.precio || 0) }}</strong>
        </button>
      </div>

      <div v-else-if="busqueda && !buscando" class="consulta-precio-empty">
        No se encontraron productos para esa búsqueda.
      </div>
    </div>

    <template #footer>
      <div class="consulta-precio-footer">
        <Button label="Cerrar" text severity="secondary" @click="visible = false" />
        <Button
          v-if="route.path.startsWith('/pos') && productoSeleccionado && !productoSeleccionado.es_pesable"
          label="Agregar al carrito"
          icon="pi pi-plus"
          @click="agregarAlCarrito"
        />
      </div>
    </template>
  </Dialog>

  <Dialog
    v-model:visible="mostrarScanner"
    modal
    header="Escanear código"
    :style="{ width: 'min(420px, calc(100vw - 2rem))' }"
    @hide="cerrarScanner"
  >
    <div class="consulta-precio-scanner">
      <div class="consulta-precio-scanner-video">
        <video ref="videoScannerRef" autoplay muted playsinline />
        <div class="consulta-precio-scanner-line" />
      </div>
      <p>Apunta la cámara al código de barras.</p>
    </div>
  </Dialog>
</template>

<script setup lang="ts">
import { useToast } from 'primevue/usetoast'
import { BrowserMultiFormatReader, type IScannerControls } from '@zxing/browser'
import { BarcodeFormat, DecodeHintType } from '@zxing/library'
import { db, type ProductoLocal } from '~/db'
import { useFormatMonto } from '~/composables/useFormatMonto'
import { usePosStore } from '~/stores/pos'

const visible = useState<boolean>('consulta-precio-open', () => false)
const toast = useToast()
const route = useRoute()
const posStore = usePosStore()
const { formatMonto } = useFormatMonto()

const busqueda = ref('')
const resultados = ref<ProductoLocal[]>([])
const buscando = ref(false)
const productoSeleccionado = ref<ProductoLocal | null>(null)
const searchInputRef = ref<any>(null)

const mostrarScanner = ref(false)
const videoScannerRef = ref<HTMLVideoElement | null>(null)
let codeReader: BrowserMultiFormatReader | null = null
let activeStream: MediaStream | null = null
let scannerControls: IScannerControls | null = null
let detectorInterval: ReturnType<typeof setInterval> | null = null
let scannerResultadoProcesado = false

watch(visible, async (isOpen) => {
  if (isOpen) {
    await nextTick()
    enfocarBusqueda()
    return
  }

  onHide()
})

watch(mostrarScanner, (isOpen) => {
  if (!isOpen) {
    cerrarScanner()
  }
})

async function onBusqueda() {
  await buscarProductos(busqueda.value)
}

async function buscarProductos(query: string) {
  const normalized = query.trim().toLowerCase()
  if (!normalized) {
    resultados.value = []
    productoSeleccionado.value = null
    return
  }

  buscando.value = true
  try {
    const matches = await db.productos
      .filter((producto) =>
        producto.nombre.toLowerCase().includes(normalized) ||
        producto.sku?.toLowerCase().includes(normalized),
      )
      .limit(20)
      .toArray()

    resultados.value = matches

    const exactMatch = matches.find(
      (producto) => producto.sku?.toLowerCase() === normalized,
    )

    if (exactMatch) {
      productoSeleccionado.value = exactMatch
    } else if (
      productoSeleccionado.value &&
      !matches.some((producto) => producto.id === productoSeleccionado.value?.id)
    ) {
      productoSeleccionado.value = null
    }
  } finally {
    buscando.value = false
  }
}

function onEnterBusqueda() {
  if (resultados.value.length === 1) {
    seleccionarProducto(resultados.value[0]!)
  }
}

function seleccionarProducto(producto: ProductoLocal) {
  productoSeleccionado.value = producto
}

function onHide() {
  busqueda.value = ''
  resultados.value = []
  productoSeleccionado.value = null
  cerrarScanner()
}

function agregarAlCarrito() {
  const producto = productoSeleccionado.value
  if (!producto) return

  posStore.agregarItem(producto)
  toast.add({
    severity: 'success',
    summary: 'Producto agregado',
    detail: `${producto.nombre} se agregó al carrito.`,
    life: 2500,
  })
  visible.value = false
}

async function abrirScanner() {
  if (mostrarScanner.value) return
  scannerResultadoProcesado = false
  mostrarScanner.value = true
  await nextTick()

  if (!codeReader) {
    const hints = new Map()
    hints.set(DecodeHintType.POSSIBLE_FORMATS, [
      BarcodeFormat.CODE_128,
      BarcodeFormat.EAN_13,
      BarcodeFormat.EAN_8,
      BarcodeFormat.QR_CODE,
      BarcodeFormat.CODE_39,
      BarcodeFormat.UPC_A,
      BarcodeFormat.UPC_E,
      BarcodeFormat.ITF,
      BarcodeFormat.CODABAR,
      BarcodeFormat.CODE_93,
    ])
    hints.set(DecodeHintType.TRY_HARDER, true)
    codeReader = new BrowserMultiFormatReader(hints, {
      delayBetweenScanAttempts: 100,
      delayBetweenScanSuccess: 500,
      tryPlayVideoTimeout: 5000,
    })
  }

  if (!videoScannerRef.value) {
    toast.add({
      severity: 'error',
      summary: 'Error',
      detail: 'No se pudo inicializar la cámara.',
      life: 3000,
    })
    cerrarScanner()
    return
  }

  try {
    scannerControls = await codeReader.decodeFromConstraints(
      {
        video: {
          facingMode: { ideal: 'environment' },
          width: { ideal: 1920 },
          height: { ideal: 1080 },
        },
      },
      videoScannerRef.value,
      (result, error) => {
        if (result && mostrarScanner.value) {
          void procesarCodigoEscaneado(result.getText().trim())
          return
        }

        if (error && (error as { name?: string }).name === 'NotFoundException') {
          return
        }
      },
    )

    if ((window as typeof window & { BarcodeDetector?: any }).BarcodeDetector) {
      try {
        const BarcodeDetectorCtor = (window as typeof window & { BarcodeDetector: any }).BarcodeDetector
        const supported = await BarcodeDetectorCtor.getSupportedFormats?.()
        const preferred = ['ean_13', 'ean_8', 'upc_a', 'upc_e', 'code_128', 'code_39', 'itf', 'codabar', 'qr_code']
        const formats = Array.isArray(supported) ? preferred.filter((format) => supported.includes(format)) : preferred
        const detector = new BarcodeDetectorCtor({ formats })

        detectorInterval = setInterval(async () => {
          if (!mostrarScanner.value || !videoScannerRef.value) return
          if (videoScannerRef.value.readyState < 2) return

          try {
            const barcodes = await detector.detect(videoScannerRef.value)
            const raw = barcodes?.[0]?.rawValue?.trim()
            if (!raw) return
            await procesarCodigoEscaneado(raw)
          } catch {
            // ignore detector polling errors
          }
        }, 250)
      } catch {
        // ignore BarcodeDetector support issues
      }
    }

    if (videoScannerRef.value.srcObject instanceof MediaStream) {
      activeStream = videoScannerRef.value.srcObject
    }
  } catch (error) {
    console.error('Error al iniciar scanner de consulta de precio:', error)
    toast.add({
      severity: 'error',
      summary: 'Error de cámara',
      detail: 'No se pudo acceder a la cámara.',
      life: 3000,
    })
    cerrarScanner()
  }
}

async function procesarCodigoEscaneado(raw: string) {
  if (!raw || scannerResultadoProcesado) return
  scannerResultadoProcesado = true
  busqueda.value = raw
  await buscarProductos(raw)

  const producto = await db.productos.where('sku').equals(raw).first()
  if (producto) {
    productoSeleccionado.value = producto
    toast.add({
      severity: 'info',
      summary: 'Producto encontrado',
      detail: producto.nombre,
      life: 2000,
    })
  } else {
    toast.add({
      severity: 'warn',
      summary: 'No encontrado',
      detail: `El SKU ${raw} no existe.`,
      life: 3000,
    })
  }

  cerrarScanner()
  await nextTick()
  enfocarBusqueda()
}

function enfocarBusqueda() {
  const maybeInput = searchInputRef.value?.$el?.querySelector?.('input') || searchInputRef.value
  maybeInput?.focus?.()
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
    } catch {
      // ignore stop failure
    }
    scannerControls = null
  }

  if (codeReader) {
    try {
      codeReader.reset()
    } catch {
      // ignore reset failure
    }
  }

  if (activeStream) {
    activeStream.getTracks().forEach((track) => track.stop())
    activeStream = null
  }

  if (videoScannerRef.value) {
    if (videoScannerRef.value.srcObject instanceof MediaStream) {
      videoScannerRef.value.srcObject.getTracks().forEach((track) => track.stop())
    }
    videoScannerRef.value.srcObject = null
  }
}
</script>

<style scoped>
.consulta-precio-fab {
  position: fixed;
  right: 1rem;
  bottom: 1rem;
  width: 3.5rem;
  height: 3.5rem;
  border: none;
  border-radius: 999px;
  background: linear-gradient(135deg, #4f46e5, #0ea5e9);
  color: #fff;
  box-shadow: 0 14px 28px rgba(37, 99, 235, 0.28);
  display: none;
  align-items: center;
  justify-content: center;
  z-index: 35;
}

.consulta-precio-fab i {
  font-size: 1.2rem;
}

.consulta-precio-body {
  display: flex;
  flex-direction: column;
  gap: 1rem;
}

.consulta-precio-search {
  display: flex;
  align-items: center;
  gap: 0.75rem;
}

.consulta-precio-card {
  border: 1px solid var(--border-subtle);
  border-radius: 1rem;
  padding: 1rem;
  background: color-mix(in srgb, var(--bg-surface) 92%, #4f46e5 8%);
}

.consulta-precio-card-head {
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  gap: 1rem;
  margin-bottom: 1rem;
}

.consulta-precio-title {
  margin: 0;
  font-size: 1.15rem;
  font-weight: 700;
  color: var(--text-app);
}

.consulta-precio-sku {
  margin: 0.25rem 0 0;
  color: var(--text-muted);
  font-size: 0.88rem;
}

.consulta-precio-main {
  display: grid;
  grid-template-columns: minmax(220px, 1fr) minmax(0, 1.2fr);
  gap: 1rem;
}

.consulta-precio-price {
  border-radius: 0.9rem;
  background: linear-gradient(135deg, rgba(34, 197, 94, 0.12), rgba(14, 165, 233, 0.14));
  padding: 1rem;
  display: flex;
  flex-direction: column;
  justify-content: center;
}

.consulta-precio-price-label {
  font-size: 0.82rem;
  color: var(--text-muted);
  text-transform: uppercase;
  letter-spacing: 0.04em;
}

.consulta-precio-price-value {
  font-size: 1.8rem;
  line-height: 1.1;
  color: var(--text-app);
}

.consulta-precio-meta {
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 0.75rem;
}

.consulta-precio-meta-item {
  border: 1px solid var(--border-subtle);
  border-radius: 0.85rem;
  padding: 0.8rem 0.9rem;
  background: var(--bg-app);
  display: flex;
  flex-direction: column;
  gap: 0.2rem;
}

.consulta-precio-meta-item span {
  color: var(--text-muted);
  font-size: 0.8rem;
}

.consulta-precio-meta-item strong {
  color: var(--text-app);
  font-size: 0.95rem;
}

.consulta-precio-results {
  max-height: 280px;
  overflow-y: auto;
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
}

.consulta-precio-result {
  width: 100%;
  border: 1px solid var(--border-subtle);
  border-radius: 0.9rem;
  background: var(--bg-surface);
  padding: 0.85rem 1rem;
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 0.75rem;
  text-align: left;
}

.consulta-precio-result:hover {
  border-color: rgba(79, 70, 229, 0.35);
  background: color-mix(in srgb, var(--bg-surface) 90%, #4f46e5 10%);
}

.consulta-precio-result-copy {
  display: flex;
  flex-direction: column;
  gap: 0.15rem;
  min-width: 0;
}

.consulta-precio-result-copy strong,
.consulta-precio-result-copy span {
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.consulta-precio-result-copy span {
  color: var(--text-muted);
  font-size: 0.82rem;
}

.consulta-precio-result-price {
  color: #22c55e;
  white-space: nowrap;
  font-size: 1rem;
}

.consulta-precio-empty {
  border: 1px dashed var(--border-subtle);
  border-radius: 0.9rem;
  padding: 1rem;
  text-align: center;
  color: var(--text-muted);
}

.consulta-precio-footer {
  width: 100%;
  display: flex;
  justify-content: flex-end;
  gap: 0.75rem;
}

.consulta-precio-scanner {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 0.9rem;
}

.consulta-precio-scanner-video {
  position: relative;
  width: 100%;
  background: #000;
  border-radius: 0.9rem;
  overflow: hidden;
  aspect-ratio: 16 / 9;
}

.consulta-precio-scanner-video video {
  width: 100%;
  height: 100%;
  object-fit: cover;
}

.consulta-precio-scanner-line {
  position: absolute;
  inset-inline: 1rem;
  top: 50%;
  height: 2px;
  background: rgba(239, 68, 68, 0.95);
  box-shadow: 0 0 10px rgba(239, 68, 68, 0.7);
}

.consulta-precio-scanner p {
  margin: 0;
  text-align: center;
  color: var(--text-muted);
  font-size: 0.9rem;
}

@media (max-width: 767px) {
  .consulta-precio-fab {
    display: inline-flex;
  }

  .consulta-precio-search {
    gap: 0.5rem;
  }

  .consulta-precio-main {
    grid-template-columns: 1fr;
  }

  .consulta-precio-meta {
    grid-template-columns: 1fr;
  }

  .consulta-precio-footer {
    justify-content: stretch;
  }

  .consulta-precio-footer :deep(.p-button) {
    flex: 1;
  }
}
</style>
