<template>
  <div class="admin-page">
    <div class="admin-header">
      <div class="admin-header-titles">
        <h1>Clientes</h1>
        <p>Gestiona tus clientes y cuentas de crédito (fiado).</p>
      </div>
      <Button v-if="esAdminOSupervisor" label="Nuevo Cliente" icon="pi pi-plus" @click="abrirNuevoCliente" />
    </div>

    <!-- Filtros -->
    <div class="flex flex-wrap gap-3 mb-4 items-end">
      <div class="w-72 max-w-full">
        <label class="text-xs text-muted">Buscar</label>
        <InputText v-model="filtro" placeholder="Nombre, teléfono o RUT..." class="w-full" />
      </div>
      <div class="flex items-center gap-2">
        <Checkbox v-model="soloConDeuda" :binary="true" inputId="filtroDeuda" />
        <label for="filtroDeuda" class="text-sm cursor-pointer">Solo con deuda</label>
      </div>
      <div class="flex items-center gap-2">
        <Checkbox v-model="soloActivos" :binary="true" inputId="filtroActivo" />
        <label for="filtroActivo" class="text-sm cursor-pointer">Solo activos</label>
      </div>
    </div>

    <!-- Tabla de Clientes -->
    <DataTable
      :value="clientesFiltrados"
      :loading="clientesStore.loading"
      class="p-datatable-sm modern-table"
      paginator
      :rows="15"
      responsiveLayout="scroll"
      sortField="nombre"
      :sortOrder="1"
      dataKey="id"
    >
      <Column field="nombre" header="Nombre" sortable>
        <template #body="{ data }">
          <span class="font-semibold">{{ data.nombre }}</span>
        </template>
      </Column>
      <Column field="telefono" header="Teléfono">
        <template #body="{ data }">
          <span class="text-sm">{{ data.telefono || '-' }}</span>
        </template>
      </Column>
      <Column field="rut" header="RUT">
        <template #body="{ data }">
          <span class="text-sm text-slate-500">{{ data.rut || '-' }}</span>
        </template>
      </Column>
      <Column field="saldo_pendiente" header="Deuda" sortable>
        <template #body="{ data }">
          <Tag 
            v-if="data.saldo_pendiente > 0" 
            :value="formatMonto(data.saldo_pendiente)" 
            severity="danger" 
            icon="pi pi-exclamation-triangle" 
          />
          <span v-else class="text-emerald-500 text-sm font-medium">Sin deuda</span>
        </template>
      </Column>
      <Column field="limite_credito" header="Límite Crédito" sortable>
        <template #body="{ data }">
          <span v-if="data.limite_credito" class="text-sm font-medium">{{ formatMonto(data.limite_credito) }}</span>
          <span v-else class="text-sm text-slate-400">Sin límite</span>
        </template>
      </Column>
      <Column field="activo" header="Estado" style="width: 6rem">
        <template #body="{ data }">
          <Tag :value="data.activo ? 'Activo' : 'Inactivo'" :severity="data.activo ? 'success' : 'secondary'" />
        </template>
      </Column>
      <Column header="Acciones" style="width: 10rem">
        <template #body="{ data }">
          <div class="flex gap-1">
            <Button icon="pi pi-wallet" text severity="info" size="small" title="Ver cuenta" @click="abrirDeudas(data)" />
            <Button v-if="esAdminOSupervisor" icon="pi pi-pencil" text severity="secondary" size="small" title="Editar" @click="abrirEditarCliente(data)" />
            <Button 
              v-if="esAdminOSupervisor"
              :icon="data.activo ? 'pi pi-ban' : 'pi pi-check-circle'" 
              text 
              :severity="data.activo ? 'danger' : 'success'" 
              size="small" 
              :title="data.activo ? 'Desactivar' : 'Activar'" 
              @click="toggleActivo(data)" 
            />
          </div>
        </template>
      </Column>
      <template #empty>
        <div class="p-6 text-center" style="color: var(--text-muted)">
          <i class="pi pi-users text-4xl mb-2 block opacity-30"></i>
          No hay clientes registrados.
        </div>
      </template>
    </DataTable>

    <!-- Diálogo: Crear/Editar Cliente -->
    <Dialog v-model:visible="mostrarDialogoCliente" :header="clienteForm.id ? 'Editar Cliente' : 'Nuevo Cliente'" :modal="true" :style="{ width: '480px' }" class="p-fluid">
      <div class="flex flex-col gap-4 pt-2">
        <div>
          <label class="text-sm font-medium mb-1 block">Nombre *</label>
          <InputText v-model="clienteForm.nombre" placeholder="Nombre del cliente" autofocus />
        </div>
        <div class="grid grid-cols-2 gap-3">
          <div>
            <label class="text-sm font-medium mb-1 block">Teléfono</label>
            <InputText v-model="clienteForm.telefono" placeholder="+56 9 ..." />
          </div>
          <div>
            <label class="text-sm font-medium mb-1 block">RUT (opcional)</label>
            <InputText v-model="clienteForm.rut" placeholder="12.345.678-9" />
          </div>
        </div>
        <div>
          <label class="text-sm font-medium mb-1 block">Email</label>
          <InputText v-model="clienteForm.email" placeholder="correo@ejemplo.cl" />
        </div>
        <div>
          <label class="text-sm font-medium mb-1 block">Dirección</label>
          <InputText v-model="clienteForm.direccion" placeholder="Calle, número, comuna..." />
        </div>
        <div>
          <label class="text-sm font-medium mb-1 block">Límite de crédito (opcional)</label>
          <InputNumber v-model="clienteForm.limite_credito" :min="0" mode="currency" currency="CLP" locale="es-CL" placeholder="Sin límite" />
        </div>
      </div>
      <template #footer>
        <Button label="Cancelar" icon="pi pi-times" text severity="secondary" @click="mostrarDialogoCliente = false" />
        <Button label="Guardar" icon="pi pi-check" :loading="guardandoCliente" :disabled="!clienteForm.nombre?.trim()" @click="guardarCliente" />
      </template>
    </Dialog>

    <!-- Diálogo: Deudas del Cliente -->
    <Dialog v-model:visible="mostrarDeudas" :header="`Cuenta de ${clienteSeleccionado?.nombre || ''}`" :modal="true" :style="{ width: '680px' }" class="p-fluid">
      <div v-if="clienteSeleccionado">
        <!-- Resumen del cliente -->
        <div class="flex flex-wrap gap-4 mb-4 p-3 rounded-lg" style="background: var(--bg-app)">
          <div class="flex-1 min-w-[120px]">
            <span class="text-xs text-slate-500 block">Deuda Total</span>
            <span class="text-xl font-bold" :class="deudaTotalCalculada > 0 ? 'text-red-500' : 'text-emerald-500'">
              {{ formatMonto(deudaTotalCalculada) }}
            </span>
          </div>
          <div v-if="clienteSeleccionado.limite_credito" class="flex-1 min-w-[120px]">
            <span class="text-xs text-slate-500 block">Límite de Crédito</span>
            <span class="text-lg font-semibold">{{ formatMonto(clienteSeleccionado.limite_credito) }}</span>
          </div>
          <div class="flex-1 min-w-[120px]">
            <span class="text-xs text-slate-500 block">Créditos Activos</span>
            <span class="text-lg font-semibold">{{ deudasCliente.filter(d => d.estado !== 'pagado').length }}</span>
          </div>
          <div v-if="esAdminOSupervisor" class="flex items-end">
            <Button 
              icon="pi pi-dollar" 
              label="Abonar" 
              severity="success"
              :disabled="deudaTotalCalculada <= 0"
              @click="abrirAbono" 
            />
          </div>
        </div>

        <div class="flex justify-between items-center mb-3">
          <h3 class="text-sm font-bold uppercase text-slate-500">Historial de Créditos</h3>
          <Button icon="pi pi-print" label="Estado de Cuenta" size="small" text severity="secondary" @click="imprimirEstadoCuenta" />
        </div>

        <!-- Lista de deudas (solo lectura) -->
        <div v-if="loadingDeudas" class="p-4 text-center"><i class="pi pi-spinner pi-spin"></i> Cargando...</div>
        <div v-else-if="deudasCliente.length === 0" class="p-4 text-center text-slate-400">Sin créditos registrados.</div>
        <div v-else class="flex flex-col gap-2 max-h-[350px] overflow-y-auto">
          <div 
            v-for="deuda in deudasCliente" :key="deuda.id"
            class="p-3 rounded-lg border transition-all"
            :class="{
              'border-red-200 bg-red-50/30': deuda.estado === 'pendiente',
              'border-amber-200 bg-amber-50/30': deuda.estado === 'parcial',
              'border-emerald-200 bg-emerald-50/30': deuda.estado === 'pagado'
            }"
          >
            <div class="flex justify-between items-start mb-1">
              <div>
                <span class="text-xs text-slate-500">{{ formatFecha(deuda.created_at) }}</span>
                <Tag
                  v-if="deuda.fecha_vencimiento && new Date(deuda.fecha_vencimiento) < new Date() && deuda.estado !== 'pagado'"
                  value="VENCIDO"
                  severity="danger"
                  class="ml-2 text-[10px]"
                  icon="pi pi-clock"
                />
              </div>
              <Tag 
                :value="deuda.estado === 'pagado' ? 'PAGADO' : deuda.estado === 'parcial' ? 'PARCIAL' : 'PENDIENTE'" 
                :severity="deuda.estado === 'pagado' ? 'success' : deuda.estado === 'parcial' ? 'warning' : 'danger'" 
              />
            </div>
            <div class="text-sm">
              <span class="text-slate-600">Total: <strong>{{ formatMonto(deuda.monto_total) }}</strong></span>
              <span class="mx-2">|</span>
              <span class="text-emerald-600">Pagado: {{ formatMonto(deuda.monto_pagado) }}</span>
              <span class="mx-2">|</span>
              <span class="text-red-500 font-bold">Resta: {{ formatMonto(deuda.monto_total - deuda.monto_pagado) }}</span>
            </div>
            <div v-if="deuda.fecha_vencimiento" class="text-xs text-slate-400 mt-1">
              Vence: {{ formatFecha(deuda.fecha_vencimiento) }}
            </div>
          </div>
        </div>
      </div>
    </Dialog>

    <!-- Diálogo: Registrar Abono -->
    <Dialog v-model:visible="mostrarAbono" header="Registrar Pago / Abono" :modal="true" :style="{ width: '440px' }" class="p-fluid">
      <div class="flex flex-col gap-4 pt-2">
        <div class="p-3 rounded-lg text-sm" style="background: var(--bg-app)">
          <div class="flex justify-between font-bold text-base">
            <span>Deuda total:</span>
            <span class="text-red-500">{{ formatMonto(deudaTotalCalculada) }}</span>
          </div>
        </div>

        <div>
          <label class="text-sm font-medium mb-1 block">Monto a abonar *</label>
          <InputNumber v-model="abonoForm.monto" :min="1" :max="deudaTotalCalculada" mode="currency" currency="CLP" locale="es-CL" autofocus class="w-full" />
          <div v-if="abonoForm.monto > 0 && abonoForm.monto < deudaTotalCalculada" class="text-xs text-amber-600 mt-1">
            <i class="pi pi-info-circle"></i> Abono parcial. Quedarán {{ formatMonto(deudaTotalCalculada - abonoForm.monto) }} pendientes.
          </div>
          <div v-if="abonoForm.monto >= deudaTotalCalculada" class="text-xs text-emerald-600 mt-1">
            <i class="pi pi-check-circle"></i> Pago completo de toda la deuda.
          </div>
        </div>

        <div>
          <label class="text-sm font-medium mb-1 block">Método de pago</label>
          <Select v-model="abonoForm.metodo_pago" :options="metodosPagoAbono" optionLabel="label" optionValue="value" class="w-full" />
        </div>
        <div>
          <label class="text-sm font-medium mb-1 block">Observaciones</label>
          <InputText v-model="abonoForm.observaciones" placeholder="Opcional..." />
        </div>
      </div>
      <template #footer>
        <Button label="Cancelar" icon="pi pi-times" text severity="secondary" @click="mostrarAbono = false" />
        <Button label="Confirmar Pago" icon="pi pi-check" severity="success" :loading="guardandoAbono" :disabled="!abonoForm.monto || abonoForm.monto <= 0" @click="confirmarAbono" />
      </template>
    </Dialog>
  </div>
