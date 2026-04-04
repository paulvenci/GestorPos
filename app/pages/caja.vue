<template>
  <div class="caja-root">
    <!-- Estado: sin turno -->
    <div v-if="!cajaStore.hayTurnoActivo && !cajaStore.loading" class="caja-empty-state">
      <div class="caja-empty-card">
        <div class="caja-empty-icon">
          <i class="pi pi-lock" />
        </div>
        <h2 class="caja-empty-title">No hay turno activo</h2>
        <p class="caja-empty-desc">
          Para comenzar a operar, debes abrir un nuevo turno de caja ingresando el monto inicial.
        </p>
        <Button
          label="Abrir turno de caja"
          icon="pi pi-play"
          size="large"
          class="caja-open-btn"
          @click="mostrarDialogo = true"
        />
      </div>
    </div>

    <!-- Estado: turno activo -->
    <div v-else-if="cajaStore.hayTurnoActivo" class="caja-activa">
      <div class="caja-header">
        <div>
          <h1 class="caja-title">Turno Activo</h1>
          <p class="caja-subtitle">Tienes un turno en curso. Puedes ir al POS o cerrar la caja.</p>
        </div>
        <Tag severity="success" value="EN CURSO" class="caja-tag" />
      </div>

      <!-- Info del turno -->
      <div class="caja-info-grid">
        <div class="caja-info-card">
          <span class="caja-info-label">Apertura</span>
          <span class="caja-info-value">
            {{ formatFecha(cajaStore.turnoActivo!.fecha_apertura) }}
          </span>
        </div>
        <div class="caja-info-card">
          <span class="caja-info-label">Monto inicial</span>
          <span class="caja-info-value caja-info-value--money">
            {{ formatMonto(cajaStore.turnoActivo!.monto_inicial) }}
          </span>
        </div>
        <div class="caja-info-card">
          <span class="caja-info-label">Tiempo transcurrido</span>
          <span class="caja-info-value">{{ tiempoTranscurrido }}</span>
        </div>
      </div>

      <!-- Acciones -->
      <div class="caja-actions">
        <NuxtLink to="/pos">
          <Button label="Ir al Punto de Venta" icon="pi pi-shopping-cart" size="large" class="caja-pos-btn" />
        </NuxtLink>
        <Button
          label="Cerrar caja"
          icon="pi pi-stop-circle"
          severity="danger"
          outlined
          size="large"
          @click="mostrarCierre = true"
        />
      </div>
    </div>

    <!-- Skeleton mientras carga -->
    <div v-else class="caja-skeleton">
      <Skeleton height="200px" border-radius="1rem" />
    </div>

    <!-- ─── Historial de Turnos ─── -->
    <div class="caja-historial">
      <div class="caja-historial-header">
        <h2><i class="pi pi-history" /> Historial de Turnos</h2>
        <div class="caja-historial-filtros">
          <DatePicker v-model="filtroFecha" showIcon placeholder="Filtrar por fecha" date-format="dd/mm/yy" showButtonBar class="historial-datepicker" />
          <Button icon="pi pi-print" label="Imprimir" outlined severity="secondary" size="small" @click="imprimirHistorial" />
        </div>
      </div>

      <DataTable
        :value="turnosHistorial"
        :loading="loadingHistorial"
        class="p-datatable-sm"
        paginator
        :rows="10"
        responsiveLayout="scroll"
        sortField="apertura_at"
        :sortOrder="-1"
      >
        <Column header="Usuario" sortable field="usuario_nombre">
          <template #body="slotProps">
            <span>{{ slotProps.data.usuario_nombre || slotProps.data.id_usuario?.substring(0, 8) || '-' }}</span>
          </template>
        </Column>
        <Column header="Apertura" sortable field="apertura_at">
          <template #body="slotProps">
            <span class="text-sm" style="color: var(--text-muted)">{{ formatFechaLarga(slotProps.data.apertura_at) }}</span>
          </template>
        </Column>
        <Column header="Cierre" sortable field="cierre_at">
          <template #body="slotProps">
            <span v-if="slotProps.data.cierre_at" class="text-sm" style="color: var(--text-muted)">{{ formatFechaLarga(slotProps.data.cierre_at) }}</span>
            <Tag v-else value="Activo" severity="success" />
          </template>
        </Column>
        <Column header="Monto Inicial">
          <template #body="slotProps">
            {{ formatMonto(slotProps.data.monto_inicial) }}
          </template>
        </Column>
        <Column header="Monto Cierre">
          <template #body="slotProps">
            <span v-if="slotProps.data.monto_cierre !== null">{{ formatMonto(slotProps.data.monto_cierre) }}</span>
            <span v-else style="color: var(--text-muted)">—</span>
          </template>
        </Column>
        <Column header="Ventas">
          <template #body="slotProps">
            <Tag :value="(slotProps.data.ventas_registradas ?? 0).toString()" severity="info" />
          </template>
        </Column>
        <template #empty>
          <div class="p-4 text-center" style="color: var(--text-muted)">No hay turnos registrados.</div>
        </template>
      </DataTable>
    </div>

    <!-- ─── Diálogo: Apertura de turno ─── -->
    <Dialog
      v-model:visible="mostrarDialogo"
      modal
      header="Abrir Turno de Caja"
      :style="{ width: '440px' }"
      class="pos-dialog"
    >
      <div class="dialog-body">
        <p class="dialog-desc">
          Ingresa el monto en efectivo con el que inicias la caja hoy.
        </p>
        <div class="dialog-field">
          <label class="dialog-label">Monto Inicial ($)</label>
          <InputNumber
            v-model="montoInicial"
            :min="0"
            :maxFractionDigits="0"
            placeholder="0"
            class="dialog-input"
            input-class="w-full"
            :use-grouping="true"
            autofocus
            @keydown.enter="confirmarApertura"
          />
        </div>
      </div>
      <template #footer>
        <Button label="Cancelar" text severity="secondary" @click="mostrarDialogo = false" />
        <Button
          label="Abrir turno"
          icon="pi pi-check"
          :loading="cajaStore.loading"
          :disabled="!montoInicial && montoInicial !== 0"
          @click="confirmarApertura"
        />
      </template>
    </Dialog>

    <!-- ─── Diálogo: Cierre de turno ─── -->
    <Dialog
      v-model:visible="mostrarCierre"
      modal
      header="Cerrar Turno de Caja"
      :style="{ width: '480px' }"
      class="pos-dialog"
    >
      <div class="dialog-body">
        <p class="dialog-desc">
          Ingresa el monto físico contado en caja. El sistema calculará las diferencias automáticamente.
        </p>

        <div class="cierre-resumen">
          <div class="cierre-resumen-row">
            <span>Monto inicial</span>
            <strong>{{ formatMonto(cajaStore.turnoActivo?.monto_inicial ?? 0) }}</strong>
          </div>
        </div>

        <div class="dialog-field mt-4">
          <label class="dialog-label">Monto Declarado ($)</label>
          <InputNumber
            v-model="montoCierre"
            :min="0"
            :maxFractionDigits="0"
            placeholder="0"
            class="dialog-input"
            input-class="w-full"
            autofocus
          />
        </div>

        <div v-if="montoCierre !== null" class="cierre-diferencia" :class="diferenciaClass">
          <i :class="diferenciaIcon" />
          <span>Diferencia: <strong>{{ formatMonto(diferencia) }}</strong></span>
        </div>

        <div class="dialog-field">
          <label class="dialog-label">Observaciones (opcional)</label>
          <Textarea
            v-model="observacionesCierre"
            rows="3"
            placeholder="Ej: Todo cuadró correctamente..."
            class="dialog-input w-full"
          />
        </div>
      </div>
      <template #footer>
        <Button label="Cancelar" text severity="secondary" @click="mostrarCierre = false" />
        <Button
          label="Confirmar cierre"
          icon="pi pi-stop-circle"
          severity="danger"
          :loading="cajaStore.loading"
          :disabled="montoCierre === null"
          @click="confirmarCierre"
        />
      </template>
    </Dialog>
  </div>
