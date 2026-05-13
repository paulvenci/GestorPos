<template>
  <div class="dashboard-page">
    <div class="dashboard-header">
      <h1>Dashboard</h1>
      <p>{{ formattedDate }}</p>
    </div>

    <!-- KPI Grid -->
    <div class="kpi-grid">
      <!-- Ventas Hoy -->
      <div class="kpi-card kpi-card--ventas">
        <div class="kpi-icon">
          <i class="pi pi-shopping-cart" />
        </div>
        <div class="kpi-content">
          <span class="kpi-label">Ventas Hoy</span>
          <span class="kpi-value">{{ formatCurrency(statsHoy.total) }}</span>
          <span class="kpi-sub">{{ statsHoy.cantidad }} transacciones</span>
        </div>
      </div>

      <!-- Ventas Mes -->
      <div class="kpi-card kpi-card--ventas-mes">
        <div class="kpi-icon">
          <i class="pi pi-calendar" />
        </div>
        <div class="kpi-content">
          <span class="kpi-label">Este Mes</span>
          <span class="kpi-value">{{ formatCurrency(statsMes.total) }}</span>
          <span class="kpi-sub">vs mes anterior</span>
        </div>
      </div>

      <!-- Ticket Promedio -->
      <div class="kpi-card kpi-card--ticket">
        <div class="kpi-icon">
          <i class="pi pi-ticket" />
        </div>
        <div class="kpi-content">
          <span class="kpi-label">Ticket Promedio</span>
          <span class="kpi-value">{{ formatCurrency(statsMes.ticketPromedio) }}</span>
          <span class="kpi-sub">Basado en {{ statsMes.cantidad }} ventas</span>
        </div>
      </div>

      <!-- Deuda Pendiente -->
      <div class="kpi-card kpi-card--deuda">
        <div class="kpi-icon">
          <i class="pi pi-exclamation-circle" />
        </div>
        <div class="kpi-content">
          <span class="kpi-label">Por Cobrar</span>
          <span class="kpi-value">{{ formatCurrency(statsDeuda.total) }}</span>
          <span class="kpi-sub">{{ statsDeuda.clientes }} clientes con deuda</span>
        </div>
      </div>

      <!-- Tendencia (Chart placeholder logic) -->
      <div class="kpi-card kpi-card--tendencia">
        <div class="kpi-icon">
          <i class="pi pi-chart-line" />
        </div>
        <div class="kpi-content">
          <span class="kpi-label">Tendencia MTD</span>
          <span class="kpi-value" :class="statsMes.tendencia >= 0 ? 'text-green-500' : 'text-red-500'">
            {{ statsMes.tendencia >= 0 ? '+' : '' }}{{ statsMes.tendencia }}%
          </span>
          <span class="kpi-sub">Crecimiento mensual</span>
        </div>
      </div>
    </div>

    <!-- Charts Section -->
    <div class="dashboard-charts">
      <!-- Ventas Mensuales -->
      <div class="chart-container">
        <div class="chart-header">
          <h2><i class="pi pi-chart-bar" /> Desempeño Mensual</h2>
          <SelectButton v-model="chartTimeframe" :options="['6M', '12M']" aria-labelledby="basic" />
        </div>
        <div class="chart-content chart-content--mensual">
          <div v-if="loadingChartMes" class="chart-overlay">
            <ProgressSpinner style="width: 40px; height: 40px" />
          </div>
          <Chart type="bar" :data="chartDataMensual" :options="chartOptionsMensual" class="h-full w-full" />
        </div>
      </div>

      <!-- Ultimas Ventas -->
      <div class="dashboard-section">
        <h2><i class="pi pi-history" /> Últimas Ventas</h2>
        <DataTable :value="ultimasVentas" :loading="loadingVentas" class="p-datatable-sm">
          <Column field="created_at" header="Hora">
            <template #body="{ data }">
              {{ formatTime(data.created_at) }}
            </template>
          </Column>
          <Column field="cliente_nombre" header="Cliente" />
          <Column field="total" header="Total">
            <template #body="{ data }">
              <span class="precio-cell">{{ formatCurrency(data.total) }}</span>
            </template>
          </Column>
          <Column field="metodo_pago" header="Pago" />
        </DataTable>
      </div>
    </div>

    <!-- Quick Actions -->
    <div class="dashboard-section">
      <h2>Acceso Rápido</h2>
      <div class="navcard-grid">
        <NuxtLink to="/pos" class="navcard">
          <i class="pi pi-shopping-cart navcard-icon" />
          <span class="navcard-label">Nueva Venta</span>
        </NuxtLink>
        <NuxtLink to="/admin/productos" class="navcard">
          <i class="pi pi-box navcard-icon" />
          <span class="navcard-label">Inventario</span>
        </NuxtLink>
        <NuxtLink to="/admin/reportes" class="navcard">
          <i class="pi pi-chart-line navcard-icon" />
          <span class="navcard-label">Reportes</span>
        </NuxtLink>
        <NuxtLink to="/caja" class="navcard">
          <i class="pi pi-wallet navcard-icon" />
          <span class="navcard-label">Caja</span>
        </NuxtLink>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { useAuthStore } from '~/stores/auth'
