-- ============================================================
-- Global app settings: registration fee
-- ============================================================

CREATE TABLE IF NOT EXISTS public.app_settings (
  key text PRIMARY KEY,
  value jsonb NOT NULL,
  updated_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.app_settings ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Authenticated users can manage app_settings" ON public.app_settings;
CREATE POLICY "Authenticated users can manage app_settings" ON public.app_settings
  FOR ALL TO authenticated
  USING (auth.role() = 'authenticated')
  WITH CHECK (auth.role() = 'authenticated');

INSERT INTO public.app_settings (key, value)
VALUES ('registration_fee', jsonb_build_object('amount', 1500))
ON CONFLICT (key) DO NOTHING;

CREATE OR REPLACE FUNCTION public.set_updated_at()
RETURNS trigger
LANGUAGE plpgsql
SET search_path = public, extensions, pg_temp
AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_app_settings_updated_at ON public.app_settings;
CREATE TRIGGER trg_app_settings_updated_at
BEFORE UPDATE ON public.app_settings
FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

CREATE OR REPLACE FUNCTION public.add_registration_fee_on_student_insert()
RETURNS trigger
LANGUAGE plpgsql
SET search_path = public, extensions, pg_temp
AS $$
DECLARE
  fixed_fee numeric := 1500;
BEGIN
  SELECT COALESCE((value->>'amount')::numeric, 1500)
  INTO fixed_fee
  FROM public.app_settings
  WHERE key = 'registration_fee';

  INSERT INTO public.student_registeration_fees (
    student_id,
    registeration_fee,
    is_paid,
    receipt_id
  )
  VALUES (
    NEW.id,
    fixed_fee,
    false,
    null
  );

  RETURN NEW;
END;
$$;

REVOKE ALL PRIVILEGES ON public.app_settings FROM anon;
