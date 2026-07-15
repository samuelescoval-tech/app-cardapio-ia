const test = require("node:test");
const assert = require("node:assert/strict");
const { avaliarQualidadeEvento } = require("../src/services/planning/event-quality.service");

test("auditoria pontua de zero a dez e explica a comparacao", () => {
  const cardapio = [
    { id: "e1", nome: "Canapé de salmão", categoria: "Entrada" },
    { id: "s1", nome: "Tartelete artesanal", categoria: "Sobremesa" },
    ...Array.from({ length: 8 }, (_, indice) => ({
      id: `b${indice + 1}`,
      nome: `Bebida ${indice + 1}`,
      categoria: "Bebida"
    }))
  ];
  const avaliacao = avaliarQualidadeEvento({
    cardapio,
    qualidade_culinaria: {
      avisos: [],
      cobertura: { pratos_com_preparo: 2, receitas_completas: 2 }
    }
  }, {
    pessoas: 80,
    estilo: "Premium",
    alcool: "Sem alcool"
  }, {
    composicao_minima: [
      { category: "Entrada", minimum: 1 },
      { category: "Sobremesa", minimum: 1 },
      { category: "Bebida", minimum: 8 }
    ]
  });

  assert.ok(avaliacao.nota >= 8 && avaliacao.nota <= 10);
  assert.equal(avaliacao.status, "aprovado");
  assert.equal(avaliacao.comparacao.length, 6);
  assert.match(avaliacao.resumo_textual, /10/);
});

test("auditoria rebaixa item generico premium e o lista para revisao", () => {
  const avaliacao = avaliarQualidadeEvento({
    cardapio: [{ id: "i1", nome: "Iogurte com mel", categoria: "Prato Principal", descricao: "Iogurte natural" }],
    qualidade_culinaria: {
      avisos: ["Contrato Premium exige apresentacao adicional."],
      cobertura: { pratos_com_preparo: 1, receitas_completas: 0 }
    }
  }, { pessoas: 80, estilo: "Premium", alcool: "Sem alcool" }, {
    composicao_minima: [{ category: "Entrada", minimum: 4 }, { category: "Bebida", minimum: 8 }]
  });

  assert.ok(avaliacao.nota < 6.5);
  assert.equal(avaliacao.status, "rascunho");
  assert.equal(avaliacao.itens_a_revisar[0].nome, "Iogurte com mel");
  assert.match(avaliacao.decisao, /rascunho/i);
});
