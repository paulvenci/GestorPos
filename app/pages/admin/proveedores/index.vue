<template>
  <div class="admin-page max-w-7xl mx-auto px-4">
    <div class="admin-header flex justify-end items-center mb-6">
      <Button label="Nuevo Proveedor" icon="pi pi-plus" @click="abrirNuevo" />
    </div>

    <!-- Filtros -->
    <div class="flex gap-4 mb-6 surface-card p-4 rounded-xl shadow-sm border surface-border">
      <span class="p-input-icon-left w-full md:w-96">
        <i class="pi pi-search" />
        <InputText v-model="filtroBusqueda" placeholder="Buscar por Nombre o RUT..." class="w-full" />
      </span>
    </div>

    <!-- Tabla -->
    <div class="surface-card rounded-xl shadow-sm border surface-border overflow-hidden">
      <DataTable 
        :value="proveedoresFiltrados" 
        :loading="proveedoresStore.loading"
        paginator 
        :rows="10" 
        dataKey="id" 
        responsiveLayout="scroll"
        emptyMessage="No se encontraron proveedores. Haz clic en 'Nuevo Proveedor' para empezar."
      >
        <Column field="rut" header="RUT" style="width: 15%"></Column>
        <Column field="nombre" header="Nombre / Empresa" style="width: 30%">
          <template #body="{ data }">
            <span class="font-semibold">{{ data.nombre }}</span>
          </template>
        </Column>
        <Column header="Contacto" style="width: 25%">
          <template #body="{ data }">
            <div class="flex flex-col gap-1 text-sm">
              <span v-if="data.telefono" class="flex items-center gap-1 text-color-secondary"><i class="pi pi-phone text-xs"></i> {{ data.telefono }}</span>
              <span v-if="data.email" class="flex items-center gap-1 text-color-secondary"><i class="pi pi-envelope text-xs"></i> {{ data.email }}</span>
              <span v-if="!data.telefono && !data.email" class="text-color-secondary italic">Sin datos</span>
            </div>
          </template>
        </Column>
        <Column field="notas" header="Notas">
          <template #body="{ data }">
            <span class="text-sm text-color-secondary truncate block max-w-[200px]" :title="data.notas">{{ data.notas || '-' }}</span>
          </template>
        </Column>
        <Column style="width: 10%" :exportable="false">
          <template #body="{ data }">
            <div class="flex gap-2 justify-end">
              <Button icon="pi pi-pencil" text rounded severity="info" @click="editarProveedor(data)" />
              <Button icon="pi pi-trash" text rounded severity="danger" @click="confirmarEliminar(data)" />
            </div>
          </template>
        </Column>
      </DataTable>
    </div>

    <!-- Modal Formulario -->
    <Dialog v-model:visible="mostrarModal" :header="form.id ? 'Editar Proveedor' : 'Nuevo Proveedor'" :modal="true" class="w-full max-w-lg">
      <div class="grid grid-cols-1 gap-4 pt-2">
        <div class="flex flex-col gap-2">
          <label class="text-sm font-semibold">RUT (Opcional)</label>
          <InputText v-model="form.rut" placeholder="Ej: 76.123.456-K" />
        </div>
        <div class="flex flex-col gap-2">
          <label class="text-sm font-semibold">Nombre / Razón Social *</label>
          <InputText v-model="form.nombre" placeholder="Nombre de la empresa" autofocus />
        </div>
        <div class="grid grid-cols-2 gap-4">
          <div class="flex flex-col gap-2">
            <label class="text-sm font-semibold">Teléfono</label>
            <InputText v-model="form.telefono" placeholder="+56 9..." />
          </div>
          <div class="flex flex-col gap-2">
            <label class="text-sm font-semibold">Email</label>
            <InputText v-model="form.email" placeholder="correo@empresa.com" />
          </div>
        </div>
        <div class="flex flex-col gap-2">
          <label class="text-sm font-semibold">Dirección</label>
          <InputText v-model="form.direccion" placeholder="Calle, Ciudad..." />
        </div>
        <div class="flex flex-col gap-2">
          <label class="text-sm font-semibold">Notas Adicionales</label>
          <Textarea v-model="form.notas" rows="3" placeholder="Ej: Entregan los días martes, hablar con Juan..." />
        </div>
      </div>
      <template #footer>
        <Button label="Cancelar" icon="pi pi-times" text severity="secondary" @click="mostrarModal = false" />
        <Button label="Guardar" icon="pi pi-check" @click="guardarProveedor" :loading="guardando" />
      </template>
    </Dialog>

    <!-- Dialogo de Confirmación -->
    <ConfirmDialog></ConfirmDialog>
  </div>
</template>

<script setup lang="ts">
import { useToast } from 'primevue/usetoast'
import { useConfirm } from 'primevue/useconfirm'
import { useProveedoresStore } from '~/stores/proveedores'
import type { Proveedor } from '~/stores/proveedores'

const toast = useToast()
const confirm = useConfirm()
const proveedoresStore = useProveedoresStore()

const filtroBusqueda = ref('')
const mostrarModal = ref(false)
const guardando = ref(false)

const form = ref<Partial<Proveedor>>({
  rut: '',
  nombre: '',
  telefono: '',
  email: '',
  direccion: '',
  notas: ''
})

onMounted(async () => {
  await proveedoresStore.fetchProveedores()
})

const proveedoresFiltrados = computed(() => {
  if (!filtroBusqueda.value) return proveedoresStore.proveedores
  const query = filtroBusqueda.value.toLowerCase()
  return proveedoresStore.proveedores.filter(p => 
    p.nombre.toLowerCase().includes(query) || 
    (p.rut && p.rut.toLowerCase().includes(query))
  )
})

function abrirNuevo() {
  form.value = {
    rut: '',
    nombre: '',
    telefono: '',
    email: '',
    direccion: '',
    notas: ''
  }
  mostrarModal.value = true
}

function editarProveedor(prov: Proveedor) {
  form.value = { ...prov }
  mostrarModal.value = true
}

async function guardarProveedor() {
  if (!form.value.nombre?.trim()) {
    toast.add({ severity: 'error', summary: 'Error', detail: 'El nombre es obligatorio.', life: 3000 })
    return
  }

  guardando.value = true
  try {
    await proveedoresStore.saveProveedor(form.value)
    toast.add({ severity: 'success', summary: 'Éxito', detail: 'Proveedor guardado correctamente.', life: 3000 })
    mostrarModal.value = false
  } catch (error: any) {
    toast.add({ severity: 'error', summary: 'Error', detail: error.message || 'No se pudo guardar.', life: 3000 })
  } finally {
    guardando.value = false
  }
}

function confirmarEliminar(prov: Proveedor) {
  confirm.require({
    message: `¿Estás seguro de eliminar a ${prov.nombre}? Esto no afectará las facturas ya ingresadas, pero los pedidos pendientes podrían quedar sin enlace.`,
    header: 'Confirmar Eliminación',
    icon: 'pi pi-exclamation-triangle',
    acceptClass: 'p-button-danger',
    accept: async () => {
      try {
        await proveedoresStore.deleteProveedor(prov.id!)
        toast.add({ severity: 'success', summary: 'Eliminado', detail: 'Proveedor eliminado.', life: 3000 })
      } catch (error) {
        toast.add({ severity: 'error', summary: 'Error', detail: 'No se pudo eliminar el proveedor.', life: 3000 })
      }
    }
  })
}
</script>
