const test = require('node:test');
const assert = require('node:assert/strict');
const { randomUUID } = require('node:crypto');
const fs = require('node:fs');
const vm = require('node:vm');
const path = require('node:path');
const express = require('express');
const { once } = require('node:events');
const { criarProjetosService, prepararProjeto } = require('../src/services/projetos/projetos.service');
const { criarRotasProjetos } = require('../src/routes/projetos.routes');
const { criarProjetosConta } = require('../public/js/projetos.service');
const { criarControleSessao } = require('../public/js/sessao.service');

const evento = { tipo: 'Aniversário infantil', pessoas: 10, tema: 'Tropical', obs: 'Doces', duracao: 'padrao do evento' };
const plano = { cardapio: [{ nome: 'Bolo', categoria: 'Sobremesa' }], receitas: [{ nome: 'Bolo', preparo_passos: ['Assar', 'Servir'] }], lista_compras: [{ item: 'Farinha', quantidade: '1 kg' }], cronograma: [{ atividade: 'Servir bolo' }], motor_logistica: { equipe: 3 }, resumo_chef: 'Evento A' };
const payload = () => ({ versao: 1, evento, plano });

// Fronteira de transporte simulada; filtros do servico e rotas Express reais.
function bancoFake() {
  const linhas = new Map(); let falha = null;
  function cliente(token) {
    return { from() {
      let operacao = 'select', dados, filtros = [], range, colunas = '*';
      const q = {
        upsert(valor) { operacao = 'upsert'; dados = valor; return q; },
        select(c = '*') { colunas = c; return q; },
        eq(c, v) { filtros.push([c, v]); return q; }, order() { return q; },
        range(a,b) { range = [a,b]; return q; }, delete() { operacao = 'delete'; return q; },
        async single() { return executar(true); }, async maybeSingle() { return executar(true); },
        then(resolve, reject) { return Promise.resolve(executar(false)).then(resolve, reject); }
      };
      function executar(single) {
        if (falha) return { error: falha };
        if (operacao === 'upsert') {
          if (dados.user_id !== token) return { error: { code: '42501' } };
          const key = token + dados.id;
          linhas.set(key, { ...dados, created_at: linhas.get(key)?.created_at || new Date().toISOString() });
          return { data: { ...linhas.get(key) } };
        }
        // Nao filtrar por token implicitamente: testa tambem o filtro explicito da API.
        let lista = [...linhas.values()].filter(l => filtros.every(([c,v]) => l[c] === v));
        lista.reverse();
        if (operacao === 'delete') for (const l of lista) linhas.delete(l.user_id + l.id);
        if (range) lista = lista.slice(range[0], range[1] + 1);
        if (colunas !== '*') lista = lista.map(l => Object.fromEntries(colunas.split(',').map(c => [c,l[c]])));
        return { data: single ? lista[0] || null : lista };
      }
      return q;
    } };
  }
  return { linhas, cliente, falhar: valor => { falha = valor; } };
}

async function servidor(t) {
  const banco = bancoFake();
  const service = criarProjetosService({ criarClientePorToken: banco.cliente });
  const app = express();
  const authService = { async obterUsuario(token) {
    if (!['A','B'].includes(token)) throw Object.assign(new Error('Não autorizado'), { statusCode: 401 });
    return { usuario_id: token };
  } };
  app.use('/api/projetos', criarRotasProjetos({ authService, projetosService: service, limitador: (req,res,next) => next() }));
  app.use(express.json({limit:'20kb'}));
  app.post('/outra-rota', (req,res) => res.json({ok:true}));
  app.use((error,req,res,next) => res.status(error.status || 500).json({ok:false,error:'Corpo inválido'}));
  const server = app.listen(0,'127.0.0.1'); await once(server,'listening');
  t.after(() => new Promise(resolve => { server.close(resolve); server.closeAllConnections(); }));
  const base = `http://127.0.0.1:${server.address().port}`;
  const enviar = async (rota, method = 'GET', body, token = 'A') => {
    const response = await fetch(base + rota, { method, headers: {'Content-Type':'application/json', ...(token ? {Authorization:`Bearer ${token}`} : {})}, ...(body === undefined ? {} : {body:JSON.stringify(body)}) });
    return { response, data: await response.json() };
  };
  return { banco, enviar, base };
}

test('snapshot preserva resultado completo sem referencias transitorias ou mutacao do original', () => {
  const body = {...payload(), plano:{...plano, imagens_evento:['temporaria'], visual_references:{url:'assinada'}}};
  const dados = prepararProjeto(body);
  assert.deepEqual(dados.plano.receitas, plano.receitas);
  assert.deepEqual(dados.plano.motor_logistica, plano.motor_logistica);
  assert.equal('imagens_evento' in dados.plano,false);
  assert.equal('visual_references' in dados.plano,false);
  assert.ok(body.plano.imagens_evento);
  for (const invalido of [{...payload(),versao:2},{...payload(),plano:{}},{...payload(),evento:{tipo:'A',pessoas:0}}]) assert.throws(() => prepararProjeto(invalido));
  assert.throws(() => prepararProjeto({...payload(),plano:{...plano,resumo_chef:'a'.repeat(1024*1024)}}), {statusCode:413});
});

