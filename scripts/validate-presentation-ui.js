// Regressao da navegacao/rolagem com pagina real e servico local ficticio.
// Nao usa conta, Gemini, Supabase ou perfil do navegador do usuario.
const assert = require('node:assert/strict');
const fs = require('node:fs');
const os = require('node:os');
const path = require('node:path');
const { spawn } = require('node:child_process');
const express = require('express');
const { rateLimit } = require('express-rate-limit');
const raiz = path.resolve(__dirname, '..');
const esperar = ms => new Promise(resolve => setTimeout(resolve, ms));

class Browser {
    constructor(url) { this.url = url; this.id = 0; this.pendentes = new Map(); }
    async connect() {
        this.socket = new WebSocket(this.url);
        await new Promise((resolve, reject) => {
            this.socket.addEventListener('open', resolve, { once: true });
            this.socket.addEventListener('error', reject, { once: true });
        });
        this.socket.addEventListener('message', event => {
            const mensagem = JSON.parse(event.data);
            const pendente = this.pendentes.get(mensagem.id);
            if (!pendente) return;
            this.pendentes.delete(mensagem.id);
            clearTimeout(pendente.timer);
            if (mensagem.error) pendente.reject(new Error(mensagem.error.message));
            else pendente.resolve(mensagem.result);
        });
    }
    send(method, params = {}) {
        return new Promise((resolve, reject) => {
            const id = ++this.id;
            const timer = setTimeout(() => {
                this.pendentes.delete(id);
                reject(new Error(`Timeout ${method}`));
            }, 12000);
            this.pendentes.set(id, { resolve, reject, timer });
            this.socket.send(JSON.stringify({ id, method, params }));
        });
    }
    async evaluate(expression) {
        const resposta = await this.send('Runtime.evaluate', { expression, awaitPromise: true, returnByValue: true });
        if (resposta.exceptionDetails) throw new Error(resposta.exceptionDetails.exception?.description || resposta.exceptionDetails.text);
        return resposta.result.value;
    }
}