</template>

<script setup lang="ts">
import { useToast } from 'primevue/usetoast'
import { useCajaStore } from '~/stores/caja'
import { useFormatMonto } from '~/composables/useFormatMonto'
import type { Database } from '~/types/database.types'

const supabase = useSupabaseClient<Database>()
const cajaStore = useCajaStore()
const toast = useToast()
const { formatMonto, formatFecha, formatFechaLarga } = useFormatMonto()

const mostrarDialogo = ref(false)
const mostrarCierre = ref(false)
const montoInicial = ref<number | null>(null)
const montoCierre = ref<number | null>(null)
const observacionesCierre = ref('')

// Historial
const turnosHistorial = ref<any[]>([])
const loadingHistorial = ref(false)
const filtroFecha = ref<Date | null>(null)

// Inicializar: buscar turno activo y cargar historial
onMounted(async () => {
  await cajaStore.fetchTurnoActivo()
  await fetchHistorial()
})

// Watch para filtrar por fecha
watch(filtroFecha, () => fetchHistorial())

async function fetchHistorial() {
  loadingHistorial.value = true
  try {
    let query = supabase
      .from('turnos_caja')
      .select('*')
      .order('fecha_apertura', { ascending: false })
      .limit(50)

    if (filtroFecha.value) {
      const d = filtroFecha.value
      const inicio = new Date(d.getFullYear(), d.getMonth(), d.getDate()).toISOString()
      const fin = new Date(d.getFullYear(), d.getMonth(), d.getDate() + 1).toISOString()
      query = query.gte('fecha_apertura', inicio).lt('fecha_apertura', fin)
    }

    const { data, error } = await query
    if (error) throw error

    // Enriquecer con nombres de usuario
    if (data && data.length > 0) {
      const userIds = [...new Set(data.map((t: any) => t.id_usuario))]
      const { data: perfiles } = await supabase
        .from('perfiles')
        .select('id, nombre')
        .in('id', userIds)

      const perfilMap = new Map((perfiles || []).map((p: any) => [p.id, p.nombre]))

      turnosHistorial.value = data.map((t: any) => ({
        ...t,
        apertura_at: t.fecha_apertura,
        cierre_at: t.fecha_cierre,
        usuario_nombre: perfilMap.get(t.id_usuario) || null
      }))
    } else {
      turnosHistorial.value = []
    }
  } catch (e: any) {
    toast.add({ severity: 'error', summary: 'Error', detail: e.message, life: 5000 })
  } finally {
    loadingHistorial.value = false
  }
}

