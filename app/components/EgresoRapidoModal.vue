<template>
  <div>
    <Dialog
      v-model:visible="visible"
      header="Egreso Rápido de Producto"
      :modal="true"
      :style="{ width: '500px' }"
      class="p-fluid egreso-rapido-dialog"
      :closable="!loading"
      @hide="resetForm"
    >
      <div class="egreso-form">
        <div class="egreso-field">
          <label class="font-bold block mb-1">Producto</label>
          <div class="p-inputgroup">
            <AutoComplete
              v-model="productoAutoComplete"
              :suggestions="productosSugeridos"
              optionLabel="label"
              placeholder="Buscar por nombre o SKU..."
              :loading="loadingProductos"
              @complete="buscarProducto"
              @item-select="onProductoSeleccionado"
              forceSelection
              class="w-full"
              autofocus
            />
            <Button icon="pi pi-camera" severity="secondary" @click="abrirScanner" title="Escanear código de barras" />
          </div>
        </div>

        <div v-if="productoSeleccionado" class="egreso-item-card">
          <img v-if="productoSeleccionado.imagen_url" :src="productoSeleccionado.imagen_url" class="egreso-item-img" />
          <div v-else class="egreso-item-img-placeholder"><i class="pi pi-box" /></div>
          <div class="egreso-item-info">
            <span class="egreso-item-nombre">{{ productoSeleccionado.nombre }}</span>
            <span class="egreso-item-stock">Stock actual: <strong>{{ productoSeleccionado.stock }}</strong></span>
          </div>
        </div>

        <div class="egreso-field">
          <label class="font-bold block mb-1">Cantidad a retirar</label>
          <InputNumber v-model="form.cantidad" :min="0.001" :maxFractionDigits="3" showButtons />
        </div>

        <div class="egreso-field">
          <label class="font-bold block mb-1">Motivo</label>
          <Select
            v-model="form.motivo"
            :options="motivosEgreso"
            placeholder="Seleccionar..."
            class="w-full"
          />
        </div>

        <div class="egreso-field">
          <label class="font-bold block mb-1">Observaciones (Opcional)</label>
          <Textarea v-model="form.observaciones" rows="4" placeholder="Explica detalladamente por qué sale el producto del inventario..." class="w-full" />
        </div>

        <div v-if="productoSeleccionado && form.cantidad" class="egreso-preview">
          <span>El stock quedará en:</span>
          <strong :class="{ 'text-red-500': stockResultante < 0, 'text-emerald-500': stockResultante >= 0 }">
            {{ stockResultante }}
          </strong>
        </div>
      </div>

      <template #footer>
        <Button label="Cancelar" icon="pi pi-times" text severity="secondary" @click="visible = false" :disabled="loading" />
        <Button
          label="Confirmar Egreso"
          icon="pi pi-check"
          severity="danger"
          @click="confirmarEgreso"
          :loading="loading"
          :disabled="!form.id_producto || !form.cantidad || !form.motivo"
        />
      </template>
    </Dialog>

    <!-- Scanner de Cámara -->
    <Dialog v-model:visible="mostrarScanner" header="Escanear Código" :modal="true" :style="{ width: '400px' }" @hide="cerrarScanner">
      <div class="flex flex-col items-center justify-center p-2">
        <div class="relative w-full rounded overflow-hidden bg-black aspect-video flex items-center justify-center">
          <video ref="videoScannerRef" class="w-full h-full object-cover" autoplay muted playsinline></video>
          <div class="absolute inset-x-4 top-1/2 h-0.5 bg-red-500 shadow-[0_0_8px_rgba(239,68,68,0.8)] animate-pulse"></div>
        </div>
        <p class="mt-4 text-center text-sm text-slate-500">Apunta la cámara al código de barras.</p>
      </div>
    </Dialog>
  </div>
</template>

<script setup lang="ts">
import { useToast } from 'primevue/usetoast'
import { useAuthStore } from '~/stores/auth'
import type { Database } from '~/types/database.types'
import { BrowserMultiFormatReader, type IScannerControls } from '@zxing/browser'
import { BarcodeFormat, DecodeHintType } from '@zxing/library'

const props = defineProps<{
  modelValue: boolean
}>()

const emit = defineEmits(['update:modelValue', 'saved'])

const visible = computed({
  get: () => props.modelValue,
  set: (val) => emit('update:modelValue', val)
})

const supabase = useSupabaseClient<Database>()
const authStore = useAuthStore()
const toast = useToast()

const loading = ref(false)
const loadingProductos = ref(false)
const productos = ref<any[]>([])
const productosSugeridos = ref<any[]>([])
const productoAutoComplete = ref<any>(null)

const motivosEgreso = [
  'Merma / Daño',
  'Vencimiento',
  'Uso Interno / Consumo',
  'Devolución a Proveedor',
  'Error de Inventario',
  'Otro'
]

const form = ref({
  id_producto: null as string | null,
  cantidad: 1,
  motivo: null as string | null,
  observaciones: ''
})

const productoSeleccionado = computed(() =>
  productos.value.find(p => p.id === form.value.id_producto) || null
)

const stockResultante = computed(() => {
  if (!productoSeleccionado.value) return 0
  return productoSeleccionado.value.stock - (form.value.cantidad || 0)
})

