<template>
  <div class="dashboard-page">
    <div class="dashboard-header">
      <div>
        <h1>Dashboard</h1>
        <p>Resumen general del negocio — {{ fechaHoy }}</p>
      </div>
    </div>

    <!-- KPI Cards -->
    <div class="kpi-grid">
      <div class="kpi-card kpi-card--ventas">
        <div class="kpi-icon"><i class="pi pi-shopping-cart" /></div>
        <div class="kpi-content">
          <span class="kpi-label">Ventas Hoy</span>
          <span class="kpi-value">{{ formatMonto(kpi.ventasHoy) }}</span>
          <span class="kpi-sub">{{ kpi.cantVentasHoy }} transacciones</span>
        </div>
      </div>
      <div class="kpi-card kpi-card--productos">
        <div class="kpi-icon"><i class="pi pi-box" /></div>
        <div class="kpi-content">
          <span class="kpi-label">Productos</span>
          <span class="kpi-value">{{ kpi.totalProductos }}</span>
          <span class="kpi-sub">{{ kpi.productosLowStock }} bajo stock</span>
        </div>
      </div>
      <div class="kpi-card kpi-card--caja">
        <div class="kpi-icon"><i class="pi pi-wallet" /></div>
        <div class="kpi-content">
          <span class="kpi-label">Turno Activo</span>
          <span class="kpi-value">{{ kpi.turnoActivo ? 'Abierto' : 'Cerrado' }}</span>
          <span class="kpi-sub">{{ kpi.turnoActivo ? `Desde ${kpi.turnoHora}` : 'Sin turno' }}</span>
        </div>
      </div>
      <div class="kpi-card kpi-card--ventas-mes">
        <div class="kpi-icon"><i class="pi pi-chart-line" /></div>
        <div class="kpi-content">
          <span class="kpi-label">Ventas del Mes</span>
          <span class="kpi-value">{{ formatMonto(kpi.ventasMes) }}</span>
          <span class="kpi-sub">{{ kpi.cantVentasMes }} ventas</span>
        </div>
      </div>
    </div>

    <!-- Gráficos de Análisis -->
    <div class="dashboard-charts">
      <div class="chart-container chart-container--pie">
        <div class="chart-header">
          <h2><i class="pi pi-chart-pie" /> Ventas por Categoría</h2>
          <div class="flex gap-2">
            <Button size="small" label="30 Días" :severity="filtroCategoria === '30d' ? 'primary' : 'secondary'" :text="filtroCategoria !== '30d'" @click="filtroCategoria = '30d'; fetchVentasPorCategoria()" />
            <Button size="small" label="Mes Actual" :severity="filtroCategoria === 'mes' ? 'primary' : 'secondary'" :text="filtroCategoria !== 'mes'" @click="filtroCategoria = 'mes'; fetchVentasPorCategoria()" />
          </div>
        </div>
        <div class="chart-content">
          <Chart type="pie" :data="chartDataCategoria" :options="chartOptionsPie" class="h-[300px]" />
          <div v-if="loadingChartCat" class="chart-overlay"><i class="pi pi-spinner pi-spin" /></div>
          <div v-if="!loadingChartCat && (!chartDataCategoria.labels || chartDataCategoria.labels.length === 0)" class="chart-overlay text-sm text-slate-400">Sin datos</div>
        </div>
      </div>

      <div class="chart-container chart-container--bar">
        <div class="chart-header">
          <h2><i class="pi pi-chart-bar" /> Rendimiento Diario</h2>
          <div class="flex gap-2">
            <Button size="small" label="7 Días" :severity="filtroDiario === '7d' ? 'primary' : 'secondary'" :text="filtroDiario !== '7d'" @click="filtroDiario = '7d'; fetchVentasPorDia()" />
            <Button size="small" label="Este Mes" :severity="filtroDiario === 'mes' ? 'primary' : 'secondary'" :text="filtroDiario !== 'mes'" @click="filtroDiario = 'mes'; fetchVentasPorDia()" />
          </div>
        </div>
        <div class="chart-content">
          <Chart type="bar" :data="chartDataDiario" :options="chartOptionsBar" class="h-[300px]" />
          <div v-if="loadingChartDia" class="chart-overlay"><i class="pi pi-spinner pi-spin" /></div>
          <div v-if="!loadingChartDia && (!chartDataDiario.labels || chartDataDiario.labels.length === 0)" class="chart-overlay text-sm text-slate-400">Sin datos</div>
        </div>
      </div>
    </div>

    <!-- Últimas ventas -->
    <div class="dashboard-section mt-4">
      <h2><i class="pi pi-history" /> Últimas ventas</h2>
      <DataTable :value="ultimasVentas" :loading="loadingVentas" class="p-datatable-sm" :rows="5" responsiveLayout="scroll">
        <Column header="Fecha">
          <template #body="slotProps">
            <span class="text-sm" style="color: var(--text-muted)">{{ formatFecha(slotProps.data.created_at) }}</span>
          </template>
        </Column>
        <Column field="total" header="Total">
          <template #body="slotProps">
            <span class="precio-cell">{{ formatMonto(slotProps.data.total) }}</span>
          </template>
        </Column>
        <Column field="metodo_pago" header="Método" />
        <Column header="Turno">
          <template #body="slotProps">
            <Tag :value="slotProps.data.id_turno ? 'En turno' : 'Fuera'" :severity="slotProps.data.id_turno ? 'success' : 'warn'" />
          </template>
        </Column>
        <template #empty>
          <div class="p-4 text-center" style="color: var(--text-muted)">No hay ventas registradas aún.</div>
        </template>
      </DataTable>
    </div>

    <!-- Accesos rápidos (tarjetas compactas) -->
    <div class="dashboard-section">
      <h2><i class="pi pi-th-large" /> Acceso Rápido</h2>
      <div class="navcard-grid">
        <NuxtLink to="/pos" class="navcard">
          <i class="pi pi-shopping-cart navcard-icon" />
          <span class="navcard-label">Punto de Venta</span>
        </NuxtLink>
        <NuxtLink to="/caja" class="navcard">
          <i class="pi pi-wallet navcard-icon" />
          <span class="navcard-label">Caja</span>
        </NuxtLink>
        <NuxtLink to="/admin/productos" class="navcard">
          <i class="pi pi-box navcard-icon" />
          <span class="navcard-label">Inventario</span>
        </NuxtLink>
        <NuxtLink to="/admin/ajuste-stock" class="navcard">
          <i class="pi pi-sync navcard-icon" />
          <span class="navcard-label">Ajuste Stock</span>
        </NuxtLink>
        <NuxtLink to="/admin/categorias" class="navcard">
          <i class="pi pi-tags navcard-icon" />
          <span class="navcard-label">Categorías</span>
        </NuxtLink>
        <NuxtLink to="/admin/reportes" class="navcard">
          <i class="pi pi-chart-bar navcard-icon" />
          <span class="navcard-label">Reportes</span>
        </NuxtLink>
        <NuxtLink to="/admin/configuracion" class="navcard">
          <i class="pi pi-cog navcard-icon" />
          <span class="navcard-label">Configuración</span>
        </NuxtLink>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { useFormatMonto } from '~/composables/useFormatMonto'
