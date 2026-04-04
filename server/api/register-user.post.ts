import { createClient } from '@supabase/supabase-js'

export default defineEventHandler(async (event) => {
  const config = useRuntimeConfig()
  const body = await readBody(event)
  const authHeader = getHeader(event, 'authorization')

  if (!authHeader) {
    throw createError({ statusCode: 401, message: 'No autorizado' })
  }

  // Verificar que el solicitante es admin
  const supabaseUrl = config.public.supabase.url
  const supabaseServiceKey = config.supabaseServiceKey

  if (!supabaseServiceKey) {
    throw createError({ statusCode: 500, message: 'SUPABASE_SERVICE_KEY no configurada en el servidor' })
  }

  const adminClient = createClient(supabaseUrl, supabaseServiceKey, {
    auth: { autoRefreshToken: false, persistSession: false }
  })

  // Verificar token del solicitante
  const token = authHeader.replace('Bearer ', '')
  const { data: { user: requester }, error: authError } = await adminClient.auth.getUser(token)

  if (authError || !requester) {
    throw createError({ statusCode: 401, message: 'Token inválido' })
  }

  // Verificar que es admin
  const { data: perfil } = await adminClient
    .from('perfiles')
    .select('rol')
    .eq('id', requester.id)
    .single()

  if (perfil?.rol !== 'admin') {
    throw createError({ statusCode: 403, message: 'Solo los administradores pueden crear usuarios' })
  }

  // Crear usuario
  const { email, password, nombre, rol } = body

  if (!email || !password || password.length < 6) {
    throw createError({ statusCode: 400, message: 'Email y contraseña (mínimo 6 caracteres) son requeridos' })
  }

  const { data: newUser, error: createError2 } = await adminClient.auth.admin.createUser({
    email,
    password,
    email_confirm: true,
    user_metadata: { nombre, rol }
  })

  if (createError2) {
    throw createError({ statusCode: 400, message: createError2.message })
  }

  // Crear perfil
  if (newUser?.user) {
    await adminClient.from('perfiles').upsert({
      id: newUser.user.id,
      nombre: nombre || email.split('@')[0],
      rol: rol || 'cajero',
      activo: true
    })
  }

  return { success: true, userId: newUser?.user?.id }
})
