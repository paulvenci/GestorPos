import { requireSuperAdmin } from '../../utils/superadmin'

export default defineEventHandler(async (event) => {
  const { adminClient } = await requireSuperAdmin(event)

  const query = getQuery(event)
  const diasRaw = Number(query.dias)
  const dias = [7, 30, 90, 365].includes(diasRaw) ? diasRaw : 30

  const { data, error } = await adminClient.rpc('get_landing_stats', { p_dias: dias })

  if (error) {
    throw createError({ statusCode: 400, statusMessage: error.message })
  }

  return data || {}
})
