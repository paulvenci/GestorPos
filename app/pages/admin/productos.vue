<template>
  <div class="admin-page">
    <!-- Encabezado -->
    <div class="admin-header">
      <div class="admin-header-actions">
        <IconField class="admin-search">
          <InputIcon class="pi pi-search" />
          <InputText v-model="filters['global'].value" placeholder="Buscar producto..." />
        </IconField>
        <Button
          v-if="selectedProducts.length > 0"
          :label="`Imprimir códigos (${selectedProducts.length})`"
          icon="pi pi-print"
          severity="secondary"
          outlined
          @click="imprimirSeleccionados"
        />
        <Button label="Nuevo Producto" icon="pi pi-plus" severity="success" @click="abrirNuevo" />
      </div>
    </div>

    <!-- Tabla -->
    <DataTable
      v-model:filters="filters"
      v-model:selection="selectedProducts"
      :value="productosStore.productos"
      :loading="productosStore.loading"
      paginator
      :rows="10"
      dataKey="id"
      filterDisplay="menu"
      :globalFilterFields="['nombre', 'sku', 'categoria']"
      responsiveLayout="scroll"
      class="p-datatable-sm"
      sortField="nombre"
      :sortOrder="1"
    >
      <Column selectionMode="multiple" headerStyle="width: 3rem" />
      <Column field="nombre" header="Nombre" sortable />
      <Column field="sku" header="SKU" sortable>
        <template #body="slotProps">
          <span class="font-mono text-sm text-slate-400">{{ slotProps.data.sku || 'N/A' }}</span>
        </template>
      </Column>
      <Column field="categoria" header="Categoría" sortable />
      <Column field="precio" header="Precio" sortable>
        <template #body="slotProps">
          <span class="precio-cell">{{ formatMonto(slotProps.data.precio) }}</span>
        </template>
      </Column>
      <Column field="stock" header="Stock" sortable>
        <template #body="slotProps">
          <Tag
            :value="slotProps.data.stock.toString()"
            :severity="slotProps.data.stock > 10 ? 'success' : slotProps.data.stock > 0 ? 'warning' : 'danger'"
          />
        </template>
      </Column>
      <Column field="activo" header="Estado" sortable>
        <template #body="slotProps">
          <InputSwitch 
            :modelValue="slotProps.data.activo" 
            @update:modelValue="(val: boolean) => productosStore.toggleActivo(slotProps.data.id, val)" 
          />
        </template>
      </Column>
      <Column :exportable="false" style="min-width: 14rem">
        <template #body="slotProps">
          <div class="flex gap-2">
            <Button icon="pi pi-pencil" outlined rounded severity="info" size="small" @click="abrirEditar(slotProps.data)" title="Editar" />
            <Button icon="pi pi-barcode" outlined rounded severity="secondary" size="small" @click="abrirEtiquetas(slotProps.data)" title="Imprimir Etiqueta" :disabled="!slotProps.data.sku" />
          </div>
        </template>
      </Column>

      <template #empty>
        <div class="p-4 text-center text-slate-500">
          No se encontraron productos. Crea uno nuevo para empezar.
        </div>
      </template>
    </DataTable>

    <!-- Modal Formulario -->
    <Dialog
      v-model:visible="mostrarDialogo"
      :style="{ width: '750px' }"
      :breakpoints="{ '1024px': '92vw', '768px': '96vw' }"
      header="Detalles del Producto"
      :modal="true"
      class="p-fluid producto-dialog"
    >
      <div class="producto-form-2col">
        <!-- Columna izquierda: Foto -->
        <div class="producto-col-foto">
          <div class="producto-foto-area">
            <img
              v-if="fotoPreview || productoActual.imagen_url"
              :src="fotoPreview || productoActual.imagen_url || ''"
              alt="Foto del producto"
              class="producto-foto-preview"
            />
            <div v-else class="producto-foto-placeholder">
              <i class="pi pi-image" />
              <span>Sin imagen</span>
            </div>
          </div>
          <div class="producto-foto-actions">
            <Button
              icon="pi pi-camera"
              label="Cámara"
              size="small"
              severity="secondary"
              outlined
              @click="capturarFoto"
            />
            <Button
              icon="pi pi-upload"
              label="Archivo"
              size="small"
              severity="secondary"
              outlined
              @click="seleccionarArchivo"
            />
            <Button
              v-if="fotoPreview || productoActual.imagen_url"
              icon="pi pi-trash"
              size="small"
              severity="danger"
              text
              @click="eliminarFoto"
              title="Quitar imagen"
            />
          </div>
          <!-- Input file oculto -->
          <input ref="fileInputRef" type="file" accept="image/*" class="hidden-input" @change="onFileSelected" />
          <!-- Input cámara oculto -->
          <input ref="cameraInputRef" type="file" accept="image/*" capture="environment" class="hidden-input" @change="onFileSelected" />
        </div>

        <!-- Columna derecha: Campos -->
        <div class="producto-col-fields">
          <div class="producto-field">
            <label for="nombre">Nombre del Producto</label>
            <InputText id="nombre" v-model.trim="productoActual.nombre" required autofocus :class="{'p-invalid': submitted && !productoActual.nombre}" />
            <small v-if="submitted && !productoActual.nombre" class="p-error">El nombre es requerido.</small>
          </div>

          <div class="producto-field-row">
            <div class="producto-field">
              <label for="sku">Cód. Barras (SKU)</label>
              <div class="p-inputgroup flex-1">
                <InputText id="sku" v-model.trim="productoActual.sku" />
                <Button icon="pi pi-camera" @click="abrirScanner" />
              </div>
            </div>
            <div class="producto-field">
              <label for="categoria">Categoría</label>
              <Select
                id="categoria"
                v-model="productoActual.categoria"
                :options="categoriasOptions"
                optionLabel="label"
                optionValue="value"
                placeholder="Seleccionar"
                :loading="categoriasStore.loading"
                showClear
              />
            </div>
          </div>

          <div class="producto-field-row">
            <div class="producto-field">
              <label for="costo">Costo (Neto)</label>
              <InputNumber id="costo" v-model="productoActual.costo" @input="handleCostoInput" mode="currency" currency="CLP" locale="es-CL" :maxFractionDigits="0" />
            </div>
            <div class="producto-field">
              <label for="precio">Precio Venta Público (Bruto)</label>
              <InputNumber id="precio" v-model="productoActual.precio" @input="handlePrecioInput" mode="currency" currency="CLP" locale="es-CL" :maxFractionDigits="0" />
            </div>
          </div>

          <div class="producto-field-row">
            <div class="producto-field">
              <label for="margen_ganancia">Margen Ganancia (%)</label>
              <InputNumber id="margen_ganancia" v-model="productoActual.margen_ganancia" @input="handleMargenInput" suffix=" %" :min="0" />
            </div>
            <div class="producto-field">
              <label for="iva">IVA (%)</label>
              <InputNumber id="iva" v-model="productoActual.iva" @input="handleIvaInput" suffix=" %" :min="0" />
            </div>
          </div>

          <!-- Resumen de Costos -->
          <div class="col-span-full mb-4 bg-slate-50 border border-slate-200 rounded p-4 text-sm">
            <h4 class="font-bold text-slate-700 mb-2">Desglose de Precios (Referencial)</h4>
            <div class="flex flex-col gap-1 text-slate-600">
              <div class="flex justify-between">
                <span>Costo Neto:</span>
                <span class="font-medium">{{ formatMonto(resumenCalculo.costo) }}</span>
              </div>
              <div class="flex justify-between">
                <span>Margen Ganancia ({{ productoActual.margen_ganancia || 0 }}%):</span>
                <span class="font-medium text-emerald-600">+ {{ formatMonto(resumenCalculo.gananciaMonto) }}</span>
              </div>
              <div class="flex justify-between">
                <span>IVA ({{ productoActual.iva || 0 }}%):</span>
                <span class="font-medium text-rose-600">+ {{ formatMonto(resumenCalculo.ivaMonto) }}</span>
              </div>
              <div class="flex justify-between border-t border-slate-300 mt-2 pt-2 pt-2 text-base text-slate-900 font-bold">
                <span>Precio Público Sugerido:</span>
                <span>{{ formatMonto(resumenCalculo.precioPublico) }}</span>
              </div>
            </div>
          </div>

          <div class="producto-field-row">
            <div class="producto-field">
              <label for="stock">Stock Inicial</label>
              <InputNumber id="stock" v-model="productoActual.stock" />
            </div>
            <div class="producto-field">
              <label for="stock_minimo">Stock Mínimo</label>
              <InputNumber id="stock_minimo" v-model="productoActual.stock_minimo" />
            </div>
          </div>

          <div class="producto-field">
            <label>¿Se vende por peso?</label>
            <div class="flex items-center gap-2 mt-2">
              <ToggleSwitch v-model="productoActual.es_pesable" />
              <span class="text-sm font-medium">{{ productoActual.es_pesable ? 'Sí (Ej. Pan, Queso)' : 'No (Unidades)' }}</span>
            </div>
          </div>
        </div>
      </div>

      <template #footer>
        <Button label="Cancelar" icon="pi pi-times" text severity="secondary" @click="cerrarDialogo" />
        <Button label="Guardar" icon="pi pi-check" @click="guardarProducto" :loading="productosStore.loading || subiendoFoto" />
      </template>
    </Dialog>

    <!-- Modal Cámara de Foto -->
    <Dialog v-model:visible="mostrarCamaraFoto" header="Capturar Foto" :modal="true" :style="{ width: '480px' }" @hide="cerrarCamaraFoto">
      <div class="flex flex-col items-center gap-3 p-2">
        <div class="relative w-full rounded overflow-hidden bg-black aspect-video flex items-center justify-center">
          <video ref="videoFotoRef" class="w-full h-full object-cover" autoplay muted playsinline></video>
        </div>
        <canvas ref="canvasFotoRef" class="hidden-input"></canvas>
      </div>
      <template #footer>
        <Button label="Cancelar" text severity="secondary" @click="cerrarCamaraFoto" />
        <Button label="Usar Foto" icon="pi pi-check" @click="tomarFotoCamara" />
      </template>
    </Dialog>

    <!-- Modal Scanner de Código de Barras -->
    <Dialog v-model:visible="mostrarScanner" header="Escanear Código" :modal="true" :style="{ width: '400px' }" @hide="cerrarScanner">
      <div class="flex flex-col items-center justify-center p-2">
        <div class="relative w-full rounded overflow-hidden bg-black aspect-video flex items-center justify-center">
          <video ref="videoScannerRef" class="w-full h-full object-cover" autoplay muted playsinline></video>
          <!-- Overlay de escaneo -->
          <div class="absolute inset-x-4 top-1/2 h-0.5 bg-red-500 shadow-[0_0_8px_rgba(239,68,68,0.8)] animate-pulse"></div>
        </div>
        <p class="mt-4 text-center text-sm text-slate-500">Apunta la cámara al código de barras.</p>
      </div>
    </Dialog>

    <!-- Modal Generador de Etiquetas -->
    <Dialog v-model:visible="mostrarEtiquetas" :style="{ width: '400px' }" header="Imprimir Etiquetas" :modal="true">
      <div class="flex flex-col items-center justify-center p-4">
        <p class="mb-4 text-center text-sm text-slate-400">
          Código generado para: <strong>{{ productoEtiqueta?.nombre }}</strong>
        </p>
        
        <div class="bg-white p-4 rounded mb-4 inline-block">
          <!-- Canvas donde JsBarcode dibuja -->
          <canvas ref="barcodeRef"></canvas>
        </div>

        <div class="field w-full mb-4">
          <label class="block text-sm mb-2 text-slate-300">Cantidad a imprimir</label>
          <InputNumber v-model="cantidadEtiquetas" :min="1" :max="100" class="w-full" showButtons />
        </div>
      </div>
      <template #footer>
        <Button label="Cerrar" icon="pi pi-times" class="p-button-text" @click="mostrarEtiquetas = false" />
        <Button label="Imprimir" icon="pi pi-print" class="p-button-info" @click="imprimirEtiquetas" />
      </template>
    </Dialog>

  </div>