</template>

<script setup lang="ts">
import { useToast } from 'primevue/usetoast'
import { useFormatMonto } from '~/composables/useFormatMonto'
import { useClientesStore, type Cliente, type VentaCredito } from '~/stores/clientes'

const toast = useToast()
const { formatMonto, formatFecha } = useFormatMonto()
const clientesStore = useClientesStore()
const authStore = useAuthStore()

const esAdminOSupervisor = computed(() =>
  authStore.rolUsuario === 'admin' || authStore.rolUsuario === 'supervisor' || authStore.rolUsuario === 'super_admin'
)

// Filtros
const filtro = ref('')
const soloConDeuda = ref(false)
const soloActivos = ref(true)

const clientesFiltrados = computed(() => {
  let lista = clientesStore.clientes
  if (soloActivos.value) lista = lista.filter(c => c.activo)
  if (soloConDeuda.value) lista = lista.filter(c => c.saldo_pendiente > 0)
  if (filtro.value.trim()) {
    const q = filtro.value.toLowerCase().trim()
    lista = lista.filter(c =>
      c.nombre.toLowerCase().includes(q) ||
      c.telefono?.toLowerCase().includes(q) ||
      c.rut?.toLowerCase().includes(q)
    )
  }
  return lista
})

// CRUD Cliente
const mostrarDialogoCliente = ref(false)
const guardandoCliente = ref(false)
const clienteForm = ref<Partial<Cliente>>({
  nombre: '', telefono: '', rut: '', email: '', direccion: '', limite_credito: null
})

