import { defineStore } from 'pinia'
import type { Database } from '~/types/database.types'

export interface Turno {
  id: string
  id_usuario: string
  fecha_apertura: string
  monto_inicial: number
  fecha_cierre?: string | null
  ventas_registradas?: number | null
  monto_declarado?: number | null
  observaciones?: string | null
  estado: string
}

import { useAuthStore } from './auth'

export const useCajaStore = defineStore('caja', () => {
  const supabase = useSupabaseClient<Database>()
  const authStore = useAuthStore()
  const user = useSupabaseUser()
  const turnoActivo = ref<Turno | null>(null)
  const loading = ref(false)

  async function fetchTurnoActivo() {
    try {
      const { data: { user: currentUser } } = await supabase.auth.getUser()
      if (!currentUser) return
      
      loading.value = true
      try {
        const { data, error } = await supabase
          .from('turnos_caja')
          .select('*')
          .eq('id_usuario', currentUser.id)
          .eq('empresa_id', authStore.empresaId)
          .eq('estado', 'abierto')
          .maybeSingle()

        if (error) {
          console.warn('Error fetching active shift:', error.message)
          // Fallback a localStorage en caso de error de red
          if (import.meta.client) {
            const cached = localStorage.getItem(`gestorpos_turno_activo_${currentUser.id}`)
            if (cached) {
              turnoActivo.value = JSON.parse(cached)
            }
          }
        } else {
          turnoActivo.value = data
          if (import.meta.client) {
            if (data) {
              localStorage.setItem(`gestorpos_turno_activo_${currentUser.id}`, JSON.stringify(data))
            } else {
              localStorage.removeItem(`gestorpos_turno_activo_${currentUser.id}`)
            }
          }
        }
      } catch (err) {
        console.warn('Network error while fetching shift, trying cache:', err)
        if (import.meta.client) {
          const cached = localStorage.getItem(`gestorpos_turno_activo_${currentUser.id}`)
          if (cached) {
            turnoActivo.value = JSON.parse(cached)
          }
        }
      } finally {
        loading.value = false
      }
    } catch (globalErr) {
      console.error('Error global in fetchTurnoActivo:', globalErr)
    }
  }

  async function checkPuedeAbrirTurno() {
    try {
      const { data: { user: currentUser } } = await supabase.auth.getUser()
      if (!currentUser) return true

      const d = new Date()
      const inicio = new Date(d.getFullYear(), d.getMonth(), d.getDate()).toISOString()
      const fin = new Date(d.getFullYear(), d.getMonth(), d.getDate() + 1).toISOString()

      const { data, error } = await supabase.from('turnos_caja')
        .select('id, estado')
        .eq('id_usuario', currentUser.id)
        .eq('empresa_id', authStore.empresaId)
        .gte('fecha_apertura', inicio)
        .lt('fecha_apertura', fin)
        .in('estado', ['cerrado', 'cerrado_pendiente_revision'])
        .limit(1)

      if (error) {
        console.warn('Error checking if shift can be opened:', error.message)
        return true
      }

      if (data && data.length > 0) {
        return false
      }
      return true
    } catch (err) {
      console.warn('Network error while checking if shift can be opened:', err)
      return true
    }
  }

  async function abrirTurno(montoInicial: number) {
    const { data: { user: currentUser } } = await supabase.auth.getUser()
    if (!currentUser) throw new Error('Sin sesión activa')
    
    loading.value = true
    try {
      const { data, error } = await supabase.from('turnos_caja')
        .insert({
          id_usuario: currentUser.id,
          empresa_id: authStore.empresaId,
          monto_inicial: montoInicial,
          fecha_apertura: new Date().toISOString(),
          estado: 'abierto'
        })
        .select()
        .single()

      if (error) {
        throw new Error(error.message || 'No se pudo abrir el turno. Por favor verifica tu conexión.')
      }
      
      turnoActivo.value = data
      if (import.meta.client && data) {
        localStorage.setItem(`gestorpos_turno_activo_${currentUser.id}`, JSON.stringify(data))
      }
      return data
    } catch (err: any) {
      console.error('Error opening shift:', err)
      throw new Error(err.message || 'Error de red al abrir el turno.')
    } finally {
      loading.value = false
    }
  }

  async function cerrarTurno(montoDeclarado: number, observaciones: string) {
    if (!turnoActivo.value) throw new Error('No hay turno activo')
    loading.value = true
    try {
      const { data, error } = await supabase.from('turnos_caja')
        .update({
          fecha_cierre: new Date().toISOString(),
          monto_declarado: montoDeclarado,
          observaciones,
          estado: 'cerrado_pendiente_revision'
        })
        .eq('id', turnoActivo.value.id)
        .eq('empresa_id', authStore.empresaId)
        .select()
        .single()

      if (error) throw error
      turnoActivo.value = null
      
      // Limpiar cache local al cerrar
      if (import.meta.client) {
        const { data: { user: currentUser } } = await supabase.auth.getUser()
        if (currentUser) {
          localStorage.removeItem(`gestorpos_turno_activo_${currentUser.id}`)
        }
      }
      
      return data
    } finally {
      loading.value = false
    }
  }

  const hayTurnoActivo = computed(() => !!turnoActivo.value)

  async function asegurarTurnoActivo() {
    try {
      const { data: { user: currentUser } } = await supabase.auth.getUser()
      if (!currentUser) return

      // 1. Obtener turno activo (si existe)
      await fetchTurnoActivo()

      if (turnoActivo.value) {
        // 2. Verificar si es de un día distinto al actual
        const fechaApertura = new Date(turnoActivo.value.fecha_apertura)
        const hoy = new Date()

        const esMismoDia = fechaApertura.getFullYear() === hoy.getFullYear() &&
                          fechaApertura.getMonth() === hoy.getMonth() &&
                          fechaApertura.getDate() === hoy.getDate()

        if (!esMismoDia) {
          // Cierre automático de turno antiguo
          try {
            await cerrarTurno(0, 'Cierre automático por inicio de sesión en nuevo día (turno pendiente del ' + fechaApertura.toLocaleDateString() + ')')
          } catch (err) {
            console.warn('No se pudo cerrar el turno antiguo automáticamente:', err)
          }
        } else {
          // Turno ya activo hoy, no hace falta hacer nada
          return
        }
      }

      // 3. Abrir nuevo turno si no hay uno (o si cerramos el antiguo)
      const puedeAbrir = await checkPuedeAbrirTurno()
      if (puedeAbrir) {
        try {
          await abrirTurno(0)
        } catch (err) {
          console.warn('No se pudo abrir un nuevo turno de caja en modo offline:', err)
        }
      }
    } catch (globalErr) {
      console.error('Error en asegurarTurnoActivo:', globalErr)
    }
  }

  return {
    turnoActivo,
    loading,
    hayTurnoActivo,
    fetchTurnoActivo,
    checkPuedeAbrirTurno,
    abrirTurno,
    cerrarTurno,
    asegurarTurnoActivo
  }
})
