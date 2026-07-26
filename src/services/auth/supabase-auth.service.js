const { createClient } = require("@supabase/supabase-js");

class ErroAutenticacao extends Error {
  constructor(message, statusCode = 400) {
    super(message);
    this.name = "ErroAutenticacao";
    this.statusCode = statusCode;
  }
}

function criarSupabaseAuthService(opcoes = {}) {
  const url = Object.prototype.hasOwnProperty.call(opcoes, "url") ? opcoes.url : process.env.SUPABASE_URL;
  const anonKey = Object.prototype.hasOwnProperty.call(opcoes, "anonKey") ? opcoes.anonKey : process.env.SUPABASE_ANON_KEY;
  const client = opcoes.client || (url && anonKey
    ? createClient(url, anonKey, { auth: { persistSession: false, autoRefreshToken: false } })
    : null);

  function getStatus() {
    return { provider: "supabase", configured: Boolean(client) };
  }

  function exigirClient() {
    if (!client) throw new ErroAutenticacao("Supabase nao configurado no .env.", 500);
  }

  async function cadastrar(email, senha) {
    exigirClient();
    const { data, error } = await client.auth.signUp({ email, password: senha });
    if (error) throw new ErroAutenticacao(error.message, error.status || 400);
    return {
      usuario_id: data.user?.id || null,
      email: data.user?.email || null,
      confirmacao_pendente: !data.session
    };
  }

  async function login(email, senha) {
    exigirClient();
    const { data, error } = await client.auth.signInWithPassword({ email, password: senha });
    if (error) throw new ErroAutenticacao(error.message, error.status || 400);
    return {
      usuario_id: data.user?.id || null,
      email: data.user?.email || null,
      access_token: data.session?.access_token || null,
      expira_em: data.session?.expires_at || null
    };
  }

  async function obterUsuario(tokenAcesso) {
    exigirClient();
    if (!tokenAcesso) throw new ErroAutenticacao("Token de acesso ausente.", 401);
    const { data, error } = await client.auth.getUser(tokenAcesso);
    if (error) throw new ErroAutenticacao("Sessao invalida ou expirada.", 401);
    return { usuario_id: data.user.id, email: data.user.email };
  }

  return { getStatus, cadastrar, login, obterUsuario };
}

module.exports = { criarSupabaseAuthService, ErroAutenticacao };
