-- Gestor de permisos por rol en configuracion global
ALTER TABLE public.configuracion
ADD COLUMN IF NOT EXISTS role_permissions JSONB;

UPDATE public.configuracion
SET role_permissions = COALESCE(
  role_permissions,
  '{
    "admin": ["dashboard","pos","caja","inventario","ajuste_stock","categorias","reportes","configuracion"],
    "supervisor": ["dashboard","pos","caja","inventario","ajuste_stock","categorias","reportes"],
    "cajero": ["dashboard","pos","caja"]
  }'::jsonb
);

ALTER TABLE public.configuracion
ALTER COLUMN role_permissions SET DEFAULT '{
  "admin": ["dashboard","pos","caja","inventario","ajuste_stock","categorias","reportes","configuracion"],
  "supervisor": ["dashboard","pos","caja","inventario","ajuste_stock","categorias","reportes"],
  "cajero": ["dashboard","pos","caja"]
}'::jsonb;
