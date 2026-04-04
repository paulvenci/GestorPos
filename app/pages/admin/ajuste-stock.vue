<template>
  <div class="admin-page">
    <div class="admin-header">
      <div class="admin-header-titles">
        <h1>Ajuste de Stock</h1>
        <p>Registra ingresos y egresos de inventario con motivo y trazabilidad.</p>
      </div>
      <Button label="Nuevo Ajuste" icon="pi pi-plus" severity="success" @click="abrirNuevo" />
    </div>

    <!-- Formulario de nuevo ajuste -->
    <Dialog v-model:visible="mostrarDialogo" header="Registrar Ajuste de Stock" :modal="true" :style="{ width: '520px' }" class="p-fluid">
      <div class="ajuste-form">
        <div class="ajuste-field">
          <label>Producto</label>
          <Select
            v-model="form.id_producto"
            :options="productosOptions"
            optionLabel="label"
            optionValue="value"
            placeholder="Buscar producto..."
            filter
            :loading="loadingProductos"
          />
        </div>

        <div v-if="productoSeleccionado" class="ajuste-stock-actual">
          <span>Stock actual:</span>
          <Tag :value="productoSeleccionado.stock.toString()" :severity="productoSeleccionado.stock > 5 ? 'success' : productoSeleccionado.stock > 0 ? 'warning' : 'danger'" />
        </div>

        <div class="ajuste-field-row">
          <div class="ajuste-field">
            <label>Tipo</label>
            <SelectButton v-model="form.tipo" :options="tiposAjuste" optionLabel="label" optionValue="value" />
          </div>
          <div class="ajuste-field">
            <label>Cantidad</label>
            <InputNumber v-model="form.cantidad" :min="1" />
          </div>
        </div>

        <div v-if="form.id_producto && form.cantidad" class="ajuste-preview">
          <span>Stock resultante:</span>
          <strong :class="stockResultanteClass">{{ stockResultante }}</strong>
        </div>

        <div class="ajuste-field">
          <label>Motivo</label>
          <Select
            v-model="form.motivo"
            :options="motivosAjuste"
            placeholder="Seleccionar motivo"
          />
        </div>

        <div class="ajuste-field">
          <label>Observaciones (opcional)</label>
          <Textarea v-model="form.observaciones" rows="2" placeholder="Detalles adicionales..." />
        </div>
      </div>

      <template #footer>
        <Button label="Cancelar" icon="pi pi-times" text severity="secondary" @click="mostrarDialogo = false" />
        <Button
          label="Registrar Ajuste"
          icon="pi pi-check"
          @click="registrarAjuste"
          :loading="saving"
          :disabled="!form.id_producto || !form.cantidad || !form.motivo"
        />
      </template>
    </Dialog>

    <!-- Tabla de historial de ajustes -->
    <DataTable
      :value="ajustes"
      :loading="loading"
      class="p-datatable-sm"
      paginator
      :rows="15"
      responsiveLayout="scroll"
      sortField="created_at"
      :sortOrder="-1"
    >
      <Column header="Fecha" sortable field="created_at">
        <template #body="slotProps">
          <span class="text-sm" style="color: var(--text-muted)">{{ formatFecha(slotProps.data.created_at) }}</span>
        </template>
      </Column>
      <Column header="Producto">
        <template #body="slotProps">
          <span class="font-semibold">{{ slotProps.data.producto_nombre || '-' }}</span>
        </template>
      </Column>
      <Column header="Tipo" sortable field="tipo">
        <template #body="slotProps">
          <Tag
            :value="slotProps.data.tipo === 'ingreso' ? '⬆ Ingreso' : '⬇ Egreso'"
            :severity="slotProps.data.tipo === 'ingreso' ? 'success' : 'danger'"
          />
        </template>
      </Column>
      <Column field="cantidad" header="Cant." sortable />
      <Column header="Stock">
        <template #body="slotProps">
          <span style="color: var(--text-muted)">{{ slotProps.data.stock_anterior }} → <strong>{{ slotProps.data.stock_nuevo }}</strong></span>
        </template>
      </Column>
      <Column field="motivo" header="Motivo" />
      <Column header="Usuario">
        <template #body="slotProps">
          <span class="text-sm">{{ slotProps.data.usuario_nombre || '-' }}</span>
        </template>
      </Column>
      <template #empty>
        <div class="p-4 text-center" style="color: var(--text-muted)">No hay ajustes de stock registrados.</div>
      </template>
    </DataTable>
  </div>
</template>

<script setup lang="ts">
import { useToast } from 'primevue/usetoast'
import { useFormatMonto } from '~/composables/useFormatMonto'
import type { Database } from '~/types/database.types'

const supabase = useSupabaseClient<Database>()
const toast = useToast()
const { formatFecha } = useFormatMonto()

const loading = ref(false)
const saving = ref(false)
const loadingProductos = ref(false)
const mostrarDialogo = ref(false)

const ajustes = ref<any[]>([])
const productos = ref<any[]>([])

const tiposAjuste = [
  { label: 'Ingreso', value: 'ingreso' },
  { label: 'Egreso', value: 'egreso' }
]

const motivosAjuste = [
  'Compra a proveedor',
  'Devolución de cliente',
  'Ajuste por inventario físico',
  'Merma / Vencimiento',
  'Uso interno',
  'Transferencia entre sucursales',
  'Otro'
]

const form = ref({
  id_producto: null as string | null,
  tipo: 'ingreso' as 'ingreso' | 'egreso',
  cantidad: 1,
  motivo: null as string | null,
  observaciones: ''
})

const productosOptions = computed(() =>
  productos.value.map(p => ({
    label: `${p.nombre} (Stock: ${p.stock})`,
    value: p.id
  }))
)

