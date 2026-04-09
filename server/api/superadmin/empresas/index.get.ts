import { requireSuperAdmin } from '../../../utils/superadmin'

export default defineEventHandler(async (event) => {
  const { adminClient } = await requireSuperAdmin(event)

  const { data: empresas, error } = await adminClient
    .from('empresas')
    .select('*')
    .order('created_at', { ascending: false })

  if (error) {
    throw createError({ statusCode: 400, statusMessage: error.message })
  }

  const enriched = await Promise.all((empresas || []).map(async (empresa) => {
    const [usuariosRes, productosRes, ventasRes, adminsRes] = await Promise.all([
      adminClient.from('perfiles').select('*', { count: 'exact', head: true }).eq('empresa_id', empresa.id),
      adminClient.from('productos').select('*', { count: 'exact', head: true }).eq('empresa_id', empresa.id),
      adminClient.from('ventas').select('*', { count: 'exact', head: true }).eq('empresa_id', empresa.id),
      adminClient
        .from('perfiles')
        .select('id, nombre')
        .eq('empresa_id', empresa.id)
        .eq('rol', 'admin')
        .limit(3)
    ])

    return {
      ...empresa,
      total_usuarios: usuariosRes.count || 0,
      total_productos: productosRes.count || 0,
      total_ventas: ventasRes.count || 0,
      admins: adminsRes.data || []
    }
  }))

  return { empresas: enriched }
})

