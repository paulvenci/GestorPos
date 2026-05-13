import {
  canAccessSection,
  getDefaultRolePermissions,
  getFallbackRouteForRole,
  getSectionFromPath,
  normalizeRolePermissions
} from '~/composables/useRolePermissions'
import { useConfigStore } from '~/stores/config'

export default defineNuxtRouteMiddleware(async (to) => {
  const user = useSupabaseUser()
  const supabase = useSupabaseClient()
  const configStore = useConfigStore()
  const rolePermissionsLoaded = useState('role_permissions_loaded', () => false)
  let currentUser = user.value

  // En refresh (F5), la sesion puede tardar en hidratarse.
  // Leemos la sesion antes de decidir redireccion.
  if (!currentUser?.id) {
    const { data } = await supabase.auth.getSession()
    if (data.session?.user) {
      user.value = data.session.user
      currentUser = data.session.user
    }
  }

  const publicRoutes = ['/login', '/registro', '/confirmacion', '/recuperar-password', '/']

  const isPublicRoute = publicRoutes.includes(to.path) || to.path.startsWith('/blog')

  if (!currentUser?.id && !isPublicRoute) {
    return navigateTo('/login')
  }

  if (currentUser?.id && (to.path === '/login' || to.path === '/registro')) {
    return navigateTo('/dashboard')
  }

  if (!currentUser?.id) return

  const section = getSectionFromPath(to.path)
  if (!section) return

  if (!rolePermissionsLoaded.value) {
    try {
      await configStore.fetchConfig()
    } catch {
      // fallback a local storage/default
    } finally {
      rolePermissionsLoaded.value = true
    }
  }

  const authStore = useAuthStore()
  
  // Aseguramos que el estado del store esté sincronizado con Supabase
  if (!authStore.perfil || authStore.user?.id !== currentUser.id) {
    await authStore.fetchUser()
  }

  const permissions = normalizeRolePermissions(
    configStore.configuracion.role_permissions || getDefaultRolePermissions()
  )

  const perfil = authStore.perfil

  if (!perfil || perfil.activo === false || !perfil.empresa_id) {
    return navigateTo('/login')
  }

  // Si la empresa está pausada (ej: falta de pago), bloqueamos el acceso excepto para super_admin
  if (perfil.empresa?.activo === false && perfil.rol !== 'super_admin') {
    // Podríamos crear una página específica /suspendido, por ahora login
    return navigateTo('/login?error=account_suspended')
  }

  if (!canAccessSection(perfil.rol, section, permissions)) {
    return navigateTo(getFallbackRouteForRole(perfil.rol, permissions))
  }
})
