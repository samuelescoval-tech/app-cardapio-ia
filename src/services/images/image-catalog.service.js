const dictionary = require("../../../data/images/visual-dictionary.json");

const erros = validarDicionario(dictionary);
if (erros.length) throw new Error(`Dicionario visual invalido: ${erros.join("; ")}`);

function construirSolicitacoesImagem(evento = {}, blocos = []) {
  const contextoTexto = normalizar([evento.tipo, evento.tema, evento.refeicao, evento.obs].filter(Boolean).join(" "));
  const estiloTexto = normalizar(evento.estilo);
  const contexto = dictionary.contexts.find(item => item.match.some(termo => contextoTexto.includes(normalizar(termo)))) || dictionary.default_context;
  const estilo = dictionary.styles.find(item => item.match.some(termo => estiloTexto.includes(normalizar(termo))));
  const slots = [{ id: "capa", nome: "Capa do evento", slot: "capa" }];
  const vistos = new Set(["capa"]);

  normalizarBlocos(blocos).forEach(bloco => {
    const slot = inferirSlot(bloco);
    if (!slot || vistos.has(slot) || slots.length >= dictionary.max_images_per_event - 1) return;
    vistos.add(slot);
    slots.push({ id: bloco.id || slot, nome: bloco.nome || bloco.categoria || slot, slot });
  });
  if (!vistos.has("bebida")) slots.push({ id: "bebida", nome: "Bebidas", slot: "bebida" });
  if (slots.length < dictionary.max_images_per_event) slots.push({ id: "ambiente", nome: "Ambiente", slot: "ambiente" });

  return slots.slice(0, dictionary.max_images_per_event).map(item => {
    const config = dictionary.slots[item.slot];
    return {
      ...item,
      query: [contexto.query, ["capa", "ambiente"].includes(item.slot) ? estilo?.query?.split(" ")[0] : null, config.query].filter(Boolean).join(" "),
      fallback_query: config.query,
      orientation: config.orientation,
      fallback_url: config.fallback,
      context_id: contexto.id,
      style_id: estilo?.id || "sem-modificador"
    };
  });
}

function criarImagemFallback(solicitacao) {
  return validarImagem({
    id: `local-${solicitacao.slot}`,
    slot: solicitacao.slot,
    provider: "local",
    image_url: solicitacao.fallback_url,
    thumbnail_url: solicitacao.fallback_url,
    source_url: null,
    creator: "Chef IA Studio",
    creator_url: null,
    license: "local-fallback",
    license_url: null,
    attribution: "Ilustracao de contingencia do Chef IA Studio.",
    alt: solicitacao.nome || "Ilustracao do evento",
    width: null,
    height: null,
    fallback: true
  });
}

function validarImagem(valor) {
  if (!valor || typeof valor !== "object") throw new Error("Imagem invalida.");
  const slots = new Set(Object.keys(dictionary.slots));
  if (!slots.has(valor.slot)) throw new Error("Slot visual invalido.");
  if (!new Set(["openverse", "local"]).has(valor.provider)) throw new Error("Provider visual invalido.");
  if (!new Set([...dictionary.allowed_licenses, "local-fallback"]).has(valor.license)) throw new Error("Licenca visual nao permitida.");
  if (!texto(valor.id) || !texto(valor.image_url) || !texto(valor.thumbnail_url) || !texto(valor.attribution)) {
    throw new Error("Metadados visuais incompletos.");
  }
  if (valor.provider === "openverse" && (!urlHttps(valor.image_url) || !urlHttps(valor.thumbnail_url) || !urlHttps(valor.source_url))) {
    throw new Error("Imagem externa sem URLs HTTPS validas.");
  }
  return {
    id: texto(valor.id), slot: valor.slot, provider: valor.provider,
    image_url: texto(valor.image_url), thumbnail_url: texto(valor.thumbnail_url),
    source_url: urlHttps(valor.source_url), creator: texto(valor.creator) || null,
    creator_url: urlHttps(valor.creator_url), license: valor.license,
    license_url: urlHttps(valor.license_url), attribution: texto(valor.attribution),
    alt: texto(valor.alt), width: numeroOuNull(valor.width), height: numeroOuNull(valor.height),
    fallback: Boolean(valor.fallback)
  };
}

function normalizarBlocos(blocos) {
  return Array.isArray(blocos) ? blocos.filter(item => item && typeof item === "object").slice(0, 20) : [];
}

function inferirSlot(bloco) {
  const textoBloco = normalizar(`${bloco.categoria || ""} ${bloco.nome || ""}`);
  if (/bebida|bar|drink/.test(textoBloco)) return "bebida";
  if (/sobremesa|doce|bolo/.test(textoBloco)) return "sobremesa";
  if (/salada/.test(textoBloco)) return "salada";
  if (/acompanhamento|guarnicao/.test(textoBloco)) return "acompanhamento";
  if (/principal|churrasco|grelha/.test(textoBloco)) return "principal";
  if (/entrada|boas vindas|canape|petisco/.test(textoBloco)) return "entrada";
  return null;
}

function validarDicionario(valor) {
  const erros = [];
  if (!valor?.version) erros.push("versao ausente");
  if (!Number.isInteger(valor?.max_images_per_event) || valor.max_images_per_event < 1 || valor.max_images_per_event > 10) erros.push("limite invalido");
  if (!Array.isArray(valor?.contexts) || valor.contexts.length < 5) erros.push("contextos insuficientes");
  if (!valor?.slots?.capa || !valor?.slots?.ambiente) erros.push("slots essenciais ausentes");
  Object.entries(valor?.slots || {}).forEach(([id, slot]) => {
    if (!slot.query || !slot.orientation || !/^\/images\/fallback\/.+\.svg$/.test(slot.fallback || "")) erros.push(`slot ${id} incompleto`);
  });
  return erros;
}

function limparTermo(valor, limite) {
  return String(valor || "").replace(/[^\p{L}\p{N}\s-]/gu, " ").replace(/\s+/g, " ").trim().slice(0, limite);
}
function normalizar(valor) { return limparTermo(valor, 500).normalize("NFD").replace(/[\u0300-\u036f]/g, "").toLowerCase(); }
function texto(valor) { return typeof valor === "string" ? valor.trim() : ""; }
function urlHttps(valor) { try { const url = new URL(valor); return url.protocol === "https:" ? url.toString() : null; } catch { return null; } }
function numeroOuNull(valor) { const numero = Number(valor); return Number.isFinite(numero) && numero >= 0 ? numero : null; }

module.exports = { construirSolicitacoesImagem, criarImagemFallback, validarImagem, validarDicionario, inferirSlot };
