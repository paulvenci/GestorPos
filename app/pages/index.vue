<template>
  <div>
    <!-- ─── HEADER FIJO (Contenedor común para evitar superposición) ─── -->
    <header class="alt-header-wrapper">
      <!-- ─── CONVERSION: Banner de Urgencia (AIDA: Attention) ─── -->
      <div class="alt-urgency">
        🔥 <strong>Lanzamiento:</strong> ¡Plan Gratis de por vida para siempre! Registra tu negocio en 1 minuto y empieza a vender gratis.
      </div>

      <!-- ─── NAVBAR ─── -->
      <nav class="alt-nav" id="alt-navbar">
        <div class="alt-nav-inner">
          <NuxtLink to="/" class="alt-nav-logo">
            <img src="/landing/logo1.svg" alt="ZumaPos" width="28" height="28" />
            <span class="alt-nav-logo-text">Zuma<span class="alt-nav-logo-accent">Pos</span></span>
          </NuxtLink>
          <ul class="alt-nav-links">
            <li><a href="#beneficios">Beneficios</a></li>
            <li><a href="#como-funciona">Cómo Funciona</a></li>
            <li><a href="#planes">Planes</a></li>
            <li><a href="#contacto">Contacto</a></li>
            <li><NuxtLink to="/blog">Blog</NuxtLink></li>
          </ul>
          <div class="alt-nav-actions">
            <button class="alt-theme-toggle" @click="toggleTheme" :aria-label="isDark ? 'Modo claro' : 'Modo oscuro'">
              {{ isDark ? '☀️' : '🌙' }}
            </button>
            <NuxtLink to="/login" class="alt-nav-login" data-track="nav-login" data-section="navbar"><span class="desktop">Iniciar Sesión</span><span class="mobile" style="display:none">Ingresar</span></NuxtLink>
            <NuxtLink to="/registro" class="alt-nav-cta" data-track="nav-cta-comenzar" data-section="navbar">Comenzar Gratis</NuxtLink>
          </div>
        </div>
      </nav>
    </header>

    <!-- ─── HERO con Slider de Fotos ─── -->
    <section class="alt-hero" id="hero">
      <div class="alt-hero-slider">
        <div v-for="(slide, i) in slides" :key="i" class="alt-hero-slide" :class="{ active: currentSlide === i }">
          <img :src="slide.img" :alt="slide.alt" loading="eager" />
        </div>
        <div class="alt-hero-overlay"></div>
      </div>

      <div class="alt-hero-content">
        <div class="alt-hero-tag">
          <span class="alt-hero-tag-dot"></span>
          Hecho para Comerciantes Chilenos · Soporte en Español
        </div>
        <h1>
          Cobra en 3 segundos,<br />
          <span class="accent">aunque se caiga el WiFi.</span>
        </h1>
        <p class="alt-hero-desc">
          El sistema de punto de venta para minimarkets, verdulerías, panaderías y todo el comercio chileno. 
          <strong>Funciona sin internet</strong>, te toma 1 minuto empezar y te ayudamos a cargar tus productos <strong>gratis</strong>.
        </p>

        <!-- Social proof honesto -->
        <div class="alt-hero-proof">
          <div class="alt-hero-proof-item">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"/><polyline points="22 4 12 14.01 9 11.01"/></svg>
            <span>Sin tarjeta de crédito</span>
          </div>
          <div class="alt-hero-proof-item">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"/><polyline points="22 4 12 14.01 9 11.01"/></svg>
            <span>Migración asistida gratis</span>
          </div>
          <div class="alt-hero-proof-item">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"/><polyline points="22 4 12 14.01 9 11.01"/></svg>
            <span>Cancela cuando quieras</span>
          </div>
        </div>

        <div class="alt-hero-actions">
          <NuxtLink to="/registro" class="alt-btn-primary" data-track="hero-cta-comenzar" data-section="hero">
            Crear mi Cuenta Gratis
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><path d="M5 12h14M12 5l7 7-7 7" /></svg>
          </NuxtLink>
          <button type="button" class="alt-btn-secondary alt-btn-play" @click="openDemo" data-track="hero-btn-demo" data-section="hero" aria-label="Ver video demo">
            <span class="alt-play-icon" aria-hidden="true">
              <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor"><path d="M8 5v14l11-7z"/></svg>
            </span>
            Ver demo de 60 segundos
          </button>
        </div>

        <div class="alt-hero-indicators">
          <button v-for="(_, i) in slides" :key="i" class="alt-hero-dot" :class="{ active: currentSlide === i }" @click="currentSlide = i" />
        </div>
      </div>
    </section>

    <!-- ─── RUBROS ─── -->
    <section class="alt-rubros">
      <div class="alt-rubros-inner">
        <p class="alt-rubros-label">Ideal para todo tipo de comercio</p>
        <div class="alt-rubros-grid">
          <div v-for="r in rubros" :key="r.label" class="alt-rubro alt-fade-in">
            <span class="alt-rubro-icon">{{ r.icon }}</span> {{ r.label }}
          </div>
        </div>
      </div>
    </section>

    <!-- ─── CONVERSION: Trust Badges (AIDA: Interest/Trust) ─── -->
    <div class="alt-trust">
      <div class="alt-trust-item"><div class="alt-trust-icon">🔒</div> Datos seguros en la nube</div>
      <div class="alt-trust-item"><div class="alt-trust-icon">⚡</div> Funciona sin internet</div>
      <div class="alt-trust-item"><div class="alt-trust-icon">🇨🇱</div> Hecho en Chile</div>
      <div class="alt-trust-item"><div class="alt-trust-icon">💬</div> Soporte humano por WhatsApp</div>
      <div class="alt-trust-item"><div class="alt-trust-icon">🎁</div> Plan Gratis para siempre</div>
    </div>

    <!-- ─── BENEFICIOS CON FOTOS ─── -->
    <section class="alt-benefits" id="beneficios">
      <div class="alt-container">
        <div class="alt-section-header">
          <span class="alt-section-tag">Por qué ZumaPos</span>
          <h2>Hecho para comerciantes como tú</h2>
          <p>No importa si vendes verduras, pan o artículos de ferretería. ZumaPos se adapta a tu realidad.</p>
        </div>

        <!-- Beneficio 1 -->
        <div class="alt-benefit-row alt-fade-in">
          <div class="alt-benefit-img">
            <img src="/landing/feature-scanner.png" alt="Cajero escaneando productos rápidamente" />
          </div>
          <div class="alt-benefit-content">
            <div class="alt-benefit-icon">⚡</div>
            <h3>Cobra en 3 segundos, con o sin internet</h3>
            <p>Escanea, cobra y listo. Tu negocio nunca se detiene aunque se corte la luz del WiFi.</p>
            <ul class="alt-benefit-checks">
              <li><span class="alt-check">✓</span> Funciona 100% offline</li>
              <li><span class="alt-check">✓</span> Compatible con cualquier lector USB</li>
              <li><span class="alt-check">✓</span> Top 20 productos más vendidos al instante</li>
            </ul>
          </div>
        </div>

        <!-- Beneficio 2 -->
        <div class="alt-benefit-row reverse alt-fade-in">
          <div class="alt-benefit-img">
            <img src="/landing/feature-reportes.png" alt="Dueña revisando reportes de su negocio" />
          </div>
          <div class="alt-benefit-content">
            <div class="alt-benefit-icon">📊</div>
            <h3>Sabe exactamente cuánto vendiste hoy</h3>
            <p>Olvídate de cuadernos y planillas. Reportes claros, ticket promedio, deudas pendientes y tendencias mensuales.</p>
            <ul class="alt-benefit-checks">
              <li><span class="alt-check">✓</span> Dashboard con ventas en tiempo real</li>
              <li><span class="alt-check">✓</span> Ticket promedio y tendencias MTD</li>
              <li><span class="alt-check">✓</span> Control de fiados con límite de crédito</li>
            </ul>
          </div>
        </div>

        <!-- Beneficio 3 -->
        <div class="alt-benefit-row alt-fade-in">
          <div class="alt-benefit-img">
            <img src="/landing/hero-carniceria.png" alt="Carnicero usando balanza y sistema POS" />
          </div>
          <div class="alt-benefit-content">
            <div class="alt-benefit-icon">🛡️</div>
            <h3>Caja segura: el cajero no ve cuánto lleva</h3>
            <p>Sistema "Cajero Ciego" que evita manipulaciones. El arqueo de caja es real y transparente.</p>
            <ul class="alt-benefit-checks">
              <li><span class="alt-check">✓</span> Cierre de turno a ciegas</li>
              <li><span class="alt-check">✓</span> Autorización de administrador obligatoria</li>
              <li><span class="alt-check">✓</span> Detección precisa de descuadres</li>
            </ul>
          </div>
        </div>
      </div>
    </section>

    <!-- ─── CÓMO FUNCIONA ─── -->
    <section class="alt-steps" id="como-funciona">
      <div class="alt-container">
        <div class="alt-section-header">
          <span class="alt-section-tag">Simple y rápido</span>
          <h2>Listo para vender en minutos</h2>
          <p>No necesitas ser técnico. Cualquier persona lo usa desde el primer día.</p>
        </div>
        <div class="alt-steps-grid">
          <div v-for="s in steps" :key="s.num" class="alt-step-card alt-fade-in">
            <div class="alt-step-number">{{ s.num }}</div>
            <h3>{{ s.title }}</h3>
            <p>{{ s.desc }}</p>
          </div>
        </div>
      </div>
    </section>

    <!-- ─── TESTIMONIOS ─── -->
    <section class="alt-testimonials">
      <div class="alt-container">
        <div class="alt-section-header">
          <span class="alt-section-tag">Lo que dicen nuestros clientes</span>
          <h2>Negocios que ya crecen con ZumaPos</h2>
        </div>
        <div class="alt-testimonials-grid">
          <div v-for="t in testimonials" :key="t.name" class="alt-test-card alt-fade-in">
            <div class="alt-test-stars">★★★★★</div>
            <p class="alt-test-quote">"{{ t.quote }}"</p>
            <div class="alt-test-author">
              <div class="alt-test-avatar" :style="t.avatarStyle">{{ t.initial }}</div>
              <div>
                <div class="alt-test-name">{{ t.name }}</div>
                <div class="alt-test-biz">{{ t.biz }}</div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>

    <!-- ─── PLANES ─── -->
    <section class="alt-pricing" id="planes">
      <div class="alt-container">
        <div class="alt-section-header">
          <span class="alt-section-tag">Planes accesibles</span>
          <h2>Inversión que se paga sola</h2>
          <p>Un solo sistema reemplaza cuadernos, planillas, errores y tiempo perdido.</p>
        </div>
        <div class="alt-pricing-grid">
          <!-- Gratis -->
          <div class="alt-price-card alt-fade-in">
            <div class="alt-price-name">Gratis</div>
            <div class="alt-price-amount"><span class="currency">$</span>0<span class="period">/de por vida</span></div>
            <div class="alt-price-desc">Ideal para kioscos y emprendedores</div>
            <ul class="alt-price-features">
              <li><span class="check">✓</span> 1 caja / 1 usuario</li>
              <li><span class="check">✓</span> Hasta 100 productos</li>
              <li><span class="check">✓</span> Hasta 300 ventas al mes</li>
              <li><span class="check">✓</span> Registro de clientes básico</li>
              <li><span class="check">✓</span> Reporte diario simple</li>
              <li class="disabled"><span class="check">✗</span> Reportes avanzados</li>
              <li class="disabled"><span class="check">✗</span> Inventario multi-sucursal</li>
              <li class="disabled"><span class="check">✗</span> Soporte prioritario</li>
            </ul>
            <NuxtLink to="/registro" class="alt-price-btn" data-track="plan-gratis-cta" data-section="planes">Comenzar Gratis</NuxtLink>
          </div>
          <!-- Básico -->
          <div class="alt-price-card alt-fade-in alt-fade-delay-1">
            <div class="alt-price-name">Básico</div>
            <div class="alt-price-amount"><span class="currency">$</span>24.990<span class="period">/mes</span></div>
            <div class="alt-price-desc">Perfecto para pequeños negocios</div>
            <ul class="alt-price-features">
              <li><span class="check">✓</span> 1 caja / 1 usuario</li>
              <li><span class="check">✓</span> Productos ilimitados</li>
              <li><span class="check">✓</span> Hasta 1.500 ventas al mes</li>
              <li><span class="check">✓</span> Reportes detallados</li>
              <li><span class="check">✓</span> Impresión de etiquetas</li>
              <li><span class="check">✓</span> Soporte por WhatsApp</li>
              <li class="disabled"><span class="check">✗</span> Múltiples usuarios/cajas</li>
              <li class="disabled"><span class="check">✗</span> Inventario multi-sucursal</li>
            </ul>
            <NuxtLink to="/registro" class="alt-price-btn" data-track="plan-basico-cta" data-section="planes">Elegir Plan Básico</NuxtLink>
          </div>
          <!-- Pro -->
          <div class="alt-price-card featured alt-fade-in alt-fade-delay-2">
            <div class="alt-price-popular">⭐ Más Recomendado</div>
            <div class="alt-price-name">Pro</div>
            <div class="alt-price-amount"><span class="currency">$</span>34.990<span class="period">/mes</span></div>
            <div class="alt-price-desc">Para negocios y sucursales en crecimiento</div>
            <ul class="alt-price-features">
              <li><span class="check">✓</span> Usuarios y cajas ilimitados</li>
              <li><span class="check">✓</span> Productos y ventas ilimitados</li>
              <li><span class="check">✓</span> Control de stock avanzado</li>
              <li><span class="check">✓</span> Inventario multi-sucursal</li>
              <li><span class="check">✓</span> Reportes avanzados y gráficos</li>
              <li><span class="check">✓</span> Impresión de etiquetas</li>
              <li><span class="check">✓</span> Soporte prioritario 24/7</li>
              <li><span class="check">✓</span> Funcionamiento 100% Offline</li>
            </ul>
            <NuxtLink to="/registro" class="alt-price-btn primary" data-track="plan-pro-cta" data-section="planes">Elegir Plan Pro</NuxtLink>
          </div>
        </div>
        <div class="alt-pricing-note">
          <span>🎁</span> <strong>Comienza gratis sin tarjeta de crédito.</strong> Paga sólo si tu negocio crece y necesitas más capacidad.
        </div>
      </div>
    </section>

    <!-- ─── CTA FINAL ─── -->
    <section class="alt-cta" id="contacto">
      <div class="alt-container">
        <h2>¿Listo para modernizar tu negocio?</h2>
        <p>Crea tu cuenta en 1 minuto y empieza a vender hoy mismo.</p>
        <div class="alt-cta-actions">
          <NuxtLink to="/registro" class="alt-cta-btn" data-track="cta-final-comenzar" data-section="cta-final">🚀 Crear mi Cuenta Gratis</NuxtLink>
          <a href="https://wa.me/56961337579?text=Hola!%20quiero%20una%20demo%20de%20ZumaPos" target="_blank" class="alt-cta-wa" data-track="cta-final-whatsapp" data-section="cta-final">
            <svg viewBox="0 0 24 24" fill="currentColor"><path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z"/></svg>
            Escríbenos por WhatsApp
          </a>
        </div>
        <div class="alt-cta-contacts">
          <a href="tel:+56961337579" class="alt-cta-contact" data-track="cta-final-telefono" data-section="cta-final">📞 +56 9 6133 7579</a>
          <span class="alt-cta-contact">✉️ contacto@zumapos.cl</span>
        </div>
        <div class="alt-cta-guarantee">🛡️ Plan Gratis de por vida · Sin tarjeta de crédito · Soporte en español</div>
      </div>
    </section>

    <!-- ─── FOOTER ─── -->
    <footer class="alt-footer">
      <div class="alt-footer-logo">
        <img src="/landing/logo1.svg" alt="ZumaPos" width="24" height="24" />
        <span>Zuma<span class="accent">Pos</span></span>
      </div>
      <div class="alt-footer-links">
        <a href="#beneficios">Beneficios</a>
        <a href="#planes">Planes</a>
        <a href="#contacto">Contacto</a>
        <NuxtLink to="/blog">Blog</NuxtLink>
      </div>
      <p>© {{ new Date().getFullYear() }} ZumaPos · Desarrollado con ❤️ en Chile</p>
    </footer>

    <!-- WhatsApp Floating -->
    <a href="https://wa.me/56961337579?text=Hola!%20quiero%20más%20información%20de%20ZumaPos" class="alt-wa-float" target="_blank" rel="noopener" aria-label="WhatsApp" data-track="whatsapp-float" data-section="floating">
      <svg viewBox="0 0 24 24" fill="currentColor"><path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z"/></svg>
    </a>

    <!-- CONVERSION: Sticky Mobile CTA (AIDA: Action) -->
    <div class="alt-sticky-cta">
      <NuxtLink to="/registro" data-track="sticky-cta-comenzar" data-section="sticky-mobile"><span>🚀 Crear mi Cuenta Gratis</span></NuxtLink>
    </div>

    <!-- DEMO MODAL -->
    <Teleport to="body">
      <Transition name="demo-fade">
        <div v-if="showDemo" class="demo-modal" role="dialog" aria-modal="true" aria-label="Demo ZumaPos" @click.self="closeDemo" @keydown.esc="closeDemo">
          <div class="demo-modal-backdrop" @click="closeDemo"></div>
          <div class="demo-modal-content">
            <button class="demo-modal-close" @click="closeDemo" aria-label="Cerrar demo" data-track="demo-modal-close">×</button>
            <div class="demo-modal-header">
              <span class="demo-modal-badge">▶ DEMO</span>
              <h3>Así se ve ZumaPos en tu negocio</h3>
              <p>60 segundos · Sin registro · Conoce las funciones clave</p>
            </div>
            <div class="demo-modal-video">
              <video ref="demoVideo" controls playsinline preload="metadata" poster="/landing/demo-poster.jpg">
                <source src="/landing/demo.mp4" type="video/mp4">
                Tu navegador no soporta video HTML5.
                <a href="/landing/demo.mp4">Descargar demo</a>
              </video>
            </div>
            <div class="demo-modal-cta">
              <NuxtLink to="/registro" class="alt-btn-primary" @click="closeDemo" data-track="demo-modal-cta">
                Crear mi Cuenta Gratis
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><path d="M5 12h14M12 5l7 7-7 7" /></svg>
              </NuxtLink>
              <span class="demo-modal-note">✓ Sin tarjeta de crédito · Cancela cuando quieras</span>
            </div>
          </div>
        </div>
      </Transition>
    </Teleport>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted, onUnmounted } from 'vue'