</template>

<script setup lang="ts">
import { useToast } from 'primevue/usetoast'
import { useProductosStore } from '~/stores/productos'
import { useCategoriasStore } from '~/stores/categorias'
import { useConfigStore } from '~/stores/config'
import { useFormatMonto } from '~/composables/useFormatMonto'
import type { ProductoLocal } from '~/db'
import JsBarcode from 'jsbarcode'
import { BrowserMultiFormatReader, type IScannerControls } from '@zxing/browser'
import { BarcodeFormat, DecodeHintType } from '@zxing/library'
import { FilterMatchMode } from '@primevue/core/api'

const productosStore = useProductosStore()
const categoriasStore = useCategoriasStore()
const configStore = useConfigStore()
const toast = useToast()
const { formatMonto } = useFormatMonto()
const route = useRoute()
const router = useRouter()

// ----- DataTable & Filters -----
const filters = ref({
  global: { value: null, matchMode: FilterMatchMode.CONTAINS }
})

// Opciones de categorías para el Select
const categoriasOptions = computed(() =>
  categoriasStore.categorias
    .filter((c: any) => c.activo)
    .map((c: any) => ({ label: c.nombre, value: c.nombre }))
)

onMounted(async () => {
  await Promise.all([
    productosStore.fetchProductos(),
    categoriasStore.fetchCategorias(),
    configStore.fetchConfig()
  ])
  await seleccionarProductoDesdeRuta()
})

