const { createClient } = require("@supabase/supabase-js");
const { ErroAutenticacao } = require("../auth/supabase-auth.service");
const { CATEGORIAS_VALIDAS } = require("./fornecedores.service");

const LIMITES = { item: 120, unidade: 20, categoria: 40, observacoes: 500 };

class ErroPreco extends Error {
  constructor(message, statusCode = 400) {
    super(message);
    this.name = "ErroPreco";
    this.statusCode = statusCode;
  }
}

function criarPrecosService(opcoes = {}) {
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

    const item = typeof body?.item === "string" ? body.item.trim() : "";
    if (!parcial || body?.item !== undefined) {
      if (!item) throw new ErroPreco("Informe o nome do item.", 400);
      if (item.length > LIMITES.item) throw new ErroPreco(`Item deve ter no maximo ${LIMITES.item} caracteres.`, 400);
      dados.item = item;
    }

    const unidade = typeof body?.unidade === "string" ? body.unidade.trim() : "";
    if (!parcial || body?.unidade !== undefined) {
      if (!unidade) throw new ErroPreco("Informe a unidade (kg, un, L, cx...).", 400);
      if (unidade.length > LIMITES.unidade) throw new ErroPreco(`Unidade deve ter no maximo ${LIMITES.unidade} caracteres.`, 400);
      dados.unidade = unidade;
    }

    if (!parcial || body?.preco !== undefined) {
      const preco = Number(body?.preco);
      if (!Number.isFinite(preco) || preco < 0) {
        throw new ErroPreco("Informe um preco valido (numero maior ou igual a zero).", 400);
      }
      dados.preco = Math.round(preco * 100) / 100;
    }

    if (body?.categoria !== undefined) {
      const categoria = String(body.categoria || "").trim();
      if (categoria && !CATEGORIAS_VALIDAS.includes(categoria)) {
        throw new ErroPreco(`Categoria invalida. Use uma de: ${CATEGORIAS_VALIDAS.join(", ")}.`, 400);
      }
      dados.categoria = categoria || null;
    }

    if (body?.observacoes !== undefined) {
      dados.observacoes = String(body.observacoes || "").trim().slice(0, LIMITES.observacoes) || null;
    }

    if (body?.fornecedor_id !== undefined) {
      dados.fornecedor_id = body.fornecedor_id || null;
    }

    return dados;
  }

  async function validarFornecedorProprio(client, fornecedorId) {
    if (!fornecedorId) return;
    const { data, error } = await client.from("fornecedores").select("id").eq("id", fornecedorId).maybeSingle();
    if (error) throw new ErroPreco(error.message, 400);
    if (!data) throw new ErroPreco("Fornecedor nao encontrado.", 404);
  }

  async function listar(token) {
    const client = criarClientePorToken(token);
    if (!client) throw new ErroAutenticacao("Supabase nao configurado no .env.", 500);
    const { data, error } = await client
      .from("precos_usuario")
      .select("*")
      .order("item", { ascending: true });
    if (error) throw new ErroPreco(error.message, 400);
    return data;
  }

  async function criar(token, usuarioId, body) {
    const client = criarClientePorToken(token);
    if (!client) throw new ErroAutenticacao("Supabase nao configurado no .env.", 500);
    const dados = validarCampos(body);
    await validarFornecedorProprio(client, dados.fornecedor_id);
    const { data, error } = await client
      .from("precos_usuario")
      .insert({ ...dados, user_id: usuarioId })
      .select()
      .single();
    if (error) throw new ErroPreco(error.message, 400);
    return data;
  }

  async function atualizar(token, id, body) {
    const client = criarClientePorToken(token);
    if (!client) throw new ErroAutenticacao("Supabase nao configurado no .env.", 500);
    const dados = validarCampos(body, { parcial: true });
    if (Object.keys(dados).length === 0) throw new ErroPreco("Nenhum campo para atualizar.", 400);
    if (dados.fornecedor_id !== undefined) await validarFornecedorProprio(client, dados.fornecedor_id);
    const { data, error } = await client
      .from("precos_usuario")
      .update(dados)
      .eq("id", id)
      .select()
      .maybeSingle();
    if (error) throw new ErroPreco(error.message, 400);
    if (!data) throw new ErroPreco("Preco nao encontrado.", 404);
    return data;
  }

  async function remover(token, id) {
    const client = criarClientePorToken(token);
    if (!client) throw new ErroAutenticacao("Supabase nao configurado no .env.", 500);
    const { data, error } = await client
      .from("precos_usuario")
      .delete()
      .eq("id", id)
      .select()
      .maybeSingle();
    if (error) throw new ErroPreco(error.message, 400);
    if (!data) throw new ErroPreco("Preco nao encontrado.", 404);
    return { removido: true };
  }

  function exportarCSV(precos) {
    const cabecalho = ["Item", "Categoria", "Unidade", "Preco", "Observacoes"];
    const escaparCampo = valor => `"${String(valor ?? "").replace(/"/g, '""')}"`;
    const linhas = precos.map(preco => [
      preco.item,
      preco.categoria || "",
      preco.unidade,
      preco.preco.toFixed(2).replace(".", ","),
      preco.observacoes || ""
    ].map(escaparCampo).join(";"));
    return [cabecalho.map(escaparCampo).join(";"), ...linhas].join("\r\n");
  }

  return { listar, criar, atualizar, remover, exportarCSV };
}

module.exports = { criarPrecosService, ErroPreco, LIMITES };
