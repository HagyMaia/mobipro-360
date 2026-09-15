-- Migration 010: Otimização de Cancelamentos e Histórico de Corridas em Tempo Real
-- Garante sincronização imediata quando o passageiro cancela a viagem

-- 1. Garante que as colunas de cancelamento e auditoria existam em public.rides
ALTER TABLE public.rides ADD COLUMN IF NOT EXISTS status text NOT NULL DEFAULT 'SEARCHING';
ALTER TABLE public.rides ADD COLUMN IF NOT EXISTS cancel_reason text;
ALTER TABLE public.rides ADD COLUMN IF NOT EXISTS motivo_cancelamento text;
ALTER TABLE public.rides ADD COLUMN IF NOT EXISTS cancelled_by text;
ALTER TABLE public.rides ADD COLUMN IF NOT EXISTS autor_cancelamento text;
ALTER TABLE public.rides ADD COLUMN IF NOT EXISTS cancelled_at timestamp with time zone;
ALTER TABLE public.rides ADD COLUMN IF NOT EXISTS updated_at timestamp with time zone DEFAULT timezone('utc'::text, now());

-- 2. Garante que a tabela public.corridas (compatibilidade dupla) também tenha as colunas
CREATE TABLE IF NOT EXISTS public.corridas (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  motorista_id uuid,
  driver_id uuid,
  cliente_nome text,
  passenger_name text,
  status text DEFAULT 'PENDENTE',
  origem_endereco text,
  destino_endereco text,
  valor numeric(10,2) DEFAULT 20.00,
  distancia_km numeric(10,2) DEFAULT 4.0,
  motivo_cancelamento text,
  cancel_reason text,
  autor_cancelamento text,
  cancelled_by text,
  cancelled_at timestamp with time zone,
  created_at timestamp with time zone DEFAULT timezone('utc'::text, now()) NOT NULL,
  updated_at timestamp with time zone DEFAULT timezone('utc'::text, now())
);

ALTER TABLE public.corridas ADD COLUMN IF NOT EXISTS motivo_cancelamento text;
ALTER TABLE public.corridas ADD COLUMN IF NOT EXISTS cancel_reason text;
ALTER TABLE public.corridas ADD COLUMN IF NOT EXISTS autor_cancelamento text;
ALTER TABLE public.corridas ADD COLUMN IF NOT EXISTS cancelled_by text;
ALTER TABLE public.corridas ADD COLUMN IF NOT EXISTS cancelled_at timestamp with time zone;

-- 3. Configurar REPLICA IDENTITY FULL para que UPDATEs no Supabase Realtime enviem todos os dados da linha
ALTER TABLE public.rides REPLICA IDENTITY FULL;
ALTER TABLE public.corridas REPLICA IDENTITY FULL;

-- 4. Adicionar tabelas à publicação supabase_realtime
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_publication_tables 
    WHERE pubname = 'supabase_realtime' AND tablename = 'rides'
  ) THEN
    ALTER PUBLICATION supabase_realtime ADD TABLE public.rides;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_publication_tables 
    WHERE pubname = 'supabase_realtime' AND tablename = 'corridas'
  ) THEN
    ALTER PUBLICATION supabase_realtime ADD TABLE public.corridas;
  END IF;
EXCEPTION
  WHEN OTHERS THEN
    NULL;
END $$;

-- 5. Conceder permissões e garantir RLS aberto para sincronia entre apps
GRANT ALL ON TABLE public.rides TO anon, authenticated, service_role;
GRANT ALL ON TABLE public.corridas TO anon, authenticated, service_role;

DROP POLICY IF EXISTS "Permissao_total_rides" ON public.rides;
CREATE POLICY "Permissao_total_rides" ON public.rides FOR ALL TO public USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "Permissao_total_corridas" ON public.corridas;
CREATE POLICY "Permissao_total_corridas" ON public.corridas FOR ALL TO public USING (true) WITH CHECK (true);

NOTIFY pgrst, 'reload schema';
