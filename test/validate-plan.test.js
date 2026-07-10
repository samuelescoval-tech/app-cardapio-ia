const test = require("node:test");
const assert = require("node:assert/strict");
const { validarPlano } = require("../src/utils/validate-plan");
const { aplicarMotorAoPlano } = require("../src/services/planning/motor.service");

function planoValido() {
  return {
    cardapio: Array.from({ length: 8 }, (_, index) => ({ nome: `Prato ${index + 1}` })),
    receitas: [],
    lista_compras: Array.from({ length: 12 }, (_, index) => ({ item: `Item ${index + 1}` })),
    utensilios: [],
    local: Array.from({ length: 4 }, (_, index) => ({ tipo: `Local ${index + 1}` })),
    layout: [],
    decoracao: { temas: [], itens: [], iluminacao: "", campo_extra: "remover" },
    cronograma: Array.from({ length: 6 }, (_, index) => ({ hora: `${18 + index}:00`, atividade: `Etapa ${index + 1}` })),
    equipe_obs: [],
    entretenimento: [],
    lembrancinhas: [],
    checklist: { pre: [], durante: [], pos: [] },
    orcamento: { economico: { total: "R$ 1", segredo: "remover" }, medio: {}, sofisticado: {} },
    resumo_chef: "Plano adequado ao evento."
  };
}

test("normaliza somente os campos conhecidos do contrato", () => {
  const entrada = {
    ...planoValido(),
    motor_logistica: { estimativa_total: "valor inventado" },
    instrucao_interna: "campo nao permitido"
  };

  const plano = validarPlano(entrada);

  assert.equal(plano.motor_logistica, null);
  assert.equal(plano.servico_mesa, null);
  assert.equal(Object.hasOwn(plano, "instrucao_interna"), false);
  assert.equal(Object.hasOwn(plano.decoracao, "campo_extra"), false);
  assert.equal(plano.orcamento, null);
  assert.equal(plano.precificacao, null);
  assert.equal(plano.cardapio.length, 8);
});

test("rejeita plano sem campos essenciais", () => {
  const entrada = planoValido();
  delete entrada.resumo_chef;

  assert.throws(() => validarPlano(entrada), /Campos ausentes: resumo_chef/);
});

test("backend aplica o motor oficial depois da validacao", () => {
  const plano = validarPlano({
    ...planoValido(),
    motor_logistica: { estimativa_total: "valor inventado" }
  });
  const motor = {
    estimativa_total: "R$ 5.000",
    servico_mesa: { observacao: "Fonte oficial" },
    precificacao: { status: "aguardando_catalogo", fonte: null }
  };

  const resultado = aplicarMotorAoPlano(plano, motor);

  assert.equal(resultado.motor_logistica, motor);
  assert.equal(resultado.servico_mesa, motor.servico_mesa);
  assert.equal(resultado.orcamento, null);
  assert.equal(resultado.precificacao, motor.precificacao);
});

test("aceita variacao de quantidade sem perder a validacao estrutural", () => {
  const entrada = planoValido();
  entrada.cronograma = entrada.cronograma.slice(0, 5);

  const plano = validarPlano(entrada);

  assert.equal(plano.cronograma.length, 5);
});
