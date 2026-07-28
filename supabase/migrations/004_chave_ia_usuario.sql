-- Plano 16, item 2: usuario usar a propria chave Gemini em vez da chave
-- compartilhada. A chave fica cifrada (AES-256-GCM) na aplicacao antes de
-- gravar aqui; o banco nunca ve o texto plano.
-- Rode este arquivo inteiro no Supabase: Dashboard -> SQL Editor -> New query -> Run.

create table if not exists public.chave_ia_usuario (
  user_id uuid primary key references auth.users(id) on delete cascade,
  chave_cifrada text not null,
  iv text not null,
  tag text not null,
  atualizado_em timestamptz not null default now()
);

alter table public.chave_ia_usuario enable row level security;

grant select, insert, update, delete on public.chave_ia_usuario to authenticated;

create or replace function public.chave_ia_usuario_atualizar_timestamp()
returns trigger
language plpgsql
set search_path = public
as $$
begin
  new.atualizado_em = now();
  return new;
end;
$$;

drop trigger if exists chave_ia_usuario_set_atualizado_em on public.chave_ia_usuario;
create trigger chave_ia_usuario_set_atualizado_em
  before update on public.chave_ia_usuario
  for each row execute function public.chave_ia_usuario_atualizar_timestamp();

drop policy if exists "chave_ia_usuario_select_proprio" on public.chave_ia_usuario;
create policy "chave_ia_usuario_select_proprio"
  on public.chave_ia_usuario for select
  using (auth.uid() = user_id);

drop policy if exists "chave_ia_usuario_insert_proprio" on public.chave_ia_usuario;
create policy "chave_ia_usuario_insert_proprio"
  on public.chave_ia_usuario for insert
  with check (auth.uid() = user_id);

drop policy if exists "chave_ia_usuario_update_proprio" on public.chave_ia_usuario;
create policy "chave_ia_usuario_update_proprio"
  on public.chave_ia_usuario for update
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

drop policy if exists "chave_ia_usuario_delete_proprio" on public.chave_ia_usuario;
create policy "chave_ia_usuario_delete_proprio"
  on public.chave_ia_usuario for delete
  using (auth.uid() = user_id);
