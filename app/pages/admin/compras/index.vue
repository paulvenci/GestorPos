<template>
  <div class="admin-page max-w-7xl mx-auto px-4">
    <div class="admin-header flex justify-end items-center mb-6">
      <Button label="Crear Nueva Lista" icon="pi pi-plus" severity="primary" @click="router.push('/admin/compras/generador')" />
    </div>

    <!-- Resumen -->
    <div class="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
      <div class="surface-card p-4 rounded-xl border surface-border flex items-center gap-4 hover:shadow-md transition-shadow">
        <div class="w-12 h-12 rounded-2xl bg-amber-500/10 flex items-center justify-center text-amber-600 flex-shrink-0 border border-amber-500/20">
          <i class="pi pi-file-edit text-xl"></i>
        </div>
        <div>
          <p class="text-[10px] text-color-secondary font-black uppercase tracking-wider mb-1">Borradores</p>
          <p class="text-3xl font-black">{{ pedidos.filter(p => p.estado === 'pendiente_pedido').length }}</p>
        </div>
      </div>
      <div class="surface-card p-4 rounded-xl border surface-border flex items-center gap-4 hover:shadow-md transition-shadow">
        <div class="w-12 h-12 rounded-2xl bg-indigo-500/10 flex items-center justify-center text-indigo-600 flex-shrink-0 border border-indigo-500/20">
          <i class="pi pi-send text-xl"></i>
        </div>
        <div>
          <p class="text-[10px] text-color-secondary font-black uppercase tracking-wider mb-1">Enviados</p>
          <p class="text-3xl font-black">{{ pedidos.filter(p => p.estado === 'pedido_realizado').length }}</p>
        </div>
      </div>
      <div class="surface-card p-4 rounded-xl border surface-border flex items-center gap-4 hover:shadow-md transition-shadow">
        <div class="w-12 h-12 rounded-2xl bg-emerald-500/10 flex items-center justify-center text-emerald-600 flex-shrink-0 border border-emerald-500/20">
          <i class="pi pi-check-circle text-xl"></i>
        </div>
        <div>
          <p class="text-[10px] text-color-secondary font-black uppercase tracking-wider mb-1">Recibidos</p>
          <p class="text-3xl font-black">{{ pedidos.filter(p => p.estado === 'recibido_e_ingresado').length }}</p>
        </div>
      </div>
      <div class="surface-card p-4 rounded-xl border surface-border flex items-center gap-4 hover:shadow-md transition-shadow">
        <div class="w-12 h-12 rounded-2xl bg-rose-500/10 flex items-center justify-center text-rose-600 flex-shrink-0 border border-rose-500/20">
          <i class="pi pi-ban text-xl"></i>
        </div>
        <div>
          <p class="text-[10px] text-color-secondary font-black uppercase tracking-wider mb-1">Anulados</p>
          <p class="text-3xl font-black">{{ pedidos.filter(p => p.estado === 'anulado').length }}</p>
        </div>
      </div>
    </div>

    <!-- Tabla -->
    <div class="surface-card rounded-xl border surface-border overflow-hidden">
      <DataTable 
        :value="pedidos" 
        :loading="comprasStore.loading"
        paginator 
        :rows="10" 
        responsiveLayout="scroll"
        emptyMessage="No hay pedidos registrados."
      >
        <Column header="Fecha" style="width: 15%">
          <template #body="{ data }">
            <span class="text-sm">{{ new Date(data.created_at).toLocaleDateString('es-CL') }}</span>
          </template>
        </Column>
        <Column header="Responsable" style="width: 15%">
          <template #body="{ data }">
            <div class="flex items-center gap-2">
              <Avatar :label="(data.perfil?.nombre || 'U')[0]" shape="circle" size="small" class="bg-indigo-100 text-indigo-700 text-xs" />
              <span class="text-sm">{{ data.perfil?.nombre || 'Sistema' }}</span>
            </div>
          </template>
        </Column>
        <Column header="Proveedor" style="width: 25%">
          <template #body="{ data }">
            <div v-if="data.proveedor" class="flex items-center gap-2">
              <span class="font-bold text-color">{{ data.proveedor.nombre }}</span>
              <Button icon="pi pi-pencil" text rounded size="small" severity="secondary" @click="abrirAsignarProveedor(data)" v-tooltip.top="'Cambiar proveedor'" />
            </div>
            <div v-else class="flex items-center gap-2">
              <span class="text-color-secondary italic">Sin Proveedor Asignado</span>
              <Button icon="pi pi-user-plus" text rounded size="small" severity="primary" @click="abrirAsignarProveedor(data)" v-tooltip.top="'Asignar proveedor'" />
            </div>
          </template>
        </Column>
        <Column header="Total Estimado" style="width: 15%">
          <template #body="{ data }">
            <span class="font-mono">{{ formatMonto(data.total_estimado) }}</span>
          </template>
        </Column>
        <Column header="Estado" style="width: 20%">
          <template #body="{ data }">
            <Tag :value="formatoEstado(data.estado).texto" :severity="formatoEstado(data.estado).color" />
          </template>
        </Column>
        <Column style="width: 25%">
          <template #body="{ data }">
            <div class="flex gap-1 justify-end items-center no-wrap">
              <Button 
                v-if="data.estado === 'pendiente_pedido'" 
                label="Enviar" 
                size="small" 
                severity="secondary" 
                variant="outlined"
                icon="pi pi-send" 
                v-tooltip.top="'Marcar como enviado'"
                @click="actualizarEstado(data.id, 'pedido_realizado')" 
              />
              <Button 
                v-if="data.estado === 'pendiente_pedido'" 
                icon="pi pi-trash" 
                size="small" 
                severity="danger" 
                variant="outlined"
                v-tooltip.top="'Eliminar borrador'"
                @click="confirmarEliminar(data)" 
              />
              <Button 
                icon="pi pi-whatsapp" 
                text 
                rounded 
                severity="success" 
                v-tooltip.top="'Enviar por WhatsApp'"
                @click="enviarWhatsApp(data)" 
              />
              <Button 
                icon="pi pi-file-pdf" 
                text 
                rounded 
                severity="danger" 
                v-tooltip.top="'Generar PDF'"
                @click="generarPDF(data)" 
              />
              <Button icon="pi pi-eye" text rounded severity="info" v-tooltip.top="'Ver Detalles'" @click="verDetalles(data)" />
            </div>
          </template>
        </Column>
      </DataTable>
    </div>

    <!-- Modal Detalles -->
    <Dialog v-model:visible="mostrarModal" header="Detalle del Pedido" :modal="true" class="w-full max-w-2xl">
      <div v-if="pedidoSeleccionado" class="pb-2">
        <div class="flex justify-between items-start mb-6">
          <div>
            <p class="text-sm text-color-secondary">Proveedor</p>
            <p class="font-bold text-lg">{{ pedidoSeleccionado.proveedor?.nombre || 'Sin Proveedor' }}</p>
            <p v-if="pedidoSeleccionado.proveedor?.rut" class="text-sm text-color-secondary">RUT: {{ pedidoSeleccionado.proveedor.rut }}</p>
            <p class="text-xs text-indigo-500 mt-2 font-bold flex items-center gap-1">
              <i class="pi pi-user text-[10px]"></i> Creado por: {{ pedidoSeleccionado.perfil?.nombre || 'Sistema' }}
            </p>
          </div>
          <div class="text-right">
            <p class="text-sm text-color-secondary">Estado Actual</p>
            <Tag :value="formatoEstado(pedidoSeleccionado.estado).texto" :severity="formatoEstado(pedidoSeleccionado.estado).color" class="mt-1" />
          </div>
        </div>

        <!-- Buscador de productos para añadir (Solo en Borrador) -->
        <div v-if="pedidoSeleccionado.estado === 'pendiente_pedido'" class="mb-4 p-3 surface-ground rounded-lg border surface-border">
          <p class="text-xs font-bold uppercase text-color-secondary mb-2">Agregar Producto al Pedido</p>
          <div class="flex gap-2">
            <AutoComplete 
              v-model="productoBuscado" 
              :suggestions="productosSugeridos" 
              @complete="buscarProductos" 
              optionLabel="nombre"
              placeholder="Buscar por nombre o código..." 
              class="flex-1"
              forceSelection
            />
            <InputNumber v-model="cantidadNueva" :min="1" class="w-24" placeholder="Cant." />
            <Button icon="pi pi-plus" label="Agregar" @click="confirmarAgregarProducto" :disabled="!productoBuscado" />
          </div>
        </div>

        <DataTable :value="detallesActuales" class="p-datatable-sm mb-4 border rounded">
          <Column header="Producto">
            <template #body="{ data }">
              <div class="flex flex-col">
                <span class="font-medium text-sm text-color">{{ data.producto?.nombre || 'Producto Desconocido' }}</span>
                <span class="text-xs text-color-secondary font-mono">{{ data.producto?.sku || 'S/C' }}</span>
              </div>
            </template>
          </Column>
          <Column header="Cant. Pedida" style="width: 140px; text-align: center;">
            <template #body="{ data }">
              <div v-if="pedidoSeleccionado.estado === 'pendiente_pedido'" class="flex items-center gap-2 justify-center">
                <Button icon="pi pi-minus" text size="small" severity="secondary" @click="cambiarCantidad(data, -1)" />
                <span class="font-bold w-8 text-center text-color">{{ data.cantidad_pedida }}</span>
                <Button icon="pi pi-plus" text size="small" severity="secondary" @click="cambiarCantidad(data, 1)" />
              </div>
              <span v-else class="font-bold text-color">{{ data.cantidad_pedida }}</span>
            </template>
          </Column>
          <Column header="Costo Estimado" style="width: 120px; text-align: right;">
            <template #body="{ data }">
              <span class="text-sm text-color-secondary">{{ formatMonto(data.precio_unitario_estimado) }}</span>
            </template>
          </Column>
          <Column v-if="pedidoSeleccionado.estado === 'pendiente_pedido'" style="width: 50px">
            <template #body="{ data }">
              <Button icon="pi pi-trash" text severity="danger" size="small" @click="quitarProducto(data)" />
            </template>
          </Column>
        </DataTable>

        <div class="flex justify-between items-center surface-section border surface-border p-3 rounded-lg font-bold mt-2">
          <span class="text-color">Total Estimado:</span>
          <span class="text-indigo-600 dark:text-indigo-400 text-lg">{{ formatMonto(pedidoSeleccionado.total_estimado) }}</span>
        </div>
      </div>
    </Dialog>

    <ConfirmDialog></ConfirmDialog>

    <!-- Modal Asignar Proveedor -->
    <Dialog v-model:visible="mostrarAsignar" header="Asignar Proveedor" :modal="true" class="w-full max-w-md">
      <div class="flex flex-col gap-4">
        <p class="text-color-secondary text-sm">Selecciona el proveedor para este pedido de {{ formatMonto(pedidoParaAsignar?.total_estimado || 0) }}</p>
        <Dropdown 
          v-model="proveedorElegido" 
          :options="proveedoresStore.proveedores" 
          optionLabel="nombre" 
          optionValue="id"
          placeholder="Selecciona un proveedor" 
          class="w-full"
          filter
        />
        <div class="flex justify-end gap-2 mt-4">
          <Button label="Cancelar" text severity="secondary" @click="mostrarAsignar = false" />
          <Button label="Guardar" icon="pi pi-save" :disabled="!proveedorElegido" :loading="comprasStore.loading" @click="confirmarAsignacion" />
        </div>
      </div>
    </Dialog>
  </div>
