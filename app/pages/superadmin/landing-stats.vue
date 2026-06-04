<template>
  <div class="superadmin-page">
    <div class="superadmin-header">
      <div>
        <p class="superadmin-eyebrow">Superadmin</p>
        <h1>Analítica de la Landing</h1>
        <p class="superadmin-copy">
          Visitas, pageviews y clics en los CTAs del sitio público.
        </p>
      </div>
      <Select
        v-model="rangoDias"
        :options="rangos"
        optionLabel="label"
        optionValue="value"
        @change="cargarStats"
        class="rango-select"
      />
    </div>

    <div v-if="error" class="superadmin-error">
      <i class="pi pi-exclamation-triangle" />
      <span>{{ error }}</span>
      <Button label="Reintentar" icon="pi pi-refresh" size="small" @click="cargarStats" />
    </div>

    <!-- KPIs -->
    <div v-if="stats" class="superadmin-kpis">
      <div class="superadmin-kpi kpi-visitas">
        <span>Visitas únicas</span>
        <strong>{{ formatNumero(stats.visitas_unicas) }}</strong>
        <span class="kpi-sub">Visitantes distintos</span>
      </div>
      <div class="superadmin-kpi kpi-pageviews">
        <span>Pageviews</span>
        <strong>{{ formatNumero(stats.pageviews) }}</strong>
        <span class="kpi-sub">Páginas vistas</span>
      </div>
      <div class="superadmin-kpi kpi-clicks">
        <span>Clics en CTAs</span>
        <strong>{{ formatNumero(stats.clicks_cta) }}</strong>
        <span class="kpi-sub">Interacciones registradas</span>
      </div>
      <div class="superadmin-kpi kpi-conversion">
        <span>Tasa de clic</span>
        <strong>{{ formatPorcentaje(stats.tasa_conversion) }}%</strong>
        <span class="kpi-sub">Clics / pageviews</span>
      </div>
    </div>

    <!-- Gráfico de tendencia -->
    <div v-if="stats && stats.por_dia?.length" class="chart-card">
      <div class="chart-card-head">
        <h3>Tendencia diaria</h3>
        <p>Visitas, pageviews y clics a lo largo del período.</p>
      </div>
      <div class="chart-canvas">
        <Chart type="line" :data="chartData" :options="chartOptions" class="h-[320px]" />
      </div>
    </div>

    <div v-else-if="!loading && stats" class="empty-state">
      <i class="pi pi-chart-line" />
      <p>Aún no hay datos suficientes para graficar.</p>
    </div>

    <!-- Tablas inferiores -->
    <div v-if="stats" class="stats-tables">
      <div class="stats-table-card">
        <h3>🏆 Top CTAs</h3>
        <p class="stats-table-sub">Elementos con más clics en el período.</p>
        <DataTable
          :value="(stats.top_ctas || []) as any[]"
          class="p-datatable-sm"
          stripedRows
          :loading="loading"
        >
          <Column field="elemento" header="Elemento" style="min-width: 200px">
            <template #body="{ data }">
              <code class="track-code">{{ data.elemento }}</code>
            </template>
          </Column>
          <Column field="texto" header="Texto">
            <template #body="{ data }">
              <span v-if="data.texto" class="track-text">{{ data.texto }}</span>
              <span v-else class="track-text-empty">—</span>
            </template>
          </Column>
          <Column field="clicks" header="Clics" style="width: 110px">
            <template #body="{ data }">
              <Tag :value="formatNumero(data.clicks)" severity="info" />
            </template>
          </Column>
          <template #empty>
            <p class="text-center text-muted py-4">Sin clics registrados aún.</p>
          </template>
        </DataTable>
      </div>

      <div class="stats-table-card">
        <h3>🌐 Top Referrers</h3>
        <p class="stats-table-sub">De dónde llegan los visitantes.</p>
        <DataTable
          :value="(stats.top_referrers || []) as any[]"
          class="p-datatable-sm"
          stripedRows
          :loading="loading"
        >
          <Column field="referrer" header="Origen" style="min-width: 200px">
            <template #body="{ data }">
              <span class="track-text">{{ data.referrer }}</span>
            </template>
          </Column>
          <Column field="visitas" header="Visitas" style="width: 110px">
            <template #body="{ data }">
              <Tag :value="formatNumero(data.visitas)" severity="secondary" />
            </template>
          </Column>
          <template #empty>
            <p class="text-center text-muted py-4">Sin referrers registrados aún.</p>
          </template>
        </DataTable>
      </div>

      <div v-if="stats.dispositivos?.length" class="stats-table-card stats-table-card--full">
        <h3>📱 Dispositivos</h3>
        <p class="stats-table-sub">Distribución de las visitas por tipo de dispositivo.</p>
        <div class="devices-grid">
          <div
            v-for="d in (stats.dispositivos as any[])"
            :key="d.device_type"
            class="device-chip"
          >
            <span class="device-chip-label">{{ deviceLabel(d.device_type) }}</span>
            <strong class="device-chip-value">{{ formatNumero(d.total) }}</strong>
            <span class="device-chip-percent">{{ devicePercent(d.total, stats.visitas_totales) }}%</span>
          </div>
        </div>
      </div>
    </div>

    <div v-if="loading && !stats" class="loading-overlay">
      <i class="pi pi-spinner pi-spin" style="font-size: 2rem" />
      <p>Cargando analítica…</p>
    </div>
  </div>