async function main() {
    const app = express();
    app.use(rateLimit({ windowMs: 60000, limit: 3000 }));
    app.get('/api/status', (req, res) => res.json({ ok: true }));
    app.use(express.static(path.join(raiz, 'public')));
    const server = await new Promise((resolve, reject) => {
        const servidor = app.listen(0, '127.0.0.1', () => resolve(servidor));
        servidor.once('error', reject);
    });
    const perfil = fs.mkdtempSync(path.join(os.tmpdir(), 'karamu-apresentacao-chrome-'));
    let chrome, browser;
    const ate = async expression => {
        for (let i = 0; i < 150; i++) {
            if (await browser.evaluate(expression)) return;
            await esperar(40);
        }
        throw new Error('Condicao nao atendida: ' + expression);
    };
    const quadro = () => browser.evaluate('new Promise(r => requestAnimationFrame(() => requestAnimationFrame(r)))');
    const escape = async () => {
        await browser.send('Input.dispatchKeyEvent', { type: 'keyDown', key: 'Escape', code: 'Escape', windowsVirtualKeyCode: 27 });
        await browser.send('Input.dispatchKeyEvent', { type: 'keyUp', key: 'Escape', code: 'Escape', windowsVirtualKeyCode: 27 });
        await quadro();
    };
    const rolagemUnica = async contexto => {
        const medida = await browser.evaluate(`(() => {
            const pitch = document.getElementById('pitchSection');
            pitch.scrollTop = 200;
            return {
                modalAberto: document.body.classList.contains('modal-open'),
                overflow: getComputedStyle(pitch).overflowY,
                scrollInterno: pitch.scrollTop,
                transbordamento: document.documentElement.scrollWidth > innerWidth + 1
            };
        })()`);
        assert.equal(medida.modalAberto, false, contexto + ': documento ficou bloqueado');
        assert.equal(medida.overflow, 'visible', contexto + ': apresentacao criou outro scroll');
        assert.equal(medida.scrollInterno, 0, contexto + ': apresentacao ainda rola internamente');
        assert.equal(medida.transbordamento, false, contexto + ': transbordamento horizontal');
    };
    const rodapeAcessivel = async contexto => {
        await browser.evaluate(`window.scrollTo({ top: document.documentElement.scrollHeight, behavior: 'instant' })`);
        await quadro();
        assert.equal(await browser.evaluate(`(() => { const r = document.querySelector('.footer').getBoundingClientRect(); return r.top < innerHeight && r.bottom <= innerHeight + 1; })()`), true, contexto + ': rodape inacessivel');
    };
    const botaoCapaAcessivel = async contexto => {
        const medida = await browser.evaluate(`(() => {
            const botao = document.getElementById('btnToggleHeader');
            const r = botao.getBoundingClientRect();
            const pontos = [
                [r.left + 4, r.top + 4], [r.right - 4, r.top + 4],
                [r.left + 4, r.bottom - 4], [r.right - 4, r.bottom - 4],
                [r.left + r.width / 2, r.top + r.height / 2]
            ];
            return {
                visivel: r.top >= 0 && r.left >= 0 && r.bottom <= innerHeight && r.right <= innerWidth,
                largura: r.width, altura: r.height,
                alcancavel: pontos.every(([x, y]) => botao.contains(document.elementFromPoint(x, y))),
                posicao: { x: r.x, y: r.y, largura: r.width, altura: r.height }
            };
        })()`);
        assert.equal(medida.visivel, true, contexto + ': botao da capa fora da tela ' + JSON.stringify(medida.posicao));
        assert.ok(medida.largura >= 44 && medida.altura >= 44, contexto + ': alvo pequeno');
        assert.equal(medida.alcancavel, true, contexto + ': botao coberto ' + JSON.stringify(medida.posicao));
    };
    const modalBloqueado = async id => {
        await ate(`!document.getElementById('${id}').classList.contains('hidden') && document.getElementById('${id}').contains(document.activeElement)`);
        assert.equal(await browser.evaluate(`getComputedStyle(document.body).overflowY`), 'hidden', id + ': fundo nao bloqueado');
    };
    try {
        chrome = spawn('google-chrome', [
            '--headless=new', '--no-sandbox', '--disable-gpu', '--remote-debugging-port=0',
            `--user-data-dir=${perfil}`, '--window-size=1280,900', 'about:blank'
        ], { stdio: 'ignore' });
        let debugPort;
        for (let i = 0; i < 100 && !debugPort; i++) {
            try { debugPort = fs.readFileSync(path.join(perfil, 'DevToolsActivePort'), 'utf8').split('\n')[0]; } catch {}
            if (!debugPort) await esperar(50);
        }
        assert.ok(debugPort, 'Chrome nao iniciou');
        const pagina = (await fetch(`http://127.0.0.1:${debugPort}/json/list`).then(r => r.json())).find(p => p.type === 'page');
        assert.ok(pagina);
        browser = new Browser(pagina.webSocketDebuggerUrl);
        await browser.connect();
        await browser.send('Network.enable');
        await browser.send('Network.setBlockedURLs', { urls: ['https://*'] });
        await browser.send('Emulation.setEmulatedMedia', { features: [{ name: 'prefers-reduced-motion', value: 'reduce' }] });
        const casos = [320, 390, 768, 1280, 1920].map(width => ({ width, zoom: 1 }));
        // Viewport CSS pela metade e DPR 2 simulam reflow de 200%; nao substituem zoom nativo em outros navegadores.
        casos.push({ width: 1280, zoom: 2 });
        for (const { width, zoom } of casos) {
            const contexto = `${width}px-${zoom * 100}%`;
            await browser.send('Emulation.setDeviceMetricsOverride', { width: Math.round(width / zoom), height: Math.round(900 / zoom), deviceScaleFactor: zoom, mobile: width < 500 });
            await browser.send('Page.navigate', { url: `http://127.0.0.1:${server.address().port}` });
            await ate(`typeof entrarModoDemo === 'function' && document.readyState === 'complete'`);
            await browser.evaluate(`sessionStorage.clear(); switchView('pitch'); window.scrollTo({ top: 0, behavior: 'instant' });`);
            await quadro();
            await rolagemUnica(contexto + '-inicial');
            // Roda real do mouse deve movimentar o documento, sem container interno.
            await browser.send('Input.dispatchMouseEvent', { type: 'mouseWheel', x: Math.round(width / zoom) - 30, y: Math.round(400 / zoom), deltaX: 0, deltaY: 360 });
            await ate('window.scrollY > 0');
            await rodapeAcessivel(contexto);
            await browser.evaluate(`window.scrollTo({ top: 0, behavior: 'instant' }); abrirModalConta();`);
            await modalBloqueado('authModal');
            await browser.evaluate(`document.getElementById('authModalClose').click()`);
            await rolagemUnica(contexto + '-login-fechar');
            await browser.evaluate('abrirModalConta()');
            await modalBloqueado('authModal');
            await escape();
            assert.equal(await browser.evaluate(`document.getElementById('authModal').classList.contains('hidden')`), true);
            await rolagemUnica(contexto + '-login-escape');
            await browser.evaluate(`window.scrollTo({ top: 1400, behavior: 'instant' }); entrarModoDemo();`);
            await quadro();
            assert.equal(await browser.evaluate(`Boolean(document.getElementById('demoEntrarConta'))`), true, contexto + ': exemplo ficticio ausente');
            assert.equal(await browser.evaluate(`document.getElementById('demoAccessModal')`), null, contexto + ': modal de senha demo ainda existe');
            assert.equal(await browser.evaluate(`window.chefIAUltimoPlano?.dados?.cardapio?.length > 0`), true);
            await browser.evaluate(`document.getElementById('demoEntrarConta').click()`);
            await modalBloqueado('authModal');
            await browser.evaluate(`document.getElementById('authModalClose').click()`);
            await rolagemUnica(contexto + '-exemplo-entrar-fechar');
            await browser.evaluate(`switchView('pitch'); window.scrollTo({ top: 1400, behavior: 'instant' }); switchView('app');`);
            await quadro();
            assert.equal(await browser.evaluate('window.scrollY'), 0, contexto + ': inicio do gerador deslocado');
            await browser.evaluate(`document.getElementById('tipo').value = ''; document.getElementById('pessoas').value = ''; gerarTudo()`);
            assert.equal(await browser.evaluate(`document.getElementById('tipoError').textContent`), 'Informe o tipo de evento.');
            assert.equal(await browser.evaluate(`document.getElementById('pessoasError').textContent`), 'Informe o número de convidados.');
            assert.equal(await browser.evaluate(`document.getElementById('tipo').getAttribute('aria-invalid')`), 'true');
            assert.equal(await browser.evaluate(`document.getElementById('tipoListbox').classList.contains('hidden')`), true, contexto + ': sugestoes cobriram o erro');
            await browser.evaluate(`['tipo', 'pessoas'].forEach(id => {
                const campo = document.getElementById(id);
                campo.value = id === 'tipo' ? 'Evento preservado' : '12';
                campo.dispatchEvent(new Event('input', { bubbles: true }));
            })`);
            assert.equal(await browser.evaluate(`document.getElementById('tipoError').textContent`), '');
            assert.equal(await browser.evaluate(`document.getElementById('pessoasError').textContent`), '');
            await botaoCapaAcessivel(contexto + '-capa-expandida');
            await browser.evaluate(`document.getElementById('tipo').value = 'Evento preservado'; document.getElementById('pessoas').value = '12'; document.getElementById('btnToggleHeader').click();`);
            await quadro();
            assert.equal(await browser.evaluate(`document.getElementById('btnToggleHeader').getAttribute('aria-expanded')`), 'false');
            assert.equal(await browser.evaluate(`getComputedStyle(document.querySelector('#mainHero .hero-content')).display`), 'none', contexto + ': texto comprimido na capa recolhida');
            await botaoCapaAcessivel(contexto + '-capa-recolhida-topo');
            await browser.evaluate(`document.getElementById('formCard').scrollIntoView({ block: 'start', behavior: 'instant' })`);
            await quadro();
            await botaoCapaAcessivel(contexto + '-capa-recolhida-destino-formulario');
            await rodapeAcessivel(contexto + '-gerador');
            // Perfil usa as funcoes reais, mas nao requisita dados privados.
            await browser.evaluate(`if (window.chefIAPerfil) window.chefIAPerfil.abrir = async () => {}; abrirPainelPerfil();`);
            await escape();
            assert.equal(await browser.evaluate(`document.getElementById('perfilSection').classList.contains('hidden')`), true);
            await browser.evaluate(`document.getElementById('btnApresentacao').click()`);
            await quadro();
            assert.equal(await browser.evaluate('window.scrollY'), 0, contexto + ': retorno da apresentacao deslocado');
            await rolagemUnica(contexto + '-retorno-apresentacao');
            await browser.evaluate(`document.getElementById('btnIrGerador').click()`);
            assert.deepEqual(await browser.evaluate(`['tipo', 'pessoas'].map(id => document.getElementById(id).value)`), ['Evento preservado', '12']);
            assert.equal(await browser.evaluate(`document.getElementById('btnToggleHeader').getAttribute('aria-expanded')`), 'false');
            // Encerrar localmente com login aberto tambem precisa liberar o documento.
            await browser.evaluate(`abrirModalConta(); limparSessaoLocal()`);
            await rolagemUnica(contexto + '-limpeza-sessao');
            await browser.evaluate(`document.querySelectorAll('.pitch-slide')[1].scrollIntoView({ block: 'start', behavior: 'instant' })`);
            await quadro();
            assert.equal(await browser.evaluate(`(() => {
                const a = document.querySelectorAll('.pitch-slide')[1].querySelector('.flabel').getBoundingClientRect();
                const b = document.querySelector('.status-bar').getBoundingClientRect();
                return a.left < b.right && a.right > b.left && a.top < b.bottom && a.bottom > b.top;
            })()`), false, contexto + ': navegacao cobre titulo de destino');
            fs.writeFileSync(path.join(os.tmpdir(), `karamu-apresentacao-${width}-${zoom * 100}.png`), Buffer.from((await browser.send('Page.captureScreenshot', { format: 'png' })).data, 'base64'));
            console.log('PASS', contexto);
        }
        console.log('PASS: rolagem unica, rodape acessivel, login e exemplo ficticio sem senha, ida/volta sem perder formulario/capa, controle da capa inteiro acessivel, perfil e limpeza local; Chrome isolado, cinco larguras e reflow de 200% por viewport/DPR.');
    } finally {
        browser?.socket?.close();
        if (chrome && chrome.exitCode === null && chrome.signalCode === null) {
            const terminou = new Promise(resolve => chrome.once('exit', resolve));
            chrome.kill('SIGTERM');
            await Promise.race([terminou, esperar(2000)]);
            if (chrome.exitCode === null && chrome.signalCode === null) {
                chrome.kill('SIGKILL');
                await terminou;
            }
        }
        server.closeAllConnections();
        await new Promise(resolve => server.close(resolve));
        for (let tentativa = 0; tentativa < 20; tentativa++) {
            try { fs.rmSync(perfil, { recursive: true, force: true }); break; }
            catch (error) {
                if (!['ENOTEMPTY', 'EBUSY'].includes(error.code) || tentativa === 19) throw error;
                await esperar(100);
            }
        }
    }
}
main().catch(error => { console.error(error); process.exitCode = 1; });
