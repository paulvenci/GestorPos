<template>
  <div class="admin-page max-w-7xl mx-auto px-4">
    <div class="admin-header flex justify-between items-center mb-6">
      <h1 class="text-2xl font-bold flex items-center gap-2 text-color">
        <i class="pi pi-box text-indigo-500"></i>
        Recepción de Mercadería
      </h1>
      <Button label="Volver" icon="pi pi-arrow-left" text severity="secondary" @click="router.back()" />
    </div>

    <!-- Selector de Modo -->
    <div class="grid grid-cols-2 gap-4 mb-6" v-if="!productosExtraidos.length && !loadingIA">
      <div 
        class="surface-card p-6 rounded-xl border-2 cursor-pointer transition-all text-center"
        :class="modo === 'ia' ? 'border-indigo-500 shadow-lg' : 'surface-border hover:border-indigo-300'"
        @click="modo = 'ia'"
      >
        <i class="pi pi-camera text-4xl mb-3" :class="modo === 'ia' ? 'text-indigo-500' : 'text-color-secondary'"></i>
        <h3 class="font-bold text-lg">Con IA (Foto)</h3>
        <p class="text-color-secondary text-sm mt-1">Sube una foto de la factura y la IA extrae los productos.</p>
      </div>
      <div 
        class="surface-card p-6 rounded-xl border-2 cursor-pointer transition-all text-center"
        :class="modo === 'manual' ? 'border-indigo-500 shadow-lg' : 'surface-border hover:border-indigo-300'"
        @click="modo = 'manual'; cargarPedidosPendientes()"
      >
        <i class="pi pi-list-check text-4xl mb-3" :class="modo === 'manual' ? 'text-indigo-500' : 'text-color-secondary'"></i>
        <h3 class="font-bold text-lg">Manual (Desde Pedido)</h3>
        <p class="text-color-secondary text-sm mt-1">Selecciona un pedido pendiente y confirma la recepción.</p>
      </div>
    </div>

    <!-- ============ MODO IA ============ -->
    <template v-if="modo === 'ia'">
      <!-- Zona de Carga -->
      <div v-if="!productosExtraidos.length && !loadingIA" class="upload-zone border-2 border-dashed border-indigo-200 dark:border-indigo-800 rounded-xl p-10 flex flex-col items-center justify-center surface-card">
        <i class="pi pi-camera text-6xl text-indigo-300 mb-4"></i>
        <h2 class="text-xl font-semibold mb-2 text-color">Sube o toma una foto a la factura</h2>
        <p class="text-color-secondary text-center max-w-md mb-6">
          Nuestra inteligencia artificial leerá el documento e identificará automáticamente los productos, cantidades y precios de costo.
        </p>
        <div class="flex gap-4">
          <Button label="Abrir Cámara" icon="pi pi-camera" severity="primary" @click="triggerCamera" />
          <Button label="Subir Archivo" icon="pi pi-upload" severity="secondary" outlined @click="triggerFile" />
        </div>
        <input ref="fileInput" type="file" accept="image/*" class="hidden" @change="onFileSelected" />
        <input ref="cameraInput" type="file" accept="image/*" capture="environment" class="hidden" @change="onFileSelected" />
      </div>

      <!-- Loading IA -->
      <div v-else-if="loadingIA" class="flex flex-col items-center justify-center p-12 surface-card border surface-border rounded-xl">
        <i class="pi pi-spin pi-spinner text-5xl text-indigo-500 mb-6"></i>
        <h2 class="text-xl font-semibold text-color">Procesando documento...</h2>
        <p class="text-color-secondary mt-2">La IA está leyendo y extrayendo los productos.</p>
      </div>
    </template>

    <!-- ============ MODO MANUAL ============ -->
    <template v-if="modo === 'manual' && !productosExtraidos.length">
      <div class="surface-card rounded-xl border surface-border p-6">
        <h2 class="font-bold text-lg mb-4 flex items-center gap-2 text-color">
          <i class="pi pi-list"></i> Pedidos Pendientes de Recepción
        </h2>
        <div v-if="pedidosPendientes.length === 0" class="text-center text-color-secondary py-10">
          <i class="pi pi-inbox text-5xl mb-3 block opacity-40"></i>
          <p>No hay pedidos con estado "Enviado" pendientes de recepción.</p>
          <Button label="Ir a Órdenes de Compra" icon="pi pi-arrow-right" text class="mt-3" @click="router.push('/admin/compras')" />
        </div>
        <div v-else class="flex flex-col gap-3">
          <div 
            v-for="pedido in pedidosPendientes" 
            :key="pedido.id"
            class="flex items-center justify-between p-4 border surface-border rounded-lg cursor-pointer hover:surface-hover transition-colors"
            @click="cargarDesdePedido(pedido)"
          >
            <div>
              <p class="font-bold text-color">{{ pedido.proveedor?.nombre || 'Sin Proveedor' }}</p>
              <p class="text-xs text-color-secondary">{{ new Date(pedido.created_at!).toLocaleDateString('es-CL') }} · {{ pedido.detalles?.length || '?' }} productos</p>
            </div>
            <div class="flex items-center gap-3">
              <span class="font-bold text-color">{{ formatMonto(pedido.total_estimado) }}</span>
              <i class="pi pi-chevron-right text-color-secondary"></i>
            </div>
          </div>
        </div>
      </div>
    </template>

    <!-- ============ OC VINCULADA (banner) ============ -->
    <div v-if="pedidoVinculado && productosExtraidos.length" class="mb-4 p-3 rounded-lg border flex items-center justify-between bg-blue-50 dark:bg-blue-900/20 border-blue-200 dark:border-blue-800">
      <div class="flex items-center gap-2">
        <i class="pi pi-link text-blue-500"></i>
        <span class="text-sm font-medium text-color">Vinculado a OC de <strong>{{ pedidoVinculado.proveedor?.nombre || 'Sin Proveedor' }}</strong></span>
      </div>
      <Tag value="Se marcará como Recibido" severity="info" />
    </div>

    <!-- ============ RESULTADOS Y CONCILIACIÓN (compartido IA y Manual) ============ -->
    <div v-if="productosExtraidos.length > 0" class="results-zone">
      <div class="flex justify-between items-end mb-4">
        <div>
          <h2 class="text-xl font-semibold text-emerald-600 dark:text-emerald-400">
            <i class="pi pi-check-circle mr-2"></i>{{ modo === 'ia' ? 'Factura procesada con éxito' : 'Pedido cargado' }}
          </h2>
          <p class="text-sm text-color-secondary">Revisa los productos y ajusta cantidades o costos antes de confirmar.</p>
        </div>
        <div class="flex gap-2">
          <Button label="Cancelar" icon="pi pi-refresh" severity="secondary" outlined @click="resetForm" />
          <Button label="Procesar Ingreso" icon="pi pi-save" severity="success" @click="procesarIngresoFinal" :loading="saving" />
        </div>
      </div>

      <!-- Sección del Proveedor -->
      <div class="mb-6 p-4 surface-card rounded-xl border surface-border">
        <h3 class="text-lg font-bold mb-3 flex items-center gap-2 text-blue-500">
          <i class="pi pi-building"></i> Confirmar Proveedor
        </h3>
        <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div class="flex flex-col gap-2">
            <label class="text-xs font-bold text-color-secondary uppercase">Buscar Proveedor (Nombre o RUT)</label>
            <AutoComplete
              v-model="proveedorSeleccionado"
              :suggestions="proveedoresFiltrados"
              optionLabel="nombre"
              placeholder="Escribe el nombre o RUT..."
              @complete="buscarProveedor"
              @item-select="onProveedorSelect"
              dropdown
              class="w-full"
            >
              <template #option="slotProps">
                <div class="flex flex-col">
                  <span class="font-bold">{{ slotProps.option.nombre }}</span>
                  <span class="text-xs text-color-secondary">{{ slotProps.option.rut }}</span>
                </div>
              </template>
            </AutoComplete>
          </div>
          <div class="flex flex-col gap-2">
            <label class="text-xs font-bold text-color-secondary uppercase">RUT Confirmado</label>
            <InputText v-model="infoProveedor.rut" readonly class="w-full bg-slate-50 dark:bg-slate-800 opacity-70" />
          </div>
          <div class="flex flex-col gap-2">
            <label class="text-xs font-bold text-color-secondary uppercase">N° de Factura / Documento</label>
            <InputText v-model="infoProveedor.factura" placeholder="Ej: 12540" class="w-full border-blue-200" />
          </div>
        </div>
      </div>

      <!-- Tabla de conciliación -->
      <DataTable :value="productosExtraidos" class="p-datatable-sm" responsiveLayout="scroll" :rowClass="rowClass">
        <Column header="Original en Factura">
          <template #body="{ data }">
            <div class="font-medium text-color">{{ data.nombreOriginal }}</div>
            <div v-if="data.nombreFactura && data.nombreFactura !== data.nombreOriginal" class="text-xs text-color-secondary mt-1">
              <i class="pi pi-file text-xs"></i> {{ data.nombreFactura }}
            </div>
          </template>
        </Column>
        <Column header="SKU / Cod." style="width: 140px">
          <template #body="{ data }">
            <InputText v-model="data.skuOriginal" placeholder="Código..." class="w-full text-sm" />
          </template>
        </Column>
        <Column header="Cant." style="width: 100px">
          <template #body="{ data }">
            <InputNumber v-model="data.cantidad" :min="1" class="w-full" input-class="w-full text-center" />
            <div v-if="data.unidadPedida" class="text-[10px] text-center text-indigo-500 font-bold mt-1 uppercase">
              Pidió: {{ data.unidadPedida }}
            </div>
          </template>
        </Column>
        <Column header="Costo Unit. (Neto)" style="width: 140px">
          <template #body="{ data }">
            <InputNumber v-model="data.costo" mode="currency" currency="CLP" locale="es-CL" :maxFractionDigits="0" class="w-full" input-class="w-full" />
          </template>
        </Column>
        <Column header="Producto Asociado en Sistema">
          <template #body="{ data }">
            <AutoComplete
              v-model="data.productoAsociado"
              :suggestions="productosSugeridos"
              optionLabel="nombre"
              placeholder="Buscar en inventario o Crear..."
              @complete="buscarProducto"
              dropdown
              class="w-full"
            >
              <template #option="slotProps">
                <div class="flex items-center gap-2">
                  <Tag v-if="slotProps.option.value === 'NUEVO'" severity="success" value="NUEVO" class="text-[10px]" />
                  <span>{{ slotProps.option.nombre }}</span>
                </div>
              </template>
            </AutoComplete>
          </template>
        </Column>
        <Column header="Estado" style="width: 120px">
          <template #body="{ data }">
            <Tag v-if="data.productoAsociado?.value === 'NUEVO'" severity="info" value="Creará Nuevo" />
            <Tag v-else-if="data.productoAsociado?.value" severity="success" value="Vinculará" />
            <Tag v-else severity="warning" value="Falta Asociar" />
          </template>
        </Column>
        <Column style="width: 50px">
          <template #body="{ index }">
            <Button icon="pi pi-trash" text severity="danger" size="small" @click="quitarFila(index)" />
          </template>
        </Column>
      </DataTable>

      <div class="mt-4 p-3 rounded-lg border flex gap-3 items-start bg-amber-50 dark:bg-amber-900/10 border-amber-300 dark:border-amber-700">
        <i class="pi pi-exclamation-triangle text-amber-600 dark:text-amber-400 text-xl mt-0.5"></i>
        <div>
          <p class="font-bold text-amber-800 dark:text-amber-300 text-sm">Aviso importante sobre los costos</p>
          <p class="text-amber-700 dark:text-amber-400 text-xs">Al confirmar este ingreso, el <strong>Costo Neto</strong> de los productos se actualizará al valor indicado.</p>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { useToast } from 'primevue/usetoast'
