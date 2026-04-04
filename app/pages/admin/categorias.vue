<template>
  <div class="admin-page">
    <!-- Encabezado -->
    <div class="admin-header">
      <div class="admin-header-titles">
        <h1>Gestión de Categorías</h1>
        <p>Organiza tu catálogo de productos con categorías personalizadas.</p>
      </div>
      <div class="admin-header-actions">
        <Button label="Nueva Categoría" icon="pi pi-plus" severity="success" @click="abrirNueva" />
      </div>
    </div>

    <!-- Grid de Categorías -->
    <div v-if="categoriasStore.loading" class="cat-loading">
      <i class="pi pi-spin pi-spinner" style="font-size: 2rem" />
      <p>Cargando categorías...</p>
    </div>

    <div v-else-if="categoriasStore.categorias.length === 0" class="cat-empty">
      <i class="pi pi-tags cat-empty-icon" />
      <h3>Sin categorías</h3>
      <p>Crea tu primera categoría para organizar los productos.</p>
      <Button label="Crear categoría" icon="pi pi-plus" @click="abrirNueva" />
    </div>

    <div v-else class="cat-grid">
      <div
        v-for="cat in categoriasStore.categorias"
        :key="cat.id"
        class="cat-card"
        :class="{ 'cat-card--inactive': !cat.activo }"
      >
        <div class="cat-card-header">
          <div class="cat-card-color" :style="{ background: cat.color }" />
          <div class="cat-card-info">
            <h3 class="cat-card-name">{{ cat.nombre }}</h3>
            <p class="cat-card-desc">{{ cat.descripcion || 'Sin descripción' }}</p>
          </div>
          <Tag :value="cat.activo ? 'Activa' : 'Inactiva'" :severity="cat.activo ? 'success' : 'secondary'" />
        </div>
        <div class="cat-card-actions">
          <Button icon="pi pi-pencil" text rounded severity="info" size="small" @click="abrirEditar(cat)" title="Editar" />
          <Button icon="pi pi-power-off" text rounded :severity="cat.activo ? 'warning' : 'success'" size="small" @click="categoriasStore.toggleActivo(cat.id, !cat.activo)" :title="cat.activo ? 'Desactivar' : 'Activar'" />
          <Button icon="pi pi-trash" text rounded severity="danger" size="small" @click="confirmarEliminar(cat)" title="Eliminar" />
        </div>
      </div>
    </div>

    <!-- Dialog de Crear/Editar -->
    <Dialog v-model:visible="mostrarDialogo" :header="editando ? 'Editar Categoría' : 'Nueva Categoría'" :modal="true" :style="{ width: '450px' }" class="p-fluid">
      <div class="field mb-4">
        <label for="cat-nombre" class="font-bold mb-2 block">Nombre</label>
        <InputText id="cat-nombre" v-model.trim="categoriaActual.nombre" :class="{ 'p-invalid': submitted && !categoriaActual.nombre }" placeholder="Ej: Bebidas" />
        <small class="p-error" v-if="submitted && !categoriaActual.nombre">El nombre es requerido.</small>
      </div>

      <div class="field mb-4">
        <label for="cat-desc" class="font-bold mb-2 block">Descripción</label>
        <InputText id="cat-desc" v-model.trim="categoriaActual.descripcion" placeholder="Descripción opcional..." />
      </div>

      <div class="field mb-4">
        <label for="cat-color" class="font-bold mb-2 block">Color identificador</label>
        <div class="cat-color-picker">
          <div
            v-for="c in coloresPreset"
            :key="c"
            class="cat-color-swatch"
            :class="{ 'cat-color-swatch--active': categoriaActual.color === c }"
            :style="{ background: c }"
            @click="categoriaActual.color = c"
          />
        </div>
      </div>

      <template #footer>
        <Button label="Cancelar" icon="pi pi-times" text @click="mostrarDialogo = false" />
        <Button :label="editando ? 'Guardar cambios' : 'Crear categoría'" icon="pi pi-check" @click="guardar" :loading="categoriasStore.loading" />
      </template>
    </Dialog>

    <!-- Dialog de Confirmación -->
    <Dialog v-model:visible="mostrarConfirmacion" header="Confirmar eliminación" :modal="true" :style="{ width: '400px' }">
      <div class="flex items-center gap-3 mb-4">
        <i class="pi pi-exclamation-triangle" style="font-size: 2rem; color: var(--p-red-500)" />
        <span>¿Estás seguro de que quieres eliminar la categoría <b>{{ categoriaEliminar?.nombre }}</b>?</span>
      </div>
      <template #footer>
        <Button label="Cancelar" icon="pi pi-times" text @click="mostrarConfirmacion = false" />
        <Button label="Eliminar" icon="pi pi-trash" severity="danger" @click="ejecutarEliminar" :loading="categoriasStore.loading" />
      </template>
    </Dialog>
  </div>
</template>

