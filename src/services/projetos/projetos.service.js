const { createClient } = require('@supabase/supabase-js');
const { validarEvento, ErroValidacaoEvento } = require('../../utils/validate-event');
const { prepararPlanoParaHistorico, planoTemConteudo, extrairResumoPlano } = require('../../../public/js/storage.service');

const MAX_BYTES = 1024 * 1024;
const VERSAO = 1;
const COLUNAS_RESUMO = 'id,created_at,tipo,pessoas,resumo,versao';
const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
class ErroProjeto extends Error {
  constructor(message, statusCode = 400) { super(message); this.name = 'ErroProjeto'; this.statusCode = statusCode; }
}
function exigirId(id) {
  if (typeof id !== 'string' || !UUID.test(id)) throw new ErroProjeto('Identificação do projeto inválida.');
  return id;
}
function prepararProjeto(body) {
  if (body?.versao !== VERSAO) throw new ErroProjeto('Versão do projeto não suportada.');
  let evento;
  try { evento = validarEvento(body.evento); }
  catch (error) { if (error instanceof ErroValidacaoEvento) throw new ErroProjeto(error.message); throw error; }
  if (!planoTemConteudo(body.plano)) throw new ErroProjeto('O planejamento não possui conteúdo para salvar.');
  const plano = prepararPlanoParaHistorico(body.plano);
  if (Buffer.byteLength(JSON.stringify({ evento, plano }, null, 1), 'utf8') > MAX_BYTES - 8192) {
    throw new ErroProjeto('Este projeto excede o tamanho permitido. Salve o PDF para preservar o planejamento.', 413);
  }
  // Snapshot do resultado entregue. Nao chamar IA nem recalcular projetos antigos.
  return { evento, plano, tipo: evento.tipo, pessoas: evento.pessoas, resumo: extrairResumoPlano(plano), versao: VERSAO };
}
function criarProjetosService(opcoes = {}) {
  const url = opcoes.url ?? process.env.SUPABASE_URL;
  const anonKey = opcoes.anonKey ?? process.env.SUPABASE_ANON_KEY;
  const criarCliente = opcoes.criarClientePorToken || (token => url && anonKey ? createClient(url, anonKey, {
    global: { headers: { Authorization: `Bearer ${token}` } }, auth: { persistSession: false, autoRefreshToken: false }
  }) : null);
  function consulta(token, usuarioId) {
    if (!token || !usuarioId) throw new ErroProjeto('Entre na conta para acessar seus projetos.', 401);
    const client = criarCliente(token);
    if (!client) throw new ErroProjeto('O salvamento na conta ainda não está disponível.', 503);
    return client.from('projetos');
  }
  function conferir(error) {
    if (!error) return;
    if (['42P01', 'PGRST205', '42703'].includes(error.code)) throw new ErroProjeto('O salvamento na conta ainda não está disponível. Seu planejamento continua na tela; salve o PDF.', 503);
    if (['42501', 'PGRST301'].includes(error.code)) throw new ErroProjeto('Não foi possível acessar o projeto com esta sessão. Entre novamente.', 403);
    throw new ErroProjeto('Não foi possível acessar os projetos. Tente novamente quando a conexão estiver disponível.', 503);
  }
  async function salvar(token, usuarioId, id, body) {
    exigirId(id);
    const dados = prepararProjeto(body);
    const { data, error } = await consulta(token, usuarioId).upsert({ ...dados, id, user_id: usuarioId }, { onConflict: 'user_id,id' }).select('*').single();
    conferir(error);
    if (!data || data.id !== id || data.user_id !== usuarioId) throw new ErroProjeto('Não foi possível confirmar o salvamento. Tente novamente.', 503);
    return data;
  }
  async function listar(token, usuarioId, { offset = 0, limit = 20 } = {}) {
    if (!Number.isSafeInteger(offset) || offset < 0 || !Number.isSafeInteger(limit) || limit < 1 || limit > 50) throw new ErroProjeto('Página de projetos inválida.');
    const { data, error } = await consulta(token, usuarioId).select(COLUNAS_RESUMO).eq('user_id', usuarioId)
      .order('created_at', { ascending: false }).order('id', { ascending: false }).range(offset, offset + limit);
    conferir(error);
    const projetos = (data || []).slice(0, limit);
    return { projetos, proximo_offset: (data || []).length > limit ? offset + projetos.length : null };
  }
  async function carregar(token, usuarioId, id) {
    exigirId(id);
    const { data, error } = await consulta(token, usuarioId).select('*').eq('user_id', usuarioId).eq('id', id).maybeSingle();
    conferir(error);
    if (!data) throw new ErroProjeto('Projeto não encontrado nesta conta.', 404);
    if (data.versao !== VERSAO || !planoTemConteudo(data.plano)) throw new ErroProjeto('Este projeto possui um formato não suportado; os dados foram preservados.', 409);
    return data;
  }
  async function remover(token, usuarioId, id) {
    exigirId(id);
    const { data, error } = await consulta(token, usuarioId).delete().eq('user_id', usuarioId).eq('id', id).select('id').maybeSingle();
    conferir(error);
    if (!data) throw new ErroProjeto('Projeto não encontrado nesta conta.', 404);
    return { removido: true };
  }
  async function limpar(token, usuarioId) {
    const { error } = await consulta(token, usuarioId).delete().eq('user_id', usuarioId);
    conferir(error);
    return { removido: true };
  }
  return { salvar, listar, carregar, remover, limpar };
}
module.exports = { criarProjetosService, ErroProjeto, prepararProjeto, exigirId, MAX_BYTES };
