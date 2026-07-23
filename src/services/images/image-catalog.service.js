const dictionary = require("../../../data/images/visual-dictionary.json");
const localLibrary = require("../../../data/images/local-library.json");

const erros = validarDicionario(dictionary);
if (erros.length) throw new Error(`Dicionario visual invalido: ${erros.join("; ")}`);
const errosBiblioteca = validarBibliotecaLocal(localLibrary);
if (errosBiblioteca.length) throw new Error(`Biblioteca visual invalida: ${errosBiblioteca.join("; ")}`);

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
      anchor_terms: construirTermosAncora(prato),
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

function selecionarImagensLocais(solicitacao) {
  const nome = normalizar(solicitacao?.nome);
  return localLibrary.entries
    .filter(item => item.slots.includes(solicitacao?.slot))
    .map(item => {
      const correspondencias = item.match_terms.filter(termo => nome.includes(normalizar(termo)));
      const score = correspondencias.length ? 10 + correspondencias.length : item.default ? 1 : 0;
      if (!score) return null;
      const matchType = item.match_mode === "dish-family" && correspondencias.length ? "dish-family" : "category";
      return validarImagem({
        id: `local-library-${item.id}`,
        target_id: solicitacao.target_id || null,
        slot: solicitacao.slot,
        provider: "local",
        image_url: item.path,
        thumbnail_url: item.path,
        source_url: null,
        creator: localLibrary.creator,
        creator_url: null,
        license: localLibrary.license,
        license_url: null,
        attribution: "Ilustracao original da biblioteca Chef IA Studio.",
        alt: `${item.alt}. ${matchType === "category" ? "Imagem ilustrativa de categoria." : "Imagem ilustrativa da familia do prato."}`,
        width: 1200,
        height: 700,
        fallback: false,
        match_type: matchType,
        relevance_score: score
      });
    })
    .filter(Boolean)
    .sort((a, b) => b.relevance_score - a.relevance_score);
}