</template>

<script setup lang="ts">
import { useComprasStore } from '~/stores/compras'
import { useProveedoresStore } from '~/stores/proveedores'
import { useAuthStore } from '~/stores/auth'
import { useToast } from 'primevue/usetoast'
import { useConfirm } from 'primevue/useconfirm'

const router = useRouter()
const toast = useToast()
const confirm = useConfirm()
const comprasStore = useComprasStore()
const proveedoresStore = useProveedoresStore()
const authStore = useAuthStore()
const supabase = useSupabaseClient()

const pedidos = computed(() => comprasStore.pedidos)
const mostrarModal = ref(false)
const pedidoSeleccionado = ref<any>(null)
const detallesActuales = ref<any[]>([])

// Lógica Asignar Proveedor
const mostrarAsignar = ref(false)
const pedidoParaAsignar = ref<any>(null)
const proveedorElegido = ref<string | null>(null)

// Lógica Agregar Producto
const productoBuscado = ref<any>(null)
const productosSugeridos = ref<any[]>([])
const cantidadNueva = ref(1)

onMounted(async () => {
  await comprasStore.fetchPedidos()
  if (proveedoresStore.proveedores.length === 0) {
    await proveedoresStore.fetchProveedores()
  }
})

const formatMonto = (valor: number) => {
  return new Intl.NumberFormat('es-CL', { style: 'currency', currency: 'CLP' }).format(valor)
}

