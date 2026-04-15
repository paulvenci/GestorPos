<template>
  <div class="admin-page">
    <!-- Encabezado -->
    <div class="admin-header">
      <div class="admin-header-titles">
        <h1>ConfiguraciÃ³n</h1>
        <p>Gestiona los usuarios del sistema y sus roles de acceso.</p>
      </div>
    </div>

    <!-- Tabs -->
    <Tabs value="0" class="config-tabs">
      <TabList>
        <Tab value="0">Usuarios y Roles</Tab>
        <Tab value="1">General</Tab>
      </TabList>

      <!-- Tab Usuarios -->
      <TabPanel value="0">
        <div class="config-section">
          <div class="config-section-header">
            <div>
              <h2><i class="pi pi-users" /> Equipo del negocio</h2>
              <p>Administra los roles de cada miembro para controlar sus permisos en el sistema.</p>
            </div>
            <Button label="Nuevo Usuario" icon="pi pi-user-plus" severity="success" @click="abrirNuevo" />
          </div>

          <DataTable
            :value="usuarios"
            :loading="loading"
            class="p-datatable-sm"
            dataKey="id"
            responsiveLayout="scroll"
          >
            <Column header="Usuario" style="min-width: 16rem">
              <template #body="slotProps">
                <div class="user-cell">
                  <Avatar :label="getInitials(slotProps.data.nombre || slotProps.data.id)" shape="circle" class="user-avatar" />
                  <div>
                    <p class="user-name">{{ slotProps.data.nombre || 'Sin nombre' }}</p>
                    <p class="user-id">{{ slotProps.data.id.substring(0, 8) }}...</p>
                  </div>
                </div>
              </template>
            </Column>

            <Column field="rol" header="Rol" sortable style="min-width: 10rem">
              <template #body="slotProps">
                <Tag
                  :value="slotProps.data.rol"
                  :severity="getRolSeverity(slotProps.data.rol)"
                  :icon="getRolIcon(slotProps.data.rol)"
                />
              </template>
            </Column>

            <Column header="Estado" style="min-width: 8rem">
              <template #body="slotProps">
                <Tag
                  :value="slotProps.data.activo !== false ? 'Activo' : 'Inactivo'"
                  :severity="slotProps.data.activo !== false ? 'success' : 'secondary'"
                />
              </template>
            </Column>

            <Column field="created_at" header="Registrado" sortable style="min-width: 10rem">
              <template #body="slotProps">
                <span class="text-sm" style="color: var(--text-muted)">
                  {{ formatFecha(slotProps.data.created_at) }}
                </span>
              </template>
            </Column>

            <Column :exportable="false" style="min-width: 8rem">
              <template #body="slotProps">
                <div class="flex gap-2">
                  <Button icon="pi pi-pencil" outlined rounded severity="info" size="small" @click="abrirEditar(slotProps.data)" title="Editar rol" />
                </div>
              </template>
            </Column>

            <template #empty>
              <div class="p-4 text-center" style="color: var(--text-muted)">
                No se encontraron usuarios registrados.
              </div>
            </template>
          </DataTable>
        </div>

        <!-- Leyenda de Roles -->
        <div class="roles-legend">
          <h3><i class="pi pi-info-circle" /> DescripciÃ³n de roles</h3>
          <div class="roles-grid">
            <div class="role-card">
              <Tag value="admin" severity="danger" icon="pi pi-shield" />
              <p>Control total del sistema. Puede gestionar usuarios, productos, reportes y configuraciÃ³n.</p>
            </div>
            <div class="role-card">
              <Tag value="cajero" severity="info" icon="pi pi-calculator" />
              <p>Acceso al Punto de Venta y gestiÃ³n de turnos de caja. No puede modificar productos ni configuraciÃ³n.</p>
            </div>
            <div class="role-card">
              <Tag value="supervisor" severity="warn" icon="pi pi-eye" />
              <p>Puede ver reportes, administrar productos y supervisar la operaciÃ³n sin gestionar usuarios.</p>
            </div>
          </div>
        </div>

        <div class="roles-manager">
          <div class="roles-manager-header">
            <h3><i class="pi pi-sliders-h" /> Gestor de permisos por rol</h3>
            <p>Selecciona las secciones que cada rol puede usar en la aplicaciÃ³n.</p>
          </div>
          <div class="roles-manager-grid">
            <div class="role-manager-card" v-for="rol in rolesDisponibles" :key="rol.value">
              <div class="role-manager-title">
                <Tag :value="rol.value" :severity="getRolSeverity(rol.value)" :icon="getRolIcon(rol.value)" />
              </div>
              <MultiSelect
                v-model="rolePermissionsDraft[rol.value]"
                :options="seccionesDisponibles"
                optionLabel="label"
                optionValue="value"
                display="chip"
                placeholder="Seleccionar secciones"
                class="w-full"
              />
            </div>
          </div>
          <div class="flex justify-end mt-3">
            <Button label="Guardar permisos" icon="pi pi-save" :loading="configLoading" @click="guardarPermisosRoles" />
          </div>
        </div>
      </TabPanel>

      <!-- Tab General -->
      <TabPanel value="1">
        <div class="config-section">
          <div class="config-section-header">
            <h2><i class="pi pi-cog" /> ConfiguraciÃ³n general</h2>
            <p>Ajustes generales del sistema POS.</p>
          </div>

          <div class="config-form">
            <div class="config-item">
              <div class="config-item-info">
                <label>Nombre del negocio</label>
                <p>Se muestra en los recibos y reportes.</p>
              </div>
              <InputText v-model="configGeneral.nombreNegocio" placeholder="Mi Negocio" style="width: 300px" />
            </div>

            <div class="config-item">
              <div class="config-item-info">
                <label>Moneda</label>
                <p>Moneda utilizada para precios y ventas.</p>
              </div>
              <Select v-model="configGeneral.moneda" :options="monedas" optionLabel="label" optionValue="value" placeholder="Seleccionar moneda" style="width: 300px" />
            </div>

            <div class="config-item">
              <div class="config-item-info">
                <label>IVA / Impuesto (%)</label>
                <p>Porcentaje de impuesto aplicado a las ventas.</p>
              </div>
              <InputNumber v-model="configGeneral.iva" suffix=" %" :min="0" :max="100" style="width: 300px" />
            </div>

            <div class="config-item" v-if="globalConfig">
              <div class="config-item-info">
                <label>Margen de Ganancia (%) por Defecto</label>
                <p>AÃ±adido al calcular el precio de venta si no se especifica otro.</p>
              </div>
              <InputNumber v-model="globalConfig.margen_ganancia_defecto" suffix=" %" :min="0" style="width: 300px" />
            </div>

            <div class="config-item" v-if="globalConfig">
              <div class="config-item-info">
                <label>Stock MÃ­nimo por Defecto</label>
                <p>Se usarÃ¡ para alertarte cuando un producto se estÃ© agotando.</p>
              </div>
              <InputNumber v-model="globalConfig.stock_minimo_defecto" :min="0" style="width: 300px" />
            </div>

            <div class="config-item" v-if="globalConfig">
              <div class="config-item-info">
                <label>Tamaño Letra Comprobante</label>
                <p>Ajusta el tamaño base para la impresión de tickets térmicos (por defecto 11px).</p>
              </div>
              <InputNumber v-model="globalConfig.impresion_tamano_fuente" :min="4" :max="24" :step="1" suffix=" px" style="width: 300px" />
            </div>

            <div class="flex justify-end mt-2">
              <Button label="Guardar ConfiguraciÃ³n" icon="pi pi-save" :loading="configLoading" @click="guardarConfiguracion" />
            </div>
          </div>
        </div>

        <div class="config-section mt-8">
          <div class="config-section-header">
            <h2 class="text-red-500"><i class="pi pi-exclamation-triangle" /> Zona de Peligro</h2>
            <p>Acciones destructivas para el mantenimiento del sistema.</p>
          </div>

          <div class="config-form border border-red-200 dark:border-red-900/50 rounded-xl bg-red-50/30 dark:bg-red-900/10 p-6">
            <div class="config-item flex justify-between items-center w-full">
              <div class="config-item-info max-w-xl">
                <label class="text-red-600 dark:text-red-400 font-bold">Borrar todas las ventas</label>
                <p class="text-sm mt-1">Elimina definitivamente las ventas y sus detalles solo de esta empresa. Úsalo al terminar una demo para dejar el negocio listo para producción.</p>
              </div>
              <Button label="Limpiar ventas" icon="pi pi-trash" severity="danger" @click="borrarTodasLasVentas" :disabled="loading" />
            </div>
            <div class="config-item flex justify-between items-center w-full border-t border-red-200 dark:border-red-900/50 pt-4 mt-2">
              <div class="config-item-info max-w-xl">
                <label class="text-cyan-600 dark:text-cyan-400 font-bold">Generar productos demo</label>
                <p class="text-sm mt-1">Carga un catálogo inicial demo solo para esta empresa. Úsalo cuando el negocio aún no tenga productos ingresados.</p>
              </div>
              <Button label="Generar productos" icon="pi pi-box" severity="info" @click="generarProductosDePrueba" :loading="loading" />
            </div>
            <div class="config-item flex justify-between items-center w-full border-t border-red-200 dark:border-red-900/50 pt-4 mt-2">
              <div class="config-item-info max-w-xl">
                <label class="text-orange-600 dark:text-orange-400 font-bold">Limpiar productos demo</label>
                <p class="text-sm mt-1">Elimina el catálogo demo de esta empresa mientras aún no existan ventas asociadas.</p>
              </div>
              <Button label="Limpiar productos" icon="pi pi-eraser" severity="warning" @click="limpiarProductosDemo" :loading="loading" />
            </div>
            <div class="config-item flex justify-between items-center w-full border-t border-red-200 dark:border-red-900/50 pt-4 mt-2">
              <div class="config-item-info max-w-xl">
                <label class="text-emerald-600 dark:text-emerald-400 font-bold">Onboarding demo completo</label>
                <p class="text-sm mt-1">Carga productos demo y luego ventas demo solo para esta empresa. Ideal para mostrar el sistema rápido en un negocio nuevo.</p>
              </div>
              <Button label="Onboarding demo" icon="pi pi-sparkles" severity="success" @click="ejecutarOnboardingDemo" :loading="loading" />
            </div>
            <div class="config-item flex justify-between items-center w-full border-t border-red-200 dark:border-red-900/50 pt-4 mt-2">
              <div class="config-item-info max-w-xl">
                <label class="text-indigo-600 dark:text-indigo-400 font-bold">Generar ventas demo</label>
                <p class="text-sm mt-1">Inserta ventas ficticias para esta empresa con fechas recientes. Requiere tener un turno abierto y productos registrados.</p>
              </div>
              <Button label="Generar ventas" icon="pi pi-bolt" severity="success" @click="generarVentasDePrueba" :loading="loading" />
            </div>
          </div>
        </div>
      </TabPanel>
    </Tabs>

    <!-- Dialog Crear/Editar Usuario -->
    <Dialog v-model:visible="mostrarDialogo" :header="esNuevo ? 'Nuevo Usuario' : 'Editar Usuario'" :modal="true" :style="{ width: '480px' }" class="p-fluid">
      <div class="usuario-form">
        <div class="usuario-field">
          <label>Nombre completo</label>
          <InputText v-model.trim="usuarioActual.nombre" placeholder="Nombre del usuario" />
        </div>

        <div v-if="esNuevo" class="usuario-field">
          <label>Correo electrÃ³nico</label>
          <InputText v-model.trim="usuarioActual.email" type="email" placeholder="usuario@empresa.com" />
        </div>

        <div v-if="esNuevo" class="usuario-field">
          <label>ContraseÃ±a</label>
          <Password v-model="usuarioActual.password" :feedback="false" toggle-mask placeholder="MÃ­nimo 6 caracteres" class="w-full" input-class="w-full" />
        </div>

        <div class="usuario-field">
          <label>Rol asignado</label>
          <Select
            v-model="usuarioActual.rol"
            :options="rolesDisponibles"
            optionLabel="label"
            optionValue="value"
            placeholder="Seleccionar rol"
          />
        </div>
      </div>

      <template #footer>
        <Button label="Cancelar" icon="pi pi-times" text severity="secondary" @click="mostrarDialogo = false" />
        <Button :label="esNuevo ? 'Crear usuario' : 'Guardar cambios'" icon="pi pi-check" @click="guardarUsuario" :loading="loading" />
      </template>
    </Dialog>
  </div>