import { useCajaStore } from '~/stores/caja'
import type { Database } from '~/types/database.types'

import { useAuthStore } from '~/stores/auth'

const supabase = useSupabaseClient<Database>()
const authStore = useAuthStore()
const cajaStore = useCajaStore()
const { formatMonto, formatFecha } = useFormatMonto()

const loadingVentas = ref(false)
const ultimasVentas = ref<any[]>([])

const kpi = ref({
  ventasHoy: 0,
  cantVentasHoy: 0,
  ventasMes: 0,
  cantVentasMes: 0,
  totalProductos: 0,
  productosLowStock: 0,
  turnoActivo: false,
  turnoHora: ''
})

// Gráficos
const loadingChartCat = ref(false)
const loadingChartDia = ref(false)
const filtroCategoria = ref('30d')
const filtroDiario = ref('7d')

const opcionesFiltro = [
  { label: '30 Días', value: '30d' },
  { label: 'Mes Actual', value: 'mes' }
]

const opcionesFiltroDiario = [
  { label: '7 Días', value: '7d' },
  { label: 'Este Mes', value: 'mes' }
]

const chartDataCategoria = ref<any>({ labels: [], datasets: [] })
const chartDataDiario = ref<any>({ labels: [], datasets: [] })

const vibrantPalette = [
  '#6366f1', '#10b981', '#f59e0b', '#ef4444', 
  '#3b82f6', '#8b5cf6', '#ec4899', '#06b6d4',
  '#f97316', '#14b8a6', '#4f46e5', '#d946ef'
]

const chartOptionsPie = ref({
  plugins: {
    legend: {
      position: 'right',
      labels: {
        usePointStyle: true,
        font: { size: 11 },
        color: '#64748b'
      }
    },
    tooltip: {
      callbacks: {
        label: (context: any) => ` ${context.label}: ${formatMonto(context.raw)}`
      }
    }
  },
  maintainAspectRatio: false,
  responsive: true
})

