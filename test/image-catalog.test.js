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

test("solicitacoes combinam evento, estilo e blocos sem exceder oito imagens", () => {
  const solicitacoes = construirSolicitacoesImagem({ tipo: "Aniversario de debutante", tema: "Jardim dourado", estilo: "Premium" }, [
    { id: "b1", nome: "Entradas", categoria: "Entrada" },
    { id: "b2", nome: "Carnes da grelha", categoria: "Prato Principal" },
    { id: "b3", nome: "Doces", categoria: "Sobremesa" }
  ]);
  assert.ok(solicitacoes.length <= 8);
  assert.equal(solicitacoes[0].slot, "capa");
  assert.match(solicitacoes[0].query, /quinceanera/);
  assert.match(solicitacoes[0].query, /luxury/);
  assert.equal(solicitacoes[0].fallback_query, "table setting");
  assert.ok(solicitacoes.some(item => item.slot === "bebida"));
  assert.ok(solicitacoes.some(item => item.slot === "ambiente"));
});

test("contrato rejeita provider, licenca e URL externa inseguros", () => {
  const fallback = criarImagemFallback({ slot: "capa", fallback_url: "/images/fallback/event-cover.svg", nome: "Capa" });
  assert.equal(fallback.fallback, true);
  assert.equal(fallback.provider, "local");
  assert.throws(() => validarImagem({ ...fallback, provider: "desconhecido" }), /Provider/);
  assert.throws(() => validarImagem({ ...fallback, provider: "openverse", license: "by", image_url: "javascript:alert(1)", thumbnail_url: "https://example.com/a.jpg", source_url: "https://example.com" }), /HTTPS/);
});
