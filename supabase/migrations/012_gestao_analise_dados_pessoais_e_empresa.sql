-- ==============================================================================
-- Migration 012: Gestão e Análise de Dados Pessoais, Dados da Empresa e Categoria
-- ==============================================================================

begin;

-- 1. Colunas de Dados Pessoais e Status de Aprovação
ALTER TABLE public.motoristas ADD COLUMN IF NOT EXISTS data_nascimento text;
ALTER TABLE public.motoristas ADD COLUMN IF NOT EXISTS cnh text;
ALTER TABLE public.motoristas ADD COLUMN IF NOT EXISTS cep text;
ALTER TABLE public.motoristas ADD COLUMN IF NOT EXISTS rua text;
ALTER TABLE public.motoristas ADD COLUMN IF NOT EXISTS numero text;
ALTER TABLE public.motoristas ADD COLUMN IF NOT EXISTS complemento text;
ALTER TABLE public.motoristas ADD COLUMN IF NOT EXISTS bairro text;
ALTER TABLE public.motoristas ADD COLUMN IF NOT EXISTS cidade text;
ALTER TABLE public.motoristas ADD COLUMN IF NOT EXISTS estado text;

ALTER TABLE public.motoristas ADD COLUMN IF NOT EXISTS dados_pessoais_status text DEFAULT 'Aprovado';
ALTER TABLE public.motoristas ADD COLUMN IF NOT EXISTS personal_data_status text DEFAULT 'Aprovado';
ALTER TABLE public.motoristas ADD COLUMN IF NOT EXISTS pending_personal_data jsonb;
ALTER TABLE public.motoristas ADD COLUMN IF NOT EXISTS personal_data_rejection_reason text;

-- 2. Colunas de Dados da Empresa e Status de Aprovação
ALTER TABLE public.motoristas ADD COLUMN IF NOT EXISTS empresa_razao_social text;
ALTER TABLE public.motoristas ADD COLUMN IF NOT EXISTS empresa_nome_fantasia text;
ALTER TABLE public.motoristas ADD COLUMN IF NOT EXISTS empresa_cnpj text;
ALTER TABLE public.motoristas ADD COLUMN IF NOT EXISTS empresa_inscricao_estadual text;
ALTER TABLE public.motoristas ADD COLUMN IF NOT EXISTS empresa_telefone text;
ALTER TABLE public.motoristas ADD COLUMN IF NOT EXISTS empresa_email text;
ALTER TABLE public.motoristas ADD COLUMN IF NOT EXISTS empresa_responsavel text;
ALTER TABLE public.motoristas ADD COLUMN IF NOT EXISTS empresa_cep text;
ALTER TABLE public.motoristas ADD COLUMN IF NOT EXISTS empresa_endereco text;
ALTER TABLE public.motoristas ADD COLUMN IF NOT EXISTS empresa_numero text;
ALTER TABLE public.motoristas ADD COLUMN IF NOT EXISTS empresa_bairro text;
ALTER TABLE public.motoristas ADD COLUMN IF NOT EXISTS empresa_cidade text;
ALTER TABLE public.motoristas ADD COLUMN IF NOT EXISTS empresa_estado text;

ALTER TABLE public.motoristas ADD COLUMN IF NOT EXISTS dados_empresa_status text DEFAULT 'Aprovado';
ALTER TABLE public.motoristas ADD COLUMN IF NOT EXISTS company_data_status text DEFAULT 'Aprovado';
ALTER TABLE public.motoristas ADD COLUMN IF NOT EXISTS pending_company_data jsonb;
ALTER TABLE public.motoristas ADD COLUMN IF NOT EXISTS company_data_rejection_reason text;

-- 3. Garante colunas de categoria e aprovação de foto
ALTER TABLE public.motoristas ADD COLUMN IF NOT EXISTS tipo_motorista text DEFAULT 'PARTICULAR';
ALTER TABLE public.motoristas ADD COLUMN IF NOT EXISTS driver_type text DEFAULT 'PARTICULAR';
ALTER TABLE public.motoristas ADD COLUMN IF NOT EXISTS perfil_motorista text DEFAULT 'PARTICULAR';
ALTER TABLE public.motoristas ADD COLUMN IF NOT EXISTS categoria_motorista text DEFAULT 'PARTICULAR';

ALTER TABLE public.motoristas ADD COLUMN IF NOT EXISTS foto_status text DEFAULT 'Aprovado';
ALTER TABLE public.motoristas ADD COLUMN IF NOT EXISTS avatar_status text DEFAULT 'Aprovado';
ALTER TABLE public.motoristas ADD COLUMN IF NOT EXISTS pending_avatar_url text;
ALTER TABLE public.motoristas ADD COLUMN IF NOT EXISTS approved_avatar_url text;

-- 4. Normalização e sincronização imediata de todas as categorias existentes
UPDATE public.motoristas
SET tipo_motorista = CASE 
      WHEN upper(coalesce(tipo_motorista, driver_type, perfil_motorista, categoria_motorista, '')) = 'EMPRESA' THEN 'EMPRESA'
      ELSE 'PARTICULAR'
    END,
    driver_type = CASE 
      WHEN upper(coalesce(tipo_motorista, driver_type, perfil_motorista, categoria_motorista, '')) = 'EMPRESA' THEN 'EMPRESA'
      ELSE 'PARTICULAR'
    END,
    perfil_motorista = CASE 
      WHEN upper(coalesce(tipo_motorista, driver_type, perfil_motorista, categoria_motorista, '')) = 'EMPRESA' THEN 'EMPRESA'
      ELSE 'PARTICULAR'
    END,
    categoria_motorista = CASE 
      WHEN upper(coalesce(tipo_motorista, driver_type, perfil_motorista, categoria_motorista, '')) = 'EMPRESA' THEN 'EMPRESA'
      ELSE 'PARTICULAR'
    END;

