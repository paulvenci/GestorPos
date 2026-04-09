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

  const publicRoutes = ['/login']

  if (!currentUser?.id && !publicRoutes.includes(to.path)) {
    return navigateTo('/login')
  }

  if (currentUser?.id && to.path === '/login') {
    return navigateTo('/')
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

  const permissions = normalizeRolePermissions(
    configStore.configuracion.role_permissions || getDefaultRolePermissions()
  )

  const { data: perfil } = await supabase
    .from('perfiles')
    .select('rol, activo, empresa_id')
    .eq('id', currentUser.id)
    .single()

  if (!perfil || perfil.activo === false || !perfil.empresa_id) {
    return navigateTo('/login')
  }

  if (!canAccessSection(perfil.rol, section, permissions)) {
    return navigateTo(getFallbackRouteForRole(perfil.rol, permissions))
  }
})