function formatoEstado(estado: string) {
  switch(estado) {
    case 'pendiente_pedido': return { texto: 'Borrador (Por Pedir)', color: 'warning' }
    case 'pedido_realizado': return { texto: 'Enviado al Proveedor', color: 'info' }
    case 'recibido_e_ingresado': return { texto: 'Recibido (Stock OK)', color: 'success' }
    case 'anulado': return { texto: 'Anulado', color: 'danger' }
    default: return { texto: estado, color: 'secondary' }
  }
}

async function verDetalles(pedido: any) {
  pedidoSeleccionado.value = pedido
  detallesActuales.value = []
  mostrarModal.value = true
  
  // Cargar detalles desde Supabase
  detallesActuales.value = await comprasStore.fetchDetalles(pedido.id)
}

function actualizarEstado(id: string, nuevoEstado: string) {
  confirm.require({
    message: '¿Confirmas que ya enviaste este pedido al proveedor?',
    header: 'Confirmar Envío',
    icon: 'pi pi-send',
    accept: async () => {
      try {
        await comprasStore.actualizarEstadoPedido(id, nuevoEstado)
        toast.add({ severity: 'success', summary: 'Actualizado', detail: 'El estado del pedido ha cambiado.', life: 3000 })
      } catch (error) {
        toast.add({ severity: 'error', summary: 'Error', detail: 'No se pudo actualizar el estado.', life: 3000 })
      }
    }
  })
}