function imprimirHistorial() {
  const printWindow = window.open('', '_blank', 'width=900,height=700')
  if (!printWindow) return

  let rows = turnosHistorial.value.map(t => `
    <tr>
      <td>${t.usuario_nombre || '-'}</td>
      <td>${formatFechaLarga(t.apertura_at)}</td>
      <td>${t.cierre_at ? formatFechaLarga(t.cierre_at) : 'Activo'}</td>
      <td>${formatMonto(t.monto_inicial)}</td>
      <td>${t.monto_cierre !== null ? formatMonto(t.monto_cierre) : '—'}</td>
      <td>${t.ventas_registradas ?? 0}</td>
    </tr>
  `).join('')

  printWindow.document.write(`
    <html><head><title>Historial de Turnos</title>
    <style>
      body { font-family: sans-serif; padding: 20px; }
      table { width: 100%; border-collapse: collapse; }
      th, td { border: 1px solid #ddd; padding: 8px; text-align: left; font-size: 13px; }
      th { background: #f5f5f5; font-weight: 600; }
      h1 { font-size: 18px; }
    </style></head>
    <body>
      <h1>Historial de Turnos — GestorPOS</h1>
      <table>
        <thead><tr><th>Usuario</th><th>Apertura</th><th>Cierre</th><th>Monto Inicial</th><th>Monto Cierre</th><th>Ventas</th></tr></thead>
        <tbody>${rows}</tbody>
      </table>
      <script>window.onload = () => { window.print(); setTimeout(() => window.close(), 500); }<\/script>
    </body></html>
  `)
  printWindow.document.close()
}

// Calcular diferencia en cierre
const diferencia = computed(() => {
  if (montoCierre.value === null || !cajaStore.turnoActivo) return 0
  return montoCierre.value - cajaStore.turnoActivo.monto_inicial
})

const diferenciaClass = computed(() => {
  if (diferencia.value > 0) return 'cierre-diferencia--sobrante'
  if (diferencia.value < 0) return 'cierre-diferencia--faltante'
  return 'cierre-diferencia--exacto'
})

const diferenciaIcon = computed(() => {
  if (diferencia.value > 0) return 'pi pi-arrow-up'
  if (diferencia.value < 0) return 'pi pi-arrow-down'
  return 'pi pi-check'
})

