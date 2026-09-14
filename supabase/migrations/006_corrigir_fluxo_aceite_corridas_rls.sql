-- Migration 006: Garantir funcionamento completo de aceite de corridas, colunas e RLS

-- 1. Garante que a tabela public.rides possua todas as colunas necessárias sem restrições impeditivas
CREATE TABLE IF NOT EXISTS public.rides (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  driver_id uuid,
  passenger_name text,
  passenger_phone text,
  passenger_rating numeric(3,2) DEFAULT 5.0,
  pickup text,
  dropoff text,
  pickup_address text,
  destination_address text,
  dropoff_address text,
  distance_km numeric(10,2) DEFAULT 5.0,
  distancia_km numeric(10,2) DEFAULT 5.0,
  estimated_minutes integer DEFAULT 15,
  fare numeric(10,2) DEFAULT 25.00,
  fare_amount numeric(10,2) DEFAULT 25.00,
  valor numeric(10,2) DEFAULT 25.00,
  payment_method text DEFAULT 'pix',
  status text NOT NULL DEFAULT 'SEARCHING',
  cancel_reason text,
  started_at timestamp with time zone,
  completed_at timestamp with time zone,
  updated_at timestamp with time zone DEFAULT timezone('utc'::text, now()),
  created_at timestamp with time zone DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- 2. Adiciona colunas ausentes caso a tabela já existisse com outro formato
ALTER TABLE public.rides ADD COLUMN IF NOT EXISTS driver_id uuid;
ALTER TABLE public.rides ADD COLUMN IF NOT EXISTS passenger_name text;
ALTER TABLE public.rides ADD COLUMN IF NOT EXISTS passenger_phone text;
ALTER TABLE public.rides ADD COLUMN IF NOT EXISTS passenger_rating numeric(3,2) DEFAULT 5.0;
ALTER TABLE public.rides ADD COLUMN IF NOT EXISTS pickup text;
ALTER TABLE public.rides ADD COLUMN IF NOT EXISTS dropoff text;
ALTER TABLE public.rides ADD COLUMN IF NOT EXISTS pickup_address text;
ALTER TABLE public.rides ADD COLUMN IF NOT EXISTS destination_address text;
ALTER TABLE public.rides ADD COLUMN IF NOT EXISTS dropoff_address text;
ALTER TABLE public.rides ADD COLUMN IF NOT EXISTS distance_km numeric(10,2) DEFAULT 5.0;
ALTER TABLE public.rides ADD COLUMN IF NOT EXISTS distancia_km numeric(10,2) DEFAULT 5.0;
ALTER TABLE public.rides ADD COLUMN IF NOT EXISTS estimated_minutes integer DEFAULT 15;
ALTER TABLE public.rides ADD COLUMN IF NOT EXISTS fare numeric(10,2) DEFAULT 25.00;
ALTER TABLE public.rides ADD COLUMN IF NOT EXISTS fare_amount numeric(10,2) DEFAULT 25.00;
ALTER TABLE public.rides ADD COLUMN IF NOT EXISTS valor numeric(10,2) DEFAULT 25.00;
ALTER TABLE public.rides ADD COLUMN IF NOT EXISTS payment_method text DEFAULT 'pix';
ALTER TABLE public.rides ADD COLUMN IF NOT EXISTS status text NOT NULL DEFAULT 'SEARCHING';
ALTER TABLE public.rides ADD COLUMN IF NOT EXISTS cancel_reason text;
ALTER TABLE public.rides ADD COLUMN IF NOT EXISTS started_at timestamp with time zone;
ALTER TABLE public.rides ADD COLUMN IF NOT EXISTS completed_at timestamp with time zone;
ALTER TABLE public.rides ADD COLUMN IF NOT EXISTS updated_at timestamp with time zone DEFAULT timezone('utc'::text, now());

-- 3. Remove restrição NOT NULL de driver_id caso exista do schema antigo
ALTER TABLE public.rides ALTER COLUMN driver_id DROP NOT NULL;

-- 4. Remove foreign keys antigas que possam apontar para tabelas inexistentes (ex: profiles)
DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.table_constraints 
    WHERE constraint_name = 'rides_driver_id_fkey' AND table_name = 'rides'
  ) THEN
    ALTER TABLE public.rides DROP CONSTRAINT rides_driver_id_fkey;
  END IF;
END $$;

-- 5. Concede permissões completas
GRANT ALL ON TABLE public.rides TO anon, authenticated, service_role;

-- 6. Habilita RLS e aplica políticas limpas e permissivas para inserção, busca e aceite de corridas
ALTER TABLE public.rides ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Permissao_total_rides" ON public.rides;
DROP POLICY IF EXISTS "Acesso total rides" ON public.rides;
DROP POLICY IF EXISTS "Allow all rides for authenticated" ON public.rides;
DROP POLICY IF EXISTS "Allow all rides for anon" ON public.rides;
DROP POLICY IF EXISTS "Motoristas podem ver suas corridas" ON public.rides;

CREATE POLICY "Permissao_total_rides" 
ON public.rides 
FOR ALL 
TO public
USING (true) 
WITH CHECK (true);

-- 7. Adiciona à publicação do Realtime do Supabase caso ainda não esteja
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_publication_tables 
    WHERE pubname = 'supabase_realtime' AND tablename = 'rides'
  ) THEN
    ALTER PUBLICATION supabase_realtime ADD TABLE public.rides;
  END IF;
EXCEPTION
  WHEN OTHERS THEN
    NULL;
END $$;

-- 8. Recarrega o schema cache
NOTIFY pgrst, 'reload schema';
