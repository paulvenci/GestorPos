<template>
  <div class="blog-admin-page">
    <div class="blog-admin-header">
      <h1><i class="pi pi-pencil" /> Blog</h1>
      <Button label="Nuevo Artículo" icon="pi pi-plus" @click="openEditor(null)" />
    </div>

    <!-- Tabla de Posts -->
    <DataTable :value="posts" :loading="loading" class="p-datatable-sm" stripedRows>
      <Column field="titulo" header="Título" style="min-width: 250px">
        <template #body="{ data }">
          <div>
            <strong>{{ data.titulo }}</strong>
            <div style="font-size: 0.78rem; color: var(--text-muted);">/blog/{{ data.slug }}</div>
          </div>
        </template>
      </Column>
      <Column field="categoria" header="Categoría" style="width: 130px">
        <template #body="{ data }">
          <Tag :value="getCategoriaLabel(data.categoria)" :severity="getCatSeverity(data.categoria)" />
        </template>
      </Column>
      <Column field="publicado" header="Estado" style="width: 110px">
        <template #body="{ data }">
          <Tag :value="data.publicado ? 'Publicado' : 'Borrador'" :severity="data.publicado ? 'success' : 'warn'" />
        </template>
      </Column>
      <Column field="created_at" header="Fecha" style="width: 130px">
        <template #body="{ data }">
          {{ formatDate(data.created_at) }}
        </template>
      </Column>
      <Column header="Acciones" style="width: 180px">
        <template #body="{ data }">
          <div style="display: flex; gap: 6px;">
            <Button icon="pi pi-eye" text rounded severity="info" title="Ver" @click="previewPost(data)" />
            <Button icon="pi pi-pencil" text rounded severity="secondary" title="Editar" @click="openEditor(data)" />
            <Button 
              :icon="data.publicado ? 'pi pi-eye-slash' : 'pi pi-check'" 
              text rounded 
              :severity="data.publicado ? 'warn' : 'success'"
              :title="data.publicado ? 'Despublicar' : 'Publicar'"
              @click="togglePublicado(data)" 
            />
            <Button icon="pi pi-trash" text rounded severity="danger" title="Eliminar" @click="confirmDelete(data)" />
          </div>
        </template>
      </Column>
    </DataTable>

    <!-- Dialog Editor -->
    <Dialog 
      v-model:visible="editorVisible" 
      :header="editingPost ? 'Editar Artículo' : 'Nuevo Artículo'"
      :style="{ width: '80vw', maxWidth: '900px' }"
      modal
    >
      <div class="editor-form">
        <div class="editor-row">
          <div class="editor-field" style="flex: 2">
            <label>Título</label>
            <InputText v-model="form.titulo" placeholder="Título del artículo" class="w-full" @input="generateSlug" />
          </div>
          <div class="editor-field" style="flex: 1">
            <label>Slug (URL)</label>
            <InputText v-model="form.slug" placeholder="url-del-articulo" class="w-full" />
          </div>
        </div>

        <div class="editor-row">
          <div class="editor-field" style="flex: 1">
            <label>Categoría</label>
            <Select v-model="form.categoria" :options="categoriasOptions" optionLabel="label" optionValue="value" placeholder="Seleccionar" class="w-full" />
          </div>
          <div class="editor-field" style="flex: 1">
            <label>Autor</label>
            <InputText v-model="form.autor" placeholder="Equipo ZumaPos" class="w-full" />
          </div>
          <div class="editor-field" style="flex: 1">
            <label>Imagen URL (opcional)</label>
            <InputText v-model="form.imagen_url" placeholder="https://..." class="w-full" />
          </div>
        </div>

        <div class="editor-field">
          <label>Extracto (resumen corto)</label>
          <Textarea v-model="form.extracto" rows="2" placeholder="Breve descripción que aparece en la tarjeta del blog" class="w-full" />
        </div>

        <div class="editor-field">
          <label>Contenido (HTML)</label>
          <Textarea v-model="form.contenido" rows="16" placeholder="<h2>Sección</h2><p>Contenido del artículo...</p>" class="w-full" style="font-family: 'JetBrains Mono', monospace; font-size: 0.85rem;" />
        </div>

        <div class="editor-field">
          <label>
            <input type="checkbox" v-model="form.publicado" style="margin-right: 6px;" />
            Publicar inmediatamente
          </label>
        </div>
      </div>

      <template #footer>
        <Button label="Cancelar" severity="secondary" text @click="editorVisible = false" />
        <Button :label="editingPost ? 'Guardar Cambios' : 'Crear Artículo'" icon="pi pi-save" :loading="saving" @click="savePost" />
      </template>
    </Dialog>

    <!-- Dialog Preview -->
    <Dialog 
      v-model:visible="previewVisible" 
      header="Vista Previa"
      :style="{ width: '80vw', maxWidth: '800px' }"
      modal
    >
      <div v-if="previewData" class="preview-content">
        <span class="preview-cat" :class="`cat-${previewData.categoria}`">{{ getCategoriaLabel(previewData.categoria) }}</span>
        <h2>{{ previewData.titulo }}</h2>
        <p class="preview-excerpt">{{ previewData.extracto }}</p>
        <hr style="border-color: var(--border-subtle); margin: 16px 0;" />
        <div class="preview-body" v-html="previewData.contenido"></div>
      </div>
    </Dialog>

    <Toast />
    <ConfirmDialog />
  </div>