</template>

<script setup lang="ts">
import { useToast } from 'primevue/usetoast'
import { useAuthStore } from '~/stores/auth'

interface StatsResponse {
  rango_dias: number
  visitas_unicas: number
  visitas_totales: number
  pageviews: number
  clicks_cta: number
  tasa_conversion: number
  por_dia: Array<{ dia: string; visitas: number; pageviews: number; clicks: number }>
  top_ctas: Array<{ elemento: string; texto: string | null; clicks: number }>
  top_referrers: Array<{ referrer: string; visitas: number }>
  dispositivos: Array<{ device_type: string; total: number }>
}

const supabase = useSupabaseClient()
const authStore = useAuthStore()
const toast = useToast()

const rangos = [
  { label: 'Últimos 7 días', value: 7 },
  { label: 'Últimos 30 días', value: 30 },
  { label: 'Últimos 90 días', value: 90 },
  { label: 'Último año', value: 365 }
]

const rangoDias = ref(30)
const stats = ref<StatsResponse | null>(null)
const loading = ref(false)
const error = ref('')

function formatNumero(n: number | undefined | null): string {
  if (n === undefined || n === null) return '0'
  return new Intl.NumberFormat('es-CL').format(n)
}

function formatPorcentaje(n: number | undefined | null): string {
  if (n === undefined || n === null) return '0,00'
  return new Intl.NumberFormat('es-CL', { minimumFractionDigits: 2, maximumFractionDigits: 2 }).format(n)
}

function deviceLabel(type: string): string {
  const map: Record<string, string> = {
    mobile: 'Móvil',
    desktop: 'Escritorio',
    tablet: 'Tablet',
    desconocido: 'Desconocido'
  }
  return map[type] || type
}

function devicePercent(total: number, visitasTotales: number): string {
  if (!visitasTotales) return '0'
  return formatPorcentaje((total / visitasTotales) * 100)
}

async function getAuthHeaders() {
  const { data } = await supabase.auth.getSession()
  const accessToken = data.session?.access_token
  if (!accessToken) throw new Error('No hay sesión activa')
  return { Authorization: `Bearer ${accessToken}` }
}

async function cargarStats() {
  loading.value = true
  error.value = ''
  try {
    const headers = await getAuthHeaders()
    const data = await $fetch<StatsResponse>(`/api/superadmin/landing-stats?dias=${rangoDias.value}`, {
      headers
    })
    stats.value = data
  } catch (err: any) {
    error.value = err?.data?.statusMessage || err?.message || 'No se pudo cargar la analítica.'
  } finally {
    loading.value = false
  }
}

const chartData = computed(() => {
  const dias = (stats.value?.por_dia || []) as any[]
  const labels = dias.map((d) => new Date(d.dia).toLocaleDateString('es-CL', { day: '2-digit', month: 'short' }))
  return {
    labels,
    datasets: [
      {
        label: 'Visitas únicas',
        data: dias.map((d) => Number(d.visitas) || 0),
        borderColor: '#6366f1',
        backgroundColor: 'rgba(99,102,241,0.12)',
        tension: 0.35,
        fill: true,
        pointRadius: 3
      },
      {
        label: 'Pageviews',
        data: dias.map((d) => Number(d.pageviews) || 0),
        borderColor: '#0ea5e9',
        backgroundColor: 'rgba(14,165,233,0.08)',
        tension: 0.35,
        fill: false,
        pointRadius: 2
      },
      {
        label: 'Clics CTA',
        data: dias.map((d) => Number(d.clicks) || 0),
        borderColor: '#f59e0b',
        backgroundColor: 'rgba(245,158,11,0.08)',
        tension: 0.35,
        fill: false,
        pointRadius: 2
      }
    ]
  }
})

const chartOptions = computed(() => ({
  responsive: true,
  maintainAspectRatio: false,
  plugins: {
    legend: { position: 'top' as const },
    tooltip: { mode: 'index' as const, intersect: false }
  },
  interaction: { mode: 'nearest' as const, intersect: false },
  scales: {
    y: { beginAtZero: true, ticks: { precision: 0 } }
  }
}))

onMounted(async () => {
  if (authStore.rolUsuario !== 'super_admin') {
    await navigateTo('/')
    return
  }
  await cargarStats()
})
</script>

