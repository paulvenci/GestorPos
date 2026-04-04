<template>
  <div class="admin-page">
    <!-- Encabezado -->
    <div class="admin-header">
      <div class="admin-header-titles">
        <h1>Inventario de Productos</h1>
        <p>Administra el catálogo, precios, stock y genera etiquetas de códigos de barras.</p>
      </div>
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
    <Dialog v-model:visible="mostrarDialogo" :style="{ width: '750px' }" header="Detalles del Producto" :modal="true" class="p-fluid producto-dialog">
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
              <InputText id="sku" v-model.trim="productoActual.sku" />
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
              <label for="precio">Precio Venta</label>
              <InputNumber id="precio" v-model="productoActual.precio" mode="currency" currency="CLP" locale="es-CL" :maxFractionDigits="0" />
            </div>
            <div class="producto-field">
              <label for="costo">Costo</label>
              <InputNumber id="costo" v-model="productoActual.costo" mode="currency" currency="CLP" locale="es-CL" :maxFractionDigits="0" />
            </div>
          </div>

          <div class="producto-field" style="max-width: 50%;">
            <label for="stock">Stock Inicial</label>
            <InputNumber id="stock" v-model="productoActual.stock" />
          </div>
        </div>
      </div>

      <template #footer>
        <Button label="Cancelar" icon="pi pi-times" text severity="secondary" @click="cerrarDialogo" />
        <Button label="Guardar" icon="pi pi-check" @click="guardarProducto" :loading="productosStore.loading || subiendoFoto" />
      </template>
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
import { FilterMatchMode } from '@primevue/core/api'
import { useToast } from 'primevue/usetoast'
import { useProductosStore } from '~/stores/productos'
import { useCategoriasStore } from '~/stores/categorias'
import { useFormatMonto } from '~/composables/useFormatMonto'
import type { ProductoLocal } from '~/db'
import JsBarcode from 'jsbarcode'

const productosStore = useProductosStore()
const categoriasStore = useCategoriasStore()
const toast = useToast()
const { formatMonto } = useFormatMonto()

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

onMounted(() => {
  productosStore.fetchProductos()
  categoriasStore.fetchCategorias()
})
// ----- Selección para impresión masiva -----
const selectedProducts = ref<ProductoLocal[]>([])

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
  nombre: '', sku: '', precio: 0, costo: 0, stock: 0, categoria: '', activo: true, imagen_url: null
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

function abrirNuevo() {
  productoActual.value = { ...productoVacio }
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
  mostrarDialogo.value = false
  submitted.value = false
  fotoPreview.value = null
  archivoFoto.value = null
}

function capturarFoto() {
  cameraInputRef.value?.click()
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
</script>

<style scoped>
.admin-page {
  padding: 2.5rem;
  color: var(--text-app);
}

.admin-header {
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  margin-bottom: 2rem;
  flex-wrap: wrap;
  gap: 1.5rem;
}

.admin-header-titles h1 {
  font-size: 2rem;
  font-weight: 700;
  margin: 0 0 0.5rem;
  color: var(--text-app);
  letter-spacing: -0.03em;
}

.admin-header-titles p {
  color: var(--text-muted);
  margin: 0;
  font-size: 0.95rem;
}

.admin-header-actions {
  display: flex;
  gap: 1rem;
  align-items: center;
}

.admin-search {
  width: 300px;
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
}

:deep(.admin-search input) {
  width: 100%;
}
</style>

