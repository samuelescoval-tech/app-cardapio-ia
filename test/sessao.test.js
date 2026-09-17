const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');
const { randomUUID } = require('node:crypto');
const { criarControleSessao } = require('../public/js/sessao.service');

function armazenamento() {
  const dados = new Map();
  return { get length() { return dados.size; }, key: i => [...dados.keys()][i],
    getItem: k => dados.get(k) ?? null, setItem: (k, v) => dados.set(k, String(v)), removeItem: k => dados.delete(k) };
}
function ambiente({ local = armazenamento(), session = armazenamento(), falhaSaida = false } = {}) {
  const elementos = new Map();
  const listeners = {};
  const instancias = [];
  const timers = new Map();
  function elemento(id) {
    if (!elementos.has(id)) {
      const classes = new Set(['hidden']);
      elementos.set(id, { id, value: '', innerHTML: '', textContent: '', disabled: false, dataset: {},
        classList: { add: x => classes.add(x), remove: x => classes.delete(x), contains: x => classes.has(x),
          toggle(x, estado) { const valor = estado === undefined ? !classes.has(x) : estado; if (valor) classes.add(x); else classes.delete(x); return valor; } },
        querySelectorAll: () => [], addEventListener() {}, removeEventListener() {}, focus() {},
        getBoundingClientRect: () => ({right: 900,bottom: 60}) });
    }
    return elementos.get(id);
  }
  const contexto = vm.createContext({
    URL, AbortController, queueMicrotask, crypto: { randomUUID },
    console: { log() {}, warn() {}, error() {} },
    localStorage: local, sessionStorage: session,
    setInterval() {}, clearInterval() {},
    setTimeout(fn, ms) { const id = randomUUID(); timers.set(id, { fn, ms }); return id; },
    clearTimeout(id) { timers.delete(id); },
    requestAnimationFrame: fn => fn(),
    icon: () => '', escapeHTML: s => String(s), confirm: () => true,
    fetch: async () => { throw new Error('Requisicao inesperada'); },
    document: { querySelectorAll: () => [], getElementById: elemento, body: elemento('body'),
      addEventListener() {}, removeEventListener() {}, querySelector: () => null },
    window: { innerWidth: 1200, location: {origin:'http://localhost'}, addEventListener: (nome, fn) => { listeners[nome] = fn; }, removeEventListener() {},
      supabase: { createClient(url, key, config) {
        const registro = { config, callbacks: [], saidas: [], stop: 0, ativo: true };
        registro.client = { auth: {
          onAuthStateChange(fn) { registro.callbacks.push(fn); return { data: { subscription: { unsubscribe() { registro.ativo = false; } } } }; },
          async stopAutoRefresh() { registro.stop++; },
          async signOut(options) {
            // Verifica que revogacao ainda tem a sessao original depois da limpeza da UI.
            registro.saidas.push({ options, sessao: config.auth.storage.getItem(config.auth.storageKey) });
            if (falhaSaida) return { error: new Error('Offline') };
            return { error: null };
          },
          async setSession(tokens) {
            const dados = sessaoSDK(tokens.access_token);
            config.auth.storage.setItem(config.auth.storageKey, JSON.stringify(dados));
            registro.callbacks[0]('SIGNED_IN', dados);
            return { data: { session: dados }, error: null };
          }
        } };
        instancias.push(registro);return registro.client;
      } }
    }
  });
  for (const nome of ['storage.service.js','sessao.service.js','app.js','foto-config.js','perfil.js']) {
    vm.runInContext(fs.readFileSync(path.join(__dirname, '../public/js', nome), 'utf8'), contexto);
  }
  contexto.inicializarLoginSocial('https://projeto.supabase.co', 'chave-publica-teste');
  function entrar(id) {
    session.setItem('karamu_login_inicio', String(Date.now()+1));
    contexto.prepararClienteAuth();
    const instancia = instancias.at(-1);
    const sessao = sessaoSDK(id);
    instancia.config.auth.storage.setItem(instancia.config.auth.storageKey, JSON.stringify(sessao));
    instancia.callbacks[0]('INITIAL_SESSION', sessao);
  }
  return { c: contexto, local, session, instancias, elementos, elemento, listeners, timers, entrar };
}
function sessaoSDK(id) { return { user: { id, email: `${id}@example.invalid` }, access_token: id, refresh_token: `refresh-${id}`, expires_at: Math.floor(Date.now()/1000)+3600 }; }
const plano = { cardapio: [{ nome: 'Prato privado A', categoria: 'Principal' }] };
const evento = { tipo: 'Evento privado A', pessoas: 10 };

