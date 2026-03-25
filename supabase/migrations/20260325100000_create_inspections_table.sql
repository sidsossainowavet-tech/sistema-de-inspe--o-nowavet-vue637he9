CREATE TABLE IF NOT EXISTS public.inspections (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  facility_id TEXT,
  evaluator_id TEXT,
  structure TEXT NOT NULL,
  type TEXT NOT NULL,
  date TIMESTAMPTZ NOT NULL,
  start_time TIMESTAMPTZ,
  end_time TIMESTAMPTZ,
  duration_seconds INTEGER,
  inspector TEXT NOT NULL,
  answers JSONB NOT NULL DEFAULT '[]'::jsonb,
  is_synced BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

ALTER TABLE public.inspections ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "allow_all_inspections" ON public.inspections;
CREATE POLICY "allow_all_inspections" ON public.inspections
  FOR ALL TO authenticated USING (true) WITH CHECK (true);
