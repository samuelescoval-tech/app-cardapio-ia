// Verificacao do carregamento e recuperacao de imagens com API ficticia local.
// Sem login real, Supabase, Openverse ou Gemini; Chrome bloqueia destinos externos.
const assert=require('node:assert/strict');
const fs=require('node:fs');
const path=require('node:path');
const {spawn}=require('node:child_process');
const express=require('express');
const {rateLimit}=require('express-rate-limit');
const {criarImageSelectionService}=require('../src/services/images/image-selection.service');
const raiz=path.resolve(__dirname,'..');
const esperar=ms=>new Promise(r=>setTimeout(r,ms));
const fotoTeste=fs.readFileSync(path.join(raiz,'public/images/library/dessert-brigadeiro.svg'));
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
 const app=express();app.use(rateLimit({windowMs:60000,limit:2000}));
 let entregarFoto;
 app.get('/api/status',(req,res)=>res.json({ok:true,visual_references:{configured:false},recipe_references:{configured:false}}));
 app.get('/api/fotos-publicas/:id/imagem',(req,res)=>{
   if(req.params.id.startsWith('11111111')) entregarFoto=()=>res.type('image/svg+xml').send(fotoTeste);
   else res.sendStatus(404);
 });
 app.use(express.static(path.join(raiz,'public')));
 const port=35800+process.pid%300,debugPort=10500+process.pid%300;
 const server=app.listen(port,'127.0.0.1');
 let chrome,browser;
 const ate=async expression=>{for(let i=0;i<150;i++){if(await browser.evaluate(expression))return;await esperar(40);}throw new Error('Condicao nao atendida: '+expression);};
 try {
  chrome=spawn('google-chrome',['--headless=new','--no-sandbox','--disable-gpu',`--remote-debugging-port=${debugPort}`,`--user-data-dir=/tmp/karamu-imagens-chrome-${process.pid}`,'--window-size=1280,1200','about:blank'],{stdio:'ignore'});
  let pagina;
  for(let i=0;i<100&&!pagina;i++){try{pagina=(await fetch(`http://127.0.0.1:${debugPort}/json/list`).then(r=>r.json())).find(p=>p.type==='page');}catch{}if(!pagina)await esperar(50);}
  assert.ok(pagina);browser=new Browser(pagina.webSocketDebuggerUrl);await browser.connect();
  await browser.send('Network.enable');await browser.send('Network.setBlockedURLs',{urls:['https://*']});
  await browser.send('Page.navigate',{url:`http://127.0.0.1:${port}`});
  await ate(`typeof exibirResultadoLuxo==='function' && document.readyState==='complete'`);
  const pratos=[['Brigadeiros','Sobremesa'],['Beijinhos','Sobremesa'],['Coxinhas','Entrada'],['Arroz branco','Acompanhamento'],['Pudim de leite','Sobremesa'],['Bolo de cenoura','Sobremesa'],['Salada de folhas','Salada']].map(([nome,categoria],i)=>({id:'p'+i,nome,categoria,descricao:'Fixture local de verificacao'}));
  const selecionadas=await criarImageSelectionService().selecionarParaEvento({},pratos);
  await browser.evaluate(`entrarModoDemo();switchView('app');document.getElementById('resultadoArea').classList.remove('hidden');exibirResultadoLuxo({cardapio:${JSON.stringify(pratos)},receitas:[],lista_compras:[]},10);renderizarGaleriaEvento(${JSON.stringify(selecionadas)});alternarVisualizacaoCardapio('list');document.getElementById('cardapioVisualizacao').scrollIntoView({block:'start',behavior:'instant'});`);
  // Manter loading=lazy real: cada card entra no viewport e conclui sua carga.
  for(let i=0;i<pratos.length;i++) {
    await browser.evaluate(`document.querySelector('[data-dish-id="p${i}"]').scrollIntoView({block:'center',behavior:'instant'})`);
    await ate(`document.querySelector('[data-dish-id="p${i}"] [data-dish-image]').naturalWidth>0 && document.querySelector('[data-dish-id="p${i}"] .dish-visual').getAttribute('aria-busy')==='false'`);
  }
  await ate(`[...document.querySelectorAll('[data-dish-image]')].filter(i=>!i.hidden && i.naturalWidth>0).length===7`);
  assert.equal(await browser.evaluate(`document.querySelectorAll('.dish-image-label').length`),7);
  assert.equal(await browser.evaluate(`document.getElementById('cardapioVisualizacao').getBoundingClientRect().height>0`),true);
  for(const width of [1280,390,320]) {
    await browser.send('Emulation.setDeviceMetricsOverride',{width,height:1200,deviceScaleFactor:1,mobile:width<500});
    await browser.evaluate(`document.getElementById('cardapioVisualizacao').scrollIntoView({block:'start',behavior:'instant'});new Promise(r=>requestAnimationFrame(()=>requestAnimationFrame(r)))`);
    assert.equal(await browser.evaluate('document.documentElement.scrollWidth<=window.innerWidth'),true);
    fs.writeFileSync(`/tmp/karamu-imagens-${width}.png`,Buffer.from((await browser.send('Page.captureScreenshot',{format:'png'})).data,'base64'));
  }
  await browser.send('Emulation.setDeviceMetricsOverride',{width:1280,height:1200,deviceScaleFactor:1,mobile:false});
  const photo={id:'community-teste',provider:'community',target_id:'p0',slot:'sobremesa',license:'owner-authorized',creator:'Chef teste',attribution:'Credito original',alt:'Brigadeiros',image_url:'/api/fotos-publicas/11111111-1111-4111-8111-111111111111/imagem'};
  await browser.evaluate(`renderizarGaleriaEvento({images:[${JSON.stringify(photo)}],requested_targets:1});document.querySelector('[data-dish-id="p0"]').scrollIntoView({block:'center',behavior:'instant'});`);
  await ate(`document.querySelector('[data-dish-id="p0"] .dish-visual').getAttribute('aria-busy')==='true'`);
  assert.equal(await browser.evaluate(`document.querySelector('[data-dish-id="p0"] .dish-placeholder').hidden`),false);
  for(let i=0;i<100&&!entregarFoto;i++)await esperar(10);
  assert.ok(entregarFoto);entregarFoto();
  await ate(`document.querySelector('[data-dish-id="p0"] [data-dish-image]').hidden===false`);
  assert.equal(await browser.evaluate(`document.querySelector('[data-dish-id="p0"] .dish-image-label').textContent`),'Foto autorizada');
  // Foto revogada: troca automatica para alternativa local e credito atualizado.
  const revogada={...photo,image_url:'/api/fotos-publicas/22222222-2222-4222-8222-222222222222/imagem'};
  await browser.evaluate(`window.antigaImagem=document.querySelector('[data-dish-id="p0"] [data-dish-image]');renderizarGaleriaEvento({images:[${JSON.stringify(revogada)}],alternatives:{p0:[${JSON.stringify(selecionadas.images[0])}]},requested_targets:1});`);
  await ate(`chefIAGaleriaEstado.images[0].provider==='local' && document.querySelector('[data-dish-id="p0"] [data-dish-image]').naturalWidth>0`);
  assert.equal(await browser.evaluate(`document.querySelector('[data-dish-id="p0"] .dish-image-credit a').hidden`),true);
  assert.equal(await browser.evaluate(`document.querySelector('[data-gallery-key="p0"]').textContent.includes('Chef teste')`),false);
  await browser.evaluate(`antigaImagem.dispatchEvent(new Event('error'))`);
  assert.equal(await browser.evaluate(`chefIAGaleriaEstado.images[0].image_url`),selecionadas.images[0].image_url);
  assert.equal(await browser.evaluate(`chefIAGaleriaEstado.failed_urls.length`),1);
  // Dois arquivos quebrados: fila termina em contingencia e menu fica neutro.
  const quebrada={...selecionadas.images[0],id:'quebrada',image_url:'/images/library/ausente.svg',thumbnail_url:'/images/library/ausente.svg'};
  const quebrada2={...quebrada,id:'quebrada2',image_url:'/images/library/ausente-dois.svg',thumbnail_url:'/images/library/ausente-dois.svg'};
  await browser.evaluate(`renderizarGaleriaEvento({images:[${JSON.stringify(quebrada)}],alternatives:{p0:[${JSON.stringify(quebrada2)}]},requested_targets:1})`);
  await ate(`chefIAGaleriaEstado.images[0].fallback===true`);
  assert.equal(await browser.evaluate(`document.querySelector('[data-dish-id="p0"] .dish-placeholder').hidden`),false);
  assert.equal(await browser.evaluate(`document.querySelector('[data-dish-id="p0"] .dish-image-credit a').hasAttribute('href')`),false);
  assert.equal(await browser.evaluate('chefIAGaleriaEstado.coverage.missing'),1);
  // Falha tambem na contingencia nao cria ciclo de requisicoes.
  await browser.evaluate(`const img=document.querySelector('[data-gallery-key="p0"] img');img.dispatchEvent(new Event('error'));true`);
  assert.equal(await browser.evaluate(`document.querySelector('[data-gallery-key="p0"] img').hasAttribute('src')`),false);
  assert.equal(await browser.evaluate(`document.querySelector('[data-gallery-key="p0"] .gallery-image-frame').getAttribute('aria-busy')`),'false');
  console.log('PASS: sete familias locais, layout 1280/390/320, carregamento acessivel, foto autorizada, revogacao com alternativa e credito correto, erro tardio ignorado, fila quebrada/contingencia sem ciclo e fonte antiga removida.');
 } finally {browser?.socket?.close();chrome?.kill('SIGTERM');server.closeAllConnections();await new Promise(r=>server.close(r));}
}
main().catch(e=>{console.error(e);process.exitCode=1;});