</template>

<script setup lang="ts">
import { useConfirm } from 'primevue/useconfirm'

const supabase = useSupabaseClient()
const toast = useToast()
const confirm = useConfirm()

const loading = ref(true)
const saving = ref(false)
const posts = ref<any[]>([])
const editorVisible = ref(false)
const previewVisible = ref(false)
const editingPost = ref<any>(null)
const previewData = ref<any>(null)

const categoriasOptions = [
  { value: 'guia', label: '📖 Guía' },
  { value: 'tips', label: '💡 Tips' },
  { value: 'equipamiento', label: '🖨️ Equipamiento' },
  { value: 'novedades', label: '🚀 Novedades' }
]

const form = ref({
  titulo: '',
  slug: '',
  extracto: '',
  contenido: '',
  imagen_url: '',
  categoria: 'guia',
  autor: 'Equipo ZumaPos',
  publicado: false
})

function getCategoriaLabel(cat: string) {
  return categoriasOptions.find(c => c.value === cat)?.label || cat
}

function getCatSeverity(cat: string): string {
  const map: Record<string, string> = { guia: 'info', tips: 'warn', equipamiento: 'secondary', novedades: 'success' }
  return map[cat] || 'info'
}

function formatDate(d: string) {
  return new Date(d).toLocaleDateString('es-CL', { day: 'numeric', month: 'short', year: 'numeric' })
}

function generateSlug() {
  form.value.slug = form.value.titulo
    .toLowerCase()
    .normalize('NFD').replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-z0-9\s-]/g, '')
    .replace(/\s+/g, '-')
    .replace(/-+/g, '-')
    .trim()
}

function openEditor(post: any) {
  editingPost.value = post
  if (post) {
    form.value = { ...post }
  } else {
    form.value = { titulo: '', slug: '', extracto: '', contenido: '', imagen_url: '', categoria: 'guia', autor: 'Equipo ZumaPos', publicado: false }
  }
  editorVisible.value = true
}

function previewPost(post: any) {
  previewData.value = post
  previewVisible.value = true
}

async function savePost() {
  if (!form.value.titulo || !form.value.slug) {
    toast.add({ severity: 'error', summary: 'Error', detail: 'Título y slug son obligatorios', life: 3000 })
    return
  }

  saving.value = true
  try {
    if (editingPost.value?.id) {
      const { error } = await supabase
        .from('blog_posts')
        .update({
          titulo: form.value.titulo,
          slug: form.value.slug,
          extracto: form.value.extracto,
          contenido: form.value.contenido,
          imagen_url: form.value.imagen_url,
          categoria: form.value.categoria,
          autor: form.value.autor,
          publicado: form.value.publicado
        })
        .eq('id', editingPost.value.id)
      if (error) throw error
      toast.add({ severity: 'success', summary: 'Actualizado', detail: 'Artículo guardado correctamente', life: 3000 })
    } else {
      const { error } = await supabase
        .from('blog_posts')
        .insert({
          titulo: form.value.titulo,
          slug: form.value.slug,
          extracto: form.value.extracto,
          contenido: form.value.contenido,
          imagen_url: form.value.imagen_url,
          categoria: form.value.categoria,
          autor: form.value.autor,
          publicado: form.value.publicado
        })
      if (error) throw error
      toast.add({ severity: 'success', summary: 'Creado', detail: 'Artículo creado correctamente', life: 3000 })
    }

    editorVisible.value = false
    await fetchPosts()
  } catch (e: any) {
    toast.add({ severity: 'error', summary: 'Error', detail: e.message || 'Error al guardar', life: 5000 })
  } finally {
    saving.value = false
  }
}

