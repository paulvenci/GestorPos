import { defineStore } from 'pinia'
import { db } from '~/db'
import type { ProductoLocal } from '~/db'
import type { Database } from '~/types/database.types'

export const useProductosStore = defineStore('productos', () => {
  const supabase = useSupabaseClient<Database>()
  const productos = ref<ProductoLocal[]>([])
  const loading = ref(false)

  async function fetchProductos() {
    loading.value = true
    try {
      const { data, error } = await supabase
        .from('productos')
        .select('*')
        .order('nombre')
      
      if (error) throw error
      if (data) {
        const prodData = data as any as ProductoLocal[]
        productos.value = prodData
        // Sincronizar catálogo local
        await db.productos.clear()
        await db.productos.bulkPut(data as unknown as ProductoLocal[])
      }
    } catch (e) {
      console.warn('Cargando productos desde base de datos local (Offline)', e)
      productos.value = await db.productos.toArray()
    } finally {
      loading.value = false
    }
  }

  async function saveProducto(prod: Partial<ProductoLocal>) {
    loading.value = true
    try {
      let resultData
      if (prod.id) {
         // Update
         const { data, error } = await supabase
           .from('productos')
           .update({
             nombre: prod.nombre,
             sku: prod.sku,
             precio: prod.precio,
             costo: prod.costo,
             stock: prod.stock,
             categoria: prod.categoria,
             activo: prod.activo,
             imagen_url: prod.imagen_url,
             updated_at: new Date().toISOString()
           } as any)
           .eq('id', prod.id)
           .select()
           .single()
         if (error) throw error
         resultData = data
      } else {
         // Insert
         const { data, error } = await supabase
           .from('productos')
           .insert({
             nombre: prod.nombre || 'Producto Nuevo',
             sku: prod.sku,
             precio: prod.precio,
             costo: prod.costo,
             stock: prod.stock,
             categoria: prod.categoria,
             activo: prod.activo,
             imagen_url: prod.imagen_url
           } as any)
           .select()
           .single()
         if (error) throw error
         resultData = data
      }
      await fetchProductos()
      return resultData
    } finally {
      loading.value = false
    }
  }
  
  async function toggleActivo(id: string, activo: boolean) {
    loading.value = true
    try {
      const { error } = await supabase
        .from('productos')
        .update({ activo })
        .eq('id', id)
      if (error) throw error
      await fetchProductos()
    } finally {
      loading.value = false
    }
  }

  async function uploadImagen(file: File, productoId: string): Promise<string> {
    const ext = file.name.split('.').pop() || 'jpg'
    const fileName = `${productoId}_${Date.now()}.${ext}`
    const filePath = `imagenes/${fileName}`

    const { error: uploadError } = await supabase.storage
      .from('productos')
      .upload(filePath, file, {
        cacheControl: '3600',
        upsert: true
      })

    if (uploadError) throw uploadError

    const { data: urlData } = supabase.storage
      .from('productos')
      .getPublicUrl(filePath)

    return urlData.publicUrl
  }

  return { 
    productos, 
    loading, 
    fetchProductos, 
    saveProducto, 
    toggleActivo,
    uploadImagen
  }
})
