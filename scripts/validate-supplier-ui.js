// Exercita cadastro e ligacao de produtos no Chrome, usando API local ficticia.
// Nenhuma credencial, gravacao Supabase ou geracao de IA real e utilizada.
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const { spawn } = require('node:child_process');
const express = require('express');

const raiz = path.resolve(__dirname, '..');
const port = 35000 + process.pid % 500;
const debugPort = 9800 + process.pid % 300;
const base = `http://127.0.0.1:${port}`;
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
            const timer = setTimeout(() => { this.pendentes.delete(id); reject(new Error(`Timeout ${method}`)); }, 12000);
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
    app.use(express.json());
    const catalogos = {
        A: { fornecedores: [], precos: [{ id: 'solto', item: 'Produto antigo', preco: 1, unidade: 'kg', fornecedor_id: null }], fotos: [] },
        B: { fornecedores: [], precos: [], fotos: [] }
    };
    let sequencia = 0;
    let rejeitarRemocao = false;
    let rejeitarConsulta = false;
    let respostaPendente;
    let adiarProduto = false;
    let rejeitarFotos = false;
    let enviosFoto = 0;
    const catalogo = req => catalogos[req.headers.authorization?.replace('Bearer ', '')] || catalogos.B;
    app.get('/', (req, res) => res.type('html').send(fs.readFileSync(path.join(raiz, 'public/index.html'), 'utf8')
        .replace(/<script\b[^>]*>[\s\S]*?<\/script>/gi, '')
        .replace('</body>', '<script src="/js/sessao.service.js"></script><script src="/js/foto-config.js"></script><script src="/bootstrap.js"></script><script src="/js/perfil.js"></script><script src="/start.js"></script></body>')));
    app.get('/bootstrap.js', (req, res) => res.type('js').send(`
        const controleTeste = criarControleSessao();
        controleTeste.definir({ usuarioId: 'A', email: 'A@example.invalid', accessToken: 'A' });
        function capturarContextoSessao() { return controleTeste.capturar(); }
        function contextoSessaoAtual(c) { return controleTeste.atual(c); }
        function obterSessaoUsuario() { return controleTeste.obter(); }
        function fetchDaSessao(url, opcoes, c) { return controleTeste.requisitar(url, opcoes, c); }
        function icon() { return ''; }
        function escapeHTML(s) { return String(s).replace(/[&<>"']/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c])); }
        function formatarPrecoBRL(v) { return Number(v).toLocaleString('pt-BR', {style:'currency',currency:'BRL'}); }
        function encerrarSessaoUsuario() { controleTeste.definir(null); chefIAPerfil.limpar(); }
        window.confirm = () => true;
    `));
    app.get('/start.js', (req, res) => res.type('js').send(`
        document.getElementById('perfilSection').classList.remove('hidden');
        perfilAbrir().then(() => { window.perfilTestePronto = true; });
    `));
    for (const tipo of ['fornecedores', 'precos']) {
        app.get(`/api/${tipo}`, (req, res) => {
            if (rejeitarConsulta && tipo === 'precos') return res.status(503).json({ ok: false, error: 'Consulta indisponível para teste' });
            res.json({ ok: true, [tipo]: catalogo(req)[tipo] });
        });
        app.post(`/api/${tipo}`, (req, res) => {
            const registro = { ...req.body, id: `registro-${++sequencia}` };
            catalogo(req)[tipo].push(registro);
            const enviar = () => res.json({ ok: true, [tipo === 'precos' ? 'preco' : 'fornecedor']: registro });
            if (tipo === 'precos' && adiarProduto) respostaPendente = enviar;
            else enviar();
        });
        app.put(`/api/${tipo}/:id`, (req, res) => {
            const registro = catalogo(req)[tipo].find(item => item.id === req.params.id);
            if (!registro) return res.status(404).json({ ok: false, error: 'Registro não encontrado' });
            Object.assign(registro, req.body);
            res.json({ ok: true, [tipo === 'precos' ? 'preco' : 'fornecedor']: registro });
        });
        app.delete(`/api/${tipo}/:id`, (req, res) => {
            if (rejeitarRemocao) return res.status(400).json({ ok: false, error: 'Remoção recusada para teste' });
            catalogo(req)[tipo] = catalogo(req)[tipo].filter(item => item.id !== req.params.id);
            if (tipo === 'fornecedores') catalogo(req).precos.forEach(item => { if (item.fornecedor_id === req.params.id) item.fornecedor_id = null; });
            res.json({ ok: true, removido: true });
        });
    }
    app.get('/api/fotos', (req, res) => {
        if (rejeitarFotos) return res.status(503).json({ok: false, error: 'Fotos indisponíveis para teste'});
        res.json({ok: true, fotos: catalogo(req).fotos, compartilhamento: {disponivel: true}});
    });
    app.post('/api/fotos', (req, res) => {
        enviosFoto++;
        const foto = {id: `foto-${++sequencia}`, nome_prato: req.body.nome_prato, url: req.body.arquivo};
        catalogo(req).fotos.push(foto);
        res.json({ok: true, foto});
    });
    app.delete('/api/fotos/:id', (req, res) => {
        if (rejeitarRemocao) return res.status(400).json({ok: false, error: 'Remoção da foto recusada para teste'});
        catalogo(req).fotos = catalogo(req).fotos.filter(f => f.id !== req.params.id);
        res.json({ok: true, removido: true});
    });
    app.put('/api/fotos/:id/compartilhamento', (req, res) => {
        const foto = catalogo(req).fotos.find(f => f.id === req.params.id);
        if (!foto) return res.status(404).json({ok:false, error:'Foto não encontrada'});
        if ((req.body.galeria || req.body.link) && req.body.autorizacao !== true) return res.status(400).json({ok:false});
        Object.assign(foto, {compartilhada_catalogo:req.body.galeria, token_compartilhamento:req.body.link ? '12345678-1234-1234-1234-123456789abc' : null, credito_publico:req.body.credito});
        res.json({ok:true, foto});
    });
    app.get('/api/perfil/chave-ia', (req, res) => res.json({ ok: true, configurada: false }));
    app.use(express.static(path.join(raiz, 'public')));
    const servidor = app.listen(port, '127.0.0.1');
    let chrome, browser;
    const ate = async expression => {
        for (let i = 0; i < 100; i++) { if (await browser.evaluate(expression)) return; await esperar(50); }
        throw new Error(`Condição não atendida: ${expression}`);
    };
    try {
        chrome = spawn('google-chrome', ['--headless=new', '--no-sandbox', '--disable-gpu', `--remote-debugging-port=${debugPort}`, `--user-data-dir=/tmp/karamu-fornecedor-chrome-${process.pid}`, '--window-size=1280,900', 'about:blank'], { stdio: 'ignore' });
        let pagina;
        for (let i = 0; i < 100 && !pagina; i++) {
            try { pagina = (await fetch(`http://127.0.0.1:${debugPort}/json/list`).then(r => r.json())).find(p => p.type === 'page'); } catch {}
            if (!pagina) await esperar(50);
        }
        assert.ok(pagina, 'Chrome iniciou');
        browser = new Browser(pagina.webSocketDebuggerUrl);
        await browser.connect();
        await browser.send('Network.enable');
        await browser.send('Network.setBlockedURLs', { urls: ['https://*', 'http://*.com/*'] });
        await browser.send('Page.navigate', { url: base });
        await browser.send('Page.bringToFront');
        await ate('window.perfilTestePronto === true');
        await browser.evaluate(`document.getElementById('fornecedorCadastro').open = true; document.getElementById('fornecedorNome').value = 'Hortifruti de teste'; document.getElementById('fornecedorCategoria').value = 'Hortifruti'; document.getElementById('fornecedorSubmit').click();`);
        await ate(`document.getElementById('produtosFornecedorTitulo').textContent === 'Produtos de Hortifruti de teste'`);
        const fornecedorId = catalogos.A.fornecedores[0].id;
        for (const [nome, preco] of [['Banana prata', 8.5], ['Banana nanica', 6.25]]) {
            await browser.evaluate(`document.getElementById('precoItem').value = ${JSON.stringify(nome)}; document.getElementById('precoUnidade').value = 'kg'; document.getElementById('precoValor').value = '${preco}'; document.getElementById('precoSubmit').click();`);
            await ate(`!document.getElementById('precoSubmit').disabled && document.getElementById('precosLista').textContent.includes(${JSON.stringify(nome)})`);
        }
        assert.equal(catalogos.A.precos.filter(p => p.fornecedor_id === fornecedorId).length, 2);
        assert.equal(await browser.evaluate(`document.getElementById('precoFornecedor').value`), fornecedorId);
        assert.equal(await browser.evaluate(`document.getElementById('precoCategoria').value`), 'Hortifruti');
        assert.equal(await browser.evaluate(`document.getElementById('precoValor').value`), '');
        // Editar os dados do fornecedor preserva seus produtos e o vinculo.
        await browser.evaluate(`document.getElementById('produtosVoltar').click(); document.querySelector('[data-editar-fornecedor="${fornecedorId}"]').click(); document.getElementById('fornecedorTelefone').value = '11999999999'; document.getElementById('fornecedorSubmit').click();`);
        await ate(`!document.getElementById('fornecedorSubmit').disabled && document.getElementById('produtosFornecedorDados').textContent.includes('11999999999')`);
        assert.equal(catalogos.A.fornecedores.length, 1);
        assert.equal(catalogos.A.precos.filter(p => p.fornecedor_id === fornecedorId).length, 2);
        // Falha nao pode apagar um produto da tela nem fingir sucesso.
        rejeitarRemocao = true;
        await browser.evaluate(`document.querySelector('[data-remover-preco]').click()`);
        await ate(`document.getElementById('precoErro').textContent.includes('Remoção recusada')`);
        assert.equal(catalogos.A.precos.length, 3);
        rejeitarRemocao = false;
        const bananaId = catalogos.A.precos.find(p => p.item === 'Banana prata').id;
        await browser.evaluate(`document.querySelector('[data-editar-preco="${bananaId}"]').click(); document.getElementById('precoValor').value = '9.75'; document.getElementById('precoSubmit').click()`);
        await ate(`!document.getElementById('precoSubmit').disabled && document.getElementById('precosLista').textContent.includes('9,75')`);
        assert.equal(catalogos.A.precos.find(p => p.id === bananaId).preco, 9.75);
        // Reabrir recupera registros do servidor com os vinculos e variedades.
        await browser.send('Page.reload', { ignoreCache: true });
        await ate('window.perfilTestePronto === true');
        await browser.evaluate(`document.querySelector('[data-produtos-fornecedor="${fornecedorId}"]').click()`);
        assert.equal(await browser.evaluate(`document.querySelectorAll('#precosLista .perfil-item-card').length`), 2);
        // Sem overflow horizontal no desktop e no celular.
        for (const width of [1280, 390, 320]) {
            await browser.send('Emulation.setDeviceMetricsOverride', { width, height: 900, deviceScaleFactor: 1, mobile: width < 500 });
            await esperar(150);
            assert.equal(await browser.evaluate(`document.getElementById('perfilSection').scrollWidth <= document.getElementById('perfilSection').clientWidth + 1`), true, `Layout em ${width}px`);
            fs.writeFileSync(`/tmp/karamu-fornecedores-${width}.png`, Buffer.from((await browser.send('Page.captureScreenshot', { format: 'png' })).data, 'base64'));
        }
        // Produto antigo sem fornecedor pode ser ligado sem duplicar o cadastro.
        await browser.evaluate(`document.getElementById('produtosVoltar').click(); document.getElementById('produtosSemFornecedor').click(); document.querySelector('[data-editar-preco="solto"]').click(); document.getElementById('precoFornecedor').value = '${fornecedorId}'; document.getElementById('precoSubmit').click()`);
        await ate(`!document.getElementById('precoSubmit').disabled && document.querySelectorAll('#precosLista .perfil-item-card').length === 0`);
        assert.equal(catalogos.A.precos.find(p => p.id === 'solto').fornecedor_id, fornecedorId);
        rejeitarConsulta = true;
        await browser.evaluate('perfilCarregarPrecos()');
        assert.match(await browser.evaluate(`document.getElementById('catalogoErro').textContent`), /Consulta indisponível/);
        rejeitarConsulta = false;
        // Exclusao de fornecedor preserva produtos em area recuperavel.
        await browser.evaluate(`document.getElementById('produtosVoltar').click(); document.querySelector('[data-remover-fornecedor="${fornecedorId}"]').click()`);
        await ate(`document.querySelectorAll('[data-produtos-fornecedor]').length === 0`);
        assert.ok(catalogos.A.precos.every(p => p.fornecedor_id === null));
        assert.match(await browser.evaluate(`document.getElementById('produtosSemFornecedor').textContent`), /\(3\)/);
        // Fotos: nome obrigatorio, alinhamento, recarga e falhas visiveis.
        await browser.evaluate(`perfilAtivarAba('fotos'); const bytes = Uint8Array.from(atob('iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mNk+A8AAQUBAScY42YAAAAASUVORK5CYII='), c => c.charCodeAt(0)); const arquivos = new DataTransfer(); arquivos.items.add(new File([bytes], 'bolo.png', {type:'image/png'})); document.getElementById('fotoArquivo').files = arquivos.files; document.getElementById('fotoNomePrato').value = '   '; document.getElementById('fotoSubmit').click();`);
        await ate(`document.getElementById('fotoErro').textContent.includes('nome do prato')`);
        assert.equal(enviosFoto, 0);
        for (const width of [1280, 390, 320]) {
            await browser.send('Emulation.setDeviceMetricsOverride', {width, height: 900, deviceScaleFactor: 1, mobile: width < 500});
            await esperar(250);
            assert.equal(await browser.evaluate(`Math.abs(document.getElementById('fotoNomePrato').getBoundingClientRect().left - document.getElementById('fotoArquivo').getBoundingClientRect().left) < 1`), true, `Campos alinhados ${width}px`);
            assert.equal(await browser.evaluate(`document.getElementById('perfilSection').scrollWidth <= document.getElementById('perfilSection').clientWidth + 1`), true);
            fs.writeFileSync(`/tmp/karamu-fotos-${width}.png`, Buffer.from((await browser.send('Page.captureScreenshot', {format:'png'})).data, 'base64'));
        }
        await browser.evaluate(`document.getElementById('fotoNomePrato').value = 'Bolo de cenoura'; document.getElementById('fotoSubmit').click();`);
        await ate(`document.getElementById('fotosLista').textContent.includes('Bolo de cenoura') && !document.getElementById('fotoSubmit').disabled`);
        assert.equal(catalogos.A.fotos.length, 1);
        // As permissoes comecam desligadas, sao salvas explicitamente e revogaveis.
        assert.equal(await browser.evaluate(`document.querySelector('[data-foto-galeria]').checked`), false);
        assert.equal(await browser.evaluate(`document.querySelector('[data-foto-link]').checked`), false);
        await browser.evaluate(`document.querySelector('[data-compartilhamento-foto]').open = true; document.querySelector('[data-foto-galeria]').checked = true; document.querySelector('[data-foto-link]').checked = true; document.querySelector('[data-foto-credito]').value = 'Chef Ana'; document.querySelector('[data-salvar-compartilhamento]').click();`);
        await ate(`document.querySelector('[data-compartilhamento-foto] input[readonly]') !== null`);
        assert.equal(catalogos.A.fotos[0].compartilhada_catalogo, true);
        assert.match(await browser.evaluate(`document.querySelector('[data-compartilhamento-foto] input[readonly]').value`), /\/foto\//);
        await browser.send('Emulation.setDeviceMetricsOverride', {width:390, height:900, deviceScaleFactor:1, mobile:true});
        await browser.evaluate(`document.querySelector('[data-compartilhamento-foto]').open = true`);
        await esperar(250);
        assert.equal(await browser.evaluate(`document.getElementById('perfilSection').scrollWidth <= document.getElementById('perfilSection').clientWidth + 1`), true);
        fs.writeFileSync('/tmp/karamu-foto-compartilhamento.png', Buffer.from((await browser.send('Page.captureScreenshot', {format:'png'})).data, 'base64'));
        await browser.evaluate(`document.querySelector('[data-foto-galeria]').checked = false; document.querySelector('[data-foto-link]').checked = false; document.querySelector('[data-salvar-compartilhamento]').click();`);
        await ate(`!document.querySelector('[data-foto-galeria]').checked && document.querySelector('[data-compartilhamento-foto] input[readonly]') === null`);
        assert.equal(catalogos.A.fotos[0].token_compartilhamento, null);
        assert.equal(catalogos.A.fotos[0].compartilhada_catalogo, false);
        await browser.send('Page.reload', {ignoreCache: true});
        await ate('window.perfilTestePronto === true');
        await browser.evaluate(`perfilAtivarAba('fotos')`);
        assert.equal(await browser.evaluate(`document.querySelectorAll('#fotosLista .perfil-item-card').length`), 1);
        rejeitarRemocao = true;
        await browser.evaluate(`document.querySelector('[data-remover-foto]').click()`);
        await ate(`document.getElementById('fotoErro').textContent.includes('Remoção da foto recusada')`);
        assert.equal(catalogos.A.fotos.length, 1);
        rejeitarRemocao = false;
        rejeitarFotos = true;
        await browser.evaluate('perfilCarregarFotos()');
        assert.match(await browser.evaluate(`document.getElementById('fotoErro').textContent`), /Fotos indisponíveis/);
        assert.equal(await browser.evaluate(`document.getElementById('fotosVazio').classList.contains('hidden')`), true);
        rejeitarFotos = false;
        catalogos.A.fotos[0].url = null;
        await browser.evaluate('perfilCarregarFotos()');
        assert.match(await browser.evaluate(`document.getElementById('fotosLista').textContent`), /imagem não pôde ser carregada/);
        await browser.evaluate(`perfilAtivarAba('fornecedores')`);
        // Resposta de salvamento tardia nao pode repovoar o perfil de outra conta.
        await browser.evaluate(`document.getElementById('produtosSemFornecedor').click(); document.getElementById('precoItem').value = 'Produto privado atrasado'; document.getElementById('precoUnidade').value = 'kg'; document.getElementById('precoValor').value = '1';`);
        adiarProduto = true;
        await browser.evaluate(`document.getElementById('precoSubmit').click()`);
        for (let i = 0; i < 100 && !respostaPendente; i++) await esperar(20);
        assert.ok(respostaPendente);
        await browser.evaluate(`controleTeste.definir({usuarioId:'B',email:'B@example.invalid',accessToken:'B'}); chefIAPerfil.limpar(); perfilAbrir();`);
        respostaPendente();
        await ate(`document.getElementById('perfilEmailLabel').textContent === 'B@example.invalid' && document.querySelectorAll('#precosLista .perfil-item-card').length === 0`);
        await esperar(100);
        assert.equal(await browser.evaluate(`document.getElementById('perfilSection').textContent.includes('Produto privado atrasado')`), false);
        assert.equal(await browser.evaluate(`document.getElementById('produtosFornecedorTitulo').textContent`), '');
        assert.equal(await browser.evaluate(`document.querySelectorAll('#fotosLista .perfil-item-card').length`), 0);
        await browser.evaluate(`controleTeste.definir({usuarioId:'A',email:'A@example.invalid',accessToken:'A'}); chefIAPerfil.limpar(); perfilAbrir();`);
        await ate(`document.getElementById('fotosLista').textContent.includes('Bolo de cenoura')`);
        await browser.evaluate(`document.querySelector('[data-remover-foto]').click()`);
        await ate(`document.querySelectorAll('#fotosLista .perfil-item-card').length === 0`);
        assert.equal(catalogos.A.fotos.length, 0);
        console.log('PASS: fornecedor + duas variedades, edicao, recarga, vinculo de produto antigo, erros visiveis, exclusao preservando produtos, resposta tardia entre contas e layout em 1280/390/320px.');
        console.log('PASS: foto exige nome, campos alinhados, envio e recarga, erros de consulta/remocao/imagem visiveis, isolamento e retorno a conta original.');
        console.log('PASS: galeria e link privados por padrao, autorizacao explicita nas duas opcoes, credito e revogacao na interface.');
    } finally {
        browser?.socket?.close();
        chrome?.kill('SIGTERM');
        servidor.closeAllConnections();
        await new Promise(resolve => servidor.close(resolve));
    }
}

main().catch(error => { console.error(error); process.exitCode = 1; });
