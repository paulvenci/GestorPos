<template>
  <div class="admin-page">
    <div class="admin-header">
      <div class="admin-header-titles">
        <h1>Centro de Reportes</h1>
        <p>Visualiza el rendimiento y auditoría de tu negocio.</p>
      </div>
    </div>

    <!-- Navegación por Pestañas -->
    <Tabs value="0">
      <TabList>
        <Tab value="0"><i class="pi pi-clock text-indigo-500 mr-2"></i>Turnos de Caja</Tab>
        <Tab value="1"><i class="pi pi-receipt text-emerald-500 mr-2"></i>Ventas de Hoy</Tab>
        <Tab value="2"><i class="pi pi-chart-bar text-amber-500 mr-2"></i>Rotación y Top 10</Tab>
        <Tab value="3"><i class="pi pi-dollar text-primary mr-2"></i>Rentabilidad</Tab>
        <Tab value="4"><i class="pi pi-calendar text-cyan-500 mr-2"></i>Historial de Ventas</Tab>
      </TabList>

      <TabPanels class="pt-6 px-0 pb-0">
        <!-- =======================
             TAB 0: TURNOS
        ======================== -->
        <TabPanel value="0">
          <div class="flex justify-end gap-2 mb-4">
            <Button icon="pi pi-print" label="Imprimir" @click="imprimirTurnos" size="small" variant="outlined" severity="secondary" />
            <Button icon="pi pi-refresh" label="Actualizar" @click="fetchTurnos" :loading="loadingTurnos" size="small" variant="outlined" />
          </div>
          <DataTable
            :value="turnos"
            :loading="loadingTurnos"
            paginator
            :rows="10"
            responsiveLayout="scroll"
            class="p-datatable-sm modern-table"
            sortField="fecha_apertura"
            :sortOrder="-1"
          >
            <Column field="fecha_apertura" header="Apertura" sortable>
              <template #body="slotProps">
                {{ formatDate(slotProps.data.fecha_apertura) }}
              </template>
            </Column>
            <Column field="fecha_cierre" header="Cierre" sortable>
              <template #body="slotProps">
                {{ formatDate(slotProps.data.fecha_cierre) }}
              </template>
            </Column>
            <Column field="usuario" header="Cajero">
              <template #body="slotProps">
                <span class="text-sm font-medium">
                  {{ perfiles[slotProps.data.id_usuario]?.nombre || 'Usuario ID: ' + slotProps.data.id_usuario?.substring(0,6) }}
                </span>
              </template>
            </Column>
            <Column field="monto_inicial" header="Fondo Inicial">
              <template #body="slotProps">
                <span style="color: var(--text-muted)">{{ formatMonto(slotProps.data.monto_inicial) }}</span>
              </template>
            </Column>
            <Column field="monto_declarado" header="Monto Declarado">
              <template #body="slotProps">
                <span v-if="slotProps.data.monto_declarado !== null" class="font-bold text-emerald-500">{{ formatMonto(slotProps.data.monto_declarado) }}</span>
                <span v-else class="text-slate-400">—</span>
              </template>
            </Column>
            <Column field="diferencia" header="Diferencia">
              <template #body="slotProps">
                <span :class="getDiferenciaColor(slotProps.data.monto_declarado, 0, slotProps.data.monto_inicial)">
                  {{ formatDiferencia(slotProps.data.monto_declarado, 0, slotProps.data.monto_inicial) }}
                </span>
              </template>
            </Column>
            <Column field="estado" header="Estado" sortable>
              <template #body="slotProps">
                <Tag :value="slotProps.data.estado.toUpperCase()" :severity="slotProps.data.estado === 'abierto' ? 'success' : 'secondary'" />
              </template>
            </Column>
            <template #empty>
              <div class="empty-state">No hay turnos registrados en el sistema.</div>
            </template>
          </DataTable>
        </TabPanel>

        <!-- =======================
             TAB 1: VENTAS DE HOY
        ======================== -->
        <TabPanel value="1">
          <div class="flex justify-between items-center mb-4">
            <h2 class="text-lg font-bold">Ventas de Hoy</h2>
            <div class="flex gap-2">
              <Button icon="pi pi-print" label="Imprimir" @click="imprimirVentasHoy" size="small" variant="outlined" severity="secondary" />
              <Button icon="pi pi-refresh" label="Actualizar" @click="fetchVentasHoy" :loading="loadingVentasHoy" size="small" variant="outlined" />
            </div>
          </div>
          <DataTable
            :value="ventasHoy"
            v-model:expandedRows="expandedRows"
            dataKey="id"
            :loading="loadingVentasHoy"
            paginator
            :rows="10"
            responsiveLayout="scroll"
            class="p-datatable-sm modern-table"
            sortField="fecha"
            :sortOrder="-1"
          >
            <Column expander style="width: 3rem" />
            <Column field="id" header="ID Boleta">
              <template #body="slotProps">
                <span class="text-xs font-mono text-slate-500">{{ slotProps.data.id.substring(0, 8) }}</span>
              </template>
            </Column>
            <Column field="fecha" header="Hora" sortable>
              <template #body="slotProps">
                {{ formatHora(slotProps.data.fecha) }}
              </template>
            </Column>
            <Column field="cajero" header="Cajero">
              <template #body="slotProps">
                <span class="text-sm font-medium">
                  {{ perfiles[slotProps.data.turnos_caja?.id_usuario]?.nombre || '...' }}
                </span>
              </template>
            </Column>
            <Column field="metodo_pago" header="Medio de Pago" sortable>
              <template #body="slotProps">
                <div class="flex items-center gap-2">
                  <i :class="getMetodoIcon(slotProps.data.metodo_pago)" class="text-indigo-500"></i>
                  <span class="capitalize text-sm">{{ slotProps.data.metodo_pago }}</span>
                </div>
              </template>
            </Column>
            <Column field="total" header="Total" sortable>
              <template #body="slotProps">
                <span class="font-bold text-emerald-500">{{ formatMonto(slotProps.data.total) }}</span>
              </template>
            </Column>

            <!-- Expansión del Detalle de la Venta (Tailwind Nativo Forzado Claro) -->
            <template #expansion="slotProps">
              <div class="px-6 py-5 !bg-indigo-50/50 ml-4 lg:ml-12 border-l-2 !border-indigo-300 rounded-r-lg shadow-sm">
                <h5 class="mb-4 text-xs font-bold !text-indigo-800 uppercase tracking-widest flex items-center">
                  <i class="pi pi-shopping-bag mr-2"></i> Detalle de Artículos
                </h5>
                <div class="overflow-x-auto">
                  <table class="w-full text-left border-collapse">
                    <thead>
                      <tr class="text-xs uppercase !text-indigo-900 border-b !border-indigo-100">
                        <th class="py-3 px-4 font-semibold">Producto</th>
                        <th class="py-3 px-4 font-semibold w-24 text-center">Cant.</th>
                        <th class="py-3 px-4 font-semibold w-32 text-right">Precio Unit.</th>
                        <th class="py-3 px-4 font-semibold w-32 text-right">Subtotal</th>
                      </tr>
                    </thead>
                    <tbody class="divide-y !divide-indigo-100/50">
                      <tr v-for="item in slotProps.data.detalle_ventas" :key="item.id_producto" class="hover:bg-white transition-colors">
                        <td class="py-3 px-4 text-sm font-medium !text-slate-800">{{ item.productos?.nombre || '...' }}</td>
                        <td class="py-3 px-4 text-sm text-center">
                          <Tag :value="item.cantidad" class="!bg-indigo-100 !text-indigo-800 !text-xs font-bold" rounded />
                        </td>
                        <td class="py-3 px-4 text-sm text-right !text-slate-600">{{ formatMonto(item.precio_unitario) }}</td>
                        <td class="py-3 px-4 text-sm text-right font-bold !text-emerald-600">{{ formatMonto(item.subtotal) }}</td>
                      </tr>
                    </tbody>
                  </table>
                </div>
              </div>
            </template>

            <template #empty>
              <div class="empty-state">No se han registrado ventas el día de hoy.</div>
            </template>
          </DataTable>
        </TabPanel>

        <!-- =======================
             TAB 2: ROTACIÓN Y TOP 10
        ======================== -->
        <TabPanel value="2">
          <div class="flex justify-end gap-2 mb-4">
             <Button icon="pi pi-print" label="Imprimir" @click="imprimirRotacion" size="small" variant="outlined" severity="secondary" />
             <Button icon="pi pi-refresh" label="Actualizar" @click="fetchRotacion" :loading="loadingRotacion" size="small" variant="outlined" />
          </div>
          <div class="grid grid-cols-1 lg:grid-cols-2 gap-6">
            
            <!-- Top 10 Chart Visual -->
            <div class="metric-card col-span-1 border border-surface p-6 rounded-xl bg-surface">
              <h3 class="text-lg font-bold mb-6 flex items-center"><i class="pi pi-trophy text-amber-500 mr-2"></i> Top 10 Vendidos (30 d)</h3>
              
              <div v-if="loadingRotacion" class="flex flex-col gap-4">
                 <Skeleton height="2rem" borderRadius="16px" v-for="i in 5" :key="i"/>
              </div>
              <div v-else-if="topProductos.length === 0" class="empty-state">No hay suficientes datos de venta.</div>
              <div v-else class="flex flex-col gap-4">
                <div v-for="(prod, index) in topProductos" :key="prod.producto_id" class="w-full">
                  <div class="flex justify-between text-sm mb-1">
                    <span class="font-medium truncate pr-2">{{ index + 1 }}. {{ prod.nombre }}</span>
                    <span class="font-bold text-indigo-500">{{ prod.total_cantidad }} un.</span>
                  </div>
                  <div class="w-full bg-slate-100 dark:bg-slate-800 rounded-full h-2.5 overflow-hidden">
                    <div class="bg-indigo-500 h-2.5 rounded-full" :style="{ width: getPercentage(prod.total_cantidad, topProductos[0].total_cantidad) + '%' }"></div>
                  </div>
                </div>
              </div>
            </div>

            <!-- Stock Muerto (Sin Rotación) -->
            <div class="metric-card col-span-1 border border-surface p-0 rounded-xl bg-surface overflow-hidden flex flex-col">
              <div class="p-6 border-b border-surface">
                <h3 class="text-lg font-bold flex items-center"><i class="pi pi-exclamation-triangle text-red-500 mr-2"></i> Productos sin Rotación (30 d)</h3>
                <p class="text-xs text-muted mt-1">Productos con stock que no han tenido ventas recientes.</p>
              </div>
              <DataTable
                :value="productosSinRotacion"
                :loading="loadingRotacion"
                paginator
                :rows="5"
                class="p-datatable-sm modern-table"
                sortField="stock"
                :sortOrder="-1"
              >
                <Column field="nombre" header="Producto" />
                <Column field="stock" header="Stock Actual" sortable>
                  <template #body="slotProps">
                    <Tag :value="slotProps.data.stock" severity="warn" />
                  </template>
                </Column>
                <Column field="precio" header="Precio">
                  <template #body="slotProps">
                    <span class="text-muted">{{ formatMonto(slotProps.data.precio) }}</span>
                  </template>
                </Column>
                <template #empty>
                  <div class="empty-state text-sm py-4">Excelente. Todo tu stock está rotando.</div>
                </template>
              </DataTable>
            </div>
          </div>
        </TabPanel>

        <!-- =======================
             TAB 3: RENTABILIDAD
        ======================== -->
        <TabPanel value="3">
          <div class="flex justify-between items-center mb-6">
            <div>
              <h2 class="text-lg font-bold">Resumen de Rentabilidad</h2>
              <p class="text-sm text-muted">Beneficio bruto calculado de los últimos 30 días.</p>
            </div>
            <div class="flex gap-2">
              <Button icon="pi pi-print" label="Imprimir" @click="imprimirRentabilidad" size="small" variant="outlined" severity="secondary" />
              <Button icon="pi pi-refresh" label="Actualizar" @click="fetchRentabilidad" :loading="loadingRentabilidad" size="small" variant="outlined" />
            </div>
          </div>

          <div v-if="loadingRentabilidad" class="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
            <Skeleton height="8rem" borderRadius="16px" v-for="i in 3" :key="i"/>
          </div>

          <div v-else class="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
            <!-- Ingresos -->
            <div class="metric-card bg-surface rounded-xl p-6 border-l-4 border-emerald-500 shadow-sm relative overflow-hidden">
              <div class="absolute -right-4 -bottom-4 opacity-5"><i class="pi pi-arrow-up-right text-8xl"></i></div>
              <h4 class="text-slate-500 text-sm font-medium uppercase tracking-wider mb-2">Ingresos Totales</h4>
              <div class="text-3xl font-black text-emerald-500">{{ formatMonto(rentabilidad.total_ventas || 0) }}</div>
            </div>
            
            <!-- Costos -->
            <div class="metric-card bg-surface rounded-xl p-6 border-l-4 border-red-500 shadow-sm relative overflow-hidden">
              <div class="absolute -right-4 -bottom-4 opacity-5"><i class="pi pi-arrow-down-right text-8xl"></i></div>
              <h4 class="text-slate-500 text-sm font-medium uppercase tracking-wider mb-2">Costo de Ventas</h4>
              <div class="text-3xl font-black text-red-500">{{ formatMonto(rentabilidad.total_costos || 0) }}</div>
            </div>
            
            <!-- Ganancia Limpia -->
            <div class="metric-card bg-indigo-50 dark:bg-indigo-900/20 rounded-xl p-6 border-l-4 border-indigo-500 shadow-sm relative overflow-hidden">
              <div class="absolute -right-4 -bottom-4 opacity-10"><i class="pi pi-wallet text-8xl text-indigo-500"></i></div>
              <div class="flex justify-between items-start">
                <h4 class="text-indigo-600 dark:text-indigo-400 text-sm font-medium uppercase tracking-wider mb-2">Ganancia Bruta</h4>
                <Tag :value="'+' + (rentabilidad.margen_porcentaje || 0) + '%'" severity="info" />
              </div>
              <div class="text-3xl font-black text-indigo-600 dark:text-indigo-400">{{ formatMonto(rentabilidad.utilidad_bruta || 0) }}</div>
            </div>
          </div>
          
          <Message severity="info" icon="pi pi-lightbulb">Existen muchos factores en la rentabilidad de tu negocio, sin embargo este cálculo rápido te otorga una visión global aproximada utilizando los precios de costo declarados sobre los productos vendidos.</Message>

        </TabPanel>

        <!-- =======================
             TAB 4: HISTORIAL DE VENTAS
        ======================== -->
        <TabPanel value="4">
          <div class="flex flex-wrap justify-between items-end gap-3 mb-4">
            <div class="flex flex-wrap gap-2 items-end">
              <div>
                <label class="text-xs text-muted">Desde</label>
                <DatePicker v-model="fechaDesde" showIcon date-format="dd/mm/yy" class="w-44" />
              </div>
              <div>
                <label class="text-xs text-muted">Hasta</label>
                <DatePicker v-model="fechaHasta" showIcon date-format="dd/mm/yy" class="w-44" />
              </div>
              <Button icon="pi pi-search" label="Buscar" @click="fetchHistorialVentas" :loading="loadingHistorialVentas" size="small" />
            </div>
            <Button icon="pi pi-print" label="Imprimir" @click="imprimirHistorialVentas" size="small" variant="outlined" severity="secondary" />
          </div>

          <DataTable
            :value="historialVentas"
            :loading="loadingHistorialVentas"
            paginator
            :rows="15"
            responsiveLayout="scroll"
            class="p-datatable-sm modern-table"
            sortField="fecha"
            :sortOrder="-1"
          >
            <Column field="fecha" header="Fecha" sortable>
              <template #body="slotProps">
                {{ formatDate(slotProps.data.fecha) }}
              </template>
            </Column>
            <Column field="id" header="Boleta">
              <template #body="slotProps">
                <span class="text-xs font-mono text-slate-500">{{ slotProps.data.id.substring(0, 8) }}</span>
              </template>
            </Column>
            <Column field="metodo_pago" header="Pago">
              <template #body="slotProps">
                <span class="capitalize">{{ slotProps.data.metodo_pago }}</span>
              </template>
            </Column>
            <Column field="total" header="Total" sortable>
              <template #body="slotProps">
                <span class="font-bold text-emerald-500">{{ formatMonto(slotProps.data.total) }}</span>
              </template>
            </Column>
          </DataTable>
        </TabPanel>
      </TabPanels>
    </Tabs>
  </div>
