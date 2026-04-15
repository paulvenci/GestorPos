import { defineStore } from 'pinia'
import { db } from '~/db'
import type { ProductoLocal } from '~/db'
import type { Database } from '~/types/database.types'

import { useAuthStore } from './auth'

export const useProductosStore = defineStore('productos', () => {
  const supabase = useSupabaseClient<Database>()
  const authStore = useAuthStore()
  const productos = ref<ProductoLocal[]>([])
  const loading = ref(false)

  function toNumberOrDefault(value: unknown, fallback = 0) {
    const num = typeof value === 'number' ? value : Number(value)
    return Number.isFinite(num) ? num : fallback
  }

  function normalizarPayloadProducto(prod: Partial<ProductoLocal>) {
    const esPesable = prod.es_pesable ?? false
    const stockNormalizado = toNumberOrDefault(prod.stock, 0)
    // Compatibilidad con el RPC actual de ventas: siempre descuenta stock.
    // Para pesables mantenemos un stock "virtual" alto para evitar bloqueos.
    const stockParaGuardar = esPesable ? Math.max(stockNormalizado, 1000000) : stockNormalizado

    return {
      nombre: (prod.nombre || 'Producto Nuevo').trim(),
      sku: prod.sku?.trim() || null,
      precio: toNumberOrDefault(prod.precio, 0),
      costo: toNumberOrDefault(prod.costo, 0),
      stock: stockParaGuardar,
      categoria: prod.categoria?.trim() || null,
      activo: prod.activo ?? true,
      imagen_url: prod.imagen_url ?? null,
      es_pesable: esPesable,
      stock_minimo: toNumberOrDefault(prod.stock_minimo, 0),
      margen_ganancia: toNumberOrDefault(prod.margen_ganancia, 0)
    }
  }

  async function fetchProductos() {
    loading.value = true
    try {
      const { data, error } = await supabase
        .from('productos')
        .select('*')
        .eq('empresa_id', authStore.empresaId)
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
      const payload = normalizarPayloadProducto(prod)
      let resultData
      if (prod.id) {
         // Update
         const { data, error } = await supabase
           .from('productos')
           .update({
             ...payload,
             updated_at: new Date().toISOString()
           })
           .eq('id', prod.id)
           .eq('empresa_id', authStore.empresaId)
           .select()
           .single()
         if (error) throw error
         resultData = data
      } else {
         // Insert
         const { data, error } = await supabase
           .from('productos')
           .insert({
             ...payload,
             empresa_id: authStore.empresaId
           })
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
        .eq('empresa_id', authStore.empresaId)
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
