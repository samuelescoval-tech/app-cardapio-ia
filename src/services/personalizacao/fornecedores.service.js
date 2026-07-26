const { createClient } = require("@supabase/supabase-js");
const { ErroAutenticacao } = require("../auth/supabase-auth.service");

const CATEGORIAS_VALIDAS = ["Hortifruti", "Acougue", "Bebidas", "Mercearia", "Frios", "Padaria", "Descartaveis", "Limpeza", "Outros"];
const LIMITES = { nome: 120, categoria: 40, telefone: 40, endereco: 200, observacoes: 500 };

class ErroFornecedor extends Error {
  constructor(message, statusCode = 400) {
    super(message);
    this.name = "ErroFornecedor";
    this.statusCode = statusCode;
  }
}

function criarFornecedoresService(opcoes = {}) {
  const url = Object.prototype.hasOwnProperty.call(opcoes, "url") ? opcoes.url : process.env.SUPABASE_URL;
  const anonKey = Object.prototype.hasOwnProperty.call(opcoes, "anonKey") ? opcoes.anonKey : process.env.SUPABASE_ANON_KEY;
  const criarClientePorToken = opcoes.criarClientePorToken || (token => {
    if (!url || !anonKey) return null;
    return createClient(url, anonKey, {
      global: { headers: { Authorization: `Bearer ${token}` } },
      auth: { persistSession: false, autoRefreshToken: false }
    });
  });

  function validarCampos(body, { parcial = false } = {}) {
    const dados = {};
    const nome = typeof body?.nome === "string" ? body.nome.trim() : "";
    if (!parcial || body?.nome !== undefined) {
      if (!nome) throw new ErroFornecedor("Informe o nome do fornecedor.", 400);
      if (nome.length > LIMITES.nome) throw new ErroFornecedor(`Nome deve ter no maximo ${LIMITES.nome} caracteres.`, 400);
      dados.nome = nome;
    }

    if (body?.categoria !== undefined) {
      const categoria = String(body.categoria || "").trim();
      if (categoria && !CATEGORIAS_VALIDAS.includes(categoria)) {
        throw new ErroFornecedor(`Categoria invalida. Use uma de: ${CATEGORIAS_VALIDAS.join(", ")}.`, 400);
      }
      dados.categoria = categoria || null;
    }

    for (const campo of ["telefone", "endereco", "observacoes"]) {
      if (body?.[campo] !== undefined) {
        const valor = String(body[campo] || "").trim().slice(0, LIMITES[campo]);
        dados[campo] = valor || null;
      }
    }

    return dados;
  }

  async function listar(token) {
    const client = criarClientePorToken(token);
    if (!client) throw new ErroAutenticacao("Supabase nao configurado no .env.", 500);
    const { data, error } = await client
      .from("fornecedores")
      .select("*")
      .order("created_at", { ascending: false });
    if (error) throw new ErroFornecedor(error.message, 400);
    return data;
  }

  async function criar(token, usuarioId, body) {
    const client = criarClientePorToken(token);
    if (!client) throw new ErroAutenticacao("Supabase nao configurado no .env.", 500);
    const dados = validarCampos(body);
    const { data, error } = await client
      .from("fornecedores")
      .insert({ ...dados, user_id: usuarioId })
      .select()
      .single();
    if (error) throw new ErroFornecedor(error.message, 400);
    return data;
  }

  async function atualizar(token, id, body) {
    const client = criarClientePorToken(token);
    if (!client) throw new ErroAutenticacao("Supabase nao configurado no .env.", 500);
    const dados = validarCampos(body, { parcial: true });
    if (Object.keys(dados).length === 0) throw new ErroFornecedor("Nenhum campo para atualizar.", 400);
    const { data, error } = await client
      .from("fornecedores")
      .update({ ...dados, updated_at: new Date().toISOString() })
      .eq("id", id)
      .select()
      .maybeSingle();
    if (error) throw new ErroFornecedor(error.message, 400);
    if (!data) throw new ErroFornecedor("Fornecedor nao encontrado.", 404);
    return data;
  }

  async function remover(token, id) {
    const client = criarClientePorToken(token);
    if (!client) throw new ErroAutenticacao("Supabase nao configurado no .env.", 500);
    const { data, error } = await client
      .from("fornecedores")
      .delete()
      .eq("id", id)
      .select()
      .maybeSingle();
    if (error) throw new ErroFornecedor(error.message, 400);
    if (!data) throw new ErroFornecedor("Fornecedor nao encontrado.", 404);
    return { removido: true };
  }

  return { listar, criar, atualizar, remover, CATEGORIAS_VALIDAS };
}

module.exports = { criarFornecedoresService, ErroFornecedor, CATEGORIAS_VALIDAS };