onUnmounted(() => {
  if (mostrarScanner.value) {
    cerrarScanner()
  }
  if (mostrarCamaraFoto.value) {
    cerrarCamaraFoto()
  }
})
// ----- Selección para impresión masiva -----
const selectedProducts = ref<ProductoLocal[]>([])

async function seleccionarProductoDesdeRuta() {
  const selId = String(route.query.sel || '').trim()
  if (!selId) return

  const producto = productosStore.productos.find((p) => p.id === selId)
  if (!producto) return

  selectedProducts.value = [producto]
  filters.value.global.value = producto.nombre

  await nextTick()
  router.replace({ query: { ...route.query, sel: undefined } })
}

watch(
  () => route.query.sel,
  async (nuevoSel) => {
    if (!nuevoSel) return
    await seleccionarProductoDesdeRuta()
  }
)

function imprimirSeleccionados() {
  const items = selectedProducts.value.filter(p => p.sku)
  if (items.length === 0) {
    toast.add({ severity: 'warn', summary: 'Sin códigos', detail: 'Los productos seleccionados no tienen código de barras (SKU).', life: 4000 })
    return
  }

  const printWindow = window.open('', '_blank', 'width=900,height=700')
  if (!printWindow) return

  // Generar códigos con canvas SVG inline usando JsBarcode
  const barcodeItems = items.map(p => {
    const canvas = document.createElement('canvas')
    try {
      JsBarcode(canvas, p.sku, {
        format: 'CODE128',
        width: 1.5,
        height: 50,
        displayValue: true,
        fontSize: 11,
        margin: 5,
        background: '#ffffff',
        lineColor: '#000000'
      })
      return { nombre: p.nombre, sku: p.sku, dataUrl: canvas.toDataURL('image/png') }
    } catch (_) {
      return { nombre: p.nombre, sku: p.sku, dataUrl: '' }
    }
  })

  const itemsHtml = barcodeItems.map(item => `
    <div class="barcode-item">
      <p class="barcode-name">${item.nombre}</p>
      <img src="${item.dataUrl}" alt="${item.sku}" />
    </div>
  `).join('')

  printWindow.document.write(`
    <html>
    <head>
      <title>Códigos de Barras - GestorPOS</title>
      <style>
        @page { size: letter; margin: 1cm; }
        body { font-family: sans-serif; margin: 0; padding: 10px; }
        h1 { font-size: 14px; text-align: center; margin-bottom: 10px; }
        .grid { display: grid; grid-template-columns: 1fr 1fr; gap: 8px; }
        .barcode-item {
          border: 1px solid #ddd;
          border-radius: 4px;
          padding: 6px 8px;
          text-align: center;
          page-break-inside: avoid;
        }
        .barcode-name {
          font-size: 10px;
          font-weight: 600;
          margin: 0 0 4px;
          white-space: nowrap;
          overflow: hidden;
          text-overflow: ellipsis;
        }
        .barcode-item img {
          max-width: 100%;
          height: auto;
        }
      </style>
    </head>
    <body>
      <h1>Códigos de Barras — GestorPOS (${items.length} productos)</h1>
      <div class="grid">${itemsHtml}</div>
      <script>window.onload = () => { window.print(); setTimeout(() => window.close(), 800); }<\/script>
    </body>
    </html>
  `)
  printWindow.document.close()
}