// Teste das garantias assincronas, incluindo transports/body readers que nao abortam.
test('troca de conta invalida resposta e leitura de corpo pendentes', async () => {
  let liberar, ler;
  const controle = criarControleSessao({ fetchImpl: () => new Promise(r => { liberar = r; }) });
  controle.definir({usuarioId:'A'});
  const chamada = controle.requisitar('/perfil');
  controle.definir({usuarioId:'B'});
  liberar({ json: async () => ({ dado:'A' }) });
  await assert.rejects(chamada, {name:'AbortError'});
  const outra = controle.requisitar('/perfil');
  liberar({ json: () => new Promise(r => { ler = r; }) });
  const resposta = await outra;
  const corpo = resposta.json();
  controle.definir(null, true);
  ler({dado:'B'});
  await assert.rejects(corpo, {name:'AbortError'});
});

test('renovar token da mesma conta preserva trabalho; logout cancela requisicoes', async () => {
  let signal;
  const controle = criarControleSessao({ fetchImpl: (_, opcoes) => { signal=opcoes.signal;return new Promise(()=>{}); } });
  controle.definir({usuarioId:'A',accessToken:'1'});
  const contexto = controle.capturar();
  void controle.requisitar('/dados');
  controle.definir({usuarioId:'A',accessToken:'2'});
  assert.equal(controle.atual(contexto), true);
  controle.definir(null,true);
  assert.equal(signal.aborted,true);
  assert.equal(controle.atual(contexto),false);
});

test('logout limpa dados e revoga sessao local do SDK; evento tardio nao restaura conta', async () => {
  const a = ambiente();a.entrar('A');
  a.c.window.storageService.salvarHistorico(evento,plano);
  a.elemento('resultadoArea').innerHTML='dados privados';
  a.c.window.chefIAUltimoPlano={dados:plano};
  a.c.perfilLigarEventosUmaVez();
  a.elemento('perfilSair').onclick();
  await a.c.encerrarSessaoUsuario();
  assert.equal(a.c.obterSessaoUsuario(),null);
  assert.equal(a.elemento('resultadoArea').innerHTML,'');
  assert.equal(a.c.window.chefIAUltimoPlano,undefined);
  assert.equal(a.c.window.storageService.carregarHistorico().length,0);
  assert.equal(a.instancias[0].saidas.length,1);
  assert.equal(a.instancias[0].saidas[0].options.scope,'local');
  assert.equal(JSON.parse(a.instancias[0].saidas[0].sessao).user.id,'A');
  a.instancias[0].callbacks[0]('SIGNED_IN',sessaoSDK('A'));
  a.instancias[0].config.auth.storage.setItem(a.instancias[0].config.auth.storageKey,JSON.stringify(sessaoSDK('A')));
  assert.equal(a.c.obterSessaoUsuario(),null);
  assert.equal(a.session.getItem('karamu_auth_v2'),null);
  assert.equal(a.elemento('appSection').classList.contains('hidden'),true);
});

