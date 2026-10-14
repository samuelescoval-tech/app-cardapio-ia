const test = require('node:test');
const assert = require('node:assert/strict');
const {selecionarImagensLocais} = require('../src/services/images/image-catalog.service');
const {criarImageSelectionService} = require('../src/services/images/image-selection.service');
const {criarOpenverseService} = require('../src/services/images/openverse.service');

test('familias especificas cobrem doces, salgados, arroz e folhas sem trocar aveia por ave', () => {
  for (const [nome,slot,arquivo] of [
    ['Brigadeiros','sobremesa','dessert-brigadeiro'],['Beijinhos','sobremesa','dessert-beijinho'],
    ['Mini-coxinhas','entrada','appetizer-coxinha'],['Arroz branco','acompanhamento','side-rice'],
    ['Pudim de leite','sobremesa','dessert-pudding'],['Bolo de cenoura','sobremesa','dessert'],
    ['Salada de folhas','salada','side-salad']]) {
    const [imagem] = selecionarImagensLocais({nome,slot});
    assert.equal(imagem.match_type,'dish-family',nome);
    assert.ok(imagem.image_url.endsWith(arquivo+'.svg'),nome);
  }
  for (const [nome,slot] of [['Aveia cremosa','principal'],['Aguardente','bebida'],['Suco da chuva','bebida']]) {
    assert.equal(selecionarImagensLocais({nome,slot})[0].match_type,'category',nome);
  }
});

test('foto autorizada aceita plural controlado, preserva sabores e nao faz busca para familia repetida', async () => {
  let chamadas=0;
  const service=criarImageSelectionService({fotoCompartilhamentoService:{listarCatalogo:async()=>[
    {id:'12345678-1234-1234-1234-123456789abc',nome_prato:'Brigadeiro',credito_publico:'Chef Ana'}]},
    openverseService:{buscar:async()=>{chamadas++;return {images:[]};}}});
  const nomes=['Brigadeiros','Brigadeiro de morango','Bolo de cenoura','Bolo de chocolate'];
  const r=await service.selecionarParaEvento({},nomes.map((nome,i)=>({id:'p'+i,nome,categoria:'Sobremesa'})));
  assert.equal(r.images[0].provider,'community');
  assert.equal(r.images[1].provider,'local');
  assert.equal(r.images[2].match_type,'dish-family');
  assert.equal(r.images[3].match_type,'dish-family');
  assert.equal(chamadas,0);
  assert.equal(r.images[0].creator,'Chef Ana');
});

test('buscas limitam concorrencia e mantem ordem/deduplicacao mesmo terminando fora de ordem', async () => {
  let ativas=0,max=0;
  const liberar=[];
  const service=criarImageSelectionService({concorrencia:2,openverseService:{buscar:solicitacao=>{
    ativas++;max=Math.max(max,ativas);
    return new Promise(resolve=>liberar.push(()=>{ativas--;resolve({images:[{
      id:'mesma',provider:'openverse',source_url:'https://example.test/mesma',
      alt:'Carpaccio sandwich with capers',image_url:'https://example.test/img.jpg'
    }]});}));
  }}});
  const promessa=service.selecionarParaEvento({},[0,1,2].map(i=>({id:'p'+i,nome:'Carpaccio com alcaparras',categoria:'Entrada'})));
  while(liberar.length<2) await new Promise(r=>setImmediate(r));
  liberar[1]();
  while(liberar.length<3) await new Promise(r=>setImmediate(r));
  liberar[2]();liberar[0]();
  const r=await promessa;
  assert.equal(max,2);
  assert.deepEqual(r.images.map(i=>i.target_id),['p0','p1','p2']);
  assert.equal(r.images[0].provider,'openverse');
  assert.equal(r.images.filter(i=>i.provider==='openverse').length,1);
});

test('prazo aborta consultas travadas e completa o menu com categorias locais', async () => {
  const sinais=[];
  const service=criarImageSelectionService({tempoMaxMs:20,concorrencia:2,
    openverseService:{buscar:(s,{signal})=>{sinais.push(signal);return new Promise(()=>{});}}});
  const r=await service.selecionarParaEvento({},[0,1,2,3].map(i=>({id:'p'+i,nome:'Preparacao autoral '+i,categoria:'Entrada'})));
  assert.ok(sinais.length<=2);
  assert.ok(sinais.every(s=>s.aborted));
  assert.equal(r.images.length,4);
  assert.ok(r.images.every(i=>i.provider==='local'));
  assert.ok(r.warnings.every(a=>a.includes('prazo')));
});

test('catalogo autorizado lento nao bloqueia alternativas locais', async () => {
  let sinal;
  const service=criarImageSelectionService({tempoMaxMs:10,
    fotoCompartilhamentoService:{listarCatalogo:({signal})=>{sinal=signal;return new Promise(()=>{});}}});
  const r=await service.selecionarParaEvento({},[{id:'p',nome:'Brigadeiro',categoria:'Sobremesa'}]);
  assert.ok(sinal.aborted);assert.equal(r.images[0].provider,'local');
  assert.ok(r.warnings[0].includes('autorizadas'));
});

test('Openverse cancela tambem leitura do corpo e nao compartilha cache entre slots', async () => {
  const controller=new AbortController();
  const service=criarOpenverseService({fetchImpl:async(url,{signal})=>({ok:true,json:()=>new Promise((resolve,reject)=>{
    signal.addEventListener('abort',()=>reject(Object.assign(new Error('abort'),{name:'AbortError'})),{once:true});
    setImmediate(()=>controller.abort());
  })})});
  await assert.rejects(service.buscar({query:'meal photography',slot:'entrada'},{signal:controller.signal}),/demorou/);
  let consultas=0;
  const cache=criarOpenverseService({fetchImpl:async()=>{consultas++;return {ok:true,json:async()=>({results:[]})};}});
  await cache.buscar({query:'meal photography',slot:'entrada'});
  await cache.buscar({query:'meal photography',slot:'principal'});
  await cache.buscar({query:'meal photography',slot:'principal'});
  assert.equal(consultas,2);
});
