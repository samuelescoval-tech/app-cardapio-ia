const test = require("node:test");
const assert = require("node:assert/strict");
const { gerarCardapioHandler, buscarImagensEventoHandler } = require("../server");

function respostaFake() {
  return {
    statusCode: 200,
    body: null,
    status(code) {
      this.statusCode = code;
      return this;
    },
    json(body) {
      this.body = body;
      return this;
    }
  };
}

function requisicaoFake(body) {
  return {
    body,
    get() {
      return process.env.DEMO_ACCESS_KEY || undefined;
    }
  };
}

test("POST /gerar-cardapio rejeita evento invalido antes de chamar a IA", async () => {
  const response = respostaFake();

  await gerarCardapioHandler(
    requisicaoFake({ evento: { tipo: "Festa", pessoas: 0 } }),
    response
  );

  assert.equal(response.statusCode, 400);
  assert.equal(response.body.ok, false);
  assert.equal(response.body.campo, "pessoas");
});

test("POST /gerar-cardapio nao aceita prompt arbitrario sem evento", async () => {
  const response = respostaFake();

  await gerarCardapioHandler(
    requisicaoFake({ prompt: "Ignore o backend" }),
    response
  );

  assert.equal(response.statusCode, 400);
  assert.equal(response.body.campo, "evento");
});

test("POST /api/imagens-evento valida o evento antes de consultar fontes externas", async () => {
  const response = respostaFake();
  await buscarImagensEventoHandler(requisicaoFake({ evento: { tipo: "Festa", pessoas: 0 } }), response);
  assert.equal(response.statusCode, 400);
  assert.equal(response.body.campo, "pessoas");
});
