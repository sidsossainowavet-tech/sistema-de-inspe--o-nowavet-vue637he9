-- Permite que o sistema registre logs mesmo quando a sessão está sendo encerrada (anon)
-- Isso evita o erro 42501 (RLS) ao disparar logs durante o processo de logout ou login com falha

DROP POLICY IF EXISTS "allow_anon_insert_audit" ON public.audit_logs;
CREATE POLICY "allow_anon_insert_audit" ON public.audit_logs FOR INSERT TO anon WITH CHECK (true);

DROP POLICY IF EXISTS "allow_anon_insert_error" ON public.error_logs;
CREATE POLICY "allow_anon_insert_error" ON public.error_logs FOR INSERT TO anon WITH CHECK (true);
