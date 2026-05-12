
export const usePlanLimits = () => {
  const authStore = useAuthStore()
  
  const plan = computed(() => authStore.perfil?.empresa?.plan || 'basico')
  
  const limits = {
    basico: {
      max_usuarios: 1,
      max_productos: 500,
      advanced_reports: false,
      barcode_printing: false,
    },
    pro: {
      max_usuarios: Infinity,
      max_productos: Infinity,
      advanced_reports: true,
      barcode_printing: true,
    }
  }

  const currentLimits = computed(() => limits[plan.value as keyof typeof limits])

  const canUseFeature = (feature: keyof typeof limits.basico) => {
    // Si es superadmin, puede todo
    if (authStore.rolUsuario === 'super_admin') return true
    
    const value = currentLimits.value[feature]
    return typeof value === 'boolean' ? value : true
  }

  const checkLimit = (currentCount: number, feature: 'max_usuarios' | 'max_productos') => {
    if (authStore.rolUsuario === 'super_admin') return true
    
    const limit = currentLimits.value[feature] as number
    return currentCount < limit
  }

  const getLimitMessage = (feature: 'max_usuarios' | 'max_productos') => {
    const limit = currentLimits.value[feature]
    if (feature === 'max_productos') {
      return `Tu plan ${plan.value.toUpperCase()} solo permite hasta ${limit} productos. Actualiza a PRO para productos ilimitados.`
    }
    if (feature === 'max_usuarios') {
      return `Tu plan ${plan.value.toUpperCase()} solo permite 1 cajero. Actualiza a PRO para cajeros ilimitados.`
    }
    return 'Límite de plan alcanzado.'
  }

  return {
    plan,
    currentLimits,
    canUseFeature,
    checkLimit,
    getLimitMessage
  }
}
