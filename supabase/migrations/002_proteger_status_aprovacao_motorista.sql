begin;

-- ============================================================
-- Impede que o próprio motorista altere seu status de aprovação.
--
-- Exemplo bloqueado:
-- Pendente -> Aprovado
--
-- Alterações administrativas via SQL, Service Role ou painel
-- administrativo continuam possíveis.
-- ============================================================

create or replace function public.prevent_self_approval_status_change()
returns trigger
language plpgsql
as $$
begin
  if auth.uid() = old.id
     and new.status is distinct from old.status then
    raise exception
      'O motorista não pode alterar o próprio status de aprovação.';
  end if;

  return new;
end;
$$;

drop trigger if exists trg_prevent_self_approval_status_change
on public.motoristas;

create trigger trg_prevent_self_approval_status_change
before update
on public.motoristas
for each row
execute function public.prevent_self_approval_status_change();

commit;