function abrirNuevoCliente() {
  clienteForm.value = { nombre: '', telefono: '', rut: '', email: '', direccion: '', limite_credito: null }
  mostrarDialogoCliente.value = true
}

function abrirEditarCliente(cliente: Cliente) {
  clienteForm.value = { ...cliente }
  mostrarDialogoCliente.value = true
}

async function guardarCliente() {
  if (!clienteForm.value.nombre?.trim()) return
  guardandoCliente.value = true
  try {
    await clientesStore.saveCliente(clienteForm.value)
    toast.add({ severity: 'success', summary: 'Guardado', detail: 'Cliente guardado exitosamente.', life: 3000 })
    mostrarDialogoCliente.value = false
  } catch (e: any) {
    toast.add({ severity: 'error', summary: 'Error', detail: e.message, life: 5000 })
  } finally {
    guardandoCliente.value = false
  }
}

async function toggleActivo(cliente: Cliente) {
  try {
    await clientesStore.toggleActivo(cliente.id, !cliente.activo)
    toast.add({ severity: 'info', summary: cliente.activo ? 'Desactivado' : 'Activado', detail: `Cliente ${cliente.nombre}`, life: 3000 })
  } catch (e: any) {
    toast.add({ severity: 'error', summary: 'Error', detail: e.message, life: 5000 })
  }
}

