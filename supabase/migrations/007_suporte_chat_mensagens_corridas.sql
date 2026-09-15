-- Migration 007: Suporte completo ao Chat em Tempo Real entre Motorista e Passageiro
-- Tabela: public.ride_messages

CREATE TABLE IF NOT EXISTS public.ride_messages (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  ride_id uuid NOT NULL,
  sender_id uuid,
  sender_role text NOT NULL DEFAULT 'driver', -- 'driver', 'passenger', 'system', 'central'
  sender_name text NOT NULL DEFAULT 'Usuário',
  content text NOT NULL,
  read boolean NOT NULL DEFAULT false,
  created_at timestamp with time zone DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Índices para consultas ultra-rápidas durante a corrida
CREATE INDEX IF NOT EXISTS idx_ride_messages_ride_id ON public.ride_messages(ride_id);
CREATE INDEX IF NOT EXISTS idx_ride_messages_created_at ON public.ride_messages(created_at);

-- Permissões e RLS
GRANT ALL ON TABLE public.ride_messages TO anon, authenticated, service_role;

ALTER TABLE public.ride_messages ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Permissao_total_ride_messages" ON public.ride_messages;
CREATE POLICY "Permissao_total_ride_messages"
ON public.ride_messages
FOR ALL
TO public
USING (true)
WITH CHECK (true);

-- Habilitar Realtime WebSocket do Supabase para a tabela ride_messages
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_publication_tables 
    WHERE pubname = 'supabase_realtime' AND tablename = 'ride_messages'
  ) THEN
    ALTER PUBLICATION supabase_realtime ADD TABLE public.ride_messages;
  END IF;
EXCEPTION
  WHEN OTHERS THEN
    NULL;
END $$;

NOTIFY pgrst, 'reload schema';