import { useProductosStore } from '~/stores/productos'
import { useAuthStore } from '~/stores/auth'
import { useComprasStore } from '~/stores/compras'
import { useProveedoresStore } from '~/stores/proveedores'
import type { PedidoCompra } from '~/stores/compras'

const toast = useToast()
const router = useRouter()
const productosStore = useProductosStore()
const authStore = useAuthStore()
const comprasStore = useComprasStore()
const proveedoresStore = useProveedoresStore()

const fileInput = ref<HTMLInputElement | null>(null)
const cameraInput = ref<HTMLInputElement | null>(null)

const loadingIA = ref(false)
const saving = ref(false)
const modo = ref<'ia' | 'manual'>('ia')

// Pedido vinculado (si se está recibiendo desde una OC)
const pedidoVinculado = ref<PedidoCompra | null>(null)
const pedidosPendientes = ref<PedidoCompra[]>([])

interface FilaRevision {
  nombreOriginal: string;
  nombreFactura?: string;
  cantidad: number;
  costo: number;
  skuOriginal?: string;
  umOriginal?: string;
  unidadesPorCaja?: number;
  productoAsociado: any | null;
  unidadPedida?: string;
}

const productosExtraidos = ref<FilaRevision[]>([])
const infoProveedor = ref({ rut: '', nombre: '', factura: '' })
const proveedorSeleccionado = ref<any>(null)
const proveedoresFiltrados = ref<any[]>([])

