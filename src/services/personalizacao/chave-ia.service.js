const { createClient } = require("@supabase/supabase-js");
const { ErroAutenticacao } = require("../auth/supabase-auth.service");
const { cifrar, decifrar } = require("../../utils/crypto-chave-ia");

class ErroChaveIA extends Error {
  constructor(message, statusCode = 400) {
    super(message);
    this.name = "ErroChaveIA";
    this.statusCode = statusCode;
  }
}

function validarChave(valor) {
  const chave = String(valor || "").trim();
  if (!chave) throw new ErroChaveIA("Informe a chave Gemini.", 400);
  if (chave.length < 20 || chave.length > 200) {
    throw new ErroChaveIA("Chave Gemini com formato invalido.", 400);
  }
  return chave;
}

function criarChaveIAService(opcoes = {}) {
  const url = Object.prototype.hasOwnProperty.call(opcoes, "url") ? opcoes.url : process.env.SUPABASE_URL;
  const anonKey = Object.prototype.hasOwnProperty.call(opcoes, "anonKey") ? opcoes.anonKey : process.env.SUPABASE_ANON_KEY;
  const segredoCifragem = opcoes.segredoCifragem;
  const criarClientePorToken = opcoes.criarClientePorToken || (token => {
    if (!url || !anonKey) return null;
    return createClient(url, anonKey, {
      global: { headers: { Authorization: `Bearer ${token}` } },
      auth: { persistSession: false, autoRefreshToken: false }
    });
  });

  async function salvar(token, usuarioId, body) {
    const client = criarClientePorToken(token);
    if (!client) throw new ErroAutenticacao("Supabase nao configurado no .env.", 500);
    const chave = validarChave(body?.chave);
    const { chave_cifrada, iv, tag } = cifrar(chave, segredoCifragem);
    const { error } = await client
      .from("chave_ia_usuario")
      .upsert({ user_id: usuarioId, chave_cifrada, iv, tag });
    if (error) throw new ErroChaveIA(error.message, 400);
    return { configurada: true };
  }

  async function remover(token, usuarioId) {
    const client = criarClientePorToken(token);
    if (!client) throw new ErroAutenticacao("Supabase nao configurado no .env.", 500);
    const { error } = await client
      .from("chave_ia_usuario")
      .delete()
      .eq("user_id", usuarioId);
    if (error) throw new ErroChaveIA(error.message, 400);
    return { removido: true };
  }

  async function obterStatus(token) {
    const client = criarClientePorToken(token);
    if (!client) throw new ErroAutenticacao("Supabase nao configurado no .env.", 500);
    const { data, error } = await client
      .from("chave_ia_usuario")
      .select("atualizado_em")
      .maybeSingle();
    if (error) throw new ErroChaveIA(error.message, 400);
    return { configurada: Boolean(data), atualizado_em: data?.atualizado_em || null };
  }

  async function obterChaveDecifrada(token) {
    const client = criarClientePorToken(token);
    if (!client) return null;
    const { data, error } = await client
      .from("chave_ia_usuario")
      .select("chave_cifrada, iv, tag")
      .maybeSingle();
    if (error || !data) return null;
    try {
      return decifrar(data, segredoCifragem);
    } catch {
      return null;
    }
  }

  return { salvar, remover, obterStatus, obterChaveDecifrada };
}

module.exports = { criarChaveIAService, ErroChaveIA };
