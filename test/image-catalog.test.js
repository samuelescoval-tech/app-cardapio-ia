const test = require("node:test");
const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");
const dictionary = require("../data/images/visual-dictionary.json");
const { construirSolicitacoesImagem, criarImagemFallback, validarDicionario, validarImagem } = require("../src/services/images/image-catalog.service");

test("dicionario visual possui contextos, slots e fallbacks locais", () => {
  assert.deepEqual(validarDicionario(dictionary), []);
  assert.ok(dictionary.contexts.length >= 10);
  Object.values(dictionary.slots).forEach(slot => {
    const arquivo = path.join(__dirname, "..", "public", slot.fallback);
    assert.equal(fs.existsSync(arquivo), true, arquivo);
  });
});

test("solicitacoes sao especificas por prato e preservam o id de destino", () => {
  const solicitacoes = construirSolicitacoesImagem({ tipo: "Aniversario de debutante", tema: "Jardim dourado", estilo: "Premium" }, [
    { id: "p1", nome: "Mini sanduiche de carpaccio com alcaparras", categoria: "Entrada" },
    { id: "p2", nome: "File de tilapia grelhado", categoria: "Prato Principal" },
    { id: "p3", nome: "Agua mineral com hortela", categoria: "Bebida" }
  ]);
  assert.equal(solicitacoes.length, 3);
  assert.equal(solicitacoes[0].slot, "entrada");
  assert.equal(solicitacoes[0].target_id, "p1");
  assert.match(solicitacoes[0].query, /sandwich carpaccio capers/);
  assert.ok(solicitacoes[0].match_terms.includes("carpaccio"));
  assert.equal(solicitacoes[0].style_id, "premium");
  assert.match(solicitacoes[1].query, /tilapia fish/);
  assert.match(solicitacoes[2].query, /mineral water/);
  assert.equal(solicitacoes[2].match_terms.includes("beverage"), false);
});

test("contrato rejeita provider, licenca e URL externa inseguros", () => {
  const fallback = criarImagemFallback({ slot: "capa", fallback_url: "/images/fallback/event-cover.svg", nome: "Capa" });
  assert.equal(fallback.fallback, true);
  assert.equal(fallback.provider, "local");
  assert.throws(() => validarImagem({ ...fallback, provider: "desconhecido" }), /Provider/);
  assert.throws(() => validarImagem({ ...fallback, provider: "openverse", license: "by", image_url: "javascript:alert(1)", thumbnail_url: "https://example.com/a.jpg", source_url: "https://example.com" }), /HTTPS/);
});
