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
  assert.equal(Object.hasOwn(evento, "duracao"), false);
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
