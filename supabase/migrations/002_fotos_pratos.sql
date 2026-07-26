-- Plano 14, fase 4: fotos proprias de prato/receita por usuario.
-- Rode este arquivo inteiro no Supabase: Dashboard -> SQL Editor -> New query -> Run.
-- O bucket de storage "fotos-pratos" ja foi criado via API (privado, 5MB, jpeg/png/webp).

create table if not exists public.fotos_pratos (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  nome_prato text,
  storage_path text not null unique check (storage_path like (user_id::text || '/%')),
  created_at timestamptz not null default now()
);

create index if not exists fotos_pratos_user_id_idx on public.fotos_pratos(user_id);

alter table public.fotos_pratos enable row level security;

grant select, insert, delete on public.fotos_pratos to authenticated;

drop policy if exists "fotos_pratos_select_proprio" on public.fotos_pratos;
create policy "fotos_pratos_select_proprio"
  on public.fotos_pratos for select
  using (auth.uid() = user_id);

drop policy if exists "fotos_pratos_insert_proprio" on public.fotos_pratos;
create policy "fotos_pratos_insert_proprio"
  on public.fotos_pratos for insert
  with check (auth.uid() = user_id);

drop policy if exists "fotos_pratos_delete_proprio" on public.fotos_pratos;
create policy "fotos_pratos_delete_proprio"
  on public.fotos_pratos for delete
  using (auth.uid() = user_id);

-- Politicas de storage: cada usuario so acessa arquivos dentro da sua propria
-- pasta no bucket "fotos-pratos" (caminho esperado: "<user_id>/arquivo.jpg").

drop policy if exists "fotos_pratos_storage_select" on storage.objects;
create policy "fotos_pratos_storage_select"
  on storage.objects for select
  using (bucket_id = 'fotos-pratos' and auth.uid()::text = (storage.foldername(name))[1]);

drop policy if exists "fotos_pratos_storage_insert" on storage.objects;
create policy "fotos_pratos_storage_insert"
  on storage.objects for insert
  with check (bucket_id = 'fotos-pratos' and auth.uid()::text = (storage.foldername(name))[1]);

drop policy if exists "fotos_pratos_storage_delete" on storage.objects;
create policy "fotos_pratos_storage_delete"
  on storage.objects for delete
  using (bucket_id = 'fotos-pratos' and auth.uid()::text = (storage.foldername(name))[1]);
