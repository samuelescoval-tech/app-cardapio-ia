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