async function fetchProductos() {
  loadingProductos.value = true
  try {
    const { data } = await supabase
      .from('productos')
      .select('id, nombre, sku, stock, imagen_url, es_pesable')
      .eq('empresa_id', authStore.empresaId)
      .eq('activo', true)
      .order('nombre')
    productos.value = data || []
  } finally {
    loadingProductos.value = false
  }
}

function buscarProducto(event: any) {
  const query = (event.query || '').toLowerCase().trim()
  const options = productos.value.map(p => ({
    label: `${p.nombre}${p.sku ? ' [' + p.sku + ']' : ''}`,
    value: p.id
  }))
  
  if (!query) {
    productosSugeridos.value = options
    return
  }
  productosSugeridos.value = options.filter(o => o.label.toLowerCase().includes(query))
}

function onProductoSeleccionado(event: any) {
  form.value.id_producto = event.value.value
}

function resetForm() {
  form.value = { id_producto: null, cantidad: 1, motivo: null, observaciones: '' }
  productoAutoComplete.value = null
}

async function confirmarEgreso() {
  if (!form.value.id_producto || !form.value.cantidad || !form.value.motivo) return
  
  loading.value = true
  try {
    const stockAnterior = productoSeleccionado.value?.stock ?? 0
    const stockNuevo = stockAnterior - form.value.cantidad

    // 1. Insertar ajuste con estado "no revisado"
    const { error: ajusteError } = await (supabase.from('ajustes_stock') as any).insert({
      empresa_id: authStore.empresaId,
      id_producto: form.value.id_producto,
      id_usuario: authStore.user?.id,
      tipo: 'egreso',
      cantidad: form.value.cantidad,
      motivo: `Egreso Rápido: ${form.value.motivo}`,
      observaciones: form.value.observaciones || null,
      stock_anterior: stockAnterior,
      stock_nuevo: stockNuevo,
      revisado_por_admin: false
    })
    if (ajusteError) throw ajusteError

    // 2. Actualizar stock
    const { error: updateError } = await supabase
      .from('productos')
      .update({ stock: stockNuevo })
      .eq('id', form.value.id_producto)
    
    if (updateError) throw updateError

    toast.add({ severity: 'success', summary: 'Egreso registrado', detail: 'El stock ha sido actualizado.', life: 3000 })
    emit('saved')
    visible.value = false
  } catch (e: any) {
    toast.add({ severity: 'error', summary: 'Error', detail: e.message, life: 5000 })
  } finally {
    loading.value = false
  }
}

// ─── Lógica Scanner ───
const mostrarScanner = ref(false)
const videoScannerRef = ref<HTMLVideoElement | null>(null)
let codeReader: BrowserMultiFormatReader | null = null
let activeStream: MediaStream | null = null
let scannerControls: IScannerControls | null = null

async function abrirScanner() {
  mostrarScanner.value = true
  await nextTick()

  if (!codeReader) {
    const hints = new Map()
    hints.set(DecodeHintType.POSSIBLE_FORMATS, [BarcodeFormat.CODE_128, BarcodeFormat.EAN_13, BarcodeFormat.UPC_A])
    codeReader = new BrowserMultiFormatReader(hints)
  }

  try {
    scannerControls = await codeReader.decodeFromConstraints(
      { video: { facingMode: { ideal: 'environment' } } },
      videoScannerRef.value!,
      (result) => {
        if (result) {
          const sku = result.getText()
          const prod = productos.value.find(p => p.sku === sku)
          if (prod) {
            form.value.id_producto = prod.id
            productoAutoComplete.value = { label: prod.nombre, value: prod.id }
            toast.add({ severity: 'success', summary: 'Producto detectado', detail: prod.nombre, life: 2000 })
            cerrarScanner()
          } else {
            toast.add({ severity: 'warn', summary: 'Desconocido', detail: `SKU ${sku} no encontrado`, life: 3000 })
          }
        }
      }
    )
  } catch (err) {
    toast.add({ severity: 'error', summary: 'Cámara error', detail: 'No se pudo iniciar el escáner.', life: 3000 })
    cerrarScanner()
  }
}

function cerrarScanner() {
  if (scannerControls) { scannerControls.stop(); scannerControls = null }
  mostrarScanner.value = false
}

onMounted(fetchProductos)
</script>

<style scoped>
.egreso-form {
  display: flex;
  flex-direction: column;
  gap: 1rem;
}
.egreso-item-card {
  display: flex;
  align-items: center;
  gap: 1rem;
  padding: 0.75rem;
  background: var(--bg-app);
  border-radius: 0.75rem;
  border: 1px solid var(--border-subtle);
}
.egreso-item-img, .egreso-item-img-placeholder {
  width: 50px;
  height: 50px;
  border-radius: 0.5rem;
  object-fit: cover;
  background: var(--bg-surface);
  display: flex;
  align-items: center;
  justify-content: center;
  color: var(--text-muted);
}
.egreso-item-info {
  display: flex;
  flex-direction: column;
}
.egreso-item-nombre {
  font-weight: 600;
  font-size: 0.95rem;
}
.egreso-item-stock {
  font-size: 0.85rem;
  color: var(--text-muted);
}
.egreso-preview {
  padding: 0.75rem;
  background: var(--bg-surface);
  border-radius: 0.5rem;
  border: 1px dashed var(--border-subtle);
  text-align: center;
  font-size: 0.9rem;
}
</style>
