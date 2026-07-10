const test = require("node:test");
const assert = require("node:assert/strict");
const { calcularMotorEvento } = require("../src/services/planning/motor.service");

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
  assert.equal(motor.staff[0].quantidade, "5");
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