</template>

<script setup lang="ts">
import { useToast } from 'primevue/usetoast'
import { useFormatMonto } from '~/composables/useFormatMonto'
import { useConfigStore } from '~/stores/config'
import type { Database } from '~/types/database.types'
import {
  getDefaultRolePermissions,
  normalizeRolePermissions,
  type RoleKey,
  type SectionKey
} from '~/composables/useRolePermissions'

interface Perfil {
  id: string
  nombre: string | null
  rol: string
  activo?: boolean
  created_at: string | null
}

interface UsuarioForm {
  id?: string
  nombre: string
  email?: string
  password?: string
  rol: string
}

const supabase = useSupabaseClient<Database>()
const toast = useToast()
const { formatFecha } = useFormatMonto()
const configStore = useConfigStore()
const { configuracion: globalConfig, loading: configLoading } = storeToRefs(configStore)

const usuarios = ref<Perfil[]>([])
const loading = ref(false)
const mostrarDialogo = ref(false)
const esNuevo = ref(false)
const usuarioActual = ref<UsuarioForm>({ nombre: '', rol: 'cajero' })

const rolesDisponibles: { label: string, value: RoleKey }[] = [
  { label: 'Administrador', value: 'admin' },
  { label: 'Cajero', value: 'cajero' },
  { label: 'Supervisor', value: 'supervisor' }
]

