<template>
  <div class="superadmin-page">
    <div class="superadmin-header">
      <div>
        <p class="superadmin-eyebrow">Superadmin</p>
        <h1>Negocios</h1>
        <p class="superadmin-copy">
          Supervisa los clientes de ZumaPos, su estado, plan y onboarding inicial.
        </p>
      </div>
      <Button label="Nuevo negocio" icon="pi pi-plus" @click="abrirNuevaEmpresa" />
    </div>

    <div class="superadmin-kpis">
      <div class="superadmin-kpi">
        <span>Negocios</span>
        <strong>{{ empresas.length }}</strong>
      </div>
      <div class="superadmin-kpi">
        <span>Activos</span>
        <strong>{{ empresasActivas }}</strong>
      </div>
      <div class="superadmin-kpi">
        <span>Plan Gratis</span>
        <strong>{{ empresasGratis }}</strong>
      </div>
      <div class="superadmin-kpi">
        <span>Plan Básico</span>
        <strong>{{ empresasBasico }}</strong>
      </div>
      <div class="superadmin-kpi">
        <span>Plan Pro</span>
        <strong>{{ empresasPro }}</strong>
      </div>
    </div>

    <DataTable
      :value="empresas"
      :loading="loading"
      dataKey="id"
      responsiveLayout="scroll"
      class="p-datatable-sm superadmin-table"
      :rowClass="rowClass"
    >
      <Column field="nombre" header="Negocio" style="min-width: 16rem">
        <template #body="slotProps">
          <div class="empresa-cell">
            <strong>{{ slotProps.data.nombre }}</strong>
            <span>{{ slotProps.data.id }}</span>
          </div>
        </template>
      </Column>

      <Column header="Plan" style="min-width: 8rem">
        <template #body="slotProps">
          <Tag :value="slotProps.data.plan.toUpperCase()" :severity="slotProps.data.plan === 'pro' ? 'success' : slotProps.data.plan === 'basico' ? 'info' : 'secondary'" />
        </template>
      </Column>

      <Column header="Estado" style="min-width: 8rem">
        <template #body="slotProps">
          <Tag :value="slotProps.data.activo ? 'Activa' : 'Pausada'" :severity="slotProps.data.activo ? 'success' : 'warn'" />
        </template>
      </Column>

      <Column header="Admins" style="min-width: 15rem">
        <template #body="slotProps">
          <div class="empresa-admins">
            <div v-if="slotProps.data.admins?.length" class="admins-list">
              <div v-for="admin in slotProps.data.admins" :key="admin.id" class="admin-entry">
                <strong>{{ admin.nombre || 'Admin' }}</strong>
                <span class="admin-email" v-if="admin.email">{{ admin.email }}</span>
              </div>
            </div>
            <span v-else>Sin admin creado</span>
          </div>
        </template>
      </Column>

      <Column header="Métricas" style="min-width: 14rem">
        <template #body="slotProps">
          <div class="empresa-metrics">
            <span>{{ slotProps.data.total_usuarios }} usuarios</span>
            <span>{{ slotProps.data.total_productos }} productos</span>
            <span>{{ slotProps.data.total_ventas }} ventas</span>
          </div>
        </template>
      </Column>

      <Column field="fecha_vencimiento" header="Vence" style="min-width: 12rem">
        <template #body="slotProps">
          <div class="vencimiento-cell">
            <span>{{ slotProps.data.fecha_vencimiento ? formatFecha(slotProps.data.fecha_vencimiento) : 'Sin fecha' }}</span>
            <Tag 
              v-if="slotProps.data.fecha_vencimiento"
              :value="getDiasRestantesText(slotProps.data.fecha_vencimiento)" 
              :severity="getDiasRestantesSeverity(slotProps.data.fecha_vencimiento)"
              class="vencimiento-tag"
            />
          </div>
        </template>
      </Column>

      <Column style="min-width: 8rem">
        <template #body="slotProps">
          <div class="flex gap-2">
            <Button 
              icon="pi pi-calendar-plus" 
              v-tooltip.top="'Extender 30 días'"
              rounded 
              outlined 
              severity="success" 
              @click="confirmarExtension(slotProps.data)" 
            />
            <Button icon="pi pi-pencil" rounded outlined severity="secondary" @click="editarEmpresa(slotProps.data)" />
          </div>
        </template>
      </Column>
    </DataTable>

    <Dialog
      v-model:visible="mostrarDialogo"
      :header="modoEdicion ? 'Editar negocio' : 'Nuevo negocio'"
      modal
      :style="{ width: 'min(760px, calc(100vw - 2rem))' }"
      class="superadmin-dialog"
    >
      <div class="superadmin-form">
        <div class="superadmin-form-grid">
          <div class="superadmin-field">
            <label>Nombre del negocio</label>
            <InputText v-model.trim="empresaForm.nombre" placeholder="Ej: Minimarket Los Amigos" />
          </div>

          <div class="superadmin-field">
            <label>Plan</label>
            <Select
              v-model="empresaForm.plan"
              :options="planes"
              optionLabel="label"
              optionValue="value"
              placeholder="Seleccionar plan"
            />
          </div>

          <div class="superadmin-field">
            <label>Fecha de vencimiento</label>
            <DatePicker v-model="empresaForm.fecha_vencimiento" showIcon date-format="dd/mm/yy" />
          </div>

          <div class="superadmin-field superadmin-field-toggle">
            <label>Estado</label>
            <ToggleSwitch v-model="empresaForm.activo" />
            <span>{{ empresaForm.activo ? 'Activo' : 'Pausado' }}</span>
          </div>
        </div>

        <div v-if="!modoEdicion" class="superadmin-onboarding">
          <div class="superadmin-onboarding-head">
            <h3>Administrador inicial</h3>
            <p>Opcional, pero recomendado para dejar el negocio listo de inmediato.</p>
          </div>

          <div class="superadmin-form-grid">
            <div class="superadmin-field">
              <label>Nombre</label>
              <InputText v-model.trim="empresaForm.admin_nombre" placeholder="Nombre del administrador" />
            </div>

            <div class="superadmin-field">
              <label>Correo</label>
              <InputText v-model.trim="empresaForm.admin_email" type="email" placeholder="admin@negocio.cl" />
            </div>

            <div class="superadmin-field">
              <label>Contraseña</label>
              <Password
                v-model="empresaForm.admin_password"
                :feedback="false"
                toggle-mask
                placeholder="Mínimo 6 caracteres"
                input-class="w-full"
                class="w-full"
              />
            </div>
          </div>
        </div>
      </div>

      <template #footer>
        <Button label="Cancelar" text severity="secondary" @click="mostrarDialogo = false" />
        <Button :label="modoEdicion ? 'Guardar cambios' : 'Crear negocio'" icon="pi pi-save" :loading="guardando" @click="guardarEmpresa" />
      </template>
    </Dialog>
  </div>
