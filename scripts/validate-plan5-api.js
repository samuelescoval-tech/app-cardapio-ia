require("dotenv").config({ quiet: true });
const fs = require("node:fs");
const { calcularMotorEvento } = require("../src/services/planning/motor.service");
const { obterDiretrizCulinaria } = require("../src/services/planning/culinary-matrix.service");
const { montarPromptPlanejamento } = require("../src/prompts/event.prompt");
const { gerarPlano } = require("../src/services/ai/gemini.service");

const scenarios = [
  { id: "domiciliar", tipo: "Atendimento domiciliar", pessoas: 5, criancas: 0, duracao: 1, refeicao: "Brunch / cafe da manha", restricoes: "Nenhuma", tema: "Familiar", alcool: "Com alcool moderado", estilo: "Elegante", obs: "Entrada antes do prato principal e sobremesa para finalizar" },
  { id: "casamento", tipo: "Casamento", pessoas: 100, criancas: 15, duracao: 6, refeicao: "Almoco ou jantar", restricoes: "Uma opcao vegetariana", tema: "Tropical elegante", alcool: "Com bar completo", estilo: "Elegante", obs: "Recepcao, jantar e mesa de sobremesas" },
  { id: "churrasco", tipo: "Churrasco de aniversario", pessoas: 50, criancas: 10, duracao: 5, refeicao: "Churrasco", restricoes: "Uma opcao vegetariana na grelha", tema: "Boteco brasileiro", alcool: "Com alcool moderado", estilo: "Simples", obs: "Servico informal com acompanhamentos variados" },
  { id: "infantil", tipo: "Festa infantil", pessoas: 30, criancas: 20, duracao: 4, refeicao: "Coquetel / Finger food", restricoes: "Evitar amendoim", tema: "Circo colorido", alcool: "Sem alcool", estilo: "Simples", obs: "Comidas faceis de servir e opcoes frescas" },
  { id: "corporativo", tipo: "Evento corporativo", pessoas: 40, criancas: 0, duracao: 3, refeicao: "Coffee break", restricoes: "Opcao vegana e opcao sem lactose", tema: "Profissional contemporaneo", alcool: "Sem alcool", estilo: "Premium", obs: "Networking pela manha com servico silencioso" }
].map(evento => ({ ...evento, pais: "Brasil", estado: "Sao Paulo", cidade: "Campinas" }));

async function main() {
  const results = [];
  for (let index = 0; index < scenarios.length; index += 1) {
    const evento = scenarios[index];
    process.stdout.write(`[${index + 1}/5] ${evento.id}: gerando...\n`);
    const diretrizCulinaria = obterDiretrizCulinaria(evento);
    const resposta = await gerarPlano(
      montarPromptPlanejamento(evento, calcularMotorEvento(evento), diretrizCulinaria),
      { diretrizCulinaria, evento }
    );
    const plano = resposta.plano;
    const qualidade = plano.qualidade_culinaria || {};
    const result = {
      id: evento.id,
      ok: resposta.ok,
      schema_ok: resposta.meta?.schema_ok === true,
      status: qualidade.status || "falha",
      cardapio: plano.cardapio?.length || 0,
      receitas: plano.receitas?.length || 0,
      compras: plano.lista_compras?.length || 0,
      receitas_cobertas: qualidade.cobertura?.receitas_cobertas || 0,
      pratos_com_preparo: qualidade.cobertura?.pratos_com_preparo || 0,
      ingredientes_cobertos: qualidade.cobertura?.ingredientes_cobertos || 0,
      ingredientes_total: qualidade.cobertura?.ingredientes_total || 0,
      avisos: qualidade.avisos || [],
      erro: resposta.meta?.erro || null
    };
    results.push(result);
    process.stdout.write(`[${index + 1}/5] ${evento.id}: ${result.ok ? "OK" : "FALHA"} — ${result.cardapio} pratos, ${result.receitas} receitas, ${result.compras} compras, ${result.status}\n`);
    if (!result.ok) process.stdout.write(`  erro: ${result.erro}\n`);
  }

  const output = `/tmp/chef-ia-plan5-api-${Date.now()}.json`;
  fs.writeFileSync(output, JSON.stringify({ generated_at: new Date().toISOString(), results }, null, 2));
  process.stdout.write(`RESUMO ${output}\n`);
  if (results.some(result => !result.ok)) process.exitCode = 1;
}

main().catch(error => {
  console.error(`FALHA: ${error.message}`);
  process.exitCode = 1;
});