const monedas = [
  { label: 'Peso Chileno (CLP)', value: 'CLP' },
  { label: 'Peso Argentino (ARS)', value: 'ARS' },
  { label: 'DÃ³lar (USD)', value: 'USD' },
  { label: 'Peso Mexicano (MXN)', value: 'MXN' },
  { label: 'Euro (EUR)', value: 'EUR' }
]

const configGeneral = ref({
  nombreNegocio: 'Mi Negocio',
  moneda: 'CLP',
  iva: 19
})

const seccionesDisponibles: { label: string, value: SectionKey }[] = [
  { label: 'Dashboard', value: 'dashboard' },
  { label: 'Punto de Venta', value: 'pos' },
  { label: 'Caja', value: 'caja' },
  { label: 'Inventario', value: 'inventario' },
  { label: 'Ajuste Stock', value: 'ajuste_stock' },
  { label: 'CategorÃ­as', value: 'categorias' },
  { label: 'Clientes', value: 'clientes' },
  { label: 'Reportes', value: 'reportes' },
  { label: 'ConfiguraciÃ³n', value: 'configuracion' }
]

const rolePermissionsDraft = ref<Record<RoleKey, SectionKey[]>>(getDefaultRolePermissions())

onMounted(() => {
  fetchUsuarios()
  configStore.fetchConfig().then(() => {
    rolePermissionsDraft.value = normalizeRolePermissions(globalConfig.value?.role_permissions)
  })
})

