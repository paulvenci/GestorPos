<template>
  <div class="pos-layout-wrapper">
    <!-- Backdrop overlay (mobile) -->
    <div 
      v-if="sidebarOpen" 
      class="pos-sidebar-backdrop" 
      @click="sidebarOpen = false" 
    />

    <!-- Botón hamburguesa (mobile) -->
    <button class="pos-hamburger" @click="sidebarOpen = !sidebarOpen">
      <i :class="sidebarOpen ? 'pi pi-times' : 'pi pi-bars'" />
    </button>

    <!-- Sidebar de Navegación -->
    <aside class="pos-sidebar" :class="{ 'pos-sidebar--open': sidebarOpen }">
      <div class="pos-sidebar-logo">
        <div class="pos-sidebar-logo-inner">
          <span class="pos-logo-icon">⚡</span>
          <span class="pos-logo-text">GestorPOS</span>
        </div>
        <Button 
          :icon="isDark ? 'pi pi-sun' : 'pi pi-moon'" 
          text 
          rounded 
          severity="secondary"
          @click="toggleDark"
          :title="isDark ? 'Modo claro' : 'Modo oscuro'"
        />
      </div>

      <nav class="pos-sidebar-nav">
        <NuxtLink to="/" class="pos-nav-item" active-class="pos-nav-item--active" @click="closeMobile">
          <i class="pi pi-home" />
          <span>Dashboard</span>
        </NuxtLink>
        <NuxtLink to="/pos" class="pos-nav-item" active-class="pos-nav-item--active" @click="closeMobile">
          <i class="pi pi-shopping-cart" />
          <span>Punto de Venta</span>
        </NuxtLink>
        <NuxtLink to="/caja" class="pos-nav-item" active-class="pos-nav-item--active" @click="closeMobile">
          <i class="pi pi-wallet" />
          <span>Caja</span>
        </NuxtLink>
        <NuxtLink to="/admin/productos" class="pos-nav-item" active-class="pos-nav-item--active" @click="closeMobile">
          <i class="pi pi-box" />
          <span>Inventario</span>
        </NuxtLink>
        <NuxtLink to="/admin/ajuste-stock" class="pos-nav-item" active-class="pos-nav-item--active" @click="closeMobile">
          <i class="pi pi-sync" />
          <span>Ajuste Stock</span>
        </NuxtLink>
        <NuxtLink to="/admin/categorias" class="pos-nav-item" active-class="pos-nav-item--active" @click="closeMobile">
          <i class="pi pi-tags" />
          <span>Categorías</span>
        </NuxtLink>
        <NuxtLink to="/admin/reportes" class="pos-nav-item" active-class="pos-nav-item--active" @click="closeMobile">
          <i class="pi pi-chart-bar" />
          <span>Reportes</span>
        </NuxtLink>

        <div class="pos-nav-divider" />

        <NuxtLink to="/admin/configuracion" class="pos-nav-item" active-class="pos-nav-item--active" @click="closeMobile">
          <i class="pi pi-cog" />
          <span>Configuración</span>
        </NuxtLink>
      </nav>

      <div class="pos-sidebar-footer">
        <div class="pos-user-info">
          <Avatar icon="pi pi-user" shape="circle" class="pos-avatar" />
          <div>
            <p class="pos-user-name">{{ authStore.nombreUsuario }}</p>
            <p class="pos-user-role">{{ authStore.rolUsuario }}</p>
          </div>
        </div>
        <Button
          icon="pi pi-sign-out"
          text
          severity="danger"
          class="pos-logout-btn"
          @click="authStore.signOut()"
          title="Cerrar sesión"
        />
      </div>
    </aside>

    <!-- Contenido Principal -->
    <main class="pos-main-content">
      <!-- Topbar de estado -->
      <div class="pos-topbar">
        <div class="pos-topbar-left">
          <div v-if="mostrarAvisoTurnoPos" class="pos-turno-alerta">
            <i class="pi pi-info-circle" />
            <span>Operando fuera de turno</span>
            <NuxtLink to="/caja">
              <Button label="Abrir turno" icon="pi pi-play" size="small" text severity="warning" />
            </NuxtLink>
          </div>
        </div>
        <div class="pos-topbar-info flex items-center gap-4">
          <Tag
            :value="isOnline ? 'Online' : 'Offline'"
            :severity="isOnline ? 'success' : 'danger'"
            :icon="isOnline ? 'pi pi-wifi' : 'pi pi-wifi'"
            class="pos-online-tag"
          />

          <!-- Notificaciones Stock Mínimo -->
          <div ref="notificacionesRef" class="relative">
             <button class="pos-bell-btn" type="button" @click="toggleNotificaciones" :aria-expanded="mostrarNotificaciones ? 'true' : 'false'" aria-label="Ver notificaciones de stock">
               <i class="pi pi-bell text-xl" />
             </button>
             <span v-if="productosBajoStock.length > 0" class="absolute -top-2 -right-2 bg-red-500 text-white text-xs w-4 h-4 rounded-full flex items-center justify-center font-bold">
               {{ productosBajoStock.length }}
             </span>
             
             <!-- Panel de notificaciones -->
             <div v-if="mostrarNotificaciones" class="pos-notif-panel absolute right-0 top-10 w-80 z-50 overflow-hidden">
                <div class="p-3 border-b font-bold flex justify-between items-center text-sm">
                  <span>Stock Crítico</span>
                  <Tag severity="danger" :value="productosBajoStock.length.toString()" />
                </div>
                <div class="max-h-60 overflow-y-auto hidden-scrollbar">
                  <div v-if="productosBajoStock.length === 0" class="p-4 text-center text-sm pos-notif-empty">
                    Todo en orden. No hay alertas.
                  </div>
                  <button
                    v-for="prod in productosBajoStock"
                    :key="prod.id"
                    class="pos-notif-item p-3 border-b transition-colors flex justify-between items-center w-full text-left"
                    type="button"
                    @click="irAInventario(prod.id)"
                  >
                    <div>
                      <p class="font-medium text-sm truncate w-40">{{ prod.nombre }}</p>
                      <p class="text-xs pos-notif-min mt-1">Mínimo: {{ prod.stock_minimo || 5 }}</p>
                    </div>
                    <span class="pos-notif-stock font-bold text-sm px-2 py-1 rounded">Stock: {{ prod.stock }}</span>
                  </button>
                </div>
                <div class="p-2 text-center pos-notif-footer">
                  <NuxtLink to="/admin/productos" class="text-xs hover:underline font-medium" @click="mostrarNotificaciones = false">
                    Ir al Inventario
                  </NuxtLink>
                </div>
             </div>
          </div>

          <!-- Divisor -->
          <div class="h-6 w-px bg-slate-200 dark:bg-slate-700" />

          <!-- Saludo y Turno -->
          <span class="pos-topbar-greeting">
            <i class="pi pi-user" />
            {{ authStore.nombreUsuario }}
          </span>
          <Tag
            :value="turnoLabel"
            :severity="cajaStore.hayTurnoActivo ? 'success' : 'warn'"
            :icon="cajaStore.hayTurnoActivo ? 'pi pi-check-circle' : 'pi pi-minus-circle'"
          />
        </div>
      </div>
      <div class="pos-content-scroll">
        <slot />
      </div>
    </main>
  </div>
