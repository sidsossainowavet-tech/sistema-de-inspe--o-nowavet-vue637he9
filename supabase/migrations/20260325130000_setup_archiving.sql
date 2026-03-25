-- Criar bucket de storage para os relatorios arquivados
INSERT INTO storage.buckets (id, name, public) 
VALUES ('archived_inspections', 'archived_inspections', false) 
ON CONFLICT (id) DO NOTHING;

-- Politicas para o bucket de arquivamento
DROP POLICY IF EXISTS "allow_auth_read_archived" ON storage.objects;
CREATE POLICY "allow_auth_read_archived" ON storage.objects
  FOR SELECT TO authenticated USING (bucket_id = 'archived_inspections');

DROP POLICY IF EXISTS "allow_auth_insert_archived" ON storage.objects;
CREATE POLICY "allow_auth_insert_archived" ON storage.objects
  FOR INSERT TO authenticated WITH CHECK (bucket_id = 'archived_inspections');

DROP POLICY IF EXISTS "allow_auth_delete_archived" ON storage.objects;
CREATE POLICY "allow_auth_delete_archived" ON storage.objects
  FOR DELETE TO authenticated USING (bucket_id = 'archived_inspections');