watch(
  () => globalConfig.value?.role_permissions,
  (value) => {
    if (value) {
      rolePermissionsDraft.value = normalizeRolePermissions(value)
    }
  }
)

// FunciÃ³n para guardar globales
async function guardarConfiguracion() {
  if (!globalConfig.value) return
  try {
    await configStore.saveConfig({
      margen_ganancia_defecto: globalConfig.value.margen_ganancia_defecto,
      stock_minimo_defecto: globalConfig.value.stock_minimo_defecto,
      role_permissions: normalizeRolePermissions(rolePermissionsDraft.value),
      impresion_tamano_fuente: globalConfig.value.impresion_tamano_fuente
    })
    toast.add({ severity: 'success', summary: 'Guardado', detail: 'ConfiguraciÃ³n actualizada en todos los dispositivos.', life: 3000 })
  } catch (error: any) {
    toast.add({ severity: 'error', summary: 'Error interno', detail: 'No tienes permiso o error validando', life: 4000 })
  }
}

async function guardarPermisosRoles() {
  if (!globalConfig.value) return
  try {
    await configStore.saveConfig({
      margen_ganancia_defecto: globalConfig.value.margen_ganancia_defecto,
      stock_minimo_defecto: globalConfig.value.stock_minimo_defecto,
      role_permissions: normalizeRolePermissions(rolePermissionsDraft.value),
      impresion_tamano_fuente: globalConfig.value.impresion_tamano_fuente
    })
    toast.add({ severity: 'success', summary: 'Permisos actualizados', detail: 'Los permisos por rol se guardaron correctamente.', life: 3000 })
  } catch (error: any) {
    toast.add({ severity: 'error', summary: 'Error', detail: error?.message || 'No se pudieron guardar los permisos.', life: 4000 })
  }
}


