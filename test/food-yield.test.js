const test = require("node:test");
const assert = require("node:assert/strict");
const { avaliarRendimentoAlimentar } = require("../src/services/planning/food-yield.service");

function planoComProteina(quantidade) {
  return {
    cardapio: [],
    lista_compras: [{ item: "Carne bovina", quantidade, setor: "Acougue" }]
  };
}

test("5 kg atingem a referencia de proteina de coffee break para 80 pessoas", () => {
  const resultado = avaliarRendimentoAlimentar(planoComProteina("5 kg"), { tipo: "Workshop corporativo", refeicao: "Coffee break", pessoas: 80 });
  const proteina = resultado.verificacoes.find(item => item.id === "proteinas");

  assert.equal(proteina.minimo, 4.8);
  assert.equal(proteina.por_pessoa, 63);
  assert.equal(proteina.conforme, true);
  assert.equal(resultado.status, "conforme");
});

test("5 kg sao insuficientes em almoco para 80 pessoas", () => {
  const resultado = avaliarRendimentoAlimentar(planoComProteina("5 kg"), { tipo: "Evento corporativo", refeicao: "Almoco", pessoas: 80 });
  const proteina = resultado.verificacoes.find(item => item.id === "proteinas");

  assert.equal(proteina.minimo, 16);
  assert.equal(proteina.conforme, false);
  assert.equal(resultado.status, "revisar");
  assert.match(resultado.avisos[0], /5 kg de 16 kg/);
});

test("churrasco exige referencia propria de 350 g por pessoa", () => {
  const resultado = avaliarRendimentoAlimentar(planoComProteina("5 kg"), { tipo: "Aniversario com churrasco", refeicao: "Almoco", pessoas: 80 });
  const proteina = resultado.verificacoes.find(item => item.id === "proteinas");

  assert.equal(proteina.minimo, 28);
  assert.match(proteina.criterio, /350 g por pessoa/);
  assert.equal(resultado.status, "revisar");
});

test("compara unidades salgadas e doces com os totais do motor", () => {
  const resultado = avaliarRendimentoAlimentar({
    cardapio: [
      { categoria: "Entrada", quantidade: "600 un" },
      { categoria: "Sobremesa", quantidade: "300 un" }
    ],
    lista_compras: [{ item: "File de tilapia", quantidade: "5 kg" }]
  }, { tipo: "Coffee break", pessoas: 80 }, {
    alimentacao: [
      { item: "Salgados/canapes", quantidade: "1200 un" },
      { item: "Doces/sobremesas", quantidade: "400 un" }
    ]
  });

  assert.equal(resultado.verificacoes.find(item => item.id === "salgados").conforme, false);
  assert.equal(resultado.verificacoes.find(item => item.id === "doces").conforme, false);
});
