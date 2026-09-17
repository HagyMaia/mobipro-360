-- ==============================================================================
-- Migration 011: Regras de Categoria de Motorista e Aprovação de Foto de Perfil
-- ==============================================================================

begin;

-- 1. Garante colunas de categoria e aprovação de foto na tabela motoristas
ALTER TABLE public.motoristas ADD COLUMN IF NOT EXISTS tipo_motorista text DEFAULT 'PARTICULAR';
ALTER TABLE public.motoristas ADD COLUMN IF NOT EXISTS driver_type text DEFAULT 'PARTICULAR';
ALTER TABLE public.motoristas ADD COLUMN IF NOT EXISTS perfil_motorista text DEFAULT 'PARTICULAR';
ALTER TABLE public.motoristas ADD COLUMN IF NOT EXISTS categoria_motorista text DEFAULT 'PARTICULAR';

ALTER TABLE public.motoristas ADD COLUMN IF NOT EXISTS foto_status text DEFAULT 'Aguardando aprovação';
ALTER TABLE public.motoristas ADD COLUMN IF NOT EXISTS avatar_status text DEFAULT 'Aguardando aprovação';
ALTER TABLE public.motoristas ADD COLUMN IF NOT EXISTS pending_avatar_url text;
ALTER TABLE public.motoristas ADD COLUMN IF NOT EXISTS approved_avatar_url text;

-- 2. Normaliza categorias existentes
UPDATE public.motoristas
SET tipo_motorista = CASE 
      WHEN upper(coalesce(tipo_motorista, driver_type, perfil_motorista, '')) = 'EMPRESA' THEN 'EMPRESA'
      ELSE 'PARTICULAR'
    END,
    driver_type = CASE 
      WHEN upper(coalesce(driver_type, tipo_motorista, perfil_motorista, '')) = 'EMPRESA' THEN 'EMPRESA'
      ELSE 'PARTICULAR'
    END,
    perfil_motorista = CASE 
      WHEN upper(coalesce(perfil_motorista, driver_type, tipo_motorista, '')) = 'EMPRESA' THEN 'EMPRESA'
      ELSE 'PARTICULAR'
    END,
    categoria_motorista = CASE 
      WHEN upper(coalesce(categoria_motorista, driver_type, tipo_motorista, '')) = 'EMPRESA' THEN 'EMPRESA'
      ELSE 'PARTICULAR'
    END
WHERE tipo_motorista IS NULL OR driver_type IS NULL OR perfil_motorista IS NULL OR categoria_motorista IS NULL;

-- 3. Normaliza status de foto existentes
UPDATE public.motoristas
SET foto_status = 'Aprovado', avatar_status = 'Aprovado'
WHERE avatar_url IS NOT NULL AND (foto_status IS NULL OR foto_status = 'Pendente');

UPDATE public.motoristas
SET foto_status = 'Aguardando aprovação', avatar_status = 'Aguardando aprovação'
WHERE foto_status IS NULL;

-- 4. Função e trigger para garantir integridade das regras no banco de dados:
--    - O motorista não pode alterar sua própria categoria (definida exclusivamente pelo admin)
--    - Quando o motorista envia/altera sua foto, o status vai para 'Aguardando aprovação'
--    - O motorista não pode auto-aprovar sua própria foto
CREATE OR REPLACE FUNCTION public.enforce_driver_category_and_photo_rules()
RETURNS trigger
LANGUAGE plpgsql
AS $$
DECLARE
  is_admin_user boolean := false;
BEGIN
  -- Verifica se o usuário autenticado é admin via profiles
  IF auth.uid() IS NOT NULL THEN
    SELECT (role = 'admin' OR role = 'administrador') INTO is_admin_user
    FROM public.profiles
    WHERE id = auth.uid();
  END IF;

  -- Se for o próprio motorista atualizando seus dados (não admin)
  IF auth.uid() = old.id AND NOT coalesce(is_admin_user, false) THEN
    -- Bloqueia alteração da categoria pelo motorista
    IF (new.tipo_motorista IS DISTINCT FROM old.tipo_motorista OR
        new.driver_type IS DISTINCT FROM old.driver_type OR
        new.perfil_motorista IS DISTINCT FROM old.perfil_motorista OR
        new.categoria_motorista IS DISTINCT FROM old.categoria_motorista) THEN
      -- Mantém o valor original definido pelo admin
      new.tipo_motorista := old.tipo_motorista;
      new.driver_type := old.driver_type;
      new.perfil_motorista := old.perfil_motorista;
      new.categoria_motorista := old.categoria_motorista;
    END IF;

    -- Se o motorista enviou uma nova foto de perfil
    IF new.avatar_url IS DISTINCT FROM old.avatar_url THEN
      new.foto_status := 'Aguardando aprovação';
      new.avatar_status := 'Aguardando aprovação';
      new.pending_avatar_url := new.avatar_url;
    END IF;

    -- Bloqueia auto-aprovação de foto pelo motorista
    IF (new.foto_status = 'Aprovado' OR new.avatar_status = 'Aprovado') AND 
       (old.foto_status IS DISTINCT FROM 'Aprovado' OR old.avatar_status IS DISTINCT FROM 'Aprovado') THEN
      new.foto_status := old.foto_status;
      new.avatar_status := old.avatar_status;
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

-- 5. Concessão de permissões
GRANT ALL ON TABLE public.motoristas TO anon, authenticated, service_role;

-- 6. Recarrega o cache do PostgREST
NOTIFY pgrst, 'reload schema';

commit;
