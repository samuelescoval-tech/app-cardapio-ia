const { spawn } = require("node:child_process");
const fs = require("node:fs");

const port = 33500 + (process.pid % 500);
const debugPort = 9450 + (process.pid % 400);
const baseUrl = `http://127.0.0.1:${port}`;
const profileDir = `/tmp/chef-ia-gallery-profile-${process.pid}`;
const screenshotPath = `/tmp/chef-ia-gallery-mobile-${process.pid}.png`;

class CdpClient {
  constructor(url) {
    this.url = url;
    this.nextId = 1;
    this.pending = new Map();
  }

  async connect() {
    this.socket = new WebSocket(this.url);
    await new Promise((resolve, reject) => {
      this.socket.addEventListener("open", resolve, { once: true });
      this.socket.addEventListener("error", reject, { once: true });
    });
    this.socket.addEventListener("message", event => {
      const message = JSON.parse(event.data);
      const pending = this.pending.get(message.id);
      if (!pending) return;
      clearTimeout(pending.timer);
      this.pending.delete(message.id);
      if (message.error) pending.reject(new Error(message.error.message));
      else pending.resolve(message.result);
    });
  }

  send(method, params = {}, timeoutMs = 15000) {
    const id = this.nextId++;
    return new Promise((resolve, reject) => {
      const timer = setTimeout(() => {
        this.pending.delete(id);
        reject(new Error(`Timeout CDP: ${method}`));
      }, timeoutMs);
      this.pending.set(id, { resolve, reject, timer });
      this.socket.send(JSON.stringify({ id, method, params }));
    });
  }

  async evaluate(expression) {
    const result = await this.send("Runtime.evaluate", {
      expression,
      awaitPromise: true,
      returnByValue: true
    });
    if (result.exceptionDetails) {
      throw new Error(result.exceptionDetails.exception?.description || result.exceptionDetails.text);
    }
    return result.result.value;
  }

  close() {
    this.socket?.close();
  }
}