// ----- Formulario CRUD -----
const productoVacio: Partial<ProductoLocal> = {
  nombre: '', sku: '', precio: 0, costo: 0, stock: 0, categoria: '', activo: true, imagen_url: null, es_pesable: false, stock_minimo: 5, margen_ganancia: 30, iva: 19
}

const mostrarDialogo = ref(false)
const productoActual = ref<Partial<ProductoLocal>>({ ...productoVacio })
const submitted = ref(false)

// ----- Foto del producto -----
const fileInputRef = ref<HTMLInputElement | null>(null)
const cameraInputRef = ref<HTMLInputElement | null>(null)
const fotoPreview = ref<string | null>(null)
const archivoFoto = ref<File | null>(null)
const subiendoFoto = ref(false)
const mostrarCamaraFoto = ref(false)
const videoFotoRef = ref<HTMLVideoElement | null>(null)
const canvasFotoRef = ref<HTMLCanvasElement | null>(null)
let streamCamaraFoto: MediaStream | null = null

function abrirNuevo() {
  productoActual.value = { 
    ...productoVacio,
    margen_ganancia: configStore.configuracion.margen_ganancia_defecto,
    stock_minimo: configStore.configuracion.stock_minimo_defecto
  }
  fotoPreview.value = null
  archivoFoto.value = null
  submitted.value = false
  mostrarDialogo.value = true
}

