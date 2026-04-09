import { createClient } from '@supabase/supabase-js'

export async function requireSuperAdmin(event: Parameters<typeof defineEventHandler>[0]) {
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
  const { data: { user }, error: authError } = await adminClient.auth.getUser(token)

  if (authError || !user) {
    throw createError({ statusCode: 401, statusMessage: 'Token inválido' })
  }

  const { data: perfil, error: perfilError } = await adminClient
    .from('perfiles')
    .select('rol, empresa_id')
    .eq('id', user.id)
    .single()

  if (perfilError || !perfil || perfil.rol !== 'super_admin') {
    throw createError({ statusCode: 403, statusMessage: 'Solo el superadministrador puede usar esta función' })
  }

  return { adminClient, requester: user, perfil }
}
