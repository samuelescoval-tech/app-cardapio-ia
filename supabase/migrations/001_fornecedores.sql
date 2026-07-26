-- Plano 14, fase 3: fornecedores proprios por usuario.
-- Rode este arquivo inteiro no Supabase: Dashboard -> SQL Editor -> New query -> Run.

create table if not exists public.fornecedores (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  nome text not null,
  categoria text check (categoria is null or categoria in (
    'Hortifruti', 'Acougue', 'Bebidas', 'Mercearia', 'Frios', 'Padaria', 'Descartaveis', 'Limpeza', 'Outros'
  )),
  telefone text,
  endereco text,
  observacoes text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists fornecedores_user_id_idx on public.fornecedores(user_id);

alter table public.fornecedores enable row level security;

-- RLS controla quais linhas aparecem; o grant abaixo e a permissao basica
-- que o Postgres exige antes mesmo de avaliar a RLS. Sem isso, o erro seria
-- "permission denied for table fornecedores" mesmo com as policies certas.
grant select, insert, update, delete on public.fornecedores to authenticated;

create or replace function public.fornecedores_atualizar_timestamp()
returns trigger
language plpgsql
set search_path = public
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

drop trigger if exists fornecedores_set_updated_at on public.fornecedores;
create trigger fornecedores_set_updated_at
  before update on public.fornecedores
  for each row execute function public.fornecedores_atualizar_timestamp();

drop policy if exists "fornecedores_select_proprio" on public.fornecedores;
create policy "fornecedores_select_proprio"
  on public.fornecedores for select
  using (auth.uid() = user_id);

drop policy if exists "fornecedores_insert_proprio" on public.fornecedores;
create policy "fornecedores_insert_proprio"
  on public.fornecedores for insert
  with check (auth.uid() = user_id);

drop policy if exists "fornecedores_update_proprio" on public.fornecedores;
create policy "fornecedores_update_proprio"
  on public.fornecedores for update
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

drop policy if exists "fornecedores_delete_proprio" on public.fornecedores;
create policy "fornecedores_delete_proprio"
  on public.fornecedores for delete
  using (auth.uid() = user_id);
