import { createClient } from '@supabase/supabase-js'

export default defineEventHandler(async (event) => {
  const config = useRuntimeConfig()
  const body = await readBody(event)
  const authHeader = getHeader(event, 'authorization')

  if (!authHeader) {
    throw createError({ statusCode: 401, message: 'No autorizado' })
  }

  const supabaseUrl = config.public.supabase.url
  const supabaseServiceKey = config.supabaseServiceKey

  if (!supabaseServiceKey) {
    throw createError({ statusCode: 500, message: 'SUPABASE_SERVICE_KEY no configurada en el servidor' })
  }

  const adminClient = createClient(supabaseUrl, supabaseServiceKey, {
    auth: { autoRefreshToken: false, persistSession: false }
  })

  const token = authHeader.replace('Bearer ', '')
  const { data: { user: requester }, error: authError } = await adminClient.auth.getUser(token)

  if (authError || !requester) {
    throw createError({ statusCode: 401, message: 'Token inválido' })
  }

  const { data: perfil } = await adminClient
    .from('perfiles')
    .select('rol, empresa_id')
    .eq('id', requester.id)
    .single()

  if (!perfil || !['admin', 'super_admin'].includes(perfil.rol)) {
    throw createError({ statusCode: 403, message: 'Solo administradores autorizados pueden crear usuarios' })
  }

  const email = String(body?.email || '').trim()
  const password = String(body?.password || '')
  const nombre = String(body?.nombre || '').trim()
  const rol = String(body?.rol || 'cajero').trim() || 'cajero'
  const empresaId = typeof body?.empresa_id === 'string' && body.empresa_id
    ? body.empresa_id
    : perfil.empresa_id

  if (!email || !password || password.length < 6) {
    throw createError({ statusCode: 400, message: 'Email y contraseña (mínimo 6 caracteres) son requeridos' })
  }

  if (!empresaId) {
    throw createError({ statusCode: 400, message: 'No se encontró empresa asociada para el nuevo usuario' })
  }

  if (perfil.rol !== 'super_admin' && empresaId !== perfil.empresa_id) {
    throw createError({ statusCode: 403, message: 'No puedes crear usuarios para otra empresa' })
  }

  const { data: newUser, error: createError2 } = await adminClient.auth.admin.createUser({
    email,
    password,
    email_confirm: true,
    user_metadata: {
      nombre: nombre || email.split('@')[0],
      rol,
      empresa_id: empresaId,
      activo: true
    }
  })

  if (createError2) {
    throw createError({ statusCode: 400, message: createError2.message })
  }

  if (newUser?.user) {
    const { error: perfilError } = await adminClient.from('perfiles').upsert({
      id: newUser.user.id,
      nombre: nombre || email.split('@')[0],
      rol,
      activo: true,
      empresa_id: empresaId
    })

    if (perfilError) {
      throw createError({ statusCode: 400, message: perfilError.message })
    }
  }

  return { success: true, userId: newUser?.user?.id }
})