</template>

<script setup lang="ts">
import { useToast } from 'primevue/usetoast'
import { useFormatMonto } from '~/composables/useFormatMonto'
import type { Database } from '~/types/database.types'

const supabase = useSupabaseClient<Database>()
const toast = useToast()
const { formatMonto, formatFecha } = useFormatMonto()

// Data
const perfiles = ref<Record<string, any>>({})

// Tab 0
const turnos = ref<any[]>([])
const loadingTurnos = ref(false)

// Tab 1
const ventasHoy = ref<any[]>([])
const loadingVentasHoy = ref(false)
const expandedRows = ref({})

// Tab 2
const topProductos = ref<any[]>([])
const productosSinRotacion = ref<any[]>([])
const loadingRotacion = ref(false)

// Tab 3
const rentabilidad = ref<any>({})
const loadingRentabilidad = ref(false)
const historialVentas = ref<any[]>([])
const loadingHistorialVentas = ref(false)
const fechaDesde = ref<Date | null>(new Date(new Date().setDate(new Date().getDate() - 7)))
const fechaHasta = ref<Date | null>(new Date())

onMounted(() => {
  // Carga inicial solo del primer tab para optimizar
  fetchTurnos()
  // Asíncronas para el resto de datos
  fetchVentasHoy()
  fetchRotacion()
  fetchRentabilidad()
  fetchHistorialVentas()
})

