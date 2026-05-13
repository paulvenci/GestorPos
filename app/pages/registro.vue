<template>
  <div class="login-root">
    <!-- Panel izquierdo: branding (mismo que login) -->
    <div class="login-branding">
      <div class="login-branding-content">
        <div class="login-logo">
          <span class="login-logo-icon">⚡</span>
          <span class="login-logo-name">ZumaPos</span>
        </div>
        <h1 class="login-tagline">Tu negocio,<br />modernizado.</h1>
        <p class="login-subtitle">
          Inicia tu prueba gratuita de 7 días y descubre cómo ZumaPos puede transformar tu forma de vender.
        </p>
        <div class="login-features">
          <div class="login-feature">
            <i class="pi pi-check-circle login-feature-icon" />
            <span>Sin tarjeta de crédito</span>
          </div>
          <div class="login-feature">
            <i class="pi pi-check-circle login-feature-icon" />
            <span>Acceso total a funciones básicas</span>
          </div>
          <div class="login-feature">
            <i class="pi pi-check-circle login-feature-icon" />
            <span>Configuración en 2 minutos</span>
          </div>
        </div>
      </div>
    </div>

    <!-- Panel derecho: formulario de registro -->
    <div class="login-form-panel">
      <div class="login-card">
        <div class="login-card-header">
          <h2 class="login-card-title">Prueba ZumaPos Gratis</h2>
          <p class="login-card-desc">Crea tu cuenta y empieza a vender hoy mismo</p>
        </div>

        <form class="login-form" @submit.prevent="handleRegistro">
          <div class="login-field">
            <label for="nombreNegocio" class="login-label">Nombre de tu Negocio</label>
            <InputText
              id="nombreNegocio"
              v-model="form.nombreNegocio"
              placeholder="Ej: Minimarket Los Amigos"
              class="login-input"
              required
              :disabled="loading"
            />
          </div>

          <div class="login-field">
            <label for="nombreUsuario" class="login-label">Tu Nombre</label>
            <InputText
              id="nombreUsuario"
              v-model="form.nombreUsuario"
              placeholder="Ej: Juan Pérez"
              class="login-input"
              required
              :disabled="loading"
            />
          </div>

          <div class="login-field">
            <label for="email" class="login-label">Correo electrónico</label>
            <InputText
              id="email"
              v-model="form.email"
              type="email"
              placeholder="juan@correo.com"
              class="login-input"
              required
              :disabled="loading"
            />
          </div>

          <div class="login-field">
            <label for="password" class="login-label">Contraseña</label>
            <Password
              id="password"
              v-model="form.password"
              placeholder="Mínimo 6 caracteres"
              :feedback="true"
              toggle-mask
              class="login-input w-full"
              input-class="w-full"
              required
              :disabled="loading"
              prompt-label="Elige una contraseña"
              weak-label="Débil"
              medium-label="Media"
              strong-label="Fuerte"
            />
          </div>

          <Message v-if="errorMsg" severity="error" class="login-error" :closable="false">
            {{ errorMsg }}
          </Message>

          <Button
            type="submit"
            label="Comenzar mi prueba de 7 días"
            class="login-btn"
            :loading="loading"
            icon="pi pi-rocket"
            icon-pos="right"
          />

          <p class="text-center text-sm text-slate-500 mt-4">
            ¿Ya tienes cuenta? <NuxtLink to="/login" class="text-indigo-400 font-bold hover:underline">Inicia sesión</NuxtLink>
          </p>
        </form>

        <p class="login-version">ZumaPos Cloud Edition</p>
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

const form = ref({
  nombreNegocio: '',
  nombreUsuario: '',
  email: '',
  password: ''
})

const loading = ref(false)
const errorMsg = ref('')

