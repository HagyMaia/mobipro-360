-- Migration 003: Sincronização automática da exclusão de motoristas com o Supabase Auth (auth.users)
-- Ao deletar um motorista da tabela public.motoristas, o usuário correspondente no auth.users é deletado automaticamente.

CREATE OR REPLACE FUNCTION public.handle_delete_motorista_user()
RETURNS TRIGGER
SECURITY DEFINER
LANGUAGE plpgsql
AS $$
BEGIN
  -- Deleta o usuário da tabela de autenticação do Supabase
  -- Isso revoga imediatamente o token JWT e impede qualquer novo login
  DELETE FROM auth.users WHERE id = OLD.id;
  RETURN OLD;
EXCEPTION
  WHEN OTHERS THEN
    -- Garante que se o usuário já não existir em auth.users, a exclusão em motoristas não falhe
    RETURN OLD;
END;
$$;

-- Trigger disparada imediatamente após exclusão em public.motoristas
DROP TRIGGER IF EXISTS tr_delete_motorista_auth_user ON public.motoristas;
CREATE TRIGGER tr_delete_motorista_auth_user
AFTER DELETE ON public.motoristas
FOR EACH ROW
EXECUTE FUNCTION public.handle_delete_motorista_user();