</template>

<script setup lang="ts">
import { useAuthStore } from '~/stores/auth'
import { useCajaStore } from '~/stores/caja'
import { useProductosStore } from '~/stores/productos'
import { useDarkMode } from '~/composables/useDarkMode'

const authStore = useAuthStore()
const cajaStore = useCajaStore()
const productosStore = useProductosStore()
const { isDark, toggleDark, initDark } = useDarkMode()
const sidebarOpen = ref(false)
const isOnline = ref(import.meta.client ? navigator.onLine : true)
const notificacionesRef = ref<HTMLElement | null>(null)
const route = useRoute()

const turnoLabel = computed(() =>
  cajaStore.hayTurnoActivo ? 'Turno activo' : 'Sin turno'
)
const mostrarAvisoTurnoPos = computed(() =>
  route.path.startsWith('/pos') && !cajaStore.hayTurnoActivo && !cajaStore.loading
)

// Notificaciones
const mostrarNotificaciones = ref(false)
const productosBajoStock = computed(() => {
  return productosStore.productos.filter(p => p.stock <= (p.stock_minimo || 5))
})

function toggleNotificaciones() {
  mostrarNotificaciones.value = !mostrarNotificaciones.value
}

function irAInventario(_productoId?: string) {
  mostrarNotificaciones.value = false
  if (_productoId) {
    navigateTo({ path: '/admin/productos', query: { sel: _productoId } })
    return
  }
  navigateTo('/admin/productos')
}

