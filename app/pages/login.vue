<template>
  <div class="login-root">
    <!-- Panel izquierdo: branding -->
    <div class="login-branding">
      <div class="login-branding-content">
        <div class="login-logo">
          <span class="login-logo-icon">⚡</span>
          <span class="login-logo-name">GestorPOS</span>
        </div>
        <h1 class="login-tagline">Control total<br />sobre tu negocio.</h1>
        <p class="login-subtitle">
          Sistema de punto de venta moderno, rápido y que funciona incluso sin internet.
        </p>
        <div class="login-features">
          <div class="login-feature">
            <i class="pi pi-wifi login-feature-icon" />
            <span>Funciona offline</span>
          </div>
          <div class="login-feature">
            <i class="pi pi-lock login-feature-icon" />
            <span>Datos seguros en la nube</span>
          </div>
          <div class="login-feature">
            <i class="pi pi-bolt login-feature-icon" />
            <span>Responde en milisegundos</span>
          </div>
        </div>
      </div>
    </div>

    <!-- Panel derecho: formulario -->
    <div class="login-form-panel">
      <div class="login-card">
        <div class="login-card-header">
          <h2 class="login-card-title">Iniciar sesión</h2>
          <p class="login-card-desc">Ingresa tus credenciales para continuar</p>
        </div>

        <form class="login-form" @submit.prevent="handleLogin">
          <div class="login-field">
            <label for="email" class="login-label">Correo electrónico</label>
            <InputText
              id="email"
              v-model="email"
              type="email"
              placeholder="operador@empresa.com"
              class="login-input"
              autocomplete="email"
              :disabled="loading"
            />
          </div>

          <div class="login-field">
            <label for="password" class="login-label">Contraseña</label>
            <Password
              id="password"
              v-model="password"
              placeholder="••••••••"
              :feedback="false"
              toggle-mask
              class="login-input w-full"
              input-class="w-full"
              :disabled="loading"
            />
          </div>

          <Message v-if="errorMsg" severity="error" class="login-error" :closable="false">
            {{ errorMsg }}
          </Message>

          <Button
            type="submit"
            label="Ingresar al sistema"
            class="login-btn"
            :loading="loading"
            icon="pi pi-sign-in"
            icon-pos="right"
          />
        </form>

        <p class="login-version">Versión v{{ appVersion }}</p>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { useToast } from 'primevue/usetoast'
import { useAuthStore } from '~/stores/auth'

definePageMeta({
  layout: 'auth'
})

const authStore = useAuthStore()
const toast = useToast()
const runtimeConfig = useRuntimeConfig()
const appVersion = computed(() => String(runtimeConfig.public.appVersion || 'dev'))

const email = ref('')
const password = ref('')
const loading = ref(false)
const errorMsg = ref('')

async function handleLogin() {
  if (!email.value || !password.value) {
    errorMsg.value = 'Por favor completa todos los campos.'
    return
  }

  loading.value = true
  errorMsg.value = ''

  try {
    await authStore.signIn(email.value, password.value)
    toast.add({
      severity: 'success',
      summary: 'Bienvenido',
      detail: `Sesión iniciada correctamente`,
      life: 3000
    })
    // Esperar a que el estado de auth se propague antes de navegar
    await nextTick()
    await navigateTo('/', { replace: true })
  } catch (err: any) {
    errorMsg.value = 'Credenciales incorrectas. Verifica tu correo y contraseña.'
  } finally {
    loading.value = false
  }
}
</script>

<style scoped>
.login-root {
  min-height: 100dvh;
  display: flex;
  flex-direction: column;
  padding: 0.75rem;
  gap: 0;
  overflow-y: auto;
  -webkit-overflow-scrolling: touch;
}