import '~/assets/css/landing-alt.css'

definePageMeta({ layout: false })

useHead({
  title: 'ZumaPos · Punto de Venta para tu Negocio',
  meta: [
    { name: 'description', content: 'Sistema de punto de venta moderno para minimarkets, verdulerías, panaderías y todo tipo de comercio en Chile. Funciona sin internet.' },
    { name: 'keywords', content: 'punto de venta, POS, sistema POS, punto de venta Chile, software para minimarket, software para verdulería, software para panadería, sistema para kiosco, punto de venta sin internet, POS offline, caja registradora, control de inventario, reportes de ventas, control de fiados, caja ciega, cajero ciego, arqueo de caja, multi sucursal, impresión de etiquetas, lector de código de barras, balanza, ZUMA POS, ZUMAPOS, comercio chileno, pyme Chile, emprendedores Chile' }
  ],
  link: [
    { rel: 'preconnect', href: 'https://fonts.googleapis.com' },
    { rel: 'preconnect', href: 'https://fonts.gstatic.com', crossorigin: '' },
    { rel: 'stylesheet', href: 'https://fonts.googleapis.com/css2?family=Outfit:wght@300;400;500;600;700;800;900&display=swap' }
  ]
})

const isDark = ref(true)
const currentSlide = ref(0)
const showDemo = ref(false)
const demoVideo = ref<HTMLVideoElement | null>(null)
let slideInterval: ReturnType<typeof setInterval> | null = null

