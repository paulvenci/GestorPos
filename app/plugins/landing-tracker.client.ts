export default defineNuxtPlugin(async () => {
  if (typeof window === 'undefined') return

  const route = useRoute()

  const isLandingPath = (path: string) => {
    if (!path) return false
    if (path === '/') return true
    return path.startsWith('/landing')
  }

  if (!isLandingPath(route.path)) return

  const tracker = useLandingTracker()
  tracker.init()

  document.addEventListener('click', (event) => {
    const target = event.target as HTMLElement | null
    if (!target) return
    const el = target.closest('[data-track]') as HTMLElement | null
    if (!el) return
    const elemento = el.getAttribute('data-track') || 'sin-id'
    const texto = (el.textContent || '').trim().slice(0, 200) || undefined
    const seccion = el.getAttribute('data-section') || undefined
    tracker.trackClick(elemento, texto, seccion ? { seccion } : undefined)
  }, { capture: true })
})
