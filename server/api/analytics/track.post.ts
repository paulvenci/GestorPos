import { createClient } from '@supabase/supabase-js'
import {
  hashVisitor,
  getClientIp,
  detectDeviceType,
  checkRateLimit,
  isLikelyBot
} from '../../utils/analytics'

interface TrackBody {
  tipo?: 'pageview' | 'click' | 'cta'
  path?: string
  elemento?: string
  texto?: string
  metadata?: Record<string, any>
  visitorId?: string
}

export default defineEventHandler(async (event) => {
  const config = useRuntimeConfig()
  const body = await readBody<TrackBody>(event).catch(() => ({} as TrackBody))

  const ip = getClientIp(event)
  const userAgent = getHeader(event, 'user-agent') || ''

  if (isLikelyBot(userAgent)) {
    return { ok: true, skipped: 'bot' }
  }

  if (!checkRateLimit(ip)) {
    throw createError({ statusCode: 429, statusMessage: 'Demasiadas solicitudes' })
  }

  if (!config.supabaseServiceKey) {
    throw createError({ statusCode: 500, statusMessage: 'Servicio no configurado' })
  }

  const adminClient = createClient(config.public.supabase.url, config.supabaseServiceKey, {
    auth: { autoRefreshToken: false, persistSession: false }
  })

  const visitorId = (body?.visitorId && /^[a-f0-9]{32}$/.test(body.visitorId))
    ? body.visitorId
    : hashVisitor(ip, userAgent)

  const tipo = (body?.tipo === 'cta' || body?.tipo === 'click') ? body.tipo : 'pageview'

  try {
    if (tipo === 'pageview') {
      // Upsert de visita del día
      const country = getHeader(event, 'cf-ipcountry') || getHeader(event, 'x-vercel-ip-country') || null
      const language = getHeader(event, 'accept-language')?.split(',')[0]?.trim() || null
      const referrer = getHeader(event, 'referer') || getHeader(event, 'referrer') || null

      const deviceType = detectDeviceType(userAgent)
      const userAgentShort = userAgent.slice(0, 500)
      const referrerShort = referrer ? String(referrer).slice(0, 500) : null

      const { data: existing } = await adminClient
        .from('landing_visitas')
        .select('id, pages_viewed')
        .eq('visitor_id', visitorId)
        .gte('first_seen_at', new Date().toISOString().slice(0, 10))
        .maybeSingle()

      if (existing?.id) {
        await adminClient
          .from('landing_visitas')
          .update({
            last_seen_at: new Date().toISOString(),
            pages_viewed: (existing.pages_viewed || 0) + 1
          })
          .eq('id', existing.id)
      } else {
        await adminClient.from('landing_visitas').insert({
          visitor_id: visitorId,
          user_agent: userAgentShort,
          referrer: referrerShort,
          device_type: deviceType,
          country: country ? String(country).slice(0, 8) : null,
          language: language ? String(language).slice(0, 16) : null
        })
      }
    }

    await adminClient.from('landing_eventos').insert({
      visitor_id: visitorId,
      tipo,
      path: body?.path ? String(body.path).slice(0, 255) : null,
      elemento: body?.elemento ? String(body.elemento).slice(0, 100) : null,
      texto: body?.texto ? String(body.texto).slice(0, 200) : null,
      metadata: body?.metadata && typeof body.metadata === 'object' ? body.metadata : {}
    })

    return { ok: true, visitorId }
  } catch (err: any) {
    console.error('[/api/analytics/track] error:', err?.message || err)
    return { ok: false, error: 'No se pudo registrar el evento' }
  }
})