function openDemo() {
  showDemo.value = true
  document.body.style.overflow = 'hidden'
}

function closeDemo() {
  showDemo.value = false
  document.body.style.overflow = ''
  if (demoVideo.value) {
    demoVideo.value.pause()
    demoVideo.value.currentTime = 0
  }
}

const slides = [
  { img: '/landing/hero-verduleria.png', alt: 'Verdulería usando ZumaPos' },
  { img: '/landing/hero-panaderia.png', alt: 'Panadería con sistema POS moderno' },
  { img: '/landing/hero-minimarket.png', alt: 'Minimarket atendiendo con ZumaPos' },
  { img: '/landing/hero-carniceria.png', alt: 'Carnicería con punto de venta digital' },
]

const rubros = [
  { icon: '🏪', label: 'Minimarket' },
  { icon: '🥬', label: 'Verdulería' },
  { icon: '🍞', label: 'Panadería' },
  { icon: '🥩', label: 'Carnicería' },
  { icon: '🍕', label: 'Restorán / Café' },
  { icon: '💊', label: 'Farmacia' },
  { icon: '👗', label: 'Boutique' },
  { icon: '🔧', label: 'Ferretería' },
  { icon: '🐾', label: 'Veterinaria' },
]

const steps = [
  { num: '1', title: 'Cargamos tus productos', desc: 'Te ayudamos a ingresar tu catálogo con precios, costos y códigos de barras. En pocas horas queda listo.' },
  { num: '2', title: 'Instalamos en tu equipo', desc: 'Funciona en cualquier PC o tablet con navegador. Sin instalaciones complicadas ni hardware especial.' },
  { num: '3', title: '¡Empiezas a vender!', desc: 'Tu equipo aprende en 15 minutos. Soporte incluido para cualquier duda que surja.' },
]