// === MÉTODOS DE CONSULTA ===

async function fetchTurnos() {
  loadingTurnos.value = true
  try {
    const [{ data, error }, { data: perfilesData }] = await Promise.all([
      supabase.from('turnos_caja').select('*').order('fecha_apertura', { ascending: false }).limit(30),
      supabase.from('perfiles').select('*')
    ])

    if (error) throw error
    
    if (perfilesData) {
      perfilesData.forEach((p: any) => {
        perfiles.value[p.id] = p
      })
    }
    
    turnos.value = data || []
  } catch (error: any) {
    toast.add({ severity: 'error', summary: 'Error Turnos', detail: error.message, life: 3000 })
  } finally {
    loadingTurnos.value = false
  }
}

async function fetchVentasHoy() {
  loadingVentasHoy.value = true
  try {
    // Obtenemos inicio del día de hoy en ISO
    const hoy = new Date()
    hoy.setHours(0, 0, 0, 0)
    const inicioDia = hoy.toISOString()

    const { data, error } = await supabase
      .from('ventas')
      .select('id, fecha, total, subtotal, metodo_pago, id_turno, turnos_caja(id_usuario), detalle_ventas(cantidad, precio_unitario, subtotal, productos(nombre))')
      .gte('fecha', inicioDia)
      .order('fecha', { ascending: false })

    if (error) throw error
    ventasHoy.value = data || []
  } catch (error: any) {
    toast.add({ severity: 'error', summary: 'Error Ventas', detail: error.message, life: 3000 })
  } finally {
    loadingVentasHoy.value = false
  }
}

