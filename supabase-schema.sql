-- Estrutura Básica do Banco de Dados para o Supabase

-- Tabela de Perfis de Usuários (Motoristas e Admins)
CREATE TABLE public.profiles (
  id uuid REFERENCES auth.users NOT NULL PRIMARY KEY,
  role text NOT NULL DEFAULT 'driver', -- 'admin' ou 'driver'
  name text NOT NULL,
  email text NOT NULL,
  created_at timestamp with time zone DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Habilitar RLS (Row Level Security) para Profiles
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

-- Tabela de Corridas (Ride History)
CREATE TABLE public.rides (
  id uuid DEFAULT uuid_generate_v4() PRIMARY KEY,
  driver_id uuid REFERENCES public.profiles(id) NOT NULL,
  status text NOT NULL,
  fare numeric(10,2) NOT NULL,
  passenger_name text,
  pickup text,
  dropoff text,
  started_at timestamp with time zone,
  completed_at timestamp with time zone,
  created_at timestamp with time zone DEFAULT timezone('utc'::text, now()) NOT NULL
);

ALTER TABLE public.rides ENABLE ROW LEVEL SECURITY;

-- Tabela de Ganhos Extras/Metas
CREATE TABLE public.earnings (
  id uuid DEFAULT uuid_generate_v4() PRIMARY KEY,
  driver_id uuid REFERENCES public.profiles(id) NOT NULL,
  amount numeric(10,2) NOT NULL,
  source text NOT NULL,
  note text,
  date date NOT NULL,
  created_at timestamp with time zone DEFAULT timezone('utc'::text, now()) NOT NULL
);

ALTER TABLE public.earnings ENABLE ROW LEVEL SECURITY;