const testimonials = [
  { quote: 'Antes llevaba todo en un cuaderno y perdía tiempo contando la caja. Ahora en 2 minutos sé exactamente cuánto vendí.', name: 'María González', biz: 'Minimarket "La Esquina" · Maipú', initial: 'M', avatarStyle: '' },
  { quote: 'Lo mejor fue que funciona sin internet. En mi local a veces falla la fibra óptica y antes perdíamos ventas.', name: 'Carlos Herrera', biz: 'Distribuidora · San Bernardo', initial: 'C', avatarStyle: 'background: linear-gradient(135deg, #0ea5e9, #6366f1)' },
  { quote: 'Mis cajeros aprendieron en media hora. El sistema es súper intuitivo y cuando tengo dudas me responden al tiro.', name: 'Ana Retamal', biz: 'Rotisería · Puente Alto', initial: 'A', avatarStyle: 'background: linear-gradient(135deg, #f59e0b, #ef4444)' },
]

function toggleTheme() {
  isDark.value = !isDark.value
  document.documentElement.classList.toggle('dark', isDark.value)
  localStorage.setItem('gpos-theme', isDark.value ? 'dark' : 'light')
}

function startSlider() {
  slideInterval = setInterval(() => {
    currentSlide.value = (currentSlide.value + 1) % slides.length
  }, 5000)
}

