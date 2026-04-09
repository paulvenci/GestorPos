BEGIN;

ALTER TABLE public.perfiles
  DROP CONSTRAINT IF EXISTS perfiles_rol_check;

ALTER TABLE public.perfiles
  ADD CONSTRAINT perfiles_rol_check
  CHECK (rol IN ('super_admin', 'admin', 'supervisor', 'cajero'));

CREATE OR REPLACE FUNCTION public.is_super_admin()
RETURNS BOOLEAN
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT COALESCE(public.current_user_role() = 'super_admin', false)
$$;

COMMIT;
