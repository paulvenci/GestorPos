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
        <Tab value="1"><i class="pi pi-receipt text-emerald-500 mr-2"></i>Ventas del Día</Tab>
        <Tab value="2"><i class="pi pi-chart-bar text-amber-500 mr-2"></i>Rotación y Top 10</Tab>
        <Tab value="3"><i class="pi pi-dollar text-primary mr-2"></i>Rentabilidad</Tab>
        <Tab value="4"><i class="pi pi-calendar text-cyan-500 mr-2"></i>Historial de Ventas</Tab>
        <Tab value="5"><i class="pi pi-users text-purple-500 mr-2"></i>Reporte Consolidado</Tab>
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
          <div class="flex flex-wrap justify-between items-center gap-3 mb-4">
            <div class="flex flex-wrap items-end gap-3">
              <div>
                <h2 class="text-lg font-bold">Ventas del Día</h2>
                <p class="text-sm text-muted">Selecciona un día y un cajero.</p>
              </div>
              <div class="w-48 max-w-full">
                <label class="text-xs text-muted">Fecha del Reporte</label>
                <DatePicker 
                  v-model="fechaFiltroReporte" 
                  dateFormat="dd/mm/yy" 
                  class="w-full"
                  :maxDate="new Date()"
                  @update:modelValue="fetchVentasHoy"
                />
              </div>
              <div class="w-72 max-w-full">
                <label class="text-xs text-muted">Cajero</label>
                <Select
                  v-model="filtroCajeroHoy"
                  :options="opcionesCajeroHoy"
                  optionLabel="label"
                  optionValue="value"
                  placeholder="Todos los cajeros"
                  class="w-full"
                />
              </div>
            </div>
            <div class="flex gap-2">
              <Button icon="pi pi-print" label="Imprimir" @click="imprimirVentasHoy" size="small" variant="outlined" severity="secondary" />
              <Button icon="pi pi-refresh" label="Actualizar" @click="fetchVentasHoy" :loading="loadingVentasHoy" size="small" variant="outlined" />
            </div>
          </div>
          <DataTable
            :value="ventasHoyFiltradas"
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
                  {{ perfiles[slotProps.data.id_usuario || slotProps.data.turnos_caja?.id_usuario]?.nombre || '...' }}
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
            <Column field="estado" header="Estado" sortable>
              <template #body="slotProps">
                <Tag
                  :value="slotProps.data.estado === 'cancelada' ? 'CANCELADA' : 'COMPLETADA'"
                  :severity="slotProps.data.estado === 'cancelada' ? 'danger' : 'success'"
                  :icon="slotProps.data.estado === 'cancelada' ? 'pi pi-ban' : 'pi pi-check'"
                />
              </template>
            </Column>
            <Column field="total" header="Total" sortable>
              <template #body="slotProps">
                <span :class="slotProps.data.estado === 'cancelada' ? 'line-through text-slate-400' : 'font-bold text-emerald-500'">
                  {{ formatMonto(slotProps.data.total) }}
                </span>
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

                <!-- Desglose de pago (siempre visible, especialmente útil en mixto) -->
                <div class="mt-4 border-t border-indigo-200 pt-3">
                  <h6 class="text-xs font-bold text-indigo-700 uppercase mb-2">Desglose de Pago</h6>
                  <div class="flex flex-wrap gap-3 text-sm">
                    <template v-if="slotProps.data.pago_efectivo > 0 || slotProps.data.pago_tarjeta > 0 || slotProps.data.pago_transferencia > 0">
                      <div v-if="slotProps.data.pago_efectivo > 0" class="flex items-center gap-1 text-slate-700">
                        <i class="pi pi-money-bill text-emerald-500"></i>
                        <span>Efectivo:</span>
                        <span class="font-bold">{{ formatMonto(slotProps.data.pago_efectivo) }}</span>
                      </div>
                      <div v-if="slotProps.data.pago_tarjeta > 0" class="flex items-center gap-1 text-slate-700">
                        <i class="pi pi-credit-card text-indigo-500"></i>
                        <span>Tarjeta:</span>
                        <span class="font-bold">{{ formatMonto(slotProps.data.pago_tarjeta) }}</span>
                      </div>
                      <div v-if="slotProps.data.pago_transferencia > 0" class="flex items-center gap-1 text-slate-700">
                        <i class="pi pi-mobile text-cyan-500"></i>
                        <span>Transferencia:</span>
                        <span class="font-bold">{{ formatMonto(slotProps.data.pago_transferencia) }}</span>
                      </div>
                    </template>
                    <!-- Fallback para ventas anteriores a la migración -->
                    <template v-else>
                      <div v-if="slotProps.data.metodo_pago === 'efectivo'" class="flex items-center gap-1 text-slate-700">
                        <i class="pi pi-money-bill text-emerald-500"></i>
                        <span>Efectivo:</span>
                        <span class="font-bold">{{ formatMonto(slotProps.data.total) }}</span>
                      </div>
                      <div v-else-if="slotProps.data.metodo_pago === 'tarjeta'" class="flex items-center gap-1 text-slate-700">
                        <i class="pi pi-credit-card text-indigo-500"></i>
                        <span>Tarjeta:</span>
                        <span class="font-bold">{{ formatMonto(slotProps.data.total) }}</span>
                      </div>
                      <div v-else-if="slotProps.data.metodo_pago === 'transferencia'" class="flex items-center gap-1 text-slate-700">
                        <i class="pi pi-mobile text-cyan-500"></i>
                        <span>Transferencia:</span>
                        <span class="font-bold">{{ formatMonto(slotProps.data.total) }}</span>
                      </div>
                      <div v-else class="flex items-center gap-1 text-slate-700">
                        <i class="pi pi-wallet text-amber-500"></i>
                        <span class="capitalize">{{ slotProps.data.metodo_pago }}:</span>
                        <span class="font-bold">{{ formatMonto(slotProps.data.total) }}</span>
                      </div>
                      <span class="text-slate-400 text-xs italic">(desglose no disponible en ventas anteriores)</span>
                    </template>
                  </div>
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

        <!-- =======================
             TAB 5: REPORTE CONSOLIDADO
        ======================== -->
        <TabPanel value="5">
          <div class="flex flex-wrap justify-between items-center gap-3 mb-4">
            <div class="flex flex-wrap items-end gap-3">
              <div>
                <h2 class="text-lg font-bold">Reporte Consolidado Diario</h2>
                <p class="text-sm text-muted">Muestra el desglose por cajero del día seleccionado.</p>
              </div>
              <div class="w-48 max-w-full">
                <label class="text-xs text-muted">Fecha del Reporte</label>
                <DatePicker 
                  v-model="fechaFiltroReporte" 
                  dateFormat="dd/mm/yy" 
                  class="w-full"
                  :maxDate="new Date()"
                  @update:modelValue="fetchVentasHoy"
                />
              </div>
            </div>
            <div class="flex gap-2">
              <Button icon="pi pi-print" label="Imprimir Consolidado" @click="imprimirConsolidadoDiario" size="small" variant="outlined" severity="secondary" />
              <Button icon="pi pi-refresh" label="Actualizar" @click="fetchVentasHoy" :loading="loadingVentasHoy" size="small" variant="outlined" />
            </div>
          </div>
          
          <DataTable
            :value="resumenCajerosConsolidado"
            :loading="loadingVentasHoy"
            responsiveLayout="scroll"
            class="p-datatable-sm modern-table border border-slate-200 rounded"
          >
            <Column field="nombre" header="Cajero" class="font-bold"></Column>
            <Column field="efectivo" header="Efectivo">
              <template #body="p">
                <span :class="{'text-emerald-600': p.data.efectivo > 0}">{{ formatMonto(p.data.efectivo) }}</span>
              </template>
            </Column>
            <Column field="tarjeta" header="Tarjeta">
              <template #body="p">
                <span :class="{'text-blue-600': p.data.tarjeta > 0}">{{ formatMonto(p.data.tarjeta) }}</span>
              </template>
            </Column>
            <Column field="transferencia" header="Transferencia">
              <template #body="p">
                <span :class="{'text-indigo-600': p.data.transferencia > 0}">{{ formatMonto(p.data.transferencia) }}</span>
              </template>
            </Column>
            <Column field="total" header="Total Cajero">
              <template #body="p">
                <span class="font-bold text-slate-800">{{ formatMonto(p.data.total) }}</span>
              </template>
            </Column>
            
            <template #footer>
              <div class="flex justify-between items-center w-full px-2">
                <span class="font-bold text-lg">TOTAL GENERAL:</span>
                <div class="flex gap-4 font-bold text-base">
                  <span class="text-emerald-700" title="Tot. Efec">EF: {{ formatMonto(totalConsolidado.efectivo) }}</span>
                  <span class="text-blue-700" title="Tot. Tarj">TJ: {{ formatMonto(totalConsolidado.tarjeta) }}</span>
                  <span class="text-indigo-700" title="Tot. Tran">TR: {{ formatMonto(totalConsolidado.transferencia) }}</span>
                  <span class="text-slate-900 border-l border-slate-300 pl-4">TOTAL: {{ formatMonto(totalConsolidado.total) }}</span>
                </div>
              </div>
            </template>
            <template #empty>
              <div class="empty-state">No hay ventas en la fecha seleccionada.</div>
            </template>
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

