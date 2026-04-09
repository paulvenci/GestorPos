import { createClient } from '@supabase/supabase-js'

export default defineEventHandler(async (event) => {
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
    throw createError({ statusCode: 403, statusMessage: 'No tienes permisos para generar ventas de prueba' })
  }

  if (!perfil.empresa_id) {
    throw createError({ statusCode: 400, statusMessage: 'Tu usuario no tiene empresa asignada' })
  }

  const empresaId = perfil.empresa_id

  const [{ data: productos, error: productosError }, { data: turnos, error: turnosError }] = await Promise.all([
    adminClient
      .from('productos')
      .select('id, precio')
      .eq('empresa_id', empresaId)
      .gt('stock', 0),
    adminClient
      .from('turnos_caja')
      .select('id, id_usuario')
      .eq('empresa_id', empresaId)
      .eq('estado', 'abierto')
      .limit(1)
  ])

  if (productosError) {
    throw createError({ statusCode: 400, statusMessage: productosError.message })
  }

  if (turnosError) {
    throw createError({ statusCode: 400, statusMessage: turnosError.message })
  }

  if (!productos || productos.length === 0) {
    throw createError({ statusCode: 400, statusMessage: 'No hay productos con stock disponibles en esta empresa.' })
  }

  const turno = turnos?.[0]
  if (!turno) {
    throw createError({ statusCode: 400, statusMessage: 'Necesitas un turno abierto en esta empresa antes de generar ventas.' })
  }

  const metodos = ['efectivo', 'tarjeta', 'transferencia']
  let creadas = 0

  for (let i = 0; i < 25; i++) {
    const numItems = Math.floor(Math.random() * 4) + 1
    let ventaTotal = 0
    const lineas: Array<{
      id_producto: string
      cantidad: number
      precio_unitario: number
      subtotal: number
    }> = []

    for (let j = 0; j < numItems; j++) {
      const producto = productos[Math.floor(Math.random() * productos.length)] as { id: string; precio: number | null }
      const cantidad = Math.floor(Math.random() * 3) + 1
      const precio = Number(producto.precio || 1000)
      const subtotal = cantidad * precio
      ventaTotal += subtotal
      lineas.push({
        id_producto: producto.id,
        cantidad,
        precio_unitario: precio,
        subtotal
      })
    }

    const fecha = new Date()
    fecha.setDate(fecha.getDate() - Math.floor(Math.random() * 30))
    fecha.setHours(Math.floor(Math.random() * 10) + 10, Math.floor(Math.random() * 60), 0, 0)

    const { data: ventaAgregada, error: ventaError } = await adminClient
      .from('ventas')
      .insert({
        empresa_id: empresaId,
        id_turno: turno.id,
        id_usuario: requester.id,
        subtotal: ventaTotal,
        total: ventaTotal,
        impuestos: 0,
        descuentos: 0,
        metodo_pago: metodos[Math.floor(Math.random() * metodos.length)],
        fecha: fecha.toISOString()
      })
      .select('id')
      .single()

    if (ventaError || !ventaAgregada) {
      throw createError({ statusCode: 400, statusMessage: ventaError?.message || 'No se pudo crear la venta demo' })
    }

    const detallePayload = lineas.map((linea) => ({
      empresa_id: empresaId,
      id_venta: ventaAgregada.id,
      id_producto: linea.id_producto,
      cantidad: linea.cantidad,
      precio_unitario: linea.precio_unitario,
      subtotal: linea.subtotal
    }))

    const { error: detalleError } = await adminClient
      .from('detalle_ventas')
      .insert(detallePayload)

    if (detalleError) {
      throw createError({ statusCode: 400, statusMessage: detalleError.message })
    }

    creadas += 1
  }

  return { success: true, creadas }
})
