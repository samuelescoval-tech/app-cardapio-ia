const dictionary = require("../../../data/images/visual-dictionary.json");

const erros = validarDicionario(dictionary);
if (erros.length) throw new Error(`Dicionario visual invalido: ${erros.join("; ")}`);

function construirSolicitacoesImagem(evento = {}, pratos = []) {
  const contextoTexto = normalizar([evento.tipo, evento.tema, evento.refeicao, evento.obs].filter(Boolean).join(" "));
  const estiloTexto = normalizar(evento.estilo);
  const contexto = dictionary.contexts.find(item => item.match.some(termo => contextoTexto.includes(normalizar(termo)))) || dictionary.default_context;
  const estilo = dictionary.styles.find(item => item.match.some(termo => estiloTexto.includes(normalizar(termo))));
  return normalizarPratos(pratos).slice(0, dictionary.max_images_per_event).map((prato, indice) => {
    const slot = inferirSlot(prato) || "entrada";
    const config = dictionary.slots[slot];
    const targetId = prato.id || `prato-${indice + 1}`;
    return {
      id: targetId,
      target_id: targetId,
      nome: prato.nome || `Prato ${indice + 1}`,
      slot,
      query: construirConsultaPrato(prato, slot),
      match_terms: construirTermosCorrespondencia(prato, slot),
      orientation: config.orientation,
      fallback_url: config.fallback,
      context_id: contexto.id,
      style_id: estilo?.id || "sem-modificador"
    };
  });
}

function construirConsultaPrato(prato, slot) {
  const nome = normalizar(prato?.nome);
  const conceitos = CONCEITOS_VISUAIS.filter(([padrao]) => padrao.test(nome)).map(([, traducao]) => traducao);
  const categoria = ({
    entrada: "appetizer",
    principal: "main course",
    acompanhamento: "side dish",
    salada: "salad",
    sobremesa: "dessert",
    bebida: "drink"
  })[slot] || "food";
  const base = conceitos.length ? conceitos : [limparTermo(prato?.nome, 100)];
  return limparTermo([...base, categoria, "food photography"].filter(Boolean).join(" "), 180);
}

function construirTermosCorrespondencia(prato, slot) {
  const nome = normalizar(prato?.nome);
  const conceitos = CONCEITOS_VISUAIS
    .filter(([padrao]) => padrao.test(nome))
    .flatMap(([, traducao]) => traducao.split(" "));
  const termosNome = nome.split(/\s+/).filter(termo => termo.length >= 4 && !STOPWORDS.has(termo));
  return Array.from(new Set([...conceitos, ...termosNome].map(normalizar).filter(termo => termo.length >= 3))).slice(0, 12);
}

function criarImagemFallback(solicitacao) {
  return validarImagem({
    id: `local-${solicitacao.target_id || solicitacao.slot}`,
    target_id: solicitacao.target_id || null,
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
    id: texto(valor.id), target_id: texto(valor.target_id) || null, slot: valor.slot, provider: valor.provider,
    image_url: texto(valor.image_url), thumbnail_url: texto(valor.thumbnail_url),
    source_url: urlHttps(valor.source_url), creator: texto(valor.creator) || null,
    creator_url: urlHttps(valor.creator_url), license: valor.license,
    license_url: urlHttps(valor.license_url), attribution: texto(valor.attribution),
    alt: texto(valor.alt), tags: normalizarTags(valor.tags), width: numeroOuNull(valor.width), height: numeroOuNull(valor.height),
    fallback: Boolean(valor.fallback)
  };
}

function normalizarPratos(pratos) {
  return Array.isArray(pratos) ? pratos.filter(item => item && typeof item === "object" && texto(item.nome)).slice(0, 20) : [];
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
  if (!Number.isInteger(valor?.max_images_per_event) || valor.max_images_per_event < 1 || valor.max_images_per_event > 20) erros.push("limite invalido");
  if (!Array.isArray(valor?.contexts) || valor.contexts.length < 5) erros.push("contextos insuficientes");
  [...(valor?.contexts || []), valor?.default_context].filter(Boolean).forEach(contexto => {
    const consultas = contexto.queries || {};
    if (!["capa", "principal", "sobremesa", "bebida", "ambiente"].every(chave => limparTermo(consultas[chave], 180).length >= 3)) {
      erros.push(`consultas do contexto ${contexto.id || "desconhecido"} incompletas`);
    }
  });
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
function normalizarTags(valor) {
  return Array.isArray(valor)
    ? valor.map(item => texto(typeof item === "object" ? item.name : item)).filter(Boolean).slice(0, 20)
    : [];
}

const STOPWORDS = new Set(["mini", "com", "sem", "para", "de", "da", "do", "dos", "das", "especial", "artesanal", "natural", "integral", "acucar", "vegetariano", "vegano", "gluten"]);
const CONCEITOS_VISUAIS = [
  [/sanduiche|sanduich/, "sandwich"], [/carpaccio/, "carpaccio"], [/alcaparra/, "capers"],
  [/espetinho/, "skewer"], [/queijo coalho/, "grilled cheese"], [/tartare/, "tartare"], [/vegetais?/, "vegetable"], [/barquete/, "tartlet"],
  [/tilapia/, "tilapia fish"], [/salmao/, "salmon"], [/carne bovina|picanha|alcatra|patinho/, "beef"], [/linguica/, "sausage"], [/frango|coxa|asa/, "chicken"],
  [/iogurte/, "yogurt"], [/pudim/, "flan pudding"], [/cocada/, "coconut candy"], [/tartelete|torta/, "tartlet"], [/bolo/, "cake"], [/trufa/, "chocolate truffle"],
  [/cafe/, "coffee"], [/agua mineral|agua com/, "mineral water"], [/suco de uva/, "grape juice"], [/suco de laranja/, "orange juice"],
  [/gengibre/, "ginger tea"], [/hibisco/, "hibiscus tea"], [/refrigerante.*cola|cola/, "cola soda"], [/guarana/, "guarana soda"],
  [/gin/, "gin cocktail"], [/whisky|uisque/, "whisky"], [/cerveja.*ipa/, "IPA beer"], [/cerveja.*pilsen/, "pilsner beer"], [/vinho/, "wine"]
];

module.exports = { construirSolicitacoesImagem, criarImagemFallback, validarImagem, validarDicionario, inferirSlot, construirConsultaPrato, construirTermosCorrespondencia };
