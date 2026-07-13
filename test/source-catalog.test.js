const test = require("node:test");
const assert = require("node:assert/strict");
const catalogo = require("../data/culinary/source-catalog.json");

test("catalogo de fontes e rastreavel e possui ids unicos", () => {
  const ids = catalogo.sources.map(fonte => fonte.id);

  assert.equal(new Set(ids).size, ids.length);
  assert.ok(catalogo.sources.length >= 10);
  catalogo.sources.forEach(fonte => {
    assert.ok(fonte.name);
    assert.match(fonte.url, /^https:\/\//);
    assert.ok(catalogo.quality_levels[fonte.quality]);
    assert.ok(fonte.roles.length);
    assert.ok(fonte.evidence);
    assert.ok(fonte.usage);
    assert.ok(fonte.limitations);
  });
});

test("bundles referenciam somente fontes existentes e runtime nao copia receitas", () => {
  const ids = new Set(catalogo.sources.map(fonte => fonte.id));

  Object.values(catalogo.bundles).flat().forEach(id => assert.ok(ids.has(id), `Fonte ausente: ${id}`));
  assert.equal(catalogo.runtime_policy.web_search_per_event, false);
  assert.equal(catalogo.runtime_policy.copy_recipe_text, false);
  const cps = catalogo.sources.find(fonte => fonte.id === "cps-prato-feito-modelagem");
  assert.equal(cps.quality, "academic");
  assert.equal(cps.runtime_use, false);
  assert.match(cps.limitations, /Nenhuma receita, texto, tela ou codigo.*copiado/i);
  const spoonacular = catalogo.sources.find(fonte => fonte.id === "spoonacular-recipe-api");
  assert.equal(spoonacular.quality, "external_api");
  assert.equal(spoonacular.runtime_use, false);
  assert.match(spoonacular.limitations, /proibem copiar ou armazenar ingredientes, instrucoes/i);
});