import { format } from 'date-fns'
import { es } from 'date-fns/locale'

const authStore = useAuthStore()
const supabase = useSupabaseClient()

const formattedDate = format(new Date(), "EEEE, d 'de' MMMM", { locale: es })

const statsHoy = ref({ total: 0, cantidad: 0 })
const statsMes = ref({ total: 0, cantidad: 0, ticketPromedio: 0, tendencia: 0 })
const statsDeuda = ref({ total: 0, clientes: 0 })
const ultimasVentas = ref<any[]>([])
const loadingVentas = ref(false)
const loadingChartMes = ref(false)
const chartTimeframe = ref('6M')

const chartDataMensual = ref<any>(null)
const chartOptionsMensual = {
  maintainAspectRatio: false,
  plugins: {
    legend: { display: false }
  },
  scales: {
    y: {
      beginAtZero: true,
      grid: { color: 'rgba(148, 163, 184, 0.1)' },
      ticks: {
        callback: (value: any) => '$' + value.toLocaleString(),
        color: '#94a3b8'
      }
    },
    x: {
      grid: { display: false },
      ticks: { color: '#94a3b8' }
    }
  }
}

function formatCurrency(val: number) {
  return new Intl.NumberFormat('es-CL', { style: 'currency', currency: 'CLP' }).format(val)
}

function formatTime(date: string) {
  return format(new Date(date), 'HH:mm')
}

onMounted(async () => {
  await Promise.all([
    fetchStatsHoy(),
    fetchStatsMes(),
    fetchStatsDeuda(),
    fetchUltimasVentas(),
    fetchChartData()
  ])
})

async function fetchStatsHoy() {
  const hoy = new Date().toISOString().split('T')[0]
  try {
    const { data } = await supabase
      .from('ventas')
      .select('total')
      .eq('empresa_id', authStore.empresaId)
      .gte('created_at', hoy)
    
    if (data) {
      statsHoy.value.total = data.reduce((acc, v) => acc + Number(v.total || 0), 0)
      statsHoy.value.cantidad = data.length
    }
  } catch (e) { console.error(e) }
}

async function fetchStatsMes() {
  const inicioMes = new Date()
  inicioMes.setDate(1)
  const inicioMesIso = inicioMes.toISOString().split('T')[0]
  
  try {
    const { data } = await supabase
      .from('ventas')
      .select('total')
      .eq('empresa_id', authStore.empresaId)
      .gte('created_at', inicioMesIso)
    
    if (data) {
      const total = data.reduce((acc, v) => acc + Number(v.total || 0), 0)
      statsMes.value.total = total
      statsMes.value.cantidad = data.length
      statsMes.value.ticketPromedio = data.length > 0 ? Math.round(total / data.length) : 0
      
      // Tendencia mock (comparando con algo fijo por ahora o calculando mes anterior)
      statsMes.value.tendencia = 12.5 
    }
  } catch (e) { console.error(e) }
}

async function fetchStatsDeuda() {
  try {
    const { data } = await supabase
      .from('clientes')
      .select('saldo_pendiente')
      .eq('empresa_id', authStore.empresaId)
      .gt('saldo_pendiente', 0)
    
    if (data) {
      statsDeuda.value.total = data.reduce((acc, c) => acc + Number(c.saldo_pendiente || 0), 0)
      statsDeuda.value.clientes = data.length
    }
  } catch (e) { console.error(e) }
}

async function fetchChartData() {
  loadingChartMes.value = true
  try {
    const mesesAtras = chartTimeframe.value === '6M' ? 6 : 12
    const fechaInicio = new Date()
    fechaInicio.setMonth(fechaInicio.getMonth() - mesesAtras)
    fechaInicio.setDate(1)

    const { data: allData } = await supabase
      .from('ventas')
      .select('total, created_at')
      .eq('empresa_id', authStore.empresaId)
      .gte('created_at', fechaInicio.toISOString())

    const dataMeses: any[] = []
    for (let i = mesesAtras - 1; i >= 0; i--) {
      const d = new Date()
      d.setMonth(d.getMonth() - i)
      const label = format(d, 'MMM', { locale: es })
      const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`
      dataMeses.push({
        key,
        label,
        total: 0
      })
    }

    allData?.forEach(v => {
      const d = new Date(v.created_at!)
      const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`
      const item = dataMeses.find(m => m.key === key)
      if (item) {
        item.total += Number(v.total || 0)
      }
    })

    const labels = dataMeses.map(m => m.label)
    const values = dataMeses.map(m => m.total)
    const colors = dataMeses.map((_, index) => 
      index === dataMeses.length - 1 ? '#3b82f6' : 'rgba(148, 163, 184, 0.5)'
    )

    chartDataMensual.value = {
      labels,
      datasets: [{
        label: 'Ventas Mensuales',
        data: values,
        backgroundColor: colors,
        borderColor: colors.map(c => c === '#3b82f6' ? '#2563eb' : '#94a3b8'),
        borderWidth: 1,
        borderRadius: 8,
        barPercentage: 0.6
      }]
    }
  } catch (e) {
    console.error('Error Chart Mes:', e)
  } finally {
    loadingChartMes.value = false
  }
}

