const test = require("node:test");
const assert = require("node:assert/strict");
const { obterDiretrizCulinaria } = require("../src/services/planning/culinary-matrix.service");
const { validarHistoricoCulinario, MAX_EVENTOS, MAX_PRATOS } = require("../src/utils/validate-culinary-history");
const {
  criarContextoVariedade,
  avaliarVariedadePlano,
  normalizarAssinaturaPrato,
  saoPratosSemelhantes
} = require("../src/services/planning/culinary-variety.service");

const eventoInfantil = {
  tipo: "Festa infantil",
  refeicao: "Coquetel / Finger food",
  tema: "Circo colorido"
};

test("historico culinario aceita somente memoria compacta e limitada", () => {
  const entradas = Array.from({ length: MAX_EVENTOS + 2 }, (_, indice) => ({
    evento: { tipo: ` Festa ${indice}\u0000 `, refeicao: "Coquetel", tema: "Circo" },
    pratos: Array.from({ length: MAX_PRATOS + 3 }, (_, prato) => ({ nome: ` Prato ${prato} `, categoria: "Entrada" })),
    receitas: ["nao deve entrar"]
  }));

  const validado = validarHistoricoCulinario(entradas);

  assert.equal(validado.length, MAX_EVENTOS);
  assert.equal(validado[0].pratos.length, MAX_PRATOS);
  assert.equal(Object.hasOwn(validado[0], "receitas"), false);
  assert.equal(validado[0].evento.tipo, "Festa 0");
});

test("contexto usa somente perfil e refeicao equivalentes", () => {
  const diretriz = obterDiretrizCulinaria(eventoInfantil);
  const contexto = criarContextoVariedade(eventoInfantil, diretriz, [
    {
      evento: eventoInfantil,
      pratos: [
        { nome: "Bolo de Aniversario", categoria: "Sobremesa" },
        { nome: "Mini Pizza Gourmet", categoria: "Prato Principal" },
        { nome: "Suco de Uva", categoria: "Bebida" }
      ]
    },
    {
      evento: { tipo: "Casamento", refeicao: "Almoco ou jantar", tema: "Circo" },
      pratos: [{ nome: "Mini Pizza Gourmet", categoria: "Entrada" }]
    }
  ]);

  assert.equal(contexto.historicos_considerados, 1);
  assert.ok(contexto.repeticoes_essenciais.some(item => /Bolo/.test(item.nome)));
  assert.ok(contexto.evitar_repetir.some(item => /Mini Pizza/.test(item.nome)));
  assert.equal(contexto.evitar_repetir.find(item => /Mini Pizza/.test(item.nome)).ocorrencias, 1);
});

test("auditoria diferencia prato novo, repeticao essencial e repeticao evitavel", () => {
  const diretriz = obterDiretrizCulinaria(eventoInfantil);
  const contexto = criarContextoVariedade(eventoInfantil, diretriz, [{
    evento: eventoInfantil,
    pratos: [
      { nome: "Bolo de Aniversario", categoria: "Sobremesa" },
      { nome: "Mini Pizza Gourmet", categoria: "Prato Principal" }
    ]
  }]);
  const auditoria = avaliarVariedadePlano({ cardapio: [
    { nome: "Bolo de Aniversario", categoria: "Sobremesa" },
    { nome: "Mini Pizza Especial", categoria: "Prato Principal" },
    { nome: "Salada de Frutas", categoria: "Acompanhamento" }
  ] }, contexto);

  assert.equal(normalizarAssinaturaPrato("Mini Pizza Gourmet"), "pizza");
  assert.equal(saoPratosSemelhantes("Pudim de Leite", "Pudim de Leite Condensado"), true);
  assert.equal(saoPratosSemelhantes("Maionese de Batata", "Salada de Batata com Maionese"), true);
  assert.equal(saoPratosSemelhantes("Mini Pão de Queijo Mineiro", "Mini pães de queijo artesanais"), true);
  assert.equal(saoPratosSemelhantes("Pipoca de Leite Ninho", "Pipocas salgadas"), true);
  assert.equal(saoPratosSemelhantes("Mini Pizza de Marguerita", "Mini pizzas de mussarela"), true);
  assert.equal(saoPratosSemelhantes("Palitos de Cenoura e Pepino", "Palitos de Cenoura Assada"), false);
  assert.equal(saoPratosSemelhantes("Espetinho de Queijo e Tomate", "Canape de Queijo Fresco e Tomate Cereja"), false);
  assert.equal(saoPratosSemelhantes("Mandioca Frita", "Mandioca Cozida na Manteiga"), false);
  assert.equal(auditoria.status, "revisar");
  assert.equal(auditoria.pratos_novos, 1);
  assert.equal(auditoria.repeticoes_justificadas.length, 1);
  assert.equal(auditoria.repeticoes_a_revisar.length, 1);
});