async function fetchUsuarios() {
  loading.value = true
  try {
    const { data, error } = await supabase
      .from('perfiles')
      .select('*')
      .eq('empresa_id', authStore.empresaId)
      .order('created_at', { ascending: true })
    if (error) throw error
    if (data) usuarios.value = data as any as Perfil[]
  } catch (e: any) {
    toast.add({ severity: 'error', summary: 'Error', detail: e.message, life: 5000 })
  } finally {
    loading.value = false
  }
}

function abrirNuevo() {
  esNuevo.value = true
  usuarioActual.value = { nombre: '', email: '', password: '', rol: 'cajero' }
  mostrarDialogo.value = true
}

function abrirEditar(user: Perfil) {
  esNuevo.value = false
  usuarioActual.value = { id: user.id, nombre: user.nombre || '', rol: user.rol }
  mostrarDialogo.value = true
}

async function guardarUsuario() {
  loading.value = true
  try {
    if (esNuevo.value) {
      // Crear usuario via Supabase Edge Function
      const { email, password, nombre, rol } = usuarioActual.value
      if (!email || !password || password.length < 6) {
        toast.add({ severity: 'warn', summary: 'Datos incompletos', detail: 'Email y contraseÃ±a (mÃ­nimo 6 caracteres) son requeridos.', life: 4000 })
        loading.value = false
        return
      }

      const { data: { session } } = await supabase.auth.getSession()
      const response = await fetch(
        `${window.location.origin}/api/register-user`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${session?.access_token}`
          },
          body: JSON.stringify({ email, password, nombre, rol })
        }
      )

      if (!response.ok) {
        const err = await response.json()
        throw new Error(err.message || 'Error al crear usuario')
      }

      toast.add({ severity: 'success', summary: 'Usuario creado', detail: `${nombre} fue registrado como ${rol}.`, life: 3000 })
    } else {
      // Editar usuario existente
      if (!usuarioActual.value.id) return
      const { error } = await supabase
        .from('perfiles')
        .update({
          nombre: usuarioActual.value.nombre,
          rol: usuarioActual.value.rol
        })
        .eq('id', usuarioActual.value.id)
        .eq('empresa_id', authStore.empresaId)
      if (error) throw error
      toast.add({ severity: 'success', summary: 'Actualizado', detail: 'El usuario fue actualizado.', life: 3000 })
    }
    mostrarDialogo.value = false
    await fetchUsuarios()
  } catch (e: any) {
    toast.add({ severity: 'error', summary: 'Error', detail: e.message, life: 5000 })
  } finally {
    loading.value = false
  }
}

async function borrarTodasLasVentas() {
  if (confirm('Se eliminarán todas las ventas de esta empresa. Esta acción no se puede deshacer. ¿Deseas continuar?')) {
    try {
      loading.value = true
      const { data: sessionData } = await supabase.auth.getSession()
      const accessToken = sessionData.session?.access_token

      if (!accessToken) {
        throw new Error('No hay sesión activa para limpiar ventas.')
      }

      const response = await fetch('/api/admin/limpiar-ventas', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${accessToken}`
        }
      })

      const payload = await response.json()
      if (!response.ok) {
        throw new Error(payload.statusMessage || payload.message || 'No se pudieron limpiar las ventas')
      }

      toast.add({
        severity: 'success',
        summary: 'Ventas eliminadas',
        detail: payload.message || 'Se limpiaron todas las ventas de esta empresa.',
        life: 5000
      })
    } catch (err: any) {
      toast.add({ severity: 'error', summary: 'Error al limpiar', detail: err.message, life: 5000 })
    } finally {
      loading.value = false
    }
  }
}