// Tab 1 & Tab 5
const ventasHoy = ref<any[]>([])
const loadingVentasHoy = ref(false)
const expandedRows = ref({})
const filtroCajeroHoy = ref<string | null>(null)
const fechaFiltroReporte = ref<Date>(new Date())

// Computed Reporte Consolidado
const resumenCajerosConsolidado = computed(() => {
  const mapCajeros = new Map<string, any>()
  
  ventasHoy.value.forEach(v => {
    // Si la venta está cancelada, no sumarla al total de cajas del consolidado
    if (v.estado === 'cancelada') return
    
    const rawId = v.id_usuario || v.turnos_caja?.id_usuario || 'sin_asignar'
    const esDentro = !!v.id_turno
    const cId = rawId + (esDentro ? '_dentro' : '_fuera')
    
    if (!mapCajeros.has(cId)) {
      const baseNombre = rawId === 'sin_asignar' ? 'Ventas sin cajero asignado' : (perfiles.value[rawId]?.nombre || 'Usuario Desconocido')
      mapCajeros.set(cId, {
        id: cId,
        nombre: baseNombre + (esDentro ? ' (En Turno)' : ' (Fuera de Turno)'),
        efectivo: 0,
        tarjeta: 0,
        transferencia: 0,
        mixto: 0,
        otros: 0,
        total: 0
      })
    }
    const cData = mapCajeros.get(cId)
    const metodo = String(v.metodo_pago || '').toLowerCase()
    const total = Number(v.total || 0)
    
    cData.total += total
    if (metodo === 'efectivo') cData.efectivo += total
    else if (metodo === 'tarjeta') cData.tarjeta += total
    else if (metodo === 'transferencia') cData.transferencia += total
    else if (metodo === 'mixto') {
      cData.efectivo += Number(v.pago_efectivo || 0)
      cData.tarjeta += Number(v.pago_tarjeta || 0)
      cData.transferencia += Number(v.pago_transferencia || 0)
    }
  })
  
  // Ordenar por ID base (cajero) y luego por total para juntar las ramas del mismo cajero
  return Array.from(mapCajeros.values()).sort((a, b) => {
    const nameA = a.nombre.split(' (')[0]
    const nameB = b.nombre.split(' (')[0]
    if (nameA < nameB) return -1
    if (nameA > nameB) return 1
    return b.total - a.total
  })
})

