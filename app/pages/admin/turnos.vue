<template>
  <div class="admin-page">
    <div class="admin-header">
      <div class="admin-header-titles">
        <h1>Auditoría de Cajas</h1>
        <p>Revisa y aprueba los cierres de caja de los vendedores de forma segura.</p>
      </div>
    </div>

    <!-- Filtros y Resumen -->
    <div class="mb-4 flex flex-wrap gap-4 items-center justify-between">
      <div class="flex gap-2 p-1 bg-surface-100 dark:bg-surface-900 rounded-xl" style="background: var(--bg-surface); padding: 0.25rem;">
        <Button :severity="estadoFiltro === 'pendientes' ? 'primary' : 'secondary'" :text="estadoFiltro !== 'pendientes'" label="Pendientes" @click="estadoFiltro = 'pendientes'" />
        <Button :severity="estadoFiltro === 'todos' ? 'primary' : 'secondary'" :text="estadoFiltro !== 'todos'" label="Historial completo" @click="estadoFiltro = 'todos'" />
      </div>
      <Button icon="pi pi-refresh" label="Actualizar" severity="secondary" outlined @click="cargarTurnos" :loading="loading" />
    </div>

    <div class="config-section">
      <DataTable
        :value="turnosAMostrar"
        :loading="loading"
        class="p-datatable-sm"
        dataKey="id"
        responsiveLayout="scroll"
        paginator
        :rows="10"
      >
        <Column header="Turno y Cajero" style="min-width: 14rem">
          <template #body="slotProps">
            <div class="flex items-center gap-3">
              <Avatar :label="getInitials(slotProps.data.cajero_nombre)" shape="circle" style="background: rgba(99, 102, 241, 0.15); color: var(--color-brand-primary)" />
              <div>
                <div class="font-bold text-[0.9rem]">
                  {{ slotProps.data.cajero_nombre }}
                  <span v-if="slotProps.data.es_virtual" class="ml-2 text-[0.65rem] bg-indigo-100 text-indigo-700 px-2 py-0.5 rounded-full uppercase">Fuera de Turno</span>
                </div>
                <div class="text-xs text-slate-500 font-mono">{{ slotProps.data.id.substring(0, 8) }}</div>
              </div>
            </div>
          </template>
        </Column>

        <Column header="Apertura / Cierre" style="min-width: 11rem">
          <template #body="slotProps">
            <div class="text-[0.85rem]">
              <div><span class="text-slate-400">Ap:</span> {{ formatFechaLarga(slotProps.data.fecha_apertura) }}</div>
              <div v-if="slotProps.data.fecha_cierre"><span class="text-slate-400">Ci:</span> {{ formatFechaLarga(slotProps.data.fecha_cierre) }}</div>
            </div>
          </template>
        </Column>

        <Column header="Fondo Inicial">
          <template #body="slotProps">
            <span class="font-medium text-slate-600 dark:text-slate-400">{{ formatMonto(slotProps.data.monto_inicial) }}</span>
          </template>
        </Column>
        
        <Column header="Ingresos Efectivo">
          <template #body="slotProps">
            <Tag :value="formatMonto(slotProps.data.ventas_efectivo)" severity="info" class="font-mono text-[0.85rem]" />
          </template>
        </Column>

        <Column header="Esperado (Sistema)">
          <template #body="slotProps">
            <span class="font-bold">{{ formatMonto(slotProps.data.monto_esperado) }}</span>
          </template>
        </Column>

        <Column header="Contado/Físico">
          <template #body="slotProps">
            <span class="font-bold text-indigo-500">{{ formatMonto(slotProps.data.monto_declarado) }}</span>
          </template>
        </Column>

        <Column header="Descuadre" style="min-width: 9rem">
          <template #body="slotProps">
            <div v-if="slotProps.data.estado !== 'abierto'" class="flex items-center gap-1 font-bold" :class="getDiferenciaColor(slotProps.data.diferencia_real)">
              <i :class="getDiferenciaIcon(slotProps.data.diferencia_real)" />
              {{ formatDiferencia(slotProps.data.diferencia_real) }}
            </div>
            <span v-else class="text-slate-400 italic text-sm">En curso</span>
          </template>
        </Column>

        <Column header="Estado">
          <template #body="slotProps">
            <Tag :value="formatEstado(slotProps.data.estado)" :severity="getEstadoSeverity(slotProps.data.estado)" />
          </template>
        </Column>

        <Column style="width: 5rem">
          <template #body="slotProps">
            <Button
              v-if="slotProps.data.estado === 'cerrado_pendiente_revision'"
              icon="pi pi-check"
              severity="success"
              outlined
              rounded
              title="Aprobar Arqueo"
              @click="aprobarTurno(slotProps.data)"
            />
            <Button
              v-else
              icon="pi pi-eye"
              severity="secondary"
              text
              rounded
              title="Ver detalles"
              @click="verDetalles(slotProps.data)"
            />
          </template>
        </Column>

        <template #empty>
          <div class="text-center p-8 text-slate-500">
            No hay turnos para mostrar en esta vista.
          </div>
        </template>
      </DataTable>
    </div>

    <!-- Dialog de Detalles -->
    <Dialog v-model:visible="mostrarDetalles" header="Detalles del Turno" modal :style="{ width: '500px' }" class="pos-dialog">
      <div v-if="turnoSeleccionado" class="dialog-body space-y-4">
        <!-- Info Resumen -->
        <div class="p-4 bg-surface-50 dark:bg-surface-900 rounded-xl border border-surface-200 dark:border-surface-800">
          <div class="flex justify-between border-b border-surface-200 dark:border-surface-800 pb-2 mb-2">
            <span class="text-slate-500 text-sm">Fondo Inicial</span>
            <span class="font-medium">{{ formatMonto(turnoSeleccionado.monto_inicial) }}</span>
          </div>
          <div class="flex justify-between border-b border-surface-200 dark:border-surface-800 pb-2 mb-2">
            <span class="text-slate-500 text-sm">Ventas cobradas en Efectivo</span>
            <span class="font-medium">{{ formatMonto(turnoSeleccionado.ventas_efectivo) }}</span>
          </div>
          <div class="flex justify-between pt-1">
            <span class="font-bold text-slate-700 dark:text-slate-300">Total Esperado en Caja</span>
            <span class="font-bold text-lg">{{ formatMonto(turnoSeleccionado.monto_esperado) }}</span>
          </div>
        </div>

        <!-- Físicamente -->
        <div class="p-4 rounded-xl border" :class="[turnoSeleccionado.diferencia_real === 0 ? 'bg-emerald-50 border-emerald-200 dark:bg-emerald-900/20 dark:border-emerald-800' : 'bg-slate-50 border-slate-200 dark:bg-slate-800/40 dark:border-slate-700']">
          <div class="flex justify-between items-center mb-1">
            <span class="text-sm font-medium opacity-80">Monto Físico Informado</span>
            <span class="font-bold text-xl">{{ formatMonto(turnoSeleccionado.monto_declarado) }}</span>
          </div>
          <div class="flex justify-between items-center mt-2 pt-2 border-t border-black/10 dark:border-white/10">
            <span class="text-sm">Descuadre Real</span>
            <span class="font-bold text-lg" :class="getDiferenciaColor(turnoSeleccionado.diferencia_real)">
              {{ formatDiferencia(turnoSeleccionado.diferencia_real) }}
            </span>
          </div>
        </div>

        <div v-if="turnoSeleccionado.observaciones" class="mt-4">
          <label class="text-xs font-bold text-slate-400 uppercase tracking-wider mb-1 block">Observaciones del Cajero</label>
          <div class="p-3 bg-surface-50 dark:bg-surface-900 border border-surface-200 dark:border-surface-800 rounded-lg text-sm text-slate-600 dark:text-slate-300 italic">
            "{{ turnoSeleccionado.observaciones }}"
          </div>
        </div>
      </div>
      <template #footer>
        <Button label="Cerrar" text severity="secondary" @click="mostrarDetalles = false" />
        <Button v-if="turnoSeleccionado?.estado === 'cerrado_pendiente_revision'" label="Aprobar Arqueo" icon="pi pi-check" severity="success" @click="aprobarTurnoModal" :loading="loadingAprobar" />
      </template>
    </Dialog>
  </div>
