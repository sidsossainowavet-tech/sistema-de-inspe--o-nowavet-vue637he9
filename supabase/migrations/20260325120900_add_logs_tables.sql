CREATE TABLE IF NOT EXISTS public.audit_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_email TEXT NOT NULL,
  action TEXT NOT NULL,
  details JSONB,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS public.error_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_email TEXT,
  context TEXT NOT NULL,
  error_message TEXT NOT NULL,
  details JSONB,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

ALTER TABLE public.audit_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.error_logs ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "allow_auth_insert_audit" ON public.audit_logs;
CREATE POLICY "allow_auth_insert_audit" ON public.audit_logs FOR INSERT TO authenticated WITH CHECK (true);

DROP POLICY IF EXISTS "allow_admin_read_audit" ON public.audit_logs;
CREATE POLICY "allow_admin_read_audit" ON public.audit_logs FOR SELECT TO authenticated USING (true);

DROP POLICY IF EXISTS "allow_auth_insert_error" ON public.error_logs;
CREATE POLICY "allow_auth_insert_error" ON public.error_logs FOR INSERT TO authenticated WITH CHECK (true);

DROP POLICY IF EXISTS "allow_admin_read_error" ON public.error_logs;
CREATE POLICY "allow_admin_read_error" ON public.error_logs FOR SELECT TO authenticated USING (true);