test('historico legado preservado sem ser lido, nova conta e demo nao veem A', async () => {
  const a=ambiente();
  const legado=JSON.stringify([{id:'antigo',evento,plano}]);
  a.local.setItem('chef_ia_historico',legado);
  a.entrar('A');
  assert.equal(a.c.window.storageService.carregarHistorico().length,0);
  a.c.window.storageService.salvarHistorico(evento,plano);
  assert.equal(a.c.window.storageService.criarMemoriaCulinaria().length,1);
  await a.c.encerrarSessaoUsuario();
  a.entrar('B');
  assert.equal(a.c.window.storageService.carregarHistorico().length,0);
  assert.equal(a.c.window.storageService.criarMemoriaCulinaria().length,0);
  assert.equal(a.local.getItem('chef_ia_historico'),legado);
  await a.c.encerrarSessaoUsuario();a.c.entrarModoDemo();
  assert.equal(a.c.window.storageService.carregarHistorico().length,0);
  assert.equal(a.c.window.storageService.carregarEntrada('antigo'),null);
});

test('falha de rede ao sair nao preserva credenciais ou diz que servidor confirmou', async () => {
  const a=ambiente({falhaSaida:true});a.entrar('A');
  await a.c.encerrarSessaoUsuario();
  assert.equal(a.c.obterSessaoUsuario(),null);
  assert.equal(a.session.getItem('karamu_auth_v2'),null);
  assert.match(a.elemento('sessaoAviso').textContent,/não foi possível confirmar/);
});

test('consulta tardia do perfil nao renderiza apos logout', async () => {
  const a=ambiente();a.entrar('A');let liberar;
  a.c.fetch=()=>new Promise(r=>{liberar=r;});
  const consulta=a.c.perfilCarregarFornecedores();
  await a.c.encerrarSessaoUsuario();
  liberar({json:async()=>({fornecedores:[{id:'f',nome:'Fornecedor privado A'}]})});
  await consulta;
  assert.equal(a.elemento('fornecedoresLista').innerHTML,'');
});

test('saida em outra aba encerra a mesma conta sem derrubar outra conta', async () => {
  const local=armazenamento();const a=ambiente({local}), b=ambiente({local}), c=ambiente({local});
  a.entrar('A');b.entrar('A');c.entrar('C');
  await a.c.encerrarSessaoUsuario();
  b.listeners.storage({key:'karamu_saida_A'});c.listeners.storage({key:'karamu_saida_A'});
  await b.c.encerrarSessaoUsuario();
  assert.equal(b.c.obterSessaoUsuario(),null);
  assert.equal(c.c.obterSessaoUsuario().usuarioId,'C');
});

test('pagina restaurada e sessao antiga apos reload respeitam marca de logout', async () => {
  const a=ambiente();a.entrar('A');
  a.local.setItem('karamu_saida_A',String(Date.now()+100));
  a.listeners.pageshow();await a.c.encerrarSessaoUsuario();
  assert.equal(a.c.obterSessaoUsuario(),null);
  const b=ambiente({local:a.local});
  b.session.setItem('karamu_login_inicio','1');
  b.instancias[0].callbacks[0]('INITIAL_SESSION',sessaoSDK('A'));
  await Promise.resolve();await b.c.encerrarSessaoUsuario();
  assert.equal(b.c.obterSessaoUsuario(),null);
});

test('login por senha entrega sessao ao mesmo SDK, sem snapshot paralelo', async () => {
  const a=ambiente();
  a.c.fetch=async()=>({ok:true,status:200,json:async()=>({ok:true,email:'A@example.invalid',access_token:'A',refresh_token:'refresh-A'})});
  a.c.abrirModalConta();
  a.elemento('authEmailInput').value='A@example.invalid';a.elemento('authSenhaInput').value='senha-ficticia';
  await a.elemento('authModalSubmit').onclick();
  assert.equal(a.c.obterSessaoUsuario()?.usuarioId,'A');
  assert.equal(a.session.getItem('chef_ia_sessao_usuario'),null);
  assert.equal(a.elemento('authSenhaInput').value,'');
  await a.c.encerrarSessaoUsuario();
});

test('expiracao sem renovacao deixa de enviar token e limpa sessao', async () => {
  const a=ambiente();a.entrar('A');
  a.c.salvarSessaoUsuario({usuarioId:'A',email:'A@example.invalid',accessToken:'A',expiraEm:1});
  assert.equal(a.c.headersComSessao().Authorization,undefined);
  const timer=[...a.timers.values()].find(t=>t.ms===0);assert.ok(timer);
  timer.fn();await a.c.encerrarSessaoUsuario();
  assert.equal(a.session.getItem('karamu_auth_v2'),null);
});

