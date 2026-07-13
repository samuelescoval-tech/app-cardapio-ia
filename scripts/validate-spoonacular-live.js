const { criarSpoonacularService } = require("../src/services/recipes/spoonacular.service");

require("dotenv").config({ quiet: true });

const query = process.argv.slice(2).join(" ").trim() || "risoto de cogumelos";

async function main() {
  if (!process.env.SPOONACULAR_API_KEY?.trim()) {
    throw new Error("SPOONACULAR_API_KEY nao esta configurada no .env deste ambiente.");
  }

  const service = criarSpoonacularService();
  const statusAntes = service.getStatus();
  const resultado = await service.buscarReferencias(query);

  validarContrato(resultado);

  process.stdout.write(`${JSON.stringify({
    ok: true,
    query: resultado.query,
    mode: resultado.mode,
    persistence: resultado.persistence,
    references: resultado.references.map(referencia => ({
      id: referencia.id,
      title: referencia.title,
      source_name: referencia.source_name,
      source_url: referencia.source_url
    })),
    attribution: resultado.attribution,
    quota: resultado.quota,
    local_searches_remaining: resultado.searches_remaining,
    limits: {
      max_results_per_search: statusAntes.max_results_per_search,
      daily_search_limit: statusAntes.daily_search_limit
    }
  }, null, 2)}\n`);
}

function validarContrato(resultado) {
  if (resultado.mode !== "transient_references" || resultado.persistence !== false) {
    throw new Error("A resposta nao preservou o modo transitorio sem persistencia.");
  }
  if (!Array.isArray(resultado.references) || resultado.references.length > 3) {
    throw new Error("A resposta ultrapassou o limite de tres referencias.");
  }
  if (!resultado.attribution) {
    throw new Error("A atribuicao obrigatoria nao foi retornada.");
  }

  const camposPermitidos = new Set([
    "id",
    "title",
    "image_url",
    "source_name",
    "source_url",
    "ready_in_minutes",
    "servings"
  ]);

  for (const referencia of resultado.references) {
    const campoProibido = Object.keys(referencia).find(campo => !camposPermitidos.has(campo));
    if (campoProibido) {
      throw new Error(`Campo nao permitido retornado: ${campoProibido}.`);
    }
    if (!referencia.source_url?.startsWith("https://")) {
      throw new Error("Uma referencia foi retornada sem fonte HTTPS valida.");
    }
  }
}

main().catch(error => {
  console.error(`FALHA: ${error.message}`);
  process.exitCode = 1;
});
