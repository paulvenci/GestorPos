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
          <Button icon="pi pi-print" label="Imprimir" outlined severity="secondary" size="small" @click="abrirDialogoImpresion" />
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
        <Column header="Acciones" style="width: 7rem">
          <template #body="slotProps">
            <Button icon="pi pi-print" text severity="secondary" size="small" title="Imprimir detalle del turno" @click="imprimirDetalleTurno80mm(slotProps.data.id)" />
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

    <Dialog
      v-model:visible="mostrarImpresionTurnos"
      modal
      header="Imprimir Turnos"
      :style="{ width: '420px' }"
      class="pos-dialog"
    >
      <div class="dialog-body">
        <div class="dialog-field">
          <label class="dialog-label">¿Qué deseas imprimir?</label>
          <div class="flex flex-col gap-2">
            <label class="flex items-center gap-2">
              <RadioButton v-model="modoImpresionTurnos" inputId="opt-historial" value="historial" />
              <span>Historial mostrado (filtro actual)</span>
            </label>
            <label class="flex items-center gap-2">
              <RadioButton v-model="modoImpresionTurnos" inputId="opt-detalle" value="detalle" />
              <span>Detalle de un turno específico</span>
            </label>
          </div>
        </div>
        <div v-if="modoImpresionTurnos === 'detalle'" class="dialog-field">
          <label class="dialog-label">Seleccionar turno</label>
          <Select
            v-model="turnoSeleccionadoId"
            :options="turnosHistorial"
            optionLabel="etiqueta_impresion"
            optionValue="id"
            placeholder="Seleccionar turno"
            class="w-full"
          />
        </div>
      </div>
      <template #footer>
        <Button label="Cancelar" text severity="secondary" @click="mostrarImpresionTurnos = false" />
        <Button label="Imprimir" icon="pi pi-print" @click="confirmarImpresionTurnos" />
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
const mostrarImpresionTurnos = ref(false)
const modoImpresionTurnos = ref<'historial' | 'detalle'>('historial')
const turnoSeleccionadoId = ref<string | null>(null)

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
        usuario_nombre: perfilMap.get(t.id_usuario) || null,
        etiqueta_impresion: `${formatFechaLarga(t.fecha_apertura)} - ${perfilMap.get(t.id_usuario) || t.id_usuario?.substring(0, 8) || 'N/A'}`
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

function abrirDialogoImpresion() {
  modoImpresionTurnos.value = 'historial'
  turnoSeleccionadoId.value = turnosHistorial.value[0]?.id || null
  mostrarImpresionTurnos.value = true
}

async function confirmarImpresionTurnos() {
  if (modoImpresionTurnos.value === 'historial') {
    imprimirHistorial80mm(turnosHistorial.value)
    mostrarImpresionTurnos.value = false
    return
  }

  if (!turnoSeleccionadoId.value) {
    toast.add({ severity: 'warn', summary: 'Selecciona un turno', detail: 'Debes seleccionar un turno para imprimir su detalle.', life: 3000 })
    return
  }

  await imprimirDetalleTurno80mm(turnoSeleccionadoId.value)
  mostrarImpresionTurnos.value = false
}

function abrirVentanaImpresion80mm(title: string, bodyHtml: string) {
  const printWindow = window.open('', '_blank', 'width=380,height=760')
  if (!printWindow) {
    toast.add({ severity: 'warn', summary: 'Popup bloqueado', detail: 'Permite ventanas emergentes para imprimir.', life: 4000 })
    return
  }

  printWindow.document.write(`
    <html>
      <head>
        <title>${title}</title>
        <style>
          @page { size: 80mm auto; margin: 2mm; }
          body { font-family: "Courier New", monospace; width: 76mm; margin: 0 auto; font-size: 12px; color: #111; }
          .title { text-align: center; font-weight: 700; font-size: 15px; margin-top: 6px; }
          .line { border-top: 1px dashed #555; margin: 6px 0; }
          .row { display: flex; justify-content: space-between; gap: 6px; }
          .muted { color: #444; font-size: 11px; }
          .item { padding: 4px 0; border-bottom: 1px dotted #ccc; }
          .item:last-child { border-bottom: 0; }
          .strong { font-weight: 700; }
        </style>
      </head>
      <body>
        ${bodyHtml}
        <script>
          window.onload = () => {
            window.print();
            setTimeout(() => window.close(), 700);
          };
        <\/script>
      </body>
    </html>
  `)
  printWindow.document.close()
}