// Deudas
const mostrarDeudas = ref(false)
const clienteSeleccionado = ref<Cliente | null>(null)
const deudasCliente = ref<VentaCredito[]>([])
const loadingDeudas = ref(false)

const deudaTotalCalculada = computed(() =>
  deudasCliente.value
    .filter(d => d.estado !== 'pagado')
    .reduce((acc, d) => acc + (d.monto_total - d.monto_pagado), 0)
)

async function abrirDeudas(cliente: Cliente) {
  clienteSeleccionado.value = cliente
  mostrarDeudas.value = true
  loadingDeudas.value = true
  try {
    deudasCliente.value = await clientesStore.fetchDeudas(cliente.id)
  } catch (e: any) {
    toast.add({ severity: 'error', summary: 'Error', detail: e.message, life: 5000 })
  } finally {
    loadingDeudas.value = false
  }
}

// Abonos
const mostrarAbono = ref(false)
const guardandoAbono = ref(false)
const metodosPagoAbono = [
  { label: 'Transferencia', value: 'transferencia' },
  { label: 'Efectivo', value: 'efectivo' },
  { label: 'Tarjeta', value: 'tarjeta' },
  { label: 'Depósito', value: 'deposito' }
]
const abonoForm = ref({ monto: 0, metodo_pago: 'transferencia', observaciones: '' })