async function togglePublicado(post: any) {
  try {
    const { error } = await supabase
      .from('blog_posts')
      .update({ publicado: !post.publicado })
      .eq('id', post.id)
    if (error) throw error
    toast.add({ severity: 'success', summary: post.publicado ? 'Despublicado' : 'Publicado', detail: post.titulo, life: 3000 })
    await fetchPosts()
  } catch (e: any) {
    toast.add({ severity: 'error', summary: 'Error', detail: e.message, life: 3000 })
  }
}

function confirmDelete(post: any) {
  confirm.require({
    message: `¿Eliminar "${post.titulo}"? Esta acción es irreversible.`,
    header: 'Confirmar Eliminación',
    icon: 'pi pi-trash',
    rejectLabel: 'Cancelar',
    acceptLabel: 'Eliminar',
    acceptClass: 'p-button-danger',
    accept: async () => {
      try {
        const { error } = await supabase.from('blog_posts').delete().eq('id', post.id)
        if (error) throw error
        toast.add({ severity: 'success', summary: 'Eliminado', detail: 'Artículo eliminado', life: 3000 })
        await fetchPosts()
      } catch (e: any) {
        toast.add({ severity: 'error', summary: 'Error', detail: e.message, life: 3000 })
      }
    }
  })
}

async function fetchPosts() {
  loading.value = true
  try {
    const { data } = await supabase
      .from('blog_posts')
      .select('*')
      .order('created_at', { ascending: false })
    posts.value = data || []
  } catch (e) {
    console.error(e)
  } finally {
    loading.value = false
  }
}

onMounted(() => fetchPosts())
</script>

<style scoped>
.blog-admin-page {
  padding: 1.4rem 1.6rem;
  color: var(--text-app);
}

.blog-admin-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 1.4rem;
}

.blog-admin-header h1 {
  font-size: 1.6rem;
  font-weight: 800;
  margin: 0;
  display: flex;
  align-items: center;
  gap: 0.5rem;
}

/* Editor Form */
.editor-form {
  display: flex;
  flex-direction: column;
  gap: 16px;
}

.editor-row {
  display: flex;
  gap: 16px;
}

.editor-field {
  display: flex;
  flex-direction: column;
  gap: 6px;
}

.editor-field label {
  font-size: 0.82rem;
  font-weight: 600;
  color: var(--text-muted);
  text-transform: uppercase;
  letter-spacing: 0.04em;
}

/* Preview */
.preview-content h2 {
  font-size: 1.5rem;
  font-weight: 700;
  margin: 12px 0;
}

.preview-excerpt {
  color: var(--text-muted);
  font-size: 0.95rem;
  margin-bottom: 8px;
}

.preview-body :deep(h2) { font-size: 1.3rem; font-weight: 700; margin: 24px 0 10px; }
.preview-body :deep(h3) { font-size: 1.1rem; font-weight: 600; margin: 20px 0 8px; }
.preview-body :deep(p) { margin-bottom: 12px; color: var(--text-muted); line-height: 1.7; }
.preview-body :deep(ul) { padding-left: 20px; margin: 12px 0; }
.preview-body :deep(li) { margin-bottom: 6px; color: var(--text-muted); }
.preview-body :deep(strong) { color: var(--text-app); }

.preview-cat, .cat-guia, .cat-tips, .cat-equipamiento, .cat-novedades {
  display: inline-block;
  font-size: 0.7rem;
  font-weight: 700;
  text-transform: uppercase;
  letter-spacing: 0.08em;
  padding: 3px 10px;
  border-radius: 100px;
}
.cat-guia { background: rgba(99, 102, 241, 0.15); color: #818cf8; }
.cat-tips { background: rgba(245, 158, 11, 0.15); color: #fbbf24; }
.cat-equipamiento { background: rgba(6, 182, 212, 0.15); color: #22d3ee; }
.cat-novedades { background: rgba(34, 197, 94, 0.15); color: #4ade80; }

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
  font-size: 0.82rem;
  text-transform: uppercase;
  letter-spacing: 0.05em;
  padding: 0.65rem 0.85rem;
  border: none !important;
}
:deep(.p-datatable-tbody > tr) { background: transparent !important; color: var(--text-app); }
:deep(.p-datatable-tbody > tr > td) { border-color: var(--border-subtle) !important; padding: 0.65rem 0.85rem; }

@media (max-width: 768px) {
  .blog-admin-page { padding: 0.8rem; }
  .editor-row { flex-direction: column; }
}
</style>
