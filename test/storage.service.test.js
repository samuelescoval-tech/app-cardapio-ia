const test = require("node:test");
const assert = require("node:assert/strict");
const {
  extrairResumoPlano,
  normalizarEntradaHistorico,
  planoTemConteudo,
  prepararPlanoParaHistorico,
  criarMemoriaCulinaria,
  persistirHistoricoComLimite
} = require("../public/js/storage.service");

test("reconhece planejamento com conteudo e rejeita fallback vazio", () => {
  assert.equal(planoTemConteudo({ cardapio: [{ nome: "Prato" }] }), true);
  assert.equal(planoTemConteudo({ cardapio: [], receitas: [], lista_compras: [], cronograma: [] }), false);
});

test("normaliza entrada antiga sem apagar campos desconhecidos", () => {
  const entrada = normalizarEntradaHistorico({
    data: "2026-07-01T10:00:00.000Z",
    evento: { tipo: "Brunch", pessoas: 5 },
    planejamento: { cardapio: [{ nome: "Ovos Benedict" }] },
    campo_legado: "preservar"
  }, 2);

  assert.equal(entrada.id, "evento_legado_2");
  assert.equal(entrada.tipo, "Brunch");
  assert.equal(entrada.pessoas, 5);
  assert.equal(entrada.plano_valido, true);
  assert.equal(entrada.campo_legado, "preservar");
});

test("normaliza historico novo preservando opcoes avancadas", () => {
  const entrada = normalizarEntradaHistorico({
    evento: {
      tipo: "Casamento",
      pessoas: 80,
      horarioInicio: "19:30",
      formatoServico: "Empratado",
      infraestrutura: "Cozinha de apoio limitada"
    },
    plano: { cardapio: [{ nome: "Entrada" }] }
  });

  assert.equal(entrada.evento.horarioInicio, "19:30");
  assert.equal(entrada.evento.formatoServico, "Empratado");
  assert.equal(entrada.evento.infraestrutura, "Cozinha de apoio limitada");
});

test("resumo usa contrato atual de cardapio e compras", () => {
  assert.equal(
    extrairResumoPlano({ cardapio: [{}, {}], lista_compras: [{}, {}, {}] }),
    "2 pratos • 3 itens de compra"
  );
});

test("remove referencias visuais antes de persistir o planejamento", () => {
  const plano = {
    cardapio: [{ nome: "Prato" }],
    imagens_evento: [{ image_url: "https://exemplo.test/imagem.jpg" }],
    visual_references: { provider: "openverse" },
    referencias_visuais: ["transitorio"],
    galeria_evento: { images: [] }
  };
  const persistivel = prepararPlanoParaHistorico(plano);

  assert.deepEqual(persistivel.cardapio, plano.cardapio);
  assert.equal("imagens_evento" in persistivel, false);
  assert.equal("visual_references" in persistivel, false);
  assert.equal("referencias_visuais" in persistivel, false);
  assert.equal("galeria_evento" in persistivel, false);
  assert.equal("imagens_evento" in plano, true);
});

test("persistencia preserva o plano completo e remove somente registros antigos quando falta espaco", () => {
  const storage = {
    valor: null,
    setItem(chave, valor) {
      if (valor.length > 650) throw new Error("QuotaExceededError");
      this.valor = valor;
    },
    getItem() { return this.valor; }
  };
  const nova = {
    id: "novo",
    plano: {
      cardapio: [{ nome: "Prato principal", ingredientes: [{ item: "Carne", quantidade: "16 kg" }] }],
      receitas: [{ nome: "Prato principal", preparo_passos: ["Passo 1", "Passo 2", "Passo 3", "Passo 4"] }]
    }
  };
  const antigos = Array.from({ length: 5 }, (_, indice) => ({
    id: `antigo-${indice}`,
    plano: { cardapio: [{ nome: "x".repeat(100) }] }
  }));

  const resultado = persistirHistoricoComLimite(storage, [nova, ...antigos]);

  assert.equal(resultado.historico[0].id, "novo");
  assert.deepEqual(resultado.historico[0].plano, nova.plano);
  assert.ok(resultado.removidos > 0);
});

test("memoria culinaria envia somente contexto e nomes de pratos", () => {
  const memoria = criarMemoriaCulinaria([{
    tipo: "Festa infantil",
    plano_valido: true,
    evento: { tipo: "Festa infantil", refeicao: "Coquetel", tema: "Circo", obs: "privado", pessoas: 30 },
    plano: {
      cardapio: [{ nome: "Mini pizza", categoria: "Principal", ingredientes: ["nao enviar"] }],
      receitas: [{ nome: "nao enviar" }],
      lista_compras: [{ item: "nao enviar" }]
    }
  }]);

  assert.deepEqual(memoria, [{
    evento: { tipo: "Festa infantil", refeicao: "Coquetel", tema: "Circo" },
    pratos: [{ nome: "Mini pizza", categoria: "Principal" }]
  }]);
  assert.equal(JSON.stringify(memoria).includes("privado"), false);
  assert.equal(JSON.stringify(memoria).includes("ingredientes"), false);
});

test("memoria culinaria maxima permanece abaixo do limite do corpo da API", () => {
  const historico = Array.from({ length: 8 }, (_, indice) => ({
    tipo: `Evento ${indice}`,
    plano_valido: true,
    evento: { tipo: `Evento ${indice}`, refeicao: "Coquetel / Finger food", tema: "Tema contemporaneo" },
    plano: {
      cardapio: Array.from({ length: 25 }, (_, prato) => ({
        nome: `Prato ${prato} ${"x".repeat(100)}`,
        categoria: `Categoria ${"y".repeat(40)}`
      }))
    }
  }));
  const corpo = JSON.stringify({
    evento: { tipo: "Evento atual", pessoas: 100 },
    historico_culinario: criarMemoriaCulinaria(historico)
  });

  assert.ok(Buffer.byteLength(corpo, "utf8") < 20 * 1024);
});