const totalConsolidado = computed(() => {
  return resumenCajerosConsolidado.value.reduce((acc, c) => {
    acc.efectivo += c.efectivo
    acc.tarjeta += c.tarjeta
    acc.transferencia += c.transferencia
    acc.total += c.total
    return acc
  }, { efectivo: 0, tarjeta: 0, transferencia: 0, total: 0 })
})

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

const opcionesCajeroHoy = computed(() => {
  const ids = Array.from(new Set(
    ventasHoy.value
      .map((venta: any) => venta.id_usuario || venta.turnos_caja?.id_usuario)
      .filter(Boolean)
  ))

  const opciones = ids.map((id) => ({
    label: perfiles.value[id]?.nombre || `Usuario ${String(id).substring(0, 6)}`,
    value: id
  }))

  opciones.sort((a, b) => a.label.localeCompare(b.label, 'es'))

  return [
    { label: 'Todos los cajeros', value: null },
    ...opciones
  ]
})

const ventasHoyFiltradas = computed(() => {
  if (!filtroCajeroHoy.value) return ventasHoy.value
  return ventasHoy.value.filter((venta: any) => (venta.id_usuario || venta.turnos_caja?.id_usuario) === filtroCajeroHoy.value)
})

const resumenVentasHoy = computed(() => {
  // Solo contar ventas completadas (no canceladas) en el resumen económico
  return ventasHoyFiltradas.value.reduce((acc: Record<string, number>, venta: any) => {
    if (venta.estado === 'cancelada') return acc
    const metodo = String(venta.metodo_pago || '').toLowerCase()
    const total = Number(venta.total || 0)
    acc.total += total
    if (metodo === 'efectivo') acc.efectivo += total
    else if (metodo === 'tarjeta') acc.tarjeta += total
    else if (metodo === 'transferencia') acc.transferencia += total
    else if (metodo === 'mixto') acc.mixto += total
    else acc.otros += total
    return acc
  }, {
    efectivo: 0,
    tarjeta: 0,
    transferencia: 0,
    mixto: 0,
    otros: 0,
    total: 0
  })
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
    const fecha = new Date(fechaFiltroReporte.value || new Date())
    fecha.setHours(0, 0, 0, 0)
    const inicioDia = fecha.toISOString()

    const fin = new Date(fecha)
    fin.setHours(23, 59, 59, 999)
    const finDia = fin.toISOString()

    const { data, error } = await supabase
      .from('ventas')
      .select('id, fecha, total, subtotal, metodo_pago, estado, pago_efectivo, pago_tarjeta, pago_transferencia, id_turno, id_usuario, turnos_caja(id_usuario), detalle_ventas(cantidad, precio_unitario, subtotal, productos(nombre))')
      .gte('fecha', inicioDia)
      .lte('fecha', finDia)
      .order('fecha', { ascending: false })

    if (error) throw error
    ventasHoy.value = data || []

    // Asegurar nombres de cajero incluso en ventas fuera de turno (id_usuario en ventas).
    const idsCajeros = Array.from(new Set(
      (ventasHoy.value || [])
        .map((v: any) => v.id_usuario || v.turnos_caja?.id_usuario)
        .filter(Boolean)
    ))
    const idsFaltantes = idsCajeros.filter((id) => !perfiles.value[id])
    if (idsFaltantes.length > 0) {
      const { data: perfilesData } = await supabase
        .from('perfiles')
        .select('id, nombre')
        .in('id', idsFaltantes)
      ;(perfilesData || []).forEach((p: any) => {
        perfiles.value[p.id] = p
      })
    }
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
  const rows = ventasHoyFiltradas.value.map((v: any) => {
    const tieneDesglose = v.pago_efectivo > 0 || v.pago_tarjeta > 0 || v.pago_transferencia > 0
    const efectivo = tieneDesglose ? (v.pago_efectivo > 0 ? formatMonto(v.pago_efectivo) : '-') : (v.metodo_pago === 'efectivo' ? formatMonto(v.total) : '-')
    const tarjeta = tieneDesglose ? (v.pago_tarjeta > 0 ? formatMonto(v.pago_tarjeta) : '-') : (v.metodo_pago === 'tarjeta' ? formatMonto(v.total) : '-')
    const transferencia = tieneDesglose ? (v.pago_transferencia > 0 ? formatMonto(v.pago_transferencia) : '-') : (v.metodo_pago === 'transferencia' ? formatMonto(v.total) : '-')
    return `
    <tr>
      <td>${v.id.substring(0, 8)}</td>
      <td>${formatDate(v.fecha)}</td>
      <td>${perfiles.value[v.id_usuario || v.turnos_caja?.id_usuario]?.nombre || '-'}</td>
      <td>${v.metodo_pago}</td>
      <td>${efectivo}</td>
      <td>${tarjeta}</td>
      <td>${transferencia}</td>
      <td>${v.estado === 'cancelada' ? 'CANCELADA' : 'COMPLETADA'}</td>
      <td>${v.estado === 'cancelada' ? `<s>${formatMonto(v.total)}</s>` : formatMonto(v.total)}</td>
    </tr>
  `
  }).join('')
  const resumenRows = [
    `<div class="row"><strong>Efectivo</strong><span>${formatMonto(resumenVentasHoy.value.efectivo)}</span></div>`,
    `<div class="row"><strong>Tarjeta</strong><span>${formatMonto(resumenVentasHoy.value.tarjeta)}</span></div>`,
    `<div class="row"><strong>Transferencia</strong><span>${formatMonto(resumenVentasHoy.value.transferencia)}</span></div>`,
    resumenVentasHoy.value.mixto > 0 ? `<div class="row"><strong>Mixto</strong><span>${formatMonto(resumenVentasHoy.value.mixto)}</span></div>` : '',
    resumenVentasHoy.value.otros > 0 ? `<div class="row"><strong>Otros</strong><span>${formatMonto(resumenVentasHoy.value.otros)}</span></div>` : '',
    `<div class="row"><strong>Total</strong><span>${formatMonto(resumenVentasHoy.value.total)}</span></div>`
  ].filter(Boolean).join('')

  const cajeroSeleccionado = opcionesCajeroHoy.value.find((op) => op.value === filtroCajeroHoy.value)?.label || 'Todos los cajeros'

  abrirVentanaReporte(
    'Ventas de Hoy',
    `<div class="meta">Cajero: ${cajeroSeleccionado}</div>
     <div class="meta">Ventas consideradas: ${ventasHoyFiltradas.value.length}</div>
     <h2>Resumen por medio de pago</h2>
     ${resumenRows}
     <h2>Detalle</h2>
     <table><thead><tr><th>Boleta</th><th>Fecha</th><th>Cajero</th><th>Pago</th><th>Efectivo</th><th>Tarjeta</th><th>Transferencia</th><th>Estado</th><th>Total</th></tr></thead><tbody>${rows}</tbody></table>`
  )
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

function imprimirConsolidadoDiario() {
  const width = 380
  const height = 760
  const printWindow = window.open('', '_blank', `width=${width},height=${height}`)
  if (!printWindow) {
    toast.add({ severity: 'error', summary: 'Error', detail: 'Por favor permite las ventanas emergentes (pop-ups) para imprimir.', life: 3000 })
    return
  }

  const filasCajeros = resumenCajerosConsolidado.value.map(c => `
    <div class="item">
      <div class="strong">${c.nombre.toUpperCase()}</div>
      <div class="row"><span>Efectivo:</span><span>${formatMonto(c.efectivo)}</span></div>
      <div class="row"><span>Tarjeta:</span><span>${formatMonto(c.tarjeta)}</span></div>
      <div class="row"><span>Transf.:</span><span>${formatMonto(c.transferencia)}</span></div>
      <div class="row strong" style="margin-top: 4px;"><span>SUBTOTAL:</span><span>${formatMonto(c.total)}</span></div>
    </div>
  `).join('')

  printWindow.document.write(`
    <html>
    <head>
      <title>Reporte Consolidado Diario</title>
      <style>
        @page { size: 80mm auto; margin: 2mm; }
        body { font-family: "Courier New", monospace; width: 76mm; margin: 0 auto; font-size: 12px; color: #111; }
        .title { text-align: center; font-weight: 700; font-size: 15px; margin-top: 6px; }
        h3 { text-align: center; font-size: 13px; margin: 4px 0; font-weight: bold; }
        .line { border-top: 1px dashed #555; margin: 6px 0; }
        .row { display: flex; justify-content: space-between; gap: 6px; margin: 2px 0; }
        .muted { color: #444; font-size: 11px; text-align: center; }
        .item { padding: 8px 0; border-bottom: 1px dashed #ccc; }
        .item:last-child { border-bottom: none; }
        .strong { font-weight: 700; }
        .grand-total { border-top: 2px solid #111; padding-top: 8px; margin-top: 8px;}
        .grand-total .row { font-size: 13px; margin: 4px 0;}
      </style>
    </head>
    <body>
      <div class="title">CONSOLIDADO DIARIO</div>
      <div class="muted">Fecha: ${new Date(fechaFiltroReporte.value).toLocaleDateString('es-CL')}</div>
      <div class="line"></div>
      
      <h3>DETALLE POR CAJERO</h3>
      ${filasCajeros || '<div class="muted">Sin ventas.</div>'}
      
      <div class="grand-total">
        <h3 style="margin-bottom:8px;">TOTALES GENERALES</h3>
        <div class="row"><span>Total Efectivo:</span><span>${formatMonto(totalConsolidado.value.efectivo)}</span></div>
        <div class="row"><span>Total Tarjeta:</span><span>${formatMonto(totalConsolidado.value.tarjeta)}</span></div>
        <div class="row"><span>Total Transf.:</span><span>${formatMonto(totalConsolidado.value.transferencia)}</span></div>
        <div class="row strong" style="font-size:15px; margin-top:8px;"><span>TOTAL DÍA:</span><span>${formatMonto(totalConsolidado.value.total)}</span></div>
      </div>
      
      <script>
        window.onload = () => {
          setTimeout(() => {
            window.print();
            setTimeout(() => window.close(), 700);
          }, 300);
        }
      <\/script>
    </body>
    </html>
  `)
  printWindow.document.close()
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
