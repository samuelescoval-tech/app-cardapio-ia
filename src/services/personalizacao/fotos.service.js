const { randomUUID } = require("node:crypto");
const { createClient } = require("@supabase/supabase-js");
const { ErroAutenticacao } = require("../auth/supabase-auth.service");

const BUCKET = "fotos-pratos";
const TAMANHO_MAXIMO_BYTES = 5 * 1024 * 1024;
const TIPOS_PERMITIDOS = {
  "image/jpeg": "jpg",
  "image/png": "png",
  "image/webp": "webp"
};

class ErroFoto extends Error {
  constructor(message, statusCode = 400) {
    super(message);
    this.name = "ErroFoto";
    this.statusCode = statusCode;
  }
}

// Confere a assinatura real (magic bytes) do arquivo, em vez de confiar so
// no Content-Type que o cliente declarou — auditoria de seguranca, 2026-08.
// Sem isso, um usuario mal-intencionado podia mandar "tipo: image/png" com
// bytes de qualquer outra coisa dentro do base64.
function assinaturaBate(buffer, mimeType) {
  if (mimeType === "image/png") {
    const assinatura = [0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a];
    return buffer.length >= assinatura.length && assinatura.every((byte, i) => buffer[i] === byte);
  }
  if (mimeType === "image/jpeg") {
    return buffer.length >= 3 && buffer[0] === 0xff && buffer[1] === 0xd8 && buffer[2] === 0xff;
  }
  if (mimeType === "image/webp") {
    return buffer.length >= 12
      && buffer.toString("ascii", 0, 4) === "RIFF"
      && buffer.toString("ascii", 8, 12) === "WEBP";
  }
  return false;
}

function criarFotosService(opcoes = {}) {
  const url = Object.prototype.hasOwnProperty.call(opcoes, "url") ? opcoes.url : process.env.SUPABASE_URL;
  const anonKey = Object.prototype.hasOwnProperty.call(opcoes, "anonKey") ? opcoes.anonKey : process.env.SUPABASE_ANON_KEY;
  const criarClientePorToken = opcoes.criarClientePorToken || (token => {
    if (!url || !anonKey) return null;
    return createClient(url, anonKey, {
      global: { headers: { Authorization: `Bearer ${token}` } },
      auth: { persistSession: false, autoRefreshToken: false }
    });
  });

  function decodificarImagem(body) {
    const mimeType = String(body?.tipo || "").toLowerCase();
    const extensao = TIPOS_PERMITIDOS[mimeType];
    if (!extensao) {
      throw new ErroFoto(`Tipo de imagem invalido. Use: ${Object.keys(TIPOS_PERMITIDOS).join(", ")}.`, 400);
    }

    const base64 = String(body?.arquivo || "").replace(/^data:[^;]+;base64,/, "");
    if (!base64) throw new ErroFoto("Arquivo da imagem ausente.", 400);

    let buffer;
    try {
      buffer = Buffer.from(base64, "base64");
    } catch {
      throw new ErroFoto("Arquivo da imagem invalido.", 400);
    }
    if (!buffer.length) throw new ErroFoto("Arquivo da imagem invalido.", 400);
    if (buffer.length > TAMANHO_MAXIMO_BYTES) {
      throw new ErroFoto("Imagem acima do limite de 5MB.", 400);
    }
    if (!assinaturaBate(buffer, mimeType)) {
      throw new ErroFoto("O conteudo do arquivo nao corresponde ao tipo de imagem informado.", 400);
    }

    const nomePrato = body?.nome_prato !== undefined
      ? String(body.nome_prato || "").trim().slice(0, 120) || null
      : null;

    return { buffer, mimeType, extensao, nomePrato };
  }

  async function criar(token, usuarioId, body) {
    const client = criarClientePorToken(token);
    if (!client) throw new ErroAutenticacao("Supabase nao configurado no .env.", 500);
    const { buffer, mimeType, extensao, nomePrato } = decodificarImagem(body);

    const caminho = `${usuarioId}/${randomUUID()}.${extensao}`;
    const { error: erroUpload } = await client.storage
      .from(BUCKET)
      .upload(caminho, buffer, { contentType: mimeType, upsert: false });
    if (erroUpload) throw new ErroFoto(erroUpload.message, 400);

    const { data, error } = await client
      .from("fotos_pratos")
      .insert({ user_id: usuarioId, nome_prato: nomePrato, storage_path: caminho })
      .select()
      .single();
    if (error) {
      await client.storage.from(BUCKET).remove([caminho]);
      throw new ErroFoto(error.message, 400);
    }
    return data;
  }

  async function listar(token) {
    const client = criarClientePorToken(token);
    if (!client) throw new ErroAutenticacao("Supabase nao configurado no .env.", 500);
    const { data, error } = await client
      .from("fotos_pratos")
      .select("*")
      .order("created_at", { ascending: false });
    if (error) throw new ErroFoto(error.message, 400);

    const comUrl = await Promise.all(data.map(async registro => {
      const { data: assinada } = await client.storage
        .from(BUCKET)
        .createSignedUrl(registro.storage_path, 60 * 10);
      return { ...registro, url: assinada?.signedUrl || null };
    }));
    return comUrl;
  }

  async function remover(token, id) {
    const client = criarClientePorToken(token);
    if (!client) throw new ErroAutenticacao("Supabase nao configurado no .env.", 500);
    const { data, error } = await client
      .from("fotos_pratos")
      .delete()
      .eq("id", id)
      .select()
      .maybeSingle();
    if (error) throw new ErroFoto(error.message, 400);
    if (!data) throw new ErroFoto("Foto nao encontrada.", 404);

    await client.storage.from(BUCKET).remove([data.storage_path]);
    return { removido: true };
  }

  return { listar, criar, remover };
}

module.exports = { criarFotosService, ErroFoto, BUCKET, TAMANHO_MAXIMO_BYTES, TIPOS_PERMITIDOS };
