// Suite consolidada por dominio. Cada bloco preserva o escopo do arquivo original.

// -----------------------------------------------------------------------------
// Origem consolidada: gallery-ui.test.js
// -----------------------------------------------------------------------------
{
const test = require("node:test");
const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");
const vm = require("node:vm");

const raiz = path.join(__dirname, "..");
const ler = arquivo => fs.readFileSync(path.join(raiz, arquivo), "utf8");

test("galeria consulta imagens somente depois de um plano valido", () => {
  const app = ler("public/js/app.js");
  const inicioSucesso = app.indexOf("const dadosIA = resposta.plano || resposta");
  const renderPlano = app.indexOf("exibirResultadoLuxo(dadosIA, pessoas, evento)", inicioSucesso);
  const planoValido = app.indexOf('resultadoArea.dataset.planoValido = "true"', renderPlano);
  const consulta = app.indexOf("void carregarImagensEvento(evento", planoValido);

  assert.ok(inicioSucesso >= 0);
  assert.ok(renderPlano > inicioSucesso);
  assert.ok(planoValido > renderPlano);
  assert.ok(consulta > planoValido);
  assert.match(app, /fetch\("\/api\/imagens-evento"/);
});

test("servico de preferencias visuais carrega antes do renderizador", () => {
  const html = ler("public/index.html");
  const feedback = html.indexOf('src="js/visual-feedback.service.js"');
  const render = html.indexOf('src="js/render.js"');

  assert.ok(feedback >= 0);
  assert.ok(render > feedback);
});

test("historico usa referencias locais e nao repete consulta externa", () => {
  const app = ler("public/js/app.js");
  const inicio = app.indexOf("function carregarDoHistorico");
  const fim = app.indexOf("function definirValorCampo", inicio);
  const carregar = app.slice(inicio, fim);

  assert.match(carregar, /cancelarConsultaVisualPendente\(\)/);
  assert.match(carregar, /renderizarGaleriaHistorico\(\)/);
  assert.doesNotMatch(carregar, /carregarImagensEvento|\/api\/imagens-evento/);
  assert.match(carregar, /Nenhuma nova gera[cç][aã]o foi realizada/);
  assert.match(app, /<button type="button" class="historico-btn-carregar"/);
  assert.match(app, /<button type="button" class="historico-btn-deletar"/);
});

test("cartoes preservam credito, licenca, fonte segura e fallback local", () => {
  const render = ler("public/js/render.js");

  assert.match(render, /target="_blank" rel="noopener noreferrer"/);
  assert.match(render, /loading="lazy" decoding="async" referrerpolicy="no-referrer"/);
  assert.match(render, /data-gallery-fallback=/);
  assert.match(render, /addEventListener\("error"/);
  assert.match(render, /aria-live="polite" aria-busy="true"/);
  assert.match(render, /function trocarImagemGaleria/);
  assert.match(render, /function ocultarImagemGaleria/);
  assert.match(render, /function avaliarImagemGaleria/);
  assert.match(render, /Adequada/);
  assert.match(render, /Generica/);
  assert.match(render, /Inadequada/);
  assert.match(render, /Trocar imagem/);
  assert.doesNotMatch(render, /onerror=/i);
});

test("cardapio renderiza itens individuais e recebe imagens da galeria", () => {
  const render = ler("public/js/render.js");

  assert.match(render, /cardapio\.map\(\(item, i\)/);
  assert.match(render, /class="dish-card-rich menu-item-card"/);
  assert.match(render, /data-dish-image/);
  assert.match(render, /data-dish-id=/);
  assert.match(render, /class="dish-placeholder"/);
  assert.match(render, /imagem\.target_id/);
  assert.match(render, /function aplicarImagensAoCardapio/);
  assert.match(render, /Fontes das imagens do cardapio/);
  assert.match(render, /Ver fontes e avaliar/);
  assert.match(render, /eventGalleryDetails/);
  assert.doesNotMatch(render, /blocos\.map\(\(bloco, i\)/);
});

test("PDF usa paginas visuais resumidas em vez de despejo integral", () => {
  const render = ler("public/js/render.js");
  const inicio = render.indexOf("function baixarRelatorioPDF");
  const fim = render.indexOf("function textoPDFItem", inicio);
  const pdf = render.slice(inicio, fim);

  assert.match(pdf, /Visao geral/);
  assert.match(pdf, /Rendimento e compras/);
  assert.match(pdf, /Fichas de preparo/);
  assert.match(pdf, /Operacao e conferencia/);
  assert.match(pdf, /roundedRect/);
  assert.doesNotMatch(pdf, /Coerencia aplicada ao evento|Variedade culinaria|Opcoes de local|Lembrancinhas/);
});

test("normalizacao visual rejeita protocolo inseguro e caminho local arbitrario", () => {
  const contexto = { URL, console, window: {} };
  vm.createContext(contexto);
  vm.runInContext(ler("public/js/render.js"), contexto);

  const externaInsegura = contexto.normalizarImagemEvento({
    id: "x",
    slot: "capa",
    provider: "openverse",
    image_url: "http://example.test/image.jpg",
    source_url: "https://example.test/source"
  });
  const localArbitraria = contexto.normalizarImagemEvento({
    id: "x",
    slot: "capa",
    provider: "local",
    image_url: "/images/fallback/../segredo.svg"
  });
  const externaSegura = contexto.normalizarImagemEvento({
    id: "x",
    slot: "capa",
    provider: "openverse",
    image_url: "https://images.example.test/image.jpg",
    source_url: "https://example.test/source",
    creator: "Autora",
    license: "by",
    attribution: "Credito",
    alt: "Mesa"
  });

  assert.equal(externaInsegura, null);
  assert.equal(localArbitraria, null);
  assert.equal(externaSegura.provider, "openverse");
  assert.equal(externaSegura.license, "BY");
});

test("galeria oferece carrossel, lista e adaptacao para celular", () => {
  const render = ler("public/js/render.js");
  const css = ler("public/css/modules/result.css");

  assert.match(render, /function alternarVisualizacaoGaleria/);
  assert.match(render, /function rolarGaleria/);
  assert.match(render, /data-gallery-view="carousel"/);
  assert.match(render, /data-gallery-view="list"/);
  assert.match(css, /\.event-gallery-track\{[\s\S]+?scroll-snap-type:x mandatory;/);
  assert.match(css, /@media \(max-width:480px\)[\s\S]+?\.gallery-controls\{[\s\S]+?44px 44px;/);
  assert.match(css, /\.event-gallery-track\{\s*grid-auto-columns:88%;/);
  assert.match(css, /@media \(prefers-reduced-motion:reduce\)/);
});

test("todos os fallbacks locais referenciados pela galeria existem", () => {
  const render = ler("public/js/render.js");
  const caminhos = [...render.matchAll(/\/images\/fallback\/[a-z0-9-]+\.svg/gi)]
    .map(resultado => resultado[0]);

  assert.ok(caminhos.length >= 5);
  for (const caminho of new Set(caminhos)) {
    assert.equal(
      fs.existsSync(path.join(raiz, "public", caminho)),
      true,
      `fallback ausente: ${caminho}`
    );
  }
});
}

// -----------------------------------------------------------------------------
// Origem consolidada: image-catalog.test.js
// -----------------------------------------------------------------------------
{
const test = require("node:test");
const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");
const dictionary = require("../data/images/visual-dictionary.json");
const localLibrary = require("../data/images/local-library.json");
const { construirSolicitacoesImagem, criarImagemFallback, selecionarImagensLocais, validarDicionario, validarBibliotecaLocal, validarImagem } = require("../src/services/images/image-catalog.service");

test("dicionario visual possui contextos, slots e fallbacks locais", () => {
  assert.deepEqual(validarDicionario(dictionary), []);
  assert.ok(dictionary.contexts.length >= 10);
  Object.values(dictionary.slots).forEach(slot => {
    const arquivo = path.join(__dirname, "..", "public", slot.fallback);
    assert.equal(fs.existsSync(arquivo), true, arquivo);
  });
});

test("biblioteca local possui metadados validos e arquivos existentes", () => {
  assert.deepEqual(validarBibliotecaLocal(localLibrary), []);
  assert.ok(localLibrary.entries.length >= 10);
  localLibrary.entries.forEach(item => {
    assert.equal(fs.existsSync(path.join(__dirname, "..", "public", item.path)), true, item.path);
  });
  const [peixe] = selecionarImagensLocais({
    target_id: "p1", nome: "File de tilapia grelhado", slot: "principal"
  });
  assert.equal(peixe.provider, "local");
  assert.equal(peixe.match_type, "dish-family");
  assert.match(peixe.image_url, /main-fish\.svg$/);
  const [bebida] = selecionarImagensLocais({
    target_id: "p2", nome: "Suco de uva integral", slot: "bebida"
  });
  assert.equal(bebida.match_type, "category");
});

test("solicitacoes sao especificas por prato e preservam o id de destino", () => {
  const solicitacoes = construirSolicitacoesImagem({ tipo: "Aniversario de debutante", tema: "Jardim dourado", estilo: "Premium" }, [
    { id: "p1", nome: "Mini sanduiche de carpaccio com alcaparras", categoria: "Entrada" },
    { id: "p2", nome: "File de tilapia grelhado", categoria: "Prato Principal" },
    { id: "p3", nome: "Agua mineral com hortela", categoria: "Bebida" }
  ]);
  assert.equal(solicitacoes.length, 3);
  assert.equal(solicitacoes[0].slot, "entrada");
  assert.equal(solicitacoes[0].target_id, "p1");
  assert.match(solicitacoes[0].query, /sandwich carpaccio capers/);
  assert.ok(solicitacoes[0].match_terms.includes("carpaccio"));
  assert.equal(solicitacoes[0].style_id, "premium");
  assert.match(solicitacoes[1].query, /tilapia fish/);
  assert.match(solicitacoes[2].query, /mineral water/);
  assert.equal(solicitacoes[2].match_terms.includes("beverage"), false);
  const [sucoUva] = construirSolicitacoesImagem({}, [{ id: "uva", nome: "Suco de uva integral", categoria: "Bebida" }]);
  assert.deepEqual(sucoUva.anchor_terms, ["grape"]);
});

test("contrato rejeita provider, licenca e URL externa inseguros", () => {
  const fallback = criarImagemFallback({ slot: "capa", fallback_url: "/images/fallback/event-cover.svg", nome: "Capa" });
  assert.equal(fallback.fallback, true);
  assert.equal(fallback.provider, "local");
  assert.throws(() => validarImagem({ ...fallback, provider: "desconhecido" }), /Provider/);
  assert.throws(() => validarImagem({ ...fallback, provider: "openverse", license: "by", image_url: "javascript:alert(1)", thumbnail_url: "https://example.com/a.jpg", source_url: "https://example.com" }), /HTTPS/);
});
}

// -----------------------------------------------------------------------------
// Origem consolidada: image-selection.test.js
// -----------------------------------------------------------------------------
{
const test = require("node:test");
const assert = require("node:assert/strict");
const { criarImageSelectionService } = require("../src/services/images/image-selection.service");

const pratos = [
  { id: "p1", nome: "Mini sanduiche de carpaccio com alcaparras", categoria: "Entrada" },
  { id: "p2", nome: "Agua mineral com hortela", categoria: "Bebida" }
];

test("seleciona fotografia relacionada e liga ao prato exato", async () => {
  const service = criarImageSelectionService({ openverseService: {
    async buscar(solicitacao) {
      return { images: [{
        id: `img-${solicitacao.target_id}`,
        source_url: `https://example.com/${solicitacao.target_id}`,
        provider: "openverse",
        alt: solicitacao.target_id === "p1" ? "Carpaccio sandwich with capers" : "Mineral water with mint",
        tags: []
      }] };
    }
  } });
  const resultado = await service.selecionarParaEvento({ tipo: "Corporativo" }, pratos);

  assert.equal(resultado.images.length, 2);
  assert.equal(resultado.images[0].target_id, "p1");
  assert.equal(resultado.images[1].target_id, "p2");
  assert.equal(resultado.warnings.length, 0);
  assert.equal(resultado.coverage.local_family, 0);
  assert.equal(resultado.coverage.external, 2);
});

test("rejeita foto de massa para carpaccio e usa imagem local de categoria", async () => {
  const service = criarImageSelectionService({ openverseService: {
    async buscar() {
      return { images: [{ id: "massa", source_url: "https://example.com/massa", provider: "openverse", alt: "Pasta with tomato sauce", tags: ["pasta"] }] };
    }
  } });
  const resultado = await service.selecionarParaEvento({ tipo: "Corporativo" }, [pratos[0]]);

  assert.equal(resultado.images.length, 1);
  assert.equal(resultado.images[0].provider, "local");
  assert.equal(resultado.images[0].match_type, "category");
  assert.match(resultado.warnings[0], /imagem de categoria/i);
  assert.equal(resultado.coverage.local_category, 1);
});

test("nao repete fotografia externa e recorre a categoria local", async () => {
  const desconhecidos = [
    { id: "p1", nome: "Entrada alfa", categoria: "Entrada" },
    { id: "p2", nome: "Entrada beta", categoria: "Entrada" }
  ];
  const service = criarImageSelectionService({ openverseService: {
    async buscar(solicitacao) {
      return { images: [{
        id: "repetida",
        source_url: "https://example.com/repetida",
        provider: "openverse",
        alt: solicitacao.target_id === "p1" ? "Alpha appetizer" : "Beta appetizer"
      }] };
    }
  } });
  const resultado = await service.selecionarParaEvento({ tipo: "Corporativo" }, desconhecidos);

  assert.equal(resultado.images.length, 2);
  assert.equal(resultado.images.filter(imagem => imagem.provider === "openverse").length, 0);
  assert.equal(resultado.images.filter(imagem => imagem.provider === "local").length, 2);
});

test("preserva alternativas relevantes por id do prato", async () => {
  const service = criarImageSelectionService({ openverseService: {
    async buscar() {
      return { images: [
        { id: "a", source_url: "https://example.com/a", provider: "openverse", alt: "Carpaccio sandwich with capers" },
        { id: "b", source_url: "https://example.com/b", provider: "openverse", alt: "Carpaccio sandwich" }
      ] };
    }
  } });
  const resultado = await service.selecionarParaEvento({ tipo: "Corporativo" }, [pratos[0]]);

  assert.equal(resultado.images[0].id, "a");
  assert.equal(resultado.alternatives.p1[0].id, "b");
});

test("suco de uva rejeita fotografia de laranja e exige ancora grape", async () => {
  const prato = [{ id: "uva", nome: "Suco de uva integral", categoria: "Bebida" }];
  const serviceLaranja = criarImageSelectionService({ openverseService: {
    async buscar() {
      return { images: [{ id: "laranja", source_url: "https://example.com/laranja", provider: "openverse", alt: "Fresh orange juice", tags: ["orange", "juice"] }] };
    }
  } });
  const rejeitado = await serviceLaranja.selecionarParaEvento({ tipo: "Corporativo" }, prato);
  assert.equal(rejeitado.images[0].provider, "local");
  assert.equal(rejeitado.images[0].match_type, "category");

  const serviceUva = criarImageSelectionService({ openverseService: {
    async buscar() {
      return { images: [{ id: "uva", source_url: "https://example.com/uva", provider: "openverse", alt: "Fresh grape juice", tags: ["grape", "juice"] }] };
    }
  } });
  const aceito = await serviceUva.selecionarParaEvento({ tipo: "Corporativo" }, prato);
  assert.equal(aceito.images[0].provider, "openverse");
  assert.equal(aceito.coverage.external, 1);
});

test("cinco eventos mantem cobertura local mesmo sem Openverse", async () => {
  const cenarios = [
    {
      tipo: "Corporativo",
      pratos: [
        ["Mini sanduiche de carpaccio", "Entrada"], ["Salmao com ervas", "Prato Principal"],
        ["Risoto de cogumelos", "Prato Principal"], ["Mousse de chocolate", "Sobremesa"], ["Cafe especial", "Bebida"]
      ]
    },
    {
      tipo: "Casamento",
      pratos: [
        ["Canape de queijo", "Entrada"], ["File mignon ao molho", "Prato Principal"],
        ["Ravioli de abobora", "Prato Principal"], ["Bolo de casamento", "Sobremesa"], ["Vinho branco", "Bebida"]
      ]
    },
    {
      tipo: "Churrasco",
      pratos: [
        ["Pao de alho", "Entrada"], ["Picanha grelhada", "Prato Principal"],
        ["Frango marinado", "Prato Principal"], ["Farofa da casa", "Acompanhamento"], ["Cerveja pilsen", "Bebida"]
      ]
    },
    {
      tipo: "Infantil",
      pratos: [
        ["Mini pizza", "Entrada"], ["Cachorro quente", "Entrada"],
        ["Brigadeiro", "Sobremesa"], ["Bolo de aniversario", "Sobremesa"], ["Suco de laranja", "Bebida"]
      ]
    },
    {
      tipo: "Domiciliar",
      pratos: [
        ["Bruschetta de tomate", "Entrada"], ["Tilapia grelhada", "Prato Principal"],
        ["Legumes assados", "Prato Principal"], ["Pudim de leite", "Sobremesa"], ["Agua com hortela", "Bebida"]
      ]
    }
  ];
  const service = criarImageSelectionService({ openverseService: {
    async buscar() { throw new Error("fonte externa simulada como indisponivel"); }
  } });
  const resultados = [];
  for (const cenario of cenarios) {
    resultados.push(await service.selecionarParaEvento(
      { tipo: cenario.tipo },
      cenario.pratos.map(([nome, categoria], indice) => ({ id: `${cenario.tipo}-${indice}`, nome, categoria }))
    ));
  }

  assert.equal(resultados.length, 5);
  assert.equal(resultados.reduce((total, item) => total + item.coverage.requested, 0), 25);
  assert.equal(resultados.reduce((total, item) => total + item.coverage.displayed, 0), 25);
  assert.equal(resultados.reduce((total, item) => total + item.coverage.missing, 0), 0);
  assert.ok(resultados.reduce((total, item) => total + item.coverage.local_category, 0) >= 4);
});
}

// -----------------------------------------------------------------------------
// Origem consolidada: mobile-ui.test.js
// -----------------------------------------------------------------------------
{
const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');

const raiz = path.join(__dirname, '..');
const ler = arquivo => fs.readFileSync(path.join(raiz, arquivo), 'utf8');

test('formulario principal associa rotulos aos campos e anuncia resultados', () => {
    const html = ler('public/index.html');
    const campos = [
        'tipo', 'pessoas', 'criancas', 'duracao', 'dataEvento',
        'refeicao', 'restricoes', 'tema', 'alcool', 'userChat'
    ];

    for (const id of campos) {
        assert.match(html, new RegExp(`<label[^>]+for="${id}"`), `rotulo ausente para ${id}`);
    }

    assert.match(html, /<nav class="mode-nav" aria-label=/);
    assert.match(html, /id="btnApp" aria-pressed="true"/);
    assert.match(html, /id="resultadoArea" class="hidden" aria-live="polite"/);
    assert.match(html, /class="style-grid" role="radiogroup"/);
});

test('layout mobile reduz a primeira dobra e preserva alvos de toque', () => {
    const layout = ler('public/css/modules/layout.css');
    const formulario = ler('public/css/modules/form.css');
    const resultado = ler('public/css/modules/result.css');
    const pitch = ler('public/css/modules/pitch.css');

    assert.match(layout, /@media \(max-width:768px\)[\s\S]+?\.hero\{\s*height:300px;/);
    assert.match(layout, /@media \(max-width:480px\)[\s\S]+?\.hero\{\s*height:270px;/);
    assert.match(layout, /\.nav-btn\{[\s\S]+?min-height:44px;/);
    assert.doesNotMatch(pitch, /\.hero\{\s*height:50vh;/);
    assert.match(formulario, /\.premium-input\{[\s\S]+?min-height:54px;/);
    assert.match(resultado, /grid-template-columns:minmax\(0,1fr\) minmax\(0,1fr\) 44px 44px;/);
});

test('navegacao atualiza estado acessivel', () => {
    const app = ler('public/js/app.js');

    assert.match(app, /btnApp\.setAttribute\('aria-pressed', 'true'\)/);
    assert.match(app, /btnPitch\.setAttribute\('aria-pressed', 'true'\)/);
    assert.match(app, /button\?\.setAttribute\('aria-expanded', String\(!collapsed\)\)/);
});

test('E2E preserva evidencia mobile mesmo quando uma porta culinaria falha', () => {
    const e2e = ler('scripts/validate-plan5-e2e.js');
    const captura = e2e.indexOf('result.mobileEvidence = await capturarEvidenciaMobile');
    const validacao = e2e.indexOf('validarResultadoCiclo(result, scenario)', captura);

    assert.ok(captura >= 0, 'captura mobile nao encontrada');
    assert.ok(validacao > captura, 'a captura deve acontecer antes da porta culinaria');
    assert.match(e2e, /Page\.captureScreenshot/);
    assert.match(e2e, /scrollWidth: document\.documentElement\.scrollWidth/);
});

test('resultado identifica fichas recuperadas e reconciliacao de bebidas', () => {
    const render = ler('public/js/render.js');
    const css = ler('public/css/modules/result.css');

    assert.match(render, /function renderReconciliacaoBebidas/);
    assert.match(render, /Volumes reconciliados pelo motor/);
    assert.match(render, /recipe-recovered-badge/);
    assert.match(render, /Ficha recuperada/);
    assert.match(css, /\.beverage-balance-panel/);
    assert.match(css, /\.recipe-operational-note/);
});

test('E2E usa porta isolada para nao validar servidor antigo', () => {
    const e2e = ler('scripts/validate-plan5-e2e.js');

    assert.match(e2e, /CHEF_IA_E2E_PORT/);
    assert.match(e2e, /PORT: String\(E2E_PORT\)/);
    assert.doesNotMatch(e2e, /const BASE_URL = "http:\/\/localhost:3000"/);
});
}

// -----------------------------------------------------------------------------
// Origem consolidada: visual-feedback.service.test.js
// -----------------------------------------------------------------------------
{
const test = require("node:test");
const assert = require("node:assert/strict");
const {
  criarVisualFeedbackService,
  VISUAL_FEEDBACK_STORAGE_KEY,
  VISUAL_FEEDBACK_MAX_ENTRIES
} = require("../public/js/visual-feedback.service");

function criarStorage() {
  const dados = new Map();
  return {
    getItem: chave => dados.get(chave) || null,
    setItem: (chave, valor) => dados.set(chave, valor),
    removeItem: chave => dados.delete(chave)
  };
}

test("feedback visual salva somente identificador, provider, slot e nota", () => {
  const storage = criarStorage();
  const service = criarVisualFeedbackService(storage);
  const imagem = {
    id: "openverse-123",
    provider: "openverse",
    slot: "capa",
    image_url: "https://nao-salvar.example/imagem.jpg",
    source_url: "https://nao-salvar.example/fonte",
    evento: { tipo: "nao salvar" }
  };

  assert.equal(service.salvarAvaliacao(imagem, "adequada"), true);
  const bruto = storage.getItem(VISUAL_FEEDBACK_STORAGE_KEY);
  const entrada = Object.values(JSON.parse(bruto).entries)[0];
  assert.deepEqual(entrada, {
    key: "openverse:openverse-123",
    provider: "openverse",
    image_id: "openverse-123",
    slot: "capa",
    rating: "adequada"
  });
  assert.equal(bruto.includes("nao-salvar"), false);
  assert.equal(bruto.includes("image_url"), false);
});

test("avaliacoes reordenam somente a imagem exata", () => {
  const service = criarVisualFeedbackService(criarStorage());
  const inadequada = { id: "a", provider: "openverse", slot: "capa" };
  const neutra = { id: "b", provider: "openverse", slot: "capa" };
  const adequada = { id: "c", provider: "openverse", slot: "capa" };
  service.salvarAvaliacao(inadequada, "inadequada");
  service.salvarAvaliacao(adequada, "adequada");

  assert.deepEqual(service.ordenarCandidatos([inadequada, neutra, adequada]), [adequada, neutra, inadequada]);
  assert.equal(service.obterAvaliacao(neutra), null);
  assert.deepEqual(service.resumir(), { total: 2, adequada: 1, generica: 0, inadequada: 1 });
});

test("feedback rejeita notas invalidas, limita entradas e permite limpar", () => {
  const storage = criarStorage();
  const service = criarVisualFeedbackService(storage);
  assert.equal(service.salvarAvaliacao({ id: "x", provider: "openverse", slot: "capa" }, "otima"), false);

  for (let indice = 0; indice < VISUAL_FEEDBACK_MAX_ENTRIES + 10; indice += 1) {
    service.salvarAvaliacao({ id: `id-${indice}`, provider: "openverse", slot: "capa" }, "generica");
  }
  assert.equal(service.resumir().total, VISUAL_FEEDBACK_MAX_ENTRIES);
  assert.equal(service.limpar(), true);
  assert.equal(service.resumir().total, 0);
});
}

// -----------------------------------------------------------------------------
// Origem consolidada: wikimedia-probe.test.js
// -----------------------------------------------------------------------------
{
const test = require("node:test");
const assert = require("node:assert/strict");
const { licencaPermitida, normalizarCandidato } = require("../scripts/benchmark-wikimedia-relevance");

test("sonda Commons preserva somente a politica visual atual", () => {
  assert.equal(licencaPermitida("CC0"), true);
  assert.equal(licencaPermitida("Public domain"), true);
  assert.equal(licencaPermitida("CC BY 4.0"), true);
  assert.equal(licencaPermitida("CC BY-SA 4.0"), false);
  assert.equal(licencaPermitida("CC BY-NC 3.0"), false);
});

test("sonda Commons exige miniatura e pagina original", () => {
  const candidato = normalizarCandidato({
    title: "File:Bolo.jpg",
    imageinfo: [{
      thumburl: "https://upload.wikimedia.org/bolo.jpg",
      descriptionurl: "https://commons.wikimedia.org/wiki/File:Bolo.jpg",
      mime: "image/jpeg",
      extmetadata: { LicenseShortName: { value: "CC BY 4.0" } }
    }]
  });

  assert.equal(candidato.title, "Bolo.jpg");
  assert.equal(candidato.allowed, true);
  assert.equal(normalizarCandidato({ title: "File:Sem URL" }), null);
  assert.equal(normalizarCandidato({
    title: "File:Video.ogv",
    imageinfo: [{ thumburl: "https://example.com/frame.jpg", descriptionurl: "https://example.com/video", mime: "video/ogg", extmetadata: {} }]
  }), null);
});
}
