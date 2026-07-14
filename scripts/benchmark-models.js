require("dotenv").config({ quiet: true });
const fs = require("node:fs");
const path = require("node:path");
const catalogo = require("../data/benchmarks/model-comparison.json");
const { criarGeminiService } = require("../src/services/ai/gemini.service");
const { avaliarResultadoBenchmark } = require("../src/services/ai/model-benchmark.service");
const { obterDiretrizCulinaria } = require("../src/services/planning/culinary-matrix.service");
const { calcularMotorEvento, aplicarMotorAoPlano } = require("../src/services/planning/motor.service");
const { montarPromptPlanejamento } = require("../src/prompts/event.prompt");

const argumentos = process.argv.slice(2);
const dryRun = argumentos.includes("--dry-run");
const full = argumentos.includes("--full");
const modelos = obterLista("--models") || obterModelosPadrao();
const idsSolicitados = obterLista("--scenarios");
const outputSolicitado = obterValor("--output");

async function main() {
  const cenarios = selecionarCenarios(idsSolicitados, full);
  validarConfiguracao(cenarios, modelos);

  const manifesto = {
    benchmark_version: catalogo.version,
    generated_at: new Date().toISOString(),
    mode: dryRun ? "dry-run" : full ? "full" : "quick",
    models: modelos,
    scenarios: cenarios.map(item => item.id)
  };

  if (dryRun) {
    process.stdout.write(`${JSON.stringify(manifesto, null, 2)}\n`);
    return;
  }

  const resultados = [];
  const total = modelos.length * cenarios.length;
  let atual = 0;
  for (const modelo of modelos) {
    const service = criarGeminiService({ modelName: modelo });
    if (!service.getGeminiStatus().configured) {
      throw new Error("GEMINI_API_KEY ou GOOGLE_API_KEY nao configurada.");
    }

    for (const cenario of cenarios) {
      atual += 1;
      process.stdout.write(`[${atual}/${total}] ${modelo} | ${cenario.id}: gerando...\n`);
      const evento = completarLocalizacao(cenario.evento);
      const diretriz = obterDiretrizCulinaria(evento);
      const motor = calcularMotorEvento(evento, diretriz);
      const prompt = montarPromptPlanejamento(evento, motor, diretriz);
      const resposta = await service.gerarPlano(prompt, { diretrizCulinaria: diretriz, evento });
      if (resposta.plano) resposta.plano = aplicarMotorAoPlano(resposta.plano, motor);
      const avaliacao = avaliarResultadoBenchmark({
        resposta,
        diretriz,
        expectativas: cenario.expectations
      });
      resultados.push({
        scenario: cenario.id,
        requested_model: modelo,
        ok: resposta.ok === true,
        ...avaliacao
      });
      process.stdout.write(
        `[${atual}/${total}] ${modelo} | ${cenario.id}: ` +
        `${avaliacao.pontuacao_tecnica}/100, ${avaliacao.metricas.itens_cardapio} itens, ` +
        `${formatarTempo(avaliacao.metricas.tempo_ms)}\n`
      );
    }
  }

  const relatorio = {
    ...manifesto,
    summary: resumirPorModelo(resultados),
    results: resultados
  };
  const output = outputSolicitado
    ? path.resolve(outputSolicitado)
    : `/tmp/chef-ia-model-benchmark-${Date.now()}.json`;
  fs.writeFileSync(output, JSON.stringify(relatorio, null, 2));
  process.stdout.write(`RESUMO ${output}\n`);
  imprimirComparacao(relatorio.summary);
  if (resultados.some(item => !item.ok)) process.exitCode = 1;
}

function selecionarCenarios(ids, usarTodos) {
  if (!ids?.length) return catalogo.scenarios.filter(item => usarTodos || item.quick);
  return ids.map(id => {
    const encontrado = catalogo.scenarios.find(item => item.id === id);
    if (!encontrado) throw new Error(`Cenario desconhecido: ${id}`);
    return encontrado;
  });
}

function validarConfiguracao(cenarios, listaModelos) {
  if (!cenarios.length) throw new Error("Nenhum cenario selecionado.");
  if (listaModelos.length < 1) throw new Error("Nenhum modelo selecionado.");
  if (new Set(listaModelos).size !== listaModelos.length) throw new Error("A lista de modelos contem duplicatas.");
}

function obterModelosPadrao() {
  const atual = process.env.GEMINI_MODEL || "gemini-flash-lite-latest";
  return Array.from(new Set([atual, "gemini-3.5-flash"]));
}

function obterLista(nome) {
  const valor = obterValor(nome);
  return valor ? valor.split(",").map(item => item.trim()).filter(Boolean) : null;
}

function obterValor(nome) {
  const prefixo = `${nome}=`;
  const argumento = argumentos.find(item => item.startsWith(prefixo));
  return argumento ? argumento.slice(prefixo.length).trim() : null;
}

function completarLocalizacao(evento) {
  return {
    pais: "Brasil",
    estado: "Sao Paulo",
    cidade: "Campinas",
    ...evento
  };
}

function resumirPorModelo(resultados) {
  const grupos = new Map();
  resultados.forEach(item => {
    const lista = grupos.get(item.requested_model) || [];
    lista.push(item);
    grupos.set(item.requested_model, lista);
  });
  return Array.from(grupos, ([model, itens]) => ({
    model,
    executions: itens.length,
    successful: itens.filter(item => item.ok).length,
    average_technical_score: media(itens.map(item => item.pontuacao_tecnica)),
    average_time_ms: media(itens.map(item => item.metricas.tempo_ms).filter(Number.isFinite)),
    average_total_tokens: media(itens.map(item => item.metricas.total_tokens).filter(Number.isFinite)),
    average_expectation_coverage: media(itens.map(item => item.metricas.expectativas.razao)),
    total_warnings: itens.reduce((total, item) => total + item.metricas.avisos, 0)
  })).sort((a, b) => b.average_technical_score - a.average_technical_score);
}

function imprimirComparacao(resumo) {
  process.stdout.write("COMPARACAO\n");
  resumo.forEach(item => {
    process.stdout.write(
      `- ${item.model}: ${item.average_technical_score}/100, ` +
      `${item.successful}/${item.executions} concluidas, ` +
      `${formatarTempo(item.average_time_ms)}, ${item.average_total_tokens} tokens medios\n`
    );
  });
}

function media(valores) {
  if (!valores.length) return null;
  return Math.round(valores.reduce((total, valor) => total + valor, 0) / valores.length * 1000) / 1000;
}

function formatarTempo(ms) {
  return Number.isFinite(ms) ? `${(ms / 1000).toFixed(1)}s` : "tempo indisponivel";
}

main().catch(error => {
  console.error(`FALHA: ${error.message}`);
  process.exitCode = 1;
});
