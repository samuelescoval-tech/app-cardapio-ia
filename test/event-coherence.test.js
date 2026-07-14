const test = require("node:test");
const assert = require("node:assert/strict");
const catalogo = require("../data/culinary/event-contexts.json");
const {
  construirContextoEvento,
  construirBlocosCardapio,
  validarCatalogoContextos
} = require("../src/services/planning/event-coherence.service");

test("contexto corporativo premium combina cultura, estilo, restricoes e orcamento", () => {
  const contexto = construirContextoEvento({
    tipo: "Workshop corporativo de tecnologia",
    tema: "Tropical",
    refeicao: "Coffee break",
    estilo: "Premium",
    restricoes: "8 vegetarianos, 4 sem lactose e 2 sem gluten",
    orcamentoBase: "R$ 30.000"
  });

  assert.equal(contexto.tipologia_reconhecida, "corporativo");
  assert.deepEqual(contexto.camadas_aplicadas, ["corporativo", "tropical"]);
  assert.equal(contexto.estilo, "premium");
  assert.ok(contexto.blocos_bebidas_esperados.includes("cafes"));
  assert.ok(contexto.cores_coerentes.includes("cores da marca"));
  assert.ok(contexto.sinais_premium.includes("estacao de cafe especial"));
  assert.deepEqual(contexto.restricoes_alimentares.map(item => item.id), ["sem_lactose", "sem_gluten", "vegetariano"]);
  assert.equal(contexto.orcamento.status, "orientador_sem_cotacao");
  assert.equal(contexto.orcamento.valor_informado, "R$ 30.000");
  assert.match(contexto.orcamento.regra, /sem inventar precos/i);
});

test("perfil-base permanece principal quando tema e refeicao adicionam camadas", () => {
  const contexto = construirContextoEvento({
    tipo: "Casamento",
    tema: "Tropical",
    refeicao: "Brunch / cafe da manha",
    estilo: "Elegante"
  });

  assert.equal(contexto.tipologia_reconhecida, "casamento");
  assert.deepEqual(contexto.camadas_aplicadas, ["casamento", "tropical", "brunch"]);
  assert.match(contexto.significado_social_cultural, /formal e cerimonial/i);
  assert.ok(contexto.blocos_alimentares_esperados.includes("canapes e boas-vindas"));
  assert.ok(contexto.blocos_alimentares_esperados.includes("frutas tropicais"));
});

test("blocos agrupam variacoes sem perder ids operacionais", () => {
  const cardapio = [
    { id: "suco-1", nome: "Suco natural de laranja", categoria: "Bebida" },
    { id: "suco-2", nome: "Suco natural de uva", categoria: "Bebida" },
    { id: "refri-1", nome: "Refrigerante de cola", categoria: "Bebida" },
    { id: "boi-1", nome: "Picanha grelhada", categoria: "Prato Principal" },
    { id: "boi-2", nome: "Alcatra grelhada", categoria: "Prato Principal" },
    { id: "suino-1", nome: "Linguica artesanal", categoria: "Prato Principal" },
    { id: "doce-1", nome: "Brigadeiro", categoria: "Sobremesa" },
    { id: "doce-2", nome: "Beijinho", categoria: "Sobremesa" }
  ];
  const blocos = construirBlocosCardapio(cardapio, { tipo: "Aniversario com churrasco", estilo: "Premium" });

  assert.equal(blocos.length, 5);
  assert.deepEqual(blocos.find(item => item.id === "refrigerantes").itens, ["refri-1"]);
  assert.deepEqual(blocos.find(item => item.id === "sucos_naturais").itens, ["suco-1", "suco-2"]);
  assert.deepEqual(blocos.find(item => item.id === "carnes_bovinas").itens, ["boi-1", "boi-2"]);
  assert.equal(blocos.find(item => item.id === "carnes_suinas").quantidade_itens, 1);
  assert.equal(blocos.find(item => item.id === "doces").nome, "Doces de festa e mini sobremesas");
  assert.deepEqual(blocos.flatMap(item => item.itens).sort(), cardapio.map(item => item.id).sort());
});

test("catalogo de contextos possui contrato valido", () => {
  assert.deepEqual(validarCatalogoContextos(catalogo), []);
});
