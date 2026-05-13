<template>
  <div class="blog-wrapper">
    <!-- Navbar -->
    <nav class="blog-navbar" id="blog-navbar">
      <div class="blog-nav-inner">
        <NuxtLink to="/" class="blog-nav-logo">
          <img src="/landing/logo1.svg" alt="ZumaPos" class="logo-icon" width="28" height="28" />
          <span class="logo-text">Zuma<span class="logo-accent">Pos</span></span>
        </NuxtLink>
        <div class="blog-nav-links">
          <NuxtLink to="/" class="blog-nav-link">← Volver al Inicio</NuxtLink>
          <NuxtLink to="/login" class="blog-nav-link">Iniciar Sesión</NuxtLink>
          <NuxtLink to="/registro" class="blog-nav-cta">Prueba Gratuita</NuxtLink>
        </div>
      </div>
    </nav>

    <!-- Hero del Blog -->
    <section class="blog-hero">
      <div class="blog-hero-inner">
        <span class="blog-hero-tag">📝 Blog ZumaPos</span>
        <h1>Guías, tips y recursos para tu negocio</h1>
        <p>Aprende a sacar el máximo provecho de tu punto de venta. Artículos escritos por expertos en retail y tecnología.</p>
      </div>
    </section>

    <!-- Filtros por Categoría -->
    <section class="blog-content">
      <div class="blog-filters">
        <button 
          v-for="cat in categorias" 
          :key="cat.value"
          class="blog-filter-btn"
          :class="{ active: categoriaActiva === cat.value }"
          @click="categoriaActiva = cat.value"
        >
          {{ cat.icon }} {{ cat.label }}
        </button>
      </div>

      <!-- Grid de Artículos -->
      <div v-if="loading" class="blog-loading">
        <div v-for="i in 6" :key="i" class="blog-card-skeleton">
          <div class="skeleton-img"></div>
          <div class="skeleton-text"></div>
          <div class="skeleton-text short"></div>
        </div>
      </div>

      <div v-else-if="postsFiltrados.length === 0" class="blog-empty">
        <span class="blog-empty-icon">📭</span>
        <h3>No hay artículos en esta categoría</h3>
        <p>Estamos preparando contenido increíble. ¡Vuelve pronto!</p>
      </div>

      <div v-else class="blog-grid">
        <NuxtLink 
          v-for="post in postsFiltrados" 
          :key="post.id" 
          :to="`/blog/${post.slug}`"
          class="blog-card"
        >
          <div class="blog-card-img" :style="post.imagen_url ? { backgroundImage: `url(${post.imagen_url})` } : {}">
            <span v-if="!post.imagen_url" class="blog-card-img-placeholder">{{ getCategoriaIcon(post.categoria) }}</span>
          </div>
          <div class="blog-card-body">
            <span class="blog-card-cat" :class="`cat-${post.categoria}`">{{ getCategoriaLabel(post.categoria) }}</span>
            <h3>{{ post.titulo }}</h3>
            <p>{{ post.extracto }}</p>
            <div class="blog-card-footer">
              <span class="blog-card-author">{{ post.autor }}</span>
              <span class="blog-card-date">{{ formatDate(post.created_at) }}</span>
            </div>
          </div>
        </NuxtLink>
      </div>
    </section>

    <!-- Footer -->
    <footer class="blog-footer">
      <div class="blog-footer-inner">
        <NuxtLink to="/" class="blog-nav-logo">
          <img src="/landing/logo1.svg" alt="ZumaPos" class="logo-icon" width="24" height="24" />
          <span class="logo-text">Zuma<span class="logo-accent">Pos</span></span>
        </NuxtLink>
        <p>© {{ new Date().getFullYear() }} ZumaPos. Todos los derechos reservados.</p>
      </div>
    </footer>
  </div>
</template>

<script setup lang="ts">
import '~/assets/css/landing-original.css'

definePageMeta({ layout: false })

useHead({
  title: 'Blog - ZumaPos | Guías y Tips para tu Negocio',
  meta: [
    { name: 'description', content: 'Artículos, guías y tips para optimizar tu punto de venta. Aprende sobre equipamiento POS, productividad y más.' }
  ],
  link: [
    { rel: 'preconnect', href: 'https://fonts.googleapis.com' },
    { rel: 'preconnect', href: 'https://fonts.gstatic.com', crossorigin: '' },
    { rel: 'stylesheet', href: 'https://fonts.googleapis.com/css2?family=JetBrains+Mono:wght@400;700&family=Outfit:wght@300;400;500;600;700;800;900&display=swap' }
  ]
})

const supabase = useSupabaseClient()
const loading = ref(true)
const posts = ref<any[]>([])
const categoriaActiva = ref('todos')

