-- ==============================================================================
-- Migração 100% Idempotente e Concessão Total de Permissões
-- ==============================================================================

-- 1. Garante todas as colunas necessárias na tabela motoristas
ALTER TABLE public.motoristas ADD COLUMN IF NOT EXISTS nome text;
ALTER TABLE public.motoristas ADD COLUMN IF NOT EXISTS nome_social text;
ALTER TABLE public.motoristas ADD COLUMN IF NOT EXISTS nome_completo text;
ALTER TABLE public.motoristas ADD COLUMN IF NOT EXISTS cpf text;
ALTER TABLE public.motoristas ADD COLUMN IF NOT EXISTS cnh text;
ALTER TABLE public.motoristas ADD COLUMN IF NOT EXISTS telefone text;
ALTER TABLE public.motoristas ADD COLUMN IF NOT EXISTS phone text;
ALTER TABLE public.motoristas ADD COLUMN IF NOT EXISTS email text;
ALTER TABLE public.motoristas ADD COLUMN IF NOT EXISTS marca_veiculo text;
ALTER TABLE public.motoristas ADD COLUMN IF NOT EXISTS modelo_veiculo text;
ALTER TABLE public.motoristas ADD COLUMN IF NOT EXISTS ano_veiculo text;
ALTER TABLE public.motoristas ADD COLUMN IF NOT EXISTS placa_veiculo text;
ALTER TABLE public.motoristas ADD COLUMN IF NOT EXISTS cor_veiculo text DEFAULT 'Prata';
ALTER TABLE public.motoristas ADD COLUMN IF NOT EXISTS categoria text DEFAULT 'POPULAR';
ALTER TABLE public.motoristas ADD COLUMN IF NOT EXISTS status text DEFAULT 'Pendente';
ALTER TABLE public.motoristas ADD COLUMN IF NOT EXISTS vehicle_status text DEFAULT 'Aprovado';
ALTER TABLE public.motoristas ADD COLUMN IF NOT EXISTS work_status text DEFAULT 'OFFLINE';
ALTER TABLE public.motoristas ADD COLUMN IF NOT EXISTS avatar_url text;
ALTER TABLE public.motoristas ADD COLUMN IF NOT EXISTS rating numeric(3,2) DEFAULT 4.95;
ALTER TABLE public.motoristas ADD COLUMN IF NOT EXISTS total_rides integer DEFAULT 0;

-- 2. Cria as tabelas complementares
CREATE TABLE IF NOT EXISTS public.vehicles (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  driver_id uuid REFERENCES auth.users(id) ON DELETE CASCADE,
  make text, model text, year text, plate text, color text, category text DEFAULT 'POPULAR',
  created_at timestamp with time zone DEFAULT timezone('utc'::text, now()) NOT NULL
);

CREATE TABLE IF NOT EXISTS public.driver_documents (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  driver_id uuid REFERENCES auth.users(id) ON DELETE CASCADE,
  type text NOT NULL, file_url text NOT NULL, status text NOT NULL DEFAULT 'PENDING',
  created_at timestamp with time zone DEFAULT timezone('utc'::text, now()) NOT NULL
);

CREATE TABLE IF NOT EXISTS public.comunicados (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  categoria text NOT NULL DEFAULT 'info', titulo text NOT NULL, conteudo text NOT NULL,
  created_at timestamp with time zone DEFAULT timezone('utc'::text, now()) NOT NULL
);

CREATE TABLE IF NOT EXISTS public.rides (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  driver_id uuid, passenger_name text, passenger_phone text,
  pickup_address text, destination_address text, fare numeric(10,2),
  status text NOT NULL DEFAULT 'AVAILABLE',
  created_at timestamp with time zone DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- 3. Concede permissões completas para as roles anon e authenticated
GRANT ALL ON TABLE public.motoristas TO anon, authenticated, service_role;
GRANT ALL ON TABLE public.vehicles TO anon, authenticated, service_role;
GRANT ALL ON TABLE public.driver_documents TO anon, authenticated, service_role;
GRANT ALL ON TABLE public.comunicados TO anon, authenticated, service_role;
GRANT ALL ON TABLE public.rides TO anon, authenticated, service_role;

-- 4. Habilita RLS e aplica políticas com nomes limpos
ALTER TABLE public.motoristas ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.vehicles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.driver_documents ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.comunicados ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.rides ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Permissao_total_motoristas" ON public.motoristas;
DROP POLICY IF EXISTS "Acesso total motoristas" ON public.motoristas;
CREATE POLICY "Permissao_total_motoristas" ON public.motoristas FOR ALL USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "Permissao_total_vehicles" ON public.vehicles;
DROP POLICY IF EXISTS "Acesso total vehicles" ON public.vehicles;
CREATE POLICY "Permissao_total_vehicles" ON public.vehicles FOR ALL USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "Permissao_total_driver_documents" ON public.driver_documents;
DROP POLICY IF EXISTS "Acesso total driver_documents" ON public.driver_documents;
CREATE POLICY "Permissao_total_driver_documents" ON public.driver_documents FOR ALL USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "Permissao_total_comunicados" ON public.comunicados;
DROP POLICY IF EXISTS "Acesso total comunicados" ON public.comunicados;
CREATE POLICY "Permissao_total_comunicados" ON public.comunicados FOR ALL USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "Permissao_total_rides" ON public.rides;
DROP POLICY IF EXISTS "Acesso total rides" ON public.rides;
CREATE POLICY "Permissao_total_rides" ON public.rides FOR ALL USING (true) WITH CHECK (true);

-- 5. Garante Storage Buckets
INSERT INTO storage.buckets (id, name, public)
VALUES ('driver-documents', 'driver-documents', true), ('avatars', 'avatars', true)
ON CONFLICT (id) DO UPDATE SET public = true;

-- 6. Recarrega o cache da API
NOTIFY pgrst, 'reload schema';
