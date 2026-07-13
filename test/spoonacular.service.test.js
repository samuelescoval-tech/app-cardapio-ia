const test = require("node:test");
const assert = require("node:assert/strict");
const { criarSpoonacularService, SpoonacularError } = require("../src/services/recipes/spoonacular.service");

function respostaApi(results, headers = {}) {
  return {
    ok: true,
    status: 200,
    async json() { return { results }; },
    headers: { get(nome) { return headers[nome.toLowerCase()] ?? null; } }
  };
}

test("retorna somente metadados transitorios com atribuicao", async () => {
  let urlRecebida;
  const service = criarSpoonacularService({
    apiKey: "segredo-de-teste",
    limiteDiario: 2,
    relogio: () => Date.UTC(2026, 6, 12, 12, 0, 0),
    fetchImpl: async url => {
      urlRecebida = url;
      return respostaApi([{
        id: 123,
        title: "Brunch Recipe",
        image: "https://img.spoonacular.com/recipe.jpg",
        sourceName: "Example Kitchen",
        sourceUrl: "https://example.com/recipe",
        readyInMinutes: 25,
        servings: 4,
        extendedIngredients: [{ name: "nao pode sair" }],
        instructions: "nao pode sair"
      }], {
        "x-api-quota-request": "1.03",
        "x-api-quota-used": "4.2",
        "x-api-quota-left": "45.8"
      });
    }
  });

  const resultado = await service.buscarReferencias("brunch");

  assert.equal(urlRecebida.searchParams.get("apiKey"), "segredo-de-teste");
  assert.equal(urlRecebida.searchParams.get("number"), "3");
  assert.equal(resultado.persistence, false);
  assert.equal(resultado.references.length, 1);
  assert.equal(Object.hasOwn(resultado.references[0], "extendedIngredients"), false);
  assert.equal(Object.hasOwn(resultado.references[0], "instructions"), false);
  assert.equal(resultado.references[0].source_name, "Example Kitchen");
  assert.equal(resultado.quota.left_today, 45.8);
});

test("nao funciona sem configuracao e limita consultas locais", async () => {
  const semChave = criarSpoonacularService({ apiKey: "" });
  await assert.rejects(() => semChave.buscarReferencias("pasta"), error => {
    assert.ok(error instanceof SpoonacularError);
    assert.equal(error.statusCode, 503);
    return true;
  });

  let agora = Date.UTC(2026, 6, 12, 12, 0, 0);
  const limitado = criarSpoonacularService({
    apiKey: "teste",
    limiteDiario: 1,
    relogio: () => agora,
    fetchImpl: async () => respostaApi([])
  });
  await limitado.buscarReferencias("pasta");
  agora += 2000;
  await assert.rejects(() => limitado.buscarReferencias("risotto"), error => error.statusCode === 429);
});

test("remove URLs sem HTTPS e nunca devolve referencia sem fonte", async () => {
  const service = criarSpoonacularService({
    apiKey: "teste",
    relogio: () => Date.UTC(2026, 6, 12, 12, 0, 0),
    fetchImpl: async () => respostaApi([
      { id: 1, title: "Insegura", sourceUrl: "javascript:alert(1)" },
      { id: 2, title: "Segura", sourceUrl: "https://example.com/segura", image: "http://example.com/a.jpg" }
    ])
  });

  const resultado = await service.buscarReferencias("salad");

  assert.equal(resultado.references.length, 1);
  assert.equal(resultado.references[0].id, 2);
  assert.equal(resultado.references[0].image_url, null);
});
