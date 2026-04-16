import { defineStore } from 'pinia'
import { useLocalStorage } from '@vueuse/core'
import type { Database } from '~/types/database.types'
import { getDefaultRolePermissions, normalizeRolePermissions, type RolePermissionsMap } from '~/composables/useRolePermissions'
import { useAuthStore } from '~/stores/auth'

interface AppConfigState {
  margen_ganancia_defecto: number
  stock_minimo_defecto: number
  role_permissions: RolePermissionsMap
  impresion_tamano_fuente: number
}

export const useConfigStore = defineStore('config', () => {
  const supabase = useSupabaseClient<Database>()
  const authStore = useAuthStore()
  const defaultRolePermissions = getDefaultRolePermissions()

  const configuracion = useLocalStorage<AppConfigState>('gestorpos_config', {
    margen_ganancia_defecto: 30,
    stock_minimo_defecto: 5,
    role_permissions: defaultRolePermissions,
    impresion_tamano_fuente: 11
  })

  const loading = ref(false)

  const fetchConfig = async () => {
    loading.value = true
    try {
      if (!authStore.empresaId) {
        loading.value = false
        return
      }

      const { data, error } = await supabase
        .from('configuracion')
        .select('*')
        .eq('empresa_id', authStore.empresaId)
        .single()

      if (error && error.code !== 'PGRST116') {
        throw error
      }

      if (data) {
        const row = data as any
        configuracion.value.margen_ganancia_defecto = row.margen_ganancia_defecto || 30
        configuracion.value.stock_minimo_defecto = row.stock_minimo_defecto || 5
        configuracion.value.role_permissions = normalizeRolePermissions(row.role_permissions)
        configuracion.value.impresion_tamano_fuente = row.impresion_tamano_fuente || 11
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
    impresion_tamano_fuente?: number
  }) => {
    loading.value = true
    try {
      if (!authStore.empresaId) {
        throw new Error('No hay empresa asignada al usuario actual')
      }

      const rolePermissions = normalizeRolePermissions(
        nuevosAjustes.role_permissions || configuracion.value.role_permissions
      )

      const size = nuevosAjustes.impresion_tamano_fuente || configuracion.value.impresion_tamano_fuente || 11

      const { error } = await (supabase.from('configuracion') as any).upsert({
        empresa_id: authStore.empresaId,
        margen_ganancia_defecto: nuevosAjustes.margen_ganancia_defecto,
        stock_minimo_defecto: nuevosAjustes.stock_minimo_defecto,
        role_permissions: rolePermissions,
        impresion_tamano_fuente: size,
        updated_at: new Date().toISOString()
      }, { onConflict: 'empresa_id' })

      if (error) throw error

      configuracion.value = {
        margen_ganancia_defecto: nuevosAjustes.margen_ganancia_defecto,
        stock_minimo_defecto: nuevosAjustes.stock_minimo_defecto,
        role_permissions: rolePermissions,
        impresion_tamano_fuente: size
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