function imprimirHistorial80mm(turnos: any[]) {
  const rows = turnos.map((t) => `
    <div class="item">
      <div class="strong">${t.usuario_nombre || '-'}</div>
      <div class="muted">${formatFechaLarga(t.apertura_at)}</div>
      <div class="row"><span>Ventas</span><span>${t.ventas_registradas ?? 0}</span></div>
      <div class="row"><span>Inicial</span><span>${formatMonto(t.monto_inicial || 0)}</span></div>
      <div class="row"><span>Cierre</span><span>${t.monto_cierre !== null ? formatMonto(t.monto_cierre) : '—'}</span></div>
    </div>
  `).join('')

  const body = `
    <div class="title">Historial de Turnos</div>
    <div class="muted" style="text-align:center">${new Date().toLocaleString('es-CL')}</div>
    <div class="line"></div>
    ${rows || '<div class="muted">Sin datos para imprimir.</div>'}
    <div class="line"></div>
    <div class="muted">Registros: ${turnos.length}</div>
  `
  abrirVentanaImpresion80mm('Historial de Turnos', body)
}

async function imprimirDetalleTurno80mm(turnoId: string) {
  const turno = turnosHistorial.value.find((t) => t.id === turnoId)
  if (!turno) return

  const { data: ventas, error } = await supabase
    .from('ventas')
    .select('id, fecha, total, metodo_pago')
    .eq('id_turno', turnoId)
    .order('fecha', { ascending: true })

  if (error) {
    toast.add({ severity: 'error', summary: 'Error', detail: error.message, life: 4000 })
    return
  }

  const ventasHtml = (ventas || []).map((v: any) => `
    <div class="item">
      <div class="row"><span>ID</span><span>${String(v.id).substring(0, 8)}</span></div>
      <div class="row"><span>${new Date(v.fecha).toLocaleTimeString('es-CL', { hour: '2-digit', minute: '2-digit' })}</span><span>${formatMonto(v.total)}</span></div>
      <div class="muted">Pago: ${v.metodo_pago}</div>
    </div>
  `).join('')

  const body = `
    <div class="title">Detalle de Turno</div>
    <div class="line"></div>
    <div class="row"><span>Cajero</span><span>${turno.usuario_nombre || '-'}</span></div>
    <div class="row"><span>Apertura</span><span>${formatFechaLarga(turno.apertura_at)}</span></div>
    <div class="row"><span>Cierre</span><span>${turno.cierre_at ? formatFechaLarga(turno.cierre_at) : 'Activo'}</span></div>
    <div class="row"><span>Inicial</span><span>${formatMonto(turno.monto_inicial || 0)}</span></div>
    <div class="row"><span>Cierre</span><span>${turno.monto_cierre !== null ? formatMonto(turno.monto_cierre) : '—'}</span></div>
    <div class="line"></div>
    <div class="strong">Ventas del turno</div>
    ${ventasHtml || '<div class="muted">Sin ventas asociadas.</div>'}
    <div class="line"></div>
    <div class="row strong"><span>Total ventas</span><span>${formatMonto((ventas || []).reduce((acc: number, v: any) => acc + (v.total || 0), 0))}</span></div>
  `

  abrirVentanaImpresion80mm('Detalle de Turno', body)
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

@media (max-width: 768px) {
  .caja-root {
    padding: 0.75rem;
  }

  .caja-header {
    margin-bottom: 0.8rem;
    justify-content: flex-end;
  }

  .caja-header > div {
    display: none;
  }

  .caja-info-grid {
    grid-template-columns: 1fr;
    gap: 0.6rem;
    margin-bottom: 0.85rem;
  }

  .caja-info-card {
    padding: 0.8rem 0.85rem;
  }

  .caja-info-label {
    font-size: 0.72rem;
  }

  .caja-info-value {
    font-size: 1rem;
  }

  .caja-actions {
    flex-direction: column;
    align-items: stretch;
    gap: 0.55rem;
  }

  .caja-actions :deep(.p-button) {
    width: 100%;
  }

  .caja-historial {
    margin-top: 1rem;
    padding-top: 0.8rem;
  }

  .caja-historial-header {
    margin-bottom: 0.65rem;
    gap: 0.55rem;
  }

  .caja-historial-header h2 {
    font-size: 0.95rem;
  }

  .caja-historial-filtros {
    width: 100%;
    gap: 0.45rem;
  }

  :deep(.historial-datepicker) {
    width: 100%;
  }

  :deep(.caja-historial .p-datatable-thead > tr > th),
  :deep(.caja-historial .p-datatable-tbody > tr > td) {
    padding: 0.55rem 0.6rem;
    font-size: 0.78rem;
  }
}
</style>