const formatMonto = (valor: number) => {
  return new Intl.NumberFormat('es-CL', { style: 'currency', currency: 'CLP' }).format(valor)
}

onMounted(async () => {
  if (productosStore.productos.length === 0) {
    await productosStore.fetchProductos()
  }
  if (proveedoresStore.proveedores.length === 0) {
    await proveedoresStore.fetchProveedores()
  }
})

// ----- Captura de Imagen -----
function triggerFile() { fileInput.value?.click() }
function triggerCamera() { cameraInput.value?.click() }

async function onFileSelected(event: Event) {
  const input = event.target as HTMLInputElement
  const file = input.files?.[0]
  if (!file) return
  loadingIA.value = true
  try {
    const base64 = await toBase64(file)
    await procesarConIA(base64 as string, file.type)
  } catch (err: any) {
    toast.add({ severity: 'error', summary: 'Error local', detail: 'No se pudo leer la imagen.', life: 4000 })
    loadingIA.value = false
  }
  input.value = ''
}

function toBase64(file: File) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader()
    reader.readAsDataURL(file)
    reader.onload = () => resolve(reader.result)
    reader.onerror = error => reject(error)
  })
}

// ----- IA Backend -----
async function procesarConIA(imageBase64: string, mimeType: string) {
  try {
    const response = await $fetch('/api/admin/procesar-factura', {
      method: 'POST',
      body: { imageBase64, mimeType }
    })

    if (response.success && response.productos) {
      if (response.proveedor) {
        const rutLimpio = response.proveedor.rut || ''
        infoProveedor.value = {
          rut: rutLimpio,
          nombre: response.proveedor.nombre || '',
          factura: response.n_factura || ''
        }
        
        // Intentar buscar match en nuestra base de datos para pre-seleccionar el AutoComplete
        const match = proveedoresStore.proveedores.find(p => p.rut === rutLimpio)
        if (match) {
          proveedorSeleccionado.value = match
        } else {
          proveedorSeleccionado.value = response.proveedor.nombre
        }

        // Intentar vincular con OC pendiente del proveedor detectado
        if (rutLimpio) {
          const prov = await comprasStore.buscarProveedorPorRut(rutLimpio)
          if (prov) {
            const pendientes = await comprasStore.fetchPedidosPendientes(prov.id)
            if (pendientes.length > 0) {
              pedidoVinculado.value = pendientes[0]
              toast.add({ severity: 'info', summary: 'OC encontrada', detail: `Se vinculó automáticamente con un pedido pendiente de ${prov.nombre}.`, life: 5000 })
            }
          }
        }
      }
      prepararTablaConciliacion(response.productos)
    }
  } catch (error: any) {
    const detail = error.data?.statusMessage || error.message || 'Error desconocido'
    toast.add({ severity: 'error', summary: 'Error IA', detail, life: 7000 })
  } finally {
    loadingIA.value = false
  }
}

