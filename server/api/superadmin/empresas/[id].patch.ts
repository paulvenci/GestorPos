import { requireSuperAdmin } from '../../../utils/superadmin'

export default defineEventHandler(async (event) => {
  const { adminClient } = await requireSuperAdmin(event)
  const empresaId = getRouterParam(event, 'id')
  const body = await readBody(event)

  if (!empresaId) {
    throw createError({ statusCode: 400, statusMessage: 'Empresa no especificada' })
  }

  const payload: Record<string, unknown> = {
    updated_at: new Date().toISOString()
  }

  if (typeof body?.nombre === 'string') payload.nombre = body.nombre.trim()
  if (body?.plan === 'basico' || body?.plan === 'pro') payload.plan = body.plan
  if (typeof body?.activo === 'boolean') payload.activo = body.activo
  if ('fecha_vencimiento' in (body || {})) payload.fecha_vencimiento = body.fecha_vencimiento || null

  const { data, error } = await adminClient
    .from('empresas')
    .update(payload)
    .eq('id', empresaId)
    .select()
    .single()

  if (error) {
    throw createError({ statusCode: 400, statusMessage: error.message })
  }

  return { empresa: data }
})

