<template>
  <div>
    <!-- ───── NAVBAR ───── -->
    <nav class="navbar" id="navbar">
      <div class="nav-inner">
        <div class="nav-logo">
          <img src="/landing/logo1.svg" alt="ZumaPos" class="logo-icon" width="28" height="28" />
          <span class="logo-text">Zuma<span class="logo-accent">Pos</span></span>
        </div>
        <ul class="nav-links">
          <li><a href="#features">Características</a></li>
          <li><a href="#how-it-works">Cómo Funciona</a></li>
          <li><a href="#pricing">Planes</a></li>
          <li><a href="#contact">Contacto</a></li>
        </ul>
        <button class="theme-toggle" id="theme-toggle" @click="toggleTheme" aria-label="Cambiar tema" title="Cambiar tema">
          <span class="theme-icon theme-icon-dark">🌙</span>
          <span class="theme-icon theme-icon-light">☀️</span>
        </button>
        <NuxtLink to="/login" class="nav-login">Iniciar Sesión</NuxtLink>
        <NuxtLink to="/registro" class="nav-cta">Prueba Gratuita</NuxtLink>
      </div>
    </nav>

    <!-- ───── HERO ───── -->
    <section class="hero" id="hero">
      <div class="hero-bg-grid"></div>
      <div class="hero-orb orb-1"></div>
      <div class="hero-orb orb-2"></div>
      <div class="hero-orb orb-3"></div>

      <div class="hero-content">
        <div class="hero-badge">
          <span class="badge-dot"></span>
          Sistema de Punto de Venta Moderno · Hecho para Chile
        </div>
        <h1 class="hero-title">
          Vende más rápido.<br />
          Controla mejor.<br />
          <span class="gradient-text">Crece sin límites.</span>
        </h1>
        <p class="hero-subtitle">
          ZumaPos es la solución completa para modernizar tu negocio. Gestiona ventas, inventario y reportes desde una sola pantalla — incluso <strong>sin internet</strong>.
        </p>
        <div class="hero-actions">
          <NuxtLink to="/registro" class="btn-primary" id="hero-demo-btn">
            <span>Probar Gratis 7 días</span>
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <path d="M5 12h14M12 5l7 7-7 7" />
            </svg>
          </NuxtLink>
          <a href="#features" class="btn-ghost">
            Ver características
          </a>
        </div>
        <div class="hero-stats">
          <div class="stat-item">
            <span class="stat-number">3 seg</span>
            <span class="stat-label">Por venta promedio</span>
          </div>
          <div class="stat-divider"></div>
          <div class="stat-item">
            <span class="stat-number">100%</span>
            <span class="stat-label">Offline sin perder datos</span>
          </div>
          <div class="stat-divider"></div>
          <div class="stat-item">
            <span class="stat-number">24/7</span>
            <span class="stat-label">Disponibilidad cloud</span>
          </div>
        </div>
      </div>

      <!-- POS Mockup -->
      <div class="hero-mockup">
        <div class="mockup-screen">
          <div class="mockup-toolbar">
            <span class="toolbar-dot red"></span>
            <span class="toolbar-dot yellow"></span>
            <span class="toolbar-dot green"></span>
            <span class="toolbar-title">ZumaPos · Turno Activo</span>
          </div>
          <div class="mockup-body">
            <div class="mockup-left">
              <div class="mockup-search">
                <span class="search-icon">🔍</span>
                <span class="search-placeholder">Escanear o buscar producto...</span>
                <span class="search-cursor blink">|</span>
              </div>
              <div class="mockup-products">
                <div class="mock-product active">
                  <span class="product-emoji">🥤</span>
                  <div class="product-info">
                    <span class="p-name">Coca-Cola 500ml</span>
                    <span class="p-price">$1.200</span>
                  </div>
                  <span class="p-stock">↑ 48</span>
                </div>
                <div class="mock-product">
                  <span class="product-emoji">🍫</span>
                  <div class="product-info">
                    <span class="p-name">Chocolate Mani</span>
                    <span class="p-price">$850</span>
                  </div>
                  <span class="p-stock">↑ 120</span>
                </div>
                <div class="mock-product">
                  <span class="product-emoji">🧴</span>
                  <div class="product-info">
                    <span class="p-name">Shampoo Head&amp;S</span>
                    <span class="p-price">$4.990</span>
                  </div>
                  <span class="p-stock">↑ 15</span>
                </div>
                <div class="mock-product">
                  <span class="product-emoji">🍞</span>
                  <div class="product-info">
                    <span class="p-name">Pan de Molde</span>
                    <span class="p-price">$2.150</span>
                  </div>
                  <span class="p-stock">↑ 8</span>
                </div>
              </div>
            </div>
            <div class="mockup-right">
              <div class="mockup-cart-title">
                <span>🛒 Carrito</span>
                <span class="cart-badge">3 ítems</span>
              </div>
              <div class="cart-items">
                <div class="cart-item">
                  <span class="ci-name">Coca-Cola 500ml</span>
                  <div class="ci-qty">
                    <span class="qty-btn">−</span>
                    <span class="qty-num">2</span>
                    <span class="qty-btn">+</span>
                  </div>
                  <span class="ci-total">$2.400</span>
                </div>
                <div class="cart-item">
                  <span class="ci-name">Chocolate Mani</span>
                  <div class="ci-qty">
                    <span class="qty-btn">−</span>
                    <span class="qty-num">1</span>
                    <span class="qty-btn">+</span>
                  </div>
                  <span class="ci-total">$850</span>
                </div>
                <div class="cart-item">
                  <span class="ci-name">Pan de Molde</span>
                  <div class="ci-qty">
                    <span class="qty-btn">−</span>
                    <span class="qty-num">1</span>
                    <span class="qty-btn">+</span>
                  </div>
                  <span class="ci-total">$2.150</span>
                </div>
              </div>
              <div class="cart-total-row">
                <span>TOTAL</span>
                <span class="cart-total-amount">$5.400</span>
              </div>
              <div class="payment-methods">
                <div class="pay-btn active">💵 Efectivo</div>
                <div class="pay-btn">💳 Débito</div>
                <div class="pay-btn">📱 QR</div>
              </div>
              <button class="checkout-btn" id="mockup-checkout">
                <span>✓ Cobrar $5.400</span>
              </button>
            </div>
          </div>
        </div>
        <div class="mockup-glow"></div>
      </div>
    </section>

    <!-- ───── LOGOS / PRUEBA SOCIAL ───── -->
    <section class="social-proof">
      <p class="sp-label">Ideal para todo tipo de comercio</p>
      <div class="sp-categories">
        <div class="sp-cat"><span>🏪</span> Minimarket</div>
        <div class="sp-cat"><span>🍕</span> Restorán / Café</div>
        <div class="sp-cat"><span>💊</span> Farmacia</div>
        <div class="sp-cat"><span>👗</span> Boutique / Ropa</div>
        <div class="sp-cat"><span>🔧</span> Ferretería</div>
        <div class="sp-cat"><span>🥩</span> Carnicería</div>
        <div class="sp-cat"><span>🌿</span> Verdulería</div>
        <div class="sp-cat"><span>🐾</span> Veterinaria</div>
      </div>
    </section>

    <!-- ───── FEATURES ───── -->
    <section class="features" id="features">
      <div class="section-header">
        <span class="section-tag">Todo lo que necesitas</span>
        <h2>Un sistema completo para tu negocio</h2>
        <p>Olvídate de cuadernos, planillas y sistemas obsoletos. ZumaPos centraliza todo lo que necesitas para vender con confianza.</p>
      </div>

      <div class="features-grid">
        <div class="feature-card featured" id="feat-pos">
          <div class="feat-icon-wrap">
            <span class="feat-icon">⚡</span>
          </div>
          <h3>Cobro Ultrarrápido Offline</h3>
          <p>Vende en menos de 3 segundos sin importar si se corta el internet. Sincronización transparente y automática cuando vuelve la conexión.</p>
          <ul class="feat-points">
            <li>✓ Tecnología PWA Offline-First probada</li>
            <li>✓ Panel dinámico de Top 20 más vendidos</li>
            <li>✓ Compatible con cualquier lector USB</li>
          </ul>
          <div class="feat-tag">⚡ Ventas a prueba de cortes</div>
        </div>

        <div class="feature-card" id="feat-invoices">
          <div class="feat-icon-wrap">
            <span class="feat-icon">📄</span>
          </div>
          <h3>Ingreso de Facturas Automático</h3>
          <p>Olvídate de digitar la mercadería manualmente. Automatiza tu recepción de inventario y actualiza precios al instante.</p>
          <ul class="feat-points">
            <li>✓ Carga inteligente desde facturas</li>
            <li>✓ Actualización automática de costos</li>
            <li>✓ Cero errores de digitación</li>
          </ul>
        </div>

        <div class="feature-card" id="feat-procurement">
          <div class="feat-icon-wrap">
            <span class="feat-icon">🛒</span>
          </div>
          <h3>Compras Automatizadas</h3>
          <p>Genera órdenes de pedido exactas basadas en faltantes reales. Maneja distintas medidas (Cajas, Displays) sin enredos.</p>
          <ul class="feat-points">
            <li>✓ Generación automática de faltantes</li>
            <li>✓ Multi-unidad de medida por producto</li>
            <li>✓ Envío de órdenes por WhatsApp en 1 clic</li>
          </ul>
        </div>

        <div class="feature-card" id="feat-bi">
          <div class="feat-icon-wrap">
            <span class="feat-icon">📈</span>
          </div>
          <h3>Business Intelligence Avanzado</h3>
          <p>Mide el pulso de tu negocio en tiempo real. Deja de intuir y toma el control total basado en datos duros.</p>
          <ul class="feat-points">
            <li>✓ KPIs: Ticket Promedio y Deudas</li>
            <li>✓ Tendencias de crecimiento mensual (MTD)</li>
            <li>✓ Gráficos interactivos de ventas</li>
          </ul>
        </div>

        <div class="feature-card" id="feat-blind-cashier">
          <div class="feat-icon-wrap">
            <span class="feat-icon">🛡️</span>
          </div>
          <h3>Sistema Anti-Fraude 'Cajero Ciego'</h3>
          <p>Máxima seguridad en el punto de venta. Evita manipulaciones forzando arqueos de caja 100% reales y ciegos.</p>
          <ul class="feat-points">
            <li>✓ Cierre de turno a ciegas para el cajero</li>
            <li>✓ Requiere autorización de administrador</li>
            <li>✓ Detección milimétrica de descuadres</li>
          </ul>
        </div>

        <div class="feature-card" id="feat-credit">
          <div class="feat-icon-wrap">
            <span class="feat-icon">💳</span>
          </div>
          <h3>Control de 'Fiado' (Límites de Crédito)</h3>
          <p>Da crédito a tus clientes de confianza de manera profesional, estableciendo límites estrictos y bloqueos automáticos.</p>
          <ul class="feat-points">
            <li>✓ Límite de crédito estricto por cliente</li>
            <li>✓ Bloqueo inteligente al exceder cupo</li>
            <li>✓ Respaldo Cloud 24/7 de tu información</li>
          </ul>
        </div>
      </div>
    </section>

    <!-- ───── HOW IT WORKS ───── -->
    <section class="how-it-works" id="how-it-works">
      <div class="section-header">
        <span class="section-tag">Simple y rápido</span>
        <h2>Listo para vender en minutos</h2>
        <p>No necesitas ser técnico. ZumaPos está diseñado para que cualquier persona lo use desde el primer día.</p>
      </div>

      <div class="steps-container">
        <div class="step" id="step-1">
          <div class="step-number">01</div>
          <div class="step-content">
            <div class="step-icon">📋</div>
            <h3>Cargamos tus productos</h3>
            <p>Nosotros te ayudamos a ingresar tu catálogo de productos con precios, costos y códigos de barras. En pocas horas está listo.</p>
          </div>
          <div class="step-arrow">→</div>
        </div>

        <div class="step" id="step-2">
          <div class="step-number">02</div>
          <div class="step-content">
            <div class="step-icon">💻</div>
            <h3>Instalamos en tu equipo</h3>
            <p>ZumaPos funciona en cualquier PC o tablet con navegador. Sin instalaciones complicadas, sin hardware especial.</p>
          </div>
          <div class="step-arrow">→</div>
        </div>

        <div class="step" id="step-3">
          <div class="step-number">03</div>
          <div class="step-content">
            <div class="step-icon">🚀</div>
            <h3>¡Empiezas a vender!</h3>
            <p>Tu equipo aprende a usar el sistema en 15 minutos. Soporte incluido para cualquier duda que surja.</p>
          </div>
          <div class="step-arrow last"></div>
        </div>
      </div>
    </section>

    <!-- ───── PRICING ───── -->
    <section class="pricing" id="pricing">
      <div class="section-header">
        <span class="section-tag">Planes accesibles</span>
        <h2>Inversión que se paga sola</h2>
        <p>Un solo sistema reemplaza cuadernos, planillas, errores y tiempo perdido. El retorno es inmediato.</p>
      </div>

      <div class="pricing-grid">
        <div class="price-card" id="price-starter">
          <div class="price-header">
            <span class="price-plan-name">Básico</span>
            <div class="price-amount">
              <span class="price-currency">$</span>
              <span class="price-number">24.990</span>
              <span class="price-period">/mes</span>
            </div>
            <p class="price-desc">Perfecto para comenzar</p>
          </div>
          <ul class="price-features">
            <li><span class="check">✓</span> 1 caja / 1 cajero</li>
            <li><span class="check">✓</span> Hasta 500 productos</li>
            <li><span class="check">✓</span> Ventas y boletas</li>
            <li><span class="check">✓</span> Control de stock</li>
            <li><span class="check">✓</span> Reportes básicos</li>
            <li><span class="check">✓</span> Soporte por WhatsApp</li>
            <li class="disabled"><span>✗</span> Múltiples cajeros</li>
            <li class="disabled"><span>✗</span> Reportes avanzados</li>
          </ul>
          <NuxtLink to="/registro" class="price-btn-ghost">Empezar Gratis</NuxtLink>
        </div>

        <div class="price-card featured" id="price-pro">
          <div class="price-popular">⭐ Más Popular</div>
          <div class="price-header">
            <span class="price-plan-name">Profesional</span>
            <div class="price-amount">
              <span class="price-currency">$</span>
              <span class="price-number">34.990</span>
              <span class="price-period">/mes</span>
            </div>
            <p class="price-desc">Para negocios en crecimiento</p>
          </div>
          <ul class="price-features">
            <li><span class="check">✓</span> Cajeros ilimitados</li>
            <li><span class="check">✓</span> Productos ilimitados</li>
            <li><span class="check">✓</span> Control de turnos</li>
            <li><span class="check">✓</span> Reportes avanzados</li>
            <li><span class="check">✓</span> Impresión etiquetas barras</li>
            <li><span class="check">✓</span> Modo offline completo</li>
            <li><span class="check">✓</span> Respaldo en la nube</li>
            <li><span class="check">✓</span> Soporte prioritario</li>
          </ul>
          <NuxtLink to="/registro" class="price-btn-primary">Probar Plan Pro</NuxtLink>
        </div>

        <div class="price-card" id="price-enterprise">
          <div class="price-header">
            <span class="price-plan-name">A Medida</span>
            <div class="price-amount-custom">
              <span class="price-custom-label">Cotización</span>
              <span class="price-custom-sub">personalizada</span>
            </div>
            <p class="price-desc">Para cadenas y locales múltiples</p>
          </div>
          <ul class="price-features">
            <li><span class="check">✓</span> Todo lo del Pro</li>
            <li><span class="check">✓</span> Múltiples sucursales</li>
            <li><span class="check">✓</span> Integración a tu medida</li>
            <li><span class="check">✓</span> Capacitación presencial</li>
            <li><span class="check">✓</span> SLA garantizado</li>
            <li><span class="check">✓</span> Gestor de cuenta dedicado</li>
            <li><span class="check">✓</span> Mantenimiento incluido</li>
            <li><span class="check">✓</span> Personalización de marca</li>
          </ul>
          <a href="#contact" class="price-btn-ghost">Conversemos</a>
        </div>
      </div>

      <div class="pricing-note">
        <span>🎁</span>
        <p><strong>30 días gratis</strong> en cualquier plan. Sin tarjeta de crédito. Sin compromisos. Si no te convence, no pagas nada.</p>
      </div>
    </section>

    <!-- ───── TESTIMONIALS ───── -->
    <section class="testimonials" id="testimonials">
      <div class="section-header">
        <span class="section-tag">Lo que dicen nuestros clientes</span>
        <h2>Negocios que ya crecen con ZumaPos</h2>
      </div>

      <div class="testimonials-grid">
        <div class="testimonial-card" id="test-1">
          <div class="test-stars">★★★★★</div>
          <p class="test-quote">"Antes llevaba todo en un cuaderno y perdía tiempo contando la caja. Ahora en 2 minutos sé exactamente cuánto vendí y si falta plata."</p>
          <div class="test-author">
            <div class="test-avatar">M</div>
            <div class="test-info">
              <span class="test-name">María González</span>
              <span class="test-business">Minimarket "La Esquina" · Maipu</span>
            </div>
          </div>
        </div>

        <div class="testimonial-card" id="test-2">
          <div class="test-stars">★★★★★</div>
          <p class="test-quote">"Lo mejor fue que funciona sin internet. En mi local a veces falla la fibra óptica y antes perdíamos ventas. Ahora ni nos damos cuenta."</p>
          <div class="test-author">
            <div class="test-avatar" style="background: linear-gradient(135deg, #0ea5e9, #6366f1);">C</div>
            <div class="test-info">
              <span class="test-name">Carlos Herrera</span>
              <span class="test-business">Distribuidora · San Bernardo</span>
            </div>
          </div>
        </div>

        <div class="testimonial-card" id="test-3">
          <div class="test-stars">★★★★★</div>
          <p class="test-quote">"Mis cajeros aprendieron en media hora. El sistema es súper intuitivo y cuando tengo dudas me responden por WhatsApp al tiro."</p>
          <div class="test-author">
            <div class="test-avatar" style="background: linear-gradient(135deg, #f59e0b, #ef4444);">A</div>
            <div class="test-info">
              <span class="test-name">Ana Retamal</span>
              <span class="test-business">Rotisería · Puente Alto</span>
            </div>
          </div>
        </div>
      </div>
    </section>

    <!-- ───── CTA FINAL ───── -->
    <section class="cta-section" id="contact">
      <div class="cta-orb cta-orb-1"></div>
      <div class="cta-orb cta-orb-2"></div>
      <div class="cta-content">
        <span class="section-tag">¿Listo para dar el salto?</span>
        <h2>Moderniza tu negocio hoy mismo</h2>
        <p>Comienza ahora mismo sin esperas. Crea tu cuenta en 1 minuto y empieza a vender.</p>
        <div class="hero-actions" style="justify-content: center; margin-top: 2rem;">
          <NuxtLink to="/registro" class="btn-primary" style="padding: 1.2rem 2.5rem; font-size: 1.2rem;">
            <span>🚀 Crear mi Cuenta Gratis</span>
          </NuxtLink>
        </div>

        <div class="contact-cards">
          <a href="https://wa.me/56961337579?text=Hola!%20quiero%20una%20demo%20de%20ZumaPos"
            class="contact-card whatsapp" id="whatsapp-btn" target="_blank">
            <div class="contact-icon">
              <svg width="32" height="32" viewBox="0 0 24 24" fill="currentColor">
                <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z" />
              </svg>
            </div>
            <div class="contact-info">
              <span class="contact-label">WhatsApp directo</span>
              <span class="contact-value">Escríbenos ahora →</span>
            </div>
          </a>

          <a href="tel:+56961337579" class="contact-card phone" id="phone-btn">
            <div class="contact-icon">📞</div>
            <div class="contact-info">
              <span class="contact-label">Llámanos</span>
              <span class="contact-value">+56 9 6133 7579</span>
            </div>
          </a>

          <div class="contact-card email" id="email-card">
            <div class="contact-icon">✉️</div>
            <div class="contact-info">
              <span class="contact-label">Email</span>
              <span class="contact-value">paulvenci@gmail.com</span>
            </div>
          </div>
        </div>

        <div class="cta-guarantee">
          <span class="guarantee-icon">🛡️</span>
          <p><strong>30 días de prueba gratuita</strong> · Sin tarjeta de crédito · Cancela cuando quieras · Soporte en español</p>
        </div>
      </div>
    </section>

    <!-- ───── FOOTER ───── -->
    <footer class="footer">
      <div class="footer-inner">
        <div class="footer-logo">
          <img src="/landing/logo1.svg" alt="ZumaPos" class="logo-icon" width="28" height="28" />
          <span class="logo-text">Gestor<span class="logo-accent">POS</span></span>
        </div>
        <p class="footer-tagline">El sistema de punto de venta moderno para el comercio chileno.</p>
        <div class="footer-links">
          <a href="#features">Características</a>
          <a href="#pricing">Precios</a>
          <a href="#contact">Contacto</a>
        </div>
        <p class="footer-copy">© {{ new Date().getFullYear() }} ZumaPos · Desarrollado con ❤️ en Chile</p>
      </div>
    </footer>
  </div>
