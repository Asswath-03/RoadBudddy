-- ============================================================
-- Mechanic Approval System
-- ============================================================

-- 1. mechanic_applications  (submitted by mechanics, pending review)
-- ============================================================
CREATE TABLE IF NOT EXISTS public.mechanic_applications (
  id               UUID             NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  name             TEXT             NOT NULL,
  phone_number     TEXT             NOT NULL,
  email            TEXT             NOT NULL,
  garage_name      TEXT             NOT NULL,
  services         TEXT             NOT NULL,
  address          TEXT             NOT NULL,
  latitude         DOUBLE PRECISION,
  longitude        DOUBLE PRECISION,
  experience_years INTEGER          NOT NULL DEFAULT 0,
  status           TEXT             NOT NULL DEFAULT 'pending'
                                    CHECK (status IN ('pending','approved','rejected')),
  admin_note       TEXT,
  created_at       TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at       TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

ALTER TABLE public.mechanic_applications ENABLE ROW LEVEL SECURITY;

-- Anyone can insert (submit the application form)
CREATE POLICY "public_insert_mechanic_applications"
  ON public.mechanic_applications FOR INSERT WITH CHECK (true);

-- Admin reads via service-role key (bypasses RLS)
-- Anon cannot read
CREATE POLICY "no_public_select_mechanic_applications"
  ON public.mechanic_applications FOR SELECT USING (false);

-- auto-update updated_at if trigger function doesn't exist yet
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_proc
    WHERE proname = 'update_updated_at_column'
      AND pronamespace = (SELECT oid FROM pg_namespace WHERE nspname = 'public')
  ) THEN
    EXECUTE $func$
      CREATE FUNCTION public.update_updated_at_column()
      RETURNS TRIGGER LANGUAGE plpgsql SET search_path = public AS $body$
      BEGIN NEW.updated_at = now(); RETURN NEW; END;
      $body$
    $func$;
  END IF;
END
$$;

CREATE TRIGGER mechanic_applications_updated_at
  BEFORE UPDATE ON public.mechanic_applications
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- ============================================================
-- 2. verified_mechanics  (approved mechanics visible to users)
-- ============================================================
CREATE TABLE IF NOT EXISTS public.verified_mechanics (
  id               UUID             NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  application_id   UUID             REFERENCES public.mechanic_applications(id),
  name             TEXT             NOT NULL,
  phone_number     TEXT             NOT NULL,
  email            TEXT             NOT NULL,
  garage_name      TEXT             NOT NULL,
  services         TEXT             NOT NULL,
  address          TEXT             NOT NULL,
  latitude         DOUBLE PRECISION NOT NULL,
  longitude        DOUBLE PRECISION NOT NULL,
  experience_years INTEGER          NOT NULL DEFAULT 0,
  verified         BOOLEAN          NOT NULL DEFAULT true,
  created_at       TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

ALTER TABLE public.verified_mechanics ENABLE ROW LEVEL SECURITY;

-- Anyone can read verified mechanics (they appear in search)
CREATE POLICY "public_select_verified_mechanics"
  ON public.verified_mechanics FOR SELECT USING (true);

-- Only service-role can insert/update/delete
CREATE POLICY "no_public_write_verified_mechanics"
  ON public.verified_mechanics FOR INSERT WITH CHECK (false);
