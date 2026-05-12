import { createClient } from '@supabase/supabase-js'
import type { Database } from '~/types/database.types'

export default defineEventHandler(async (event) => {
  const config = useRuntimeConfig()
  const body = await readBody(event)

  const { nombreNegocio, email, password, nombreUsuario } = body

  if (!nombreNegocio || !email || !password || !nombreUsuario) {
    throw createError({ statusCode: 400, statusMessage: 'Todos los campos son obligatorios' })
  }

  if (password.length < 6) {
    throw createError({ statusCode: 400, statusMessage: 'La contraseña debe tener al menos 6 caracteres' })
  }

  const adminClient = createClient<Database>(config.public.supabase.url, config.supabaseServiceKey, {
    auth: { autoRefreshToken: false, persistSession: false }
  })

  // 1. Crear Empresa (7 días de prueba)
  const fechaVencimiento = new Date()
  fechaVencimiento.setDate(fechaVencimiento.getDate() + 7)

  const { data: empresa, error: empresaError } = await adminClient
    .from('empresas')
    .insert({
      nombre: nombreNegocio,
      plan: 'basico',
      activo: true,
      fecha_vencimiento: fechaVencimiento.toISOString()
    })
    .select()
    .single()

  if (empresaError || !empresa) {
    throw createError({ statusCode: 400, statusMessage: 'Error al crear el negocio: ' + empresaError?.message })
  }

  // 2. Crear Usuario Auth
  const { data: newUser, error: createUserError } = await adminClient.auth.admin.createUser({
    email: email,
    password: password,
    email_confirm: true, // Confirmamos automáticamente para la prueba
    user_metadata: {
      nombre: nombreUsuario,
      rol: 'admin',
      empresa_id: empresa.id
    }
  })

  if (createUserError) {
    // Rollback empresa? (Opcional, mejor limpiar después)
    await adminClient.from('empresas').delete().eq('id', empresa.id)
    throw createError({ statusCode: 400, statusMessage: 'Error al crear usuario: ' + createUserError.message })
  }

  const userId = newUser.user?.id

  if (!userId) {
    throw createError({ statusCode: 500, statusMessage: 'Error interno: no se generó ID de usuario' })
  }

  // 3. Crear Perfil (Usamos upsert porque el trigger handle_new_user ya podría haberlo creado)
  const { error: perfilError } = await adminClient.from('perfiles').upsert({
    id: userId,
    nombre: nombreUsuario,
    rol: 'admin',
    activo: true,
    empresa_id: empresa.id
  })

  if (perfilError) {
    throw createError({ statusCode: 400, statusMessage: 'Error al crear perfil: ' + perfilError.message })
  }

  // 4. Datos de Demo (Opcional pero recomendado)
  try {
    const categoriasDefault = [
      { nombre: 'General', empresa_id: empresa.id, activo: true },
      { nombre: 'Almacén', empresa_id: empresa.id, activo: true },
      { nombre: 'Bebidas', empresa_id: empresa.id, activo: true }
    ]
    await adminClient.from('categorias').insert(categoriasDefault)
    
    // Configuración por defecto
    await adminClient.from('configuracion').insert({
      empresa_id: empresa.id,
      nombre_negocio: nombreNegocio,
      margen_ganancia_defecto: 30,
      stock_minimo_defecto: 5
    })
  } catch (e) {
    console.warn('Error al crear datos de demo, ignorando...', e)
  }

  return { success: true, message: 'Registro exitoso' }
})
