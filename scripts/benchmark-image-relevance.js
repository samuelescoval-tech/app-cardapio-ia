require("dotenv").config({ quiet: true });
const { construirSolicitacoesImagem } = require("../src/services/images/image-catalog.service");
const { criarOpenverseService } = require("../src/services/images/openverse.service");

const cenarios = [
  { id: "debutante", tipo: "Aniversario de debutante", tema: "Festa de 15 anos elegante", estilo: "Elegante", refeicao: "Almoco com churrasco" },
  { id: "corporativo", tipo: "Workshop corporativo de tecnologia", tema: "Inovacao e networking", estilo: "Premium", refeicao: "Coffee break" },
  { id: "natal", tipo: "Ceia de Natal", tema: "Natal familiar brasileiro", estilo: "Elegante", refeicao: "Jantar" },
  { id: "churrasco", tipo: "Churrasco de aniversario", tema: "Boteco brasileiro", estilo: "Simples", refeicao: "Churrasco" },
  { id: "infantil", tipo: "Festa infantil", tema: "Circo colorido", estilo: "Simples", refeicao: "Coquetel" }
];

const blocos = [
  { id: "principal", nome: "Pratos principais", categoria: "Prato Principal" },
  { id: "sobremesa", nome: "Doces e sobremesas", categoria: "Sobremesa" },
  { id: "bebida", nome: "Bebidas", categoria: "Bebida" }
];

async function main() {
  const service = criarOpenverseService({ limiteDiario: 40 });
  const resumo = [];

  for (const cenario of cenarios) {
    const solicitacoes = construirSolicitacoesImagem(cenario, blocos)
      .filter(item => ["capa", "principal", "sobremesa"].includes(item.slot));
    const resultados = [];

    for (const solicitacao of solicitacoes) {
      resultados.push(await consultarSlot(service, solicitacao));
      await esperar(180);
    }
    resumo.push({ id: cenario.id, context_id: solicitacoes[0]?.context_id, resultados });
  }

  const totais = resumo.flatMap(item => item.resultados);
  process.stdout.write(`${JSON.stringify({
    generated_at: new Date().toISOString(),
    provider: "openverse",
    scenarios: resumo,
    summary: {
      scenarios: resumo.length,
      slots: totais.length,
      contextual_results: totais.filter(item => item.strategy === "contextual" && item.candidates > 0).length,
      generic_fallback_results: totais.filter(item => item.strategy === "generic-fallback" && item.candidates > 0).length,
      empty_or_error: totais.filter(item => item.candidates === 0).length
    }
  }, null, 2)}\n`);
}

async function consultarSlot(service, solicitacao) {
  try {
    let resultado = await service.buscar(solicitacao);
    let strategy = "contextual";
    if (!resultado.images.length && solicitacao.fallback_query !== solicitacao.query) {
      resultado = await service.buscar({ ...solicitacao, query: solicitacao.fallback_query });
      strategy = "generic-fallback";
    }
    return {
      slot: solicitacao.slot,
      contextual_query: solicitacao.query,
      effective_query: resultado.query,
      strategy,
      candidates: resultado.images.length,
      result_count: resultado.result_count,
      rejected_count: resultado.rejected_count,
      images: resultado.images.slice(0, 3).map(imagem => ({
        id: imagem.id,
        alt: imagem.alt,
        creator: imagem.creator,
        license: imagem.license,
        source_url: imagem.source_url
      }))
    };
  } catch (error) {
    return {
      slot: solicitacao.slot,
      contextual_query: solicitacao.query,
      effective_query: null,
      strategy: "error",
      candidates: 0,
      error: error.message
    };
  }
}

function esperar(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

main().catch(error => {
  console.error(`FALHA: ${error.message}`);
  process.exitCode = 1;
});