function abrirEditar(prod: ProductoLocal) {
  productoActual.value = { ...prod }
  fotoPreview.value = null
  archivoFoto.value = null
  submitted.value = false
  mostrarDialogo.value = true
}

function cerrarDialogo() {
  if (mostrarScanner.value) {
    cerrarScanner()
  }
  if (mostrarCamaraFoto.value) {
    cerrarCamaraFoto()
  }
  mostrarDialogo.value = false
  submitted.value = false
  fotoPreview.value = null
  archivoFoto.value = null
}

async function capturarFoto() {
  if (!navigator.mediaDevices?.getUserMedia) {
    cameraInputRef.value?.click()
    return
  }

  try {
    streamCamaraFoto = await navigator.mediaDevices.getUserMedia({
      video: { facingMode: { ideal: 'environment' } },
      audio: false
    })
    mostrarCamaraFoto.value = true
    await nextTick()

    if (videoFotoRef.value) {
      videoFotoRef.value.srcObject = streamCamaraFoto
      await videoFotoRef.value.play().catch(() => {})
    }
  } catch (err) {
    console.warn('No se pudo abrir cámara directa, usando selector de archivos.', err)
    toast.add({ severity: 'warn', summary: 'Cámara', detail: 'No se pudo abrir la cámara directa. Selecciona una imagen.', life: 3000 })
    cameraInputRef.value?.click()
  }
}

function cerrarCamaraFoto() {
  if (streamCamaraFoto) {
    streamCamaraFoto.getTracks().forEach((t) => t.stop())
    streamCamaraFoto = null
  }
  if (videoFotoRef.value) {
    if (videoFotoRef.value.srcObject instanceof MediaStream) {
      videoFotoRef.value.srcObject.getTracks().forEach((t) => t.stop())
    }
    videoFotoRef.value.srcObject = null
  }
  mostrarCamaraFoto.value = false
}

async function tomarFotoCamara() {
  if (!videoFotoRef.value || !canvasFotoRef.value) return
  const video = videoFotoRef.value
  const canvas = canvasFotoRef.value

  const width = video.videoWidth || 1280
  const height = video.videoHeight || 720
  canvas.width = width
  canvas.height = height

  const ctx = canvas.getContext('2d')
  if (!ctx) return
  ctx.drawImage(video, 0, 0, width, height)

  const dataUrl = canvas.toDataURL('image/jpeg', 0.92)
  fotoPreview.value = dataUrl

  const blob = await new Promise<Blob | null>((resolve) => canvas.toBlob(resolve, 'image/jpeg', 0.92))
  if (blob) {
    archivoFoto.value = new File([blob], `producto_${Date.now()}.jpg`, { type: 'image/jpeg' })
  }

  cerrarCamaraFoto()
}

function seleccionarArchivo() {
  fileInputRef.value?.click()
}

function onFileSelected(event: Event) {
  const input = event.target as HTMLInputElement
  const file = input.files?.[0]
  if (!file) return

  archivoFoto.value = file
  const reader = new FileReader()
  reader.onload = (e) => {
    fotoPreview.value = e.target?.result as string
  }
  reader.readAsDataURL(file)
  // Reset input para permitir seleccionar el mismo archivo de nuevo
  input.value = ''
}

function eliminarFoto() {
  fotoPreview.value = null
  archivoFoto.value = null
  productoActual.value.imagen_url = null
}

