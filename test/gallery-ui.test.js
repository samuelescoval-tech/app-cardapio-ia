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
