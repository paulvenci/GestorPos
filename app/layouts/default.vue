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
        <div class="pos-topbar-info">
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
      <slot />
    </main>
  </div>
</template>

<script setup lang="ts">
import { useAuthStore } from '~/stores/auth'
import { useCajaStore } from '~/stores/caja'
import { useDarkMode } from '~/composables/useDarkMode'

const authStore = useAuthStore()
const cajaStore = useCajaStore()
const { isDark, toggleDark, initDark } = useDarkMode()
const sidebarOpen = ref(false)

const turnoLabel = computed(() =>
  cajaStore.hayTurnoActivo ? 'Turno activo' : 'Sin turno'
)

function closeMobile() {
  sidebarOpen.value = false
}

onMounted(() => {
  initDark()
  cajaStore.fetchTurnoActivo()
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
  overflow-y: auto;
  height: 100vh;
  display: flex;
  flex-direction: column;
  transition: background-color 0.3s ease;
}

/* ─── Topbar ─── */
.pos-topbar {
  display: flex;
  align-items: center;
  justify-content: flex-end;
  padding: 0.5rem 2rem;
  border-bottom: 1px solid var(--border-subtle);
  background: var(--bg-surface);
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
