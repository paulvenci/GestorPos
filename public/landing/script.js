/* ═══════════════════════════════════
   GestorPOS Landing · JavaScript
═══════════════════════════════════ */

// ── Theme Toggle (Claro / Oscuro) ──
const html = document.documentElement;
const themeBtn = document.getElementById('theme-toggle');

// Determina tema inicial:
// 1. Si hay preferencia guardada la usa
// 2. Si no, respeta la preferencia del sistema operativo
function getInitialTheme() {
  const saved = localStorage.getItem('gpos-theme');
  if (saved) return saved;
  return window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
}

function applyTheme(theme) {
  if (theme === 'dark') {
    html.classList.add('dark');
  } else {
    html.classList.remove('dark');
  }
  localStorage.setItem('gpos-theme', theme);
}

// Aplica al cargar
applyTheme(getInitialTheme());

// Toggle al hacer clic
themeBtn?.addEventListener('click', () => {
  const isDark = html.classList.contains('dark');
  applyTheme(isDark ? 'light' : 'dark');

  // Micro animación del botón
  themeBtn.style.transform = 'rotate(360deg) scale(1.2)';
  setTimeout(() => { themeBtn.style.transform = ''; }, 400);
});

// ── Navbar scroll effect ──
const navbar = document.getElementById('navbar');
window.addEventListener('scroll', () => {
  if (window.scrollY > 20) {
    navbar.classList.add('scrolled');
  } else {
    navbar.classList.remove('scrolled');
  }
}, { passive: true });

// ── Fade-in on scroll (IntersectionObserver) ──
const fadeEls = document.querySelectorAll(
  '.feature-card, .step, .price-card, .testimonial-card, .sp-cat, .contact-card'
);

fadeEls.forEach((el, i) => {
  el.classList.add('fade-in');
  // stagger by column position
  const col = i % 3;
  if (col === 1) el.classList.add('fade-in-delay-1');
  if (col === 2) el.classList.add('fade-in-delay-2');
});

const observer = new IntersectionObserver((entries) => {
  entries.forEach(entry => {
    if (entry.isIntersecting) {
      entry.target.classList.add('visible');
      observer.unobserve(entry.target);
    }
  });
}, { threshold: 0.1, rootMargin: '0px 0px -40px 0px' });

fadeEls.forEach(el => observer.observe(el));

// ── Mockup: checkout button celebration ──
const checkoutBtn = document.getElementById('mockup-checkout');
if (checkoutBtn) {
  checkoutBtn.addEventListener('click', () => {
    checkoutBtn.textContent = '✓ ¡Venta Procesada!';
    checkoutBtn.style.background = 'linear-gradient(135deg, #22c55e, #16a34a)';
    setTimeout(() => {
      checkoutBtn.textContent = '✓ Cobrar $5.400';
      checkoutBtn.style.background = '';
    }, 1800);
  });
}

// ── Mockup: payment method toggle ──
const payBtns = document.querySelectorAll('.pay-btn');
payBtns.forEach(btn => {
  btn.addEventListener('click', () => {
    payBtns.forEach(b => b.classList.remove('active'));
    btn.classList.add('active');
  });
});

// ── Mockup: cart qty buttons ──
document.querySelectorAll('.cart-item').forEach(item => {
  const qty = item.querySelector('.qty-num');
  const total = item.querySelector('.ci-total');
  const name = item.querySelector('.ci-name').textContent;

  // parse base price from initial total / qty
  const basePrice = parseCLP(total.textContent) / parseInt(qty.textContent);

  item.querySelectorAll('.qty-btn').forEach(btn => {
    btn.addEventListener('click', () => {
      let current = parseInt(qty.textContent);
      if (btn.textContent === '+') current = Math.min(current + 1, 99);
      if (btn.textContent === '−') current = Math.max(current - 1, 1);
      qty.textContent = current;
      total.textContent = formatCLP(basePrice * current);
      updateCartTotal();
    });
  });
});

function parseCLP(str) {
  return parseInt(str.replace(/\D/g, '')) || 0;
}

function formatCLP(n) {
  return '$' + n.toLocaleString('es-CL');
}

function updateCartTotal() {
  let total = 0;
  document.querySelectorAll('.ci-total').forEach(t => {
    total += parseCLP(t.textContent);
  });
  const el = document.querySelector('.cart-total-amount');
  if (el) el.textContent = formatCLP(total);
  const btn = document.querySelector('.checkout-btn span');
  if (btn) btn.textContent = `✓ Cobrar ${formatCLP(total)}`;
}

// ── Smooth section highlight on nav click ──
document.querySelectorAll('a[href^="#"]').forEach(a => {
  a.addEventListener('click', e => {
    const target = document.querySelector(a.getAttribute('href'));
    if (target) {
      e.preventDefault();
      target.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
  });
});

// ── Number counter animation for stats ──
function animateCounter(el, target, suffix = '', duration = 1200) {
  const start = performance.now();
  const isDecimal = String(target).includes('.');

  function update(now) {
    const elapsed = now - start;
    const progress = Math.min(elapsed / duration, 1);
    const eased = 1 - Math.pow(1 - progress, 3); // ease out cubic
    const value = eased * target;

    if (isDecimal) {
      el.textContent = value.toFixed(1) + suffix;
    } else {
      el.textContent = Math.floor(value) + suffix;
    }

    if (progress < 1) requestAnimationFrame(update);
    else el.textContent = target + suffix;
  }
  requestAnimationFrame(update);
}

// Observe stats and animate when visible
const statsObserver = new IntersectionObserver((entries) => {
  entries.forEach(entry => {
    if (entry.isIntersecting) {
      const statNumbers = entry.target.querySelectorAll('.stat-number');
      statNumbers.forEach(el => {
        const text = el.textContent;
        if (text.includes('seg')) animateCounter(el, 3, ' seg');
        else if (text.includes('%')) animateCounter(el, 100, '%');
        else if (text.includes('/7')) {
          // 24/7 — just pop in
          el.style.animation = 'fadeInScale 0.5s ease forwards';
        }
      });
      statsObserver.unobserve(entry.target);
    }
  });
}, { threshold: 0.5 });

const heroStats = document.querySelector('.hero-stats');
if (heroStats) statsObserver.observe(heroStats);

// ── WhatsApp contact — update phone number ──
// If you need to update the number, change it here:
const WA_NUMBER = '56912345678'; // <-- Cambia este número
document.querySelectorAll('[href*="wa.me"]').forEach(el => {
  const url = new URL(el.href);
  el.href = `https://wa.me/${WA_NUMBER}?text=${encodeURIComponent('Hola! Me interesa conocer GestorPOS. ¿Pueden mostrarme una demo gratuita?')}`;
});

console.log('%c⚡ GestorPOS', 'font-size:24px;font-weight:900;color:#8b5cf6;');
console.log('%cSistema de Punto de Venta Moderno', 'color:#6366f1;font-size:14px;');
