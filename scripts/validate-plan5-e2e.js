const { spawn } = require("node:child_process");
const fs = require("node:fs");
const path = require("node:path");
require("dotenv").config({ quiet: true });

const BASE_URL = "http://localhost:3000";
const DEBUG_PORT = 9325;
const runId = Date.now();
const profileDir = `/tmp/chef-ia-plan5-profile-${runId}`;
const downloadDir = `/tmp/chef-ia-plan5-downloads-${runId}`;
const summaryPath = `/tmp/chef-ia-plan5-summary-${runId}.json`;

const scenarioCatalog = [
  {
    id: "debutante",
    tipo: "Aniversário de debutante",
    pessoas: 150,
    criancas: 0,
    duracao: 6,
    refeicao: "Almoço com churrasco",
    restricoes: "Nenhuma",
    tema: "Festa de 15 anos elegante",
    alcool: "Sem álcool",
    estilo: "Elegante",
    obs: "Festa de 15 anos com público adolescente e alguns adultos. Incluir bebidas leves, bolo, brigadeiros, beijinhos e outros doces; almoço com churrasco, carnes bovinas como alcatra e patinho, linguiça, asa e coxa de frango, além de comidas brasileiras como baião de dois. Prever dança e DJ, com área de coreografia para 20 pessoas e espaço livre para pelo menos 50 das 150 pessoas.",
    horarioInicio: "12:00",
    formatoServico: "Estacoes ou ilhas",
    faixaEtaria: "Adolescentes e jovens",
    infraestrutura: "Cozinha de apoio limitada",
    prioridade: "Conforto dos convidados",
    complexidadeEsperada: "Alta",
    menuExpectations: [
      { label: "alcatra", anyOf: ["alcatra"] },
      { label: "patinho", anyOf: ["patinho"] },
      { label: "linguica", anyOf: ["linguica"] },
      { label: "frango", anyOf: ["frango", "asa", "coxa"] },
      { label: "baiao de dois", anyOf: ["baiao de dois"] },
      { label: "bolo", anyOf: ["bolo"] },
      { label: "brigadeiro", anyOf: ["brigadeiro"] },
      { label: "beijinho", anyOf: ["beijinho"] }
    ]
  },
  {
    id: "natal",
    tipo: "Ceia de Natal",
    pessoas: 30,
    criancas: 5,
    duracao: 5,
    refeicao: "Almoço ou jantar",
    restricoes: "Nenhuma",
    tema: "Natal familiar brasileiro",
    alcool: "Com álcool moderado",
    estilo: "Elegante",
    obs: "Planejar uma ceia familiar brasileira para adultos e crianças, com serviço confortável e repertório típico da ocasião.",
    horarioInicio: "19:30",
    formatoServico: "Compartilhado a mesa",
    faixaEtaria: "Publico misto",
    infraestrutura: "Cozinha completa no local",
    prioridade: "Conforto dos convidados",
    complexidadeEsperada: "Baixa",
    menuExpectations: [
      { label: "principal natalino", anyOf: ["peru", "ave", "pernil", "tender", "peixe"] },
      { label: "acompanhamento natalino", anyOf: ["farofa", "arroz festivo", "salpicao"] },
      { label: "sobremesa natalina", anyOf: ["rabanada", "pave", "panetone", "chocotone"] }
    ]
  },
  {
    id: "domiciliar",
    tipo: "Atendimento domiciliar",
    pessoas: 5,
    criancas: 0,
    duracao: 1,
    refeicao: "Brunch / café da manhã",
    restricoes: "Nenhuma",
    tema: "Familiar",
    alcool: "Com álcool moderado",
    estilo: "Elegante",
    obs: "Entrada antes do prato principal e sobremesa para finalizar",
    horarioInicio: "11:30",
    formatoServico: "Buffet self-service",
    faixaEtaria: "Predominantemente adultos",
    infraestrutura: "Cozinha completa no local",
    prioridade: "Conforto dos convidados",
    complexidadeEsperada: "Baixa"
  },
  {
    id: "casamento",
    tipo: "Casamento",
    pessoas: 100,
    criancas: 15,
    duracao: 6,
    refeicao: "Almoço ou jantar",
    restricoes: "Uma opção vegetariana",
    tema: "Tropical elegante",
    alcool: "Com bar completo",
    estilo: "Elegante",
    obs: "Recepção, jantar e mesa de sobremesas",
    horarioInicio: "19:30",
    formatoServico: "Empratado",
    faixaEtaria: "Publico misto",
    infraestrutura: "Cozinha de apoio limitada",
    prioridade: "Apresentacao",
    complexidadeEsperada: "Alta"
  },
  {
    id: "churrasco",
    tipo: "Churrasco de aniversário",
    pessoas: 50,
    criancas: 10,
    duracao: 5,
    refeicao: "Churrasco",
    restricoes: "Uma opção vegetariana na grelha",
    tema: "Boteco brasileiro",
    alcool: "Com álcool moderado",
    estilo: "Simples",
    obs: "Serviço informal com acompanhamentos variados",
    horarioInicio: "13:00",
    formatoServico: "Estacoes ou ilhas",
    faixaEtaria: "Publico misto",
    infraestrutura: "Cozinha de apoio limitada",
    prioridade: "Praticidade de servico",
    complexidadeEsperada: "Media"
  },
  {
    id: "infantil",
    tipo: "Festa infantil",
    pessoas: 30,
    criancas: 20,
    duracao: 4,
    refeicao: "Coquetel / Finger food",
    restricoes: "Evitar amendoim",
    tema: "Circo colorido",
    alcool: "Sem álcool",
    estilo: "Simples",
    obs: "Comidas fáceis de servir e opções frescas",
    horarioInicio: "15:00",
    formatoServico: "Coquetel circulante",
    faixaEtaria: "Predominantemente infantil",
    infraestrutura: "Producao externa com finalizacao",
    prioridade: "Conforto dos convidados",
    complexidadeEsperada: "Media"
  },
  {
    id: "corporativo",
    tipo: "Evento corporativo",
    pessoas: 40,
    criancas: 0,
    duracao: 3,
    refeicao: "Coffee break",
    restricoes: "Opção vegana e opção sem lactose",
    tema: "Profissional contemporâneo",
    alcool: "Sem álcool",
    estilo: "Premium",
    obs: "Networking pela manhã com serviço silencioso",
    horarioInicio: "08:30",
    formatoServico: "Estacoes ou ilhas",
    faixaEtaria: "Predominantemente adultos",
    infraestrutura: "Cozinha de apoio limitada",
    prioridade: "Praticidade de servico",
    complexidadeEsperada: "Media"
  }
];
const seedMemory = process.argv.includes("--seed-memory");
const requestedScenarios = process.argv.slice(2).filter(arg => !arg.startsWith("--"));
const scenarios = requestedScenarios.length
  ? requestedScenarios.map(id => {
      const scenario = scenarioCatalog.find(item => item.id === id);
      if (!scenario) throw new Error(`Cenario desconhecido: ${id}`);
      return scenario;
    })
  : scenarioCatalog;

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
      if (!message.id || !this.pending.has(message.id)) return;
      const { resolve, reject, timer } = this.pending.get(message.id);
      clearTimeout(timer);
      this.pending.delete(message.id);
      if (message.error) reject(new Error(message.error.message));
      else resolve(message.result);
    });
  }

  send(method, params = {}, timeoutMs = 120000) {
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

  async evaluate(expression, timeoutMs = 120000) {
    const result = await this.send("Runtime.evaluate", {
      expression,
      awaitPromise: true,
      returnByValue: true
    }, timeoutMs);
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
  fs.mkdirSync(downloadDir, { recursive: true });
  const server = await confirmarServidor();

  const chrome = spawn("google-chrome", [
    "--headless=new",
    "--no-sandbox",
    "--disable-gpu",
    `--remote-debugging-port=${DEBUG_PORT}`,
    `--user-data-dir=${profileDir}`,
    "--window-size=1440,1000",
    BASE_URL
  ], { stdio: ["ignore", "ignore", "ignore"] });

  let cdp;
  try {
    const page = await aguardarPaginaDebug();
    cdp = new CdpClient(page.webSocketDebuggerUrl);
    await cdp.connect();
    await cdp.send("Page.enable");
    await cdp.send("Runtime.enable");
    await cdp.send("Browser.setDownloadBehavior", { behavior: "allow", downloadPath: downloadDir })
      .catch(() => cdp.send("Page.setDownloadBehavior", { behavior: "allow", downloadPath: downloadDir }));
    await aguardarDocumento(cdp);

    const demoKey = process.env.DEMO_ACCESS_KEY || "";
    const seedScenario = scenarios[0];
    await cdp.evaluate(`(async () => {
      sessionStorage.setItem('chef_ia_demo_access_key', ${JSON.stringify(demoKey)});
      localStorage.removeItem('chef_ia_historico');
      if (${JSON.stringify(seedMemory)}) {
        const s = ${JSON.stringify(seedScenario)};
        localStorage.setItem('chef_ia_historico', JSON.stringify([{
          id: 'evento_semente_plan7',
          data_criacao: new Date(0).toISOString(),
          tipo: s.tipo,
          pessoas: s.pessoas,
          evento: { tipo: s.tipo, refeicao: s.refeicao, tema: s.tema },
          plano: { cardapio: [
            { nome: 'Mini Pizza Gourmet', categoria: 'Prato Principal' },
            { nome: 'Gelatina Colorida', categoria: 'Sobremesa' },
            { nome: 'Agua Mineral', categoria: 'Bebida' }
          ] }
        }]));
      }
      await inicializarAcessoDemo();
      return { jspdf: Boolean(window.jspdf?.jsPDF) };
    })()`);

    const summary = [];
    for (let index = 0; index < scenarios.length; index += 1) {
      const scenario = scenarios[index];
      process.stdout.write(`[${index + 1}/${scenarios.length}] ${scenario.id}: gerando...\n`);
      const result = await gerarScenario(cdp, scenario);
      if (!result.ok) throw new Error(`${scenario.id}: ${result.error}`);
      result.mobileEvidence = await capturarEvidenciaMobile(cdp, scenario.id);
      try {
        validarResultadoCiclo(result, scenario);
      } catch (error) {
        fs.writeFileSync(summaryPath, JSON.stringify({
          generated_at: new Date().toISOString(),
          failure: error.message,
          scenario: result,
          downloadDir
        }, null, 2));
        process.stdout.write(`DIAGNOSTICO ${summaryPath}\n`);
        throw error;
      }

      await cdp.evaluate("baixarRelatorioPDF(); true");
      const pdfPath = path.join(downloadDir, result.pdfFile);
      await aguardarArquivo(pdfPath);
      const pdfSize = fs.statSync(pdfPath).size;
      if (pdfSize < 2000) throw new Error(`${scenario.id}: PDF muito pequeno (${pdfSize} bytes)`);

      const expectedHistory = index + 1 + (seedMemory ? 1 : 0);
      if (result.historyCount !== expectedHistory) {
        throw new Error(`${scenario.id}: historico ${result.historyCount}/${expectedHistory}`);
      }
      summary.push({ ...result, pdfPath, pdfSize });
      process.stdout.write(`[${index + 1}/${scenarios.length}] ${scenario.id}: OK — ${result.cardapio} pratos, ${result.receitas} receitas, ${result.compras} compras, PDF ${pdfSize} bytes\n`);
    }

    await cdp.send("Page.reload", { ignoreCache: true });
    await esperar(500);
    await aguardarDocumento(cdp);
    const historyLoad = await cdp.evaluate(`(() => {
      const historico = window.storageService.carregarHistorico();
      const ultimo = historico[historico.length - 1];
      carregarDoHistorico(ultimo.id);
      return {
        total: historico.length,
        carregado: Boolean(window.chefIAUltimoPlano?.dados?.cardapio?.length),
        tipo: document.getElementById('tipo')?.value,
        horarioInicio: document.getElementById('horarioInicio')?.value,
        formatoServico: document.getElementById('formatoServico')?.value,
        faixaEtaria: document.getElementById('faixaEtaria')?.value,
        infraestrutura: document.getElementById('infraestrutura')?.value,
        prioridade: document.getElementById('prioridade')?.value,
        avancadoAberto: Boolean(document.getElementById('advancedEventOptions')?.open)
      };
    })()`);

    await cdp.send("Emulation.setDeviceMetricsOverride", {
      width: 390,
      height: 844,
      deviceScaleFactor: 1,
      mobile: true
    });
    const mobile = await cdp.evaluate(`(() => ({
      viewport: window.innerWidth,
      scrollWidth: document.documentElement.scrollWidth,
      overflow: document.documentElement.scrollWidth > window.innerWidth + 1
    }))()`);
    await cdp.send("Emulation.clearDeviceMetricsOverride");

    const finalResult = {
      generated_at: new Date().toISOString(),
      scenarios: summary,
      history: historyLoad,
      mobile,
      downloadDir
    };
    fs.writeFileSync(summaryPath, JSON.stringify(finalResult, null, 2));
    process.stdout.write(`RESUMO ${summaryPath}\n`);
    process.stdout.write(`${JSON.stringify({ scenarios: summary.length, history: historyLoad, mobile, downloadDir })}\n`);
    await cdp.send("Browser.close", {}, 5000).catch(() => {});
    await esperar(500);
  } finally {
    cdp?.close();
    if (chrome.exitCode === null) chrome.kill("SIGTERM");
    if (server?.exitCode === null) server.kill("SIGTERM");
  }
}

async function capturarEvidenciaMobile(cdp, scenarioId) {
  await cdp.send("Emulation.setDeviceMetricsOverride", {
    width: 390,
    height: 844,
    deviceScaleFactor: 1,
    mobile: true
  });
  await cdp.evaluate(`(() => {
    document.querySelector('.resultado-premium')?.scrollIntoView({ block: 'start' });
    return true;
  })()`);
  await esperar(350);

  const metricas = await cdp.evaluate(`(() => {
    const controles = document.querySelector('.menu-controls')?.getBoundingClientRect();
    const cartao = document.querySelector('.dish-card-rich')?.getBoundingClientRect();
    return {
      viewport: window.innerWidth,
      scrollWidth: document.documentElement.scrollWidth,
      overflow: document.documentElement.scrollWidth > window.innerWidth + 1,
      menuControlsWidth: Math.round(controles?.width || 0),
      firstCardWidth: Math.round(cartao?.width || 0)
    };
  })()`);

  const captura = await cdp.send("Page.captureScreenshot", {
    format: "png",
    fromSurface: true,
    captureBeyondViewport: false
  });
  const screenshotPath = path.join(downloadDir, `${scenarioId}-mobile-390x844.png`);
  fs.writeFileSync(screenshotPath, Buffer.from(captura.data, "base64"));
  await cdp.send("Emulation.clearDeviceMetricsOverride");

  return { ...metricas, screenshotPath };
}

function validarResultadoCiclo(result, scenario) {
  const erros = [];
  const resumo = normalizarTextoBusca(result.resumoChef);
  const restricoes = normalizarTextoBusca(scenario.restricoes);
  const cardapio = normalizarTextoBusca(result.cardapioDetalhes.map(item => item.nome).join(" "));
  if (!result.operacaoPresente || result.operationPanels !== 1) erros.push("secao operacional ausente ou duplicada");
  if (result.complexidadeOperacional !== scenario.complexidadeEsperada) erros.push(`complexidade ${result.complexidadeOperacional}/${scenario.complexidadeEsperada}`);
  if (result.equipeOperacional < 3) erros.push(`equipe operacional insuficiente: ${result.equipeOperacional}`);
  if (result.fluxoOperacional !== 6) erros.push(`fluxo operacional ${result.fluxoOperacional}/6`);
  if (result.estacoesOperacionais < 3) erros.push(`estacoes operacionais insuficientes: ${result.estacoesOperacionais}`);
  if (result.cronogramaOperacional < 8) erros.push(`cronograma operacional insuficiente: ${result.cronogramaOperacional}`);
  if (result.confirmacoesPendentes !== 0) erros.push(`confirmacoes pendentes inesperadas: ${result.confirmacoesPendentes}`);
  if (!result.secoes.includes("Roteiro do Evento")) erros.push("roteiro do evento ausente");
  if (result.secoes.includes("Cronograma")) erros.push("titulo ambiguo Cronograma ainda presente");
  if (result.desktopOverflow) erros.push("overflow horizontal no desktop");
  if (result.recipeCards !== result.receitas) erros.push(`cards de receita ${result.recipeCards}/${result.receitas}`);
  if (result.coherencePanels !== 1) erros.push(`paineis de coerencia ${result.coherencePanels}/1`);
  if (result.menuBlocks < 1 || result.menuBlocks >= result.cardapio) erros.push(`blocos do cardapio ${result.menuBlocks}/${result.cardapio}`);
  if (result.menuBlockDetails !== result.menuBlocks) erros.push(`detalhes de bloco ${result.menuBlockDetails}/${result.menuBlocks}`);
  if (result.coberturaCulinaria.receitas_cobertas !== result.coberturaCulinaria.pratos_com_preparo) {
    erros.push(`receitas cobertas ${result.coberturaCulinaria.receitas_cobertas}/${result.coberturaCulinaria.pratos_com_preparo}`);
  }
  if (result.coberturaCulinaria.receitas_completas !== result.coberturaCulinaria.pratos_com_preparo) {
    erros.push(`receitas completas ${result.coberturaCulinaria.receitas_completas}/${result.coberturaCulinaria.pratos_com_preparo}`);
  }
  if (result.shoppingItems !== result.compras) erros.push(`itens de compra ${result.shoppingItems}/${result.compras}`);
  if (temPromessaAlimentarAbsoluta(resumo)) {
    erros.push("resumo contem promessa alimentar absoluta");
  }
  if (/gluten|celiac/.test(resumo) && !/gluten|celiac/.test(restricoes)) {
    erros.push("resumo inventou restricao a gluten");
  }
  if (!/^(nenhuma|nao informado|nao informada)$/.test(restricoes) && !/contaminacao cruzada|conferencia profissional/.test(resumo)) {
    erros.push("resumo restrito sem cuidado profissional");
  }
  if (/vegetar|vegano/.test(restricoes) && /almoco|jantar/.test(normalizarTextoBusca(scenario.refeicao)) && !result.principalVegetariano) {
    erros.push("restricao vegetariana sem Prato Principal identificado");
  }
  if (/bar completo/.test(normalizarTextoBusca(scenario.alcool)) && result.bebidasAlcoolicas < 2) {
    erros.push(`bar completo com bebidas alcoolicas ${result.bebidasAlcoolicas}/2`);
  }
  if (/bar completo/.test(normalizarTextoBusca(scenario.alcool)) && result.bebidasNaoAlcoolicas < 2) {
    erros.push(`bar completo com bebidas nao alcoolicas ${result.bebidasNaoAlcoolicas}/2`);
  }
  const avisosBebidas = result.avisosDetalhes.filter(aviso => /Bebidas .* abaixo da estimativa do motor/i.test(aviso));
  if (avisosBebidas.length) erros.push(avisosBebidas.join("; "));
  (scenario.menuExpectations || []).forEach(expectativa => {
    if (!expectativa.anyOf.some(termo => cardapio.includes(normalizarTextoBusca(termo)))) {
      erros.push(`cardapio sem ${expectativa.label}`);
    }
  });
  if (erros.length) throw new Error(`${scenario.id}: ${erros.join("; ")}`);
}

function normalizarTextoBusca(valor) {
  return String(valor || "")
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase();
}

function temPromessaAlimentarAbsoluta(texto) {
  return String(texto || "")
    .split(/[.!?]+/)
    .some(frase => /atende rigorosamente|cumpre rigorosamente|garant|assegur/.test(frase)
      && /restri|alergen|gluten|lactose|celiac|contamin/.test(frase));
}

async function gerarScenario(cdp, scenario) {
  for (let tentativa = 1; tentativa <= 2; tentativa += 1) {
    const result = await cdp.evaluate(`(async () => {
      const s = ${JSON.stringify(scenario)};
      const set = (id, value) => { const el = document.getElementById(id); if (el) el.value = value ?? ''; };
      set('tipo', s.tipo);
      set('pessoas', s.pessoas);
      set('criancas', s.criancas);
      set('duracao', s.duracao);
      set('refeicao', s.refeicao);
      set('restricoes', s.restricoes);
      set('tema', s.tema);
      set('alcool', s.alcool);
      set('pais', 'Brasil');
      set('estado', 'São Paulo');
      set('cidade', 'Campinas');
      set('userChat', s.obs);
      set('horarioInicio', s.horarioInicio || '');
      set('formatoServico', s.formatoServico || 'A definir pelo Chef IA');
      set('faixaEtaria', s.faixaEtaria || 'Publico misto');
      set('infraestrutura', s.infraestrutura || 'A confirmar');
      set('prioridade', s.prioridade || 'Equilibrio geral');
      const radio = document.querySelector('input[name="estilo"][value="' + s.estilo + '"]');
      if (radio) radio.checked = true;
      window.chefIAUltimoPlano = null;
      document.getElementById('resultadoArea').dataset.planoValido = 'false';
      await gerarTudo();
      const plano = window.chefIAUltimoPlano?.dados;
      if (!plano) {
        return { ok: false, error: document.getElementById('resultadoArea')?.innerText?.slice(0, 500) || 'Sem plano' };
      }
      const secoes = Array.from(document.querySelectorAll('#resultadoArea h3')).map(el => el.textContent.trim());
      const operacao = plano.motor_logistica?.operacao || null;
      const slug = slugPDF(plano.motor_logistica?.premissas?.tipo || s.tipo);
      const normalizar = valor => String(valor || '').normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase();
      const ehAlcoolica = item => {
        const texto = normalizar([item.nome, item.descricao].filter(Boolean).join(' '));
        if (/sem alcool|nao alcool/.test(texto)) return false;
        return /cerveja|vinho|espumante|caipirinha|cachaca|gin|vodka|whisky|uisque|drink alcool|coquetel alcool/.test(texto);
      };
      const bebidas = (plano.cardapio || []).filter(item => /bebida/.test(normalizar(item.categoria)));
      return {
        ok: true,
        id: s.id,
        tipo: s.tipo,
        cardapio: plano.cardapio?.length || 0,
        receitas: plano.receitas?.length || 0,
        compras: plano.lista_compras?.length || 0,
        qualidade: plano.qualidade_culinaria?.status || 'nao_avaliado',
        avisos: plano.qualidade_culinaria?.avisos?.length || 0,
        avisosDetalhes: plano.qualidade_culinaria?.avisos || [],
        ajustesDetalhes: plano.qualidade_culinaria?.ajustes || [],
        coberturaCulinaria: plano.qualidade_culinaria?.cobertura || {},
        cardapioDetalhes: (plano.cardapio || []).map(item => ({
          nome: item.nome || '',
          categoria: item.categoria || '',
          quantidade: item.quantidade || ''
        })),
        receitasDetalhes: (plano.receitas || []).map(item => item.nome || item.cardapio_id || ''),
        resumoChef: plano.resumo_chef || '',
        principalVegetariano: (plano.cardapio || []).some(item => /prato principal/.test(normalizar(item.categoria)) && /vegetar|vegano/.test(normalizar([item.nome, item.descricao].join(' ')))),
        bebidasAlcoolicas: bebidas.filter(ehAlcoolica).length,
        bebidasNaoAlcoolicas: bebidas.filter(item => !ehAlcoolica(item)).length,
        bebidasDetalhes: bebidas.map(item => ({
          nome: item.nome || '',
          quantidade: item.quantidade || '',
          alcoolica: ehAlcoolica(item)
        })),
        comprasBebidasDetalhes: (plano.lista_compras || [])
          .filter(item => /bebida/.test(normalizar([item.setor, item.natureza].join(' '))))
          .map(item => ({ item: item.item || '', quantidade: item.quantidade || '' })),
        generationMeta: window.chefIALastResponseMeta || null,
        variedade: plano.variedade_culinaria?.status || 'sem_historico',
        historicosConsiderados: plano.variedade_culinaria?.historicos_considerados || 0,
        pratosNovos: plano.variedade_culinaria?.pratos_novos || 0,
        repeticoesEssenciais: plano.variedade_culinaria?.repeticoes_justificadas?.length || 0,
        repeticoesRevisar: plano.variedade_culinaria?.repeticoes_a_revisar?.length || 0,
        varietyPanels: document.querySelectorAll('.variety-panel').length,
        coherencePanels: document.querySelectorAll('.coherence-panel').length,
        menuBlocks: document.querySelectorAll('.menu-block-card').length,
        menuBlockDetails: document.querySelectorAll('.menu-block-details').length,
        memoriaEnviada: window.chefIALastCulinaryMemoryCount || 0,
        contextoInformado: secoes.includes('Contexto informado'),
        operacaoPresente: Boolean(operacao),
        operationPanels: document.querySelectorAll('.operation-panel').length,
        complexidadeOperacional: operacao?.complexidade?.nivel || null,
        equipeOperacional: operacao?.equipe?.length || 0,
        fluxoOperacional: operacao?.fluxo_producao?.length || 0,
        estacoesOperacionais: operacao?.estacoes?.length || 0,
        cronogramaOperacional: operacao?.cronograma_operacional?.length || 0,
        confirmacoesPendentes: operacao?.confirmacoes_pendentes?.length || 0,
        opcoesAvancadasPresentes: Boolean(document.getElementById('advancedEventOptions')),
        secoes,
        recipeCards: document.querySelectorAll('.recipe-card').length,
        shoppingItems: document.querySelectorAll('.shopping-item').length,
        historyCount: window.storageService.carregarHistorico().length,
        desktopOverflow: document.documentElement.scrollWidth > window.innerWidth + 1,
        pdfFile: 'chef-ia-' + slug + '.pdf'
      };
    })()`, 180000);
    if (result.ok) return result;
    if (tentativa === 1) {
      process.stdout.write(`  ${scenario.id}: primeira tentativa falhou; repetindo apos falha funcional...\n`);
      await esperar(3000);
    } else {
      return result;
    }
  }
}

async function confirmarServidor() {
  try {
    const response = await fetch(`${BASE_URL}/api/status`);
    if (response.ok) return null;
  } catch {}

  const server = spawn(process.execPath, ["server.js"], {
    cwd: path.join(__dirname, ".."),
    env: process.env,
    stdio: "ignore"
  });

  for (let tentativa = 0; tentativa < 60; tentativa += 1) {
    if (server.exitCode !== null) throw new Error("Servidor local encerrou durante a inicializacao.");
    try {
      const response = await fetch(`${BASE_URL}/api/status`);
      if (response.ok) return server;
    } catch {}
    await esperar(250);
  }

  if (server.exitCode === null) server.kill("SIGTERM");
  throw new Error("Servidor local indisponivel.");
}

async function aguardarPaginaDebug() {
  for (let tentativa = 0; tentativa < 60; tentativa += 1) {
    try {
      const pages = await fetch(`http://127.0.0.1:${DEBUG_PORT}/json`).then(res => res.json());
      const page = pages.find(item => item.type === "page");
      if (page) return page;
    } catch {}
    await esperar(250);
  }
  throw new Error("Chrome headless nao abriu a porta de depuracao.");
}

async function aguardarDocumento(cdp) {
  for (let tentativa = 0; tentativa < 80; tentativa += 1) {
    const ready = await cdp.evaluate("document.readyState === 'complete'");
    if (ready) return;
    await esperar(250);
  }
  throw new Error("Pagina nao terminou de carregar.");
}

async function aguardarArquivo(filePath) {
  for (let tentativa = 0; tentativa < 80; tentativa += 1) {
    if (fs.existsSync(filePath) && !fs.existsSync(`${filePath}.crdownload`)) return;
    await esperar(250);
  }
  throw new Error(`Download nao concluido: ${filePath}`);
}

function esperar(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

main().catch(error => {
  console.error(`FALHA: ${error.message}`);
  process.exitCode = 1;
});
