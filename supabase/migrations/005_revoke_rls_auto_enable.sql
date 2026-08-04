-- Correcao apontada pelo Security Advisor do Supabase: a funcao
-- rls_auto_enable() (criada automaticamente pelo Supabase ao ativar RLS
-- automatico no projeto) podia ser chamada diretamente por qualquer
-- visitante publico ou qualquer usuario logado, mesmo so fazendo sentido
-- em contexto de trigger interno do proprio Supabase.
-- Rode este arquivo inteiro no Supabase: Dashboard -> SQL Editor -> New query -> Run.

revoke execute on function public.rls_auto_enable() from public;
revoke execute on function public.rls_auto_enable() from anon;
revoke execute on function public.rls_auto_enable() from authenticated;
