import { defineStore } from 'pinia'
import { useAuthStore } from './auth'

export interface Proveedor {
  id?: string
  empresa_id?: string
  rut: string
  nombre: string
  telefono?: string
  email?: string
  direccion?: string
  notas?: string
  activo?: boolean
}

export const useProveedoresStore = defineStore('proveedores', () => {
  const supabase = useSupabaseClient()
  const authStore = useAuthStore()
  
  const proveedores = ref<Proveedor[]>([])
  const loading = ref(false)

  async function fetchProveedores() {
    if (!authStore.empresaId) return
    loading.value = true
    try {
      const { data, error } = await supabase
        .from('proveedores')
        .select('*')
        .eq('empresa_id', authStore.empresaId)
        .order('nombre')
      
      if (error) throw error
      if (data) proveedores.value = data as Proveedor[]
    } catch (e: any) {
      console.error('Error cargando proveedores:', e.message)
    } finally {
      loading.value = false
    }
  }

  async function saveProveedor(prov: Partial<Proveedor>) {
    if (!authStore.empresaId) throw new Error('Empresa no identificada')
    loading.value = true
    try {
      const payload = {
        rut: prov.rut?.trim() || null,
        nombre: prov.nombre?.trim() || 'Proveedor Sin Nombre',
        telefono: prov.telefono?.trim() || null,
        email: prov.email?.trim() || null,
        direccion: prov.direccion?.trim() || null,
        notas: prov.notas?.trim() || null,
        activo: prov.activo ?? true
      }

      let resultData
      if (prov.id) {
         // Update
         const { data, error } = await supabase
           .from('proveedores')
           .update({
             ...payload,
             updated_at: new Date().toISOString()
           })
           .eq('id', prov.id)
           .eq('empresa_id', authStore.empresaId)
           .select()
           .single()
         if (error) throw error
         resultData = data
      } else {
         // Insert
         const { data, error } = await supabase
           .from('proveedores')
           .insert({
             ...payload,
             empresa_id: authStore.empresaId
           })
           .select()
           .single()
         if (error) throw error
         resultData = data
      }
      await fetchProveedores()
      return resultData
    } finally {
      loading.value = false
    }
  }
  
  async function deleteProveedor(id: string) {
    if (!authStore.empresaId) return
    loading.value = true
    try {
      const { error } = await supabase
        .from('proveedores')
        .delete()
        .eq('id', id)
        .eq('empresa_id', authStore.empresaId)
      if (error) throw error
      await fetchProveedores()
    } finally {
      loading.value = false
    }
  }

  return { 
    proveedores, 
    loading, 
    fetchProveedores, 
    saveProveedor, 
    deleteProveedor
  }
})
