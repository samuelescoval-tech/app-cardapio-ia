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


// Integra o SDK real fixado no HTML com um Auth HTTP local ficticio.
// Nunca usa credenciais, Gemini ou Supabase reais.
async function main(){
 const assert=require('node:assert/strict');const express=require('express');const crypto=require('node:crypto');
 const sdkPath=process.env.SESSION_TEST_SDK || '/tmp/karamu-supabase-browser-2.112.3.js';
 const sdk=fs.readFileSync(sdkPath);
 assert.equal(crypto.createHash('sha384').update(sdk).digest('base64'),'qafw21c/iciq0VXsi9FzkfoQv5I/V0iqE4lSNcKXPnW9/UTJLnv5CcN4FHxVLnKg');
 const app=express();app.use(express.json());const logouts=[];const pendentes=[];
 let adiarGeracao=false;
 const user=id=>({id,email:id+'@example.invalid',aud:'authenticated',role:'authenticated',app_metadata:{},user_metadata:{},identities:[]});
 const jwt=id=>[Buffer.from(JSON.stringify({alg:'HS256',typ:'JWT'})).toString('base64url'),Buffer.from(JSON.stringify({sub:id,exp:Math.floor(Date.now()/1000)+3600,aud:'authenticated',session_id:'s-'+id})).toString('base64url'),'assinatura-ficticia'].join('.');
 const usuario=req=>{try{return JSON.parse(Buffer.from((req.headers.authorization||'').split('.')[1],'base64url')).sub;}catch{return null;}};
 app.get('/',(req,res)=>res.type('html').send(fs.readFileSync('public/index.html','utf8').replace('https://cdn.jsdelivr.net/npm/@supabase/supabase-js@2.112.3/dist/umd/supabase.js','/sdk-teste.js')));
 app.get('/sdk-teste.js',(req,res)=>res.type('js').send(sdk));
 app.get('/api/status',(req,res)=>res.json({ok:true,demo_access:{required:false},auth:{supabase_url:baseUrl,supabase_anon_key:'anon-teste'},visual_references:{configured:false},recipe_references:{configured:false}}));
 app.post('/api/auth/login',(req,res)=>{const id=String(req.body.email).split('@')[0];res.json({ok:true,email:user(id).email,usuario_id:id,access_token:jwt(id),refresh_token:'refresh-'+id});});
 app.get('/auth/v1/user',(req,res)=>res.json(user(usuario(req))));
 app.get('/auth/v1/authorize',(req,res)=>res.redirect(baseUrl+'/?code=oauth-A'));
 app.post('/auth/v1/token',(req,res)=>{
  assert.equal(req.query.grant_type,'pkce');
  assert.equal(req.body.auth_code,'oauth-A');assert.ok(req.body.code_verifier);
  res.json({access_token:jwt('A'),refresh_token:'refresh-A',expires_in:3600,token_type:'bearer',user:user('A')});
 });
 app.post('/auth/v1/logout',(req,res)=>{logouts.push({id:usuario(req),scope:req.query.scope});res.status(204).end();});
 for(const [rota,chave] of [['fornecedores','fornecedores'],['fotos','fotos'],['precos','precos']])app.get('/api/'+rota,(req,res)=>res.json({ok:true,[chave]:[]}));
 app.get('/api/perfil/chave-ia',(req,res)=>res.json({ok:true,configurada:false}));
 const plano={cardapio:[{id:'p1',nome:'Prato privado A',categoria:'Principal'}],receitas:[],lista_compras:[],cronograma:[],utensilios:[],local:[],layout:[],equipe_obs:[]};
 app.post('/gerar-cardapio',(req,res)=>{if(adiarGeracao)pendentes.push(res);else res.json({ok:true,plano,meta:{}});});
 app.use(express.static('public'));
 const server=app.listen(port,'127.0.0.1');let chrome,cdp,cdp2;
 const avaliarAte=async(c,expr)=>{for(let i=0;i<100;i++){if(await c.evaluate(expr))return;await esperar(50);}throw new Error('Timeout: '+expr);};
 const entrar=async(c,id)=>{
  await c.evaluate(`(()=>{abrirModalConta();document.getElementById('authEmailInput').value='${id}@example.invalid';document.getElementById('authSenhaInput').value='senha-ficticia';document.getElementById('authModalSubmit').click();})()`);
  await avaliarAte(c,`obterSessaoUsuario()?.usuarioId === '${id}'`);
 };
 try{
  await aguardarHttp(baseUrl+'/api/status');
  chrome=spawn('google-chrome',['--headless=new','--no-sandbox','--disable-gpu','--remote-debugging-port='+debugPort,'--user-data-dir='+profileDir,'--window-size=1440,1000',baseUrl],{stdio:'ignore'});
  cdp=new CdpClient((await aguardarPaginaDebug()).webSocketDebuggerUrl);await cdp.connect();await aguardarDocumento(cdp);
  await avaliarAte(cdp,"typeof supabaseClient?.auth?.setSession === 'function'");
  await entrar(cdp,'A');
  await cdp.evaluate(`(async()=>{window.confirm=()=>true;document.getElementById('tipo').value='Almoco privado A';document.getElementById('pessoas').value='10';await gerarTudo();})()`);
  assert.equal(await cdp.evaluate('window.storageService.carregarHistorico().length'),1);
  // Recarregar durante sessao valida preserva trabalho da mesma conta.
  await cdp.send('Page.reload',{ignoreCache:true});await esperar(300);await aguardarDocumento(cdp);await avaliarAte(cdp,"obterSessaoUsuario()?.usuarioId === 'A'");
  assert.equal(await cdp.evaluate('window.storageService.carregarHistorico().length'),1);
  // Segunda aba: mesmo login, armazenamento de sessao independente.
  const target=await cdp.send('Target.createTarget',{url:baseUrl});
  const pages=await fetch(`http://127.0.0.1:${debugPort}/json/list`).then(r=>r.json());
  cdp2=new CdpClient(pages.find(x=>x.id===target.targetId).webSocketDebuggerUrl);await cdp2.connect();await aguardarDocumento(cdp2);
  await avaliarAte(cdp2,"typeof supabaseClient?.auth?.setSession === 'function'");await entrar(cdp2,'A');
  // Geracao em voo antes do logout.
  adiarGeracao=true;
  await cdp.evaluate(`(()=>{document.getElementById('tipo').value='Resposta tardia';document.getElementById('pessoas').value='10';window.__geracao=gerarTudo();})()`);
  for(let i=0;i<40&&!pendentes.length;i++)await esperar(50);
  assert.ok(pendentes.length);
  await cdp.evaluate(`(()=>{window.confirm=()=>true;perfilLigarEventosUmaVez();document.getElementById('perfilSair').click();})()`);
  await avaliarAte(cdp,"obterSessaoUsuario()===null && saidaEmCurso===null");
  await avaliarAte(cdp2,"obterSessaoUsuario()===null && saidaEmCurso===null");
  for(const res of pendentes)res.json({ok:true,plano,meta:{}});
  await cdp.evaluate('window.__geracao');
  const saida=await cdp.evaluate(`({sessao:obterSessaoUsuario(),plano:window.chefIAUltimoPlano||null,historico:window.storageService.carregarHistorico().length,resultado:document.getElementById('resultadoArea').innerHTML,appOculto:document.getElementById('appSection').classList.contains('hidden'),aviso:document.getElementById('sessaoAviso').textContent,token:headersComSessao().Authorization||null})`);
  assert.equal(saida.sessao,null);assert.equal(saida.plano,null);assert.equal(saida.historico,0);assert.equal(saida.resultado,'');assert.equal(saida.token,null);assert.equal(saida.appOculto,true);
  assert.equal(logouts.filter(x=>x.id==='A'&&x.scope==='local').length,2);
  await entrar(cdp,'B');assert.equal(await cdp.evaluate('window.storageService.carregarHistorico().length'),0);
  await cdp.evaluate("document.getElementById('btnApresentacao').click(); document.getElementById('btnIrGerador').click();");
  assert.equal(await cdp.evaluate("document.getElementById('appSection').classList.contains('hidden')"),false);
  await cdp.evaluate('encerrarSessaoUsuario()');
  await cdp.send('Page.reload',{ignoreCache:true});await esperar(300);await aguardarDocumento(cdp);
  await cdp.evaluate('entrarModoDemo();renderizarHistorico();');
  assert.equal(await cdp.evaluate('window.storageService.carregarHistorico().length'),0);
  await avaliarAte(cdp,"typeof supabaseClient?.auth?.signInWithOAuth === 'function'");
  await cdp.evaluate("abrirModalConta();document.getElementById('authGoogleButton').click();");
  await esperar(400);await aguardarDocumento(cdp);await avaliarAte(cdp,"obterSessaoUsuario()?.usuarioId === 'A'");
  assert.equal(await cdp.evaluate('window.storageService.carregarHistorico().length'),0);
  await cdp.evaluate('encerrarSessaoUsuario()');await cdp.evaluate('entrarModoDemo();');
  await cdp.send('Emulation.setDeviceMetricsOverride',{width:390,height:844,deviceScaleFactor:1,mobile:true});
  const mobile=await cdp.evaluate(`({largura:window.innerWidth,conteudo:document.documentElement.scrollWidth,geradorVisivel:document.getElementById('btnIrGerador').getBoundingClientRect().width>0})`);
  assert.equal(mobile.conteudo,mobile.largura);assert.equal(mobile.geradorVisivel,true);
  fs.writeFileSync('/tmp/karamu-sprint3a-browser.json',JSON.stringify({saida,logouts,mobile},null,2));
  const shot=await cdp.send('Page.captureScreenshot',{format:'png'});fs.writeFileSync('/tmp/karamu-sprint3a-mobile.png',Buffer.from(shot.data,'base64'));
  console.log(JSON.stringify({saida,logouts,mobile},null,2));
 }finally{cdp?.close();cdp2?.close();chrome?.kill('SIGTERM');server.close();server.closeAllConnections();}
}
main().catch(e=>{console.error(e.stack);process.exitCode=1;});
