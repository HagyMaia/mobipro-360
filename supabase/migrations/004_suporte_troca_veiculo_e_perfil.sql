-- ==============================================================================
-- Migração 004: Tabela Completa de Motoristas e Recarga do Schema Cache
-- ==============================================================================

-- 1. Garante que TODAS as colunas existam na tabela motoristas
ALTER TABLE public.motoristas
ADD COLUMN IF NOT EXISTS nome text,
ADD COLUMN IF NOT EXISTS nome_social text,
ADD COLUMN IF NOT EXISTS nome_completo text,
ADD COLUMN IF NOT EXISTS cpf text,
ADD COLUMN IF NOT EXISTS cnh text,
ADD COLUMN IF NOT EXISTS telefone text,
ADD COLUMN IF NOT EXISTS phone text,
ADD COLUMN IF NOT EXISTS email text,
ADD COLUMN IF NOT EXISTS marca_veiculo text,
ADD COLUMN IF NOT EXISTS modelo_veiculo text,
ADD COLUMN IF NOT EXISTS ano_veiculo text,
ADD COLUMN IF NOT EXISTS placa_veiculo text,
ADD COLUMN IF NOT EXISTS cor_veiculo text DEFAULT 'Prata',
ADD COLUMN IF NOT EXISTS categoria text DEFAULT 'POPULAR',
ADD COLUMN IF NOT EXISTS status text DEFAULT 'Pendente',
ADD COLUMN IF NOT EXISTS vehicle_status text DEFAULT 'Aprovado',
ADD COLUMN IF NOT EXISTS work_status text DEFAULT 'OFFLINE',
ADD COLUMN IF NOT EXISTS avatar_url text,
ADD COLUMN IF NOT EXISTS rating numeric(3,2) DEFAULT 4.95,
ADD COLUMN IF NOT EXISTS total_rides integer DEFAULT 0;

-- 2. Recarrega o cache do PostgREST imediatamente para o Supabase reconhecer as novas colunas
NOTIFY pgrst, 'reload schema';