-- 5. Normaliza status iniciais de dados
UPDATE public.motoristas
SET dados_pessoais_status = coalesce(dados_pessoais_status, personal_data_status, 'Aprovado'),
    personal_data_status = coalesce(personal_data_status, dados_pessoais_status, 'Aprovado'),
    dados_empresa_status = coalesce(dados_empresa_status, company_data_status, 'Aprovado'),
    company_data_status = coalesce(company_data_status, dados_empresa_status, 'Aprovado');

-- 6. Trigger aprimorado de segurança e integridade
CREATE OR REPLACE FUNCTION public.enforce_driver_category_and_photo_rules()
RETURNS trigger
LANGUAGE plpgsql
AS $$
DECLARE
  is_admin_user boolean := false;
  chosen_category text;
BEGIN
  -- Verifica se o usuário autenticado é admin via profiles
  IF auth.uid() IS NOT NULL THEN
    SELECT (role = 'admin' OR role = 'administrador') INTO is_admin_user
    FROM public.profiles
    WHERE id = auth.uid();
  END IF;

  -- Se o admin estiver alterando uma das colunas de categoria, sincroniza todas as 4 automaticamente
  IF coalesce(is_admin_user, false) OR auth.uid() IS NULL THEN
    chosen_category := CASE
      WHEN upper(coalesce(new.tipo_motorista, new.driver_type, new.perfil_motorista, new.categoria_motorista, 'PARTICULAR')) = 'EMPRESA' THEN 'EMPRESA'
      ELSE 'PARTICULAR'
    END;
    new.tipo_motorista := chosen_category;
    new.driver_type := chosen_category;
    new.perfil_motorista := chosen_category;
    new.categoria_motorista := chosen_category;
  END IF;

  -- Se for o próprio motorista atualizando seus dados (não admin)
  IF auth.uid() = old.id AND NOT coalesce(is_admin_user, false) THEN
    -- 1. Bloqueia alteração da categoria pelo motorista (apenas admin define)
    new.tipo_motorista := old.tipo_motorista;
    new.driver_type := old.driver_type;
    new.perfil_motorista := old.perfil_motorista;
    new.categoria_motorista := old.categoria_motorista;

    -- 2. Se o motorista enviou uma nova foto de perfil
    IF new.avatar_url IS DISTINCT FROM old.avatar_url AND new.avatar_url IS NOT NULL THEN
      new.foto_status := 'Aguardando aprovação';
      new.avatar_status := 'Aguardando aprovação';
      new.pending_avatar_url := new.avatar_url;
      -- Mantém o avatar_url aprovado anterior até nova aprovação
      IF old.foto_status = 'Aprovado' AND old.avatar_url IS NOT NULL THEN
        new.avatar_url := old.avatar_url;
      END IF;
    END IF;

    -- 3. Bloqueia auto-aprovação de foto pelo motorista
    IF (new.foto_status = 'Aprovado' OR new.avatar_status = 'Aprovado') AND 
       (old.foto_status IS DISTINCT FROM 'Aprovado' OR old.avatar_status IS DISTINCT FROM 'Aprovado') THEN
      new.foto_status := old.foto_status;
      new.avatar_status := old.avatar_status;
    END IF;

    -- 4. Bloqueia auto-aprovação de dados pessoais pelo motorista
    IF (new.dados_pessoais_status = 'Aprovado' OR new.personal_data_status = 'Aprovado') AND
       (old.dados_pessoais_status IS DISTINCT FROM 'Aprovado' OR old.personal_data_status IS DISTINCT FROM 'Aprovado') THEN
      new.dados_pessoais_status := old.dados_pessoais_status;
      new.personal_data_status := old.personal_data_status;
    END IF;

    -- 5. Bloqueia auto-aprovação de dados da empresa pelo motorista
    IF (new.dados_empresa_status = 'Aprovado' OR new.company_data_status = 'Aprovado') AND
       (old.dados_empresa_status IS DISTINCT FROM 'Aprovado' OR old.company_data_status IS DISTINCT FROM 'Aprovado') THEN
      new.dados_empresa_status := old.dados_empresa_status;
      new.company_data_status := old.company_data_status;
    END IF;

    -- 6. Bloqueia auto-aprovação de veículo pelo motorista
    IF new.vehicle_status = 'Aprovado' AND old.vehicle_status IS DISTINCT FROM 'Aprovado' THEN
      new.vehicle_status := old.vehicle_status;
    END IF;
  END IF;

  RETURN new;
END;
$$;

DROP TRIGGER IF EXISTS trg_enforce_driver_category_and_photo_rules ON public.motoristas;
CREATE TRIGGER trg_enforce_driver_category_and_photo_rules
BEFORE UPDATE ON public.motoristas
FOR EACH ROW
EXECUTE FUNCTION public.enforce_driver_category_and_photo_rules();

-- 7. Concessão de permissões
GRANT ALL ON TABLE public.motoristas TO anon, authenticated, service_role;

-- 8. Recarrega o cache do PostgREST
NOTIFY pgrst, 'reload schema';

commit;
