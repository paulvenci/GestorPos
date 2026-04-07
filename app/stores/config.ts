import { defineStore } from 'pinia'
import { useLocalStorage } from '@vueuse/core'
import type { Database } from '~/types/database.types'
import { getDefaultRolePermissions, normalizeRolePermissions, type RolePermissionsMap } from '~/composables/useRolePermissions'

interface AppConfigState {
  margen_ganancia_defecto: number
  stock_minimo_defecto: number
  role_permissions: RolePermissionsMap
}

export const useConfigStore = defineStore('config', () => {
  const supabase = useSupabaseClient<Database>()
  const defaultRolePermissions = getDefaultRolePermissions()

  const configuracion = useLocalStorage<AppConfigState>('gestorpos_config', {
    margen_ganancia_defecto: 30,
    stock_minimo_defecto: 5,
    role_permissions: defaultRolePermissions
  })

  const loading = ref(false)

  const fetchConfig = async () => {
    loading.value = true
    try {
      const { data, error } = await supabase
        .from('configuracion')
        .select('*')
        .eq('id', '00000000-0000-0000-0000-000000000001')
        .single()

      if (error && error.code !== 'PGRST116') {
        throw error
      }

      if (data) {
        const row = data as any
        configuracion.value.margen_ganancia_defecto = row.margen_ganancia_defecto || 30
        configuracion.value.stock_minimo_defecto = row.stock_minimo_defecto || 5
        configuracion.value.role_permissions = normalizeRolePermissions(row.role_permissions)
      }
    } catch (err) {
      console.error('Error cargando configuracion', err)
    } finally {
      loading.value = false
    }
  }

  const saveConfig = async (nuevosAjustes: {
    margen_ganancia_defecto: number
    stock_minimo_defecto: number
    role_permissions?: RolePermissionsMap
  }) => {
    loading.value = true
    try {
      const rolePermissions = normalizeRolePermissions(
        nuevosAjustes.role_permissions || configuracion.value.role_permissions
      )

      const { error } = await (supabase.from('configuracion') as any).upsert({
        id: '00000000-0000-0000-0000-000000000001',
        margen_ganancia_defecto: nuevosAjustes.margen_ganancia_defecto,
        stock_minimo_defecto: nuevosAjustes.stock_minimo_defecto,
        role_permissions: rolePermissions,
        updated_at: new Date().toISOString()
      })

      if (error) throw error

      configuracion.value = {
        margen_ganancia_defecto: nuevosAjustes.margen_ganancia_defecto,
        stock_minimo_defecto: nuevosAjustes.stock_minimo_defecto,
        role_permissions: rolePermissions
      }
    } catch (err) {
      console.error('Error guardando configuracion', err)
      throw err
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