function abrirAbono() {
  abonoForm.value = {
    monto: deudaTotalCalculada.value,
    metodo_pago: 'transferencia',
    observaciones: ''
  }
  mostrarAbono.value = true
}

async function confirmarAbono() {
  if (!abonoForm.value.monto) return
  guardandoAbono.value = true
  try {
    // Distribuir el pago automáticamente entre todas las deudas pendientes (más antigua primero)
    let montoRestante = abonoForm.value.monto
    const deudasPendientes = deudasCliente.value
      .filter(d => d.estado !== 'pagado')
      .sort((a, b) => new Date(a.created_at).getTime() - new Date(b.created_at).getTime())

    for (const deuda of deudasPendientes) {
      if (montoRestante <= 0) break
      const restante = deuda.monto_total - deuda.monto_pagado
      const abonoParaEsta = Math.min(montoRestante, restante)
      
      await clientesStore.registrarAbono(
        deuda.id,
        abonoParaEsta,
        abonoForm.value.metodo_pago,
        abonoForm.value.observaciones
      )
      montoRestante -= abonoParaEsta
    }

    toast.add({ severity: 'success', summary: 'Pago registrado', detail: `Se abonaron ${formatMonto(abonoForm.value.monto)}.`, life: 3000 })
    mostrarAbono.value = false
    // Refrescar
    if (clienteSeleccionado.value) {
      deudasCliente.value = await clientesStore.fetchDeudas(clienteSeleccionado.value.id)
      clienteSeleccionado.value = clientesStore.clientes.find(c => c.id === clienteSeleccionado.value!.id) || clienteSeleccionado.value
    }
  } catch (e: any) {
    toast.add({ severity: 'error', summary: 'Error', detail: e.message, life: 5000 })
  } finally {
    guardandoAbono.value = false
  }
}