// ----- Modo Manual: Cargar desde OC -----
async function cargarPedidosPendientes() {
  const pendientes = await comprasStore.fetchPedidosPendientes()
  // Cargar detalles de cada pedido
  for (const p of pendientes) {
    p.detalles = await comprasStore.fetchDetalles(p.id!)
  }
  pedidosPendientes.value = pendientes
}

async function cargarDesdePedido(pedido: PedidoCompra) {
  pedidoVinculado.value = pedido
  infoProveedor.value = {
    rut: pedido.proveedor?.rut || '',
    nombre: pedido.proveedor?.nombre || '',
    factura: ''
  }
  proveedorSeleccionado.value = pedido.proveedor

  const detalles = await comprasStore.fetchDetalles(pedido.id!)
  productosExtraidos.value = detalles.map(d => ({
    nombreOriginal: d.producto?.nombre || 'Producto',
    cantidad: d.cantidad_pedida,
    costo: d.precio_unitario_estimado || d.producto?.costo || 0,
    skuOriginal: d.producto?.sku || '',
    productoAsociado: d.producto ? { value: d.producto.id, nombre: d.producto.nombre, match: true } : null,
    unidadPedida: d.unidad
  }))

  toast.add({ severity: 'success', summary: 'Pedido cargado', detail: `${detalles.length} productos listos para confirmar.`, life: 3000 })
}

