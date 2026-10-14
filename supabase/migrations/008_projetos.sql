-- Sprint 4: snapshots privados, recuperaveis sem nova geracao de IA.
-- Aplicar o arquivo completo no SQL Editor do Supabase.
begin;
create table if not exists public.projetos (
  user_id uuid not null references auth.users(id) on delete cascade,
  id uuid not null,
  versao integer not null check (versao = 1),
  tipo text not null check (char_length(tipo) between 2 and 80),
  pessoas integer not null check (pessoas between 1 and 5000),
  resumo text not null check (char_length(resumo) <= 110),
  evento jsonb not null check (jsonb_typeof(evento) = 'object'),
  plano jsonb not null check (jsonb_typeof(plano) = 'object'),
  created_at timestamptz not null default now(),
  primary key (user_id, id),
  constraint projetos_tamanho check (octet_length(evento::text) + octet_length(plano::text) <= 1048576)
);
create index if not exists projetos_dono_data_idx on public.projetos(user_id, created_at desc, id desc);
alter table public.projetos enable row level security;
revoke all on public.projetos from anon;
grant select, insert, update, delete on public.projetos to authenticated;
drop policy if exists projetos_select_proprio on public.projetos;
create policy projetos_select_proprio on public.projetos for select to authenticated using ((select auth.uid()) = user_id);
drop policy if exists projetos_insert_proprio on public.projetos;
create policy projetos_insert_proprio on public.projetos for insert to authenticated with check ((select auth.uid()) = user_id);
drop policy if exists projetos_update_proprio on public.projetos;
create policy projetos_update_proprio on public.projetos for update to authenticated
  using ((select auth.uid()) = user_id) with check ((select auth.uid()) = user_id);
drop policy if exists projetos_delete_proprio on public.projetos;
create policy projetos_delete_proprio on public.projetos for delete to authenticated using ((select auth.uid()) = user_id);
commit;
