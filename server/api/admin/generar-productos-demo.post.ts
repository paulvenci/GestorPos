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
    throw createError({ statusCode: 403, statusMessage: 'No tienes permisos para generar productos de prueba' })
  }

  if (!perfil.empresa_id) {
    throw createError({ statusCode: 400, statusMessage: 'Tu usuario no tiene empresa asignada' })
  }

  const empresaId = perfil.empresa_id

  const { count } = await adminClient
    .from('productos')
    .select('*', { count: 'exact', head: true })
    .eq('empresa_id', empresaId)

  if ((count || 0) > 0) {
    throw createError({ statusCode: 400, statusMessage: 'La empresa ya tiene productos registrados. Usa esta carga demo solo sobre catálogos vacíos o limpia primero.' })
  }

  const productosDemo = [
    { nombre: 'Coca-Cola 1.5L', categoria: 'Bebidas', precio: 2490, costo: 1650, stock: 24, sku: '7800000000011' },
    { nombre: 'Pan Hallulla', categoria: 'Panadería', precio: 2490, costo: 1600, stock: 1000000, sku: 'PESO-PAN-001', es_pesable: true, stock_minimo: 0 },
    { nombre: 'Arroz Grado 1kg', categoria: 'Abarrotes', precio: 1690, costo: 1180, stock: 30, sku: '7800000000012' },
    { nombre: 'Aceite Vegetal 1L', categoria: 'Abarrotes', precio: 2790, costo: 2120, stock: 18, sku: '7800000000013' },
    { nombre: 'Leche Entera 1L', categoria: 'Lácteos', precio: 1290, costo: 910, stock: 40, sku: '7800000000014' },
    { nombre: 'Yogurt Batido Frutilla', categoria: 'Lácteos', precio: 590, costo: 360, stock: 36, sku: '7800000000015' },
    { nombre: 'Queso Gauda Laminado', categoria: 'Lácteos', precio: 2890, costo: 2050, stock: 14, sku: '7800000000016' },
    { nombre: 'Azúcar 1kg', categoria: 'Abarrotes', precio: 1490, costo: 980, stock: 25, sku: '7800000000017' },
    { nombre: 'Té en bolsitas 20 un', categoria: 'Abarrotes', precio: 1290, costo: 780, stock: 20, sku: '7800000000018' },
    { nombre: 'Café Instantáneo 170g', categoria: 'Abarrotes', precio: 4590, costo: 3520, stock: 12, sku: '7800000000019' },
    { nombre: 'Maní Salado 100g', categoria: 'Snacks', precio: 990, costo: 540, stock: 22, sku: '7800000000020' },
    { nombre: 'Barra de Cereal 30g', categoria: 'Snacks', precio: 490, costo: 240, stock: 35, sku: '7800000000021' },
    { nombre: 'Papas Fritas Familiar', categoria: 'Snacks', precio: 2190, costo: 1410, stock: 16, sku: '7800000000022' },
    { nombre: 'Agua Mineral 500ml', categoria: 'Bebidas', precio: 890, costo: 420, stock: 28, sku: '7800000000023' },
    { nombre: 'Jugo Naranja 1.5L', categoria: 'Bebidas', precio: 1990, costo: 1220, stock: 18, sku: '7800000000024' },
    { nombre: 'Bebida Energética 473ml', categoria: 'Bebidas', precio: 1790, costo: 1050, stock: 15, sku: '7800000000025' },
    { nombre: 'Detergente Líquido 3L', categoria: 'Limpieza', precio: 5890, costo: 4210, stock: 10, sku: '7800000000026' },
    { nombre: 'Cloro Gel 900ml', categoria: 'Limpieza', precio: 1390, costo: 780, stock: 18, sku: '7800000000027' },
    { nombre: 'Jabón Líquido Manos 500ml', categoria: 'Limpieza', precio: 1990, costo: 1180, stock: 14, sku: '7800000000028' },
    { nombre: 'Bolsa Reutilizable', categoria: 'Varios', precio: 290, costo: 90, stock: 80, sku: '7800000000029' }
  ]

  const payload = productosDemo.map((producto, index) => {
    const precio = Number(producto.precio || 0)
    const costo = Number(producto.costo || 0)
    const stock = Number(producto.stock || 0)
    const margen = costo > 0 ? Math.round(((precio - costo) / costo) * 100) : 30

    return {
      empresa_id: empresaId,
      nombre: producto.nombre,
      sku: producto.sku || `DEMO-${index + 1}`,
      precio,
      costo,
      stock,
      categoria: producto.categoria,
      activo: true,
      es_pesable: Boolean(producto.es_pesable),
      stock_minimo: producto.stock_minimo ?? 5,
      margen_ganancia: margen,
      updated_at: new Date().toISOString()
    }
  })

  const { error: insertError } = await adminClient
    .from('productos')
    .insert(payload)

  if (insertError) {
    throw createError({ statusCode: 400, statusMessage: insertError.message })
  }

  return { success: true, creados: payload.length }
})
