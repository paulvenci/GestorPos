import { requireCompanyAdmin } from '../../utils/company-admin'

export default defineEventHandler(async (event) => {
  const { adminClient, empresaId } = await requireCompanyAdmin(event)

  const { count } = await adminClient
    .from('ventas')
    .select('*', { count: 'exact', head: true })
    .eq('empresa_id', empresaId)

  if ((count || 0) > 0) {
    throw createError({ statusCode: 400, statusMessage: 'No puedes limpiar productos demo mientras existan ventas en esta empresa.' })
  }

  const { data: demoProducts, error: demoProductsError } = await adminClient
    .from('productos')
    .select('id')
    .eq('empresa_id', empresaId)
    .or('sku.like.78000000000%,sku.eq.PESO-PAN-001')

  if (demoProductsError) {
    throw createError({ statusCode: 400, statusMessage: demoProductsError.message })
  }

  const productIds = (demoProducts || []).map(product => product.id).filter(Boolean)

  if (productIds.length === 0) {
    return { success: true, eliminados: 0 }
  }

  const { error: ajustesError } = await adminClient
    .from('ajustes_stock')
    .delete()
    .eq('empresa_id', empresaId)
    .in('id_producto', productIds)

  if (ajustesError) {
    throw createError({ statusCode: 400, statusMessage: ajustesError.message })
  }

  const { error: productosError } = await adminClient
    .from('productos')
    .delete()
    .eq('empresa_id', empresaId)
    .in('id', productIds)

  if (productosError) {
    throw createError({ statusCode: 400, statusMessage: productosError.message })
  }

  return { success: true, eliminados: productIds.length }
})
