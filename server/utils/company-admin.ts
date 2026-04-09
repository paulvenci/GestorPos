import { createClient } from '@supabase/supabase-js'

export async function requireCompanyAdmin(event: Parameters<typeof defineEventHandler>[0]) {
  const config = useRuntimeConfig()
  const authHeader = getHeader(event, 'authorization')

  if (!authHeader) {
    throw createError({ statusCode: 401, statusMessage: 'No autorizado' })
  }

  if (!config.supabaseServiceKey) {
    throw createError({ statusCode: 500, statusMessage: 'SUPABASE_SERVICE_KEY no configurada en el servidor' })
  }

  const adminClient = createClient(config.public.supabase.url, config.supabaseServiceKey, {
    auth: { autoRefreshToken: false, persistSession: false }
  })

  const token = authHeader.replace('Bearer ', '')
  const { data: { user: requester }, error: authError } = await adminClient.auth.getUser(token)

  if (authError || !requester) {
    throw createError({ statusCode: 401, statusMessage: 'Token inválido' })
  }

  const { data: perfil, error: perfilError } = await adminClient
    .from('perfiles')
    .select('rol, empresa_id, activo')
    .eq('id', requester.id)
    .single()

  if (perfilError || !perfil || perfil.activo === false) {
    throw createError({ statusCode: 403, statusMessage: 'Usuario sin perfil válido' })
  }

  if (!['admin', 'supervisor', 'super_admin'].includes(perfil.rol)) {
    throw createError({ statusCode: 403, statusMessage: 'No tienes permisos para esta acción' })
  }

  if (!perfil.empresa_id) {
    throw createError({ statusCode: 400, statusMessage: 'Tu usuario no tiene empresa asignada' })
  }

  return {
    adminClient,
    requester,
    perfil,
    empresaId: perfil.empresa_id
  }
}
