// Suite consolidada por dominio. Cada bloco preserva o escopo do arquivo original.

// -----------------------------------------------------------------------------
// Origem consolidada: model-benchmark.test.js
// -----------------------------------------------------------------------------
{
const test = require("node:test");
const assert = require("node:assert/strict");
const {
  avaliarResultadoBenchmark,
  calcularCoberturaCategorias,
  calcularCoberturaExpectativas
} = require("../src/services/ai/model-benchmark.service");

test("benchmark mede categorias e repertorio sem confundir acentos", () => {
  const categorias = calcularCoberturaCategorias([
    { categoria: "Prato Principal" },
    { categoria: "Bebida" }
  ], [
    { category: "Prato Principal", minimum: 1 },
    { category: "Bebida", minimum: 2 }
  ]);
  const expectativas = calcularCoberturaExpectativas(
    "Baião de dois com alcatra",
    [{ label: "baiao", anyOf: ["baiao de dois"] }, { label: "frango", anyOf: ["frango"] }]
  );

  assert.equal(categorias.coberto, 2);
  assert.equal(categorias.esperado, 3);
  assert.equal(expectativas.coberto, 1);
  assert.equal(expectativas.esperado, 2);
});

test("benchmark entrega 100 quando todas as portas tecnicas passam", () => {
  const resposta = {
    ok: true,
    meta: {
      schema_ok: true,
      finish_reason: "STOP",
      tempo_ms: 1200,
      total_tokens: 500,
      requested_model: "modelo-a",
      model_version: "modelo-a-001"
    },
    plano: {
      cardapio: [{
        id: "prato-1",
        nome: "Baião de dois",
        categoria: "Prato Principal",
        tipo_execucao: "preparo",
        ingredientes: [{ item: "Arroz" }]
      }],
      receitas: [{ cardapio_id: "prato-1" }],
      lista_compras: [{ item: "Arroz" }],
      qualidade_culinaria: { status: "aprovado", avisos: [], ajustes: [] }
    }
  };
  const resultado = avaliarResultadoBenchmark({
    resposta,
    diretriz: {
      quantidade_total_minima: 1,
      composicao_minima: [{ category: "Prato Principal", minimum: 1 }],
      pedidos_culinarios_explicitos: []
    },
    expectativas: [{ label: "baiao", anyOf: ["baiao de dois"] }]
  });

  assert.equal(resultado.pontuacao_tecnica, 100);
  assert.equal(resultado.metricas.receitas.razao, 1);
  assert.equal(resultado.metricas.ingredientes.razao, 1);
});

test("benchmark nao premia cobertura vazia quando a geracao falha", () => {
  const resultado = avaliarResultadoBenchmark({
    resposta: {
      ok: false,
      meta: { schema_ok: false, finish_reason: "MAX_TOKENS" },
      plano: { cardapio: [], receitas: [], lista_compras: [], qualidade_culinaria: { avisos: [] } }
    },
    diretriz: {
      composicao_minima: [{ category: "Prato Principal", minimum: 1 }]
    },
    expectativas: [{ label: "principal", anyOf: ["principal"] }]
  });

  assert.equal(resultado.pontuacao_tecnica, 0);
  assert.deepEqual(new Set(Object.values(resultado.componentes)), new Set([0]));
});
}