</template>

<script setup lang="ts">
import { onMounted, onUnmounted, ref } from 'vue'
import '~/assets/css/landing-original.css'

definePageMeta({
  layout: false
})

const isDark = ref(true)

useHead({
  link: [
    { rel: 'preconnect', href: 'https://fonts.googleapis.com' },
    { rel: 'preconnect', href: 'https://fonts.gstatic.com', crossorigin: '' },
    { rel: 'stylesheet', href: 'https://fonts.googleapis.com/css2?family=JetBrains+Mono:wght@400;700&family=Outfit:wght@300;400;500;600;700;800;900&display=swap' }
  ]
})

function toggleTheme() {
  isDark.value = !isDark.value
  document.documentElement.classList.toggle('dark', isDark.value)
  localStorage.setItem('gpos-theme', isDark.value ? 'dark' : 'light')
  
  const themeBtn = document.getElementById('theme-toggle')
  if (themeBtn) {
    themeBtn.style.transform = 'rotate(360deg) scale(1.2)'
    setTimeout(() => { themeBtn.style.transform = '' }, 400)
  }
}

onMounted(() => {
  // Theme init
  const saved = localStorage.getItem('gpos-theme')
  if (saved) {
    isDark.value = saved === 'dark'
  } else {
    isDark.value = window.matchMedia('(prefers-color-scheme: dark)').matches
  }
  document.documentElement.classList.toggle('dark', isDark.value)

  // Navbar scroll effect
  const navbar = document.getElementById('navbar')
  const onScroll = () => {
    if (window.scrollY > 20) {
      navbar?.classList.add('scrolled')
    } else {
      navbar?.classList.remove('scrolled')
    }
  }
  window.addEventListener('scroll', onScroll, { passive: true })

  // Fade-in on scroll (IntersectionObserver)
  const fadeEls = document.querySelectorAll(
    '.feature-card, .step, .price-card, .testimonial-card, .sp-cat, .contact-card'
  )
  fadeEls.forEach((el, i) => {
    el.classList.add('fade-in')
    const col = i % 3
    if (col === 1) el.classList.add('fade-in-delay-1')
    if (col === 2) el.classList.add('fade-in-delay-2')
  })

  const observer = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
      if (entry.isIntersecting) {
        entry.target.classList.add('visible')
        observer.unobserve(entry.target)
      }
    })
  }, { threshold: 0.1, rootMargin: '0px 0px -40px 0px' })
  fadeEls.forEach(el => observer.observe(el))

  // Mockup interactions
  const checkoutBtn = document.getElementById('mockup-checkout')
  if (checkoutBtn) {
    checkoutBtn.addEventListener('click', () => {
      checkoutBtn.textContent = '✓ ¡Venta Procesada!'
      checkoutBtn.style.background = 'linear-gradient(135deg, #22c55e, #16a34a)'
      setTimeout(() => {
        checkoutBtn.textContent = '✓ Cobrar $5.400'
        checkoutBtn.style.background = ''
      }, 1800)
    })
  }

  const payBtns = document.querySelectorAll('.pay-btn')
  payBtns.forEach(btn => {
    btn.addEventListener('click', () => {
      payBtns.forEach(b => b.classList.remove('active'))
      btn.classList.add('active')
    })
  })

  function parseCLP(str: string) { return parseInt(str.replace(/\D/g, '')) || 0 }
  function formatCLP(n: number) { return '$' + n.toLocaleString('es-CL') }
  function updateCartTotal() {
    let total = 0
    document.querySelectorAll('.ci-total').forEach(t => { total += parseCLP(t.textContent || '') })
    const el = document.querySelector('.cart-total-amount')
    if (el) el.textContent = formatCLP(total)
    const btn = document.querySelector('.checkout-btn span')
    if (btn) btn.textContent = `✓ Cobrar ${formatCLP(total)}`
  }

  document.querySelectorAll('.cart-item').forEach(item => {
    const qty = item.querySelector('.qty-num')
    const total = item.querySelector('.ci-total')
    if (!qty || !total) return
    const basePrice = parseCLP(total.textContent || '') / parseInt(qty.textContent || '1')

    item.querySelectorAll('.qty-btn').forEach(btn => {
      btn.addEventListener('click', () => {
        let current = parseInt(qty.textContent || '1')
        if (btn.textContent === '+') current = Math.min(current + 1, 99)
        if (btn.textContent === '−') current = Math.max(current - 1, 1)
        qty.textContent = current.toString()
        total.textContent = formatCLP(basePrice * current)
        updateCartTotal()
      })
    })
  })

  // Smooth scroll links
  document.querySelectorAll('a[href^="#"]').forEach(a => {
    a.addEventListener('click', e => {
      const href = a.getAttribute('href')
      if (!href) return
      const target = document.querySelector(href)
      if (target) {
        e.preventDefault()
        target.scrollIntoView({ behavior: 'smooth', block: 'start' })
      }
    })
  })

  // Number counter animation
  function animateCounter(el: Element, target: number, suffix = '', duration = 1200) {
    const start = performance.now()
    const isDecimal = String(target).includes('.')
    function update(now: number) {
      const elapsed = now - start
      const progress = Math.min(elapsed / duration, 1)
      const eased = 1 - Math.pow(1 - progress, 3)
      const value = eased * target
      if (isDecimal) {
        el.textContent = value.toFixed(1) + suffix
      } else {
        el.textContent = Math.floor(value) + suffix
      }
      if (progress < 1) requestAnimationFrame(update)
      else el.textContent = target + suffix
    }
    requestAnimationFrame(update)
  }

  const statsObserver = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
      if (entry.isIntersecting) {
        const statNumbers = entry.target.querySelectorAll('.stat-number')
        statNumbers.forEach(el => {
          const text = el.textContent || ''
          if (text.includes('seg')) animateCounter(el, 3, ' seg')
          else if (text.includes('%')) animateCounter(el, 100, '%')
          else if (text.includes('/7')) {
            (el as HTMLElement).style.animation = 'fadeInScale 0.5s ease forwards'
          }
        })
        statsObserver.unobserve(entry.target)
      }
    })
  }, { threshold: 0.5 })

  const heroStats = document.querySelector('.hero-stats')
  if (heroStats) statsObserver.observe(heroStats)

  // Cleanup on unmount
  onUnmounted(() => {
    window.removeEventListener('scroll', onScroll)
    observer.disconnect()
    statsObserver.disconnect()
  })
})
</script>