function onConectado() {
  isOnline.value = true
}

function onDesconectado() {
  isOnline.value = false
}

function onClickFueraNotificaciones(event: MouseEvent) {
  if (!mostrarNotificaciones.value) return
  const target = event.target as Node | null
  if (target && notificacionesRef.value && !notificacionesRef.value.contains(target)) {
    mostrarNotificaciones.value = false
  }
}

function onKeydownLayout(event: KeyboardEvent) {
  if (event.key === 'Escape' && mostrarNotificaciones.value) {
    mostrarNotificaciones.value = false
  }
}

function closeMobile() {
  sidebarOpen.value = false
}

onMounted(() => {
  initDark()
  cajaStore.fetchTurnoActivo()
  productosStore.fetchProductos()
  window.addEventListener('online', onConectado)
  window.addEventListener('offline', onDesconectado)
  document.addEventListener('click', onClickFueraNotificaciones)
  document.addEventListener('keydown', onKeydownLayout)
})

onUnmounted(() => {
  window.removeEventListener('online', onConectado)
  window.removeEventListener('offline', onDesconectado)
  document.removeEventListener('click', onClickFueraNotificaciones)
  document.removeEventListener('keydown', onKeydownLayout)
})
</script>

<style scoped>
.pos-layout-wrapper {
  display: flex;
  height: 100vh;
  overflow: hidden;
  position: relative;
}

/* ─── Hamburger button (mobile only) ─── */
.pos-hamburger {
  display: none;
  position: fixed;
  top: 1rem;
  left: 1rem;
  z-index: 1001;
  width: 2.5rem;
  height: 2.5rem;
  border-radius: 0.5rem;
  border: 1px solid var(--border-sidebar);
  background: var(--bg-sidebar);
  color: var(--text-app);
  cursor: pointer;
  align-items: center;
  justify-content: center;
  font-size: 1.1rem;
  box-shadow: 0 2px 8px rgba(0,0,0,0.15);
}

/* ─── Backdrop (mobile only) ─── */
.pos-sidebar-backdrop {
  display: none;
  position: fixed;
  inset: 0;
  background: rgba(0, 0, 0, 0.5);
  z-index: 998;
  backdrop-filter: blur(2px);
}

/* ─── Sidebar ─── */
.pos-sidebar {
  width: 240px;
  height: 100vh;
  background: var(--bg-sidebar);
  border-right: 1px solid var(--border-sidebar);
  display: flex;
  flex-direction: column;
  padding: 1.5rem 1rem;
  flex-shrink: 0;
  transition: transform 0.3s ease;
  z-index: 999;
  overflow-y: auto;
}

.pos-sidebar-logo {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 0.5rem 0.25rem;
  margin-bottom: 2rem;
}

.pos-sidebar-logo-inner {
  display: flex;
  align-items: center;
  gap: 0.75rem;
}

.pos-logo-icon {
  font-size: 1.5rem;
}

.pos-logo-text {
  font-size: 1.25rem;
  font-weight: 700;
  color: var(--color-brand-primary);
  letter-spacing: -0.02em;
}

.pos-sidebar-nav {
  display: flex;
  flex-direction: column;
  gap: 0.25rem;
  flex: 1;
}

.pos-nav-item {
  display: flex;
  align-items: center;
  gap: 0.75rem;
  padding: 0.75rem 1rem;
  border-radius: 0.75rem;
  color: var(--text-app);
  opacity: 0.7;
  text-decoration: none;
  font-size: 0.9rem;
  font-weight: 500;
  transition: all 0.2s ease;
}

.pos-nav-item:hover {
  background: rgba(99, 102, 241, 0.1);
  color: var(--color-brand-primary);
  opacity: 1;
  transform: translateX(3px);
}

.pos-nav-item--active {
  background: rgba(99, 102, 241, 0.15) !important;
  color: var(--color-brand-primary) !important;
  border: 1px solid rgba(99, 102, 241, 0.2);
  opacity: 1;
}

.pos-nav-item i {
  font-size: 1rem;
  width: 1.25rem;
  text-align: center;
}

.pos-nav-divider {
  height: 1px;
  background: var(--border-sidebar);
  margin: 0.75rem 0.5rem;
}

.pos-sidebar-footer {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 0.75rem;
  background: rgba(99, 102, 241, 0.05);
  border-radius: 0.75rem;
  border: 1px solid var(--border-sidebar);
  gap: 0.5rem;
}

