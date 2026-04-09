import { requireCompanyAdmin } from '../../utils/company-admin'

export default defineEventHandler(async (event) => {
  const { adminClient, empresaId } = await requireCompanyAdmin(event)

  const [{ count: productosCount }, { count: ventasCount }] = await Promise.all([
    adminClient.from('productos').select('*', { count: 'exact', head: true }).eq('empresa_id', empresaId),
    adminClient.from('ventas').select('*', { count: 'exact', head: true }).eq('empresa_id', empresaId)
  ])

  if ((productosCount || 0) > 0) {
    throw createError({ statusCode: 400, statusMessage: 'La empresa ya tiene productos. Usa onboarding demo solo en empresas vacías.' })
  }

  if ((ventasCount || 0) > 0) {
    throw createError({ statusCode: 400, statusMessage: 'La empresa ya tiene ventas. Usa onboarding demo solo en empresas vacías.' })
  }

  const productosModule = await import('./generar-productos-demo.post')
  await productosModule.default(event as any)

  const ventasModule = await import('./generar-ventas-demo.post')
  await ventasModule.default(event as any)

  return {
    success: true,
    message: 'Onboarding demo completado para esta empresa'
  }
})
