-- Migration 009: Otimização e Compatibilidade Total do Chat em Tempo Real
-- Garante tabelas ride_messages e messages com suporte a múltiplos schemas de passageiro

-- 1. Cria ou ajusta a tabela public.ride_messages
CREATE TABLE IF NOT EXISTS public.ride_messages (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  ride_id text NOT NULL,
  corrida_id text,
  sender_id uuid,
  sender_role text NOT NULL DEFAULT 'passenger',
  sender_type text DEFAULT 'passenger',
  sender_name text NOT NULL DEFAULT 'Passageiro',
  content text,
  message text,
  mensagem text,
  read boolean NOT NULL DEFAULT false,
  is_read boolean NOT NULL DEFAULT false,
  created_at timestamp with time zone DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Adiciona colunas de compatibilidade caso já existisse
ALTER TABLE public.ride_messages ADD COLUMN IF NOT EXISTS corrida_id text;
ALTER TABLE public.ride_messages ADD COLUMN IF NOT EXISTS sender_type text DEFAULT 'passenger';
ALTER TABLE public.ride_messages ADD COLUMN IF NOT EXISTS message text;
ALTER TABLE public.ride_messages ADD COLUMN IF NOT EXISTS mensagem text;
ALTER TABLE public.ride_messages ADD COLUMN IF NOT EXISTS is_read boolean DEFAULT false;

-- Converte ride_id para text caso estivesse como UUID restrito (permite IDs alfanuméricos e UUIDs)
DO $$
BEGIN
  ALTER TABLE public.ride_messages ALTER COLUMN ride_id TYPE text;
EXCEPTION
  WHEN OTHERS THEN NULL;
END $$;

-- 2. Cria tabela alternativa public.messages caso o app do passageiro escreva nela
CREATE TABLE IF NOT EXISTS public.messages (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  ride_id text,
  corrida_id text,
  sender_id uuid,
  sender_role text DEFAULT 'passenger',
  sender_type text DEFAULT 'passenger',
  sender_name text DEFAULT 'Passageiro',
  content text,
  message text,
  mensagem text,
  read boolean DEFAULT false,
  is_read boolean DEFAULT false,
  created_at timestamp with time zone DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- 3. Índices para consultas imediatas
CREATE INDEX IF NOT EXISTS idx_ride_messages_ride_id_text ON public.ride_messages(ride_id);
CREATE INDEX IF NOT EXISTS idx_ride_messages_corrida_id_text ON public.ride_messages(corrida_id);
CREATE INDEX IF NOT EXISTS idx_messages_ride_id ON public.messages(ride_id);

-- 4. Permissões completas e RLS irrestrito para anon e authenticated
GRANT ALL ON TABLE public.ride_messages TO anon, authenticated, service_role;
GRANT ALL ON TABLE public.messages TO anon, authenticated, service_role;

ALTER TABLE public.ride_messages ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.messages ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Permissao_total_ride_messages" ON public.ride_messages;
CREATE POLICY "Permissao_total_ride_messages"
ON public.ride_messages
FOR ALL
TO public
USING (true)
WITH CHECK (true);

DROP POLICY IF EXISTS "Permissao_total_messages" ON public.messages;
CREATE POLICY "Permissao_total_messages"
ON public.messages
FOR ALL
TO public
USING (true)
WITH CHECK (true);

-- 5. Configurar REPLICA IDENTITY FULL para Realtime funcionar com perfeição
ALTER TABLE public.ride_messages REPLICA IDENTITY FULL;
ALTER TABLE public.messages REPLICA IDENTITY FULL;

-- 6. Adicionar à publicação supabase_realtime
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_publication_tables 
    WHERE pubname = 'supabase_realtime' AND tablename = 'ride_messages'
  ) THEN
    ALTER PUBLICATION supabase_realtime ADD TABLE public.ride_messages;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_publication_tables 
    WHERE pubname = 'supabase_realtime' AND tablename = 'messages'
  ) THEN
    ALTER PUBLICATION supabase_realtime ADD TABLE public.messages;
  END IF;
EXCEPTION
  WHEN OTHERS THEN
    NULL;
END $$;

NOTIFY pgrst, 'reload schema';
