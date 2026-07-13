const test = require("node:test");
const assert = require("node:assert/strict");
const { validarEvento, ErroValidacaoEvento } = require("../src/utils/validate-event");

test("normaliza um evento valido e aplica valores padrao", () => {
  const evento = validarEvento({ tipo: "  Festa   infantil ", pessoas: "25" });

  assert.equal(evento.tipo, "Festa infantil");
  assert.equal(evento.pessoas, 25);
  assert.equal(evento.criancas, 0);
  assert.equal(evento.estilo, "Simples");
  assert.equal(evento.restricoes, "Nenhuma");
  assert.equal(evento.horarioInicio, "");
  assert.equal(evento.formatoServico, "A definir pelo Chef IA");
  assert.equal(evento.faixaEtaria, "Publico misto");
  assert.equal(evento.infraestrutura, "A confirmar");
  assert.equal(evento.prioridade, "Equilibrio geral");
  assert.equal(Object.hasOwn(evento, "duracao"), false);
});

test("valida horario e opcoes avancadas controladas", () => {
  const evento = validarEvento({
    tipo: "Evento corporativo",
    pessoas: 40,
    horarioInicio: "08:30",
    formatoServico: "Buffet self-service"
  });

  assert.equal(evento.horarioInicio, "08:30");
  assert.throws(
    () => validarEvento({ tipo: "Evento", pessoas: 20, horarioInicio: "25:90" }),
    error => error instanceof ErroValidacaoEvento && error.campo === "horarioInicio"
  );
  assert.throws(
    () => validarEvento({ tipo: "Evento", pessoas: 20, formatoServico: "Coffee break" }),
    error => error instanceof ErroValidacaoEvento && error.campo === "formatoServico"
  );
});

test("rejeita pessoas fora do intervalo", () => {
  assert.throws(
    () => validarEvento({ tipo: "Casamento", pessoas: 0 }),
    error => error instanceof ErroValidacaoEvento && error.campo === "pessoas"
  );
});

test("rejeita observacao acima do limite", () => {
  assert.throws(
    () => validarEvento({ tipo: "Casamento", pessoas: 50, obs: "x".repeat(1001) }),
    error => error instanceof ErroValidacaoEvento && error.campo === "obs"
  );
});

test("aceita criancas dentro do total e rejeita valor maior", () => {
  const evento = validarEvento({ tipo: "Aniversario", pessoas: 40, criancas: 12 });
  assert.equal(evento.criancas, 12);

  assert.throws(
    () => validarEvento({ tipo: "Aniversario", pessoas: 40, criancas: 41 }),
    error => error instanceof ErroValidacaoEvento && error.campo === "criancas"
  );
});

test("normaliza localidade e valida a data do evento", () => {
  const evento = validarEvento({
    tipo: "Casamento",
    pessoas: 80,
    pais: "Brasil",
    estado: "Sao Paulo",
    cidade: "Campinas",
    dataEvento: "2026-09-20"
  });

  assert.equal(evento.cidade, "Campinas");
  assert.equal(evento.dataEvento, "2026-09-20");
  assert.throws(
    () => validarEvento({ tipo: "Casamento", pessoas: 80, dataEvento: "2026-02-30" }),
    error => error instanceof ErroValidacaoEvento && error.campo === "dataEvento"
  );
});
