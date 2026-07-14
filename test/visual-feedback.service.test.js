const test = require("node:test");
const assert = require("node:assert/strict");
const {
  criarVisualFeedbackService,
  VISUAL_FEEDBACK_STORAGE_KEY,
  VISUAL_FEEDBACK_MAX_ENTRIES
} = require("../public/js/visual-feedback.service");

function criarStorage() {
  const dados = new Map();
  return {
    getItem: chave => dados.get(chave) || null,
    setItem: (chave, valor) => dados.set(chave, valor),
    removeItem: chave => dados.delete(chave)
  };
}

test("feedback visual salva somente identificador, provider, slot e nota", () => {
  const storage = criarStorage();
  const service = criarVisualFeedbackService(storage);
  const imagem = {
    id: "openverse-123",
    provider: "openverse",
    slot: "capa",
    image_url: "https://nao-salvar.example/imagem.jpg",
    source_url: "https://nao-salvar.example/fonte",
    evento: { tipo: "nao salvar" }
  };

  assert.equal(service.salvarAvaliacao(imagem, "adequada"), true);
  const bruto = storage.getItem(VISUAL_FEEDBACK_STORAGE_KEY);
  const entrada = Object.values(JSON.parse(bruto).entries)[0];
  assert.deepEqual(entrada, {
    key: "openverse:openverse-123",
    provider: "openverse",
    image_id: "openverse-123",
    slot: "capa",
    rating: "adequada"
  });
  assert.equal(bruto.includes("nao-salvar"), false);
  assert.equal(bruto.includes("image_url"), false);
});

test("avaliacoes reordenam somente a imagem exata", () => {
  const service = criarVisualFeedbackService(criarStorage());
  const inadequada = { id: "a", provider: "openverse", slot: "capa" };
  const neutra = { id: "b", provider: "openverse", slot: "capa" };
  const adequada = { id: "c", provider: "openverse", slot: "capa" };
  service.salvarAvaliacao(inadequada, "inadequada");
  service.salvarAvaliacao(adequada, "adequada");

  assert.deepEqual(service.ordenarCandidatos([inadequada, neutra, adequada]), [adequada, neutra, inadequada]);
  assert.equal(service.obterAvaliacao(neutra), null);
  assert.deepEqual(service.resumir(), { total: 2, adequada: 1, generica: 0, inadequada: 1 });
});

test("feedback rejeita notas invalidas, limita entradas e permite limpar", () => {
  const storage = criarStorage();
  const service = criarVisualFeedbackService(storage);
  assert.equal(service.salvarAvaliacao({ id: "x", provider: "openverse", slot: "capa" }, "otima"), false);

  for (let indice = 0; indice < VISUAL_FEEDBACK_MAX_ENTRIES + 10; indice += 1) {
    service.salvarAvaliacao({ id: `id-${indice}`, provider: "openverse", slot: "capa" }, "generica");
  }
  assert.equal(service.resumir().total, VISUAL_FEEDBACK_MAX_ENTRIES);
  assert.equal(service.limpar(), true);
  assert.equal(service.resumir().total, 0);
});