async function main() {
  fs.mkdirSync(profileDir, { recursive: true });
  const server = spawn(process.execPath, ["server.js"], {
    cwd: process.cwd(),
    env: { ...process.env, PORT: String(port), DEMO_ACCESS_KEY: "" },
    stdio: ["ignore", "ignore", "ignore"]
  });
  let chrome;
  let cdp;

  try {
    await aguardarHttp(`${baseUrl}/api/status`);
    chrome = spawn("google-chrome", [
      "--headless=new",
      "--no-sandbox",
      "--disable-gpu",
      `--remote-debugging-port=${debugPort}`,
      `--user-data-dir=${profileDir}`,
      "--window-size=1440,1000",
      baseUrl
    ], { stdio: ["ignore", "ignore", "ignore"] });

    const pagina = await aguardarPaginaDebug();
    cdp = new CdpClient(pagina.webSocketDebuggerUrl);
    await cdp.connect();
    await cdp.send("Page.enable");
    await cdp.send("Runtime.enable");
    await aguardarDocumento(cdp);

    const fontesRecolhidas = await cdp.evaluate(`(() => {
      const dados = {
        resumo_chef: 'Amostra local para validar a galeria sem consumir IA.',
        cardapio: [
          { id: 'entrada-1', nome: 'Canape vegetal', categoria: 'Entrada', descricao: 'Amostra' },
          { id: 'principal-1', nome: 'Prato principal', categoria: 'Prato Principal', descricao: 'Amostra' },
          { id: 'doce-1', nome: 'Sobremesa', categoria: 'Sobremesa', descricao: 'Amostra' }
        ],
        blocos_cardapio: [
          { id: 'entrada', nome: 'Entradas', categoria: 'Entrada', itens: ['entrada-1'] },
          { id: 'principal', nome: 'Principais', categoria: 'Prato Principal', itens: ['principal-1'] },
          { id: 'sobremesa', nome: 'Sobremesas', categoria: 'Sobremesa', itens: ['doce-1'] }
        ],
        lista_compras: [{ item: 'Ingrediente', quantidade: '1 kg', setor: 'Hortifruti' }],
        receitas: [], cronograma: [], utensilios: [], local: [], layout: [], equipe_obs: []
      };
      document.getElementById('resultadoArea').classList.remove('hidden');
      exibirResultadoLuxo(dados, 80, { tipo: 'Evento corporativo', estilo: 'Premium' });
      const imagensLocais = imagensLocaisGaleria();
      renderizarGaleriaEvento({
        images: imagensLocais,
        alternatives: {
          capa: [{ ...imagensLocais[1], id: 'local-capa-alternativa', slot: 'capa', alt: 'Capa alternativa do evento' }]
        },
        attribution_notice: 'Amostra local de validacao; referencias externas nao persistem.'
      });
      const detalhes = document.getElementById('eventGalleryDetails');
      const recolhidoPorPadrao = !detalhes.open;
      detalhes.open = true;
      document.getElementById('eventGallerySection').scrollIntoView({ block: 'start' });
      return recolhidoPorPadrao;
    })()`);
    if (!fontesRecolhidas) throw new Error("painel de fontes nao ficou recolhido por padrao");

    const desktop = await coletarMetricas(cdp);
    assertMetricas(desktop, "desktop");

    await cdp.send("Emulation.setDeviceMetricsOverride", {
      width: 390,
      height: 844,
      deviceScaleFactor: 1,
      mobile: true
    });
    await cdp.evaluate("document.getElementById('eventGallerySection').scrollIntoView({ block: 'start' }); true");
    await esperar(250);
    const mobile = await coletarMetricas(cdp);
    assertMetricas(mobile, "mobile");
    if (mobile.viewport !== 390 || mobile.scrollWidth > 391) {
      throw new Error(`mobile com overflow: viewport=${mobile.viewport}, scrollWidth=${mobile.scrollWidth}`);
    }
    if (mobile.visibleTouchTargets < 2 || mobile.minTouchTarget < 44) {
      throw new Error(`alvo de toque invalido: visiveis=${mobile.visibleTouchTargets}, minimo=${mobile.minTouchTarget}`);
    }

    const galleryClip = await cdp.evaluate(`(() => {
      const rect = document.getElementById('eventGallerySection').getBoundingClientRect();
      return { x: 0, y: window.scrollY + rect.top, width: 390, height: Math.min(Math.ceil(rect.height), 844), scale: 1 };
    })()`);
    const captura = await cdp.send("Page.captureScreenshot", {
      format: "png",
      fromSurface: true,
      captureBeyondViewport: true,
      clip: galleryClip
    });
    fs.writeFileSync(screenshotPath, Buffer.from(captura.data, "base64"));

    const interacoes = await cdp.evaluate(`(() => {
      const srcAntes = document.querySelector('[data-gallery-key="capa"] img')?.getAttribute('src');
      avaliarImagemGaleria('capa', 'inadequada');
      const srcDepois = document.querySelector('[data-gallery-key="capa"] img')?.getAttribute('src');
      avaliarImagemGaleria('principal', 'adequada');
      ocultarImagemGaleria('sobremesa');
      const feedbackBruto = localStorage.getItem('chef_ia_visual_feedback_v1') || '';
      return {
        trocaAplicada: Boolean(srcAntes && srcDepois && srcAntes !== srcDepois),
        cardsDepoisDeOcultar: document.querySelectorAll('.event-gallery-card').length,
        sobremesaOculta: !document.querySelector('[data-gallery-key="sobremesa"]'),
        preferenciasSalvas: window.visualFeedbackService.resumir(),
        feedbackSemUrls: !feedbackBruto.includes('http') && !feedbackBruto.includes('image_url'),
        resumoVisivel: document.getElementById('galleryFeedbackSummary')?.textContent.includes('preferencias locais')
      };
    })()`);
    if (!interacoes.trocaAplicada || interacoes.cardsDepoisDeOcultar !== 4 || !interacoes.sobremesaOculta ||
        interacoes.preferenciasSalvas.total !== 2 || !interacoes.feedbackSemUrls || !interacoes.resumoVisivel) {
      throw new Error("avaliacao local, troca ou ocultacao de imagem falhou");
    }

    const lista = await cdp.evaluate(`(() => {
      alternarVisualizacaoGaleria('list');
      const galeria = document.getElementById('eventGalleryVisualizacao');
      const botao = document.querySelector('[data-gallery-view="list"]');
      return {
        classeLista: galeria.classList.contains('event-gallery-list'),
        listaPressionada: botao.getAttribute('aria-pressed'),
        navegacaoOculta: Array.from(document.querySelectorAll('[data-gallery-nav]')).every(item => item.hidden)
      };
    })()`);
    if (!lista.classeLista || lista.listaPressionada !== "true" || !lista.navegacaoOculta) {
      throw new Error("alternancia para lista nao atualizou estado e navegacao");
    }

    const historico = await cdp.evaluate(`(() => {
      localStorage.removeItem('chef_ia_historico');
      let chamadasGeracao = 0;
      const fetchOriginal = window.fetch;
      window.fetch = (...args) => {
        if (String(args[0] || '').includes('/gerar-cardapio')) chamadasGeracao += 1;
        return fetchOriginal(...args);
      };
      const evento = { tipo: 'Evento corporativo', pessoas: 80, estilo: 'Premium', refeicao: 'Coffee break' };
      const id = window.storageService.salvarHistorico(evento, window.chefIAUltimoPlano.dados);
      renderizarHistorico();
      document.querySelector('.historico-btn-carregar')?.click();
      window.fetch = fetchOriginal;
      return {
        id,
        carregadoId: window.chefIAHistoricoCarregadoId,
        banner: document.querySelector('.history-loaded-banner')?.textContent || '',
        chamadasGeracao,
        cardapioPreservado: window.chefIAUltimoPlano?.dados?.cardapio?.length || 0,
        receitaPreservada: Array.isArray(window.chefIAUltimoPlano?.dados?.receitas)
      };
    })()`);
    if (!historico.id || historico.carregadoId !== historico.id || historico.chamadasGeracao !== 0 ||
        historico.cardapioPreservado !== 3 || !historico.receitaPreservada || !historico.banner.includes('Nenhuma nova')) {
      throw new Error("historico nao preservou o planejamento ou iniciou nova geracao");
    }

    const pdf = await cdp.evaluate(`(() => {
      window.__pdfSalvo = null;
      window.jspdf = { jsPDF: class {
        constructor() {
          const estado = { paginas: 1 };
          return new Proxy({}, {
            get(alvo, propriedade) {
              if (propriedade === 'splitTextToSize') return texto => [String(texto || '')];
              if (propriedade === 'addPage') return () => { estado.paginas += 1; };
              if (propriedade === 'getNumberOfPages') return () => estado.paginas;
              if (propriedade === 'save') return nome => { window.__pdfSalvo = nome; };
              return () => {};
            }
          });
        }
      } };
      baixarRelatorioPDF();
      return { arquivo: window.__pdfSalvo };
    })()`);
    if (!pdf.arquivo || !pdf.arquivo.endsWith('.pdf')) throw new Error("PDF visual nao foi gerado");

    process.stdout.write(`${JSON.stringify({ ok: true, fontesRecolhidas, desktop, mobile, interacoes, lista, historico, pdf, screenshotPath })}\n`);
  } finally {
    cdp?.close();
    if (chrome?.exitCode === null) chrome.kill("SIGTERM");
    if (server.exitCode === null) server.kill("SIGTERM");
  }
}