async function guardarProducto() {
  submitted.value = true
  if (!productoActual.value.nombre?.trim()) return

  try {
    const isNew = !productoActual.value.id

    // Si hay foto nueva, primero guardar el producto para obtener ID, luego subir
    if (archivoFoto.value) {
      subiendoFoto.value = true
      try {
        // Si es nuevo, guardar primero para obtener ID
        if (isNew) {
          const savedProd = await productosStore.saveProducto(productoActual.value)
          if (savedProd) {
            const url = await productosStore.uploadImagen(archivoFoto.value, (savedProd as any).id)
            await productosStore.saveProducto({ ...(savedProd as any), imagen_url: url })
          }
        } else {
          const url = await productosStore.uploadImagen(archivoFoto.value, productoActual.value.id!)
          productoActual.value.imagen_url = url
          await productosStore.saveProducto(productoActual.value)
        }
      } finally {
        subiendoFoto.value = false
      }
    } else {
      await productosStore.saveProducto(productoActual.value)
    }

    toast.add({ severity: 'success', summary: 'Éxito', detail: `Producto ${isNew ? 'creado' : 'actualizado'} correctamente.`, life: 3000 })
    cerrarDialogo()
  } catch (error: any) {
    toast.add({ severity: 'error', summary: 'Error', detail: 'No se pudo guardar el producto. ' + error.message, life: 5000 })
  }
}

// ----- Etiquetas de Código de Barras -----
const mostrarEtiquetas = ref(false)
const productoEtiqueta = ref<ProductoLocal | null>(null)
const cantidadEtiquetas = ref(1)
const barcodeRef = ref<HTMLCanvasElement | null>(null)

function abrirEtiquetas(prod: ProductoLocal) {
  if (!prod.sku) return
  productoEtiqueta.value = prod
  cantidadEtiquetas.value = 1
  mostrarEtiquetas.value = true
  
  // Dibujar barcode después de montar el modal
  nextTick(() => {
    if (barcodeRef.value) {
      JsBarcode(barcodeRef.value, prod.sku, {
        format: "CODE128",
        width: 2,
        height: 60,
        displayValue: true,
        fontSize: 14,
        margin: 10,
        background: "#ffffff",
        lineColor: "#000000"
      });
    }
  })
}

function imprimirEtiquetas() {
  if (!barcodeRef.value) return
  
  const width = 800
  const height = 600
  const printWindow = window.open('', '_blank', `width=${width},height=${height}`)
  
  if (!printWindow) {
    toast.add({ severity: 'error', summary: 'Error', detail: 'Por favor, permite los pop-ups para imprimir.', life: 3000 })
    return
  }

  const imgData = barcodeRef.value.toDataURL('image/png')
  
  let html = `
    <html>
      <head>
        <title>Imprimir Etiquetas</title>
        <style>
          body { font-family: sans-serif; margin: 0; padding: 20px; }
          .grid { display: grid; grid-template-columns: repeat(auto-fill, minmax(200px, 1fr)); gap: 15px; }
          .label { border: 1px solid #ccc; padding: 10px; text-align: center; border-radius: 4px; }
          .label img { max-width: 100%; height: auto; }
          .name { font-size: 12px; margin-top: 5px; font-weight: bold; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
          .price { font-size: 14px; margin-top: 2px; }
          @media print {
            body { padding: 0; }
            .grid { gap: 10px; }
            .label { border: 1px dashed #999; page-break-inside: avoid; }
          }
        </style>
      </head>
      <body>
        <div class="grid">
  `
  
  for (let i = 0; i < cantidadEtiquetas.value; i++) {
    html += `
      <div class="label">
        <img src="${imgData}" />
        <div class="name">${productoEtiqueta.value?.nombre}</div>
        <div class="price">${formatMonto(productoEtiqueta.value?.precio || 0)}</div>
      </div>
    `
  }
  
  html += `
        </div>
        <scr\` + \`ipt>
          window.onload = () => {
            window.print();
            setTimeout(() => window.close(), 500);
          }
        </scr\` + \`ipt>
      </body>
    </html>
  `
  
  printWindow.document.write(html)
  printWindow.document.close()
}
// ----- Scanner Logica -----
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

  productoActual.value.sku = sku
  toast.add({ severity: 'success', summary: 'Escaneado', detail: sku, life: 3000 })
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
      } catch (_) {
        // ignore detector frame errors
      }
    }, 250)
  } catch (_) {
    // fallback opcional, no bloquea zxing
  }
}

