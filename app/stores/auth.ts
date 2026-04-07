import { defineStore } from 'pinia'
import type { User } from '@supabase/supabase-js'
import type { Database } from '~/types/database.types'

export const useAuthStore = defineStore('auth', () => {
  const supabase = useSupabaseClient<Database>()
  const user = ref<User | null>(null)
  const turnoActivo = ref<string | null>(null)
  const perfil = ref<{ nombre: string | null; rol: string } | null>(null)

  const nombrePerfil = computed(() => perfil.value?.nombre?.trim() || '')
  const nombreCorreo = computed(() => user.value?.email?.split('@')[0]?.trim() || '')

  async function fetchUser() {
    const { data } = await supabase.auth.getUser()
    user.value = data.user
    if (data.user) {
      await fetchPerfil(data.user.id)
    }
  }

  async function fetchPerfil(userId: string) {
    try {
      const { data } = await supabase
        .from('perfiles')
        .select('nombre, rol')
        .eq('id', userId)
        .single()
      if (data) {
        perfil.value = data as any
      }
    } catch (_) { /* silencioso */ }
  }

  async function signIn(email: string, password: string) {
    const { data, error } = await supabase.auth.signInWithPassword({ email, password })
    if (error) throw error
    user.value = data.user
    if (data.user) {
      await fetchPerfil(data.user.id)
    }
  }

  async function signOut() {
    await supabase.auth.signOut()
    user.value = null
    perfil.value = null
    turnoActivo.value = null
    navigateTo('/login')
  }

  const isAuthenticated = computed(() => !!user.value)
  const nombreUsuario = computed(() => nombrePerfil.value || nombreCorreo.value || 'Sin nombre')
  const rolUsuario = computed(() => perfil.value?.rol || 'cajero')

  return { user, perfil, turnoActivo, isAuthenticated, nombreUsuario, rolUsuario, fetchUser, fetchPerfil, signIn, signOut }
})