const categorias = [
  { value: 'todos', label: 'Todos', icon: '📋' },
  { value: 'guia', label: 'Guías', icon: '📖' },
  { value: 'tips', label: 'Tips', icon: '💡' },
  { value: 'equipamiento', label: 'Equipamiento', icon: '🖨️' },
  { value: 'novedades', label: 'Novedades', icon: '🚀' }
]

const postsFiltrados = computed(() => {
  if (categoriaActiva.value === 'todos') return posts.value
  return posts.value.filter(p => p.categoria === categoriaActiva.value)
})

function getCategoriaIcon(cat: string) {
  return categorias.find(c => c.value === cat)?.icon || '📄'
}

function getCategoriaLabel(cat: string) {
  return categorias.find(c => c.value === cat)?.label || cat
}

function formatDate(dateStr: string) {
  const date = new Date(dateStr)
  return date.toLocaleDateString('es-CL', { day: 'numeric', month: 'short', year: 'numeric' })
}

onMounted(async () => {
  try {
    const { data } = await supabase
      .from('blog_posts')
      .select('id, titulo, slug, extracto, imagen_url, categoria, autor, created_at')
      .eq('publicado', true)
      .order('created_at', { ascending: false })
    posts.value = data || []
  } catch (e) {
    console.error('Error fetching blog posts:', e)
  } finally {
    loading.value = false
  }
})
</script>

<style scoped>
/* Blog Wrapper */
.blog-wrapper {
  min-height: 100vh;
  background: var(--bg);
  color: var(--text);
  font-family: 'Outfit', system-ui, sans-serif;
}

/* Blog Navbar */
.blog-navbar {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  z-index: 1000;
  padding: 16px 24px;
  background: rgba(10, 11, 20, 0.85);
  backdrop-filter: blur(20px);
  border-bottom: 1px solid var(--border);
}

.blog-nav-inner {
  max-width: 1200px;
  margin: 0 auto;
  display: flex;
  align-items: center;
  justify-content: space-between;
}

.blog-nav-logo {
  display: flex;
  align-items: center;
  gap: 10px;
  text-decoration: none;
  color: var(--text);
  font-weight: 700;
  font-size: 1.2rem;
}

.blog-nav-links {
  display: flex;
  align-items: center;
  gap: 16px;
}

.blog-nav-link {
  color: var(--text-muted);
  text-decoration: none;
  font-size: 0.9rem;
  font-weight: 500;
  transition: color 0.2s;
}

.blog-nav-link:hover { color: var(--primary-light); }

.blog-nav-cta {
  padding: 8px 20px;
  background: var(--primary);
  color: white;
  text-decoration: none;
  font-size: 0.85rem;
  font-weight: 600;
  border-radius: 100px;
  transition: all 0.2s;
}

.blog-nav-cta:hover {
  background: var(--primary-light);
  transform: translateY(-1px);
}

/* Blog Hero */
.blog-hero {
  padding: 140px 24px 60px;
  text-align: center;
  position: relative;
  overflow: hidden;
}

.blog-hero::before {
  content: '';
  position: absolute;
  top: 0;
  left: 50%;
  transform: translateX(-50%);
  width: 600px;
  height: 400px;
  background: radial-gradient(circle, rgba(139, 92, 246, 0.15), transparent 70%);
  pointer-events: none;
}

.blog-hero-inner {
  max-width: 700px;
  margin: 0 auto;
  position: relative;
}

.blog-hero-tag {
  display: inline-block;
  padding: 6px 16px;
  background: rgba(139, 92, 246, 0.12);
  border: 1px solid rgba(139, 92, 246, 0.25);
  border-radius: 100px;
  font-size: 0.85rem;
  color: var(--primary-light);
  margin-bottom: 20px;
}

.blog-hero h1 {
  font-size: 2.6rem;
  font-weight: 800;
  line-height: 1.15;
  margin-bottom: 16px;
  letter-spacing: -0.03em;
}

.blog-hero p {
  font-size: 1.1rem;
  color: var(--text-muted);
  line-height: 1.6;
}

/* Blog Content */
.blog-content {
  max-width: 1200px;
  margin: 0 auto;
  padding: 40px 24px 80px;
}

/* Filters */
.blog-filters {
  display: flex;
  flex-wrap: wrap;
  gap: 10px;
  margin-bottom: 40px;
  justify-content: center;
}

.blog-filter-btn {
  padding: 8px 18px;
  border: 1px solid var(--border);
  background: var(--bg-2);
  color: var(--text-muted);
  border-radius: 100px;
  font-size: 0.85rem;
  font-weight: 500;
  cursor: pointer;
  transition: all 0.25s;
  font-family: inherit;
}

