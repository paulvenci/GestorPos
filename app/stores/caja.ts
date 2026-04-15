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

      if (!error) turnoActivo.value = data
    } finally {
      loading.value = false
    }
  }

  async function checkPuedeAbrirTurno() {
    const { data: { user: currentUser } } = await supabase.auth.getUser()
    if (!currentUser) return true

    const d = new Date()
    const inicio = new Date(d.getFullYear(), d.getMonth(), d.getDate()).toISOString()
    const fin = new Date(d.getFullYear(), d.getMonth(), d.getDate() + 1).toISOString()

    const { data } = await supabase.from('turnos_caja')
      .select('id, estado')
      .eq('id_usuario', currentUser.id)
      .eq('empresa_id', authStore.empresaId)
      .gte('fecha_apertura', inicio)
      .lt('fecha_apertura', fin)
      .in('estado', ['cerrado', 'cerrado_pendiente_revision'])
      .limit(1)

    if (data && data.length > 0) {
      return false
    }
    return true
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
          estado: 'cerrado_pendiente_revision'
        })
        .eq('id', turnoActivo.value.id)
        .eq('empresa_id', authStore.empresaId)
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
    checkPuedeAbrirTurno,
    abrirTurno,
    cerrarTurno
  }
})
