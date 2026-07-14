const test = require("node:test");
const assert = require("node:assert/strict");
const { obterDiretrizCulinaria, validarTaxonomiaCulinaria, extrairPedidosCulinarios } = require("../src/services/planning/culinary-matrix.service");

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

test("estilo premium amplia todas as categorias e aplica contrato verificavel", () => {
  const diretriz = obterDiretrizCulinaria({
    tipo: "Workshop corporativo de tecnologia",
    refeicao: "Coffee break",
    estilo: "Premium"
  });

  assert.equal(diretriz.perfil, "corporativo_coffee_break");
  assert.equal(diretriz.modificador_estilo.id, "premium");
  assert.equal(diretriz.quantidade_total_minima, 17);
  assert.deepEqual(diretriz.composicao_minima.map(item => item.minimum), [5, 3, 4, 5]);
  assert.ok(diretriz.elementos_esperados.includes("estacao de bebidas especiais quando compativel"));
  assert.ok(diretriz.evitar_no_perfil.includes("cha em sache"));
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

test("ocasiao de debutante amplia aniversario sem substituir o perfil-base", () => {
  const diretriz = obterDiretrizCulinaria({
    tipo: "Aniversario de debutante",
    refeicao: "Almoco com churrasco",
    tema: "Festa de 15 anos elegante",
    obs: "Bolo, brigadeiro, beijinho, alcatra e baiao de dois"
  });
  const principais = diretriz.composicao_minima.find(item => item.category === "Prato Principal");
  const bebidas = diretriz.composicao_minima.find(item => item.category === "Bebida");

  assert.equal(diretriz.perfil, "aniversario_geral");
  assert.equal(diretriz.modificador_ocasiao.id, "debutante_15_anos");
  assert.equal(diretriz.modificador_refeicao.id, "almoco_com_churrasco");
  assert.equal(principais.minimum, 4);
  assert.equal(bebidas.minimum, 4);
  assert.ok(diretriz.quantidade_total_minima >= 20);
  assert.ok(diretriz.elementos_esperados.includes("espaco de cerimonia, coreografia ou danca"));
});

test("ocasioes sazonais usam a mesma camada extensivel", () => {
  const casos = [
    ["Ceia de Natal", "natal", /rabanada/i],
    ["Reveillon de Ano Novo", "ano_novo", /brinde/i],
    ["Almoco de Pascoa", "pascoa", /bacalhau/i],
    ["Baile de Carnaval", "carnaval", /hidratacao/i]
  ];

  casos.forEach(([tipo, id, sinal]) => {
    const diretriz = obterDiretrizCulinaria({ tipo });
    assert.equal(diretriz.modificador_ocasiao.id, id);
    assert.match(JSON.stringify(diretriz.modificador_ocasiao), sinal);
  });
});

test("extrai alimentos nomeados sem confundir a ocasiao com o pedido", () => {
  const pedidos = extrairPedidosCulinarios({
    tipo: "Aniversario de debutante",
    tema: "Elegante",
    obs: "Quero alcatra, patinho, linguica, frango, baiao de dois, bolo, brigadeiros e beijinhos."
  }).map(item => item.item);

  assert.deepEqual(pedidos, ["alcatra", "patinho", "linguica", "frango", "baiao de dois", "bolo", "brigadeiro", "beijinho"]);
});

test("termo especifico nao cria pedido generico duplicado", () => {
  const pedidos = extrairPedidosCulinarios({ obs: "Servir agua de coco gelada." }).map(item => item.item);

  assert.deepEqual(pedidos, ["agua de coco"]);
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

  assert.equal(geral.matriz_version, "2026-07-13-premium-contract");
  assert.equal(geral.catalogo_fontes_version, "2026-07-12");
  assert.ok(geral.fontes.some(fonte => fonte.qualidade === "official"));
  assert.ok(geral.fontes.some(fonte => fonte.qualidade === "editorial"));
  assert.equal(geral.fontes.some(fonte => Object.hasOwn(fonte, "url")), false);
  assert.ok(restrito.fontes.some(fonte => fonte.id === "embrapa-sem-gluten"));
});