// ----- Búsqueda de Proveedores -----
function buscarProveedor(event: any) {
  const query = (event.query || '').toLowerCase().trim()
  if (!query) {
    proveedoresFiltrados.value = [...proveedoresStore.proveedores]
    return
  }

  proveedoresFiltrados.value = proveedoresStore.proveedores.filter(p => 
    p.nombre.toLowerCase().includes(query) || 
    (p.rut && p.rut.toLowerCase().includes(query))
  )
}

function onProveedorSelect(event: any) {
  const prov = event.value
  infoProveedor.value = {
    rut: prov.rut || '',
    nombre: prov.nombre,
    factura: infoProveedor.value.factura
  }
  
  // Al seleccionar un proveedor, buscamos si tiene OCs pendientes
  comprasStore.fetchPedidosPendientes(prov.id).then(pendientes => {
    if (pendientes.length > 0) {
      pedidoVinculado.value = pendientes[0]
      toast.add({ severity: 'info', summary: 'OC encontrada', detail: `Se vinculó con un pedido pendiente de ${prov.nombre}.`, life: 4000 })
      
      // Si el modo es IA y seleccionamos manualmente, tal vez queramos cargar los items de la OC
      // Pero por ahora solo vinculamos para el estado final.
    } else {
      pedidoVinculado.value = null
    }
  })
}

// ----- Conciliación -----
const productosSugeridos = ref<any[]>([])
const catInventario = computed(() => productosStore.productos)

function prepararTablaConciliacion(itemsIA: any[]) {
  productosExtraidos.value = itemsIA.map(item => {
    let bestMatch = null
    const textOriginal = item.nombre?.toLowerCase() || ''
    if (item.sku) {
      bestMatch = catInventario.value.find(p => p.sku === item.sku)
    }
    if (!bestMatch) {
      bestMatch = catInventario.value.find(p => textOriginal.includes(p.nombre.toLowerCase()) || p.nombre.toLowerCase().includes(textOriginal))
    }
    let asociadoInicial = null
    if (bestMatch) {
      asociadoInicial = { value: bestMatch.id, nombre: bestMatch.nombre, match: true }
    } else {
      asociadoInicial = { value: 'NUEVO', nombre: item.nombre, match: false }
    }
    return {
      nombreOriginal: item.nombre,
      nombreFactura: item.nombre_original || '',
      cantidad: item.cantidad || 1,
      costo: item.costo || 0,
      skuOriginal: item.sku,
      umOriginal: item.um_original || 'UN',
      unidadesPorCaja: item.unidades_por_caja || 1,
      productoAsociado: asociadoInicial
    }
  })
  toast.add({ severity: 'success', summary: 'Proceso completado', detail: `Se encontraron ${itemsIA.length} productos.`, life: 3000 })
}

function buscarProducto(event: any) {
  const query = (event.query || '').toLowerCase().trim()
  let options = catInventario.value.map(p => ({
    label: `${p.nombre}${p.sku ? ' ['+p.sku+']' : ''} (Stock: ${p.stock})`,
    value: p.id,
    nombre: p.nombre
  }))
  if (query) {
    options = options.filter(o => o.label.toLowerCase().includes(query))
  }
  const queryName = query ? query : 'Nuevo Producto'
  productosSugeridos.value = [{ value: 'NUEVO', nombre: queryName, isNew: true }, ...options]
}

