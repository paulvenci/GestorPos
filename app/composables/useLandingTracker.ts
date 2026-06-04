import { nextTick } from 'vue'
import { useState } from '#imports'

interface LandingState {
  visitorId: string | null
  pageviewSent: boolean
}

let state: ReturnType<typeof useState<LandingState>> | null = null
let queue: Array<() => void> = []
let flushing = false

function getState() {
  if (!state) {
    state = useState<LandingState>('landing-tracker', () => ({ visitorId: null, pageviewSent: false }))
  }
  return state
}

function getVisitorIdFromStorage(): string | null {
  try {
    if (typeof sessionStorage === 'undefined') return null
    return sessionStorage.getItem('gpos_visitor_id')
  } catch (_) {
    return null
  }
}

function persistVisitorId(id: string) {
  try {
    if (typeof sessionStorage !== 'undefined') {
      sessionStorage.setItem('gpos_visitor_id', id)
    }
  } catch (_) { /* ignore */ }
}

function getStoredUtm(): Record<string, string> {
  try {
    if (typeof sessionStorage === 'undefined') return {}
    const raw = sessionStorage.getItem('gpos_utm')
    return raw ? JSON.parse(raw) : {}
  } catch (_) {
    return {}
  }
}

function captureUtmFromUrl() {
  if (typeof window === 'undefined') return
  try {
    const params = new URLSearchParams(window.location.search)
    const utm: Record<string, string> = {}
    for (const k of ['utm_source', 'utm_medium', 'utm_campaign', 'utm_content', 'utm_term']) {
      const v = params.get(k)
      if (v) utm[k] = v
    }
    if (Object.keys(utm).length > 0) {
      sessionStorage.setItem('gpos_utm', JSON.stringify(utm))
    }
  } catch (_) { /* ignore */ }
}

function respectDnt(): boolean {
  if (typeof navigator === 'undefined') return false
  const dnt = (navigator as any).doNotTrack || (window as any).doNotTrack
  return dnt === '1' || dnt === 'yes'
}

async function send(payload: Record<string, any>) {
  if (typeof window === 'undefined') return
  if (respectDnt()) return

  const s = getState()
  const visitorId = s.value.visitorId || getVisitorIdFromStorage()
  const body = JSON.stringify({ ...payload, visitorId })

  if (navigator.sendBeacon) {
    try {
      const blob = new Blob([body], { type: 'application/json' })
      const ok = navigator.sendBeacon('/api/analytics/track', blob)
      if (ok) {
        if (payload.visitorId) {
          s.value.visitorId = payload.visitorId
          persistVisitorId(payload.visitorId)
        }
        return
      }
    } catch (_) { /* fallback */ }
  }

  try {
    fetch('/api/analytics/track', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body,
      keepalive: true
    }).then((res) => res.json()).then((data) => {
      if (data?.visitorId) {
        s.value.visitorId = data.visitorId
        persistVisitorId(data.visitorId)
      }
    }).catch(() => { /* swallow */ })
  } catch (_) { /* ignore */ }
}

function enqueue(fn: () => void) {
  queue.push(fn)
  if (!flushing) {
    flushing = true
    nextTick(() => {
      const items = queue.slice()
      queue = []
      flushing = false
      for (const fn of items) {
        try { fn() } catch (_) { /* ignore */ }
      }
    })
  }
}

export const useLandingTracker = () => {
  if (typeof window === 'undefined') {
    return {
      trackPageview: () => { /* noop en SSR */ },
      trackClick: () => { /* noop en SSR */ },
      init: () => { /* noop en SSR */ }
    }
  }

  const s = getState()
  if (!s.value.visitorId) {
    s.value.visitorId = getVisitorIdFromStorage()
  }

  const init = () => {
    if (s.value.pageviewSent) return
    captureUtmFromUrl()
    enqueue(() => {
      send({
        tipo: 'pageview',
        path: window.location.pathname + window.location.hash,
        metadata: { utm: getStoredUtm() }
      })
      s.value.pageviewSent = true
    })
  }

  const trackPageview = (path?: string) => {
    enqueue(() => send({ tipo: 'pageview', path }))
  }

  const trackClick = (elemento: string, texto?: string, metadata?: Record<string, any>) => {
    enqueue(() => send({
      tipo: 'cta',
      path: window.location.pathname + window.location.hash,
      elemento,
      texto,
      metadata: { ...(metadata || {}), utm: getStoredUtm() }
    }))
  }

  return { init, trackPageview, trackClick }
}