test('HTTP salva snapshot acima de 20 KB; repetir UUID nao duplica nem muda dono ou data', async t => {
  const c = await servidor(t), id = randomUUID();
  const body = {...payload(),user_id:'B',plano:{...plano,detalhes:'x'.repeat(30000)}};
  const a = await c.enviar('/api/projetos/'+id,'PUT',body);
  assert.equal(a.response.status,200); assert.equal(a.data.projeto.user_id,'A');
  const b = await c.enviar('/api/projetos/'+id,'PUT',body);
  assert.equal(b.data.projeto.created_at,a.data.projeto.created_at);
  assert.equal(c.banco.linhas.size,1);
  assert.equal((await c.enviar('/outra-rota','POST',body)).response.status,413);
  assert.equal((await c.enviar('/api/projetos/'+id,'PUT',{...body,grande:'x'.repeat(1024*1024)})).response.status,413);
  assert.equal((await c.enviar('/api/projetos/'+id,'PUT',body,null)).response.status,401);
});

test('HTTP lista pagina sem snapshot, recupera completo e isola consulta, remocao e limpeza por conta', async t => {
  const c = await servidor(t), id = randomUUID();
  await c.enviar('/api/projetos/'+id,'PUT',payload());
  const consulta = await c.enviar('/api/projetos');
  assert.equal(consulta.response.headers.get('cache-control'),'no-store');
  assert.equal(consulta.data.projetos[0].plano,undefined);
  assert.deepEqual((await c.enviar('/api/projetos/'+id)).data.projeto.plano,plano);
  assert.equal((await c.enviar('/api/projetos/'+id,'GET',undefined,'B')).response.status,404);
  assert.equal((await c.enviar('/api/projetos/'+id,'DELETE',undefined,'B')).response.status,404);
  await c.enviar('/api/projetos','DELETE',undefined,'B');
  assert.equal(c.banco.linhas.size,1);
  assert.deepEqual((await c.enviar('/api/projetos','GET',undefined,'B')).data.projetos,[]);
  await c.enviar('/api/projetos/'+id,'DELETE'); assert.equal(c.banco.linhas.size,0);
  assert.equal((await c.enviar('/api/projetos/invalido')).response.status,400);
});

test('HTTP pagina resultados e trata banco ausente sem falso sucesso ou detalhes internos', async t => {
  const c = await servidor(t);
  for(let i=0;i<25;i++) await c.enviar('/api/projetos/'+randomUUID(),'PUT',payload());
  const a = (await c.enviar('/api/projetos?limit=20')).data;
  const b = (await c.enviar('/api/projetos?limit=20&offset='+a.proximo_offset)).data;
  assert.equal(a.projetos.length,20); assert.equal(b.projetos.length,5); assert.equal(b.proximo_offset,null);
  assert.equal(new Set([...a.projetos,...b.projetos].map(p=>p.id)).size,25);
  assert.equal((await c.enviar('/api/projetos?offset=-1')).response.status,400);
  c.banco.falhar({code:'PGRST205',message:'internal database details'});
  const falha = await c.enviar('/api/projetos/'+randomUUID(),'PUT',payload());
  assert.equal(falha.response.status,503); assert.match(falha.data.error,/ainda não está disponível/);
  assert.equal(JSON.stringify(falha.data).includes('internal database'),false);
});

function memoria() {
  const map = new Map();
  return { getItem:k => map.get(k) || null,setItem:(k,v)=>map.set(k,v),removeItem:k=>map.delete(k) };
}
function storageReal(session = memoria()) {
  const c = vm.createContext({window:{},sessionStorage:session,localStorage:memoria(),console:{log(){},warn(){},error(){}}});
  vm.runInContext(fs.readFileSync(path.join(__dirname,'../public/js/storage.service.js'),'utf8'),c);
  return c.window.storageService;
}
const drenar = async () => { for(let i=0;i<5;i++) await new Promise(r=>setImmediate(r)); };
function clienteTeste({transporte, session = memoria()} = {}) {
  const storage = storageReal(session);
  const controle = criarControleSessao({fetchImpl:transporte});
  let projetos;
  function entrar(id) { controle.definir(id ? {usuarioId:id,accessToken:id} : null,true); storage.definirContextoHistorico(id); projetos.definirDono(id); }
  projetos = criarProjetosConta({storage,sessao:controle.obter,capturar:controle.capturar,atual:controle.atual,requisitar:controle.requisitar,headers:()=>({Authorization:'Bearer '+controle.obter()?.accessToken,'Content-Type':'application/json'}),novoId:randomUUID});
  entrar('A');
  return {projetos,entrar,storage,session};
}