function quitarFila(index: number) {
  productosExtraidos.value.splice(index, 1)
}

function resetForm() {
  productosExtraidos.value = []
  loadingIA.value = false
  pedidoVinculado.value = null
}

const rowClass = (data: FilaRevision) => {
  if (!data.productoAsociado?.value) return 'bg-red-50 dark:bg-red-900/10'
  return ''
}

// ----- Procesar Final -----
async function procesarIngresoFinal() {
  if (productosExtraidos.value.length === 0) return
  const faltanAsociar = productosExtraidos.value.some(p => !p.productoAsociado?.value)
  if (faltanAsociar) {
    toast.add({ severity: 'warn', summary: 'Atención', detail: 'Hay productos sin asociar.', life: 5000 })
    return
  }

  saving.value = true
  try {
    const supabase = useSupabaseClient()
    const empresaId = authStore.empresaId
    const { data: { user } } = await supabase.auth.getUser()

    let ingresosRegistrados = 0
    let productosNuevosCreados = 0

    for (const fila of productosExtraidos.value) {
      let prodId = fila.productoAsociado.value
      let stockAnterior = 0

      if (prodId === 'NUEVO') {
        const payloadNuevo = {
          nombre: fila.productoAsociado.nombre,
          sku: fila.skuOriginal || '',
          costo: fila.costo,
          precio: fila.costo * 1.3,
          stock: fila.cantidad,
          categoria: 'Por Clasificar',
          activo: true
        }
        const savedProd = await productosStore.saveProducto(payloadNuevo)
        prodId = (savedProd as any).id
        productosNuevosCreados++
        stockAnterior = 0
      } else {
        const prodLocal = catInventario.value.find(p => p.id === prodId)
        stockAnterior = prodLocal?.stock || 0
        const nuevoStock = stockAnterior + fila.cantidad
        await supabase
          .from('productos')
          .update({ stock: nuevoStock, costo: fila.costo })
          .eq('id', prodId)
          .eq('empresa_id', empresaId)
      }

      await supabase.from('ajustes_stock').insert({
        empresa_id: empresaId,
        id_producto: prodId,
        id_usuario: user?.id,
        tipo: 'ingreso',
        cantidad: fila.cantidad,
        motivo: pedidoVinculado.value ? 'Recepción de OC (Pedido)' : 'Compra a proveedor (Factura AI)',
        stock_anterior: stockAnterior,
        stock_nuevo: stockAnterior + fila.cantidad
      } as any)

      if (infoProveedor.value.rut) {
        await supabase.from('ai_mapeo_proveedores').upsert({
          empresa_id: empresaId,
          rut_proveedor: infoProveedor.value.rut,
          nombre_proveedor: infoProveedor.value.nombre,
          descripcion_factura: fila.nombreFactura || fila.nombreOriginal,
          nombre_limpio: fila.productoAsociado.nombre,
          unidades_por_caja: fila.unidadesPorCaja || 1,
          id_producto_asociado: prodId,
          updated_at: new Date()
        }, { onConflict: 'empresa_id, rut_proveedor, descripcion_factura' })
      }

      ingresosRegistrados++
    }

    // Si hay OC vinculada, marcarla como recibida
    if (pedidoVinculado.value?.id) {
      const updateData: any = { 
        estado: 'recibido_e_ingresado',
        fecha_recepcion: new Date().toISOString()
      }
      if (infoProveedor.value.factura) {
        updateData.numero_factura = infoProveedor.value.factura
      }

      await supabase
        .from('pedidos_compra')
        .update(updateData)
        .eq('id', pedidoVinculado.value.id)
    }

    await productosStore.fetchProductos()

    toast.add({
      severity: 'success',
      summary: '¡Recepción completada!',
      detail: `${ingresosRegistrados} ingresos procesados.${productosNuevosCreados > 0 ? ` ${productosNuevosCreados} productos nuevos creados.` : ''}${pedidoVinculado.value ? ' OC marcada como recibida.' : ''}`,
      life: 5000
    })

    resetForm()
  } catch (error: any) {
    toast.add({ severity: 'error', summary: 'Error al guardar', detail: error.message, life: 5000 })
  } finally {
    saving.value = false
  }
}
</script>
