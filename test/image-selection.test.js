const test = require("node:test");
const assert = require("node:assert/strict");
const { criarImageSelectionService } = require("../src/services/images/image-selection.service");

const pratos = [
  { id: "p1", nome: "Mini sanduiche de carpaccio com alcaparras", categoria: "Entrada" },
  { id: "p2", nome: "Agua mineral com hortela", categoria: "Bebida" }
];

test("seleciona fotografia relacionada e liga ao prato exato", async () => {
  const service = criarImageSelectionService({ openverseService: {
    async buscar(solicitacao) {
      return { images: [{
        id: `img-${solicitacao.target_id}`,
        source_url: `https://example.com/${solicitacao.target_id}`,
        provider: "openverse",
        alt: solicitacao.target_id === "p1" ? "Carpaccio sandwich with capers" : "Mineral water with mint",
        tags: []
      }] };
    }
  } });
  const resultado = await service.selecionarParaEvento({ tipo: "Corporativo" }, pratos);

  assert.equal(resultado.images.length, 2);
  assert.equal(resultado.images[0].target_id, "p1");
  assert.equal(resultado.images[1].target_id, "p2");
  assert.equal(resultado.warnings.length, 0);
});

test("rejeita foto de massa para carpaccio e usa identificacao neutra", async () => {
  const service = criarImageSelectionService({ openverseService: {
    async buscar() {
      return { images: [{ id: "massa", source_url: "https://example.com/massa", provider: "openverse", alt: "Pasta with tomato sauce", tags: ["pasta"] }] };
    }
  } });
  const resultado = await service.selecionarParaEvento({ tipo: "Corporativo" }, [pratos[0]]);

  assert.equal(resultado.images.length, 0);
  assert.match(resultado.warnings[0], /identificacao visual neutra/i);
});

test("nao repete a mesma fotografia em pratos diferentes", async () => {
  const service = criarImageSelectionService({ openverseService: {
    async buscar(solicitacao) {
      return { images: [{
        id: "repetida",
        source_url: "https://example.com/repetida",
        provider: "openverse",
        alt: solicitacao.target_id === "p1" ? "Carpaccio sandwich" : "Mineral water"
      }] };
    }
  } });
  const resultado = await service.selecionarParaEvento({ tipo: "Corporativo" }, pratos);

  assert.equal(resultado.images.length, 1);
  assert.ok(resultado.warnings.some(aviso => /agua mineral/i.test(aviso)));
});

test("preserva alternativas relevantes por id do prato", async () => {
  const service = criarImageSelectionService({ openverseService: {
    async buscar() {
      return { images: [
        { id: "a", source_url: "https://example.com/a", provider: "openverse", alt: "Carpaccio sandwich with capers" },
        { id: "b", source_url: "https://example.com/b", provider: "openverse", alt: "Carpaccio sandwich" }
      ] };
    }
  } });
  const resultado = await service.selecionarParaEvento({ tipo: "Corporativo" }, [pratos[0]]);

  assert.equal(resultado.images[0].id, "a");
  assert.equal(resultado.alternatives.p1[0].id, "b");
});