// Tiempo transcurrido desde apertura
const tiempoTranscurrido = computed(() => {
  if (!cajaStore.turnoActivo) return '—'
  const apertura = new Date(cajaStore.turnoActivo.fecha_apertura)
  const ahora = new Date()
  const diffMs = ahora.getTime() - apertura.getTime()
  const horas = Math.floor(diffMs / 3_600_000)
  const minutos = Math.floor((diffMs % 3_600_000) / 60_000)
  return `${horas}h ${minutos}min`
})

async function confirmarApertura() {
  if (montoInicial.value === null) return
  try {
    await cajaStore.abrirTurno(montoInicial.value)
    mostrarDialogo.value = false
    montoInicial.value = null
    toast.add({ severity: 'success', summary: 'Turno abierto', detail: 'La caja ya está operativa', life: 3000 })
    await fetchHistorial()
  } catch (e: any) {
    toast.add({ severity: 'error', summary: 'Error', detail: e.message ?? 'No se pudo abrir la caja', life: 5000 })
  }
}

async function confirmarCierre() {
  if (montoCierre.value === null) return
  try {
    const resumen = await cajaStore.cerrarTurno(montoCierre.value, observacionesCierre.value)
    mostrarCierre.value = false
    montoCierre.value = null
    observacionesCierre.value = ''
    toast.add({ severity: 'success', summary: 'Turno cerrado', detail: 'La caja fue cerrada con éxito', life: 3000 })
    await fetchHistorial()
  } catch (e: any) {
    toast.add({ severity: 'error', summary: 'Error', detail: e.message ?? 'No se pudo cerrar la caja', life: 5000 })
  }
}
</script>

<style scoped>
.caja-root {
  padding: 2.5rem;
  min-height: 100vh;
  color: var(--text-app);
}

/* ─── Empty state ─── */
.caja-empty-state {
  display: flex;
  align-items: center;
  justify-content: center;
  min-height: 70vh;
}

.caja-empty-card {
  background: var(--bg-surface);
  border: 1px solid var(--border-sidebar);
  border-radius: 1.25rem;
  padding: 3.5rem;
  text-align: center;
  max-width: 420px;
  width: 100%;
}

.caja-empty-icon {
  width: 5rem;
  height: 5rem;
  border-radius: 50%;
  background: rgba(99, 102, 241, 0.15);
  border: 1px solid rgba(99, 102, 241, 0.3);
  display: flex;
  align-items: center;
  justify-content: center;
  margin: 0 auto 1.5rem;
}

.caja-empty-icon .pi {
  font-size: 2rem;
  color: #818cf8;
}

.caja-empty-title {
  font-size: 1.5rem;
  font-weight: 700;
  color: var(--text-app);
  margin: 0 0 0.75rem;
}

.caja-empty-desc {
  color: var(--text-muted);
  font-size: 0.95rem;
  line-height: 1.6;
  margin: 0 0 2rem;
}

:deep(.caja-open-btn) {
  background: linear-gradient(135deg, #6366f1, #8b5cf6) !important;
  border: none !important;
  border-radius: 0.75rem !important;
  font-weight: 600 !important;
  box-shadow: 0 4px 15px rgba(99, 102, 241, 0.35) !important;
  transition: all 0.2s ease !important;
}

:deep(.caja-open-btn:hover) {
  transform: translateY(-2px) !important;
  box-shadow: 0 6px 20px rgba(99, 102, 241, 0.5) !important;
}

/* ─── Turno activo ─── */
.caja-activa {
  max-width: 800px;
}

.caja-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 2rem;
}

.caja-title {
  font-size: 1.75rem;
  font-weight: 700;
  color: var(--text-app);
  margin: 0 0 0.3rem;
  letter-spacing: -0.03em;
}

.caja-subtitle {
  color: var(--text-muted);
  margin: 0;
  font-size: 0.95rem;
}

.caja-info-grid {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 1rem;
  margin-bottom: 2rem;
}

.caja-info-card {
  background: var(--bg-surface);
  border: 1px solid var(--border-sidebar);
  border-radius: 1rem;
  padding: 1.5rem;
  display: flex;
  flex-direction: column;
  gap: 0.35rem;
}

.caja-info-label {
  font-size: 0.8rem;
  text-transform: uppercase;
  letter-spacing: 0.08em;
  color: var(--text-muted);
  font-weight: 600;
}

.caja-info-value {
  font-size: 1.25rem;
  font-weight: 700;
  color: var(--text-app);
}