async function coletarMetricas(cdp) {
  return cdp.evaluate(`(() => {
    const controles = Array.from(document.querySelectorAll('.gallery-view-btn,.gallery-nav-btn,.gallery-action-btn,.gallery-feedback-btn,.gallery-feedback-clear'));
    const alturasVisiveis = controles.map(item => item.getBoundingClientRect().height).filter(altura => altura > 0);
    const primeiro = document.querySelector('.event-gallery-card')?.getBoundingClientRect();
    return {
      viewport: window.innerWidth,
      scrollWidth: document.documentElement.scrollWidth,
      cards: document.querySelectorAll('.event-gallery-card').length,
      ariaBusy: document.getElementById('eventGallerySection')?.getAttribute('aria-busy'),
      controlsVisible: !document.getElementById('eventGalleryControls')?.hidden,
      creditLines: document.querySelectorAll('.gallery-credit-line').length,
      brokenImages: Array.from(document.querySelectorAll('.event-gallery-card img')).filter(item => item.complete && item.naturalWidth === 0).length,
      dishCards: document.querySelectorAll('.menu-item-card').length,
      dishImages: document.querySelectorAll('.menu-item-card img[data-dish-image]').length,
      visibleDishImages: Array.from(document.querySelectorAll('.menu-item-card img[data-dish-image]')).filter(item => !item.hidden).length,
      dishPlaceholders: Array.from(document.querySelectorAll('.menu-item-card .dish-placeholder')).filter(item => !item.hidden).length,
      brokenDishImages: Array.from(document.querySelectorAll('.menu-item-card img[data-dish-image]')).filter(item => !item.hidden && item.complete && item.naturalWidth === 0).length,
      firstCardWidth: Math.round(primeiro?.width || 0),
      visibleTouchTargets: alturasVisiveis.length,
      touchTargetHeights: alturasVisiveis.map(Math.round),
      minTouchTarget: alturasVisiveis.length ? Math.round(Math.min(...alturasVisiveis)) : 0
    };
  })()`);
}