async function limpiarProductosDemo() {
  if (confirm('Se eliminarán los productos demo de esta empresa. Solo úsalo si aún no has trabajado con ventas reales. ¿Deseas continuar?')) {
    loading.value = true
    try {
      const { data: sessionData } = await supabase.auth.getSession()
      const accessToken = sessionData.session?.access_token

      if (!accessToken) {
        throw new Error('No hay sesión activa para limpiar productos demo.')
      }

      const response = await fetch('/api/admin/limpiar-productos-demo', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${accessToken}`
        }
      })

      const payload = await response.json()
      if (!response.ok) {
        throw new Error(payload.statusMessage || payload.message || 'No se pudieron limpiar los productos demo')
      }

      toast.add({
        severity: 'success',
        summary: 'Productos demo eliminados',
        detail: payload.message || 'Se limpió el catálogo demo de esta empresa.',
        life: 5000
      })
    } catch (error: any) {
      toast.add({ severity: 'error', summary: 'Error al limpiar', detail: error.message, life: 5000 })
    } finally {
      loading.value = false
    }
  }
}

async function ejecutarOnboardingDemo() {
  if (confirm('Se cargarán productos demo y ventas demo para esta empresa. Se recomienda usarlo solo en negocios nuevos o ambientes demo. ¿Deseas continuar?')) {
    loading.value = true
    try {
      const { data: sessionData } = await supabase.auth.getSession()
      const accessToken = sessionData.session?.access_token

      if (!accessToken) {
        throw new Error('No hay sesión activa para ejecutar onboarding demo.')
      }

      const response = await fetch('/api/admin/onboarding-demo', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${accessToken}`
        }
      })

      const payload = await response.json()
      if (!response.ok) {
        throw new Error(payload.statusMessage || payload.message || 'No se pudo ejecutar el onboarding demo')
      }

      toast.add({
        severity: 'success',
        summary: 'Onboarding demo listo',
        detail: payload.message || 'Se cargaron productos y ventas demo para esta empresa.',
        life: 6000
      })
    } catch (error: any) {
      toast.add({ severity: 'error', summary: 'Onboarding fallido', detail: error.message, life: 5000 })
    } finally {
      loading.value = false
    }
  }
}
async function generarProductosDePrueba() {
  if (confirm('Se generará un catálogo demo solo para esta empresa. Esta acción es ideal para ambientes vacíos. ¿Deseas continuar?')) {
    loading.value = true
    try {
      const { data: sessionData } = await supabase.auth.getSession()
      const accessToken = sessionData.session?.access_token

      if (!accessToken) {
        throw new Error('No hay sesión activa para generar productos de prueba.')
      }

      const response = await fetch('/api/admin/generar-productos-demo', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${accessToken}`
        }
      })

      const payload = await response.json()
      if (!response.ok) {
        throw new Error(payload.statusMessage || payload.message || 'No se pudieron generar los productos demo')
      }

      toast.add({
        severity: 'success',
        summary: 'Catálogo demo creado',
        detail: `Se generaron ${payload.creados || 0} productos para esta empresa.`,
        life: 6000
      })
    } catch (error: any) {
      toast.add({ severity: 'error', summary: 'Carga fallida', detail: error.message, life: 5000 })
    } finally {
      loading.value = false
    }
  }
}
async function generarVentasDePrueba() {
  if (confirm('Se van a generar más de 20 ventas ficticias distribuidas en los últimos 30 días para alimentar los gráficos de Reportes. ¿Deseas continuar?')) {
    loading.value = true
    try {
      const { data: sessionData } = await supabase.auth.getSession()
      const accessToken = sessionData.session?.access_token

      if (!accessToken) {
        throw new Error('No hay sesión activa para generar ventas de prueba.')
      }

      const response = await fetch('/api/admin/generar-ventas-demo', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${accessToken}`
        }
      })

      const payload = await response.json()
      if (!response.ok) {
        throw new Error(payload.statusMessage || payload.message || 'No se pudieron generar las ventas demo')
      }

      toast.add({
        severity: 'success',
        summary: 'Simulación Exitosa',
        detail: `Se generaron ${payload.creadas || 0} ventas ficticias para esta empresa.`,
        life: 6000
      })
    } catch (error: any) {
      toast.add({ severity: 'error', summary: 'Carga fallida', detail: error.message, life: 5000 })
    } finally {
      loading.value = false
    }
  }
}
function getInitials(name: string) {
  return name.split(' ').map(n => n[0]).join('').toUpperCase().substring(0, 2)
}

function getRolSeverity(rol: string) {
  const map: Record<string, string> = { admin: 'danger', cajero: 'info', supervisor: 'warn' }
  return map[rol] || 'secondary'
}

