import { defineStore } from 'pinia'
import type { Database } from '~/types/database.types'

export interface Categoria {
  id: string
  nombre: string
  descripcion: string | null
  color: string
  activo: boolean
  created_at?: string
}

import { useAuthStore } from './auth'

export const useCategoriasStore = defineStore('categorias', () => {
  const supabase = useSupabaseClient<Database>()
  const authStore = useAuthStore()
  const categorias = ref<Categoria[]>([])
  const loading = ref(false)

  async function fetchCategorias() {
    loading.value = true
    try {
      const { data, error } = await (supabase.from('categorias') as any)
        .select('*')
        .eq('empresa_id', authStore.empresaId)
        .order('nombre')
      
      if (error) throw error
      if (data) categorias.value = data
    } catch (e) {
      console.warn('Error al cargar categorías:', e)
    } finally {
      loading.value = false
    }
  }

  async function saveCategoria(cat: Partial<Categoria>) {
    loading.value = true
    try {
      if (cat.id) {
        const { error } = await (supabase.from('categorias') as any)
          .update({
            nombre: cat.nombre,
            descripcion: cat.descripcion,
            color: cat.color,
            activo: cat.activo
          })
          .eq('id', cat.id)
          .eq('empresa_id', authStore.empresaId)
        if (error) throw error
      } else {
        const { error } = await (supabase.from('categorias') as any)
          .insert({
            nombre: cat.nombre,
            descripcion: cat.descripcion,
            color: cat.color,
            activo: cat.activo ?? true,
            empresa_id: authStore.empresaId
          })
        if (error) throw error
      }
      await fetchCategorias()
    } finally {
      loading.value = false
    }
  }

  async function deleteCategoria(id: string) {
    loading.value = true
    try {
      const { error } = await (supabase.from('categorias') as any)
        .delete()
        .eq('id', id)
        .eq('empresa_id', authStore.empresaId)
      if (error) throw error
      await fetchCategorias()
    } finally {
      loading.value = false
    }
  }

  async function toggleActivo(id: string, activo: boolean) {
    loading.value = true
    try {
      const { error } = await (supabase.from('categorias') as any)
        .update({ activo })
        .eq('id', id)
        .eq('empresa_id', authStore.empresaId)
      if (error) throw error
      await fetchCategorias()
    } finally {
      loading.value = false
    }
  }

  return {
    categorias,
    loading,
    fetchCategorias,
    saveCategoria,
    deleteCategoria,
    toggleActivo
  }
})
