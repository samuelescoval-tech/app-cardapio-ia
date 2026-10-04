-- Autorizacoes separadas para galeria de pratos e link de compartilhamento.
-- Todas as fotos existentes continuam privadas; o bucket continua privado.
begin;

alter table public.fotos_pratos
  add column if not exists compartilhada_catalogo boolean not null default false,
  add column if not exists token_compartilhamento uuid unique,
  add column if not exists credito_publico text,
  add column if not exists autorizacao_atualizada_em timestamptz;

-- Autorizar a alteracao somente dos campos de compartilhamento.
-- Nao permitir mudar proprietario, arquivo ou nome por esta permissao.
revoke update on public.fotos_pratos from anon, authenticated;
grant update (compartilhada_catalogo, token_compartilhamento,
  credito_publico, autorizacao_atualizada_em) on public.fotos_pratos to authenticated;

drop policy if exists fotos_pratos_update_proprio on public.fotos_pratos;
create policy fotos_pratos_update_proprio on public.fotos_pratos
  for update to authenticated
  using ((select auth.uid()) = user_id)
  with check ((select auth.uid()) = user_id);

-- SELECT continua restrito ao proprietario pelas politicas existentes.
-- Rotas publicas no backend verificam consentimento antes de entregar imagem.
create index if not exists fotos_pratos_compartilhadas_idx
  on public.fotos_pratos (created_at desc) where compartilhada_catalogo;

alter table public.fotos_pratos drop constraint if exists fotos_pratos_compartilhamento_nome;
alter table public.fotos_pratos add constraint fotos_pratos_compartilhamento_nome
  check ((not compartilhada_catalogo and token_compartilhamento is null)
    or nullif(btrim(nome_prato), '') is not null);

commit;