test('frontend distingue resposta perdida de sucesso; retry usa mesmo UUID, recarga preserva pendencia', async () => {
  let perder = true;
  const banco = new Map(), ids = [];
  const transporte = async (url,opts) => {
    if(opts.method === 'PUT') {
      ids.push(url); const body = JSON.parse(opts.body);
      banco.set(url,{...body,id:url.split('/').at(-1),tipo:body.evento.tipo,pessoas:10,resumo:'A',created_at:new Date().toISOString()});
      if(perder) throw new Error('Conexão interrompida');
      return {ok:true,status:200,json:async()=>({ok:true,projeto:banco.get(url)})};
    }
    return {ok:true,status:200,json:async()=>({ok:true,projetos:[...banco.values()],proximo_offset:null})};
  };
  const a=clienteTeste({transporte}); const id=a.projetos.registrar(evento,plano); await drenar();
  assert.equal(a.projetos.estado().entradas[0].estado_conta,'pendente');
  assert.match(a.projetos.estado().entradas[0].erro_conta,/Conexão/);
  assert.deepEqual(JSON.parse(JSON.stringify((await a.projetos.carregar(id)).plano)),plano);
  const b=clienteTeste({transporte,session:a.session});
  assert.equal(b.projetos.estado().entradas[0].estado_conta,'pendente');
  perder=false; await b.projetos.tentarSalvar(id); await drenar();
  assert.equal(ids[0],ids[1]); assert.equal(banco.size,1);
  assert.equal(b.projetos.estado().entradas.length,1);
  assert.equal(b.projetos.estado().entradas[0].estado_conta,'salvo');
});

test('frontend descarta confirmacao tardia depois de trocar conta e limpar dados privados', async () => {
  let liberar;
  const c=clienteTeste({transporte:(url,opts)=>new Promise(r=>{liberar=()=>r({ok:true,status:200,json:async()=>({ok:true,projeto:{...JSON.parse(opts.body),id:url.split('/').at(-1)}})});})});
  c.projetos.registrar(evento,plano); c.entrar('B'); liberar(); await drenar();
  assert.equal(c.projetos.estado().entradas.length,0);
  assert.equal(c.storage.carregarHistorico().length,0);
});

test('falha de exclusao conserva o projeto; limpeza invalida consultas anteriores', async () => {
  let liberar, falhar = true;
  const c=clienteTeste({transporte:async(url,opts)=>{
    if(opts.method === 'DELETE') return {ok:!falhar,status:falhar?503:200,json:async()=>({ok:!falhar,error:'Offline'})};
    return await new Promise(r=>{liberar=()=>r({ok:true,status:200,json:async()=>({ok:true,projetos:[{id:randomUUID(),versao:1}],proximo_offset:null})});});
  }});
  const id=c.storage.salvarHistorico(evento,plano); c.storage.atualizarEntrada(id,{remoto_id:randomUUID(),estado_conta:'pendente'});
  await assert.rejects(c.projetos.remover(id),/Offline/);
  assert.ok(c.storage.carregarEntrada(id));
  const consulta=c.projetos.listar(); falhar=false; await c.projetos.limpar(); liberar(); await consulta;
  assert.equal(c.projetos.estado().entradas.length,0);
  assert.equal(c.projetos.estado().carregando,false);
});

test('recarga durante envio torna pendencia recuperavel sem novo identificador nem card duplicado', async () => {
  const a=clienteTeste({transporte:()=>new Promise(()=>{})});
  const id=a.projetos.registrar(evento,plano);
  const remoto=a.storage.carregarEntrada(id).remoto_id;
  assert.equal(a.projetos.estado().entradas[0].estado_conta,'salvando');
  let enviado;
  const b=clienteTeste({session:a.session,transporte:async(url,opts)=>{
    if(opts.method==='PUT') {enviado=url;return {ok:true,status:200,json:async()=>({ok:true,projeto:{...JSON.parse(opts.body),id:remoto,tipo:evento.tipo,pessoas:10,created_at:new Date().toISOString()}})};}
    return {ok:true,status:200,json:async()=>({ok:true,projetos:[{id:remoto,tipo:evento.tipo,pessoas:10,versao:1}],proximo_offset:null})};
  }});
  await b.projetos.listar();
  assert.equal(b.projetos.estado().entradas.length,1);
  assert.equal(b.projetos.estado().entradas[0].estado_conta,'pendente');
  await b.projetos.tentarSalvar(id);await drenar();
  assert.equal(enviado,'/api/projetos/'+remoto);
  assert.equal(b.projetos.estado().entradas.length,1);
  assert.equal(b.projetos.estado().entradas[0].estado_conta,'salvo');
});