const chartOptionsBar = ref({
  plugins: {
    legend: { display: false },
    tooltip: {
      callbacks: {
        label: (context: any) => ` Total: ${formatMonto(context.raw)}`
      }
    }
  },
  scales: {
    y: {
      beginAtZero: true,
      grid: { color: 'rgba(0,0,0,0.05)' },
      ticks: {
        font: { size: 10 },
        callback: (value: any) => formatMonto(value).substring(0, 10)
      }
    },
    x: {
      grid: { display: false },
      ticks: { font: { size: 10 } }
    }
  },
  maintainAspectRatio: false,
  responsive: true
})

const fechaHoy = computed(() =>
  new Date().toLocaleDateString('es-CL', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' })
)

onMounted(async () => {
  await cajaStore.fetchTurnoActivo()
  await Promise.all([
    fetchKPIs(), 
    fetchUltimasVentas(),
    fetchVentasPorCategoria(),
    fetchVentasPorDia()
  ])
})

async function fetchKPIs() {
  try {
    const ahora = new Date()
    const inicioHoy = new Date(ahora.getFullYear(), ahora.getMonth(), ahora.getDate()).toISOString()
    const inicioMes = new Date(ahora.getFullYear(), ahora.getMonth(), 1).toISOString()

    // Helper para paginar consultas de ventas
    async function fetchAllVentas(desde: string) {
      const PAGE_SIZE = 1000
      let all: { total: number }[] = []
      let from = 0
      let hasMore = true
      while (hasMore) {
        const { data, error } = await supabase
          .from('ventas')
          .select('total')
          .eq('empresa_id', authStore.empresaId)
          .or('estado.is.null,estado.neq.cancelada')
          .gte('created_at', desde)
          .range(from, from + PAGE_SIZE - 1)
        if (error) throw error
        all = all.concat(data || [])
        hasMore = (data?.length ?? 0) === PAGE_SIZE
        from += PAGE_SIZE
      }
      return all
    }

    // Ventas de hoy
    const ventasHoy = await fetchAllVentas(inicioHoy)
    kpi.value.cantVentasHoy = ventasHoy.length
    kpi.value.ventasHoy = ventasHoy.reduce((s, v) => s + (v.total || 0), 0)

    // Ventas del mes
    const ventasMes = await fetchAllVentas(inicioMes)
    kpi.value.cantVentasMes = ventasMes.length
    kpi.value.ventasMes = ventasMes.reduce((s, v) => s + (v.total || 0), 0)

    // Productos
    const { count: totalProds } = await supabase.from('productos')
      .select('*', { count: 'exact', head: true })
      .eq('empresa_id', authStore.empresaId)
    kpi.value.totalProductos = totalProds ?? 0

    const { count: lowStock } = await supabase.from('productos')
      .select('*', { count: 'exact', head: true })
      .eq('empresa_id', authStore.empresaId)
      .lte('stock', 5)
    kpi.value.productosLowStock = lowStock ?? 0

    // Turno activo
    kpi.value.turnoActivo = !!cajaStore.turnoActivo
    if (cajaStore.turnoActivo) {
      kpi.value.turnoHora = new Date(cajaStore.turnoActivo.fecha_apertura).toLocaleTimeString('es-CL', { hour: '2-digit', minute: '2-digit' })
    }
  } catch (e) {
    console.error('Error KPIs:', e)
  }
}

async function fetchVentasPorCategoria() {
  loadingChartCat.value = true
  try {
    const ahora = new Date()
    let inicio = new Date(ahora.setDate(ahora.getDate() - 30))
    if (filtroCategoria.value === 'mes') {
      const hoy = new Date()
      inicio = new Date(hoy.getFullYear(), hoy.getMonth(), 1)
    }

    const PAGE_SIZE = 1000
    let allData: any[] = []
    let from = 0
    let hasMore = true

    while (hasMore) {
      const { data, error } = await supabase
        .from('detalle_ventas')
        .select(`
          subtotal,
          productos:id_producto (categoria),
          ventas!inner (created_at, estado)
        `)
        .eq('empresa_id', authStore.empresaId)
        .gte('ventas.created_at', inicio.toISOString())
        .order('id', { ascending: true }) // Using id for stable pagination
        .range(from, from + PAGE_SIZE - 1)

      if (error) throw error

      allData = allData.concat(data || [])
      hasMore = (data?.length ?? 0) === PAGE_SIZE
      from += PAGE_SIZE
    }

    const agrupado: Record<string, number> = {}
    allData.forEach((dv: any) => {
      // Filtrar ventas canceladas aquí para asegurar soporte de NULLs en DB
      if (dv.ventas?.estado === 'cancelada') return

      // Formatear categoría capitalizada para evitar duplicados como "bebidas" y "Bebidas"
      let catNombre = dv.productos?.categoria?.trim() || 'Sin Categoría'
      if (catNombre !== 'Sin Categoría') {
        catNombre = catNombre.charAt(0).toUpperCase() + catNombre.slice(1).toLowerCase()
      }

      agrupado[catNombre] = (agrupado[catNombre] || 0) + (dv.subtotal || 0)
    })

    // Ordenar de mayor a menor subtotal (para que el gráfico se vea consistente)
    const sortedEntries = Object.entries(agrupado).sort((a, b) => b[1] - a[1])
    const labels = sortedEntries.map(e => e[0])
    const values = sortedEntries.map(e => e[1])

    chartDataCategoria.value = {
      labels,
      datasets: [{
        data: values,
        backgroundColor: vibrantPalette,
        hoverOffset: 12,
        borderRadius: 4
      }]
    }
  } catch (e) {
    console.error('Error Chart Cat:', e)
  } finally {
    loadingChartCat.value = false
  }
}

async function fetchVentasPorDia() {
  loadingChartDia.value = true
  try {
    const ahora = new Date()
    // Normalizamos el fin del rango a hoy a las 23:59:59
    const finRango = new Date(ahora.getFullYear(), ahora.getMonth(), ahora.getDate(), 23, 59, 59)
    
    let inicio = new Date()
    if (filtroDiario.value === '7d') {
      // Últimos 7 días (incluyendo hoy)
      inicio = new Date(ahora.getFullYear(), ahora.getMonth(), ahora.getDate() - 6, 0, 0, 0)
    } else {
      // Mes actual completo
      inicio = new Date(ahora.getFullYear(), ahora.getMonth(), 1, 0, 0, 0)
    }

    // Paginar para superar el límite de 1000 filas del servidor
    const PAGE_SIZE = 1000
    let allData: { created_at: string | null; total: number }[] = []
    let from = 0
    let hasMore = true

    while (hasMore) {
      const { data, error } = await supabase
        .from('ventas')
        .select('created_at, total')
        .eq('empresa_id', authStore.empresaId)
        .or('estado.is.null,estado.neq.cancelada')
        .gte('created_at', inicio.toISOString())
        .lte('created_at', finRango.toISOString())
        .order('created_at', { ascending: true })
        .range(from, from + PAGE_SIZE - 1)

      if (error) throw error

      allData = allData.concat(data || [])
      hasMore = (data?.length ?? 0) === PAGE_SIZE
      from += PAGE_SIZE
    }

    // 1. Generar el mapa de fechas vacío para asegurar continuidad (usando fecha local)
    const agrupado: Record<string, number> = {}
    const etiquetas: string[] = []
    
    let iterador = new Date(inicio)
    while (iterador <= finRango) {
      // Key local robusta: "YYYY-MM-DD"
      const y = iterador.getFullYear()
      const m = String(iterador.getMonth() + 1).padStart(2, '0')
      const d = String(iterador.getDate()).padStart(2, '0')
      const key = `${y}-${m}-${d}`
      
      const label = iterador.toLocaleDateString('es-CL', { day: '2-digit', month: 'short' }).replace('.', '')
      agrupado[key] = 0
      etiquetas.push(label)
      iterador.setDate(iterador.getDate() + 1)
    }

    // 2. Llenar con datos reales
    allData.forEach(v => {
      const d = new Date(v.created_at!)
      const y = d.getFullYear()
      const m = String(d.getMonth() + 1).padStart(2, '0')
      const day = String(d.getDate()).padStart(2, '0')
      const key = `${y}-${m}-${day}`
      
      if (agrupado[key] !== undefined) {
        agrupado[key] += Number(v.total || 0)
      }
    })

    chartDataDiario.value = {
      labels: etiquetas,
      datasets: [{
        label: 'Ventas',
        data: Object.values(agrupado),
        backgroundColor: 'rgba(99, 102, 241, 0.8)',
        borderColor: '#6366f1',
        borderWidth: 1,
        borderRadius: 6,
        barPercentage: 0.6
      }]
    }
  } catch (e) {
    console.error('Error Chart Dia:', e)
  } finally {
    loadingChartDia.value = false
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
  margin-top: 0.1rem;
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
