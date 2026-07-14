require("dotenv").config({ quiet: true });
const { construirSolicitacoesImagem } = require("../src/services/images/image-catalog.service");

const API_URL = "https://commons.wikimedia.org/w/api.php";
const cenarios = [
  { id: "debutante", tipo: "Aniversario de debutante", tema: "Festa de 15 anos elegante", estilo: "Elegante" },
  { id: "corporativo", tipo: "Workshop corporativo de tecnologia", tema: "Inovacao e networking", estilo: "Premium" },
  { id: "natal", tipo: "Ceia de Natal", tema: "Natal familiar brasileiro", estilo: "Elegante" },
  { id: "churrasco", tipo: "Churrasco de aniversario", tema: "Boteco brasileiro", estilo: "Simples" },
  { id: "infantil", tipo: "Festa infantil", tema: "Circo colorido", estilo: "Simples" }
];
const blocos = [
  { id: "principal", nome: "Pratos principais", categoria: "Prato Principal" },
  { id: "sobremesa", nome: "Doces e sobremesas", categoria: "Sobremesa" }
];

async function main() {
  const scenarios = [];
  for (const cenario of cenarios) {
    const solicitacoes = construirSolicitacoesImagem(cenario, blocos)
      .filter(item => ["capa", "principal", "sobremesa"].includes(item.slot));
    const resultados = [];
    for (const solicitacao of solicitacoes) {
      resultados.push(await consultarCommons(solicitacao));
      await esperar(220);
    }
    scenarios.push({ id: cenario.id, resultados });
  }

  const slots = scenarios.flatMap(cenario => cenario.resultados);
  process.stdout.write(`${JSON.stringify({
    generated_at: new Date().toISOString(),
    provider: "wikimedia-commons-probe",
    policy: "CC0, dominio publico ou CC BY; CC BY-SA permanece excluida",
    scenarios,
    summary: {
      scenarios: scenarios.length,
      slots: slots.length,
      slots_with_allowed_results: slots.filter(item => item.allowed_candidates > 0).length,
      empty_after_license_filter: slots.filter(item => item.allowed_candidates === 0).length,
      total_candidates: slots.reduce((total, item) => total + item.total_candidates, 0),
      allowed_candidates: slots.reduce((total, item) => total + item.allowed_candidates, 0)
    }
  }, null, 2)}\n`);
}

async function consultarCommons(solicitacao) {
  const url = new URL(API_URL);
  const parametros = {
    action: "query",
    generator: "search",
    gsrsearch: solicitacao.query,
    gsrnamespace: "6",
    gsrlimit: "6",
    prop: "imageinfo",
    iiprop: "url|mime|mediatype|extmetadata",
    iiurlwidth: "1200",
    format: "json",
    formatversion: "2",
    origin: "*"
  };
  Object.entries(parametros).forEach(([chave, valor]) => url.searchParams.set(chave, valor));

  try {
    const response = await consultarComRecuo(url);
    if (!response.ok) throw new Error(`HTTP ${response.status}`);
    const data = await response.json();
    const paginas = Array.isArray(data?.query?.pages) ? data.query.pages : [];
    const candidatos = paginas.map(normalizarCandidato).filter(Boolean);
    const permitidos = candidatos.filter(item => item.allowed);
    return {
      slot: solicitacao.slot,
      query: solicitacao.query,
      total_candidates: candidatos.length,
      allowed_candidates: permitidos.length,
      licenses_seen: [...new Set(candidatos.map(item => item.license))],
      images: permitidos.slice(0, 3).map(({ allowed, ...item }) => item)
    };
  } catch (error) {
    return { slot: solicitacao.slot, query: solicitacao.query, total_candidates: 0, allowed_candidates: 0, error: error.message, images: [] };
  }
}

function normalizarCandidato(pagina) {
  const info = pagina?.imageinfo?.[0];
  const meta = info?.extmetadata || {};
  if (!info?.thumburl || !info?.descriptionurl || !String(info.mime || "").startsWith("image/")) return null;
  const license = textoMeta(meta.LicenseShortName) || "nao informada";
  return {
    title: String(pagina.title || "").replace(/^File:/, ""),
    license,
    allowed: licencaPermitida(license),
    source_url: info.descriptionurl,
    thumbnail_url: info.thumburl
  };
}

async function consultarComRecuo(url, tentativa = 0) {
  const response = await fetch(url, {
    headers: { Accept: "application/json", "User-Agent": "ChefIAStudio/1.0 image-provider-evaluation" }
  });
  if (response.status === 429 && tentativa < 2) {
    const segundos = Math.min(Number(response.headers.get("retry-after")) || tentativa + 2, 8);
    await esperar(segundos * 1000);
    return consultarComRecuo(url, tentativa + 1);
  }
  return response;
}

function licencaPermitida(valor) {
  const licenca = String(valor || "").toLowerCase().replace(/\s+/g, " ").trim();
  if (/by-sa|share alike|noncommercial|\bnc\b|no derivatives|\bnd\b/.test(licenca)) return false;
  return licenca === "cc0" || licenca.includes("public domain") || /^cc by(?: |$)/.test(licenca);
}

function textoMeta(campo) {
  return typeof campo?.value === "string" ? campo.value.replace(/<[^>]*>/g, " ").replace(/\s+/g, " ").trim() : "";
}

function esperar(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

if (require.main === module) {
  main().catch(error => {
    console.error(`FALHA: ${error.message}`);
    process.exitCode = 1;
  });
}

module.exports = { licencaPermitida, normalizarCandidato, consultarComRecuo };
