import { requireSuperAdmin } from '../../../utils/superadmin'

export default defineEventHandler(async (event) => {
  const { adminClient } = await requireSuperAdmin(event)
  const body = await readBody(event)

  const nombre = String(body?.nombre || '').trim()
  const plan = body?.plan === 'pro' ? 'pro' : 'basico'
  const activo = body?.activo !== false
  const fechaVencimiento = body?.fecha_vencimiento ? String(body.fecha_vencimiento) : null

  if (!nombre) {
    throw createError({ statusCode: 400, statusMessage: 'El nombre del negocio es obligatorio' })
  }

  const { data: empresa, error: empresaError } = await adminClient
    .from('empresas')
    .insert({
      nombre,
      plan,
      activo,
      fecha_vencimiento: fechaVencimiento
    })
    .select()
    .single()

  if (empresaError || !empresa) {
    throw createError({ statusCode: 400, statusMessage: empresaError?.message || 'No se pudo crear la empresa' })
  }

  const adminEmail = String(body?.admin_email || '').trim()
  const adminPassword = String(body?.admin_password || '')
  const adminNombre = String(body?.admin_nombre || '').trim()

  let adminUserId: string | null = null

  if (adminEmail) {
    if (!adminPassword || adminPassword.length < 6) {
      throw createError({ statusCode: 400, statusMessage: 'La contraseÃ±a del administrador debe tener al menos 6 caracteres' })
    }

    const { data: newUser, error: createUserError } = await adminClient.auth.admin.createUser({
      email: adminEmail,
      password: adminPassword,
      email_confirm: true,
      user_metadata: {
        nombre: adminNombre || adminEmail.split('@')[0],
        rol: 'admin',
        empresa_id: empresa.id,
        activo: true
      }
    })

    if (createUserError) {
      throw createError({ statusCode: 400, statusMessage: createUserError.message })
    }

    adminUserId = newUser.user?.id || null

    if (adminUserId) {
      const { error: perfilError } = await adminClient.from('perfiles').upsert({
        id: adminUserId,
        nombre: adminNombre || adminEmail.split('@')[0],
        rol: 'admin',
        activo: true,
        empresa_id: empresa.id
      })

      if (perfilError) {
        throw createError({ statusCode: 400, statusMessage: perfilError.message })
      }
    }
  }

  return { empresa, adminUserId }
})