async function fetchRotacion() {
  loadingRotacion.value = true
  try {
    const [{ data: top, error: err1 }, { data: sinRot, error: err2 }] = await Promise.all([
      supabase.rpc('get_top_productos', { dias_historial: 30 }),
      supabase.rpc('get_productos_sin_rotacion', { dias_historial: 30 })
    ])
    
    if (err1) throw err1
    if (err2) throw err2

    topProductos.value = top || []
    productosSinRotacion.value = sinRot || []
  } catch (error: any) {
    toast.add({ severity: 'error', summary: 'Error Rotación', detail: error.message, life: 3000 })
  } finally {
    loadingRotacion.value = false
  }
}

async function fetchRentabilidad() {
  loadingRentabilidad.value = true
  try {
    const { data, error } = await supabase.rpc('get_rentabilidad', { dias_historial: 30 })
    if (error) throw error
    
    // Retorna una fila única
    rentabilidad.value = data && data.length > 0 ? data[0] : {}
  } catch (error: any) {
    toast.add({ severity: 'error', summary: 'Error Rentabilidad', detail: error.message, life: 3000 })
  } finally {
    loadingRentabilidad.value = false
  }
}

async function fetchHistorialVentas() {
  loadingHistorialVentas.value = true
  try {
    const inicio = fechaDesde.value ? new Date(fechaDesde.value.getFullYear(), fechaDesde.value.getMonth(), fechaDesde.value.getDate()) : new Date(new Date().setDate(new Date().getDate() - 7))
    const fin = fechaHasta.value ? new Date(fechaHasta.value.getFullYear(), fechaHasta.value.getMonth(), fechaHasta.value.getDate() + 1) : new Date()

    const { data, error } = await supabase
      .from('ventas')
      .select('id, fecha, total, metodo_pago, subtotal')
      .gte('fecha', inicio.toISOString())
      .lt('fecha', fin.toISOString())
      .order('fecha', { ascending: false })

    if (error) throw error
    historialVentas.value = data || []
  } catch (error: any) {
    toast.add({ severity: 'error', summary: 'Error Historial', detail: error.message, life: 3000 })
  } finally {
    loadingHistorialVentas.value = false
  }
}

