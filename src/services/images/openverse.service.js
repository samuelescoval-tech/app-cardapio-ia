const { validarImagem } = require("./image-catalog.service");

const API_URL = "https://api.openverse.org/v1/images/";

class OpenverseError extends Error {
  constructor(message, statusCode = 500) { super(message); this.name = "OpenverseError"; this.statusCode = statusCode; }
}

function criarOpenverseService(opcoes = {}) {
  const fetchImpl = opcoes.fetchImpl || global.fetch;
  const relogio = opcoes.relogio || (() => Date.now());
  const limiteDiario = inteiro(opcoes.limiteDiario ?? process.env.OPENVERSE_DAILY_SEARCH_LIMIT, 1, 200, 40);
  const cacheMs = inteiro(opcoes.cacheMs, 60000, 86400000, 86400000);
  const cache = new Map();
  let dia = "";
  let consultas = 0;

  function getStatus() {
    atualizarDia();
    return { configured: typeof fetchImpl === "function", provider: "openverse", authentication: "anonymous", allowed_licenses: ["cc0", "by"], color_policy: "reject-monochrome-and-archival", daily_search_limit: limiteDiario, searches_remaining: Math.max(0, limiteDiario - consultas), cache_ttl_hours: cacheMs / 3600000 };
  }

  async function buscar(solicitacao) {
    if (typeof fetchImpl !== "function") throw new OpenverseError("Cliente HTTP indisponivel.", 500);
    const query = validarQuery(solicitacao?.query);
    const slot = solicitacao?.slot;
    const chave = `${query}|${solicitacao?.orientation || ""}`;
    const itemCache = cache.get(chave);
    if (itemCache && relogio() - itemCache.criado_em < cacheMs) return { ...itemCache.valor, cached: true };
    atualizarDia();
    if (consultas >= limiteDiario) throw new OpenverseError("Limite diario local de imagens atingido.", 429);
    consultas += 1;

    const url = new URL(API_URL);
    url.searchParams.set("q", query);
    url.searchParams.set("license", "cc0,by");
    url.searchParams.set("license_type", "commercial");
    url.searchParams.set("mature", "false");
    url.searchParams.set("page_size", "6");
    if (["wide", "square", "tall"].includes(solicitacao?.orientation)) url.searchParams.set("aspect_ratio", solicitacao.orientation);

    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 8000);
    let response;
    try {
      response = await fetchImpl(url, { headers: { Accept: "application/json", "User-Agent": "ChefIAStudio/1.0" }, signal: controller.signal });
    } catch (error) {
      throw new OpenverseError(error?.name === "AbortError" ? "Openverse demorou demais para responder." : "Nao foi possivel consultar o Openverse.", error?.name === "AbortError" ? 504 : 502);
    } finally { clearTimeout(timeout); }
    if (!response.ok) throw new OpenverseError(response.status === 429 ? "Cota anonima do Openverse indisponivel." : "Openverse nao retornou imagens validas.", response.status === 429 ? 429 : 502);
    const data = await response.json().catch(() => ({}));
    const resultados = Array.isArray(data.results) ? data.results : [];
    const imagens = resultados.map(item => normalizarResultado(item, slot)).filter(Boolean).slice(0, 4);
    const valor = { provider: "openverse", query, images: imagens, result_count: Number(data.result_count) || resultados.length, rejected_count: resultados.length - imagens.length, cached: false, searches_remaining: Math.max(0, limiteDiario - consultas) };
    cache.set(chave, { criado_em: relogio(), valor });
    return valor;
  }

  function atualizarDia() {
    const atual = new Date(relogio()).toISOString().slice(0, 10);
    if (atual !== dia) { dia = atual; consultas = 0; }
  }
  return { buscar, getStatus };
}

function normalizarResultado(item, slot) {
  try {
    const license = String(item?.license || "").toLowerCase();
    if (!["cc0", "by"].includes(license) || item?.mature === true || ehResultadoVisualInadequado(item)) return null;
    const imagemSegura = urlHttps(item.url) || urlHttps(item.thumbnail);
    const miniaturaSegura = urlHttps(item.thumbnail) || imagemSegura;
    const fonteSegura = urlHttps(item.foreign_landing_url);
    if (!imagemSegura || !miniaturaSegura || !fonteSegura) return null;
    return validarImagem({
      id: `openverse-${item.id}`, target_id: null, slot, provider: "openverse", image_url: imagemSegura,
      thumbnail_url: miniaturaSegura, source_url: fonteSegura,
      creator: item.creator || null, creator_url: item.creator_url || null, license,
      license_url: item.license_url || null,
      attribution: item.attribution || `${item.title || "Imagem"} - ${item.creator || "autor nao informado"} (${license.toUpperCase()})`,
      alt: item.title || "Imagem ilustrativa do evento", tags: item.tags, width: item.width, height: item.height, fallback: false
    });
  } catch { return null; }
}

function ehResultadoVisualInadequado(item) {
  const textoVisual = [
    item?.title, item?.attribution, item?.description, item?.category,
    ...(Array.isArray(item?.tags) ? item.tags.map(tag => typeof tag === "object" ? tag.name : tag) : [])
  ].filter(Boolean).join(" ").toLowerCase();
  if (/black[ -]?and[ -]?white|monochrom|grayscale|greyscale|engraving|etching|lithograph|woodcut|vintage|historic|archive|poster|drawing|painting/.test(textoVisual)) return true;
  const cores = Array.isArray(item?.colors) ? item.colors.map(cor => String(cor || "")).filter(cor => /^#?[0-9a-f]{6}$/i.test(cor)) : [];
  return cores.length >= 2 && cores.every(cor => saturacaoHex(cor) < 0.12);
}

function saturacaoHex(valor) {
  const hex = valor.replace("#", "");
  const canais = [0, 2, 4].map(indice => parseInt(hex.slice(indice, indice + 2), 16) / 255);
  const max = Math.max(...canais);
  const min = Math.min(...canais);
  return max ? (max - min) / max : 0;
}

function validarQuery(valor) {
  if (typeof valor !== "string") throw new OpenverseError("Consulta visual ausente.", 400);
  const query = valor.replace(/[^\p{L}\p{N}\s-]/gu, " ").replace(/\s+/g, " ").trim();
  if (query.length < 3 || query.length > 180) throw new OpenverseError("Consulta visual invalida.", 400);
  return query;
}
function inteiro(valor, min, max, fallback) { const numero = Number(valor); return Number.isInteger(numero) && numero >= min && numero <= max ? numero : fallback; }
function urlHttps(valor) { try { const url = new URL(valor); return url.protocol === "https:" ? url.toString() : null; } catch { return null; } }

module.exports = { criarOpenverseService, OpenverseError, normalizarResultado, validarQuery, ehResultadoVisualInadequado };