<script setup lang="ts">
import { useToast } from 'primevue/usetoast'
import { useCategoriasStore, type Categoria } from '~/stores/categorias'

const categoriasStore = useCategoriasStore()
const toast = useToast()

const coloresPreset = [
  '#ef4444', '#f97316', '#f59e0b', '#eab308',
  '#22c55e', '#14b8a6', '#06b6d4', '#3b82f6',
  '#6366f1', '#8b5cf6', '#a855f7', '#ec4899'
]

const mostrarDialogo = ref(false)
const mostrarConfirmacion = ref(false)
const submitted = ref(false)
const editando = ref(false)
const categoriaActual = ref<Partial<Categoria>>({
  nombre: '', descripcion: '', color: '#6366f1', activo: true
})
const categoriaEliminar = ref<Categoria | null>(null)

onMounted(() => {
  categoriasStore.fetchCategorias()
})

function abrirNueva() {
  categoriaActual.value = { nombre: '', descripcion: '', color: '#6366f1', activo: true }
  editando.value = false
  submitted.value = false
  mostrarDialogo.value = true
}

function abrirEditar(cat: Categoria) {
  categoriaActual.value = { ...cat }
  editando.value = true
  submitted.value = false
  mostrarDialogo.value = true
}

function confirmarEliminar(cat: Categoria) {
  categoriaEliminar.value = cat
  mostrarConfirmacion.value = true
}

async function ejecutarEliminar() {
  if (!categoriaEliminar.value) return
  try {
    await categoriasStore.deleteCategoria(categoriaEliminar.value.id)
    toast.add({ severity: 'success', summary: 'Eliminada', detail: 'La categoría fue eliminada.', life: 3000 })
  } catch (e: any) {
    toast.add({ severity: 'error', summary: 'Error', detail: e.message, life: 5000 })
  }
  mostrarConfirmacion.value = false
}

async function guardar() {
  submitted.value = true
  if (!categoriaActual.value.nombre) return

  try {
    await categoriasStore.saveCategoria(categoriaActual.value)
    toast.add({
      severity: 'success',
      summary: editando.value ? 'Actualizada' : 'Creada',
      detail: `Categoría "${categoriaActual.value.nombre}" ${editando.value ? 'actualizada' : 'creada'} correctamente.`,
      life: 3000
    })
    mostrarDialogo.value = false
  } catch (e: any) {
    toast.add({ severity: 'error', summary: 'Error', detail: e.message, life: 5000 })
  }
}
</script>

<style scoped>
.admin-page {
  padding: 2rem;
}

.admin-header {
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  margin-bottom: 2rem;
  gap: 1rem;
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

/* Loading */
.cat-loading {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 1rem;
  padding: 4rem;
  color: var(--text-muted);
}

/* Empty State */
.cat-empty {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 0.75rem;
  padding: 4rem;
  text-align: center;
  color: var(--text-muted);
}

.cat-empty-icon {
  font-size: 3rem;
  opacity: 0.4;
}

.cat-empty h3 {
  color: var(--text-app);
  margin: 0;
}

/* Grid */
.cat-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(340px, 1fr));
  gap: 1rem;
}

.cat-card {
  background: var(--bg-surface);
  border: 1px solid var(--border-subtle);
  border-radius: 1rem;
  padding: 1.25rem;
  transition: all 0.2s ease;
}

.cat-card:hover {
  border-color: var(--color-brand-primary);
  box-shadow: 0 4px 20px rgba(99, 102, 241, 0.1);
}

.cat-card--inactive {
  opacity: 0.55;
}

.cat-card-header {
  display: flex;
  align-items: center;
  gap: 0.75rem;
}

.cat-card-color {
  width: 40px;
  height: 40px;
  border-radius: 0.75rem;
  flex-shrink: 0;
}

.cat-card-info {
  flex: 1;
  min-width: 0;
}

.cat-card-name {
  font-size: 1rem;
  font-weight: 700;
  color: var(--text-app);
  margin: 0;
  text-transform: capitalize;
}

.cat-card-desc {
  font-size: 0.8rem;
  color: var(--text-muted);
  margin: 0.15rem 0 0;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.cat-card-actions {
  display: flex;
  justify-content: flex-end;
  gap: 0.25rem;
  margin-top: 0.75rem;
  padding-top: 0.75rem;
  border-top: 1px solid var(--border-subtle);
}

/* Color Picker */
.cat-color-picker {
  display: flex;
  flex-wrap: wrap;
  gap: 0.5rem;
}

.cat-color-swatch {
  width: 36px;
  height: 36px;
  border-radius: 0.5rem;
  cursor: pointer;
  border: 3px solid transparent;
  transition: all 0.15s ease;
}

.cat-color-swatch:hover {
  transform: scale(1.15);
}

.cat-color-swatch--active {
  border-color: var(--text-app);
  box-shadow: 0 0 0 2px var(--bg-surface), 0 0 0 4px var(--text-app);
}
</style>
