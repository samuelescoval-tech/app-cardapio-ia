const { construirSolicitacoesImagem, criarImagemFallback } = require("./image-catalog.service");

function criarImageSelectionService(opcoes = {}) {
  const openverseService = opcoes.openverseService;
  async function selecionarParaEvento(evento, blocos = []) {
    const solicitacoes = construirSolicitacoesImagem(evento, blocos);
    const imagens = [];
    const alternativas = {};
    const avisos = [];
    const usados = new Set();
    for (const solicitacao of solicitacoes) {
      try {
        let resultado = await openverseService.buscar(solicitacao);
        if (!resultado.images.length && solicitacao.fallback_query && solicitacao.fallback_query !== solicitacao.query) {
          resultado = await openverseService.buscar({ ...solicitacao, query: solicitacao.fallback_query });
        }
        const candidatos = resultado.images.filter(imagem => !usados.has(chaveImagem(imagem)));
        const escolhida = candidatos[0];
        if (escolhida) {
          imagens.push(escolhida);
          usados.add(chaveImagem(escolhida));
          alternativas[solicitacao.slot] = candidatos.slice(1, 4);
        } else {
          imagens.push(criarImagemFallback(solicitacao));
          avisos.push(resultado.images.length
            ? `Resultados repetidos foram evitados para ${solicitacao.nome}.`
            : `Sem imagem externa adequada para ${solicitacao.nome}.`);
        }
      } catch (error) {
        imagens.push(criarImagemFallback(solicitacao));
        avisos.push(`${solicitacao.nome}: ${error.message}`);
      }
    }
    return {
      version: "1.0.0", provider: "openverse", persistence: false,
      context_id: solicitacoes[0]?.context_id || "evento-geral",
      style_id: solicitacoes[0]?.style_id || "sem-modificador",
      images: imagens, alternatives: alternativas, warnings: avisos,
      attribution_notice: "Creditos e licencas acompanham cada imagem no aplicativo. As referencias nao sao salvas no historico nem no PDF."
    };
  }
  return { selecionarParaEvento };
}

function chaveImagem(imagem) {
  return String(imagem?.source_url || imagem?.id || "").trim();
}

module.exports = { criarImageSelectionService, chaveImagem };