onMounted(() => {
  // Theme
  const saved = localStorage.getItem('gpos-theme')
  isDark.value = saved ? saved === 'dark' : window.matchMedia('(prefers-color-scheme: dark)').matches
  document.documentElement.classList.toggle('dark', isDark.value)

  // Navbar scroll
  const navbar = document.getElementById('alt-navbar')
  const onScroll = () => navbar?.classList.toggle('scrolled', window.scrollY > 20)
  window.addEventListener('scroll', onScroll, { passive: true })

  // Slider
  startSlider()

  // Fade-in observer
  const fadeEls = document.querySelectorAll('.alt-fade-in')
  const observer = new IntersectionObserver((entries) => {
    entries.forEach(e => { if (e.isIntersecting) { e.target.classList.add('visible'); observer.unobserve(e.target) } })
  }, { threshold: 0.1, rootMargin: '0px 0px -40px 0px' })
  fadeEls.forEach(el => observer.observe(el))

  // Smooth scroll
  document.querySelectorAll('a[href^="#"]').forEach(a => {
    a.addEventListener('click', e => {
      const href = a.getAttribute('href')
      if (!href) return
      const target = document.querySelector(href)
      if (target) { e.preventDefault(); target.scrollIntoView({ behavior: 'smooth', block: 'start' }) }
    })
  })

  onUnmounted(() => {
    window.removeEventListener('scroll', onScroll)
    observer.disconnect()
    if (slideInterval) clearInterval(slideInterval)
  })
})
</script>