/* ─── Panel izquierdo ─── */
.login-branding {
  flex: 0 0 auto;
  background: linear-gradient(135deg, #0f172a 0%, #1e1b4b 50%, #312e81 100%);
  display: flex;
  align-items: center;
  justify-content: flex-start;
  padding: 1.5rem;
  position: relative;
  overflow: hidden;
  border: 1px solid rgba(99, 102, 241, 0.2);
  border-radius: 0.75rem 0.75rem 0 0;
  min-height: auto;
}

.login-branding::before {
  content: '';
  position: absolute;
  width: 360px;
  height: 360px;
  border-radius: 50%;
  background: radial-gradient(circle, rgba(99, 102, 241, 0.15) 0%, transparent 70%);
  top: -120px;
  right: -140px;
}

.login-branding::after {
  content: '';
  position: absolute;
  width: 280px;
  height: 280px;
  border-radius: 50%;
  background: radial-gradient(circle, rgba(167, 139, 250, 0.1) 0%, transparent 70%);
  bottom: -90px;
  left: -100px;
}

.login-branding-content {
  position: relative;
  z-index: 1;
  max-width: 100%;
}

.login-logo {
  display: flex;
  align-items: center;
  gap: 0.75rem;
  margin-bottom: 1.5rem;
}

.login-logo-icon {
  font-size: 2.2rem;
}

.login-logo-name {
  font-size: 2rem;
  font-weight: 800;
  color: #a5b4fc;
  letter-spacing: -0.03em;
}

.login-tagline {
  font-size: clamp(2rem, 8vw, 2.7rem);
  font-weight: 800;
  line-height: 1.1;
  color: #f8fafc;
  margin: 0 0 1.25rem;
  letter-spacing: -0.04em;
}

.login-subtitle {
  color: #94a3b8;
  font-size: 1.05rem;
  line-height: 1.6;
  margin: 0 0 1.2rem;
}

.login-features {
  display: flex;
  flex-direction: column;
  gap: 0.65rem;
}

.login-feature {
  display: flex;
  align-items: center;
  gap: 0.75rem;
  color: #c7d2fe;
  font-size: 0.98rem;
}

.login-feature-icon {
  color: #818cf8;
  font-size: 1rem;
  width: 1.25rem;
  text-align: center;
}

/* ─── Panel derecho ─── */
.login-form-panel {
  width: 100%;
  flex: 1;
  min-height: 0;
  background: #0f172a;
  display: flex;
  align-items: flex-start;
  justify-content: center;
  padding: 1rem 1rem calc(1rem + env(safe-area-inset-bottom));
  border: 1px solid rgba(99, 102, 241, 0.15);
  border-top: none;
  border-radius: 0 0 0.75rem 0.75rem;
}

.login-card {
  width: 100%;
  max-width: 100%;
}

.login-version {
  margin: 0.9rem 0 0;
  text-align: center;
  font-size: 0.78rem;
  color: #64748b;
}

.login-card-header {
  margin-bottom: 1.1rem;
}

.login-card-title {
  font-size: 1.8rem;
  font-weight: 700;
  color: #f1f5f9;
  margin: 0 0 0.5rem;
  letter-spacing: -0.03em;
}

.login-card-desc {
  color: #64748b;
  margin: 0;
  font-size: 1rem;
}

@media (max-width: 991px) and (max-height: 760px) {
  .login-root {
    padding: 0.5rem;
  }

  .login-branding {
    padding: 1rem 1rem 0.9rem;
  }

  .login-logo {
    margin-bottom: 1rem;
  }

  .login-tagline {
    font-size: clamp(1.75rem, 7.2vw, 2.2rem);
    line-height: 1.05;
    margin-bottom: 0.8rem;
  }

  .login-subtitle {
    font-size: 0.95rem;
    margin-bottom: 0.85rem;
    line-height: 1.45;
  }

  .login-features {
    gap: 0.5rem;
  }

  .login-feature {
    font-size: 0.9rem;
  }

  .login-form-panel {
    padding-top: 0.85rem;
  }
}

@media (max-width: 991px) and (max-height: 700px) {
  .login-branding {
    padding: 0.85rem 0.9rem 0.75rem;
  }

  .login-logo {
    margin-bottom: 0.65rem;
    gap: 0.55rem;
  }

  .login-logo-icon {
    font-size: 1.65rem;
  }

  .login-logo-name {
    font-size: 1.65rem;
  }

  .login-tagline {
    font-size: clamp(1.45rem, 6.2vw, 1.85rem);
    margin-bottom: 0.45rem;
  }

  .login-subtitle {
    display: none;
  }

  .login-features {
    display: none;
  }

  .login-form-panel {
    padding-top: 0.75rem;
  }

  .login-card-title {
    font-size: 1.55rem;
  }

  .login-card-desc {
    margin-bottom: 0;
    font-size: 0.95rem;
  }
}

.login-form {
  display: flex;
  flex-direction: column;
  gap: 1rem;
}

.login-field {
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
}

.login-label {
  font-size: 0.95rem;
  font-weight: 500;
  color: #94a3b8;
}

.login-error {
  border-radius: 0.5rem;
}

:deep(.login-input) {
  width: 100%;
}

:deep(.login-input input) {
  width: 100%;
  background: rgba(30, 41, 59, 0.8) !important;
  border: 1px solid rgba(99, 102, 241, 0.25) !important;
  color: #f1f5f9 !important;
  border-radius: 0.6rem !important;
  padding: 0.9rem 1rem !important;
  min-height: 48px;
  transition: border-color 0.2s ease, box-shadow 0.2s ease;
}

:deep(.login-input input:focus) {
  border-color: rgba(99, 102, 241, 0.6) !important;
  box-shadow: 0 0 0 3px rgba(99, 102, 241, 0.15) !important;
}

:deep(.login-input input::placeholder) {
  color: #475569 !important;
}

:deep(.login-btn) {
  width: 100%;
  background: linear-gradient(135deg, #6366f1, #8b5cf6) !important;
  border: none !important;
  border-radius: 0.6rem !important;
  min-height: 48px !important;
  padding: 0.95rem !important;
  font-weight: 700 !important;
  font-size: 1rem !important;
  margin-top: 0.5rem;
  transition: all 0.2s ease !important;
  box-shadow: 0 4px 15px rgba(99, 102, 241, 0.3) !important;
}

:deep(.login-btn:hover:not(:disabled)) {
  transform: translateY(-1px) !important;
  box-shadow: 0 6px 20px rgba(99, 102, 241, 0.45) !important;
}

:deep(.login-btn:active) {
  transform: translateY(0) !important;
}

@media (min-width: 992px) {
  .login-root {
    flex-direction: row;
    min-height: 100dvh;
    padding: 0;
    overflow: hidden;
  }

  .login-branding {
    flex: 1;
    border-radius: 0;
    border: none;
    min-height: 100dvh;
    justify-content: center;
    padding: 3rem;
  }

  .login-branding-content {
    max-width: 420px;
  }

  .login-logo {
    margin-bottom: 3rem;
  }

  .login-tagline {
    font-size: 3rem;
  }

  .login-subtitle {
    margin: 0 0 2.5rem;
  }

  .login-features {
    gap: 0.875rem;
  }

  .login-feature {
    font-size: 0.95rem;
  }

  .login-form-panel {
    width: 480px;
    flex: 0 0 auto;
    align-items: center;
    padding: 2rem;
    border-radius: 0;
    border: none;
    border-left: 1px solid rgba(99, 102, 241, 0.15);
  }

  .login-card {
    max-width: 380px;
  }

  .login-card-header {
    margin-bottom: 2.5rem;
  }

  .login-card-title {
    font-size: 1.75rem;
  }

  .login-card-desc {
    font-size: 0.95rem;
  }

  .login-form {
    gap: 1.25rem;
  }
}
</style>
