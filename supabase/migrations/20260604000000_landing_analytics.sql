-- ════════════════════════════════════════════════════════════════════════════
-- Analítica de la landing pública (visitas, pageviews, clics en CTAs)
-- Sólo lectura para super_admin. Inserción vía service role desde Nitro.
-- ════════════════════════════════════════════════════════════════════════════

-- 1. Visitas (1 fila por sesión de 30 min, upsert por visitor_id+día)
CREATE TABLE IF NOT EXISTS public.landing_visitas (
  id              uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  visitor_id      text NOT NULL,
  user_agent      text,
  referrer        text,
  utm_source      text,
  utm_medium      text,
  utm_campaign    text,
  utm_content     text,
  utm_term        text,
  device_type     text,
  country         text,
  language        text,
  first_seen_at   timestamptz NOT NULL DEFAULT now(),
  last_seen_at    timestamptz NOT NULL DEFAULT now(),
  pages_viewed    int NOT NULL DEFAULT 1
);

CREATE INDEX IF NOT EXISTS landing_visitas_first_seen_idx
  ON public.landing_visitas (first_seen_at DESC);
CREATE INDEX IF NOT EXISTS landing_visitas_visitor_idx
  ON public.landing_visitas (visitor_id);

-- 2. Eventos (pageviews + clics en CTAs)
CREATE TABLE IF NOT EXISTS public.landing_eventos (
  id              bigserial PRIMARY KEY,
  visitor_id      text NOT NULL,
  tipo            text NOT NULL CHECK (tipo IN ('pageview','click','cta')),
  path            text,
  elemento        text,
  texto           text,
  metadata        jsonb DEFAULT '{}'::jsonb,
  created_at      timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS landing_eventos_created_at_idx
  ON public.landing_eventos (created_at DESC);
CREATE INDEX IF NOT EXISTS landing_eventos_visitor_idx
  ON public.landing_eventos (visitor_id, created_at DESC);
CREATE INDEX IF NOT EXISTS landing_eventos_tipo_idx
  ON public.landing_eventos (tipo, created_at DESC);

-- 3. RLS: lectura restringida a super_admin, escritura desde service role
ALTER TABLE public.landing_visitas ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.landing_eventos ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "superadmin_select_visitas" ON public.landing_visitas;
CREATE POLICY "superadmin_select_visitas" ON public.landing_visitas
  FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.perfiles p
      WHERE p.id = auth.uid() AND p.rol = 'super_admin'
    )
  );

DROP POLICY IF EXISTS "superadmin_select_eventos" ON public.landing_eventos;
CREATE POLICY "superadmin_select_eventos" ON public.landing_eventos
  FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.perfiles p
      WHERE p.id = auth.uid() AND p.rol = 'super_admin'
    )
  );

-- 4. RPC agregado para el dashboard
CREATE OR REPLACE FUNCTION public.get_landing_stats(p_dias int DEFAULT 30)
RETURNS json
LANGUAGE plpgsql
SECURITY DEFINER
STABLE
AS $$
DECLARE
  v_desde timestamptz := now() - (p_dias || ' days')::interval;
  v_visitas_unicas int;
  v_visitas_totales int;
  v_pageviews bigint;
  v_clicks bigint;
  v_tasa numeric;
BEGIN
  SELECT count(DISTINCT visitor_id) INTO v_visitas_unicas
  FROM public.landing_visitas
  WHERE first_seen_at >= v_desde;

  SELECT count(*) INTO v_visitas_totales
  FROM public.landing_visitas
  WHERE first_seen_at >= v_desde;

  SELECT count(*) INTO v_pageviews
  FROM public.landing_eventos
  WHERE tipo = 'pageview' AND created_at >= v_desde;

  SELECT count(*) INTO v_clicks
  FROM public.landing_eventos
  WHERE tipo IN ('click','cta') AND created_at >= v_desde;

  IF v_pageviews = 0 THEN
    v_tasa := 0;
  ELSE
    v_tasa := round((v_clicks::numeric / v_pageviews::numeric) * 100, 2);
  END IF;

  RETURN json_build_object(
    'rango_dias', p_dias,
    'visitas_unicas', v_visitas_unicas,
    'visitas_totales', v_visitas_totales,
    'pageviews', v_pageviews,
    'clicks_cta', v_clicks,
    'tasa_conversion', v_tasa,
    'por_dia', (
      SELECT coalesce(json_agg(row_to_json(d) ORDER BY dia), '[]'::json)
      FROM (
        SELECT date_trunc('day', created_at)::date AS dia,
               count(DISTINCT visitor_id) AS visitas,
               count(*) FILTER (WHERE tipo = 'pageview') AS pageviews,
               count(*) FILTER (WHERE tipo IN ('click','cta')) AS clicks
        FROM public.landing_eventos
        WHERE created_at >= v_desde
        GROUP BY 1
        ORDER BY 1
      ) d
    ),
    'top_ctas', (
      SELECT coalesce(json_agg(row_to_json(t)), '[]'::json)
      FROM (
        SELECT elemento, texto, count(*) AS clicks
        FROM public.landing_eventos
        WHERE tipo IN ('click','cta') AND created_at >= v_desde
        GROUP BY elemento, texto
        ORDER BY clicks DESC
        LIMIT 10
      ) t
    ),
    'top_referrers', (
      SELECT coalesce(json_agg(row_to_json(t)), '[]'::json)
      FROM (
        SELECT coalesce(nullif(referrer, ''), 'Directo') AS referrer,
               count(*) AS visitas
        FROM public.landing_visitas
        WHERE first_seen_at >= v_desde
        GROUP BY 1
        ORDER BY visitas DESC
        LIMIT 10
      ) t
    ),
    'dispositivos', (
      SELECT coalesce(json_agg(row_to_json(t)), '[]'::json)
      FROM (
        SELECT coalesce(nullif(device_type, ''), 'desconocido') AS device_type,
               count(*) AS total
        FROM public.landing_visitas
        WHERE first_seen_at >= v_desde
        GROUP BY 1
        ORDER BY 2 DESC
      ) t
    )
  );
END;
$$;

REVOKE ALL ON FUNCTION public.get_landing_stats(int) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.get_landing_stats(int) TO authenticated;