.pos-user-info {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  overflow: hidden;
}

.pos-user-name {
  font-size: 0.85rem;
  font-weight: 600;
  color: var(--text-app);
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
  max-width: 120px;
  margin: 0;
}

.pos-user-role {
  font-size: 0.7rem;
  color: var(--text-muted);
  text-transform: capitalize;
  margin: 0;
}

.pos-main-content {
  flex: 1;
  background: var(--bg-app);
  height: 100vh;
  display: flex;
  flex-direction: column;
  overflow: hidden;
  transition: background-color 0.3s ease;
}

/* ─── Topbar ─── */
.pos-topbar {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 0.5rem 2rem;
  border-bottom: 1px solid var(--border-subtle);
  background: var(--bg-surface);
  position: sticky;
  top: 0;
  z-index: 20;
}

.pos-topbar-left {
  flex: 1;
  min-width: 0;
}

.pos-content-scroll {
  flex: 1;
  overflow-y: auto;
  min-height: 0;
}

.pos-topbar-info {
  display: flex;
  align-items: center;
  gap: 0.75rem;
}

.pos-topbar-greeting {
  font-size: 0.85rem;
  font-weight: 600;
  color: var(--text-app);
  display: flex;
  align-items: center;
  gap: 0.4rem;
}

.pos-topbar-greeting i {
  font-size: 0.9rem;
  color: var(--color-brand-primary);
}

.pos-turno-alerta {
  display: inline-flex;
  align-items: center;
  gap: 0.5rem;
  padding: 0.35rem 0.65rem;
  border-radius: 0.65rem;
  border: 1px solid #facc15;
  background: rgba(254, 249, 195, 0.65);
  color: #ca8a04;
  font-size: 0.85rem;
  font-weight: 500;
}

.pos-bell-btn {
  border: 1px solid var(--border-sidebar);
  background: var(--bg-app);
  color: var(--text-app);
  width: 2.25rem;
  height: 2.25rem;
  border-radius: 0.65rem;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  transition: all 0.2s ease;
}

.pos-bell-btn:hover {
  border-color: rgba(99, 102, 241, 0.45);
  color: var(--color-brand-primary);
  background: rgba(99, 102, 241, 0.08);
}

.pos-bell-btn:focus-visible {
  outline: 2px solid var(--color-brand-primary);
  outline-offset: 2px;
}

.pos-notif-panel {
  background: var(--bg-surface);
  border: 1px solid var(--border-sidebar);
  border-radius: 0.8rem;
  box-shadow: 0 14px 35px rgba(0, 0, 0, 0.2);
  color: var(--text-app);
}

.pos-notif-empty {
  color: var(--text-muted);
}

.pos-notif-item {
  color: var(--text-app);
  background: transparent;
  border-color: var(--border-subtle);
}

.pos-notif-item:hover {
  background: rgba(99, 102, 241, 0.08);
}

.pos-notif-min {
  color: var(--text-muted);
}

.pos-notif-stock {
  color: #b91c1c;
  background: rgba(248, 113, 113, 0.15);
}

.pos-notif-footer {
  background: var(--bg-app);
}

.pos-notif-footer a {
  color: var(--color-brand-primary);
}

:deep(.pos-avatar) {
  background: rgba(99, 102, 241, 0.2) !important;
  color: var(--color-brand-primary) !important;
  width: 2rem !important;
  height: 2rem !important;
  flex-shrink: 0;
}

:deep(.pos-logout-btn) {
  color: #ef4444 !important;
  opacity: 0.7;
  flex-shrink: 0;
}

:deep(.pos-logout-btn:hover) {
  opacity: 1;
  background: rgba(239, 68, 68, 0.1) !important;
}

/* ─── Responsive: tablet/mobile ─── */
@media (max-width: 768px) {
  .pos-hamburger {
    display: flex;
  }

  .pos-sidebar-backdrop {
    display: block;
  }

  .pos-sidebar {
    position: fixed;
    top: 0;
    left: 0;
    height: 100vh;
    transform: translateX(-100%);
    box-shadow: 4px 0 25px rgba(0,0,0,0.3);
  }

  .pos-sidebar--open {
    transform: translateX(0);
  }

  .pos-main-content {
    padding-top: 3.5rem;
  }

  .pos-topbar {
    padding: 0.5rem 1rem;
  }
}
</style>
