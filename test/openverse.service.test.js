const test = require("node:test");
const assert = require("node:assert/strict");
const { criarOpenverseService, normalizarResultado, validarQuery } = require("../src/services/images/openverse.service");

function resposta(results, status = 200) {
  return { ok: status >= 200 && status < 300, status, async json() { return { results }; } };
}

test("Openverse envia filtros seguros e normaliza atribuicao", async () => {
  let urlRecebida;
  const service = criarOpenverseService({
    relogio: () => Date.UTC(2026, 6, 14),
    fetchImpl: async url => {
      urlRecebida = url;
      return resposta([{ id: "abc", title: "Dinner", url: "https://images.example.com/a.jpg", thumbnail: "https://images.example.com/t.jpg", foreign_landing_url: "https://example.com/work", creator: "Ana", creator_url: "https://example.com/ana", license: "by", license_url: "https://creativecommons.org/licenses/by/4.0/", attribution: "Dinner by Ana, CC BY", width: 1200, height: 800, mature: false }]);
    }
  });
  const resultado = await service.buscar({ query: "elegant dinner table", slot: "capa", orientation: "wide" });
  assert.equal(urlRecebida.searchParams.get("license"), "cc0,pdm,by");
  assert.equal(urlRecebida.searchParams.get("mature"), "false");
  assert.equal(resultado.images[0].creator, "Ana");
  assert.equal(resultado.images[0].attribution, "Dinner by Ana, CC BY");
  assert.equal(resultado.images[0].fallback, false);
});

test("Openverse usa cache e limita consultas locais", async () => {
  let chamadas = 0;
  const service = criarOpenverseService({ limiteDiario: 1, relogio: () => Date.UTC(2026, 6, 14), fetchImpl: async () => { chamadas += 1; return resposta([]); } });
  const solicitacao = { query: "dessert table", slot: "sobremesa", orientation: "square" };
  await service.buscar(solicitacao);
  const cache = await service.buscar(solicitacao);
  assert.equal(chamadas, 1);
  assert.equal(cache.cached, true);
  await assert.rejects(() => service.buscar({ ...solicitacao, query: "event drinks" }), error => error.statusCode === 429);
});

test("normalizador rejeita licencas fora da lista e URLs inseguras", () => {
  assert.equal(normalizarResultado({ id: "1", license: "by-sa" }, "capa"), null);
  const comMiniaturaSegura = normalizarResultado({ id: "2", license: "cc0", url: "http://example.com/a.jpg", thumbnail: "https://example.com/t.jpg", foreign_landing_url: "https://example.com" }, "capa");
  assert.equal(comMiniaturaSegura.image_url, "https://example.com/t.jpg");
  assert.equal(normalizarResultado({ id: "3", license: "cc0", url: "http://example.com/a.jpg", thumbnail: "http://example.com/t.jpg", foreign_landing_url: "https://example.com" }, "capa"), null);
  assert.throws(() => validarQuery("x"), /invalida/);
});