function validarImagem(valor) {
  if (!valor || typeof valor !== "object") throw new Error("Imagem invalida.");
  const slots = new Set(Object.keys(dictionary.slots));
  if (!slots.has(valor.slot)) throw new Error("Slot visual invalido.");
  if (!new Set(["openverse", "local"]).has(valor.provider)) throw new Error("Provider visual invalido.");
  if (!new Set([...dictionary.allowed_licenses, "local-fallback", "chef-ia-original"]).has(valor.license)) throw new Error("Licenca visual nao permitida.");
  if (!texto(valor.id) || !texto(valor.image_url) || !texto(valor.thumbnail_url) || !texto(valor.attribution)) {
    throw new Error("Metadados visuais incompletos.");
  }
  if (valor.provider === "openverse" && (!urlHttps(valor.image_url) || !urlHttps(valor.thumbnail_url) || !urlHttps(valor.source_url))) {
    throw new Error("Imagem externa sem URLs HTTPS validas.");
  }
  if (valor.provider === "local" && (!urlLocal(valor.image_url) || !urlLocal(valor.thumbnail_url))) {
    throw new Error("Imagem local fora da biblioteca permitida.");
  }
  return {
    id: texto(valor.id), target_id: texto(valor.target_id) || null, slot: valor.slot, provider: valor.provider,
    image_url: texto(valor.image_url), thumbnail_url: texto(valor.thumbnail_url),
    source_url: urlHttps(valor.source_url), creator: texto(valor.creator) || null,
    creator_url: urlHttps(valor.creator_url), license: valor.license,
    license_url: urlHttps(valor.license_url), attribution: texto(valor.attribution),
    alt: texto(valor.alt), tags: normalizarTags(valor.tags), width: numeroOuNull(valor.width), height: numeroOuNull(valor.height),
    fallback: Boolean(valor.fallback),
    match_type: ["dish-family", "category", "fallback"].includes(valor.match_type) ? valor.match_type : null,
    relevance_score: numeroOuNull(valor.relevance_score)
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

function validarBibliotecaLocal(valor) {
  const erros = [];
  if (!valor?.version || valor?.license !== "chef-ia-original") erros.push("cabecalho invalido");
  if (!Array.isArray(valor?.entries) || valor.entries.length < 6) return [...erros, "itens insuficientes"];
  const ids = new Set();
  valor.entries.forEach(item => {
    if (!item?.id || ids.has(item.id)) erros.push(`id local invalido: ${item?.id || "ausente"}`);
    ids.add(item?.id);
    if (!urlLocal(item?.path)) erros.push(`caminho local invalido: ${item?.id || "desconhecido"}`);
    if (!Array.isArray(item?.slots) || !item.slots.length || item.slots.some(slot => !dictionary.slots[slot])) erros.push(`slots locais invalidos: ${item?.id || "desconhecido"}`);
    if (!Array.isArray(item?.match_terms)) erros.push(`termos locais invalidos: ${item?.id || "desconhecido"}`);
    if (!["dish-family", "category"].includes(item?.match_mode)) erros.push(`modo local invalido: ${item?.id || "desconhecido"}`);
  });
  return erros;
}

function limparTermo(valor, limite) {
  return String(valor || "").replace(/[^\p{L}\p{N}\s-]/gu, " ").replace(/\s+/g, " ").trim().slice(0, limite);
}
function normalizar(valor) { return limparTermo(valor, 500).normalize("NFD").replace(/[\u0300-\u036f]/g, "").toLowerCase(); }
function texto(valor) { return typeof valor === "string" ? valor.trim() : ""; }
function urlHttps(valor) { try { const url = new URL(valor); return url.protocol === "https:" ? url.toString() : null; } catch { return null; } }
function urlLocal(valor) { return typeof valor === "string" && /^\/images\/(?:fallback|library)\/[a-z0-9-]+\.svg$/i.test(valor) ? valor : null; }
function numeroOuNull(valor) { const numero = Number(valor); return Number.isFinite(numero) && numero >= 0 ? numero : null; }
function normalizarTags(valor) {
  return Array.isArray(valor)
    ? valor.map(item => texto(typeof item === "object" ? item.name : item)).filter(Boolean).slice(0, 20)
    : [];
}

const STOPWORDS = new Set(["mini", "com", "sem", "para", "de", "da", "do", "dos", "das", "especial", "artesanal", "natural", "integral", "acucar", "vegetariano", "vegano", "gluten"]);
const CONCEITOS_VISUAIS = [
  [/pao de alho/, "garlic bread"], [/cachorro quente/, "hot dog"], [/pizza/, "pizza"],
  [/brigadeiro/, "brigadeiro chocolate truffle"], [/mousse(?: de)? chocolate|mousse/, "chocolate mousse"],
  [/farofa/, "Brazilian farofa"], [/rabanada/, "French toast"], [/panetone/, "panettone"], [/feijoada/, "Brazilian feijoada"],
  [/sanduiche|sanduich/, "sandwich"], [/carpaccio/, "carpaccio"], [/alcaparra/, "capers"],
  [/espetinho/, "skewer"], [/queijo coalho/, "grilled cheese"], [/tartare/, "tartare"], [/vegetais?/, "vegetable"], [/barquete/, "tartlet"],
  [/tilapia/, "tilapia fish"], [/salmao/, "salmon"], [/carne bovina|picanha|alcatra|patinho/, "beef"], [/linguica/, "sausage"], [/frango|coxa|asa/, "chicken"],
  [/iogurte/, "yogurt"], [/pudim/, "flan pudding"], [/cocada/, "coconut candy"], [/tartelete|torta/, "tartlet"], [/bolo/, "cake"], [/trufa/, "chocolate truffle"],
  [/cafe/, "coffee"], [/agua mineral|agua com/, "mineral water"], [/suco de uva/, "grape juice"], [/suco de laranja/, "orange juice"],
  [/gengibre/, "ginger tea"], [/hibisco/, "hibiscus tea"], [/refrigerante.*cola|cola/, "cola soda"], [/guarana/, "guarana soda"],
  [/gin/, "gin cocktail"], [/whisky|uisque/, "whisky"], [/cerveja.*ipa/, "IPA beer"], [/cerveja.*pilsen/, "pilsner beer"], [/vinho/, "wine"]
];

const TERMOS_VISUAIS_GENERICOS = new Set(["food", "photography", "drink", "juice", "water", "main", "course", "dessert", "appetizer", "side", "dish"]);

function construirTermosAncora(prato) {
  const nome = normalizar(prato?.nome);
  return Array.from(new Set(CONCEITOS_VISUAIS
    .filter(([padrao]) => padrao.test(nome))
    .flatMap(([, traducao]) => traducao.split(" "))
    .map(normalizar)
    .filter(termo => termo.length >= 3 && !TERMOS_VISUAIS_GENERICOS.has(termo))
  )).slice(0, 8);
}

module.exports = {
  construirSolicitacoesImagem, criarImagemFallback, selecionarImagensLocais,
  validarImagem, validarDicionario, validarBibliotecaLocal, inferirSlot,
  construirConsultaPrato, construirTermosCorrespondencia, construirTermosAncora
};