.caja-info-value--money {
  color: #4ade80;
}

.caja-actions {
  display: flex;
  gap: 1rem;
  align-items: center;
}

:deep(.caja-pos-btn) {
  background: linear-gradient(135deg, #6366f1, #8b5cf6) !important;
  border: none !important;
  border-radius: 0.75rem !important;
  font-weight: 600 !important;
  box-shadow: 0 4px 15px rgba(99, 102, 241, 0.35) !important;
}

/* ─── Diálogos ─── */
.dialog-body {
  padding: 0.5rem 0;
}

.dialog-desc {
  color: #94a3b8;
  margin: 0 0 1.5rem;
  font-size: 0.9rem;
  line-height: 1.6;
}

.dialog-field {
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
  margin-bottom: 1rem;
}

.dialog-label {
  font-size: 0.875rem;
  font-weight: 500;
  color: var(--text-muted);
}

:deep(.dialog-input) {
  width: 100%;
}

:deep(.dialog-input input) {
  width: 100%;
  background: var(--bg-app) !important;
  border: 1px solid var(--border-sidebar) !important;
  color: var(--text-app) !important;
  border-radius: 0.6rem !important;
  padding: 0.75rem 1rem !important;
}

:deep(.dialog-input input:focus) {
  border-color: rgba(99, 102, 241, 0.6) !important;
  box-shadow: 0 0 0 3px rgba(99, 102, 241, 0.15) !important;
}

.cierre-resumen {
  background: var(--bg-app);
  border: 1px solid var(--border-sidebar);
  border-radius: 0.75rem;
  padding: 1rem 1.25rem;
  margin-bottom: 1rem;
}

.cierre-resumen-row {
  display: flex;
  justify-content: space-between;
  align-items: center;
  color: #94a3b8;
  font-size: 0.875rem;
}

.cierre-resumen-row strong {
  color: var(--text-app);
}

.cierre-diferencia {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  padding: 0.75rem 1rem;
  border-radius: 0.6rem;
  font-size: 0.9rem;
  margin-bottom: 1rem;
}

.cierre-diferencia--exacto {
  background: rgba(74, 222, 128, 0.1);
  color: #4ade80;
  border: 1px solid rgba(74, 222, 128, 0.25);
}

.cierre-diferencia--sobrante {
  background: rgba(250, 204, 21, 0.1);
  color: #facc15;
  border: 1px solid rgba(250, 204, 21, 0.25);
}

.cierre-diferencia--faltante {
  background: rgba(248, 113, 113, 0.1);
  color: #f87171;
  border: 1px solid rgba(248, 113, 113, 0.25);
}

.caja-skeleton {
  max-width: 800px;
}

.mt-4 {
  margin-top: 1rem;
}

/* ─── Historial de Turnos ─── */
.caja-historial {
  margin-top: 2.5rem;
  padding-top: 2rem;
  border-top: 1px solid var(--border-subtle);
}

.caja-historial-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  flex-wrap: wrap;
  gap: 1rem;
  margin-bottom: 1.5rem;
}

.caja-historial-header h2 {
  font-size: 1.25rem;
  font-weight: 700;
  margin: 0;
  display: flex;
  align-items: center;
  gap: 0.5rem;
  color: var(--text-app);
}

.caja-historial-filtros {
  display: flex;
  gap: 0.75rem;
  align-items: center;
}

:deep(.historial-datepicker) {
  width: 200px;
}

:deep(.caja-historial .p-datatable) {
  background: var(--bg-surface);
  border-radius: 1rem;
  border: 1px solid var(--border-sidebar);
  overflow: hidden;
}

:deep(.caja-historial .p-datatable-thead > tr > th) {
  background: var(--bg-app) !important;
  color: var(--text-muted) !important;
  font-weight: 600;
  font-size: 0.85rem;
  text-transform: uppercase;
  letter-spacing: 0.05em;
  padding: 0.75rem 1rem;
  border: none !important;
}

:deep(.caja-historial .p-datatable-tbody > tr) {
  background: transparent !important;
  color: var(--text-app);
}

:deep(.caja-historial .p-datatable-tbody > tr > td) {
  border-color: var(--border-subtle) !important;
  padding: 0.75rem 1rem;
}

:deep(.caja-historial .p-paginator) {
  background: transparent !important;
  border-top: 1px solid var(--border-subtle) !important;
}
</style>
