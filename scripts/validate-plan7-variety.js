require("dotenv").config({ quiet: true });
const fs = require("node:fs");
const { calcularMotorEvento } = require("../src/services/planning/motor.service");
const { obterDiretrizCulinaria } = require("../src/services/planning/culinary-matrix.service");
const { criarContextoVariedade, avaliarVariedadePlano } = require("../src/services/planning/culinary-variety.service");
const { montarPromptPlanejamento } = require("../src/prompts/event.prompt");
const { gerarPlano } = require("../src/services/ai/gemini.service");

const cenarios = [
  { id: "domiciliar", tipo: "Atendimento domiciliar", pessoas: 5, criancas: 0, duracao: 3, refeicao: "Brunch / cafe da manha", restricoes: "Nenhuma", tema: "Familiar", alcool: "Com alcool moderado", estilo: "Elegante", obs: "Entrada antes do prato principal e sobremesa para finalizar" },
  { id: "casamento", tipo: "Casamento", pessoas: 100, criancas: 15, duracao: 6, refeicao: "Almoco ou jantar", restricoes: "Uma opcao vegetariana", tema: "Tropical elegante", alcool: "Com bar completo", estilo: "Elegante", obs: "Recepcao, jantar e mesa de sobremesas" },
  { id: "churrasco", tipo: "Churrasco de aniversario", pessoas: 50, criancas: 10, duracao: 5, refeicao: "Churrasco", restricoes: "Uma opcao vegetariana na grelha", tema: "Boteco brasileiro", alcool: "Com alcool moderado", estilo: "Simples", obs: "Servico informal com acompanhamentos variados" },
  { id: "infantil", tipo: "Festa infantil", pessoas: 30, criancas: 20, duracao: 4, refeicao: "Coquetel / Finger food", restricoes: "Evitar amendoim", tema: "Circo colorido", alcool: "Sem alcool", estilo: "Simples", obs: "Comidas faceis de servir e opcoes frescas", horarioInicio: "15:00", formatoServico: "Coquetel circulante", faixaEtaria: "Predominantemente infantil", infraestrutura: "Producao externa com finalizacao", prioridade: "Conforto dos convidados" },
  { id: "corporativo", tipo: "Evento corporativo", pessoas: 40, criancas: 0, duracao: 3, refeicao: "Coffee break", restricoes: "Opcao vegana e opcao sem lactose", tema: "Profissional contemporaneo", alcool: "Sem alcool", estilo: "Premium", obs: "Networking pela manha com servico silencioso" }
].map(evento => ({ ...evento, pais: "Brasil", estado: "Sao Paulo", cidade: "Campinas" }));

async function gerar(evento, diretriz, contexto) {
  return gerarPlano(
    montarPromptPlanejamento(evento, calcularMotorEvento(evento, diretriz), diretriz, contexto),
    { diretrizCulinaria: diretriz, evento }
  );
}

async function main() {
  const filtros = new Set(process.argv.slice(2));
  const selecionados = filtros.size ? cenarios.filter(cenario => filtros.has(cenario.id)) : cenarios;
  if (!selecionados.length) throw new Error("Nenhum cenario valido selecionado.");
  const resultados = [];

  for (const [indice, evento] of selecionados.entries()) {
    process.stdout.write(`[${indice + 1}/${selecionados.length}] ${evento.id}: base...\n`);
    const diretriz = obterDiretrizCulinaria(evento);
    const contextoInicial = criarContextoVariedade(evento, diretriz, []);
    const primeira = await gerar(evento, diretriz, contextoInicial);
    if (!primeira.ok) {
      resultados.push({ id: evento.id, ok: false, etapa: "base", erro: primeira.meta?.erro });
      continue;
    }

    const historico = [{
      evento: { tipo: evento.tipo, refeicao: evento.refeicao, tema: evento.tema },
      pratos: primeira.plano.cardapio.map(prato => ({ nome: prato.nome, categoria: prato.categoria }))
    }];
    const contexto = criarContextoVariedade(evento, diretriz, historico);
    process.stdout.write(`  segunda geracao evitando ${contexto.evitar_repetir.length} pratos...\n`);
    const segunda = await gerar(evento, diretriz, contexto);
    if (!segunda.ok) {
      resultados.push({ id: evento.id, ok: false, etapa: "segunda", erro: segunda.meta?.erro });
      continue;
    }

    const auditoria = avaliarVariedadePlano(segunda.plano, contexto);
    resultados.push({
      id: evento.id,
      ok: true,
      perfil: diretriz.perfil,
      primeira: primeira.plano.cardapio.map(prato => prato.nome),
      segunda: segunda.plano.cardapio.map(prato => prato.nome),
      auditoria,
      qualidade: segunda.plano.qualidade_culinaria
    });
    process.stdout.write(`  ${auditoria.pratos_novos} novos, ${auditoria.repeticoes_justificadas.length} essenciais, ${auditoria.repeticoes_a_revisar.length} a revisar; qualidade ${segunda.plano.qualidade_culinaria?.status}\n`);
  }

  const arquivo = `/tmp/chef-ia-plan7-variety-${Date.now()}.json`;
  fs.writeFileSync(arquivo, JSON.stringify({ generated_at: new Date().toISOString(), resultados }, null, 2));
  process.stdout.write(`RESUMO ${arquivo}\n`);
  if (resultados.some(resultado => !resultado.ok)) process.exitCode = 1;
}

main().catch(error => {
  console.error(`FALHA: ${error.message}`);
  process.exitCode = 1;
});
