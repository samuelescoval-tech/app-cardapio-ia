const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const vm = require('node:vm');
const path = require('node:path');
const {criarFotoCompartilhamentoService} = require('../src/services/personalizacao/foto-compartilhamento.service');
const {criarImageSelectionService} = require('../src/services/images/image-selection.service');
const ID = '12345678-1234-1234-1234-123456789abc';

function preparar() {
  const estado = {foto: {id: ID, user_id: 'A', nome_prato: 'Bolo de cenoura', storage_path: 'A/foto.png', compartilhada_catalogo: false, token_compartilhamento: null}, downloads: 0, edicoesAdmin: 0};
  function cliente(usuario) {
    return {
      from() {
        const filtros = [];
        let atualizacao;
        const executar = () => {
          const foto = estado.foto;
          if (!foto || (usuario !== 'admin' && foto.user_id !== usuario) || !filtros.every(([k, v]) => foto[k] === v)) return null;
          if (atualizacao) { if (usuario === 'admin') estado.edicoesAdmin++; Object.assign(foto, atualizacao); }
          return {...foto};
        };
        const builder = {
          select() {return builder;},
          eq(k, v) {filtros.push([k,v]); return builder;},
          update(v) {atualizacao = v; return builder;},
          order() {return builder;}, limit() {return builder;},
          maybeSingle: async () => ({data: executar(), error: null}),
          then(resolve, reject) {const foto = executar(); return Promise.resolve({data: foto ? [foto] : [], error: null}).then(resolve, reject);}
        };
        return builder;
      },
      storage: {from: () => ({download: async () => {estado.downloads++; return {data: new Blob(['imagem']), error: null};}})}
    };
  }
  const servico = criarFotoCompartilhamentoService({admin: cliente('admin'), clienteUsuario: cliente});
  return {estado, servico};
}

test('foto privada nao aparece no catalogo nem pode ser baixada sem autorizacao', async () => {
  const {estado, servico} = preparar();
  assert.deepEqual(await servico.listarCatalogo(), []);
  await assert.rejects(() => servico.imagem(ID), /indisponível/);
  await assert.rejects(() => servico.metadadosLink(ID), /indisponível/);
  assert.equal(estado.downloads, 0);
});

test('somente proprietario autoriza e as duas permissoes funcionam independentemente', async () => {
  const {estado, servico} = preparar();
  const corpo = {galeria: true, link: true, credito: 'Chef Ana', autorizacao: true};
  await assert.rejects(() => servico.atualizar('B', ID, corpo), /não encontrada/);
  await assert.rejects(() => servico.atualizar('A', ID, {...corpo, autorizacao: false}), /autorização/);
  await servico.atualizar('A', ID, {...corpo, link: false});
  assert.equal((await servico.listarCatalogo()).length, 1);
  assert.equal(estado.foto.token_compartilhamento, null);
  await servico.imagem(ID);
  assert.equal(estado.downloads, 1);
  await servico.atualizar('A', ID, {...corpo, galeria: false});
  assert.deepEqual(await servico.listarCatalogo(), []);
  await assert.rejects(() => servico.imagem(ID), /indisponível/);
  const meta = await servico.metadadosLink(estado.foto.token_compartilhamento);
  assert.equal(meta.credito, 'Chef Ana');
  assert.deepEqual(Object.keys(meta).sort(), ['credito','imagem','nome_prato']);
  assert.equal(estado.edicoesAdmin, 0);
});

test('revogar bloqueia novos acessos e reativar gera link diferente', async () => {
  const {estado, servico} = preparar();
  const corpo = {galeria: true, link: true, credito: '', autorizacao: true};
  await servico.atualizar('A', ID, corpo);
  const antigo = estado.foto.token_compartilhamento;
  assert.equal((await servico.listarCatalogo())[0].credito_publico, 'Colaborador Karamu');
  assert.deepEqual(Object.keys((await servico.listarCatalogo())[0]).sort(), ['credito_publico','id','nome_prato']);
  await servico.imagem(antigo, true);
  await servico.atualizar('A', ID, {...corpo, galeria: false, link: false});
  await assert.rejects(() => servico.imagem(antigo, true), /revogada/);
  await assert.rejects(() => servico.imagem(ID), /revogada/);
  await servico.atualizar('A', ID, corpo);
  assert.notEqual(estado.foto.token_compartilhamento, antigo);
  await assert.rejects(() => servico.metadadosLink(antigo), /revogada/);
});

test('compartilhamento rejeita foto antiga sem nome e arquivo fora da pasta do dono', async () => {
  const {estado, servico} = preparar();
  estado.foto.nome_prato = null;
  await assert.rejects(() => servico.atualizar('A', ID, {galeria: true, link: false, credito:'', autorizacao:true}), /nome do prato/);
  estado.foto.nome_prato = 'Bolo';
  estado.foto.compartilhada_catalogo = true;
  estado.foto.storage_path = 'B/foto.png';
  await assert.rejects(() => servico.imagem(ID), /indisponível/);
  assert.equal(estado.downloads, 0);
});

test('sem chave do backend, fotos continuam privadas e compartilhar falha explicitamente', async () => {
  const servico = criarFotoCompartilhamentoService({admin: null});
  assert.equal((await servico.status('A')).disponivel, false);
  assert.deepEqual(await servico.listarCatalogo(), []);
  await assert.rejects(() => servico.atualizar('A', ID, {galeria:true, link:false, credito:'', autorizacao:true}), /não configurado/);
});

test('gerador usa foto autorizada somente para prato com nome correspondente', async () => {
  const {servico} = preparar();
  await servico.atualizar('A', ID, {galeria:true, link:false, credito:'Chef Ana', autorizacao:true});
  let consultas = 0;
  const seletor = criarImageSelectionService({fotoCompartilhamentoService: servico, openverseService: {buscar: async () => {consultas++; return {images: []};}}});
  const resultado = await seletor.selecionarParaEvento({tipo:'Aniversario'}, [{id:'bolo', nome:' Bolo de Cenoura ', categoria:'sobremesa'}, {id:'outro', nome:'Bolo de chocolate', categoria:'sobremesa'}]);
  assert.equal(resultado.images.find(i => i.target_id === 'bolo').provider, 'community');
  assert.equal(resultado.images.find(i => i.target_id === 'outro').provider, 'local');
  assert.equal(resultado.community_images, 1);
  assert.equal(resultado.coverage.status, 'review');
  await servico.atualizar('A', ID, {galeria:false, link:true, credito:'Chef Ana', autorizacao:true});
  const privado = await seletor.selecionarParaEvento({}, [{id:'bolo', nome:'Bolo de cenoura', categoria:'sobremesa'}]);
  assert.ok(privado.images.every(i => i.provider !== 'community'));
});

test('renderizador aceita rota autorizada e rejeita URLs arbitrarias para fotos de colaboradores', () => {
  const contexto = vm.createContext({window: {}, document: {getElementById: () => null}, console});
  vm.runInContext(fs.readFileSync(path.join(__dirname, '../public/js/render.js'), 'utf8'), contexto);
  const imagem = {id: ID, provider:'community', license:'owner-authorized', image_url:`/api/fotos-publicas/${ID}/imagem`, target_id:'bolo'};
  assert.equal(contexto.normalizarImagemEvento(imagem).provider, 'community');
  assert.equal(contexto.normalizarImagemEvento({...imagem, image_url:'https://exemplo.com/foto.png'}), null);
  assert.equal(contexto.normalizarImagemEvento({...imagem, license:'CC0'}), null);
});
