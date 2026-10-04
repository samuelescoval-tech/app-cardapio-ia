const {randomUUID} = require('node:crypto');
const {createClient} = require('@supabase/supabase-js');
const {ErroFoto, BUCKET, TAMANHO_MAXIMO_BYTES} = require('./fotos.service');
const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

function criarFotoCompartilhamentoService(opcoes = {}) {
  const url = opcoes.url ?? process.env.SUPABASE_URL;
  const chave = opcoes.chaveAdmin ?? process.env.SUPABASE_SERVICE_ROLE_KEY;
  const config = {auth: {persistSession: false, autoRefreshToken: false}};
  // Cliente privilegiado fica exclusivamente neste modulo de backend.
  const admin = Object.hasOwn(opcoes, 'admin') ? opcoes.admin : url && chave ? createClient(url, chave, config) : null;
  const clienteUsuario = opcoes.clienteUsuario || (token => createClient(url, process.env.SUPABASE_ANON_KEY, {...config, global: {headers: {Authorization: `Bearer ${token}`}}}));

  async function status(token) {
    if (!admin) return {disponivel: false, motivo: 'Compartilhamento ainda não configurado.'};
    try {
      const {error} = await clienteUsuario(token).from('fotos_pratos').select('compartilhada_catalogo').limit(1);
      return error ? {disponivel: false, motivo: 'Compartilhamento aguarda a atualização do banco.'} : {disponivel: true};
    } catch { return {disponivel: false, motivo: 'Compartilhamento indisponível no momento.'}; }
  }

  async function atualizar(token, id, body) {
    if (!UUID.test(id)) throw new ErroFoto('Foto não encontrada.', 404);
    if (typeof body?.galeria !== 'boolean' || typeof body?.link !== 'boolean') throw new ErroFoto('Informe as duas opções de compartilhamento.');
    if ((body.galeria || body.link) && body.autorizacao !== true) throw new ErroFoto('É necessária a autorização do proprietário para compartilhar.');
    if ((body.galeria || body.link) && !admin) throw new ErroFoto('Compartilhamento ainda não configurado.', 503);
    const client = clienteUsuario(token);
    // RLS do cliente autenticado determina a propriedade; nunca usar admin para editar.
    const {data: atual, error: erroConsulta} = await client.from('fotos_pratos').select('*').eq('id', id).maybeSingle();
    if (erroConsulta) throw new ErroFoto('Não foi possível consultar a foto.', 503);
    if (!atual) throw new ErroFoto('Foto não encontrada.', 404);
    if ((body.galeria || body.link) && !String(atual.nome_prato || '').trim()) throw new ErroFoto('Envie uma foto com nome do prato antes de compartilhar.');
    if (typeof body.credito !== 'string' || body.credito.trim().length > 80) throw new ErroFoto('O crédito público deve ter até 80 caracteres.');
    const valores = {
      compartilhada_catalogo: body.galeria,
      token_compartilhamento: body.link ? atual.token_compartilhamento || randomUUID() : null,
      credito_publico: body.credito.trim() || 'Colaborador Karamu',
      autorizacao_atualizada_em: new Date().toISOString()
    };
    const {data, error} = await client.from('fotos_pratos').update(valores).eq('id', id).select().maybeSingle();
    if (error) throw new ErroFoto('Não foi possível salvar a autorização. Confira se a atualização do banco foi aplicada.', 503);
    if (!data) throw new ErroFoto('Foto não encontrada.', 404);
    return data;
  }

  async function listarCatalogo() {
    if (!admin) return [];
    const {data, error} = await admin.from('fotos_pratos').select('id,nome_prato,credito_publico').eq('compartilhada_catalogo', true).order('created_at', {ascending: false}).limit(200);
    // Instalacao anterior sem migracao continua usando a biblioteca existente.
    if (error) return [];
    return (data || []).map(foto => ({id: foto.id, nome_prato: foto.nome_prato, credito_publico: foto.credito_publico || 'Colaborador Karamu'}));
  }

  async function consultar(chaveFoto, porLink) {
    if (!admin || !UUID.test(chaveFoto)) throw new ErroFoto('Foto indisponível ou autorização revogada.', 404);
    let consulta = admin.from('fotos_pratos').select('id,user_id,nome_prato,storage_path,credito_publico');
    consulta = porLink ? consulta.eq('token_compartilhamento', chaveFoto) : consulta.eq('id', chaveFoto).eq('compartilhada_catalogo', true);
    const {data, error} = await consulta.maybeSingle();
    if (error || !data) throw new ErroFoto('Foto indisponível ou autorização revogada.', 404);
    return data;
  }

  async function metadadosLink(token) {
    const foto = await consultar(token, true);
    return {nome_prato: foto.nome_prato, credito: foto.credito_publico || 'Colaborador Karamu', imagem: `/api/fotos-compartilhadas/${token}/imagem`};
  }

  async function imagem(chaveFoto, porLink = false) {
    const foto = await consultar(chaveFoto, porLink);
    // O cliente nunca fornece caminho do arquivo a um download privilegiado.
    const ext = String(foto.storage_path || '').match(/\.(jpg|png|webp)$/)?.[1];
    if (!ext || !foto.storage_path.startsWith(`${foto.user_id}/`) || foto.storage_path.includes('..')) throw new ErroFoto('Imagem indisponível.', 404);
    const {data, error} = await admin.storage.from(BUCKET).download(foto.storage_path);
    if (error || !data || data.size > TAMANHO_MAXIMO_BYTES) throw new ErroFoto('Imagem indisponível.', 404);
    return {buffer: Buffer.from(await data.arrayBuffer()), tipo: {jpg: 'image/jpeg', png: 'image/png', webp: 'image/webp'}[ext]};
  }

  return {status, atualizar, listarCatalogo, metadadosLink, imagem};
}

module.exports = {criarFotoCompartilhamentoService};
