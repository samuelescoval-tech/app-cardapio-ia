const test = require("node:test");
const assert = require("node:assert/strict");
const { validarPlano } = require("../src/utils/validate-plan");
const { aplicarMotorAoPlano } = require("../src/services/planning/motor.service");

function planoValido() {
  const cardapio = Array.from({ length: 8 }, (_, index) => ({
    id: `prato-${index + 1}`,
    nome: `Prato ${index + 1}`,
    categoria: "Entrada",
    tipo_execucao: "preparo",
    quantidade: `${index + 1} kg`,
    ingredientes: [{ item: `Ingrediente ${index + 1}`, quantidade: `${index + 1}`, unidade: "kg" }]
  }));

  return {
    cardapio,
    receitas: cardapio.map(item => ({
      cardapio_id: item.id,
      nome: item.nome,
      ingredientes: item.ingredientes,
      preparo_passos: ["Separar ingredientes", "Preparar", "Finalizar"],
      tempo: "30 min",
      rendimento: "8 porcoes",
      quantidade_total: item.quantidade
    })),
    lista_compras: [
      ...cardapio.map((item, index) => ({
        item: `Ingrediente ${index + 1}`,
        quantidade: `${index + 1} kg`,
        setor: "Mercearia",
        natureza: "ingrediente",
        origens: [item.id]
      })),
      ...Array.from({ length: 4 }, (_, index) => ({
        item: `Material ${index + 1}`,
        quantidade: `${index + 1} un`,
        setor: "Outros",
        natureza: "operacional",
        origens: ["operacao"]
      }))
    ],
    utensilios: [{ item: "Panela", quantidade: "1", uso: "Preparo" }],
    local: Array.from({ length: 4 }, (_, index) => ({ tipo: `Local ${index + 1}` })),
    layout: ["Mesa principal", "Estacao lateral"],
    decoracao: {
      temas: ["Tema 1", "Tema 2"],
      itens: ["Item 1", "Item 2", "Item 3", "Item 4"],
      iluminacao: "Luz indireta",
      campo_extra: "remover"
    },
    cronograma: Array.from({ length: 6 }, (_, index) => ({ hora: `${18 + index}:00`, atividade: `Etapa ${index + 1}` })),
    equipe_obs: ["Organizar equipe", "Repor itens", "Conferir limpeza"],
    entretenimento: ["Playlist", "Atividade 2", "Atividade 3"],
    lembrancinhas: ["Cartao", "Opcao 2", "Opcao 3"],
    checklist: {
      pre: ["Tarefa 1", "Tarefa 2", "Tarefa 3", "Tarefa 4"],
      durante: ["Tarefa 1", "Tarefa 2", "Tarefa 3"],
      pos: ["Tarefa 1", "Tarefa 2"]
    },
    orcamento: { economico: { total: "R$ 1", segredo: "remover" }, medio: {}, sofisticado: {} },
    resumo_chef: "Plano adequado ao evento."
  };
}

test("normaliza somente os campos conhecidos do contrato", () => {
  const entrada = {
    ...planoValido(),
    motor_logistica: { estimativa_total: "valor inventado" },
    instrucao_interna: "campo nao permitido"
  };

  const plano = validarPlano(entrada);

  assert.equal(plano.motor_logistica, null);
  assert.equal(plano.servico_mesa, null);
  assert.equal(Object.hasOwn(plano, "instrucao_interna"), false);
  assert.equal(Object.hasOwn(plano.decoracao, "campo_extra"), false);
  assert.equal(plano.orcamento, null);
  assert.equal(plano.precificacao, null);
  assert.equal(plano.cardapio.length, 8);
});

test("rejeita plano sem campos essenciais", () => {
  const entrada = planoValido();
  delete entrada.resumo_chef;

  assert.throws(() => validarPlano(entrada), /Campos ausentes: resumo_chef/);
});

test("backend aplica o motor oficial depois da validacao", () => {
  const plano = validarPlano({
    ...planoValido(),
    motor_logistica: { estimativa_total: "valor inventado" }
  });
  const motor = {
    estimativa_total: "R$ 5.000",
    servico_mesa: { observacao: "Fonte oficial" },
    precificacao: { status: "aguardando_catalogo", fonte: null }
  };

  const resultado = aplicarMotorAoPlano(plano, motor);

  assert.equal(resultado.motor_logistica, motor);
  assert.equal(resultado.servico_mesa, motor.servico_mesa);
  assert.equal(resultado.orcamento, null);
  assert.equal(resultado.precificacao, motor.precificacao);
});

test("aceita variacao de quantidade sem perder a validacao estrutural", () => {
  const entrada = planoValido();
  entrada.cronograma = entrada.cronograma.slice(0, 5);

  const plano = validarPlano(entrada);

  assert.equal(plano.cronograma.length, 5);
  assert.equal(plano.qualidade_culinaria.avisos.some(aviso => /cronograma/i.test(aviso)), false);
});

test("recupera ingredientes do prato a partir da receita sem inventar conteudo", () => {
  const entrada = planoValido();
  const ingredientesReceita = entrada.receitas[0].ingredientes.map(item => ({ ...item }));
  entrada.cardapio[0].ingredientes = [];

  const plano = validarPlano(entrada);

  assert.deepEqual(plano.cardapio[0].ingredientes, ingredientesReceita);
  assert.match(plano.qualidade_culinaria.ajustes.join(" "), /recuperados da receita/i);
  assert.equal(plano.qualidade_culinaria.avisos.some(aviso => /Ingredientes ausentes no prato/.test(aviso)), false);
});

