-- Migration 008: Tabela de Registro de Ocorrências e Incidentes de Corridas
-- Mobipro 360

CREATE TABLE IF NOT EXISTS public.ride_incidents (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  ride_id TEXT NOT NULL,
  driver_id TEXT,
  passenger_name TEXT,
  incident_type TEXT NOT NULL,
  description TEXT NOT NULL,
  amount_unpaid NUMERIC(10,2) DEFAULT 0,
  item_description TEXT,
  evidence_notes TEXT,
  status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'under_review', 'resolved')),
  protocol_number TEXT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Índices de busca rápida
CREATE INDEX IF NOT EXISTS idx_ride_incidents_ride_id ON public.ride_incidents (ride_id);
CREATE INDEX IF NOT EXISTS idx_ride_incidents_driver_id ON public.ride_incidents (driver_id);
CREATE INDEX IF NOT EXISTS idx_ride_incidents_protocol ON public.ride_incidents (protocol_number);

-- RLS
ALTER TABLE public.ride_incidents ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Permitir leitura de incidentes para autenticados"
  ON public.ride_incidents FOR SELECT
  USING (true);

CREATE POLICY "Permitir criacao de incidentes para autenticados"
  ON public.ride_incidents FOR INSERT
  WITH CHECK (true);

CREATE POLICY "Permitir atualizacao de incidentes para autenticados"
  ON public.ride_incidents FOR UPDATE
  USING (true);
