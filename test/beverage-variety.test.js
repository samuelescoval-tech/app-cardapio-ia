const test = require("node:test");
const assert = require("node:assert/strict");
const {
  calcularMinimoVariedadeBebidas,
  garantirVariedadeBebidas
} = require("../src/services/planning/beverage-variety.service");

test("metrica de bebidas cresce por 10 ate 100 e por 50 depois", () => {
  assert.equal(calcularMinimoVariedadeBebidas(10), 3);
  assert.equal(calcularMinimoVariedadeBebidas(80), 8);
  assert.equal(calcularMinimoVariedadeBebidas(100), 10);
  assert.equal(calcularMinimoVariedadeBebidas(150), 11);
  assert.equal(calcularMinimoVariedadeBebidas(300), 14);
  assert.equal(calcularMinimoVariedadeBebidas(500), 18);
});

test("backend completa bebidas sem marcas e diferencia cola com e sem acucar", () => {
  const plano = { cardapio: [], lista_compras: [] };
  const ajustes = garantirVariedadeBebidas(plano, { pessoas: 80, alcool: "Sem alcool" });
  const nomes = plano.cardapio.map(item => item.nome);

  assert.equal(plano.cardapio.length, 8);
  assert.equal(plano.lista_compras.length, 8);
  assert.ok(nomes.includes("Refrigerante sabor cola com açúcar"));
  assert.ok(nomes.includes("Refrigerante sabor cola zero açúcar"));
  assert.equal(nomes.some(nome => /coca|pepsi|heineken/i.test(nome)), false);
  assert.equal(ajustes.length, 8);
});

test("bar completo divide a variedade entre alcoolicas e nao alcoolicas", () => {
  const plano = { cardapio: [], lista_compras: [] };
  garantirVariedadeBebidas(plano, { pessoas: 80, alcool: "Com bar completo" });
  const nomes = plano.cardapio.map(item => item.nome).join(" ");

  assert.equal(plano.cardapio.length, 8);
  assert.match(nomes, /Gin tônica/);
  assert.match(nomes, /Whisky/);
  assert.match(nomes, /Pilsen/);
  assert.match(nomes, /IPA/);
});

test("evento sem alcool remove bebida alcoolica devolvida pela IA", () => {
  const plano = {
    cardapio: [{ id: "cerveja-ia", nome: "Cerveja lager", categoria: "Bebida", descricao: "Alcoólica" }],
    receitas: [],
    lista_compras: [{ item: "Cerveja lager", quantidade: "4 L", setor: "Bebidas", natureza: "bebida", origens: ["cerveja-ia"] }]
  };
  const ajustes = garantirVariedadeBebidas(plano, { pessoas: 10, alcool: "Sem alcool" });

  assert.equal(plano.cardapio.some(item => /cerveja/i.test(item.nome)), false);
  assert.equal(plano.lista_compras.some(item => /cerveja/i.test(item.item)), false);
  assert.equal(plano.cardapio.length, 3);
  assert.match(ajustes.join(" "), /removida porque o evento foi definido sem alcool/i);
});
