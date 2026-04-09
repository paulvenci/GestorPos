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

  const { error } = await adminClient
    .from('productos')
    .delete()
    .eq('empresa_id', empresaId)
    .like('sku', '78000000000%')

  if (error) {
    throw createError({ statusCode: 400, statusMessage: error.message })
  }

  const { error: pesableError } = await adminClient
    .from('productos')
    .delete()
    .eq('empresa_id', empresaId)
    .eq('sku', 'PESO-PAN-001')

  if (pesableError) {
    throw createError({ statusCode: 400, statusMessage: pesableError.message })
  }

  return { success: true }
})
