import { defineStore } from 'pinia'
import { useLocalStorage } from '@vueuse/core'
import type { Database } from '~/types/database.types'

export const useConfigStore = defineStore('config', () => {
  const supabase = useSupabaseClient<Database>()

  // Estado persistido en LocalStorage como fallback offline.
  const configuracion = useLocalStorage('gestorpos_config', {
    margen_ganancia_defecto: 30,
    stock_minimo_defecto: 5,
  })

  const loading = ref(false)

  // Obtener la config desde Supabase y sincronizarla
  const fetchConfig = async () => {
    loading.value = true
    try {
      const { data, error } = await supabase
        .from('configuracion')
        .select('margen_ganancia_defecto, stock_minimo_defecto')
        // Siempre hay solo una fila con id fijo
        .eq('id', '00000000-0000-0000-0000-000000000001')
        .single()
      
      if (error && error.code !== 'PGRST116') {
        throw error
      }
      
      if (data) {
        configuracion.value.margen_ganancia_defecto = data.margen_ganancia_defecto || 30
        configuracion.value.stock_minimo_defecto = data.stock_minimo_defecto || 5
      }
    } catch (err) {
      console.error('Error cargando configuración', err)
      // En modo offline continuará usando lo que está en configuracion localstorage
    } finally {
      loading.value = false
    }
  }

  // Guardar datos en la DB y actualizar localstorage
  const saveConfig = async (nuevosAjustes: { margen_ganancia_defecto: number, stock_minimo_defecto: number }) => {
    loading.value = true
    try {
      const { error } = await supabase.from('configuracion')
        .upsert({
          id: '00000000-0000-0000-0000-000000000001',
          margen_ganancia_defecto: nuevosAjustes.margen_ganancia_defecto,
          stock_minimo_defecto: nuevosAjustes.stock_minimo_defecto,
          updated_at: new Date().toISOString()
        })
      
      if (error) throw error

      configuracion.value = nuevosAjustes;
    } catch (err) {
      console.error('Error guardando configuración', err)
      throw err;
    } finally {
      loading.value = false
    }
  }

  return {
    configuracion,
    loading,
    fetchConfig,
    saveConfig
  }
})
