const test = require("node:test");
const assert = require("node:assert/strict");
const { criarImageSelectionService } = require("../src/services/images/image-selection.service");

test("selecao preserva uma imagem por slot e usa fallback em falha", async () => {
  let chamada = 0;
  const service = criarImageSelectionService({ openverseService: {
    async buscar(solicitacao) {
      chamada += 1;
      if (chamada === 1) return { images: [{ id: "externa", slot: solicitacao.slot, provider: "openverse", fallback: false }] };
      throw new Error("indisponivel");
    }
  } });
  const resultado = await service.selecionarParaEvento({ tipo: "Casamento", estilo: "Elegante" }, []);
  assert.ok(resultado.images.length >= 2);
  assert.equal(resultado.images[0].id, "externa");
  assert.ok(resultado.images.slice(1).every(item => item.provider === "local" && item.fallback));
  assert.ok(resultado.warnings.length >= 1);
  assert.equal(resultado.persistence, false);
});

test("selecao tenta a consulta generica quando a contextual nao encontra imagem", async () => {
  const consultas = [];
  const service = criarImageSelectionService({ openverseService: {
    async buscar(solicitacao) {
      consultas.push(solicitacao.query);
      return consultas.length === 1 ? { images: [] } : { images: [{ id: "generica", slot: solicitacao.slot, provider: "openverse" }] };
    }
  } });
  const resultado = await service.selecionarParaEvento({ tipo: "Evento", estilo: "Premium" }, []);
  assert.equal(resultado.images[0].id, "generica");
  assert.equal(consultas[1], "table setting");
});
