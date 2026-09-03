begin;

-- ============================================================
-- SR Logística
-- Consolida public.motoristas como fonte oficial do motorista.
--
-- status:
--   aprovação do cadastro.
--
-- work_status:
--   disponibilidade operacional.
-- ============================================================

alter table public.motoristas
add column if not exists work_status text;

-- Normaliza valores existentes, caso a coluna já exista.
update public.motoristas
set work_status = case
  when upper(trim(coalesce(work_status, ''))) = 'ONLINE' then 'ONLINE'
  when upper(trim(coalesce(work_status, ''))) = 'BUSY' then 'BUSY'
  when upper(trim(coalesce(work_status, ''))) = 'OFFLINE' then 'OFFLINE'
  else 'OFFLINE'
end;

alter table public.motoristas
alter column work_status set default 'OFFLINE';

alter table public.motoristas
alter column work_status set not null;

alter table public.motoristas
drop constraint if exists motoristas_work_status_check;

alter table public.motoristas
add constraint motoristas_work_status_check
check (
  work_status in (
    'OFFLINE',
    'ONLINE',
    'BUSY'
  )
);

comment on column public.motoristas.status is
'Status de aprovação do cadastro do motorista. Ex.: Pendente, Aprovado, Reprovado ou Suspenso.';

comment on column public.motoristas.work_status is
'Disponibilidade operacional do motorista. Valores: OFFLINE, ONLINE ou BUSY.';

commit;