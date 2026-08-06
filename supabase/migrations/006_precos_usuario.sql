-- Plano 16, item 6: precos proprios por usuario (por fornecedor/ingrediente).
-- Rode este arquivo inteiro no Supabase: Dashboard -> SQL Editor -> New query -> Run.

create table if not exists public.precos_usuario (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  fornecedor_id uuid references public.fornecedores(id) on delete set null,
  item text not null,
  unidade text not null,
  preco numeric(10,2) not null check (preco >= 0),
  categoria text check (categoria is null or categoria in (
    'Hortifruti', 'Acougue', 'Bebidas', 'Mercearia', 'Frios', 'Padaria', 'Descartaveis', 'Limpeza', 'Outros'
  )),
  observacoes text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists precos_usuario_user_id_idx on public.precos_usuario(user_id);
create index if not exists precos_usuario_fornecedor_id_idx on public.precos_usuario(fornecedor_id);

alter table public.precos_usuario enable row level security;

-- RLS controla quais linhas aparecem; o grant abaixo e a permissao basica
-- que o Postgres exige antes mesmo de avaliar a RLS.
grant select, insert, update, delete on public.precos_usuario to authenticated;

create or replace function public.precos_usuario_atualizar_timestamp()
returns trigger
language plpgsql
set search_path = public
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

drop trigger if exists precos_usuario_set_updated_at on public.precos_usuario;
create trigger precos_usuario_set_updated_at
  before update on public.precos_usuario
  for each row execute function public.precos_usuario_atualizar_timestamp();

drop policy if exists "precos_usuario_select_proprio" on public.precos_usuario;
create policy "precos_usuario_select_proprio"
  on public.precos_usuario for select
  using (auth.uid() = user_id);

drop policy if exists "precos_usuario_insert_proprio" on public.precos_usuario;
create policy "precos_usuario_insert_proprio"
  on public.precos_usuario for insert
  with check (auth.uid() = user_id);

drop policy if exists "precos_usuario_update_proprio" on public.precos_usuario;
create policy "precos_usuario_update_proprio"
  on public.precos_usuario for update
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

drop policy if exists "precos_usuario_delete_proprio" on public.precos_usuario;
create policy "precos_usuario_delete_proprio"
  on public.precos_usuario for delete
  using (auth.uid() = user_id);
