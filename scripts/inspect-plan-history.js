const { spawn } = require("node:child_process");

const profileDir = process.argv[2];
const baseUrl = process.argv[3] || "http://localhost:3000";
const debugPort = 9326;

if (!profileDir) {
  console.error("Uso: node scripts/inspect-plan-history.js <perfil-chrome> [url]");
  process.exit(1);
}

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
      this.pending.delete(message.id);
      message.error ? pending.reject(new Error(message.error.message)) : pending.resolve(message.result);
    });
  }

  send(method, params = {}) {
    const id = this.nextId++;
    return new Promise((resolve, reject) => {
      this.pending.set(id, { resolve, reject });
      this.socket.send(JSON.stringify({ id, method, params }));
    });
  }

  async evaluate(expression) {
    const result = await this.send("Runtime.evaluate", { expression, awaitPromise: true, returnByValue: true });
    if (result.exceptionDetails) throw new Error(result.exceptionDetails.text);
    return result.result.value;
  }

  close() {
    this.socket?.close();
  }
}

async function main() {
  const chrome = spawn("google-chrome", [
    "--headless=new",
    "--no-sandbox",
    "--disable-gpu",
    `--remote-debugging-port=${debugPort}`,
    `--user-data-dir=${profileDir}`,
    baseUrl
  ], { stdio: "ignore" });

  let cdp;
  try {
    const page = await aguardarPagina();
    cdp = new CdpClient(page.webSocketDebuggerUrl);
    await cdp.connect();
    await aguardarDocumento(cdp);
    const resultado = await cdp.evaluate(`(() => {
      const historico = window.storageService?.carregarHistorico?.() || [];
      return historico.map(item => ({
        tipo: item.evento?.tipo || item.tipo,
        qualidade: item.plano?.qualidade_culinaria?.status,
        avisos: item.plano?.qualidade_culinaria?.avisos || [],
        ajustes: item.plano?.qualidade_culinaria?.ajustes || [],
        cobertura: item.plano?.qualidade_culinaria?.cobertura || {},
        cardapio: (item.plano?.cardapio || []).map(prato => ({ nome: prato.nome, categoria: prato.categoria, tipo_execucao: prato.tipo_execucao })),
        compras: (item.plano?.lista_compras || []).map(compra => ({ item: compra.item, derivada: Boolean(compra.derivada_do_cardapio), origens: compra.origens })),
        roteiro: (item.plano?.cronograma || []).map(etapa => ({ hora: etapa.hora, atividade: etapa.atividade })),
        operacional: (item.plano?.motor_logistica?.operacao?.cronograma_operacional || []).map(etapa => ({ hora: etapa.hora, atividade: etapa.atividade }))
      }));
    })()`);
    process.stdout.write(`${JSON.stringify(resultado, null, 2)}\n`);
  } finally {
    cdp?.close();
    chrome.kill("SIGTERM");
  }
}

async function aguardarPagina() {
  for (let tentativa = 0; tentativa < 60; tentativa += 1) {
    try {
      const paginas = await fetch(`http://127.0.0.1:${debugPort}/json`).then(response => response.json());
      const pagina = paginas.find(item => item.type === "page");
      if (pagina) return pagina;
    } catch {}
    await esperar(250);
  }
  throw new Error("Chrome de inspecao nao iniciou.");
}

async function aguardarDocumento(cdp) {
  for (let tentativa = 0; tentativa < 60; tentativa += 1) {
    if (await cdp.evaluate("document.readyState === 'complete'")) return;
    await esperar(250);
  }
  throw new Error("Pagina de inspecao nao carregou.");
}

function esperar(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

main().catch(error => {
  console.error(`FALHA: ${error.message}`);
  process.exitCode = 1;
});