</template>

<script setup lang="ts">
import { useToast } from 'primevue/usetoast'
import { useFormatMonto } from '~/composables/useFormatMonto'
import { useAuthStore } from '~/stores/auth'

interface EmpresaResumen {
  id: string
  nombre: string
  plan: 'gratis' | 'basico' | 'pro'
  activo: boolean
  fecha_vencimiento: string | null
  total_usuarios: number
  total_productos: number
  total_ventas: number
  admins: Array<{ id: string; nombre: string | null }>
}

const supabase = useSupabaseClient()
const authStore = useAuthStore()
const toast = useToast()
const { formatFecha } = useFormatMonto()

function getDiasRestantes(fecha: string) {
  const hoy = new Date()
  const vencimiento = new Date(fecha)
  const diffTime = vencimiento.getTime() - hoy.getTime()
  return Math.ceil(diffTime / (1000 * 60 * 60 * 24))
}

function getDiasRestantesText(fecha: string) {
  const dias = getDiasRestantes(fecha)
  if (dias < 0) return `Vencido (${Math.abs(dias)}d)`
  if (dias === 0) return 'Vence hoy'
  return `${dias} días`
}

function getDiasRestantesSeverity(fecha: string) {
  const dias = getDiasRestantes(fecha)
  if (dias < 0) return 'danger'
  if (dias <= 5) return 'warn'
  return 'secondary'
}

const loading = ref(false)
const guardando = ref(false)
const mostrarDialogo = ref(false)
const modoEdicion = ref(false)
const empresaEditandoId = ref<string | null>(null)
const empresas = ref<EmpresaResumen[]>([])

function rowClass(data: any) {
  return [
    { 'row-pausada': !data.activo }
  ]
}

const planes = [
  { label: 'Gratis', value: 'gratis' },
  { label: 'Básico', value: 'basico' },
  { label: 'Pro', value: 'pro' }
]

