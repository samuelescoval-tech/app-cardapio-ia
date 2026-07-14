const test = require("node:test");
const assert = require("node:assert/strict");
const { calcularMotorEvento, aplicarMotorAoPlano } = require("../src/services/planning/motor.service");

const eventoBase = {
  tipo: "Aniversario",
  pessoas: 100,
  duracao: 4,
  refeicao: "Almoco ou jantar",
  alcool: "Com alcool moderado",
  estilo: "Simples"
};

function quantidade(lista, item) {
  return lista.find(entrada => entrada.item === item)?.quantidade;
}

function litros(valor) {
  return Number(String(valor || "0").match(/\d+(?:[.,]\d+)?/)?.[0].replace(",", ".") || 0);
}

test("evento antigo sem criancas preserva os calculos anteriores", () => {
  const motor = calcularMotorEvento(eventoBase);

  assert.equal(motor.premissas.adultos, 100);
  assert.equal(motor.premissas.criancas, 0);
  assert.equal(quantidade(motor.alimentacao, "Salgados/canapes"), "500 un");
  assert.equal(quantidade(motor.alimentacao, "Comida principal"), "42 kg");
  assert.equal(quantidade(motor.bebidas, "Bebidas alcoolicas"), "112L");
  assert.equal(motor.estimativa_total, null);
  assert.equal(motor.precificacao.status, "aguardando_catalogo");
});

test("evento misto aplica fator infantil somente a consumo e custo", () => {
  const motor = calcularMotorEvento({ ...eventoBase, criancas: 20 });

  assert.equal(motor.premissas.adultos, 80);
  assert.equal(motor.premissas.criancas, 20);
  assert.equal(quantidade(motor.alimentacao, "Salgados/canapes"), "460 un");
  assert.equal(quantidade(motor.alimentacao, "Comida principal"), "38.6 kg");
  assert.equal(quantidade(motor.bebidas, "Bebidas nao alcoolicas"), "76.8L");
  assert.equal(quantidade(motor.bebidas, "Bebidas alcoolicas"), "89.6L");
  assert.equal(motor.custo_adulto, null);
  assert.equal(motor.custo_crianca, null);
  assert.equal(motor.estimativa_total, null);
  assert.equal(motor.espaco, "120m2");
  assert.equal(motor.servico_mesa.talheres[0].quantidade, "115 un");
  assert.equal(motor.staff.find(item => item.funcao === "Atendimento de salao").quantidade, "5");
});

test("precificacao sem catalogo registra regiao e nao inventa valor", () => {
  const motor = calcularMotorEvento({
    ...eventoBase,
    pais: "Brasil",
    estado: "Sao Paulo",
    cidade: "Campinas",
    dataEvento: "2026-09-20"
  });

  assert.deepEqual(motor.precificacao.regiao, {
    pais: "Brasil",
    estado: "Sao Paulo",
    cidade: "Campinas"
  });
  assert.equal(motor.precificacao.data_evento, "2026-09-20");
  assert.equal(motor.precificacao.fonte, null);
});

test("motor transforma o contexto avancado em operacao deterministica", () => {
  const motor = calcularMotorEvento({
    ...eventoBase,
    horarioInicio: "19:30",
    formatoServico: "Empratado",
    faixaEtaria: "Adultos e idosos",
    infraestrutura: "Cozinha de apoio limitada",
    prioridade: "Conforto dos convidados"
  });

  assert.equal(motor.premissas.horario_inicio, "19:30");
  assert.equal(motor.premissas.formato_servico, "Empratado");
  assert.equal(motor.premissas.faixa_etaria, "Adultos e idosos");
  assert.equal(motor.premissas.infraestrutura, "Cozinha de apoio limitada");
  assert.equal(motor.premissas.prioridade, "Conforto dos convidados");
  assert.equal(quantidade(motor.alimentacao, "Comida principal"), "42 kg");
  assert.equal(motor.operacao.complexidade.nivel, "Alta");
  assert.equal(motor.operacao.status, "dimensionado");
  assert.equal(motor.operacao.cronograma_operacional[4].hora, "19:30");
  assert.ok(motor.staff.some(item => item.funcao === "Passe e montagem de pratos"));
});

