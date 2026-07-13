const { obterDiretrizCulinaria } = require("./culinary-matrix.service");

const MAX_EVITAR = 20;
const QUALIFICADORES_DESCARTAVEIS = new Set([
  "especial", "especiais", "gourmet", "classico", "classica", "tradicional",
  "caseiro", "caseira", "artesanal", "premium", "delicioso", "deliciosa",
  "mini", "tematico", "tematica", "colorido", "colorida", "soltinho", "soltinha"
]);
const CONECTORES = new Set(["de", "da", "do", "das", "dos", "e", "com", "no", "na", "ao"]);
const BASES_CULINARIAS_FORTES = new Set([
  "pudim", "gelatina", "bolo", "pizza", "risoto", "lasanha", "brigadeiro",
  "quiche", "torta", "farofa", "vinagrete", "maionese", "pipoca"
]);

function criarContextoVariedade(evento, diretrizAtual, historico = []) {
  const perfilAtual = diretrizAtual.perfil;
  const refeicaoAtual = diretrizAtual.modificador_refeicao?.id || null;
  const temaAtual = diretrizAtual.modificador_tema?.id || null;

  const equivalentes = historico
    .map(entrada => ({ ...entrada, diretriz: obterDiretrizCulinaria(entrada.evento) }))
    .filter(entrada => entrada.diretriz.perfil === perfilAtual)
    .filter(entrada => !refeicaoAtual || entrada.diretriz.modificador_refeicao?.id === refeicaoAtual)
    .sort((a, b) => Number(b.diretriz.modificador_tema?.id === temaAtual) - Number(a.diretriz.modificador_tema?.id === temaAtual))
    .slice(0, 5);

  const pratos = new Map();
  equivalentes.forEach(entrada => entrada.pratos.forEach(prato => {
    const assinatura = normalizarAssinaturaPrato(prato.nome);
    if (!assinatura) return;
    const atual = pratos.get(assinatura) || { nome: prato.nome, categoria: prato.categoria, ocorrencias: 0, assinatura };
    atual.ocorrencias += 1;
    pratos.set(assinatura, atual);
  }));

  const essenciais = diretrizAtual.repeticoes_essenciais || [];
  const recentes = Array.from(pratos.values()).sort((a, b) => b.ocorrencias - a.ocorrencias || a.nome.localeCompare(b.nome));

  return {
    version: "2026-07-13-plan10",
    perfil: perfilAtual,
    refeicao: refeicaoAtual,
    tema: temaAtual,
    historicos_considerados: equivalentes.length,
    pratos_recentes_total: recentes.length,
    conceitos_essenciais: essenciais,
    evitar_repetir: recentes.filter(prato => !ehItemEssencial(prato, essenciais)).slice(0, MAX_EVITAR),
    repeticoes_essenciais: recentes.filter(prato => ehItemEssencial(prato, essenciais)),
    regra: "Trocar somente por alternativa equivalente da taxonomia; preservar identidade, restricoes, categorias e elementos essenciais."
  };
}

function avaliarVariedadePlano(plano, contexto) {
  const recentes = [
    ...(contexto.evitar_repetir || []),
    ...(contexto.repeticoes_essenciais || [])
  ];
  const essenciais = new Set((contexto.repeticoes_essenciais || []).map(prato => prato.assinatura));
  const conceitosEssenciais = contexto.conceitos_essenciais || [];
  const justificadas = [];
  const revisar = [];
  let novos = 0;

  (plano.cardapio || []).forEach(prato => {
    const assinatura = normalizarAssinaturaPrato(prato.nome);
    const anterior = encontrarPratoSemelhante(assinatura, recentes);
    if (!anterior) {
      novos += 1;
      return;
    }
    const item = { nome: prato.nome, categoria: prato.categoria, ocorrencias_anteriores: anterior.ocorrencias };
    if (essenciais.has(anterior.assinatura) || ehItemEssencial({ ...prato, assinatura }, conceitosEssenciais)) {
      justificadas.push({ ...item, motivo: chaveCategoria(prato.categoria) === "bebida" ? "bebida basica de servico" : "elemento essencial do perfil" });
    }
    else revisar.push({ ...item, motivo: "alternativa equivalente nao aplicada" });
  });

  const semHistorico = contexto.historicos_considerados === 0;
  return {
    version: contexto.version,
    status: semHistorico ? "sem_historico" : revisar.length ? "revisar" : "variado",
    historicos_considerados: contexto.historicos_considerados,
    pratos_recentes_considerados: contexto.pratos_recentes_total,
    pratos_novos: novos,
    repeticoes_justificadas: justificadas,
    repeticoes_a_revisar: revisar
  };
}

function normalizarAssinaturaPrato(valor) {
  return String(valor || "")
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .replace(/\bda casa\b/g, " ")
    .replace(/[^a-z0-9]+/g, " ")
    .split(" ")
    .filter(Boolean)
    .map(normalizarTokenCulinario)
    .filter(palavra => !CONECTORES.has(palavra))
    .filter(palavra => !QUALIFICADORES_DESCARTAVEIS.has(palavra))
    .join(" ")
    .trim();
}

function normalizarTokenCulinario(palavra) {
  if (palavra === "paes") return "pao";
  if (palavra === "hummus") return palavra;
  if (palavra.length > 5 && palavra.endsWith("oes")) return `${palavra.slice(0, -3)}ao`;
  if (palavra.length > 5 && palavra.endsWith("aes")) return `${palavra.slice(0, -3)}ao`;
  if (palavra.length > 5 && palavra.endsWith("ais")) return `${palavra.slice(0, -3)}al`;
  if (palavra.length > 4 && palavra.endsWith("s")) return palavra.slice(0, -1);
  return palavra;
}

function encontrarPratoSemelhante(assinatura, recentes) {
  return recentes.find(prato => prato.assinatura === assinatura)
    || recentes.find(prato => saoPratosSemelhantes(assinatura, prato.assinatura));
}

function saoPratosSemelhantes(primeiro, segundo) {
  const a = normalizarAssinaturaPrato(primeiro).split(" ").filter(Boolean);
  const b = normalizarAssinaturaPrato(segundo).split(" ").filter(Boolean);
  if (!a.length || !b.length) return false;
  const intersecao = a.filter(token => b.includes(token)).length;
  const coberturaMenor = intersecao / Math.min(a.length, b.length);
  if (coberturaMenor >= 0.75) return true;
  return a[0] === b[0] && BASES_CULINARIAS_FORTES.has(a[0]);
}

function ehItemEssencial(prato, conceitos) {
  return chaveCategoria(prato.categoria) === "bebida" || ehRepeticaoEssencial(prato.assinatura, conceitos);
}

function chaveCategoria(valor) {
  return normalizarAssinaturaPrato(valor);
}

function ehRepeticaoEssencial(assinatura, conceitos) {
  return conceitos.some(conceito => {
    const essencial = normalizarAssinaturaPrato(conceito);
    return assinatura === essencial || assinatura.includes(essencial) || essencial.includes(assinatura);
  });
}

module.exports = {
  criarContextoVariedade,
  avaliarVariedadePlano,
  normalizarAssinaturaPrato,
  ehRepeticaoEssencial,
  saoPratosSemelhantes
};