// === UTILS ===

function formatDate(dateStr: string) {
  if (!dateStr) return '-'
  return formatFecha(dateStr)
}

function formatHora(dateStr: string) {
  if (!dateStr) return '-'
  return new Date(dateStr).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
}

function formatDiferencia(declarado: number | null, ventas: number | null, inicial: number | null) {
  if (declarado === null || declarado === undefined) return '-'
  const esperado = (inicial || 0) + (ventas || 0)
  const diff = (declarado || 0) - esperado
  if (isNaN(diff)) return '-'
  const sign = diff >= 0 ? '+' : ''
  return `${sign}${formatMonto(diff)}`
}

function getDiferenciaColor(declarado: number | null, ventas: number | null, inicial: number | null) {
  if (declarado === null || declarado === undefined) return 'text-slate-400'
  const esperado = (inicial || 0) + (ventas || 0)
  const diff = (declarado || 0) - esperado
  if (isNaN(diff)) return 'text-slate-400'
  if (diff === 0) return 'text-emerald-500 font-bold'
  if (diff < 0) return 'text-red-500 font-bold'
  return 'text-amber-500 font-bold'
}

function getMetodoIcon(metodo: string) {
  const icons: Record<string, string> = {
    efectivo: 'pi pi-money-bill',
    tarjeta: 'pi pi-credit-card',
    transferencia: 'pi pi-mobile',
    mixto: 'pi pi-percentage'
  }
  return icons[metodo] || 'pi pi-wallet'
}

