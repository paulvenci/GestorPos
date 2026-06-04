import { createHash } from 'node:crypto'

/**
 * Genera un visitor_id estable por día a partir de IP + User-Agent.
 * No persiste la IP cruda: solo el hash sale del servidor.
 */
export function hashVisitor(ip: string, userAgent: string): string {
  const day = new Date().toISOString().slice(0, 10)
  return createHash('sha256').update(`${ip}|${userAgent}|${day}`).digest('hex').slice(0, 32)
}

/**
 * Devuelve la IP real del cliente, priorizando cabeceras de proxy.
 */
export function getClientIp(event: any): string {
  const xff = getHeader(event, 'x-forwarded-for')
  if (xff) {
    const first = String(xff).split(',')[0]?.trim()
    if (first) return first
  }
  const realIp = getHeader(event, 'x-real-ip')
  if (realIp) return String(realIp)
  const cf = getHeader(event, 'cf-connecting-ip')
  if (cf) return String(cf)
  return '0.0.0.0'
}

/**
 * Detección best-effort del tipo de dispositivo a partir del User-Agent.
 */
export function detectDeviceType(userAgent: string | undefined): string {
  if (!userAgent) return 'desconocido'
  const ua = userAgent.toLowerCase()
  if (/tablet|ipad|playbook|silk/.test(ua)) return 'tablet'
  if (/mobi|android|iphone|ipod|blackberry|iemobile|opera mini/.test(ua)) return 'mobile'
  return 'desktop'
}

/**
 * Rate limit en memoria por IP. Suficiente para una landing de bajo tráfico;
 * en producción a gran escala se sustituiría por Redis/Upstash.
 */
const RATE_BUCKET = new Map<string, { count: number; resetAt: number }>()
const RATE_WINDOW_MS = 60_000
const RATE_MAX = 60 // eventos/minuto/IP

export function checkRateLimit(key: string): boolean {
  const now = Date.now()
  const bucket = RATE_BUCKET.get(key)
  if (!bucket || bucket.resetAt < now) {
    RATE_BUCKET.set(key, { count: 1, resetAt: now + RATE_WINDOW_MS })
    return true
  }
  if (bucket.count >= RATE_MAX) return false
  bucket.count++
  return true
}

/**
 * Detección best-effort de bots para descontarlos de las estadísticas.
 */
export function isLikelyBot(userAgent: string | undefined): boolean {
  if (!userAgent) return true
  const ua = userAgent.toLowerCase()
  return /bot|spider|crawl|slurp|bingpreview|facebookexternalhit|whatsapp|telegram|discord|curl|wget|python-requests|headlesschrome|phantomjs|googlebot|bingbot|yandex|duckduckbot|applebot/.test(ua)
}
