<template>
  <div class="blog-wrapper">
    <!-- Navbar -->
    <nav class="blog-navbar">
      <div class="blog-nav-inner">
        <NuxtLink to="/" class="blog-nav-logo">
          <img src="/landing/logo1.svg" alt="ZumaPos" class="logo-icon" width="28" height="28" />
          <span class="logo-text">Zuma<span class="logo-accent">Pos</span></span>
        </NuxtLink>
        <div class="blog-nav-links">
          <NuxtLink to="/blog" class="blog-nav-link">← Blog</NuxtLink>
          <NuxtLink to="/registro" class="blog-nav-cta">Prueba Gratuita</NuxtLink>
        </div>
      </div>
    </nav>

    <!-- Loading -->
    <div v-if="loading" class="article-loading">
      <div class="skeleton-text" style="width: 200px; margin-bottom: 12px"></div>
      <div class="skeleton-text" style="width: 80%; height: 40px; margin-bottom: 16px"></div>
      <div class="skeleton-text" style="width: 60%; margin-bottom: 40px"></div>
      <div class="skeleton-text" style="height: 300px; margin-bottom: 24px"></div>
      <div class="skeleton-text" style="margin-bottom: 12px"></div>
      <div class="skeleton-text" style="width: 90%; margin-bottom: 12px"></div>
      <div class="skeleton-text" style="width: 70%"></div>
    </div>

    <!-- 404 -->
    <div v-else-if="!post" class="article-not-found">
      <span class="blog-empty-icon">🔍</span>
      <h2>Artículo no encontrado</h2>
      <p>El artículo que buscas no existe o fue removido.</p>
      <NuxtLink to="/blog" class="btn-primary" style="margin-top: 20px; display: inline-flex;">Volver al Blog</NuxtLink>
    </div>

    <!-- Artículo -->
    <article v-else class="article-page">
      <!-- Breadcrumb -->
      <div class="article-breadcrumb">
        <NuxtLink to="/">Inicio</NuxtLink>
        <span>›</span>
        <NuxtLink to="/blog">Blog</NuxtLink>
        <span>›</span>
        <span class="current">{{ post.titulo }}</span>
      </div>

      <!-- Header -->
      <header class="article-header">
        <span class="blog-card-cat" :class="`cat-${post.categoria}`">{{ getCategoriaLabel(post.categoria) }}</span>
        <h1>{{ post.titulo }}</h1>
        <p class="article-excerpt">{{ post.extracto }}</p>
        <div class="article-meta">
          <span class="article-author">✍️ {{ post.autor }}</span>
          <span class="article-date">📅 {{ formatDate(post.created_at) }}</span>
        </div>
      </header>

      <!-- Imagen de portada -->
      <div v-if="post.imagen_url" class="article-cover">
        <img :src="post.imagen_url" :alt="post.titulo" />
      </div>

      <!-- Contenido -->
      <div class="article-body" v-html="post.contenido"></div>

      <!-- CTA -->
      <div class="article-cta">
        <h3>¿Listo para modernizar tu negocio?</h3>
        <p>Prueba ZumaPos gratis por 7 días. Sin tarjeta de crédito, sin compromisos.</p>
        <NuxtLink to="/registro" class="btn-primary">
          Probar Gratis 7 días →
        </NuxtLink>
      </div>

      <!-- Artículos Relacionados -->
      <div v-if="relacionados.length > 0" class="article-related">
        <h3>Artículos Relacionados</h3>
        <div class="related-grid">
          <NuxtLink 
            v-for="r in relacionados" 
            :key="r.id" 
            :to="`/blog/${r.slug}`"
            class="related-card"
          >
            <span class="blog-card-cat" :class="`cat-${r.categoria}`">{{ getCategoriaLabel(r.categoria) }}</span>
            <h4>{{ r.titulo }}</h4>
            <p>{{ r.extracto }}</p>
          </NuxtLink>
        </div>
      </div>
    </article>

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

const route = useRoute()
const supabase = useSupabaseClient()
const loading = ref(true)
const post = ref<any>(null)
const relacionados = ref<any[]>([])

const categorias = [
  { value: 'guia', label: 'Guía' },
  { value: 'tips', label: 'Tips' },
  { value: 'equipamiento', label: 'Equipamiento' },
  { value: 'novedades', label: 'Novedades' }
]

function getCategoriaLabel(cat: string) {
  return categorias.find(c => c.value === cat)?.label || cat
}

function formatDate(dateStr: string) {
  return new Date(dateStr).toLocaleDateString('es-CL', { day: 'numeric', month: 'long', year: 'numeric' })
}

