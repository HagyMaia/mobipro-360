-- Estrutura Básica do Banco de Dados para o Supabase

CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

CREATE TABLE IF NOT EXISTS public.motoristas (
  id uuid REFERENCES auth.users(id) ON DELETE CASCADE PRIMARY KEY,
  nome text NOT NULL,
  cpf text NOT NULL,
  cnh text NOT NULL,
  telefone text NOT NULL,
  marca_veiculo text NOT NULL,
  modelo_veiculo text NOT NULL,
  ano_veiculo text NOT NULL,
  placa_veiculo text NOT NULL,
  categoria text NOT NULL,
  status text NOT NULL DEFAULT 'Pendente',
  created_at timestamp with time zone DEFAULT timezone('utc'::text, now()) NOT NULL
);

ALTER TABLE public.motoristas ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Motoristas podem ler o próprio perfil" ON public.motoristas;
CREATE POLICY "Motoristas podem ler o próprio perfil"
  ON public.motoristas FOR SELECT USING (auth.uid() = id);

DROP POLICY IF EXISTS "Motoristas podem criar o próprio perfil" ON public.motoristas;
CREATE POLICY "Motoristas podem criar o próprio perfil"
  ON public.motoristas FOR INSERT WITH CHECK (auth.uid() = id);

DROP POLICY IF EXISTS "Motoristas podem atualizar o próprio perfil" ON public.motoristas;
CREATE POLICY "Motoristas podem atualizar o próprio perfil"
  ON public.motoristas FOR UPDATE USING (auth.uid() = id);

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

DROP POLICY IF EXISTS "Administradores gerenciam motoristas" ON public.motoristas;
CREATE POLICY "Administradores gerenciam motoristas"
  ON public.motoristas FOR ALL
  USING ((SELECT role FROM public.profiles WHERE id = auth.uid()) = 'admin')
  WITH CHECK ((SELECT role FROM public.profiles WHERE id = auth.uid()) = 'admin');

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
