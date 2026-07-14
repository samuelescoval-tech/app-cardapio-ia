require("dotenv").config({ quiet: true });
const { construirSolicitacoesImagem } = require("../src/services/images/image-catalog.service");
const { criarOpenverseService } = require("../src/services/images/openverse.service");

async function main() {
  const service = criarOpenverseService({ limiteDiario: 2 });
  const [solicitacao] = construirSolicitacoesImagem({
    tipo: "Workshop corporativo de tecnologia",
    tema: "Tecnologia e inovacao",
    estilo: "Premium",
    refeicao: "Coffee break"
  }, []);
  let resultado = await service.buscar(solicitacao);
  if (!resultado.images.length) resultado = await service.buscar({ ...solicitacao, query: solicitacao.fallback_query });
  if (!resultado.images.length) throw new Error(`Openverse nao retornou imagem compativel: ${resultado.result_count || 0} encontrado(s), ${resultado.rejected_count || 0} rejeitado(s).`);
  const imagem = resultado.images[0];
  process.stdout.write(JSON.stringify({
    ok: true,
    query: resultado.query,
    id: imagem.id,
    provider: imagem.provider,
    license: imagem.license,
    creator: imagem.creator,
    source_url: imagem.source_url,
    has_https_image: imagem.image_url.startsWith("https://"),
    attribution: imagem.attribution,
    searches_remaining: resultado.searches_remaining
  }, null, 2));
  process.stdout.write("\n");
}

main().catch(error => {
  console.error(`FALHA: ${error.message}`);
  process.exitCode = 1;
});