function construirTexto(pedido: any, detalles: any[]): string {
  const prov = pedido.proveedor?.nombre || 'Sin Proveedor'
  const fecha = new Date(pedido.created_at).toLocaleDateString('es-CL')
  const nombreEmpresa = authStore.nombreEmpresa || 'Nuestra Empresa'
  
  let texto = `*ORDEN DE COMPRA*\n`
  texto += `------------------------------------------\n`
  texto += `*DE:* ${nombreEmpresa}\n`
  texto += `*FECHA:* ${fecha}\n`
  texto += `*PROVEEDOR:* ${prov}\n\n`
  
  texto += `*DETALLE DEL PEDIDO:*\n`
  detalles.forEach((d: any, index: number) => {
    const nombre = d.producto?.nombre || 'Producto'
    const cant = d.cantidad_pedida
    const sku = d.producto?.sku ? `   _Ref: ${d.producto.sku}_` : ''
    
    texto += `${index + 1}. *CANT: ${cant}* - ${nombre}\n${sku}\n`
  })
  
  texto += `\n*TOTAL ESTIMADO:* ${formatMonto(pedido.total_estimado)}\n`
  texto += `------------------------------------------\n`
  texto += `Favor confirmar recepcion y disponibilidad. Gracias.`
  return texto
}

async function enviarWhatsApp(pedido: any) {
  const detalles = await comprasStore.fetchDetalles(pedido.id)
  const texto = construirTexto(pedido, detalles)
  const telefono = pedido.proveedor?.telefono?.replace(/\D/g, '') || ''
  const url = `https://wa.me/${telefono}?text=${encodeURIComponent(texto)}`
  window.open(url, '_blank')
}

async function generarPDF(pedido: any) {
  const detalles = await comprasStore.fetchDetalles(pedido.id)
  const prov = pedido.proveedor?.nombre || 'Sin Proveedor'
  const fecha = new Date(pedido.created_at).toLocaleDateString('es-CL')
  
  const filas = detalles.map(d => `
    <tr>
      <td style="padding:8px;border-bottom:1px solid #eee">${d.producto?.nombre || '—'}</td>
      <td style="padding:8px;border-bottom:1px solid #eee;font-family:monospace;font-size:12px">${d.producto?.sku || '—'}</td>
      <td style="padding:8px;border-bottom:1px solid #eee;text-align:center">${d.cantidad_pedida}</td>
      <td style="padding:8px;border-bottom:1px solid #eee;text-align:right">${formatMonto(d.precio_unitario_estimado)}</td>
    </tr>`).join('')
  
  const html = `
    <html><head><title>Pedido</title>
    <style>body{font-family:sans-serif;padding:20px;color:#111}table{width:100%;border-collapse:collapse}th{background:#6366f1;color:#fff;padding:10px}h1{color:#6366f1}</style>
    </head><body>
    <h1>Orden de Compra</h1>
    <p><strong>Proveedor:</strong> ${prov}</p>
    <p><strong>Fecha:</strong> ${fecha}</p>
    <table><thead><tr><th>Producto</th><th>Cód. Barra</th><th>Cant.</th><th>Precio Est.</th></tr></thead>
    <tbody>${filas}</tbody></table>
    <p style="text-align:right;font-size:18px;margin-top:16px"><strong>Total: ${formatMonto(pedido.total_estimado)}</strong></p>
    </body></html>`
  
  const win = window.open('', '_blank')
  if (win) {
    win.document.write(html)
    win.document.close()
    win.print()
  }
}