onMounted(async () => {
  try {
    const slug = route.params.slug as string

    const { data } = await supabase
      .from('blog_posts')
      .select('*')
      .eq('slug', slug)
      .eq('publicado', true)
      .single()

    post.value = data

    if (data) {
      useHead({
        title: `${data.titulo} - Blog ZumaPos`,
        meta: [
          { name: 'description', content: data.extracto }
        ],
        link: [
          { rel: 'preconnect', href: 'https://fonts.googleapis.com' },
          { rel: 'preconnect', href: 'https://fonts.gstatic.com', crossorigin: '' },
          { rel: 'stylesheet', href: 'https://fonts.googleapis.com/css2?family=JetBrains+Mono:wght@400;700&family=Outfit:wght@300;400;500;600;700;800;900&display=swap' }
        ]
      })

      // Fetch related posts
      const { data: related } = await supabase
        .from('blog_posts')
        .select('id, titulo, slug, extracto, categoria')
        .eq('publicado', true)
        .eq('categoria', data.categoria)
        .neq('id', data.id)
        .order('created_at', { ascending: false })
        .limit(3)

      relacionados.value = related || []
    }
  } catch (e) {
    console.error('Error fetching blog post:', e)
  } finally {
    loading.value = false
  }
})
</script>

<style scoped>
.blog-wrapper {
  min-height: 100vh;
  background: var(--bg);
  color: var(--text);
  font-family: 'Outfit', system-ui, sans-serif;
}

.blog-navbar {
  position: fixed;
  top: 0; left: 0; right: 0;
  z-index: 1000;
  padding: 16px 24px;
  background: rgba(10, 11, 20, 0.85);
  backdrop-filter: blur(20px);
  border-bottom: 1px solid var(--border);
}
.blog-nav-inner { max-width: 1200px; margin: 0 auto; display: flex; align-items: center; justify-content: space-between; }
.blog-nav-logo { display: flex; align-items: center; gap: 10px; text-decoration: none; color: var(--text); font-weight: 700; font-size: 1.2rem; }
.blog-nav-links { display: flex; align-items: center; gap: 16px; }
.blog-nav-link { color: var(--text-muted); text-decoration: none; font-size: 0.9rem; font-weight: 500; transition: color 0.2s; }
.blog-nav-link:hover { color: var(--primary-light); }
.blog-nav-cta { padding: 8px 20px; background: var(--primary); color: white; text-decoration: none; font-size: 0.85rem; font-weight: 600; border-radius: 100px; transition: all 0.2s; }

/* Loading / 404 */
.article-loading, .article-not-found {
  max-width: 800px;
  margin: 0 auto;
  padding: 160px 24px 80px;
  text-align: center;
}

.article-not-found .blog-empty-icon { font-size: 3rem; }
.article-not-found h2 { font-size: 1.5rem; font-weight: 700; margin: 16px 0 8px; }
.article-not-found p { color: var(--text-muted); }

.skeleton-text {
  height: 16px;
  background: linear-gradient(90deg, var(--bg-3) 25%, var(--bg-2) 50%, var(--bg-3) 75%);
  background-size: 200% 100%;
  border-radius: 8px;
  animation: shimmer 1.5s infinite;
}

@keyframes shimmer {
  0% { background-position: 200% 0; }
  100% { background-position: -200% 0; }
}

/* Article */
.article-page {
  max-width: 800px;
  margin: 0 auto;
  padding: 120px 24px 60px;
}

.article-breadcrumb {
  display: flex;
  align-items: center;
  gap: 8px;
  font-size: 0.85rem;
  color: var(--text-subtle);
  margin-bottom: 32px;
  flex-wrap: wrap;
}

.article-breadcrumb a {
  color: var(--text-muted);
  text-decoration: none;
  transition: color 0.2s;
}

.article-breadcrumb a:hover { color: var(--primary-light); }
.article-breadcrumb .current { color: var(--text); font-weight: 500; }

.article-header {
  margin-bottom: 32px;
}

.article-header h1 {
  font-size: 2.4rem;
  font-weight: 800;
  line-height: 1.2;
  margin: 12px 0 16px;
  letter-spacing: -0.03em;
}

.article-excerpt {
  font-size: 1.15rem;
  color: var(--text-muted);
  line-height: 1.6;
  margin-bottom: 20px;
}

.article-meta {
  display: flex;
  gap: 20px;
  font-size: 0.88rem;
  color: var(--text-subtle);
}

