const test = require("node:test");
const assert = require("node:assert/strict");
const { gerarPlanoEmBlocos } = require("../src/services/ai/split-planning.service");

function serviceCom(respostas) {
  let indice = 0;
  return { async gerarEstrutura() { return respostas[indice++]; } };
}

const meta = { requested_model: "modelo", model_version: "modelo", finish_reason: "STOP", prompt_tokens: 10, output_tokens: 10, total_tokens: 20 };

test("orquestrador recompõe e valida um plano gerado em blocos", async () => {
  const menuService = serviceCom([{ ok: true, meta, dados: {
    resumo_chef: "Evento familiar com refeicao completa e operacao revisavel.",
    cardapio: [{
      id: "prato-1", nome: "Arroz festivo", categoria: "Prato Principal", tipo_execucao: "preparo",
      descricao: "Arroz com legumes", quantidade: "5 kg", ingredientes: [{ item: "Arroz", quantidade: "5", unidade: "kg" }]
    }]
  } }]);
  const detailService = serviceCom([
    { ok: true, meta, dados: { receitas: [{ cardapio_id: "prato-1", nome: "Arroz festivo", ingredientes: [{ item: "Arroz", quantidade: "5", unidade: "kg" }], preparo_passos: ["Separar.", "Cozinhar.", "Finalizar."], tempo: "60 min", rendimento: "20 porcoes", quantidade_total: "5 kg" }] } },
    { ok: true, meta, dados: {
      local: Array.from({ length: 4 }, (_, i) => ({ nome: `Local ${i + 1}`, tipo: "Salao", capacidade: "20", observacao: "Visitar" })),
      layout: ["Buffet lateral", "Mesas centrais"],
      decoracao: { temas: ["Natural", "Contemporaneo"], itens: ["Flores", "Toalhas", "Placas", "Velas"], iluminacao: "Luz quente" },
      cronograma: Array.from({ length: 4 }, (_, i) => ({ hora: `${12 + i}:00`, atividade: `Etapa ${i + 1}`, descricao: "Servico" })),
      utensilios: [{ item: "Travessa", quantidade: "4", uso: "Servico" }],
      equipe_obs: ["Briefing", "Reposicao", "Encerramento"],
      entretenimento: ["Musica", "Fotos", "Atividade"],
      lembrancinhas: ["Cartao", "Doce", "Foto"],
      checklist: { pre: ["1", "2", "3", "4"], durante: ["1", "2", "3"], pos: ["1", "2"] }
    } }
  ]);

  const resposta = await gerarPlanoEmBlocos({
    evento: { tipo: "Almoco", pessoas: 20, restricoes: "Nenhuma" },
    motor: { duracao: "4h", espaco: "40m2", perfil: "Almoco" },
    diretriz: { quantidade_total_minima: 1, composicao_minima: [{ category: "Prato Principal", minimum: 1 }], pedidos_culinarios_explicitos: [] },
    menuService,
    detailService
  });

  assert.equal(resposta.ok, true);
  assert.equal(resposta.plano.cardapio.length, 1);
  assert.equal(resposta.plano.receitas.length, 1);
  assert.equal(resposta.plano.lista_compras[0].item, "Arroz");
  assert.equal(resposta.meta.generation_mode, "split");
  assert.equal(resposta.meta.total_tokens, 60);
});

test("orquestrador interrompe quando o cardapio nao conclui", async () => {
  const resposta = await gerarPlanoEmBlocos({
    evento: {}, motor: {}, diretriz: {},
    menuService: serviceCom([{ ok: false, meta: { ...meta, erro: "JSON incompleto" }, dados: null }]),
    detailService: serviceCom([{ ok: false, meta: { ...meta, erro: "JSON incompleto" }, dados: null }])
  });
  assert.equal(resposta.ok, false);
  assert.equal(resposta.meta.etapa_falha, "cardapio");
  assert.equal(resposta.plano.qualidade_culinaria.status, "falha");
});

test("orquestrador usa o modelo de detalhe como fallback do cardapio", async () => {
  const menuService = serviceCom([{ ok: false, meta: { ...meta, erro: "503" }, dados: null }]);
  const detailService = serviceCom([
    { ok: true, meta, dados: { resumo_chef: "Resumo", cardapio: [{ id: "p1", nome: "Suco", categoria: "Bebida", tipo_execucao: "pronto", quantidade: "2 L", ingredientes: [] }] } },
    { ok: true, meta, dados: { receitas: [] } },
    { ok: true, meta, dados: { local: [], layout: [], decoracao: {}, cronograma: [], utensilios: [], equipe_obs: [], entretenimento: [], lembrancinhas: [], checklist: {} } }
  ]);
  const resposta = await gerarPlanoEmBlocos({
    evento: {}, motor: {},
    diretriz: { quantidade_total_minima: 1, composicao_minima: [{ category: "Bebida", minimum: 1 }] },
    menuService, detailService
  });
  assert.equal(resposta.ok, true);
  assert.equal(resposta.meta.fallback_menu, true);
  assert.equal(resposta.plano.cardapio[0].nome, "Suco");
});