const productoSeleccionado = computed(() =>
  productos.value.find(p => p.id === form.value.id_producto) || null
)

const stockResultante = computed(() => {
  if (!productoSeleccionado.value) return 0
  const actual = productoSeleccionado.value.stock
  return form.value.tipo === 'ingreso'
    ? actual + (form.value.cantidad || 0)
    : actual - (form.value.cantidad || 0)
})

const stockResultanteClass = computed(() => {
  if (stockResultante.value < 0) return 'stock-negativo'
  if (stockResultante.value <= 5) return 'stock-bajo'
  return 'stock-ok'
})

onMounted(async () => {
  await Promise.all([fetchAjustes(), fetchProductos()])
})

async function fetchProductos() {
  loadingProductos.value = true
  try {
    const { data } = await supabase
      .from('productos')
      .select('id, nombre, stock')
      .eq('activo', true)
      .order('nombre')
    productos.value = data || []
  } finally {
    loadingProductos.value = false
  }
}

async function fetchAjustes() {
  loading.value = true
  try {
    const { data, error } = await (supabase.from('ajustes_stock') as any)
      .select('*')
      .order('created_at', { ascending: false })
      .limit(100)

    if (error) throw error

    if (data && data.length > 0) {
      // Enriquecer con nombres de producto y usuario
      const prodIds = [...new Set(data.map((a: any) => a.id_producto))]
      const userIds = [...new Set(data.map((a: any) => a.id_usuario))]

      const { data: prods } = await supabase
        .from('productos')
        .select('id, nombre')
        .in('id', prodIds)

      const { data: perfiles } = await supabase
        .from('perfiles')
        .select('id, nombre')
        .in('id', userIds)

      const prodMap = new Map((prods || []).map((p: any) => [p.id, p.nombre]))
      const userMap = new Map((perfiles || []).map((u: any) => [u.id, u.nombre]))

      ajustes.value = data.map((a: any) => ({
        ...a,
        producto_nombre: prodMap.get(a.id_producto) || '-',
        usuario_nombre: userMap.get(a.id_usuario) || '-'
      }))
    } else {
      ajustes.value = []
    }
  } catch (e: any) {
    toast.add({ severity: 'error', summary: 'Error', detail: e.message, life: 5000 })
  } finally {
    loading.value = false
  }
}

function abrirNuevo() {
  form.value = { id_producto: null, tipo: 'ingreso', cantidad: 1, motivo: null, observaciones: '' }
  mostrarDialogo.value = true
}

async function registrarAjuste() {
  if (!form.value.id_producto || !form.value.cantidad || !form.value.motivo) return
  if (stockResultante.value < 0) {
    toast.add({ severity: 'warn', summary: 'Stock insuficiente', detail: 'El egreso excede el stock disponible.', life: 4000 })
    return
  }

  saving.value = true
  try {
    const { data: { user } } = await supabase.auth.getUser()
    const stockAnterior = productoSeleccionado.value?.stock ?? 0

    // Insertar ajuste
    const { error: ajusteError } = await (supabase.from('ajustes_stock') as any).insert({
      id_producto: form.value.id_producto,
      id_usuario: user?.id,
      tipo: form.value.tipo,
      cantidad: form.value.cantidad,
      motivo: form.value.motivo,
      observaciones: form.value.observaciones || null,
      stock_anterior: stockAnterior,
      stock_nuevo: stockResultante.value
    })
    if (ajusteError) throw ajusteError

    // Actualizar stock del producto
    const { error: updateError } = await supabase
      .from('productos')
      .update({ stock: stockResultante.value })
      .eq('id', form.value.id_producto)
    if (updateError) throw updateError

    toast.add({ severity: 'success', summary: 'Ajuste registrado', detail: `Stock actualizado: ${stockAnterior} → ${stockResultante.value}`, life: 3000 })
    mostrarDialogo.value = false
    await Promise.all([fetchAjustes(), fetchProductos()])
  } catch (e: any) {
    toast.add({ severity: 'error', summary: 'Error', detail: e.message, life: 5000 })
  } finally {
    saving.value = false
  }
}
</script>

<style scoped>
.admin-page {
  padding: 2.5rem;
  color: var(--text-app);
}

.admin-header {
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  margin-bottom: 2rem;
  flex-wrap: wrap;
  gap: 1.5rem;
}

.admin-header-titles h1 {
  font-size: 2rem;
  font-weight: 700;
  margin: 0 0 0.5rem;
  letter-spacing: -0.03em;
}

.admin-header-titles p {
  color: var(--text-muted);
  margin: 0;
  font-size: 0.95rem;
}

/* Ajuste Form */
.ajuste-form {
  display: flex;
  flex-direction: column;
  gap: 1.25rem;
  padding: 0.5rem 0;
}

.ajuste-field {
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
}

.ajuste-field label {
  font-size: 0.875rem;
  font-weight: 600;
  color: var(--text-muted);
}

.ajuste-field-row {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 1rem;
}

.ajuste-stock-actual {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  padding: 0.5rem 0.75rem;
  background: rgba(99, 102, 241, 0.08);
  border-radius: 0.5rem;
  font-size: 0.85rem;
  color: var(--text-muted);
}

.ajuste-preview {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  padding: 0.5rem 0.75rem;
  background: var(--bg-surface);
  border-radius: 0.5rem;
  border: 1px solid var(--border-subtle);
  font-size: 0.9rem;
}

.stock-ok { color: #22c55e; }
.stock-bajo { color: #f59e0b; }
.stock-negativo { color: #ef4444; }

/* DataTable */
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

:deep(.p-paginator) {
  background: transparent !important;
  border-top: 1px solid var(--border-subtle) !important;
}
</style>