function getRolIcon(rol: string) {
  const map: Record<string, string> = { admin: 'pi pi-shield', cajero: 'pi pi-calculator', supervisor: 'pi pi-eye' }
  return map[rol] || 'pi pi-user'
}
</script>

<style scoped>
.admin-page {
  padding: 2rem;
}

.admin-header {
  margin-bottom: 2rem;
}

.admin-header h1 {
  font-size: 1.75rem;
  font-weight: 800;
  color: var(--text-app);
  margin: 0;
}

.admin-header p {
  color: var(--text-muted);
  margin: 0.25rem 0 0;
  font-size: 0.95rem;
}

/* Sections */
.config-section {
  margin-bottom: 2rem;
}

.config-section-header {
  margin-bottom: 1.5rem;
  display: flex;
  justify-content: space-between;
  align-items: center;
  flex-wrap: wrap;
  gap: 1rem;
}

.config-section-header h2 {
  font-size: 1.2rem;
  font-weight: 700;
  color: var(--text-app);
  margin: 0;
  display: flex;
  align-items: center;
  gap: 0.5rem;
}

.config-section-header p {
  color: var(--text-muted);
  margin: 0.25rem 0 0;
  font-size: 0.85rem;
}

/* User cell */
.user-cell {
  display: flex;
  align-items: center;
  gap: 0.75rem;
}

.user-name {
  font-weight: 600;
  color: var(--text-app);
  margin: 0;
  font-size: 0.9rem;
}

.user-id {
  font-size: 0.75rem;
  color: var(--text-muted);
  margin: 0;
  font-family: monospace;
}

:deep(.user-avatar) {
  background: rgba(99, 102, 241, 0.15) !important;
  color: var(--color-brand-primary) !important;
  flex-shrink: 0;
}

/* Roles Legend */
.roles-legend {
  margin-top: 2rem;
  padding: 1.5rem;
  background: var(--bg-surface);
  border: 1px solid var(--border-subtle);
  border-radius: 1rem;
}

.roles-legend h3 {
  font-size: 1rem;
  font-weight: 600;
  color: var(--text-app);
  margin: 0 0 1rem;
  display: flex;
  align-items: center;
  gap: 0.5rem;
}

.roles-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(280px, 1fr));
  gap: 1rem;
}

.role-card {
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
  padding: 1rem;
  background: var(--bg-app);
  border-radius: 0.75rem;
  border: 1px solid var(--border-subtle);
}

.role-card p {
  font-size: 0.8rem;
  color: var(--text-muted);
  margin: 0;
  line-height: 1.5;
}

.roles-manager {
  margin-top: 1.25rem;
  padding: 1.25rem;
  background: var(--bg-surface);
  border: 1px solid var(--border-subtle);
  border-radius: 1rem;
}

.roles-manager-header h3 {
  font-size: 1rem;
  font-weight: 600;
  color: var(--text-app);
  margin: 0 0 0.3rem;
  display: flex;
  align-items: center;
  gap: 0.5rem;
}

.roles-manager-header p {
  font-size: 0.82rem;
  color: var(--text-muted);
  margin: 0 0 0.9rem;
}

.roles-manager-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(260px, 1fr));
  gap: 0.8rem;
}

.role-manager-card {
  background: var(--bg-app);
  border: 1px solid var(--border-subtle);
  border-radius: 0.75rem;
  padding: 0.8rem;
}

.role-manager-title {
  margin-bottom: 0.5rem;
}

/* Config Form */
.config-form {
  display: flex;
  flex-direction: column;
  gap: 1.5rem;
}

.config-item {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 1rem 1.25rem;
  background: var(--bg-surface);
  border: 1px solid var(--border-subtle);
  border-radius: 0.75rem;
  gap: 2rem;
}

.config-item-info label {
  font-weight: 600;
  color: var(--text-app);
  font-size: 0.9rem;
}

.config-item-info p {
  font-size: 0.8rem;
  color: var(--text-muted);
  margin: 0.15rem 0 0;
}

/* Usuario form */
.usuario-form {
  display: flex;
  flex-direction: column;
  gap: 1.25rem;
  padding: 0.5rem 0;
}

.usuario-field {
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
}

.usuario-field label {
  font-size: 0.875rem;
  font-weight: 600;
  color: var(--text-muted);
}
</style>