test("deriva compra quando ingrediente nao estava coberto", () => {
  const entrada = planoValido();
  entrada.lista_compras = entrada.lista_compras.filter(item => item.item !== "Ingrediente 3");

  const plano = validarPlano(entrada);
  const compra = plano.lista_compras.find(item => item.item === "Ingrediente 3");

  assert.equal(compra.quantidade, "3 kg");
  assert.deepEqual(compra.origens, ["prato-3"]);
  assert.equal(compra.derivada_do_cardapio, true);
  assert.equal(plano.qualidade_culinaria.status, "ajustado");
});

test("completa origem de compra consolidada sem descartar o plano", () => {
  const entrada = planoValido();
  entrada.cardapio[1].ingredientes = [{ item: "Ingrediente 1", quantidade: "2", unidade: "kg" }];

  const plano = validarPlano(entrada);
  const compra = plano.lista_compras.find(item => item.item === "Ingrediente 1");

  assert.deepEqual(compra.origens, ["prato-1", "prato-2"]);
  assert.equal(plano.qualidade_culinaria.status, "ajustado");
});

test("avisa quando cardapio fica abaixo da composicao minima", () => {
  const entrada = planoValido();
  const diretrizCulinaria = {
    quantidade_total_minima: 9,
    composicao_minima: [{ category: "Entrada", minimum: 9 }]
  };

  const plano = validarPlano(entrada, { diretrizCulinaria });

  assert.equal(plano.qualidade_culinaria.status, "revisar");
  assert.match(plano.qualidade_culinaria.avisos.join(" "), /8\/9 itens/);
});

test("avisa quando falta categoria sem apagar o evento", () => {
  const entrada = planoValido();
  const diretrizCulinaria = {
    quantidade_total_minima: 8,
    composicao_minima: [{ category: "Sobremesa", minimum: 1 }]
  };

  const plano = validarPlano(entrada, { diretrizCulinaria });

  assert.equal(plano.cardapio.length, 8);
  assert.match(plano.qualidade_culinaria.avisos.join(" "), /Sobremesa 0\/1/);
});

test("recupera quantidade de compra vaga a partir do ingrediente", () => {
  const entrada = planoValido();
  entrada.lista_compras[0].quantidade = "A gosto";

  const plano = validarPlano(entrada);
  const compra = plano.lista_compras.find(item => item.item === "Ingrediente 1");

  assert.equal(compra.quantidade, "1 kg");
  assert.equal(plano.qualidade_culinaria.status, "ajustado");
});

test("consolida plural e singular como a mesma compra", () => {
  const entrada = planoValido();
  entrada.cardapio[0].ingredientes = [{ item: "Tomates", quantidade: "2", unidade: "kg" }];
  entrada.lista_compras[0] = {
    item: "Tomate",
    quantidade: "2 kg",
    setor: "Hortifruti",
    natureza: "ingrediente",
    origens: []
  };

  const plano = validarPlano(entrada);
  const comprasTomate = plano.lista_compras.filter(item => /tomate/i.test(item.item));

  assert.equal(comprasTomate.length, 1);
  assert.deepEqual(comprasTomate[0].origens, ["prato-1"]);
});

test("aceita item pronto para servir sem receita propria", () => {
  const entrada = planoValido();
  entrada.cardapio[0].tipo_execucao = "pronto";
  entrada.receitas = entrada.receitas.filter(receita => receita.cardapio_id !== "prato-1");

  const plano = validarPlano(entrada);

  assert.equal(plano.receitas.length, 7);
});

test("aceita bebida pronta sem lista artificial de ingredientes", () => {
  const entrada = planoValido();
  entrada.cardapio[0].categoria = "Bebida";
  entrada.cardapio[0].tipo_execucao = "pronto";
  entrada.cardapio[0].ingredientes = [];
  entrada.receitas = entrada.receitas.filter(receita => receita.cardapio_id !== "prato-1");

  const plano = validarPlano(entrada);

  assert.equal(plano.qualidade_culinaria.avisos.some(aviso => /Ingredientes ausentes/.test(aviso)), false);
});

test("avisa sobre receita ausente sem descartar o evento", () => {
  const entrada = planoValido();
  entrada.receitas = entrada.receitas.filter(receita => receita.cardapio_id !== "prato-2");

  const plano = validarPlano(entrada);

  assert.equal(plano.cardapio.length, 8);
  assert.equal(plano.qualidade_culinaria.cobertura.receitas_cobertas, 7);
  assert.match(plano.qualidade_culinaria.avisos.join(" "), /Receita ausente para Prato 2/);
});

test("recupera ingredientes e quantidade total da receita a partir do prato", () => {
  const entrada = planoValido();
  entrada.receitas[0].ingredientes = [];
  entrada.receitas[0].quantidade_total = "";

  const plano = validarPlano(entrada);
  const receita = plano.receitas[0];

  assert.deepEqual(receita.ingredientes, plano.cardapio[0].ingredientes);
  assert.equal(receita.quantidade_total, plano.cardapio[0].quantidade);
  assert.equal(plano.qualidade_culinaria.status, "ajustado");
});
