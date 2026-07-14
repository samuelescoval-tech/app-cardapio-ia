require("dotenv").config({ quiet: true });
const fs = require("node:fs");
const catalogo = require("../data/benchmarks/model-comparison.json");
const { criarGeminiService } = require("../src/services/ai/gemini.service");
const { gerarPlanoEmBlocos } = require("../src/services/ai/split-planning.service");
const { avaliarResultadoBenchmark } = require("../src/services/ai/model-benchmark.service");
const { obterDiretrizCulinaria } = require("../src/services/planning/culinary-matrix.service");
const { calcularMotorEvento, aplicarMotorAoPlano } = require("../src/services/planning/motor.service");

const args = process.argv.slice(2);
const dryRun = args.includes("--dry-run");
const menuModel = valor("--menu-model") || "gemini-3.5-flash";
const detailModel = valor("--detail-model") || process.env.GEMINI_MODEL || "gemini-flash-lite-latest";
const ids = (valor("--scenarios") || "debutante").split(",").map(item => item.trim()).filter(Boolean);

async function main() {
  const cenarios = ids.map(id => {
    const cenario = catalogo.scenarios.find(item => item.id === id);
    if (!cenario) throw new Error(`Cenario desconhecido: ${id}`);
    return cenario;
  });
  if (dryRun) {
    console.log(JSON.stringify({ mode: "split", menu_model: menuModel, detail_model: detailModel, scenarios: ids }, null, 2));
    return;
  }

  const menuService = criarGeminiService({ modelName: menuModel, temperature: 0.5 });
  const detailService = criarGeminiService({ modelName: detailModel, temperature: 0.4 });
  const results = [];
  for (let index = 0; index < cenarios.length; index += 1) {
    const cenario = cenarios[index];
    const evento = { pais: "Brasil", estado: "Sao Paulo", cidade: "Campinas", ...cenario.evento };
    const diretriz = obterDiretrizCulinaria(evento);
    const motor = calcularMotorEvento(evento, diretriz);
    process.stdout.write(`[${index + 1}/${cenarios.length}] split | ${cenario.id}: gerando...\n`);
    const resposta = await gerarPlanoEmBlocos({ evento, motor, diretriz, menuService, detailService });
    if (resposta.plano) resposta.plano = aplicarMotorAoPlano(resposta.plano, motor);
    const avaliacao = avaliarResultadoBenchmark({ resposta, diretriz, expectativas: cenario.expectations });
    results.push({ scenario: cenario.id, menu_model: menuModel, detail_model: detailModel, ok: resposta.ok, generation_meta: resposta.meta, ...avaliacao });
    process.stdout.write(`[${index + 1}/${cenarios.length}] split | ${cenario.id}: ${avaliacao.pontuacao_tecnica}/100, ${(avaliacao.metricas.tempo_ms / 1000).toFixed(1)}s\n`);
  }

  const output = `/tmp/chef-ia-split-benchmark-${Date.now()}.json`;
  fs.writeFileSync(output, JSON.stringify({ generated_at: new Date().toISOString(), menu_model: menuModel, detail_model: detailModel, results }, null, 2));
  process.stdout.write(`RESUMO ${output}\n`);
  if (results.some(item => !item.ok)) process.exitCode = 1;
}

function valor(nome) {
  const prefixo = `${nome}=`;
  const encontrado = args.find(item => item.startsWith(prefixo));
  return encontrado ? encontrado.slice(prefixo.length) : null;
}

main().catch(error => {
  console.error(`FALHA: ${error.message}`);
  process.exitCode = 1;
});
