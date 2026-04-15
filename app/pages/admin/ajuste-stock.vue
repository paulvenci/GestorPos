<template>
  <div class="admin-page">
    <div class="admin-header">
      <Button label="Nuevo Ajuste" icon="pi pi-plus" severity="success" @click="abrirNuevo" />
    </div>

    <!-- Formulario de nuevo ajuste -->
    <Dialog v-model:visible="mostrarDialogo" header="Registrar Ajuste de Stock" :modal="true" :style="{ width: '520px' }" class="p-fluid">
      <div class="ajuste-form">
        <div class="ajuste-field">
          <label>Producto (buscar por nombre o código)</label>
          <div class="p-inputgroup flex-1">
            <AutoComplete
              v-model="productoAutoComplete"
              :suggestions="productosSugeridos"
              optionLabel="label"
              placeholder="Escribir nombre o escanear código..."
              :loading="loadingProductos"
              @complete="buscarProducto"
              @item-select="onProductoSeleccionado"
              forceSelection
              dropdown
              class="w-full"
            />
            <Button icon="pi pi-camera" @click="abrirScanner" title="Escanear código de barras" />
          </div>
        </div>

        <div v-if="productoSeleccionado" class="ajuste-stock-actual">
          <span>Stock actual:</span>
          <Tag :value="productoSeleccionado.stock.toString()" :severity="productoSeleccionado.stock > 5 ? 'success' : productoSeleccionado.stock > 0 ? 'warning' : 'danger'" />
        </div>

        <div class="ajuste-field-row">
          <div class="ajuste-field">
            <label>Tipo</label>
            <SelectButton v-model="form.tipo" :options="tiposAjuste" optionLabel="label" optionValue="value" />
          </div>
          <div class="ajuste-field">
            <label>Cantidad</label>
            <InputNumber v-model="form.cantidad" :min="1" />
          </div>
        </div>

        <div class="ajuste-field">
          <label>Precio de compra</label>
          <InputNumber
            v-model="form.costo"
            :min="0"
            mode="currency"
            currency="CLP"
            locale="es-CL"
            placeholder="Opcional"
          />
        </div>

        <div v-if="form.id_producto && form.cantidad" class="ajuste-preview">
          <span>Stock resultante:</span>
          <strong :class="stockResultanteClass">{{ stockResultante }}</strong>
        </div>

        <div class="ajuste-field">
          <label>Motivo</label>
          <Select
            v-model="form.motivo"
            :options="motivosAjuste"
            placeholder="Seleccionar motivo"
          />
        </div>

        <div class="ajuste-field">
          <label>Observaciones (opcional)</label>
          <Textarea v-model="form.observaciones" rows="2" placeholder="Detalles adicionales..." />
        </div>
      </div>

      <template #footer>
        <Button label="Cancelar" icon="pi pi-times" text severity="secondary" @click="mostrarDialogo = false" />
        <Button
          label="Registrar Ajuste"
          icon="pi pi-check"
          @click="registrarAjuste"
          :loading="saving"
          :disabled="!form.id_producto || !form.cantidad || !form.motivo"
        />
      </template>
    </Dialog>

    <!-- Modal Scanner de Código de Barras -->
    <Dialog v-model:visible="mostrarScanner" header="Escanear Código" :modal="true" :style="{ width: '400px' }" @hide="cerrarScanner">
      <div class="flex flex-col items-center justify-center p-2">
        <div class="relative w-full rounded overflow-hidden bg-black aspect-video flex items-center justify-center">
          <video ref="videoScannerRef" class="w-full h-full object-cover" autoplay muted playsinline></video>
          <div class="absolute inset-x-4 top-1/2 h-0.5 bg-red-500 shadow-[0_0_8px_rgba(239,68,68,0.8)] animate-pulse"></div>
        </div>
        <p class="mt-4 text-center text-sm text-slate-500">Apunta la cámara al código de barras.</p>
      </div>
    </Dialog>

    <!-- Tabla de historial de ajustes -->
    <DataTable
      :value="ajustes"
      :loading="loading"
      class="p-datatable-sm"
      paginator
      :rows="15"
      responsiveLayout="scroll"
      sortField="created_at"
      :sortOrder="-1"
    >
      <Column header="Fecha" sortable field="created_at">
        <template #body="slotProps">
          <span class="text-sm" style="color: var(--text-muted)">{{ formatFecha(slotProps.data.created_at) }}</span>
        </template>
      </Column>
      <Column header="Producto">
        <template #body="slotProps">
          <span class="font-semibold">{{ slotProps.data.producto_nombre || '-' }}</span>
        </template>
      </Column>
      <Column header="Tipo" sortable field="tipo">
        <template #body="slotProps">
          <Tag
            :value="slotProps.data.tipo === 'ingreso' ? '⬆ Ingreso' : '⬇ Egreso'"
            :severity="slotProps.data.tipo === 'ingreso' ? 'success' : 'danger'"
          />
        </template>
      </Column>
      <Column field="cantidad" header="Cant." sortable />
      <Column header="Stock">
        <template #body="slotProps">
          <span style="color: var(--text-muted)">{{ slotProps.data.stock_anterior }} → <strong>{{ slotProps.data.stock_nuevo }}</strong></span>
        </template>
      </Column>
      <Column field="motivo" header="Motivo" />
      <Column header="Usuario">
        <template #body="slotProps">
          <span class="text-sm">{{ slotProps.data.usuario_nombre || '-' }}</span>
        </template>
      </Column>
      <template #empty>
        <div class="p-4 text-center" style="color: var(--text-muted)">No hay ajustes de stock registrados.</div>
      </template>
    </DataTable>
  </div>
