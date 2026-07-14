const { construirSolicitacoesImagem, criarImagemFallback } = require("./image-catalog.service");

function criarImageSelectionService(opcoes = {}) {
  const openverseService = opcoes.openverseService;
  async function selecionarParaEvento(evento, blocos = []) {
    const solicitacoes = construirSolicitacoesImagem(evento, blocos);
    const imagens = [];
    const avisos = [];
    for (const solicitacao of solicitacoes) {
      try {
        let resultado = await openverseService.buscar(solicitacao);
        if (!resultado.images.length && solicitacao.fallback_query && solicitacao.fallback_query !== solicitacao.query) {
          resultado = await openverseService.buscar({ ...solicitacao, query: solicitacao.fallback_query });
        }
        imagens.push(resultado.images[0] || criarImagemFallback(solicitacao));
        if (!resultado.images.length) avisos.push(`Sem imagem externa adequada para ${solicitacao.nome}.`);
      } catch (error) {
        imagens.push(criarImagemFallback(solicitacao));
        avisos.push(`${solicitacao.nome}: ${error.message}`);
      }
    }
    return {
      version: "1.0.0", provider: "openverse", persistence: false,
      context_id: solicitacoes[0]?.context_id || "evento-geral",
      style_id: solicitacoes[0]?.style_id || "sem-modificador",
      images: imagens, warnings: avisos,
      attribution_notice: "Creditos e licencas devem acompanhar cada imagem no aplicativo e no PDF."
    };
  }
  return { selecionarParaEvento };
}

module.exports = { criarImageSelectionService };