test("motor reconcilia proporcionalmente bebidas abaixo dos litros oficiais", () => {
  const motor = calcularMotorEvento({
    tipo: "Churrasco",
    pessoas: 50,
    criancas: 10,
    duracao: 5,
    refeicao: "Churrasco",
    alcool: "Com alcool moderado"
  });
  const plano = {
    cardapio: [
      { categoria: "Bebida", nome: "Cerveja artesanal", quantidade: "30 L" },
      { categoria: "Bebida", nome: "Suco natural", quantidade: "10 L" },
      { categoria: "Bebida", nome: "Agua mineral", quantidade: "8 L" }
    ],
    lista_compras: [
      { item: "Cerveja artesanal", quantidade: "30 L", setor: "Bebidas", natureza: "bebida", origens: [] },
      { item: "Suco natural", quantidade: "10 L", setor: "Bebidas", natureza: "bebida", origens: [] },
      { item: "Agua mineral", quantidade: "8 L", setor: "Bebidas", natureza: "bebida", origens: [] }
    ],
    qualidade_culinaria: { status: "aprovado", ajustes: [], avisos: [] }
  };

  const resultado = aplicarMotorAoPlano(plano, motor);
  const alcoolicas = resultado.cardapio.filter(item => /cerveja/i.test(item.nome));
  const naoAlcoolicas = resultado.cardapio.filter(item => !/cerveja/i.test(item.nome));

  assert.equal(resultado.qualidade_culinaria.status, "ajustado");
  assert.equal(alcoolicas.reduce((total, item) => total + litros(item.quantidade), 0), 56);
  assert.equal(naoAlcoolicas.reduce((total, item) => total + litros(item.quantidade), 0), 48);
  assert.equal(resultado.reconciliacao_bebidas.status, "ajustado");
  assert.equal(resultado.reconciliacao_bebidas.grupos.filter(grupo => grupo.status === "ajustado").length, 2);
  assert.match(resultado.qualidade_culinaria.ajustes.join(" "), /30 L para 56 L/i);
  assert.equal(resultado.qualidade_culinaria.avisos.length, 0);
  assert.equal(litros(resultado.lista_compras[0].quantidade), 56);
  assert.equal(litros(resultado.lista_compras[1].quantidade) + litros(resultado.lista_compras[2].quantidade), 48);
});

test("motor aceita distribuicao de bebidas que atinge os totais oficiais", () => {
  const motor = calcularMotorEvento({
    tipo: "Churrasco",
    pessoas: 50,
    criancas: 10,
    duracao: 5,
    refeicao: "Churrasco",
    alcool: "Com alcool moderado"
  });
  const plano = {
    cardapio: [
      { categoria: "Bebida", nome: "Cerveja artesanal", quantidade: "56 L" },
      { categoria: "Bebida", nome: "Suco natural", quantidade: "20 L" },
      { categoria: "Bebida", nome: "Agua mineral", quantidade: "28 L" }
    ],
    qualidade_culinaria: { status: "aprovado", ajustes: [], avisos: [] }
  };

  const resultado = aplicarMotorAoPlano(plano, motor);

  assert.equal(resultado.qualidade_culinaria.status, "aprovado");
  assert.deepEqual(resultado.qualidade_culinaria.avisos, []);
  assert.equal(resultado.reconciliacao_bebidas.status, "conforme");
});

test("motor preserva aviso quando nao existe bebida para distribuir", () => {
  const motor = calcularMotorEvento({
    tipo: "Corporativo",
    pessoas: 20,
    criancas: 0,
    duracao: 3,
    refeicao: "Coffee break",
    alcool: "Sem alcool"
  });
  const plano = {
    cardapio: [],
    lista_compras: [],
    qualidade_culinaria: { status: "aprovado", ajustes: [], avisos: [] }
  };

  const resultado = aplicarMotorAoPlano(plano, motor);

  assert.equal(resultado.reconciliacao_bebidas.status, "revisar");
  assert.match(resultado.qualidade_culinaria.avisos.join(" "), /nao alcoolicas abaixo da estimativa/i);
});