</template>

<script setup lang="ts">
import { useToast } from 'primevue/usetoast'
import { useFormatMonto } from '~/composables/useFormatMonto'
import { useAuthStore } from '~/stores/auth'
import type { Database } from '~/types/database.types'
import { BrowserMultiFormatReader, type IScannerControls } from '@zxing/browser'
import { BarcodeFormat, DecodeHintType } from '@zxing/library'

const supabase = useSupabaseClient<Database>()
const authStore = useAuthStore()
const toast = useToast()
const { formatFecha } = useFormatMonto()

const loading = ref(false)
const saving = ref(false)
const loadingProductos = ref(false)
const mostrarDialogo = ref(false)

const ajustes = ref<any[]>([])
const productos = ref<any[]>([])

const tiposAjuste = [
  { label: 'Ingreso', value: 'ingreso' },
  { label: 'Egreso', value: 'egreso' }
]

const motivosAjuste = [
  'Compra a proveedor',
  'Devolución de cliente',
  'Ajuste por inventario físico',
  'Merma / Vencimiento',
  'Uso interno',
  'Transferencia entre sucursales',
  'Otro'
]

const form = ref({
  id_producto: null as string | null,
  tipo: 'ingreso' as 'ingreso' | 'egreso',
  cantidad: 1,
  costo: null as number | null,
  motivo: null as string | null,
  observaciones: ''
})

const productoAutoComplete = ref<any>(null)
const productosSugeridos = ref<any[]>([])

const productosOptions = computed(() =>
  productos.value.map(p => ({
    label: `${p.nombre}${p.sku ? ' [' + p.sku + ']' : ''} (Stock: ${p.stock})`,
    value: p.id,
    nombre: p.nombre,
    sku: p.sku || ''
  }))
)

function buscarProducto(event: any) {
  const query = (event.query || '').toLowerCase().trim()
  if (!query) {
    productosSugeridos.value = productosOptions.value
    return
  }
  productosSugeridos.value = productosOptions.value.filter(p =>
    p.nombre.toLowerCase().includes(query) ||
    p.sku.toLowerCase().includes(query) ||
    p.label.toLowerCase().includes(query)
  )
}

function onProductoSeleccionado(event: any) {
  const item = event.value
  if (item?.value) {
    form.value.id_producto = item.value
  }
}

const productoSeleccionado = computed(() =>
  productos.value.find(p => p.id === form.value.id_producto) || null
)

watch(productoSeleccionado, (producto) => {
  form.value.costo = typeof producto?.costo === 'number' ? producto.costo : null
})

const stockResultante = computed(() => {
  if (!productoSeleccionado.value) return 0
  const actual = productoSeleccionado.value.stock
  return form.value.tipo === 'ingreso'
    ? actual + (form.value.cantidad || 0)
    : actual - (form.value.cantidad || 0)
})

const stockResultanteClass = computed(() => {
  if (stockResultante.value < 0) return 'stock-negativo'
  if (stockResultante.value <= 5) return 'stock-bajo'
  return 'stock-ok'
})

onMounted(async () => {
  await Promise.all([fetchAjustes(), fetchProductos()])
})

async function fetchProductos() {
  loadingProductos.value = true
  try {
    const { data } = await supabase
      .from('productos')
      .select('id, nombre, sku, stock, costo')
      .eq('empresa_id', authStore.empresaId)
      .eq('activo', true)
      .order('nombre')
    productos.value = data || []
  } finally {
    loadingProductos.value = false
  }
}