function prepararGeracao(a) {
  a.c.renderizarHistorico = () => {};
  a.c.renderizarGaleriaHistorico = () => {};
  a.c.carregarImagensEvento = async () => {};
  a.elemento('resultadoArea').insertAdjacentHTML = () => {};
  a.elemento('resultadoArea').scrollIntoView = () => {};
  a.c.exibirResultadoLuxo = (dados, pessoas, evento) => {
    a.c.window.chefIAUltimoPlano = { dados, pessoas, evento };
    a.elemento('resultadoArea').innerHTML = JSON.stringify(dados);
  };
  a.elemento('tipo').value = 'Evento B';
  a.elemento('pessoas').value = '20';
}

test('reabrir salvo depois de recarga mostra o plano completo, sem nova geracao', () => {
  const a = ambiente(); a.entrar('A'); prepararGeracao(a);
  const completo = { ...plano, receitas: [{ nome:'Receita A', ingredientes:['Arroz'], modo_preparo:'Cozinhar' }],
    lista_compras:[{item:'Arroz',quantidade:2}], cronograma:[{atividade:'Servir'}], motor_logistica:{equipe:3} };
  const id = a.c.window.storageService.salvarHistorico({tipo:'Evento A',pessoas:10,obs:'Observacao A'}, completo);
  const b = ambiente({session:a.session,local:a.local}); b.entrar('A'); prepararGeracao(b);
  assert.equal(b.elemento('resultadoArea').classList.contains('hidden'), true);
  b.c.carregarDoHistorico(id);
  assert.equal(b.elemento('resultadoArea').classList.contains('hidden'), false);
  assert.deepEqual(JSON.parse(JSON.stringify(b.c.window.chefIAUltimoPlano.dados)), completo);
  assert.equal(b.elemento('tipo').value,'Evento A');
  assert.equal(b.elemento('resultadoArea').dataset.planoValido,'true');
});

test('nova geracao nao envia memoria do evento anterior e salva resultado independente', async () => {
  const a = ambiente(); a.entrar('A'); prepararGeracao(a);
  const anterior = a.c.window.storageService.salvarHistorico({tipo:'Evento A',pessoas:10},plano);
  let enviado;
  const novo = {cardapio:[{nome:'Prato B'}],receitas:[{nome:'Receita B'}]};
  a.c.fetch = async (url, opcoes) => { enviado=JSON.parse(opcoes.body); return {ok:true,status:200,json:async()=>({ok:true,plano:novo})}; };
  await a.c.gerarTudo();
  assert.deepEqual(enviado.historico_culinario,[]);
  assert.equal(JSON.stringify(enviado).includes('Prato privado A'),false);
  assert.equal(a.c.window.chefIAUltimoPlano.dados,novo);
  assert.equal(a.c.window.storageService.carregarHistorico().length,2);
  assert.equal(a.c.window.storageService.carregarEntrada(anterior).plano.cardapio[0].nome,'Prato privado A');
});

test('geracao atrasada nao substitui projeto do historico aberto enquanto aguardava', async () => {
  const a = ambiente(); a.entrar('A'); prepararGeracao(a);
  const id = a.c.window.storageService.salvarHistorico({tipo:'Evento A',pessoas:10},plano);
  let liberar;
  a.c.fetch = () => new Promise(resolve => { liberar=resolve; });
  const geracao = a.c.gerarTudo();
  await Promise.resolve();
  a.c.carregarDoHistorico(id);
  liberar({ok:true,status:200,json:async()=>({ok:true,plano:{cardapio:[{nome:'Resposta B atrasada'}]}})});
  await geracao;
  assert.equal(a.c.window.chefIAUltimoPlano.dados.cardapio[0].nome,'Prato privado A');
  assert.equal(a.c.window.storageService.carregarHistorico().length,1);
  assert.equal(a.elemento('btnGerar').disabled,false);
});