function getPercentage(value: number, max: number) {
  if (!max || max === 0) return 0
  return Math.round((value / max) * 100)
}

function abrirVentanaReporte(title: string, bodyHtml: string) {
  const printWindow = window.open('', '_blank', 'width=980,height=760')
  if (!printWindow) return
  printWindow.document.write(`
    <html>
      <head>
        <title>${title}</title>
        <style>
          body { font-family: Arial, sans-serif; padding: 18px; color: #111827; }
          h1 { font-size: 18px; margin: 0 0 12px; }
          h2 { font-size: 14px; margin: 16px 0 8px; }
          table { width: 100%; border-collapse: collapse; margin-top: 6px; }
          th, td { border: 1px solid #e5e7eb; padding: 6px; font-size: 12px; text-align: left; }
          th { background: #f3f4f6; }
          .meta { color: #4b5563; font-size: 12px; margin-bottom: 8px; }
          .row { display: flex; justify-content: space-between; margin: 4px 0; }
        </style>
      </head>
      <body>
        <h1>${title}</h1>
        <div class="meta">Generado: ${new Date().toLocaleString('es-CL')}</div>
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

function imprimirTurnos() {
  const rows = turnos.value.map((t: any) => `
    <tr>
      <td>${formatDate(t.fecha_apertura)}</td>
      <td>${formatDate(t.fecha_cierre)}</td>
      <td>${perfiles.value[t.id_usuario]?.nombre || t.id_usuario?.substring(0, 6) || '-'}</td>
      <td>${formatMonto(t.monto_inicial || 0)}</td>
      <td>${t.monto_declarado !== null ? formatMonto(t.monto_declarado) : '—'}</td>
      <td>${t.estado}</td>
    </tr>
  `).join('')
  abrirVentanaReporte('Reporte de Turnos', `<table><thead><tr><th>Apertura</th><th>Cierre</th><th>Cajero</th><th>Inicial</th><th>Declarado</th><th>Estado</th></tr></thead><tbody>${rows}</tbody></table>`)
}

function imprimirVentasHoy() {
  const rows = ventasHoy.value.map((v: any) => `
    <tr>
      <td>${v.id.substring(0, 8)}</td>
      <td>${formatDate(v.fecha)}</td>
      <td>${v.metodo_pago}</td>
      <td>${formatMonto(v.total)}</td>
    </tr>
  `).join('')
  abrirVentanaReporte('Ventas de Hoy', `<table><thead><tr><th>Boleta</th><th>Fecha</th><th>Pago</th><th>Total</th></tr></thead><tbody>${rows}</tbody></table>`)
}

function imprimirRotacion() {
  const topRows = topProductos.value.map((p: any) => `<tr><td>${p.nombre}</td><td>${p.total_cantidad}</td><td>${formatMonto(p.total_ingreso || 0)}</td></tr>`).join('')
  const sinRows = productosSinRotacion.value.map((p: any) => `<tr><td>${p.nombre}</td><td>${p.stock}</td><td>${formatMonto(p.precio || 0)}</td></tr>`).join('')
  abrirVentanaReporte(
    'Rotación y Top Productos',
    `<h2>Top 10 Vendidos</h2><table><thead><tr><th>Producto</th><th>Cantidad</th><th>Ingreso</th></tr></thead><tbody>${topRows}</tbody></table>
     <h2>Sin Rotación</h2><table><thead><tr><th>Producto</th><th>Stock</th><th>Precio</th></tr></thead><tbody>${sinRows}</tbody></table>`
  )
}

function imprimirRentabilidad() {
  abrirVentanaReporte(
    'Rentabilidad',
    `<div class="row"><strong>Ingresos Totales</strong><span>${formatMonto(rentabilidad.value.total_ventas || 0)}</span></div>
     <div class="row"><strong>Costo de Ventas</strong><span>${formatMonto(rentabilidad.value.total_costos || 0)}</span></div>
     <div class="row"><strong>Ganancia Bruta</strong><span>${formatMonto(rentabilidad.value.utilidad_bruta || 0)}</span></div>
     <div class="row"><strong>Margen</strong><span>${rentabilidad.value.margen_porcentaje || 0}%</span></div>`
  )
}

function imprimirHistorialVentas() {
  const rows = historialVentas.value.map((v: any) => `
    <tr>
      <td>${formatDate(v.fecha)}</td>
      <td>${v.id.substring(0, 8)}</td>
      <td>${v.metodo_pago}</td>
      <td>${formatMonto(v.total)}</td>
    </tr>
  `).join('')

  abrirVentanaReporte(
    'Historial de Ventas',
    `<div class="meta">Rango: ${fechaDesde.value ? fechaDesde.value.toLocaleDateString('es-CL') : '-'} a ${fechaHasta.value ? fechaHasta.value.toLocaleDateString('es-CL') : '-'}</div>
     <table><thead><tr><th>Fecha</th><th>Boleta</th><th>Pago</th><th>Total</th></tr></thead><tbody>${rows}</tbody></table>`
  )
}
</script>

<style scoped>
.admin-page {
  padding: 2.5rem;
  color: var(--text-app);
}

.admin-header {
  margin-bottom: 2rem;
}

.admin-header-titles h1 {
  font-size: 2rem;
  font-weight: 700;
  margin: 0 0 0.5rem;
  color: var(--text-app);
  letter-spacing: -0.03em;
}

.admin-header-titles p {
  color: var(--text-muted);
  margin: 0;
  font-size: 0.95rem;
}

/* Modifiers for deep datatables */
:deep(.modern-table) {
  background: var(--bg-surface);
  border-radius: 1rem;
  border: 1px solid var(--border-sidebar);
  overflow: hidden;
}

:deep(.modern-table .p-datatable-header) {
  background: transparent;
  border-bottom: 1px solid var(--border-subtle);
}

:deep(.modern-table .p-datatable-thead > tr > th) {
  background: var(--bg-app) !important;
  color: var(--text-muted) !important;
  font-weight: 600;
  font-size: 0.85rem;
  text-transform: uppercase;
  letter-spacing: 0.05em;
  padding: 1rem;
  border: none !important;
}

:deep(.modern-table .p-datatable-tbody > tr) {
  background: transparent !important;
  color: var(--text-app);
  transition: background 0.2s ease;
}

:deep(.modern-table .p-datatable-tbody > tr:hover) {
  background: rgba(99, 102, 241, 0.05) !important;
}

:deep(.modern-table .p-datatable-tbody > tr > td) {
  border-color: var(--border-subtle) !important;
  padding: 1rem;
}

:deep(.modern-table .p-paginator) {
  background: transparent !important;
  border-top: 1px solid var(--border-subtle) !important;
}

.empty-state {
  padding: 2rem;
  text-align: center;
  color: var(--text-muted);
  font-style: italic;
}
</style>