</template>

<script setup>
import { useFormatMonto } from '~/composables/useFormatMonto'
import { useToast } from 'primevue/usetoast'
import { useAuthStore } from '~/stores/auth'

definePageMeta({
  layout: 'admin',
  middleware: ['auth'] // Asumiendo que el middleware auth protege esta ruta para admin
})

const supabase = useSupabaseClient()
const authStore = useAuthStore()
const toast = useToast()
const { formatMonto, formatFechaLarga } = useFormatMonto()

const turnos = ref([])
const loading = ref(false)
const estadoFiltro = ref('pendientes')
const mostrarDetalles = ref(false)
const turnoSeleccionado = ref(null)
const loadingAprobar = ref(false)

const turnosAMostrar = computed(() => {
  if (estadoFiltro.value === 'pendientes') {
    return turnos.value.filter(t => t.estado === 'cerrado_pendiente_revision')
  }
  return turnos.value
})

onMounted(() => {
  cargarTurnos()
})

async function cargarTurnos() {
  loading.value = true
  try {
    // 1. Obtener los turnos
    const { data: turnosData, error } = await supabase
      .from('turnos_caja')
      .select(`*`)
      .eq('empresa_id', authStore.empresaId)
      .order('fecha_apertura', { ascending: false })
      .limit(100)

    if (error) throw error
    if (!turnosData || turnosData.length === 0) {
      turnos.value = []
      return
    }

    // 2. Enriquecer con nombres de usuario
    const userIds = [...new Set(turnosData.map(t => t.id_usuario))]
    const { data: perfiles } = await supabase
      .from('perfiles')
      .select('id, nombre')
      .eq('empresa_id', authStore.empresaId)
      .in('id', userIds)
    
    const mapPerfiles = new Map((perfiles || []).map(p => [p.id, p.nombre || 'Desconocido']))

    // 3. Obtener todas las ventas pagadas en efectivo de esos turnos para calcular real
    const turnoIds = turnosData.map(t => t.id)
    const { data: ventas, error: errVentas } = await supabase
      .from('ventas')
      .select('id_turno, metodo_pago, total, pago_efectivo')
      .eq('empresa_id', authStore.empresaId)
      .in('id_turno', turnoIds)

    const mapEfectivo = new Map()
    if (ventas) {
      ventas.forEach(v => {
        let montoEf = 0
        const mPago = String(v.metodo_pago).toLowerCase()
        if (mPago === 'efectivo') {
          montoEf = Number(v.total)
        } else if (mPago === 'mixto') {
          montoEf = Number(v.pago_efectivo || 0)
        }
        
        const exist = mapEfectivo.get(v.id_turno) || 0
        mapEfectivo.set(v.id_turno, exist + montoEf)
      })
    }

    // 4. Obtener VENTAS FUERA DE TURNO (Admin/Super) para completar la auditoría
    const { data: ventasHuérfanas } = await supabase
      .from('ventas')
      .select('id, id_usuario, metodo_pago, total, pago_efectivo, fecha')
      .eq('empresa_id', authStore.empresaId)
      .is('id_turno', null)
      .limit(500)

    const turnosVirtuales = []
    if (ventasHuérfanas && ventasHuérfanas.length > 0) {
      // Agrupar ventas huérfanas por Usuario y Día
      const grupos = {}
      ventasHuérfanas.forEach(v => {
        const dia = new Date(v.fecha).toISOString().split('T')[0]
        const key = `${v.id_usuario}_${dia}`
        if (!grupos[key]) {
          grupos[key] = {
            id: `v-${key}`,
            id_usuario: v.id_usuario,
            fecha_apertura: `${dia}T09:00:00`, // Fecha ficticia para orden
            fecha_cierre: `${dia}T23:59:59`,
            monto_inicial: 0,
            monto_declarado: 0,
            estado: 'cerrado_aprobado',
            es_virtual: true,
            ventas_efectivo: 0,
            total_ventas: 0
          }
        }
        
        let montoEf = 0
        const mPago = String(v.metodo_pago).toLowerCase()
        if (mPago === 'efectivo') montoEf = Number(v.total)
        else if (mPago === 'mixto') montoEf = Number(v.pago_efectivo || 0)
        
        grupos[key].ventas_efectivo += montoEf
        grupos[key].total_ventas += Number(v.total)
        grupos[key].monto_declarado += Number(v.total) // Se asume cuadrando al no haber apertura/cierre
      })

      Object.values(grupos).forEach(tv => {
        turnosVirtuales.push({
          ...tv,
          cajero_nombre: mapPerfiles.get(tv.id_usuario) || 'Administración',
          monto_esperado: tv.ventas_efectivo,
          diferencia_real: 0
        })
      })
    }

    // 5. Mapear final y combinar
    const turnosReales = turnosData.map(t => {
      const v_efectivo = mapEfectivo.get(t.id) || 0
      const esperado = Number(t.monto_inicial) + v_efectivo
      const declarado = Number(t.monto_declarado || 0)
      const dif = t.estado !== 'abierto' ? declarado - esperado : 0

      return {
        ...t,
        cajero_nombre: mapPerfiles.get(t.id_usuario),
        ventas_efectivo: v_efectivo,
        monto_esperado: esperado,
        diferencia_real: dif
      }
    })

    turnos.value = [...turnosReales, ...turnosVirtuales].sort((a, b) => 
      new Date(b.fecha_apertura).getTime() - new Date(a.fecha_apertura).getTime()
    )

  } catch (err) {
    toast.add({ severity: 'error', summary: 'Error', detail: err.message, life: 5000 })
  } finally {
    loading.value = false
  }
}