.blog-filter-btn:hover {
  border-color: var(--primary);
  color: var(--text);
}

.blog-filter-btn.active {
  background: var(--primary);
  border-color: var(--primary);
  color: white;
}

/* Blog Grid */
.blog-grid {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 24px;
}

.blog-card {
  background: var(--bg-2);
  border: 1px solid var(--border);
  border-radius: 16px;
  overflow: hidden;
  text-decoration: none;
  color: var(--text);
  transition: all 0.3s;
  display: flex;
  flex-direction: column;
}

.blog-card:hover {
  transform: translateY(-4px);
  box-shadow: 0 12px 40px rgba(139, 92, 246, 0.15);
  border-color: var(--primary);
}

.blog-card-img {
  height: 180px;
  background: linear-gradient(135deg, rgba(139, 92, 246, 0.08), rgba(6, 182, 212, 0.06));
  background-size: cover;
  background-position: center;
  display: flex;
  align-items: center;
  justify-content: center;
  position: relative;
}

.blog-card-img-placeholder {
  font-size: 3rem;
}

.blog-card-body {
  padding: 20px 24px 24px;
  flex: 1;
  display: flex;
  flex-direction: column;
}

.blog-card-cat {
  display: inline-block;
  font-size: 0.7rem;
  font-weight: 700;
  text-transform: uppercase;
  letter-spacing: 0.08em;
  padding: 3px 10px;
  border-radius: 100px;
  margin-bottom: 12px;
  width: fit-content;
}

.cat-guia { background: rgba(139, 92, 246, 0.15); color: #a78bfa; }
.cat-tips { background: rgba(245, 158, 11, 0.15); color: #fbbf24; }
.cat-equipamiento { background: rgba(6, 182, 212, 0.15); color: #22d3ee; }
.cat-novedades { background: rgba(34, 197, 94, 0.15); color: #4ade80; }

.blog-card h3 {
  font-size: 1.1rem;
  font-weight: 700;
  line-height: 1.35;
  margin-bottom: 8px;
}

.blog-card p {
  font-size: 0.88rem;
  color: var(--text-muted);
  line-height: 1.55;
  flex: 1;
}

.blog-card-footer {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-top: 16px;
  padding-top: 12px;
  border-top: 1px solid var(--border);
  font-size: 0.78rem;
  color: var(--text-subtle);
}

/* Skeleton Loading */
.blog-loading {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 24px;
}

.blog-card-skeleton {
  background: var(--bg-2);
  border: 1px solid var(--border);
  border-radius: 16px;
  overflow: hidden;
  padding: 0 0 24px;
}

.skeleton-img {
  height: 180px;
  background: linear-gradient(90deg, var(--bg-3) 25%, var(--bg-2) 50%, var(--bg-3) 75%);
  background-size: 200% 100%;
  animation: shimmer 1.5s infinite;
}

.skeleton-text {
  height: 16px;
  margin: 16px 24px 0;
  background: var(--bg-3);
  border-radius: 8px;
  animation: shimmer 1.5s infinite;
}

.skeleton-text.short { width: 60%; }

@keyframes shimmer {
  0% { background-position: 200% 0; }
  100% { background-position: -200% 0; }
}

/* Empty state */
.blog-empty {
  text-align: center;
  padding: 80px 20px;
}

.blog-empty-icon { font-size: 3rem; }
.blog-empty h3 { font-size: 1.3rem; font-weight: 700; margin: 16px 0 8px; }
.blog-empty p { color: var(--text-muted); }

/* Footer */
.blog-footer {
  border-top: 1px solid var(--border);
  padding: 40px 24px;
  background: var(--bg-2);
}

.blog-footer-inner {
  max-width: 1200px;
  margin: 0 auto;
  display: flex;
  align-items: center;
  justify-content: space-between;
}

.blog-footer p {
  font-size: 0.85rem;
  color: var(--text-subtle);
}

/* Responsive */
@media (max-width: 1100px) {
  .blog-grid, .blog-loading { grid-template-columns: repeat(2, 1fr); }
}

@media (max-width: 768px) {
  .blog-grid, .blog-loading { grid-template-columns: 1fr; }
  .blog-hero h1 { font-size: 1.8rem; }
  .blog-hero { padding: 120px 20px 40px; }
  .blog-nav-links { gap: 8px; }
  .blog-nav-link { font-size: 0.8rem; }
  .blog-nav-cta { padding: 6px 14px; font-size: 0.8rem; }
  .blog-footer-inner { flex-direction: column; gap: 12px; text-align: center; }
}
</style>
