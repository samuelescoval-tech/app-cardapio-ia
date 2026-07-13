require("dotenv").config({ quiet: true });
const fs = require("node:fs");
const { calcularMotorEvento } = require("../src/services/planning/motor.service");
const { obterDiretrizCulinaria } = require("../src/services/planning/culinary-matrix.service");
const { montarPromptPlanejamento } = require("../src/prompts/event.prompt");
const { gerarPlano } = require("../src/services/ai/gemini.service");

const cenarios = [
  { id: "domiciliar", tipo: "Atendimento domiciliar", pessoas: 5, criancas: 0, duracao: 3, refeicao: "Brunch / cafe da manha", restricoes: "Nenhuma", tema: "Familiar", alcool: "Com alcool moderado", estilo: "Elegante", obs: "Entrada antes do prato principal e sobremesa para finalizar" },
  { id: "casamento", tipo: "Casamento", pessoas: 100, criancas: 15, duracao: 6, refeicao: "Almoco ou jantar", restricoes: "Uma opcao vegetariana", tema: "Tropical elegante", alcool: "Com bar completo", estilo: "Elegante", obs: "Recepcao, jantar e mesa de sobremesas" },
  { id: "churrasco", tipo: "Churrasco de aniversario", pessoas: 50, criancas: 10, duracao: 5, refeicao: "Churrasco", restricoes: "Uma opcao vegetariana na grelha", tema: "Boteco brasileiro", alcool: "Com alcool moderado", estilo: "Simples", obs: "Servico informal com acompanhamentos variados" },
  { id: "infantil", tipo: "Festa infantil", pessoas: 30, criancas: 20, duracao: 4, refeicao: "Coquetel / Finger food", restricoes: "Evitar amendoim", tema: "Circo colorido", alcool: "Sem alcool", estilo: "Simples", obs: "Comidas faceis de servir e opcoes frescas" },
  { id: "corporativo", tipo: "Evento corporativo", pessoas: 40, criancas: 0, duracao: 3, refeicao: "Coffee break", restricoes: "Opcao vegana e opcao sem lactose", tema: "Profissional contemporaneo", alcool: "Sem alcool", estilo: "Premium", obs: "Networking pela manha com servico silencioso" }
].map(evento => ({ ...evento, pais: "Brasil", estado: "Sao Paulo", cidade: "Campinas" }));

async function main() {
  const filtros = new Set(process.argv.slice(2));
  const selecionados = filtros.size ? cenarios.filter(cenario => filtros.has(cenario.id)) : cenarios;
  if (!selecionados.length) throw new Error("Nenhum cenario valido selecionado.");

  const resultados = [];
  for (const [indice, evento] of selecionados.entries()) {
    process.stdout.write(`[${indice + 1}/${selecionados.length}] ${evento.id}: gerando...\n`);
    const diretriz = obterDiretrizCulinaria(evento);
    const resposta = await gerarPlano(
      montarPromptPlanejamento(evento, calcularMotorEvento(evento), diretriz),
      { diretrizCulinaria: diretriz }
    );
    const plano = resposta.plano || {};
    const qualidade = plano.qualidade_culinaria || {};
    resultados.push({
      id: evento.id,
      ok: resposta.ok,
      perfil: diretriz.perfil,
      refeicao: diretriz.modificador_refeicao?.id || null,
      tema: diretriz.modificador_tema?.id || null,
      momentos_esperados: diretriz.momentos_servico,
      status: qualidade.status || "falha",
      avisos: qualidade.avisos || [],
      cobertura: qualidade.cobertura || {},
      cardapio: (plano.cardapio || []).map(item => ({ nome: item.nome, categoria: item.categoria, tipo_execucao: item.tipo_execucao })),
      erro: resposta.meta?.erro || null
    });
    const atual = resultados.at(-1);
    process.stdout.write(`  ${atual.ok ? "OK" : "FALHA"}: ${atual.cardapio.length} itens, ${atual.status}, ${atual.avisos.length} avisos\n`);
  }

  const arquivo = `/tmp/chef-ia-plan6-api-${Date.now()}.json`;
  fs.writeFileSync(arquivo, JSON.stringify({ generated_at: new Date().toISOString(), resultados }, null, 2));
  process.stdout.write(`RESUMO ${arquivo}\n`);
  if (resultados.some(resultado => !resultado.ok)) process.exitCode = 1;
}

main().catch(error => {
  console.error(`FALHA: ${error.message}`);
  process.exitCode = 1;
});