function assertMetricas(metricas, nome) {
  if (metricas.cards !== 5) throw new Error(`${nome}: ${metricas.cards}/5 cards`);
  if (metricas.ariaBusy !== "false") throw new Error(`${nome}: aria-busy nao finalizado`);
  if (!metricas.controlsVisible) throw new Error(`${nome}: controles ocultos`);
  if (metricas.creditLines !== metricas.cards) throw new Error(`${nome}: creditos incompletos`);
  if (metricas.brokenImages !== 0) throw new Error(`${nome}: ${metricas.brokenImages} imagem(ns) quebrada(s)`);
  if (metricas.dishCards !== 3 || metricas.dishImages !== 3) throw new Error(`${nome}: estrutura visual ausente nos 3 itens individuais do cardapio`);
  if (metricas.visibleDishImages !== 0 || metricas.dishPlaceholders !== 3) throw new Error(`${nome}: referencias genericas deveriam permanecer como identificacao neutra`);
  if (metricas.brokenDishImages !== 0) throw new Error(`${nome}: ${metricas.brokenDishImages} imagem(ns) de prato quebrada(s)`);
}

async function aguardarHttp(url) {
  for (let tentativa = 0; tentativa < 50; tentativa += 1) {
    try {
      const response = await fetch(url);
      if (response.ok) return;
    } catch {}
    await esperar(100);
  }
  throw new Error("servidor local nao iniciou");
}

async function aguardarPaginaDebug() {
  for (let tentativa = 0; tentativa < 60; tentativa += 1) {
    try {
      const paginas = await fetch(`http://127.0.0.1:${debugPort}/json/list`).then(response => response.json());
      const pagina = paginas.find(item => item.type === "page");
      if (pagina) return pagina;
    } catch {}
    await esperar(100);
  }
  throw new Error("Chrome headless nao iniciou");
}

async function aguardarDocumento(cdp) {
  for (let tentativa = 0; tentativa < 60; tentativa += 1) {
    const pronto = await cdp.evaluate("document.readyState === 'complete' && typeof exibirResultadoLuxo === 'function'");
    if (pronto) return;
    await esperar(100);
  }
  throw new Error("aplicacao nao terminou de carregar");
}

function esperar(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

main().catch(error => {
  console.error(error.message);
  process.exitCode = 1;
});
