const test = require("node:test");
const assert = require("node:assert/strict");
const { calcularMotorEvento } = require("../src/services/planning/motor.service");
const { obterDiretrizCulinaria } = require("../src/services/planning/culinary-matrix.service");

const cenarios = [
  {
    nome: "atendimento domiciliar simples",
    evento: { tipo: "Atendimento domiciliar", pessoas: 20, duracao: 3, estilo: "Simples", horarioInicio: "12:00", formatoServico: "Buffet self-service", infraestrutura: "Cozinha completa no local", prioridade: "Praticidade de servico" },
    nivel: "Baixa"
  },
  {
    nome: "casamento empratado complexo",
    evento: { tipo: "Casamento", pessoas: 120, duracao: 6, estilo: "Premium", horarioInicio: "19:30", formatoServico: "Empratado", infraestrutura: "Cozinha de apoio limitada", prioridade: "Apresentacao" },
    nivel: "Alta"
  },
  {
    nome: "churrasco sem cozinha local",
    evento: { tipo: "Churrasco", pessoas: 80, duracao: 5, estilo: "Simples", horarioInicio: "13:00", formatoServico: "Estacoes ou ilhas", infraestrutura: "Sem cozinha no local", prioridade: "Equilibrio geral" },
    nivel: "Alta"
  },
  {
    nome: "festa infantil com producao externa",
    evento: { tipo: "Festa infantil", pessoas: 45, duracao: 4, estilo: "Simples", horarioInicio: "15:00", formatoServico: "Coquetel circulante", infraestrutura: "Producao externa com finalizacao", prioridade: "Conforto dos convidados" },
    nivel: "Media"
  },
  {
    nome: "corporativo com cozinha limitada",
    evento: { tipo: "Corporativo", pessoas: 35, duracao: 3, estilo: "Elegante", horarioInicio: "08:30", formatoServico: "Buffet com equipe servindo", infraestrutura: "Cozinha de apoio limitada", prioridade: "Economia operacional" },
    nivel: "Media"
  }
];

test("cinco eventos prioritarios cobrem complexidade baixa, media e alta", async t => {
  const niveis = new Set();

  for (const cenario of cenarios) {
    await t.test(cenario.nome, () => {
      const diretriz = obterDiretrizCulinaria(cenario.evento);
      const motor = calcularMotorEvento(cenario.evento, diretriz);
      const operacao = motor.operacao;
      niveis.add(operacao.complexidade.nivel);

      assert.equal(operacao.complexidade.nivel, cenario.nivel);
      assert.match(operacao.complexidade.fatores.join(" "), /horario/i);
      assert.match(operacao.complexidade.fatores.join(" "), /publico/i);
      assert.equal(operacao.status, "dimensionado");
      assert.ok(operacao.equipe.length >= 2);
      assert.equal(operacao.fluxo_producao.length, 6);
      assert.ok(operacao.estacoes.length >= 3);
      assert.ok(operacao.cronograma_operacional.length >= 9);
      assert.ok(operacao.cronograma_operacional.some(item => item.hora === cenario.evento.horarioInicio));
      const funcoes = operacao.equipe.map(item => item.funcao);
      assert.ok(funcoes.includes(operacao.cronograma_operacional[2].responsavel));
      assert.ok(funcoes.includes(operacao.cronograma_operacional.at(-1).responsavel));
      diretriz.momentos_servico.forEach(momento => {
        assert.ok(operacao.cronograma_operacional.some(item => item.atividade.toLowerCase() === momento.toLowerCase()));
      });
    });
  }

  assert.deepEqual([...niveis].sort(), ["Alta", "Baixa", "Media"]);
});

test("dados nao confirmados geram operacao provisoria e pendencias explicitas", () => {
  const motor = calcularMotorEvento({ tipo: "Aniversario", pessoas: 50, duracao: 4 });

  assert.equal(motor.operacao.status, "condicionado_a_confirmacao");
  assert.equal(motor.operacao.confirmacoes_pendentes.length, 2);
  assert.match(motor.operacao.fluxo_producao[3].orientacao, /nao programar cocao local/i);
  assert.match(motor.operacao.estacoes[1].equipamentos.join(" "), /condicionados a confirmacao/i);
  const lideranca = motor.operacao.equipe.find(item => /Coordenacao operacional|Responsavel operacional/.test(item.funcao));
  assert.ok(lideranca);
  assert.equal(motor.operacao.cronograma_operacional[2].responsavel, lideranca.funcao);
});

test("equipe e equipamentos mudam conforme o formato de servico", () => {
  const base = { tipo: "Casamento", pessoas: 100, duracao: 5, horarioInicio: "18:00", infraestrutura: "Cozinha completa no local" };
  const buffet = calcularMotorEvento({ ...base, formatoServico: "Buffet self-service" }).operacao;
  const empratado = calcularMotorEvento({ ...base, formatoServico: "Empratado" }).operacao;

  const atendimentoBuffet = Number(buffet.equipe.find(item => item.funcao === "Atendimento de salao").quantidade);
  const atendimentoEmpratado = Number(empratado.equipe.find(item => item.funcao === "Atendimento de salao").quantidade);
  assert.ok(atendimentoEmpratado > atendimentoBuffet);
  assert.ok(empratado.equipe.some(item => item.funcao === "Passe e montagem de pratos"));
  assert.match(empratado.estacoes[1].estacao, /passe/i);
});

test("cronograma nao atribui bar quando a equipe nao possui bar dedicado", () => {
  const evento = { tipo: "Corporativo", pessoas: 35, duracao: 3, horarioInicio: "08:30", alcool: "Sem alcool", formatoServico: "Buffet com equipe servindo", infraestrutura: "Cozinha de apoio limitada" };
  const diretriz = obterDiretrizCulinaria(evento);
  const operacao = calcularMotorEvento(evento, diretriz).operacao;

  assert.equal(operacao.equipe.some(item => item.funcao === "Bar e bebidas"), false);
  assert.equal(operacao.cronograma_operacional.some(item => item.responsavel === "Bar e bebidas"), false);
  assert.ok(operacao.cronograma_operacional.some(item => /bebidas/i.test(item.atividade) && item.responsavel === "Atendimento de salao"));
});