async function fetchAjustes() {
  loading.value = true
  try {
    const { data, error } = await (supabase.from('ajustes_stock') as any)
      .select('*')
      .eq('empresa_id', authStore.empresaId)
      .order('created_at', { ascending: false })
      .limit(100)

    if (error) throw error

    if (data && data.length > 0) {
      // Enriquecer con nombres de producto y usuario
      const prodIds = [...new Set(data.map((a: any) => a.id_producto))]
      const userIds = [...new Set(data.map((a: any) => a.id_usuario))]

      const { data: prods } = await supabase
        .from('productos')
        .select('id, nombre')
        .eq('empresa_id', authStore.empresaId)
        .in('id', prodIds)

      const { data: perfiles } = await supabase
        .from('perfiles')
        .select('id, nombre')
        .eq('empresa_id', authStore.empresaId)
        .in('id', userIds)

      const prodMap = new Map((prods || []).map((p: any) => [p.id, p.nombre]))
      const userMap = new Map((perfiles || []).map((u: any) => [u.id, u.nombre]))

      ajustes.value = data.map((a: any) => ({
        ...a,
        producto_nombre: prodMap.get(a.id_producto) || '-',
        usuario_nombre: userMap.get(a.id_usuario) || '-'
      }))
    } else {
      ajustes.value = []
    }
  } catch (e: any) {
    toast.add({ severity: 'error', summary: 'Error', detail: e.message, life: 5000 })
  } finally {
    loading.value = false
  }
}

function abrirNuevo() {
  form.value = { id_producto: null, tipo: 'ingreso', cantidad: 1, costo: null, motivo: null, observaciones: '' }
  productoAutoComplete.value = null
  mostrarDialogo.value = true
}

// ─── Scanner de Código de Barras ───
const mostrarScanner = ref(false)
const videoScannerRef = ref<HTMLVideoElement | null>(null)
let codeReader: BrowserMultiFormatReader | null = null
let activeStream: MediaStream | null = null
let scannerControls: IScannerControls | null = null
let detectorInterval: ReturnType<typeof setInterval> | null = null

function procesarCodigoDetectado(rawCode: string) {
  if (!mostrarScanner.value) return
  const sku = rawCode.trim()
  if (!sku) return

  // Buscar producto por SKU
  const producto = productos.value.find(p => p.sku?.toLowerCase() === sku.toLowerCase())
  if (producto) {
    form.value.id_producto = producto.id
    const opcion = productosOptions.value.find(o => o.value === producto.id)
    productoAutoComplete.value = opcion || null
    toast.add({ severity: 'success', summary: 'Producto encontrado', detail: producto.nombre, life: 3000 })
  } else {
    toast.add({ severity: 'warn', summary: 'No encontrado', detail: `No se encontró producto con código: ${sku}`, life: 4000 })
  }
  cerrarScanner()
}

async function iniciarFallbackBarcodeDetector() {
  if (!videoScannerRef.value) return
  if (!(window as any).BarcodeDetector) return
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
        const raw = barcodes?.[0]?.rawValue
        if (raw) procesarCodigoDetectado(raw)
      } catch (_) {}
    }, 250)
  } catch (_) {}
}