async function abrirScanner() {
  if (mostrarScanner.value) return

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
    toast.add({ severity: 'error', summary: 'Error', detail: 'No se pudo inicializar el visor de camara', life: 3000 })
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
        if (result) {
          procesarCodigoDetectado(result.getText())
          return
        }

        // NotFoundException es normal entre frames sin codigo
        if (error && (error as any).name === 'NotFoundException') return
      }
    )

    if (videoScannerRef.value.srcObject instanceof MediaStream) {
      activeStream = videoScannerRef.value.srcObject
    }

    await iniciarFallbackBarcodeDetector()
  } catch (err: any) {
    console.error('Error camara:', err)
    toast.add({ severity: 'error', summary: 'Error de camara', detail: 'No se pudo iniciar el escaner.', life: 3000 })
    cerrarScanner()
  }
}

function cerrarScanner() {
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
    } catch (_) {}
  }

  if (activeStream) {
    activeStream.getTracks().forEach((track) => track.stop())
    activeStream = null
  }

  if (videoScannerRef.value) {
    const stream = videoScannerRef.value.srcObject
    if (stream instanceof MediaStream) {
      stream.getTracks().forEach((track) => track.stop())
    }
    videoScannerRef.value.srcObject = null
  }

  mostrarScanner.value = false
}

watch(mostrarScanner, (visible) => {
  if (!visible) cerrarScanner()
})
// ----- AutoCalc Precio y Costo -----
const resumenCalculo = computed(() => {
  const costo = Number(productoActual.value.costo) || 0
  const margen = Number(productoActual.value.margen_ganancia) || 0
  const iva = Number(productoActual.value.iva) ?? 19 // Usar 19 por defecto en la ui si borra todo
  
  const gananciaMonto = costo * (margen / 100)
  const precioNeto = costo + gananciaMonto
  const ivaMonto = precioNeto * (iva / 100)
  const precioPublico = Math.round((precioNeto + ivaMonto) / 10) * 10
  
  return { costo, gananciaMonto, precioNeto, ivaMonto, precioPublico }
})

function handleCostoInput(e: any) {
  productoActual.value.costo = e.value || 0
  onCostoChange()
}

function handleMargenInput(e: any) {
  productoActual.value.margen_ganancia = e.value || 0
  onCostoChange()
}

function handleIvaInput(e: any) {
  productoActual.value.iva = e.value || 0
  onCostoChange()
}

function handlePrecioInput(e: any) {
  productoActual.value.precio = e.value || 0
  onPrecioChange()
}

function onCostoChange() {
  // Al cambiar costo, margen o iva -> calculamos el Precio de Venta
  const costo = Number(productoActual.value.costo) || 0
  const margen = Number(productoActual.value.margen_ganancia) || 0
  const iva = Number(productoActual.value.iva) || 0
  
  if (costo >= 0) {
    const precioNeto = costo * (1 + margen / 100)
    const precioBruto = precioNeto * (1 + iva / 100)
    productoActual.value.precio = Math.round(precioBruto / 10) * 10
  }
}

