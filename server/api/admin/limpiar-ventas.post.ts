import { requireCompanyAdmin } from '../../utils/company-admin'

export default defineEventHandler(async (event) => {
  const { adminClient, empresaId } = await requireCompanyAdmin(event)

  const { error } = await adminClient
    .from('ventas')
    .delete()
    .eq('empresa_id', empresaId)
    .neq('id', '00000000-0000-0000-0000-000000000000')

  if (error) {
    throw createError({ statusCode: 400, statusMessage: error.message })
  }

  return { success: true }
})
