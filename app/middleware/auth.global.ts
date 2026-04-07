export default defineNuxtRouteMiddleware(async (to) => {
  const user = useSupabaseUser()
  const supabase = useSupabaseClient()

  // En refresh (F5), la sesion puede tardar en hidratarse.
  // Leemos la sesion antes de decidir redireccion.
  if (!user.value) {
    const { data } = await supabase.auth.getSession()
    if (data.session?.user) {
      user.value = data.session.user
    }
  }

  const publicRoutes = ['/login']

  if (!user.value && !publicRoutes.includes(to.path)) {
    return navigateTo('/login')
  }

  if (user.value && to.path === '/login') {
    return navigateTo('/')
  }
})
