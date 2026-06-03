import { computed } from 'vue'
import { useAuthStore } from '~/stores/auth'
import { db } from '~/db'

export const usePlanLimits = () => {
  const authStore = useAuthStore()
  const supabase = useSupabaseClient()
  
  const plan = computed(() => authStore.perfil?.empresa?.plan || 'gratis')
  
  const limits = {
    gratis: {
      max_usuarios: 1,
      max_productos: 100,
      max_ventas_mes: 300,
      advanced_reports: false,
      barcode_printing: false,
    },
    basico: {
      max_usuarios: 1,
      max_productos: Infinity,
      max_ventas_mes: 1500,
      advanced_reports: true,
      barcode_printing: true,
    },
    pro: {
      max_usuarios: Infinity,
      max_productos: Infinity,
      max_ventas_mes: Infinity,
      advanced_reports: true,
      barcode_printing: true,
    }
  }

  const currentLimits = computed(() => limits[plan.value as keyof typeof limits] || limits.gratis)

  // Estado reactivo compartido para las ventas del mes en la sesión actual
  const ventasDelMes = useState<number>('ventas_del_mes_actual', () => 0)
  const cargandoVentas = useState<boolean>('cargando_ventas_limite', () => false)

  const canUseFeature = (feature: keyof typeof limits.gratis) => {
    // Si es superadmin, puede todo
    if (authStore.rolUsuario === 'super_admin') return true
    
    const value = currentLimits.value[feature]
    return typeof value === 'boolean' ? value : true
  }

  // Carga las ventas del mes desde Supabase y suma las ventas offline del mes actual
  const fetchVentasDelMes = async () => {
    const empresaId = authStore.empresaId
    if (!empresaId) return 0
    cargandoVentas.value = true

    try {
      const inicioMes = new Date(new Date().getFullYear(), new Date().getMonth(), 1).toISOString()
      
      // 1. Obtener conteo de ventas de Supabase
      const { count, error } = await supabase
        .from('ventas')
        .select('*', { count: 'exact', head: true })
        .eq('empresa_id', empresaId)
        .gte('created_at', inicioMes)
        .neq('estado', 'cancelada')

      let total = count || 0

      // 2. Sumar ventas offline de este mes que estén pendientes o con error
      if (import.meta.client) {
        const offlineVentas = await db.ventas_offline
          .filter(v => v.empresa_id === empresaId && v.created_at >= inicioMes && v.sync_status !== 'synced')
          .toArray()
        total += offlineVentas.length
      }

      ventasDelMes.value = total
      return total
    } catch (e) {
      console.error('Error al obtener ventas del mes:', e)
      return ventasDelMes.value
    } finally {
      cargandoVentas.value = false
    }
  }

  const checkLimit = (currentCount: number, feature: 'max_usuarios' | 'max_productos') => {
    if (authStore.rolUsuario === 'super_admin') return true
    
    const limit = currentLimits.value[feature] as number
    return currentCount < limit
  }

  // Comprueba si se ha alcanzado el límite de ventas antes de realizar una nueva
  const checkVentasLimit = async () => {
    if (authStore.rolUsuario === 'super_admin') return true
    
    const limit = currentLimits.value.max_ventas_mes
    if (limit === Infinity) return true

    // Forzar actualización para tener el conteo real
    const actualCount = await fetchVentasDelMes()
    return actualCount < limit
  }

  const getLimitMessage = (feature: 'max_usuarios' | 'max_productos' | 'max_ventas_mes') => {
    const limit = currentLimits.value[feature]
    if (feature === 'max_productos') {
      return `Tu plan ${plan.value.toUpperCase()} solo permite hasta ${limit} productos. Actualiza tu plan para productos ilimitados.`
    }
    if (feature === 'max_usuarios') {
      return `Tu plan ${plan.value.toUpperCase()} solo permite 1 cajero/usuario. Actualiza a PRO para usuarios ilimitados.`
    }
    if (feature === 'max_ventas_mes') {
      return `Tu plan ${plan.value.toUpperCase()} solo permite hasta ${limit} ventas mensuales. Actualiza tu plan para seguir registrando ventas.`
    }
    return 'Límite de plan alcanzado.'
  }

  return {
    plan,
    currentLimits,
    ventasDelMes,
    cargandoVentas,
    canUseFeature,
    fetchVentasDelMes,
    checkLimit,
    checkVentasLimit,
    getLimitMessage
  }
}