async function aprobarTurno(turno) {
  if (!confirm('¿Marcar este arqueo como revisado y aprobado?')) return
  await ejecutarAprobacion(turno)
}

async function aprobarTurnoModal() {
  await ejecutarAprobacion(turnoSeleccionado.value)
  mostrarDetalles.value = false
}

async function ejecutarAprobacion(turno) {
  loadingAprobar.value = true
  try {
    const nuevoEstado = turno.diferencia_real === 0 ? 'cerrado_aprobado' : 'cerrado_aprobado_con_descuadre'
    const { error } = await supabase
      .from('turnos_caja')
      .update({ estado: nuevoEstado })
      .eq('id', turno.id)
      .eq('empresa_id', authStore.empresaId)

    if (error) throw error

    toast.add({ severity: 'success', summary: 'Aprobado', detail: 'El turno fue auditado correctamente.', life: 3000 })
    turno.estado = nuevoEstado // Actualizar reactividad local
  } catch (err) {
    toast.add({ severity: 'error', summary: 'Fallo al aprobar', detail: err.message, life: 4000 })
  } finally {
    loadingAprobar.value = false
  }
}

function verDetalles(turno) {
  turnoSeleccionado.value = turno
  mostrarDetalles.value = true
}

// Helpers Vistas
function getInitials(name) {
  if (!name) return '?'
  return name.split(' ').map(n => n[0]).join('').toUpperCase().substring(0, 2)
}

function getDiferenciaColor(dif) {
  if (dif > 0) return 'text-emerald-500'
  if (dif < 0) return 'text-red-500'
  return 'text-slate-400'
}

function getDiferenciaIcon(dif) {
  if (dif > 0) return 'pi pi-arrow-up'
  if (dif < 0) return 'pi pi-arrow-down'
  return 'pi pi-check'
}

function formatDiferencia(dif) {
  if (dif === 0) return 'Exacto'
  return (dif > 0 ? '+ ' : '- ') + formatMonto(Math.abs(dif))
}

function formatEstado(estado) {
  const m = {
    'abierto': 'En curso',
    'cerrado_pendiente_revision': 'Pendiente',
    'cerrado_aprobado': 'Auditado OK',
    'cerrado_aprobado_con_descuadre': 'Auditado c/ Descuadre',
    'cerrado': 'Cerrado'
  }
  return m[estado] || estado
}

function getEstadoSeverity(estado) {
  if (estado === 'abierto') return 'info'
  if (estado === 'cerrado_pendiente_revision') return 'warning'
  if (estado === 'cerrado_aprobado') return 'success'
  if (estado === 'cerrado_aprobado_con_descuadre') return 'danger'
  return 'secondary'
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
</style>
