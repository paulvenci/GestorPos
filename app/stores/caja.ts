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

export const useCajaStore = defineStore('caja', () => {
  const supabase = useSupabaseClient<Database>()
  const user = useSupabaseUser()
  const turnoActivo = ref<Turno | null>(null)
  const loading = ref(false)

  async function fetchTurnoActivo() {
    const { data: { user: currentUser } } = await supabase.auth.getUser()
    if (!currentUser) return
    
    loading.value = true
    try {
      const { data, error } = await supabase
        .from('turnos_caja')
        .select('*')
        .eq('id_usuario', currentUser.id)
        .eq('estado', 'abierto')
        .maybeSingle()

      if (!error) turnoActivo.value = data
    } finally {
      loading.value = false
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
          monto_inicial: montoInicial,
          fecha_apertura: new Date().toISOString(),
          estado: 'abierto'
        })
        .select()
        .single()

      if (error) throw error
      turnoActivo.value = data
      return data
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
          estado: 'cerrado'
        })
        .eq('id', turnoActivo.value.id)
        .select()
        .single()

      if (error) throw error
      turnoActivo.value = null
      return data
    } finally {
      loading.value = false
    }
  }

  const hayTurnoActivo = computed(() => !!turnoActivo.value)

  return {
    turnoActivo,
    loading,
    hayTurnoActivo,
    fetchTurnoActivo,
    abrirTurno,
    cerrarTurno
  }
})