function onPrecioChange() {
  // Al cambiar precio directo -> calculamos el Costo
  const precioBruto = Number(productoActual.value.precio) || 0
  const margen = Number(productoActual.value.margen_ganancia) || 0
  const iva = Number(productoActual.value.iva) || 0
  
  if (precioBruto >= 0) {
    const precioNeto = precioBruto / (1 + iva / 100)
    const costoSugerido = precioNeto / (1 + margen / 100)
    productoActual.value.costo = Math.round(costoSugerido)
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
  position: sticky;
  top: 0;
  z-index: 6;
  background: var(--bg-app);
  padding: 0.4rem 0;
}

.admin-header-actions {
  display: flex;
  gap: 1rem;
  align-items: center;
  width: 100%;
}

.admin-search {
  width: 300px;
  max-width: 100%;
}

:deep(.p-datatable) {
  background: var(--bg-surface);
  border-radius: 1rem;
  border: 1px solid var(--border-sidebar);
  overflow: hidden;
}

:deep(.p-datatable-header) {
  background: transparent;
  border-bottom: 1px solid var(--border-subtle);
}

:deep(.p-datatable-thead > tr > th) {
  background: var(--bg-app) !important;
  color: var(--text-muted) !important;
  font-weight: 600;
  font-size: 0.85rem;
  text-transform: uppercase;
  letter-spacing: 0.05em;
  padding: 1rem;
  border: none !important;
}

:deep(.p-datatable-tbody > tr) {
  background: transparent !important;
  color: var(--text-app);
  transition: background 0.2s ease;
}

:deep(.p-datatable-tbody > tr:hover) {
  background: rgba(99, 102, 241, 0.05) !important;
}

:deep(.p-datatable-tbody > tr > td) {
  border-color: var(--border-subtle) !important;
  padding: 1rem;
}

:deep(.p-paginator) {
  background: transparent !important;
  border-top: 1px solid var(--border-subtle) !important;
}

/* ─── Producto form modal 2 columnas ─── */
.producto-form-2col {
  display: grid;
  grid-template-columns: 220px 1fr;
  gap: 1.5rem;
  padding: 0.5rem 0;
}

:deep(.producto-dialog .p-dialog-content) {
  max-height: min(72dvh, 760px);
  overflow-y: auto;
}

:deep(.producto-dialog .p-dialog-footer) {
  border-top: 1px solid var(--border-subtle);
  padding-top: 0.75rem;
}

.producto-col-foto {
  display: flex;
  flex-direction: column;
  gap: 0.75rem;
  align-items: center;
}

.producto-foto-area {
  width: 200px;
  height: 200px;
  border-radius: 1rem;
  border: 2px dashed var(--border-subtle);
  overflow: hidden;
  display: flex;
  align-items: center;
  justify-content: center;
  background: var(--bg-app);
  transition: border-color 0.2s ease;
}

.producto-foto-area:hover {
  border-color: var(--color-brand-primary, #6366f1);
}

.producto-foto-preview {
  width: 100%;
  height: 100%;
  object-fit: cover;
  border-radius: 0.85rem;
}

.producto-foto-placeholder {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 0.5rem;
  color: var(--text-muted);
}

.producto-foto-placeholder i {
  font-size: 2.5rem;
  opacity: 0.4;
}

.producto-foto-placeholder span {
  font-size: 0.8rem;
  opacity: 0.6;
}

.producto-foto-actions {
  display: flex;
  gap: 0.5rem;
  align-items: center;
  flex-wrap: wrap;
  justify-content: center;
}

.hidden-input {
  display: none !important;
}

.producto-col-fields {
  display: flex;
  flex-direction: column;
  gap: 1rem;
}

.producto-field {
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
}

.producto-field label {
  font-size: 0.875rem;
  font-weight: 600;
  color: var(--text-muted);
}

.producto-field-row {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 1rem;
}

.precio-cell {
  font-weight: 700;
  color: #4ade80;
}

/* Admin search fix */
:deep(.admin-search) {
  width: 300px;
  max-width: 100%;
}

:deep(.admin-search input) {
  width: 100%;
}

@media (max-width: 768px) {
  .admin-page {
    padding: 0.75rem;
  }

  .admin-header {
    margin-bottom: 0.55rem;
    padding: 0.25rem 0;
  }

  .admin-header-actions {
    width: 100%;
    gap: 0.45rem;
    align-items: stretch;
  }

  .admin-search {
    flex: 1;
    width: auto;
    min-width: 0;
  }

  :deep(.admin-search) {
    flex: 1;
    width: auto;
    min-width: 0;
  }

  :deep(.admin-header-actions .p-button) {
    flex-shrink: 0;
    white-space: nowrap;
    padding: 0.5rem 0.7rem !important;
    font-size: 0.86rem !important;
  }

  :deep(.producto-dialog .p-dialog-header) {
    padding: 0.7rem 0.85rem !important;
  }

  :deep(.producto-dialog .p-dialog-content) {
    padding: 0.5rem 0.85rem 0.35rem !important;
    max-height: 74dvh;
  }

  :deep(.producto-dialog .p-dialog-footer) {
    padding: 0.55rem 0.85rem calc(0.55rem + env(safe-area-inset-bottom)) !important;
  }

  .producto-form-2col {
    grid-template-columns: 1fr;
    gap: 0.9rem;
    padding: 0.25rem 0 0.1rem;
  }

  .producto-col-foto {
    align-items: stretch;
    gap: 0.5rem;
  }

  .producto-foto-area {
    width: 100%;
    max-width: 180px;
    height: 150px;
    margin: 0 auto;
  }

  .producto-foto-actions {
    justify-content: center;
    gap: 0.35rem;
  }

  .producto-col-fields {
    gap: 0.7rem;
  }

  .producto-field {
    gap: 0.35rem;
  }

  .producto-field-row {
    grid-template-columns: 1fr;
    gap: 0.7rem;
  }

  .producto-field label {
    font-size: 0.82rem;
  }
}
</style>






