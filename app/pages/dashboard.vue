<template>
  <div class="landing-page" :class="{ 'dark-mode': isDark }">
    <!-- Navbar -->
    <nav class="navbar">
      <div class="nav-content">
        <div class="nav-brand">
          <span class="brand-icon">⚡</span>
          <span class="brand-name">ZumaPos</span>
        </div>
        <div class="nav-links">
          <a href="#features">Características</a>
          <a href="#benefits">Beneficios</a>
          <a href="#pricing">Precios</a>
        </div>
        <div class="nav-actions">
          <!-- Theme Toggle -->
          <button class="theme-toggle" @click="toggleTheme" aria-label="Cambiar tema">
            <i class="pi" :class="isDark ? 'pi-sun' : 'pi-moon'"></i>
          </button>
          
          <NuxtLink to="/login" class="nav-login">
            Iniciar Sesión
          </NuxtLink>
          <NuxtLink to="/registro" class="nav-cta">
            Comenzar Gratis
          </NuxtLink>
        </div>
      </div>
    </nav>

    <!-- Hero Section -->
    <section class="hero">
      <div class="hero-content">
        <div class="hero-badge">🚀 El futuro de tu negocio empieza hoy</div>
        <h1 class="hero-title">
          Vende más rápido.<br />
          <span class="gradient-text">Gestiona mejor.</span>
        </h1>
        <p class="hero-subtitle">
          El sistema de Punto de Venta (POS) en la nube diseñado para minimizar tiempos de espera, optimizar tu inventario y aumentar tus ganancias. Funciona offline y online.
        </p>
        <div class="hero-actions">
          <NuxtLink to="/registro" class="btn-primary">
            Prueba de 7 Días Gratis <i class="pi pi-arrow-right"></i>
          </NuxtLink>
          <NuxtLink to="/demo" class="btn-secondary">
            Ver Demo
          </NuxtLink>
        </div>
        
        <div class="hero-stats">
          <div class="stat-item">
            <strong>+500</strong>
            <span>Negocios</span>
          </div>
          <div class="stat-item">
            <strong>99.9%</strong>
            <span>Uptime</span>
          </div>
          <div class="stat-item">
            <strong>24/7</strong>
            <span>Soporte</span>
          </div>
        </div>
      </div>

      <div class="hero-visual">
        <div class="pos-mockup">
          <div class="mockup-header">
            <div class="mockup-dots"><span></span><span></span><span></span></div>
            <div class="mockup-url">zumapos.cl/pos</div>
          </div>
          <div class="mockup-body">
            <div class="mockup-sidebar">
              <div class="mockup-item active"></div>
              <div class="mockup-item"></div>
              <div class="mockup-item"></div>
            </div>
            <div class="mockup-main">
              <div class="mockup-grid">
                <div v-for="i in 6" :key="i" class="mockup-card"></div>
              </div>
            </div>
            <div class="mockup-cart">
              <div class="mockup-cart-title"></div>
              <div v-for="i in 3" :key="'c'+i" class="mockup-cart-item"></div>
              <div class="mockup-cart-total"></div>
              <div class="mockup-cart-btn"></div>
            </div>
          </div>
        </div>
        <!-- Decorative elements -->
        <div class="blob blob-1"></div>
        <div class="blob blob-2"></div>
      </div>
    </section>

    <!-- Features Section -->
    <section id="features" class="features">
      <div class="section-header">
        <h2>Todo lo que necesitas para crecer</h2>
        <p>Herramientas potentes, interfaz simple. Sin complicaciones.</p>
      </div>

      <div class="features-grid">
        <div class="feature-card">
          <div class="feature-icon bg-blue">
            <i class="pi pi-wifi"></i>
          </div>
          <h3>Offline First</h3>
          <p>Sigue vendiendo incluso si se cae el internet. Los datos se sincronizan automáticamente cuando vuelve la conexión.</p>
        </div>

        <div class="feature-card">
          <div class="feature-icon bg-green">
            <i class="pi pi-box"></i>
          </div>
          <h3>Inventario Inteligente</h3>
          <p>Control de stock en tiempo real, alertas de productos críticos y carga masiva mediante facturas XML.</p>
        </div>

        <div class="feature-card">
          <div class="feature-icon bg-purple">
            <i class="pi pi-chart-bar"></i>
          </div>
          <h3>Métricas en Tiempo Real</h3>
          <p>Dashboard avanzado con gráficos de tendencias, ticket promedio y reportes de ventas diarios y mensuales.</p>
        </div>

        <div class="feature-card">
          <div class="feature-icon bg-orange">
            <i class="pi pi-users"></i>
          </div>
          <h3>Cuentas por Cobrar</h3>
          <p>Gestiona clientes recurrentes, otorga líneas de crédito y mantén un control estricto sobre las deudas.</p>
        </div>
      </div>
    </section>

    <!-- Call to Action -->
    <section class="cta-section">
      <div class="cta-content">
        <h2>¿Listo para modernizar tu negocio?</h2>
        <p>Únete a los cientos de negocios que ya han transformado su operación con ZumaPos.</p>
        <NuxtLink to="/registro" class="btn-primary btn-large">
          Crear mi cuenta gratis
        </NuxtLink>
      </div>
    </section>

    <!-- Footer -->
    <footer class="footer">
      <div class="footer-content">
        <div class="footer-brand">
          <div class="nav-brand">
            <span class="brand-icon">⚡</span>
            <span class="brand-name">ZumaPos</span>
          </div>
          <p>El sistema POS inteligente para negocios modernos.</p>
        </div>
        <div class="footer-links">
          <div class="link-group">
            <h4>Producto</h4>
            <a href="#features">Características</a>
            <a href="#pricing">Precios</a>
          </div>
          <div class="link-group">
            <h4>Soporte</h4>
            <a href="#">Centro de Ayuda</a>
            <a href="#">Contacto</a>
          </div>
          <div class="link-group">
            <h4>Legal</h4>
            <a href="#">Términos</a>
            <a href="#">Privacidad</a>
          </div>
        </div>
      </div>
      <div class="footer-bottom">
        <p>&copy; {{ new Date().getFullYear() }} ZumaPos. Todos los derechos reservados.</p>
      </div>
    </footer>
  </div>
</template>

<script setup lang="ts">
import '~/assets/css/landing.css'

definePageMeta({
  layout: false
})

const isDark = ref(false)

onMounted(() => {
  // Check system preference or localStorage
  const savedTheme = localStorage.getItem('zumapos-theme')
  if (savedTheme) {
    isDark.value = savedTheme === 'dark'
  } else {
    isDark.value = window.matchMedia('(prefers-color-scheme: dark)').matches
  }
})

const toggleTheme = () => {
  isDark.value = !isDark.value
  localStorage.setItem('zumapos-theme', isDark.value ? 'dark' : 'light')
}
</script>
