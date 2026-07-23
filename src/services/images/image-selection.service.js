const { construirSolicitacoesImagem, selecionarImagensLocais } = require("./image-catalog.service");

function criarImageSelectionService(opcoes = {}) {
  const openverseService = opcoes.openverseService;
  async function selecionarParaEvento(evento, pratos = []) {
    const solicitacoes = construirSolicitacoesImagem(evento, pratos);
    const imagens = [];
    const alternativas = {};
    const avisos = [];
    const usados = new Set();
    for (const solicitacao of solicitacoes) {
      const locais = selecionarImagensLocais(solicitacao);
      const localExata = locais.find(imagem => imagem.match_type === "dish-family" && !usados.has(chaveImagem(imagem)));
      if (localExata) {
        imagens.push(localExata);
        usados.add(chaveImagem(localExata));
        alternativas[solicitacao.target_id] = locais.filter(imagem => imagem.id !== localExata.id);
        continue;
      }
      try {
        const resultado = await openverseService.buscar(solicitacao);
        const candidatos = resultado.images
          .filter(imagem => !usados.has(chaveImagem(imagem)))
          .map(imagem => ({ ...imagem, target_id: solicitacao.target_id, relevance_score: pontuarRelevancia(imagem, solicitacao) }))
          .filter(imagem => imagem.relevance_score >= 1 && temAncoraVisual(imagem, solicitacao))
          .sort((a, b) => b.relevance_score - a.relevance_score);
        const escolhida = candidatos[0];
        if (escolhida) {
          imagens.push(escolhida);
          usados.add(chaveImagem(escolhida));
          alternativas[solicitacao.target_id] = [
            ...candidatos.slice(1, 3).filter(imagem => !usados.has(chaveImagem(imagem))),
            ...locais.slice(0, 1)
          ];
        } else {
          usarImagemLocalDeCategoria(solicitacao, locais, imagens, alternativas, avisos, usados);
        }
      } catch (error) {
        usarImagemLocalDeCategoria(solicitacao, locais, imagens, alternativas, avisos, usados, error.message);
      }
    }
    const locaisTotal = imagens.filter(imagem => imagem.provider === "local").length;
    const cobertura = criarCoberturaVisual(solicitacoes.length, imagens);
    return {
      version: "1.1.0", provider: locaisTotal === imagens.length ? "local" : "local+openverse", persistence: false,
      context_id: solicitacoes[0]?.context_id || "evento-geral",
      style_id: solicitacoes[0]?.style_id || "sem-modificador", requested_targets: solicitacoes.length,
      images: imagens, alternatives: alternativas, warnings: avisos,
      local_images: locaisTotal,
      external_images: imagens.length - locaisTotal,
      coverage: cobertura,
      attribution_notice: "A biblioteca Chef IA e usada primeiro para familias conhecidas. Referencias externas exigem correspondencia minima; origem e tipo de imagem acompanham cada item."
    };
  }
  return { selecionarParaEvento };
}

function criarCoberturaVisual(solicitados, imagens) {
  const familiaLocal = imagens.filter(imagem => imagem.provider === "local" && imagem.match_type === "dish-family").length;
  const categoriaLocal = imagens.filter(imagem => imagem.provider === "local" && imagem.match_type === "category").length;
  const externas = imagens.filter(imagem => imagem.provider === "openverse").length;
  const exibidas = imagens.length;
  const ausentes = Math.max(0, solicitados - exibidas);
  return {
    requested: solicitados,
    displayed: exibidas,
    local_family: familiaLocal,
    local_category: categoriaLocal,
    external: externas,
    missing: ausentes,
    status: ausentes ? "incomplete" : categoriaLocal || externas ? "review" : "controlled"
  };
}

function usarImagemLocalDeCategoria(solicitacao, locais, imagens, alternativas, avisos, usados, motivoExterno = "") {
  const local = locais.find(imagem => imagem.match_type === "category" && !usados.has(chaveImagem(imagem)))
    || locais.find(imagem => imagem.match_type === "category")
    || locais.find(imagem => !usados.has(chaveImagem(imagem)))
    || locais[0];
  if (!local) {
    avisos.push(`${solicitacao.nome}: sem imagem local ou externa confiavel.`);
    return;
  }
  imagens.push(local);
  usados.add(chaveImagem(local));
  alternativas[solicitacao.target_id] = locais.filter(imagem => imagem.id !== local.id);
  const tipo = local.match_type === "category" ? "imagem de categoria usada" : "ilustracao da familia reutilizada";
  avisos.push(`${solicitacao.nome}: ${tipo}${motivoExterno ? ` porque ${motivoExterno}` : ""}.`);
}

function pontuarRelevancia(imagem, solicitacao) {
  const metadados = normalizar([
    imagem?.alt,
    imagem?.attribution,
    ...(Array.isArray(imagem?.tags) ? imagem.tags : [])
  ].filter(Boolean).join(" "));
  if (!metadados) return 0;
  const termos = Array.isArray(solicitacao?.match_terms) ? solicitacao.match_terms : [];
  return termos.reduce((total, termo) => total + (metadados.includes(normalizar(termo)) ? 1 : 0), 0);
}

function temAncoraVisual(imagem, solicitacao) {
  const ancoras = Array.isArray(solicitacao?.anchor_terms) ? solicitacao.anchor_terms.map(normalizar).filter(Boolean) : [];
  if (!ancoras.length) return false;
  const titulo = normalizar(imagem?.alt);
  if (!titulo || !ancoras.some(termo => titulo.includes(termo))) return false;
  if (ancoras.length >= 2) return true;
  const contexto = TERMOS_APRESENTACAO[solicitacao?.slot] || [];
  return contexto.some(termo => titulo.includes(termo));
}

function normalizar(valor) {
  return String(valor || "").normalize("NFD").replace(/[\u0300-\u036f]/g, "").toLowerCase();
}

function chaveImagem(imagem) {
  return String(imagem?.source_url || imagem?.id || "").trim();
}

const TERMOS_APRESENTACAO = {
  bebida: ["juice", "drink", "beverage", "cocktail", "glass", "coffee", "tea", "wine", "beer", "water", "soda"],
  sobremesa: ["dessert", "cake", "pudding", "mousse", "sweet", "pastry", "tart", "truffle", "flan"],
  entrada: ["appetizer", "canape", "sandwich", "tartare", "skewer", "bread", "pizza", "hot dog"],
  principal: ["main course", "plate", "steak", "fish", "chicken", "pasta", "risotto", "meal"],
  acompanhamento: ["side dish", "rice", "salad", "vegetable", "farofa"],
  salada: ["salad", "leaves", "vegetable"]
};

module.exports = { criarImageSelectionService, criarCoberturaVisual, chaveImagem, pontuarRelevancia, temAncoraVisual };
