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

    <!-- Últimas ventas -->
    <div class="dashboard-section">
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

const supabase = useSupabaseClient<Database>()
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

const fechaHoy = computed(() =>
  new Date().toLocaleDateString('es-CL', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' })
)

onMounted(async () => {
  await cajaStore.fetchTurnoActivo()
  await Promise.all([fetchKPIs(), fetchUltimasVentas()])
})

async function fetchKPIs() {
  try {
    const ahora = new Date()
    const inicioHoy = new Date(ahora.getFullYear(), ahora.getMonth(), ahora.getDate()).toISOString()
    const inicioMes = new Date(ahora.getFullYear(), ahora.getMonth(), 1).toISOString()

    // Ventas de hoy
    const { data: ventasHoy } = await supabase
      .from('ventas')
      .select('total')
      .gte('created_at', inicioHoy)
    kpi.value.cantVentasHoy = ventasHoy?.length ?? 0
    kpi.value.ventasHoy = ventasHoy?.reduce((s, v) => s + (v.total || 0), 0) ?? 0

    // Ventas del mes
    const { data: ventasMes } = await supabase
      .from('ventas')
      .select('total')
      .gte('created_at', inicioMes)
    kpi.value.cantVentasMes = ventasMes?.length ?? 0
    kpi.value.ventasMes = ventasMes?.reduce((s, v) => s + (v.total || 0), 0) ?? 0

    // Productos
    const { count: totalProds } = await supabase.from('productos').select('*', { count: 'exact', head: true })
    kpi.value.totalProductos = totalProds ?? 0

    const { count: lowStock } = await supabase.from('productos').select('*', { count: 'exact', head: true }).lte('stock', 5)
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

async function fetchUltimasVentas() {
  loadingVentas.value = true
  try {
    const { data } = await supabase
      .from('ventas')
      .select('*')
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
  padding: 2rem 2.5rem;
  color: var(--text-app);
}

.dashboard-header {
  margin-bottom: 2rem;
}

.dashboard-header h1 {
  font-size: 2rem;
  font-weight: 800;
  margin: 0;
  letter-spacing: -0.03em;
}

.dashboard-header p {
  color: var(--text-muted);
  margin: 0.25rem 0 0;
  font-size: 0.95rem;
  text-transform: capitalize;
}

/* ─── KPI Grid ─── */
.kpi-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(240px, 1fr));
  gap: 1.25rem;
  margin-bottom: 2rem;
}

.kpi-card {
  display: flex;
  align-items: center;
  gap: 1rem;
  padding: 1.25rem 1.5rem;
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
  margin-bottom: 2rem;
}

.dashboard-section h2 {
  font-size: 1.15rem;
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
  padding: 0.75rem 1rem;
  border: none !important;
}

:deep(.p-datatable-tbody > tr) {
  background: transparent !important;
  color: var(--text-app);
}

:deep(.p-datatable-tbody > tr > td) {
  border-color: var(--border-subtle) !important;
  padding: 0.75rem 1rem;
}

/* ─── NavCard Grid ─── */
.navcard-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(140px, 1fr));
  gap: 0.75rem;
}

.navcard {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 0.5rem;
  padding: 1rem;
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
  font-size: 1.25rem;
  color: var(--color-brand-primary);
}

.navcard-label {
  font-size: 0.8rem;
  font-weight: 600;
  text-align: center;
}
</style>