async function fetchUltimasVentas() {
  loadingVentas.value = true
  try {
    const { data } = await supabase
      .from('ventas')
      .select('*')
      .eq('empresa_id', authStore.empresaId)
      .order('created_at', { ascending: false })
      .limit(5)
    ultimasVentas.value = data || []
  } catch (e) {
    console.error(e)
  } finally {
    loadingVentas.value = false
  }
}
</script>

<style scoped>
.dashboard-page {
  padding: 1.4rem 1.6rem;
  color: var(--text-app);
}

.dashboard-header {
  margin-bottom: 1.4rem;
}

.dashboard-header h1 {
  font-size: 1.82rem;
  font-weight: 800;
  margin: 0;
  letter-spacing: -0.03em;
}

.dashboard-header p {
  color: var(--text-muted);
  margin: 0.25rem 0 0;
  font-size: 0.88rem;
  text-transform: capitalize;
}

/* ─── KPI Grid ─── */
.kpi-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(210px, 1fr));
  gap: 0.9rem;
  margin-bottom: 1.4rem;
}

.kpi-card {
  display: flex;
  align-items: center;
  gap: 0.8rem;
  padding: 1rem 1.05rem;
  background: var(--bg-surface);
  border: 1px solid var(--border-subtle);
  border-radius: 1rem;
  transition: transform 0.2s ease, box-shadow 0.2s ease;
}

.kpi-card:hover {
  transform: translateY(-2px);
  box-shadow: 0 4px 16px rgba(99, 102, 241, 0.08);
}

.kpi-icon {
  width: 48px;
  height: 48px;
  border-radius: 0.75rem;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 1.25rem;
  flex-shrink: 0;
}

