-- Create Tables
CREATE TABLE IF NOT EXISTS public.users (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  email TEXT NOT NULL UNIQUE,
  role TEXT NOT NULL DEFAULT 'evaluator',
  active BOOLEAN NOT NULL DEFAULT true,
  avatar TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS public.items (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  active BOOLEAN NOT NULL DEFAULT true,
  mandatory BOOLEAN NOT NULL DEFAULT true
);

CREATE TABLE IF NOT EXISTS public.facilities (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  description TEXT,
  frequency_days INT,
  category TEXT
);

CREATE TABLE IF NOT EXISTS public.evaluators (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  email TEXT NOT NULL,
  phone TEXT,
  avatar TEXT
);

CREATE TABLE IF NOT EXISTS public.contacts (
  id TEXT PRIMARY KEY,
  sector TEXT NOT NULL,
  email TEXT NOT NULL,
  phone TEXT
);

-- RLS Configuration
ALTER TABLE public.users ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.items ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.facilities ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.evaluators ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.contacts ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "allow_all_users" ON public.users;
CREATE POLICY "allow_all_users" ON public.users FOR ALL TO authenticated USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "allow_all_items" ON public.items;
CREATE POLICY "allow_all_items" ON public.items FOR ALL TO authenticated USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "allow_all_facilities" ON public.facilities;
CREATE POLICY "allow_all_facilities" ON public.facilities FOR ALL TO authenticated USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "allow_all_evaluators" ON public.evaluators;
CREATE POLICY "allow_all_evaluators" ON public.evaluators FOR ALL TO authenticated USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "allow_all_contacts" ON public.contacts;
CREATE POLICY "allow_all_contacts" ON public.contacts FOR ALL TO authenticated USING (true) WITH CHECK (true);

-- Seed Initial Super Admin User for universal authentication
DO $$
DECLARE
  new_user_id uuid;
BEGIN
  IF NOT EXISTS (SELECT 1 FROM auth.users WHERE email = 'sidsossai@nowavet.com.br') THEN
    new_user_id := gen_random_uuid();
    INSERT INTO auth.users (
      id, instance_id, email, encrypted_password, email_confirmed_at,
      created_at, updated_at, raw_app_meta_data, raw_user_meta_data,
      is_super_admin, role, aud,
      confirmation_token, recovery_token, email_change_token_new,
      email_change, email_change_token_current,
      phone, phone_change, phone_change_token, reauthentication_token
    ) VALUES (
      new_user_id,
      '00000000-0000-0000-0000-000000000000',
      'sidsossai@nowavet.com.br',
      crypt('nwv20031511@', gen_salt('bf')),
      NOW(), NOW(), NOW(),
      '{"provider": "email", "providers": ["email"]}',
      '{"name": "Sidimar Sossai"}',
      false, 'authenticated', 'authenticated',
      '', '', '', '', '',
      NULL, '', '', ''
    );

    INSERT INTO public.users (id, name, email, role, active)
    VALUES (new_user_id, 'Sidimar Sossai', 'sidsossai@nowavet.com.br', 'admin', true)
    ON CONFLICT (email) DO NOTHING;
  END IF;
END $$;