function abrirAsignarProveedor(pedido: any) {
  pedidoParaAsignar.value = pedido
  proveedorElegido.value = pedido.proveedor_id
  mostrarAsignar.value = true
}

async function confirmarAsignacion() {
  if (!pedidoParaAsignar.value || !proveedorElegido.value) return
  
  try {
    await comprasStore.asignarProveedor(pedidoParaAsignar.value.id, proveedorElegido.value)
    toast.add({ severity: 'success', summary: 'Asignado', detail: 'Proveedor actualizado correctamente.', life: 3000 })
    mostrarAsignar.value = false
  } catch (error) {
    toast.add({ severity: 'error', summary: 'Error', detail: 'No se pudo actualizar el proveedor.', life: 3000 })
  }
}

async function cambiarCantidad(detalle: any, delta: number) {
  const nuevaCant = Math.max(1, detalle.cantidad_pedida + delta)
  if (nuevaCant === detalle.cantidad_pedida) return
  
  try {
    const nuevosDetalles = await comprasStore.actualizarDetallePedido(pedidoSeleccionado.value.id, detalle.id, nuevaCant)
    detallesActuales.value = nuevosDetalles
    // Actualizar la cabecera local para reflejar el nuevo total
    const ped = comprasStore.pedidos.find(p => p.id === pedidoSeleccionado.value.id)
    if (ped) pedidoSeleccionado.value.total_estimado = ped.total_estimado
  } catch (e) {
    toast.add({ severity: 'error', summary: 'Error', detail: 'No se pudo actualizar la cantidad.', life: 2000 })
  }
}

async function quitarProducto(detalle: any) {
  confirm.require({
    message: '¿Estás seguro de quitar este producto del pedido?',
    header: 'Quitar Producto',
    icon: 'pi pi-trash',
    accept: async () => {
      try {
        const nuevosDetalles = await comprasStore.eliminarDetallePedido(pedidoSeleccionado.value.id, detalle.id)
        detallesActuales.value = nuevosDetalles
        // Actualizar total local
        const ped = comprasStore.pedidos.find(p => p.id === pedidoSeleccionado.value.id)
        if (ped) pedidoSeleccionado.value.total_estimado = ped.total_estimado
        
        if (nuevosDetalles.length === 0) {
          mostrarModal.value = false
          toast.add({ severity: 'info', summary: 'Pedido vacío', detail: 'Se han eliminado todos los productos.', life: 3000 })
        }
      } catch (e) {
        toast.add({ severity: 'error', summary: 'Error', detail: 'No se pudo eliminar el producto.', life: 2000 })
      }
    }
  })
}

async function buscarProductos(event: any) {
  const query = event.query.toLowerCase()
  const { data } = await supabase
    .from('productos')
    .select('*')
    .eq('empresa_id', authStore.empresaId)
    .or(`nombre.ilike.%${query}%,sku.ilike.%${query}%`)
    .limit(10)
  
  productosSugeridos.value = data || []
}

async function confirmarAgregarProducto() {
  if (!productoBuscado.value || !pedidoSeleccionado.value) return
  
  try {
    const nuevosDetalles = await comprasStore.agregarProductoAPedido(
      pedidoSeleccionado.value.id, 
      productoBuscado.value, 
      cantidadNueva.value
    )
    detallesActuales.value = nuevosDetalles
    
    // Actualizar total local
    const ped = comprasStore.pedidos.find(p => p.id === pedidoSeleccionado.value.id)
    if (ped) pedidoSeleccionado.value.total_estimado = ped.total_estimado
    
    // Limpiar buscador
    productoBuscado.value = null
    cantidadNueva.value = 1
    toast.add({ severity: 'success', summary: 'Agregado', detail: 'Producto añadido al pedido.', life: 2000 })
  } catch (e) {
    toast.add({ severity: 'error', summary: 'Error', detail: 'No se pudo añadir el producto.', life: 2000 })
  }
}

async function confirmarEliminar(pedido: any) {
  confirm.require({
    message: `¿Estás seguro de eliminar este borrador? Esta acción no se puede deshacer.`,
    header: 'Confirmar Eliminación',
    icon: 'pi pi-exclamation-triangle',
    acceptClass: 'p-button-danger',
    accept: async () => {
      try {
        await comprasStore.eliminarPedido(pedido.id)
        toast.add({ severity: 'success', summary: 'Eliminado', detail: 'El borrador ha sido eliminado.', life: 3000 })
      } catch (error) {
        toast.add({ severity: 'error', summary: 'Error', detail: 'No se pudo eliminar el pedido.', life: 4000 })
      }
    }
  })
}
</script>