const empresaForm = ref({
  nombre: '',
  plan: 'gratis' as 'gratis' | 'basico' | 'pro',
  activo: true,
  fecha_vencimiento: null as Date | null,
  admin_nombre: '',
  admin_email: '',
  admin_password: ''
})

const empresasActivas = computed(() => empresas.value.filter((empresa) => empresa.activo).length)
const empresasGratis = computed(() => empresas.value.filter((empresa) => empresa.plan === 'gratis').length)
const empresasBasico = computed(() => empresas.value.filter((empresa) => empresa.plan === 'basico').length)
const empresasPro = computed(() => empresas.value.filter((empresa) => empresa.plan === 'pro').length)

onMounted(async () => {
  if (authStore.rolUsuario !== 'super_admin') {
    await navigateTo('/')
    return
  }

  await fetchEmpresas()
})

async function getAuthHeaders() {
  const { data } = await supabase.auth.getSession()
  const accessToken = data.session?.access_token
  if (!accessToken) {
    throw new Error('No hay sesión activa')
  }

  return {
    Authorization: `Bearer ${accessToken}`
  }
}

async function confirmarExtension(empresa: EmpresaResumen) {
  // Calculamos la nueva fecha: Si ya venció, es hoy + 30. Si no, es fecha_vencimiento + 30.
  const baseDate = empresa.fecha_vencimiento && new Date(empresa.fecha_vencimiento) > new Date()
    ? new Date(empresa.fecha_vencimiento)
    : new Date()
  
  const nuevaFecha = new Date(baseDate)
  nuevaFecha.setDate(nuevaFecha.getDate() + 30)

  if (!confirm(`¿Confirmas extender la suscripción de "${empresa.nombre}" hasta el ${formatFecha(nuevaFecha.toISOString())}?`)) {
    return
  }

  loading.value = true
  try {
    const headers = await getAuthHeaders()
    await $fetch(`/api/superadmin/empresas/${empresa.id}`, {
      method: 'PATCH',
      headers,
      body: { 
        fecha_vencimiento: nuevaFecha.toISOString(),
        activo: true // Al extender, la activamos automáticamente
      }
    })
    toast.add({ severity: 'success', summary: 'Suscripción extendida', detail: 'Se agregaron 30 días adicionales.', life: 3000 })
    await fetchEmpresas()
  } catch (error: any) {
    toast.add({ severity: 'error', summary: 'Error', detail: 'No se pudo extender la suscripción', life: 4000 })
  } finally {
    loading.value = false
  }
}

async function fetchEmpresas() {
  loading.value = true
  try {
    const headers = await getAuthHeaders()
    const response = await $fetch<{ empresas: EmpresaResumen[] }>('/api/superadmin/empresas', {
      headers
    })
    empresas.value = response.empresas || []
  } catch (error: any) {
    toast.add({
      severity: 'error',
      summary: 'Error',
      detail: error?.data?.statusMessage || error?.message || 'No se pudieron cargar los negocios',
      life: 4000
    })
  } finally {
    loading.value = false
  }
}

function abrirNuevaEmpresa() {
  modoEdicion.value = false
  empresaEditandoId.value = null
  empresaForm.value = {
    nombre: '',
    plan: 'gratis',
    activo: true,
    fecha_vencimiento: null,
    admin_nombre: '',
    admin_email: '',
    admin_password: ''
  }
  mostrarDialogo.value = true
}

function editarEmpresa(empresa: EmpresaResumen) {
  modoEdicion.value = true
  empresaEditandoId.value = empresa.id
  empresaForm.value = {
    nombre: empresa.nombre,
    plan: empresa.plan,
    activo: empresa.activo,
    fecha_vencimiento: empresa.fecha_vencimiento ? new Date(empresa.fecha_vencimiento) : null,
    admin_nombre: '',
    admin_email: '',
    admin_password: ''
  }
  mostrarDialogo.value = true
}

