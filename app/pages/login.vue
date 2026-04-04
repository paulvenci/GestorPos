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
  min-height: 100vh;
  display: flex;
}

/* ─── Panel izquierdo ─── */
.login-branding {
  flex: 1;
  background: linear-gradient(135deg, #0f172a 0%, #1e1b4b 50%, #312e81 100%);
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 3rem;
  position: relative;
  overflow: hidden;
}

.login-branding::before {
  content: '';
  position: absolute;
  width: 600px;
  height: 600px;
  border-radius: 50%;
  background: radial-gradient(circle, rgba(99, 102, 241, 0.15) 0%, transparent 70%);
  top: -100px;
  right: -100px;
}

.login-branding::after {
  content: '';
  position: absolute;
  width: 400px;
  height: 400px;
  border-radius: 50%;
  background: radial-gradient(circle, rgba(167, 139, 250, 0.1) 0%, transparent 70%);
  bottom: -80px;
  left: -80px;
}

.login-branding-content {
  position: relative;
  z-index: 1;
  max-width: 420px;
}

.login-logo {
  display: flex;
  align-items: center;
  gap: 0.75rem;
  margin-bottom: 3rem;
}

.login-logo-icon {
  font-size: 2.5rem;
}

.login-logo-name {
  font-size: 1.75rem;
  font-weight: 800;
  color: #a5b4fc;
  letter-spacing: -0.03em;
}

.login-tagline {
  font-size: 3rem;
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
  margin: 0 0 2.5rem;
}

.login-features {
  display: flex;
  flex-direction: column;
  gap: 0.875rem;
}

.login-feature {
  display: flex;
  align-items: center;
  gap: 0.75rem;
  color: #c7d2fe;
  font-size: 0.95rem;
}

.login-feature-icon {
  color: #818cf8;
  font-size: 1rem;
  width: 1.25rem;
  text-align: center;
}

/* ─── Panel derecho ─── */
.login-form-panel {
  width: 480px;
  flex-shrink: 0;
  background: #0f172a;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 2rem;
  border-left: 1px solid rgba(99, 102, 241, 0.15);
}

.login-card {
  width: 100%;
  max-width: 380px;
}

.login-card-header {
  margin-bottom: 2.5rem;
}

.login-card-title {
  font-size: 1.75rem;
  font-weight: 700;
  color: #f1f5f9;
  margin: 0 0 0.5rem;
  letter-spacing: -0.03em;
}

.login-card-desc {
  color: #64748b;
  margin: 0;
  font-size: 0.95rem;
}

.login-form {
  display: flex;
  flex-direction: column;
  gap: 1.25rem;
}

.login-field {
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
}

.login-label {
  font-size: 0.875rem;
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
  padding: 0.75rem 1rem !important;
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
  padding: 0.875rem !important;
  font-weight: 600 !important;
  font-size: 0.95rem !important;
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

@media (max-width: 768px) {
  .login-root {
    flex-direction: column;
  }
  .login-branding {
    padding: 2rem;
    min-height: 40vh;
  }
  .login-tagline {
    font-size: 2rem;
  }
  .login-form-panel {
    width: 100%;
    border-left: none;
    border-top: 1px solid rgba(99, 102, 241, 0.15);
  }
}
</style>