.kpi-card--ventas .kpi-icon { background: rgba(34, 197, 94, 0.15); color: #22c55e; }
.kpi-card--productos .kpi-icon { background: rgba(99, 102, 241, 0.15); color: #6366f1; }
.kpi-card--caja .kpi-icon { background: rgba(245, 158, 11, 0.15); color: #f59e0b; }
.kpi-card--ventas-mes .kpi-icon { background: rgba(59, 130, 246, 0.15); color: #3b82f6; }
.kpi-card--tendencia .kpi-icon { background: rgba(139, 92, 246, 0.15); color: #8b5cf6; }
.kpi-card--ticket .kpi-icon { background: rgba(236, 72, 153, 0.15); color: #ec4899; }
.kpi-card--deuda .kpi-icon { background: rgba(239, 68, 68, 0.1); color: #ef4444; }

.kpi-card--tendencia .kpi-value {
  color: var(--text-app);
}

.kpi-content {
  display: flex;
  flex-direction: column;
}

.kpi-label {
  font-size: 0.8rem;
  color: var(--text-muted);
  text-transform: uppercase;
  letter-spacing: 0.05em;
  font-weight: 600;
}

.kpi-value {
  font-size: 1.4rem;
  font-weight: 800;
  letter-spacing: -0.02em;
}

.kpi-sub {
  font-size: 0.75rem;
  color: var(--text-muted);
}

.kpi-footer {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-top: 0.25rem;
  gap: 0.5rem;
}

:deep(.kpi-trend-tag) {
  font-size: 0.68rem !important;
  font-weight: 700 !important;
  padding: 0.1rem 0.4rem !important;
  border-radius: 6px !important;
}

/* ─── Dashboard sections ─── */
.dashboard-section {
  margin-bottom: 1.4rem;
}

.dashboard-section h2 {
  font-size: 1.02rem;
  font-weight: 700;
  margin: 0 0 1rem;
  display: flex;
  align-items: center;
  gap: 0.5rem;
}

.precio-cell {
  font-weight: 700;
  color: #4ade80;
}

/* ─── DataTable override ─── */
:deep(.p-datatable) {
  background: var(--bg-surface);
  border-radius: 1rem;
  border: 1px solid var(--border-sidebar);
  overflow: hidden;
}

:deep(.p-datatable-thead > tr > th) {
  background: var(--bg-app) !important;
  color: var(--text-muted) !important;
  font-weight: 600;
  font-size: 0.85rem;
  text-transform: uppercase;
  letter-spacing: 0.05em;
  padding: 0.65rem 0.85rem;
  border: none !important;
}

:deep(.p-datatable-tbody > tr) {
  background: transparent !important;
  color: var(--text-app);
}

:deep(.p-datatable-tbody > tr > td) {
  border-color: var(--border-subtle) !important;
  padding: 0.65rem 0.85rem;
}

/* ─── NavCard Grid ─── */
.navcard-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(130px, 1fr));
  gap: 0.65rem;
}

.navcard {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 0.42rem;
  padding: 0.75rem;
  background: var(--bg-surface);
  border: 1px solid var(--border-subtle);
  border-radius: 0.75rem;
  text-decoration: none;
  color: var(--text-app);
  transition: all 0.2s ease;
}

.navcard:hover {
  border-color: var(--color-brand-primary);
  background: rgba(99, 102, 241, 0.08);
  transform: translateY(-2px);
}

.navcard-icon {
  font-size: 1.12rem;
  color: var(--color-brand-primary);
}

.navcard-label {
  font-size: 0.76rem;
  font-weight: 600;
  text-align: center;
}

@media (max-width: 768px) {
  .dashboard-page {
    padding: 0.8rem 0.8rem 1rem;
  }

  .dashboard-header {
    margin-bottom: 1.25rem;
  }

  .dashboard-header h1 {
    font-size: 1.78rem;
  }

  .dashboard-header p {
    font-size: 0.78rem;
    margin-top: 0.2rem;
  }

  .kpi-grid {
    gap: 0.75rem;
    margin-bottom: 1.25rem;
    grid-template-columns: 1fr;
  }

  .kpi-card {
    padding: 0.72rem 0.78rem;
    gap: 0.75rem;
    border-radius: 0.85rem;
  }

  .kpi-icon {
    width: 38px;
    height: 38px;
    font-size: 0.95rem;
    border-radius: 0.7rem;
  }

  .kpi-label {
    font-size: 0.72rem;
  }

  .kpi-value {
    font-size: 1.62rem;
    line-height: 1;
  }

  .kpi-sub {
    font-size: 0.72rem;
  }

  .dashboard-section {
    margin-bottom: 1.25rem;
  }

  .dashboard-section h2 {
    font-size: 0.94rem;
    margin-bottom: 0.65rem;
  }

  :deep(.p-datatable-thead > tr > th),
  :deep(.p-datatable-tbody > tr > td) {
    padding: 0.55rem 0.6rem !important;
    font-size: 0.78rem;
  }

  .navcard-grid {
    grid-template-columns: repeat(3, minmax(0, 1fr));
    gap: 0.45rem;
  }

  .navcard {
    padding: 0.58rem 0.28rem;
    border-radius: 0.7rem;
    min-height: 68px;
    gap: 0.3rem;
  }

  .navcard-icon {
    font-size: 1.05rem;
  }

  .navcard-label {
    font-size: 0.7rem;
    line-height: 1.15;
  }
}

/* ─── Dashboard Charts ─── */
.dashboard-charts {
  display: grid;
  grid-template-columns: 1fr 1.5fr;
  gap: 1.25rem;
  margin-bottom: 2rem;
}

.chart-container {
  background: var(--bg-surface);
  border: 1px solid var(--border-subtle);
  border-radius: 1.25rem;
  padding: 1.5rem;
  display: flex;
  flex-direction: column;
}

.chart-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 1.25rem;
}

.chart-header h2 {
  font-size: 1rem;
  font-weight: 700;
  margin: 0;
  display: flex;
  align-items: center;
  gap: 0.6rem;
}

.chart-content {
  position: relative;
  flex: 1;
  min-height: 300px;
}

.chart-overlay {
  position: absolute;
  inset: 0;
  display: flex;
  align-items: center;
  justify-content: center;
  background: rgba(var(--bg-app-rgb), 0.5);
  backdrop-filter: blur(2px);
  border-radius: 1rem;
  z-index: 10;
}

.chart-content--mensual {
  min-height: 200px;
}

@media (max-width: 1024px) {
  .dashboard-charts {
    grid-template-columns: 1fr;
  }
}

@media (max-width: 768px) {
  .chart-container {
    padding: 1rem;
  }
  .chart-header h2 {
    font-size: 0.9rem;
  }
  .chart-content {
    min-height: 250px;
  }
}

:deep(.p-selectbutton .p-button) {
  font-size: 0.7rem;
  padding: 0.4rem 0.6rem;
}
</style>