async function handleRegistro() {
  if (!form.value.nombreNegocio || !form.value.email || !form.value.password || !form.value.nombreUsuario) {
    errorMsg.value = 'Por favor completa todos los campos.'
    return
  }

  loading.value = true
  errorMsg.value = ''

  try {
    // 1. Llamar al API de registro público
    await $fetch('/api/registro', {
      method: 'POST',
      body: form.value
    })

    toast.add({
      severity: 'success',
      summary: '¡Bienvenido!',
      detail: 'Tu cuenta ha sido creada. Iniciando sesión...',
      life: 5000
    })

    // 2. Intentar login automático
    await authStore.signIn(form.value.email, form.value.password)
    
    await navigateTo('/dashboard', { replace: true })
  } catch (err: any) {
    console.error('Error en registro:', err)
    errorMsg.value = err.data?.statusMessage || 'No se pudo completar el registro. Intenta con otro correo.'
  } finally {
    loading.value = false
  }
}
</script>

<style scoped>
/* Reutilizamos los estilos exactos de login.vue */
.login-root {
  min-height: 100dvh;
  display: flex;
  flex-direction: column;
  padding: 0.75rem;
  background: #020617;
  overflow-y: auto;
}

.login-branding {
  flex: 0 0 auto;
  background: linear-gradient(135deg, #0f172a 0%, #1e1b4b 50%, #312e81 100%);
  padding: 1.5rem;
  border-radius: 0.75rem 0.75rem 0 0;
  border: 1px solid rgba(99, 102, 241, 0.2);
}

.login-logo {
  display: flex;
  align-items: center;
  gap: 0.75rem;
  margin-bottom: 1.5rem;
}

.login-logo-icon { font-size: 2.2rem; }
.login-logo-name { font-size: 2rem; font-weight: 800; color: #a5b4fc; }

.login-tagline {
  font-size: clamp(2rem, 8vw, 2.7rem);
  font-weight: 800;
  color: #f8fafc;
  margin-bottom: 1rem;
}

.login-subtitle { color: #94a3b8; margin-bottom: 1.5rem; }

.login-features { display: flex; flex-direction: column; gap: 0.5rem; }
.login-feature { display: flex; align-items: center; gap: 0.5rem; color: #c7d2fe; }
.login-feature-icon { color: #818cf8; }

.login-form-panel {
  flex: 1;
  background: #0f172a;
  padding: 2rem 1.5rem;
  border: 1px solid rgba(99, 102, 241, 0.15);
  border-top: none;
  border-radius: 0 0 0.75rem 0.75rem;
}

.login-card { width: 100%; max-width: 400px; margin: 0 auto; }
.login-card-title { font-size: 1.8rem; font-weight: 700; color: #f1f5f9; margin-bottom: 0.5rem; }
.login-card-desc { color: #64748b; margin-bottom: 1.5rem; }

.login-form { display: flex; flex-direction: column; gap: 1rem; }
.login-field { display: flex; flex-direction: column; gap: 0.4rem; }
.login-label { font-size: 0.9rem; font-weight: 500; color: #94a3b8; }

:deep(.login-input input) {
  width: 100%;
  background: rgba(30, 41, 59, 0.8) !important;
  border: 1px solid rgba(99, 102, 241, 0.25) !important;
  color: #f1f5f9 !important;
  padding: 0.8rem 1rem !important;
  border-radius: 0.5rem !important;
}

:deep(.login-btn) {
  width: 100%;
  background: linear-gradient(135deg, #6366f1, #8b5cf6) !important;
  border: none !important;
  padding: 0.9rem !important;
  font-weight: 700 !important;
  margin-top: 1rem;
  box-shadow: 0 4px 15px rgba(99, 102, 241, 0.3) !important;
}

.login-version { text-align: center; margin-top: 2rem; color: #475569; font-size: 0.8rem; }

@media (min-width: 992px) {
  .login-root { flex-direction: row; padding: 0; }
  .login-branding { flex: 1; border-radius: 0; min-height: 100vh; display: flex; align-items: center; justify-content: center; }
  .login-form-panel { width: 500px; border-radius: 0; border-left: 1px solid rgba(99, 102, 241, 0.2); display: flex; align-items: center; }
}
</style>
