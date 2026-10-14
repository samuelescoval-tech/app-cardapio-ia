// Chrome com API ficticia: persistencia entre sessoes, isolamento, falhas e PDF real.
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const {spawn} = require('node:child_process');
const express = require('express');
const raiz = path.resolve(__dirname,'..');
const esperar = ms => new Promise(r=>setTimeout(r,ms));
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
  const app=express(); app.use(express.json({limit:'1mb'}));
  const banco={A:new Map(),B:new Map()};
  let geracoes=0, falharGravacao=false, perderConfirmacao=false, falharExclusao=false, falharCarga=false;
  const plano={cardapio:[{nome:'Bolo tropical',categoria:'Sobremesa',quantidade:'1',unidade:'un',ingredientes:[]}],
    receitas:[{nome:'Bolo tropical',ingredientes:[{item:'Farinha',quantidade:1,unidade:'kg'}],preparo_passos:['Assar','Servir']}],
    lista_compras:[{item:'Farinha',quantidade:1,unidade:'kg',setor:'Mercearia'}],cronograma:[{horario:'14:00',atividade:'Servir bolo'}],resumo_chef:'Evento infantil independente'};
  const dono=req=>req.get('authorization')?.replace('Bearer ','');
  app.get('/',(req,res)=>res.type('html').send(fs.readFileSync(path.join(raiz,'public/index.html'),'utf8')
    .replace(/<script\b[^>]*src="https:[^>]*>[\s\S]*?<\/script>/gi,'')
    .replace('</head>','<script defer src="/test-jspdf.js"></script><script defer src="/teste-iniciar.js"></script></head>')));
  app.get('/test-jspdf.js',(req,res)=>res.sendFile(path.join(process.env.KARAMU_TEST_PG_DIR || '/tmp/karamu-db-test','node_modules/jspdf/dist/jspdf.umd.min.js')));
  app.get('/teste-iniciar.js',(req,res)=>res.type('js').send(`
    window.confirm=()=>true;
    window.entrarTeste = id => { if(!id) {limparSessaoLocal();return;} sessionStorage.setItem('karamu_login_inicio',String(Date.now()+1));salvarSessaoUsuario({usuarioId:id,email:id+'@example.invalid',accessToken:id,expiraEm:Math.floor(Date.now()/1000)+3600}); switchView('app'); };
    const PDF=window.jspdf.jsPDF;
    window.jspdf.jsPDF=function(opcoes) {const doc=new PDF(opcoes);doc.save=nome=>{window.pdfTeste={nome,conteudo:doc.output()};};return doc;};
    entrarTeste('A');window.projetosTestePronto=true;
  `));
  app.get('/api/status',(req,res)=>res.json({ok:true,visual_references:{configured:false},recipe_references:{configured:false}}));
  app.post('/gerar-cardapio',(req,res)=>{geracoes++;res.json({ok:true,plano});});
  app.use('/api/projetos',(req,res,next)=>{
    if(!banco[dono(req)]) return res.status(401).json({ok:false,error:'Entre na conta'});
    res.set('Cache-Control','no-store');next();
  });
  app.get('/api/projetos',(req,res)=>{
    const lista=[...banco[dono(req)].values()].reverse();
    const offset=Number(req.query.offset||0),limit=Number(req.query.limit||20);
    res.json({ok:true,projetos:lista.slice(offset,offset+limit).map(({plano,evento,...p})=>p),proximo_offset:offset+limit<lista.length?offset+limit:null});
  });
  app.put('/api/projetos/:id',(req,res)=>{
    if(falharGravacao) return res.status(503).json({ok:false,error:'Conexão indisponível para teste'});
    const b=banco[dono(req)];
    const p={...req.body,id:req.params.id,tipo:req.body.evento.tipo,pessoas:req.body.evento.pessoas,resumo:'Evento infantil independente',created_at:b.get(req.params.id)?.created_at||new Date().toISOString()};
    b.set(req.params.id,p);
    if(perderConfirmacao) return res.status(503).json({ok:false,error:'Confirmação perdida para teste'});
    res.json({ok:true,projeto:p});
  });
  app.get('/api/projetos/:id',(req,res)=>{
    if(falharCarga) return res.status(503).json({ok:false,error:'Carregamento indisponível para teste'});
    const projeto=banco[dono(req)].get(req.params.id);
    if(!projeto) return res.status(404).json({ok:false,error:'Projeto não encontrado nesta conta.'});
    res.json({ok:true,projeto});
  });
  app.delete('/api/projetos/:id',(req,res)=>{
    if(falharExclusao) return res.status(503).json({ok:false,error:'Exclusão indisponível para teste'});
    banco[dono(req)].delete(req.params.id);res.json({ok:true,removido:true});
  });
  app.delete('/api/projetos',(req,res)=>{banco[dono(req)].clear();res.json({ok:true,removido:true});});
  app.use(express.static(path.join(raiz,'public')));
  const port=35500+process.pid%500, debugPort=10000+process.pid%500;
  const servidor=app.listen(port,'127.0.0.1');
  let chrome,browser,outra;
  const ate=async expression=>{for(let i=0;i<100;i++){if(await browser.evaluate(expression))return;await esperar(50);}console.error(await browser.evaluate(`({geracao:document.getElementById('resultadoArea').textContent,historico:document.getElementById('historico-container').textContent,status:document.getElementById('historicoContaStatus').textContent,conta:obterSessaoUsuario()?.usuarioId,ativa:projetosConta.ativa()})`));throw new Error('Condição não atendida: '+expression);};
  try {
    chrome=spawn('google-chrome',['--headless=new','--no-sandbox','--disable-gpu',`--remote-debugging-port=${debugPort}`,`--user-data-dir=/tmp/karamu-projetos-chrome-${process.pid}`,'--window-size=1280,900','about:blank'],{stdio:'ignore'});
    let pagina;
    for(let i=0;i<100&&!pagina;i++){try{pagina=(await fetch(`http://127.0.0.1:${debugPort}/json/list`).then(r=>r.json())).find(p=>p.type==='page');}catch{}if(!pagina)await esperar(50);}
    assert.ok(pagina);browser=new Browser(pagina.webSocketDebuggerUrl);await browser.connect();
    const base=`http://127.0.0.1:${port}`;
    await browser.send('Network.enable');await browser.send('Network.setBlockedURLs',{urls:['https://*']});
    await browser.send('Page.navigate',{url:base});await ate('window.projetosTestePronto===true');
    await browser.evaluate(`document.getElementById('tipo').value='Aniversário infantil tropical';document.getElementById('pessoas').value='10';document.getElementById('btnGerar').click();`);
    await ate(`document.getElementById('historico-container').textContent.includes('Salvo na conta')`);
    assert.equal(banco.A.size,1);const id=[...banco.A.keys()][0];assert.equal(geracoes,1);
    await browser.evaluate(`entrarTeste(null);entrarTeste('B');`);
    await ate(`!projetosConta.estado().carregando`);
    assert.equal(await browser.evaluate(`document.getElementById('historico-container').textContent.includes('Aniversário infantil')`),false);
    assert.equal(banco.A.size,1);
    await browser.evaluate(`entrarTeste('A')`);await ate(`document.querySelector('[data-action="carregar-historico"]')!==null`);
    // Recarga real: dados nao dependem do estado JS anterior.
    await browser.send('Page.reload');await ate(`window.projetosTestePronto===true && document.querySelector('[data-action="carregar-historico"]')!==null`);
    await browser.evaluate(`document.querySelector('[data-action="carregar-historico"]').click()`);
    await ate(`window.chefIAUltimoPlano?.dados?.receitas?.[0]?.nome === 'Bolo tropical'`);
    assert.equal(geracoes,1);
    // Falha ao carregar invalida a geracao anterior sem deixar o botao preso.
    falharCarga=true;
    await browser.evaluate(`document.getElementById('btnGerar').disabled=true;carregarDoHistorico('${id}')`);
    assert.equal(await browser.evaluate(`document.getElementById('btnGerar').disabled`),false);
    assert.match(await browser.evaluate(`document.getElementById('historicoContaStatus').textContent`),/Carregamento indisponível/);
    assert.equal(await browser.evaluate(`window.chefIAUltimoPlano.dados.receitas[0].nome`),'Bolo tropical');
    falharCarga=false;
    assert.equal(await browser.evaluate(`window.chefIAUltimoPlano.dados.cronograma[0].atividade`),'Servir bolo');
    await browser.evaluate('baixarRelatorioPDF()');
    const pdf=await browser.evaluate('window.pdfTeste');
    assert.match(pdf.conteudo,/^%PDF/);assert.match(pdf.conteudo,/Bolo tropical/);assert.match(pdf.conteudo,/Assar/);assert.match(pdf.conteudo,/Farinha/);
    assert.equal(geracoes,1);
    // Outra aba, sem sessionStorage herdado e sem uma nova geracao.
    const target=await browser.send('Target.createTarget',{url:'about:blank'});
    const pagina2=(await fetch(`http://127.0.0.1:${debugPort}/json/list`).then(r=>r.json())).find(p=>p.id===target.targetId);
    outra=new Browser(pagina2.webSocketDebuggerUrl);await outra.connect();
    await outra.send('Network.enable');await outra.send('Network.setBlockedURLs',{urls:['https://*']});await outra.send('Page.navigate',{url:base});
    for(let i=0;i<100;i++){if(await outra.evaluate(`window.projetosTestePronto===true && document.querySelector('[data-action="carregar-historico"]')!==null`))break;await esperar(50);}
    assert.equal(await outra.evaluate(`storageService.carregarHistorico().length`),0);
    await outra.evaluate(`carregarDoHistorico('${id}')`);
    assert.equal(await outra.evaluate(`window.chefIAUltimoPlano.dados.receitas[0].nome`),'Bolo tropical');assert.equal(geracoes,1);
    // Falha nao perde resultado, tentativa repetida recupera o mesmo UUID.
    perderConfirmacao=true;
    await browser.evaluate(`document.getElementById('tipo').value='Evento pendente';document.getElementById('btnGerar').click();`);
    await ate(`document.querySelector('[data-action="tentar-salvar"]')!==null`);
    assert.equal(banco.A.size,2);
    assert.match(await browser.evaluate(`document.getElementById('historico-container').textContent`),/Pendente/);
    await browser.send('Page.reload');await ate(`window.projetosTestePronto && document.querySelector('[data-action="tentar-salvar"]')!==null`);
    assert.equal(await browser.evaluate(`document.querySelectorAll('.historico-card').length`),2);
    perderConfirmacao=false;
    await browser.evaluate(`document.querySelector('[data-action="tentar-salvar"]').click()`);
    await ate(`document.querySelector('[data-action="tentar-salvar"]')===null`);
    assert.equal(banco.A.size,2);
    falharExclusao=true;
    await browser.evaluate(`document.querySelector('[data-action="deletar-historico"]').click()`);
    await ate(`document.getElementById('historicoContaStatus').textContent.includes('Exclusão indisponível')`);
    assert.equal(banco.A.size,2);
    falharExclusao=false;
    for(const width of [1280,390,320]) {
      await browser.send('Emulation.setDeviceMetricsOverride',{width,height:900,deviceScaleFactor:1,mobile:width<500});
      assert.equal(await browser.evaluate(`document.documentElement.scrollWidth<=window.innerWidth`),true);
    }
    await browser.evaluate('limparHistoricoUI()');await ate(`document.querySelectorAll('.historico-card').length===0`);assert.equal(banco.A.size,0);
    console.log('PASS: salvamento, logout preservando banco, troca de conta, recarga, outra aba sem cache, recuperacao completa sem IA, PDF real com receitas/compras, retry idempotente apos confirmacao perdida, exclusao falha preserva, limpeza e layout 1280/390/320px.');
  } finally {outra?.socket?.close();browser?.socket?.close();chrome?.kill('SIGTERM');servidor.closeAllConnections();await new Promise(r=>servidor.close(r));}
}
main().catch(e=>{console.error(e);process.exitCode=1;});
