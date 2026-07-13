const test = require("node:test");
const assert = require("node:assert/strict");
const { obterDiretrizCulinaria, validarTaxonomiaCulinaria } = require("../src/services/planning/culinary-matrix.service");

test("seleciona composicao de churrasco antes do perfil generico", () => {
  const diretriz = obterDiretrizCulinaria({ tipo: "Churrasco de aniversario", tema: "Boteco" });

  assert.equal(diretriz.perfil, "churrasco");
  assert.ok(diretriz.composicao_minima.find(item => item.category === "Prato Principal" && item.minimum === 4));
  assert.match(diretriz.orientacoes.join(" "), /petiscos brasileiros/i);
  assert.deepEqual(diretriz.momentos_servico.slice(0, 2), ["petiscos enquanto a grelha inicia", "primeira rodada de grelhados"]);
  assert.ok(diretriz.comidas_tipicas.Acompanhamento.includes("farofa"));
  assert.equal(diretriz.modificador_tema.id, "boteco_brasileiro");
  assert.ok(diretriz.fontes.length >= 3);
});

test("perfil-base do evento nao e substituido por refeicao ou tema", () => {
  const diretriz = obterDiretrizCulinaria({
    tipo: "Casamento",
    refeicao: "Coffee break",
    tema: "Boteco brasileiro"
  });

  assert.equal(diretriz.perfil, "casamento_refeicao");
  assert.equal(diretriz.modificador_refeicao.id, "coffee_break");
  assert.equal(diretriz.modificador_tema.id, "boteco_brasileiro");
  assert.match(diretriz.identidade_evento, /celebracao/i);
  assert.ok(diretriz.elementos_esperados.includes("duas bases de prato principal"));
});

test("bar completo amplia a composicao minima de bebidas", () => {
  const diretriz = obterDiretrizCulinaria({
    tipo: "Casamento",
    refeicao: "Almoco ou jantar",
    alcool: "Com bar completo"
  });
  const bebidas = diretriz.composicao_minima.find(item => item.category === "Bebida");

  assert.equal(bebidas.minimum, 4);
  assert.equal(diretriz.quantidade_total_minima, 15);
});

test("atendimento domiciliar recebe perfil proprio e modificador de brunch", () => {
  const diretriz = obterDiretrizCulinaria({
    tipo: "Atendimento domiciliar",
    refeicao: "Brunch / cafe da manha",
    tema: "Familiar"
  });

  assert.equal(diretriz.perfil, "atendimento_domiciliar");
  assert.equal(diretriz.quantidade_total_minima, 13);
  assert.equal(diretriz.modificador_refeicao.id, "brunch_cafe_manha");
  assert.equal(diretriz.modificador_tema.id, "familiar");
  assert.ok(diretriz.comidas_tipicas["Boas-vindas"].length >= 2);
});

test("todos os perfis possuem contrato de identidade culinaria do plano 6", () => {
  const matriz = require("../data/culinary/matrix.json");
  const ids = new Set();

  for (const perfil of matriz.profiles) {
    assert.equal(ids.has(perfil.id), false, `perfil duplicado: ${perfil.id}`);
    ids.add(perfil.id);
    assert.ok(perfil.identity.length >= 40);
    assert.ok(perfil.service_moments.length >= 4);
    assert.ok(perfil.required_features.length >= 4);
    assert.ok(Object.keys(perfil.typical_foods).length >= 4);
    assert.ok(perfil.optional_features.length >= 3);
    assert.ok(perfil.avoid.length >= 2);
  }

  assert.deepEqual(validarTaxonomiaCulinaria(matriz), []);
});

test("observacao livre nao substitui o perfil-base do evento", () => {
  const diretriz = obterDiretrizCulinaria({
    tipo: "Casamento",
    refeicao: "Almoco ou jantar",
    obs: "Ter uma estacao inspirada em churrasco"
  });

  assert.equal(diretriz.perfil, "casamento_refeicao");
});

test("opcoes avancadas adicionam orientacoes sem trocar o perfil-base", () => {
  const diretriz = obterDiretrizCulinaria({
    tipo: "Casamento",
    refeicao: "Almoco ou jantar",
    horarioInicio: "19:30",
    formatoServico: "Empratado",
    faixaEtaria: "Adultos e idosos",
    infraestrutura: "Cozinha de apoio limitada",
    prioridade: "Conforto dos convidados"
  });

  assert.equal(diretriz.perfil, "casamento_refeicao");
  assert.equal(diretriz.contexto_operacional.horario_inicio, "19:30");
  assert.match(diretriz.contexto_operacional.orientacoes.join(" "), /Inicio noturno/i);
  assert.match(diretriz.contexto_operacional.orientacoes.join(" "), /Servico empratado/i);
  assert.match(diretriz.contexto_operacional.orientacoes.join(" "), /Cozinha limitada/i);
  assert.match(diretriz.contexto_operacional.orientacoes.join(" "), /Prioridade conforto/i);
});

test("usa perfil geral quando o evento nao tem correspondencia", () => {
  const diretriz = obterDiretrizCulinaria({ tipo: "Encontro comunitario" });

  assert.equal(diretriz.perfil, "evento_refeicao_geral");
});

test("seleciona catalogo curado sem URLs no prompt e amplia restricoes quando necessario", () => {
  const geral = obterDiretrizCulinaria({ tipo: "Jantar" });
  const restrito = obterDiretrizCulinaria({ tipo: "Jantar", restricoes: "Pessoa celiaca, sem gluten" });

  assert.equal(geral.matriz_version, "2026-07-12-plan6");
  assert.equal(geral.catalogo_fontes_version, "2026-07-12");
  assert.ok(geral.fontes.some(fonte => fonte.qualidade === "official"));
  assert.ok(geral.fontes.some(fonte => fonte.qualidade === "editorial"));
  assert.equal(geral.fontes.some(fonte => Object.hasOwn(fonte, "url")), false);
  assert.ok(restrito.fontes.some(fonte => fonte.id === "embrapa-sem-gluten"));
});