.article-cover {
  margin-bottom: 40px;
  border-radius: 16px;
  overflow: hidden;
  border: 1px solid var(--border);
}

.article-cover img {
  width: 100%;
  height: auto;
  display: block;
}

/* Blog Card Cat (shared) */
.blog-card-cat {
  display: inline-block;
  font-size: 0.7rem;
  font-weight: 700;
  text-transform: uppercase;
  letter-spacing: 0.08em;
  padding: 3px 10px;
  border-radius: 100px;
  width: fit-content;
}
.cat-guia { background: rgba(139, 92, 246, 0.15); color: #a78bfa; }
.cat-tips { background: rgba(245, 158, 11, 0.15); color: #fbbf24; }
.cat-equipamiento { background: rgba(6, 182, 212, 0.15); color: #22d3ee; }
.cat-novedades { background: rgba(34, 197, 94, 0.15); color: #4ade80; }

/* Article Body - rendered HTML */
.article-body {
  font-size: 1.05rem;
  line-height: 1.8;
  color: var(--text);
}

.article-body :deep(h2) {
  font-size: 1.6rem;
  font-weight: 700;
  margin: 40px 0 16px;
  letter-spacing: -0.02em;
}

.article-body :deep(h3) {
  font-size: 1.25rem;
  font-weight: 600;
  margin: 32px 0 12px;
}

.article-body :deep(p) {
  margin-bottom: 18px;
  color: var(--text-muted);
}

.article-body :deep(ul), .article-body :deep(ol) {
  margin: 16px 0;
  padding-left: 24px;
}

.article-body :deep(li) {
  margin-bottom: 8px;
  color: var(--text-muted);
}

.article-body :deep(strong) {
  color: var(--text);
  font-weight: 600;
}

.article-body :deep(blockquote) {
  border-left: 3px solid var(--primary);
  padding: 16px 20px;
  margin: 24px 0;
  background: rgba(139, 92, 246, 0.06);
  border-radius: 0 12px 12px 0;
  font-style: italic;
  color: var(--text-muted);
}

.article-body :deep(img) {
  max-width: 100%;
  border-radius: 12px;
  margin: 24px 0;
  border: 1px solid var(--border);
}

/* CTA */
.article-cta {
  margin: 60px 0 40px;
  padding: 40px;
  background: linear-gradient(135deg, rgba(139, 92, 246, 0.1), rgba(6, 182, 212, 0.06));
  border: 1px solid rgba(139, 92, 246, 0.2);
  border-radius: 20px;
  text-align: center;
}

.article-cta h3 {
  font-size: 1.4rem;
  font-weight: 700;
  margin-bottom: 8px;
}

.article-cta p {
  color: var(--text-muted);
  margin-bottom: 20px;
}

/* Related */
.article-related {
  margin-top: 60px;
  padding-top: 40px;
  border-top: 1px solid var(--border);
}

.article-related h3 {
  font-size: 1.2rem;
  font-weight: 700;
  margin-bottom: 20px;
}

.related-grid {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 16px;
}

.related-card {
  background: var(--bg-2);
  border: 1px solid var(--border);
  border-radius: 12px;
  padding: 20px;
  text-decoration: none;
  color: var(--text);
  transition: all 0.25s;
}

.related-card:hover {
  border-color: var(--primary);
  transform: translateY(-2px);
}

.related-card h4 {
  font-size: 0.95rem;
  font-weight: 600;
  margin: 10px 0 6px;
  line-height: 1.35;
}

.related-card p {
  font-size: 0.82rem;
  color: var(--text-muted);
  line-height: 1.5;
  display: -webkit-box;
  -webkit-line-clamp: 2;
  -webkit-box-orient: vertical;
  overflow: hidden;
}

/* Footer */
.blog-footer { border-top: 1px solid var(--border); padding: 40px 24px; background: var(--bg-2); }
.blog-footer-inner { max-width: 1200px; margin: 0 auto; display: flex; align-items: center; justify-content: space-between; }
.blog-footer p { font-size: 0.85rem; color: var(--text-subtle); }

/* Responsive */
@media (max-width: 768px) {
  .article-page { padding: 110px 20px 40px; }
  .article-header h1 { font-size: 1.7rem; }
  .article-excerpt { font-size: 1rem; }
  .article-meta { flex-direction: column; gap: 6px; }
  .related-grid { grid-template-columns: 1fr; }
  .article-cta { padding: 28px 20px; }
  .blog-footer-inner { flex-direction: column; gap: 12px; text-align: center; }
}
</style>
