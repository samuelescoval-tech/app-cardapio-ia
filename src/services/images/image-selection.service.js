const { construirSolicitacoesImagem } = require("./image-catalog.service");

function criarImageSelectionService(opcoes = {}) {
  const openverseService = opcoes.openverseService;
  async function selecionarParaEvento(evento, pratos = []) {
    const solicitacoes = construirSolicitacoesImagem(evento, pratos);
    const imagens = [];
    const alternativas = {};
    const avisos = [];
    const usados = new Set();
    for (const solicitacao of solicitacoes) {
      try {
        const resultado = await openverseService.buscar(solicitacao);
        const candidatos = resultado.images
          .filter(imagem => !usados.has(chaveImagem(imagem)))
          .map(imagem => ({ ...imagem, target_id: solicitacao.target_id, relevance_score: pontuarRelevancia(imagem, solicitacao) }))
          .filter(imagem => imagem.relevance_score >= 1)
          .sort((a, b) => b.relevance_score - a.relevance_score);
        const escolhida = candidatos[0];
        if (escolhida) {
          imagens.push(escolhida);
          usados.add(chaveImagem(escolhida));
          alternativas[solicitacao.target_id] = candidatos.slice(1, 4).filter(imagem => !usados.has(chaveImagem(imagem)));
        } else {
          avisos.push(`Sem fotografia suficientemente relacionada a ${solicitacao.nome}; o cartao usara identificacao visual neutra.`);
        }
      } catch (error) {
        avisos.push(`${solicitacao.nome}: ${error.message}`);
      }
    }
    return {
      version: "1.0.0", provider: "openverse", persistence: false,
      context_id: solicitacoes[0]?.context_id || "evento-geral",
      style_id: solicitacoes[0]?.style_id || "sem-modificador", requested_targets: solicitacoes.length,
      images: imagens, alternatives: alternativas, warnings: avisos,
      attribution_notice: "Somente fotografias com correspondencia minima ao nome do prato sao exibidas. Creditos e licencas acompanham cada imagem; as referencias nao sao salvas no historico nem no PDF."
    };
  }
  return { selecionarParaEvento };
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

function normalizar(valor) {
  return String(valor || "").normalize("NFD").replace(/[\u0300-\u036f]/g, "").toLowerCase();
}

function chaveImagem(imagem) {
  return String(imagem?.source_url || imagem?.id || "").trim();
}

module.exports = { criarImageSelectionService, chaveImagem, pontuarRelevancia };