async function guardarEmpresa() {
  if (!empresaForm.value.nombre.trim()) {
    toast.add({ severity: 'warn', summary: 'Falta información', detail: 'Debes ingresar el nombre del negocio', life: 3000 })
    return
  }

  guardando.value = true
  try {
    const headers = await getAuthHeaders()
    const payload = {
      nombre: empresaForm.value.nombre.trim(),
      plan: empresaForm.value.plan,
      activo: empresaForm.value.activo,
      fecha_vencimiento: empresaForm.value.fecha_vencimiento
        ? empresaForm.value.fecha_vencimiento.toISOString()
        : null,
      admin_nombre: empresaForm.value.admin_nombre.trim(),
      admin_email: empresaForm.value.admin_email.trim(),
      admin_password: empresaForm.value.admin_password
    }

    if (modoEdicion.value && empresaEditandoId.value) {
      await $fetch(`/api/superadmin/empresas/${empresaEditandoId.value}`, {
        method: 'PATCH',
        headers,
        body: payload
      })
      toast.add({ severity: 'success', summary: 'Negocio actualizado', detail: 'Los cambios quedaron guardados.', life: 3000 })
    } else {
      await $fetch('/api/superadmin/empresas', {
        method: 'POST',
        headers,
        body: payload
      })
      toast.add({ severity: 'success', summary: 'Negocio creado', detail: 'El negocio quedó listo para comenzar.', life: 3000 })
    }

    mostrarDialogo.value = false
    await fetchEmpresas()
  } catch (error: any) {
    toast.add({
      severity: 'error',
      summary: 'No se pudo guardar',
      detail: error?.data?.statusMessage || error?.message || 'Ocurrió un error inesperado',
      life: 4000
    })
  } finally {
    guardando.value = false
  }
}
</script>

<style scoped>
.superadmin-page {
  display: flex;
  flex-direction: column;
  gap: 1rem;
  padding: 1.2rem 1.3rem 1.6rem;
}

.superadmin-header {
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  gap: 1rem;
  flex-wrap: wrap;
}

.superadmin-eyebrow {
  margin: 0 0 0.35rem;
  text-transform: uppercase;
  letter-spacing: 0.08em;
  font-size: 0.74rem;
  font-weight: 800;
  color: var(--color-brand-primary);
}

.superadmin-header h1 {
  margin: 0;
  font-size: 2rem;
  letter-spacing: -0.04em;
  color: var(--text-app);
}

.superadmin-copy {
  margin: 0.4rem 0 0;
  color: var(--text-muted);
  max-width: 60ch;
}

.superadmin-kpis {
  display: grid;
  grid-template-columns: repeat(3, minmax(0, 1fr));
  gap: 0.85rem;
}

.superadmin-kpi {
  border: 1px solid var(--border-subtle);
  background: var(--bg-surface);
  border-radius: 1rem;
  padding: 1rem 1.1rem;
  display: flex;
  flex-direction: column;
  gap: 0.35rem;
}

.superadmin-kpi span {
  color: var(--text-muted);
  font-size: 0.82rem;
}

.superadmin-kpi strong {
  color: var(--text-app);
  font-size: 1.65rem;
  line-height: 1;
}

.empresa-cell {
  display: flex;
  flex-direction: column;
  gap: 0.2rem;
}

.empresa-cell strong {
  color: var(--text-app);
}

.empresa-cell span,
.empresa-admins,
.empresa-metrics {
  color: var(--text-muted);
  font-size: 0.82rem;
}

.admins-list {
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
}

.admin-entry {
  display: flex;
  flex-direction: column;
  line-height: 1.2;
}

.admin-entry strong {
  color: var(--text-app);
  font-size: 0.85rem;
}

.admin-email {
  font-size: 0.75rem;
  color: var(--color-brand-primary);
  opacity: 0.8;
}

.vencimiento-cell {
  display: flex;
  flex-direction: column;
  gap: 0.35rem;
}

.vencimiento-tag {
  font-size: 0.7rem;
  padding: 0.1rem 0.5rem;
}

:deep(.row-pausada) {
  opacity: 0.65;
  background: rgba(255, 100, 100, 0.05) !important;
}

.superadmin-form {
  display: flex;
  flex-direction: column;
  gap: 1rem;
}

.superadmin-form-grid {
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 1rem;
}

.superadmin-field {
  display: flex;
  flex-direction: column;
  gap: 0.45rem;
}

.superadmin-field label {
  font-weight: 600;
  color: var(--text-app);
}

.superadmin-field-toggle {
  justify-content: flex-end;
}

.superadmin-onboarding {
  border-top: 1px solid var(--border-subtle);
  padding-top: 1rem;
}

.superadmin-onboarding-head h3 {
  margin: 0;
  font-size: 1rem;
  color: var(--text-app);
}

.superadmin-onboarding-head p {
  margin: 0.35rem 0 0.85rem;
  color: var(--text-muted);
  font-size: 0.9rem;
}

@media (max-width: 768px) {
  .superadmin-page {
    padding: 1rem;
  }

  .superadmin-kpis,
  .superadmin-form-grid {
    grid-template-columns: 1fr;
  }
}
</style>