async function abrirScanner() {
  if (mostrarScanner.value) return
  mostrarScanner.value = true
  await nextTick()

  if (!codeReader) {
    const hints = new Map()
    const formats = [
      BarcodeFormat.CODE_128, BarcodeFormat.EAN_13, BarcodeFormat.EAN_8,
      BarcodeFormat.QR_CODE, BarcodeFormat.CODE_39, BarcodeFormat.UPC_A,
      BarcodeFormat.UPC_E, BarcodeFormat.ITF, BarcodeFormat.CODABAR, BarcodeFormat.CODE_93
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
    toast.add({ severity: 'error', summary: 'Error', detail: 'No se pudo inicializar la cámara', life: 3000 })
    cerrarScanner()
    return
  }

  try {
    scannerControls = await codeReader.decodeFromConstraints(
      { video: { facingMode: { ideal: 'environment' }, width: { ideal: 1920 }, height: { ideal: 1080 } } },
      videoScannerRef.value,
      (result, error) => {
        if (result) { procesarCodigoDetectado(result.getText()); return }
        if (error && (error as any).name === 'NotFoundException') return
      }
    )
    if (videoScannerRef.value.srcObject instanceof MediaStream) {
      activeStream = videoScannerRef.value.srcObject
    }
    await iniciarFallbackBarcodeDetector()
  } catch (err: any) {
    console.error('Error cámara:', err)
    toast.add({ severity: 'error', summary: 'Error de cámara', detail: 'No se pudo iniciar el escáner.', life: 3000 })
    cerrarScanner()
  }
}

function cerrarScanner() {
  if (detectorInterval) { clearInterval(detectorInterval); detectorInterval = null }
  if (scannerControls) { try { scannerControls.stop() } catch (_) {}; scannerControls = null }
  if (codeReader) { try { codeReader.reset() } catch (_) {} }
  if (activeStream) { activeStream.getTracks().forEach(t => t.stop()); activeStream = null }
  if (videoScannerRef.value) {
    const stream = videoScannerRef.value.srcObject
    if (stream instanceof MediaStream) stream.getTracks().forEach(t => t.stop())
    videoScannerRef.value.srcObject = null
  }
  mostrarScanner.value = false
}

onUnmounted(() => {
  if (mostrarScanner.value) cerrarScanner()
})

async function registrarAjuste() {
  if (!form.value.id_producto || !form.value.cantidad || !form.value.motivo) return
  if (stockResultante.value < 0) {
    toast.add({ severity: 'warn', summary: 'Stock insuficiente', detail: 'El egreso excede el stock disponible.', life: 4000 })
    return
  }

  saving.value = true
  try {
    const { data: { user } } = await supabase.auth.getUser()
    const stockAnterior = productoSeleccionado.value?.stock ?? 0

    // Insertar ajuste
    const { error: ajusteError } = await (supabase.from('ajustes_stock') as any).insert({
      empresa_id: authStore.empresaId,
      id_producto: form.value.id_producto,
      id_usuario: user?.id,
      tipo: form.value.tipo,
      cantidad: form.value.cantidad,
      motivo: form.value.motivo,
      observaciones: form.value.observaciones || null,
      stock_anterior: stockAnterior,
      stock_nuevo: stockResultante.value
    })
    if (ajusteError) throw ajusteError

    // Actualizar stock del producto
    const { error: updateError } = await supabase
      .from('productos')
      .update({
        stock: stockResultante.value,
        ...(typeof form.value.costo === 'number' ? { costo: form.value.costo } : {})
      })
      .eq('id', form.value.id_producto)
      .eq('empresa_id', authStore.empresaId)
    if (updateError) throw updateError

    toast.add({ severity: 'success', summary: 'Ajuste registrado', detail: `Stock actualizado: ${stockAnterior} → ${stockResultante.value}`, life: 3000 })
    mostrarDialogo.value = false
    await Promise.all([fetchAjustes(), fetchProductos()])
  } catch (e: any) {
    toast.add({ severity: 'error', summary: 'Error', detail: e.message, life: 5000 })
  } finally {
    saving.value = false
  }
}
</script>

<style scoped>
.admin-page {
  padding: 2.5rem;
  color: var(--text-app);
}

.admin-header {
  display: flex;
  justify-content: flex-end;
  align-items: center;
  margin-bottom: 1rem;
  flex-wrap: wrap;
  gap: 0.75rem;
}

/* Ajuste Form */
.ajuste-form {
  display: flex;
  flex-direction: column;
  gap: 1.25rem;
  padding: 0.5rem 0;
}

.ajuste-field {
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
}

.ajuste-field label {
  font-size: 0.875rem;
  font-weight: 600;
  color: var(--text-muted);
}

.ajuste-field-row {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 1rem;
}

.ajuste-stock-actual {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  padding: 0.5rem 0.75rem;
  background: rgba(99, 102, 241, 0.08);
  border-radius: 0.5rem;
  font-size: 0.85rem;
  color: var(--text-muted);
}

.ajuste-preview {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  padding: 0.5rem 0.75rem;
  background: var(--bg-surface);
  border-radius: 0.5rem;
  border: 1px solid var(--border-subtle);
  font-size: 0.9rem;
}

.stock-ok { color: #22c55e; }
.stock-bajo { color: #f59e0b; }
.stock-negativo { color: #ef4444; }

/* DataTable */
:deep(.p-datatable) {
  background: var(--bg-surface);
  border-radius: 1rem;
  border: 1px solid var(--border-sidebar);
  overflow: hidden;
}

:deep(.p-datatable-thead > tr > th) {
  background: var(--bg-app) !important;
  color: var(--text-muted) !important;
  font-weight: 600;
  font-size: 0.85rem;
  text-transform: uppercase;
  letter-spacing: 0.05em;
  padding: 0.75rem 1rem;
  border: none !important;
}

:deep(.p-datatable-tbody > tr) {
  background: transparent !important;
  color: var(--text-app);
}

:deep(.p-datatable-tbody > tr > td) {
  border-color: var(--border-subtle) !important;
  padding: 0.75rem 1rem;
}

:deep(.p-paginator) {
  background: transparent !important;
  border-top: 1px solid var(--border-subtle) !important;
}

@media (max-width: 768px) {
  .admin-page {
    padding: 0.75rem;
  }

  .admin-header {
    margin-bottom: 0.65rem;
  }

  .admin-header :deep(.p-button) {
    width: 100%;
    justify-content: center;
    padding: 0.52rem 0.7rem !important;
    font-size: 0.86rem !important;
  }

  :deep(.p-datatable-thead > tr > th),
  :deep(.p-datatable-tbody > tr > td) {
    padding: 0.55rem 0.6rem;
    font-size: 0.78rem;
  }

  .ajuste-field-row {
    grid-template-columns: 1fr;
    gap: 0.65rem;
  }
}
</style>