<style scoped>
.superadmin-page {
  display: flex;
  flex-direction: column;
  gap: 1.25rem;
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

.rango-select {
  min-width: 200px;
}

.superadmin-error {
  display: flex;
  align-items: center;
  gap: 0.75rem;
  padding: 0.85rem 1rem;
  border: 1px solid rgba(239,68,68,0.4);
  background: rgba(239,68,68,0.07);
  border-radius: 0.75rem;
  color: #b91c1c;
}

.superadmin-error i {
  font-size: 1.2rem;
}

.superadmin-error span {
  flex: 1;
}

.superadmin-kpis {
  display: grid;
  grid-template-columns: repeat(4, minmax(0, 1fr));
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
  position: relative;
  overflow: hidden;
}

.superadmin-kpi::before {
  content: '';
  position: absolute;
  inset: 0 auto 0 0;
  width: 4px;
  background: var(--color-brand-primary);
}

.kpi-visitas::before { background: #6366f1; }
.kpi-pageviews::before { background: #0ea5e9; }
.kpi-clicks::before { background: #f59e0b; }
.kpi-conversion::before { background: #10b981; }

.superadmin-kpi > span:first-child {
  color: var(--text-muted);
  font-size: 0.82rem;
  text-transform: uppercase;
  letter-spacing: 0.04em;
  font-weight: 600;
}

.superadmin-kpi strong {
  color: var(--text-app);
  font-size: 1.85rem;
  line-height: 1;
  font-weight: 800;
}

.kpi-sub {
  color: var(--text-muted);
  font-size: 0.75rem !important;
  text-transform: none !important;
  letter-spacing: 0 !important;
  font-weight: 400 !important;
}

.chart-card {
  border: 1px solid var(--border-subtle);
  background: var(--bg-surface);
  border-radius: 1rem;
  padding: 1.25rem 1.4rem 1.4rem;
}

.chart-card-head h3 {
  margin: 0 0 0.25rem;
  font-size: 1.05rem;
  color: var(--text-app);
}

.chart-card-head p {
  margin: 0 0 1rem;
  color: var(--text-muted);
  font-size: 0.85rem;
}

.chart-canvas {
  width: 100%;
}

.empty-state {
  border: 1px dashed var(--border-subtle);
  background: var(--bg-surface);
  border-radius: 1rem;
  padding: 2.5rem 1rem;
  text-align: center;
  color: var(--text-muted);
}

.empty-state i {
  font-size: 2.5rem;
  display: block;
  margin-bottom: 0.5rem;
}

.stats-tables {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 1rem;
}

.stats-table-card {
  border: 1px solid var(--border-subtle);
  background: var(--bg-surface);
  border-radius: 1rem;
  padding: 1.1rem 1.2rem 1.3rem;
}

.stats-table-card--full {
  grid-column: 1 / -1;
}

.stats-table-card h3 {
  margin: 0 0 0.25rem;
  font-size: 1rem;
  color: var(--text-app);
}

.stats-table-sub {
  margin: 0 0 0.85rem;
  color: var(--text-muted);
  font-size: 0.82rem;
}

.track-code {
  font-family: 'JetBrains Mono', 'Fira Code', monospace;
  font-size: 0.8rem;
  background: rgba(99,102,241,0.1);
  color: #4f46e5;
  padding: 0.15rem 0.5rem;
  border-radius: 0.35rem;
}

.track-text {
  color: var(--text-app);
  font-size: 0.88rem;
}

.track-text-empty {
  color: var(--text-muted);
}

.devices-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(150px, 1fr));
  gap: 0.75rem;
}

.device-chip {
  border: 1px solid var(--border-subtle);
  border-radius: 0.75rem;
  padding: 0.85rem 1rem;
  display: flex;
  flex-direction: column;
  gap: 0.2rem;
  background: var(--bg-surface);
}

.device-chip-label {
  color: var(--text-muted);
  font-size: 0.78rem;
  text-transform: uppercase;
  letter-spacing: 0.04em;
  font-weight: 600;
}

.device-chip-value {
  color: var(--text-app);
  font-size: 1.4rem;
  font-weight: 800;
}

.device-chip-percent {
  color: var(--color-brand-primary);
  font-size: 0.78rem;
  font-weight: 600;
}

.loading-overlay {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 3rem 1rem;
  color: var(--text-muted);
  gap: 0.5rem;
}

@media (max-width: 900px) {
  .superadmin-kpis {
    grid-template-columns: repeat(2, minmax(0, 1fr));
  }
  .stats-tables {
    grid-template-columns: 1fr;
  }
}

@media (max-width: 600px) {
  .superadmin-kpis {
    grid-template-columns: 1fr;
  }
  .rango-select {
    min-width: 100%;
  }
}
</style>
