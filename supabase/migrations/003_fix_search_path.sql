-- Correcao apontada pelo Consultor de Seguranca do Supabase (Advisors > Security):
-- a funcao de trigger nao tinha search_path fixo, o que e uma boa pratica de
-- seguranca contra "search path hijacking" em funcoes Postgres.
-- Rode este arquivo inteiro no Supabase: Dashboard -> SQL Editor -> New query -> Run.

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
