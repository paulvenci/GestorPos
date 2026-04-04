export default defineNuxtRouteMiddleware((to) => {
  const user = useSupabaseUser()

  // Rutas públicas que no requieren autenticación
  const publicRoutes = ['/login']

  if (!user.value && !publicRoutes.includes(to.path)) {
    return navigateTo('/login')
  }

  if (user.value && to.path === '/login') {
    return navigateTo('/')
  }
})