// Impresión Estado de Cuenta
function imprimirEstadoCuenta() {
  if (!clienteSeleccionado.value) return
  const c = clienteSeleccionado.value
  const deudas = deudasCliente.value

  const filasDeudas = deudas.map(d => `
    <div class="item">
      <div class="row"><span>${formatFecha(d.created_at)}</span><span>${d.estado.toUpperCase()}</span></div>
      <div class="row"><span>Total:</span><span>${formatMonto(d.monto_total)}</span></div>
      <div class="row"><span>Pagado:</span><span>${formatMonto(d.monto_pagado)}</span></div>
      <div class="row strong"><span>Resta:</span><span>${formatMonto(d.monto_total - d.monto_pagado)}</span></div>
      ${d.fecha_vencimiento ? `<div class="muted">Vence: ${formatFecha(d.fecha_vencimiento)}</div>` : ''}
    </div>
  `).join('')

  const printWindow = window.open('', '_blank', 'width=380,height=760')
  if (!printWindow) return
  printWindow.document.write(`
    <html>
    <head>
      <title>Estado de Cuenta</title>
      <style>
        @page { size: 80mm auto; margin: 2mm; }
        body { font-family: "Courier New", monospace; width: 76mm; margin: 0 auto; font-size: 12px; color: #111; }
        .title { text-align: center; font-weight: 700; font-size: 15px; margin-top: 6px; }
        h3 { text-align: center; font-size: 13px; margin: 4px 0; font-weight: bold; }
        .line { border-top: 1px dashed #555; margin: 6px 0; }
        .row { display: flex; justify-content: space-between; gap: 6px; margin: 2px 0; }
        .muted { color: #444; font-size: 11px; text-align: center; }
        .item { padding: 8px 0; border-bottom: 1px dashed #ccc; }
        .item:last-child { border-bottom: none; }
        .strong { font-weight: 700; }
      </style>
    </head>
    <body>
      <div class="title">ESTADO DE CUENTA</div>
      <div class="muted">${new Date().toLocaleDateString('es-CL')}</div>
      <div class="line"></div>
      <div class="row strong"><span>Cliente:</span><span>${c.nombre}</span></div>
      ${c.telefono ? `<div class="row"><span>Tel:</span><span>${c.telefono}</span></div>` : ''}
      ${c.rut ? `<div class="row"><span>RUT:</span><span>${c.rut}</span></div>` : ''}
      <div class="line"></div>
      <div class="row strong" style="font-size:14px;"><span>DEUDA TOTAL:</span><span>${formatMonto(deudaTotalCalculada.value)}</span></div>
      <div class="line"></div>
      <h3>DETALLE DE CRÉDITOS</h3>
      ${filasDeudas || '<div class="muted">Sin créditos.</div>'}
      <script>
        window.onload = () => { setTimeout(() => { window.print(); setTimeout(() => window.close(), 700); }, 300); }
      <\/script>
    </body>
    </html>
  `)
  printWindow.document.close()
}

// Init
onMounted(() => {
  clientesStore.fetchClientes()
})
</script>

<style scoped>
.admin-page {
  padding: 2.5rem;
  color: var(--text-app);
}

.admin-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 1.5rem;
  flex-wrap: wrap;
  gap: 1rem;
}

.admin-header-titles h1 {
  font-size: 2rem;
  font-weight: 700;
  margin: 0 0 0.25rem;
  letter-spacing: -0.03em;
}

.admin-header-titles p {
  color: var(--text-muted);
  margin: 0;
  font-size: 0.95rem;
}

:deep(.modern-table) {
  background: var(--bg-surface);
  border-radius: 1rem;
  border: 1px solid var(--border-sidebar);
  overflow: hidden;
}

:deep(.modern-table .p-datatable-thead > tr > th) {
  background: var(--bg-app) !important;
  color: var(--text-muted) !important;
  font-weight: 600;
  font-size: 0.85rem;
  text-transform: uppercase;
  letter-spacing: 0.05em;
  padding: 1rem;
  border: none !important;
}

:deep(.modern-table .p-datatable-tbody > tr) {
  background: transparent !important;
  color: var(--text-app);
}

:deep(.modern-table .p-datatable-tbody > tr > td) {
  border-color: var(--border-subtle) !important;
  padding: 0.75rem 1rem;
}

:deep(.modern-table .p-paginator) {
  background: transparent !important;
  border-top: 1px solid var(--border-subtle) !important;
}

@media (max-width: 768px) {
  .admin-page { padding: 0.75rem; }
  .admin-header { flex-direction: column; align-items: stretch; }
}
</style>
