const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const { Module } = require('node:module');
const { once } = require('node:events');
const { criarFotosService } = require('../src/services/personalizacao/fotos.service');
const { criarPrecosService } = require('../src/services/personalizacao/precos.service');
const { ErroAutenticacao } = require('../src/services/auth/supabase-auth.service');
const fotoConfig = require('../public/js/foto-config');
const vm = require('node:vm');

// Carrega o app real com fronteiras externas substituidas. Middleware,
// handlers, validacao de arquivo, prompt e calculo de custo continuam reais.
// Nenhuma credencial, cota de IA ou banco externo e usada nestes testes.
function criarAppTeste({ precos = [], falhaPrecos = false, falhaFornecedores = false } = {}) {
  const chamadas = { prompts: [], uploads: [] };
  const storage = {
    storage: { from: () => ({ upload: async (caminho, buffer) => {
      chamadas.uploads.push({ caminho, bytes: buffer.length });
      return { error: null };
    } }) },
    from: () => ({ insert: dados => ({ select: () => ({ single: async () => ({ data: { id: 'foto-teste', ...dados }, error: null }) }) }) })
  };
  const arquivo = path.resolve(__dirname, '../server.js');
  const modulo = new Module(arquivo, module);
  modulo.filename = arquivo;
  modulo.paths = Module._nodeModulePaths(path.dirname(arquivo));
  const carregar = modulo.require.bind(modulo);
  modulo.require = nome => {
    const original = carregar(nome);
    if (nome.endsWith('/supabase-auth.service')) return { ...original, criarSupabaseAuthService: () => ({
      getStatus: () => ({ configured: true }),
      obterUsuario: async token => {
        if (token !== 'sessao-teste') throw new ErroAutenticacao('Sessao invalida.', 401);
        return { usuario_id: 'usuario-teste' };
      }
    }) };
    if (nome.endsWith('/fotos.service')) return { ...original, criarFotosService: () => criarFotosService({ criarClientePorToken: () => storage }) };
    if (nome.endsWith('/precos.service')) return { ...original, criarPrecosService: () => ({ listar: async () => {
      if (falhaPrecos) throw new Error('Banco indisponivel');
      return precos;
    } }) };
    if (nome.endsWith('/fornecedores.service')) return { ...original, criarFornecedoresService: () => ({ listar: async () => {
      if (falhaFornecedores) throw new Error('Fornecedores indisponiveis');
      return [{ id: 'f1', nome: 'Fornecedor teste' }];
    } }) };
    if (nome.endsWith('/chave-ia.service')) return { ...original, criarChaveIAService: () => ({ obterChaveDecifrada: async () => null }) };
    if (nome.endsWith('/gemini.service')) return { ...original, gerarPlano: async prompt => {
      chamadas.prompts.push(prompt);
      return { ok: true, plano: {
        cardapio: [], receitas: [],
        lista_compras: [
          { item: 'Zucchini', quantidade: '500 g' },
          { item: 'Zucchini especial', quantidade: '1 kg' },
          { item: 'Zucchini', quantidade: '2 un' },
          { item: 'Sem preco', quantidade: '1 kg' }
        ]
      } };
    } };
    return original;
  };
  modulo._compile(fs.readFileSync(arquivo, 'utf8'), arquivo);
  return { app: modulo.exports, chamadas };
}

async function iniciar(t, opcoes) {
  const contexto = criarAppTeste(opcoes);
  const servidor = contexto.app.listen(0, '127.0.0.1');
  await once(servidor, 'listening');
  t.after(() => new Promise(resolve => { servidor.close(resolve); servidor.closeAllConnections(); }));
  return {
    ...contexto,
    async enviar(rota, body, { token = 'sessao-teste', method = 'POST' } = {}) {
      const resposta = await fetch(`http://127.0.0.1:${servidor.address().port}${rota}`, {
        method,
        headers: { 'Content-Type': 'application/json', ...(token ? { Authorization: `Bearer ${token}` } : {}) },
        body: typeof body === 'string' ? body : JSON.stringify(body)
      });
      assert.match(resposta.headers.get('content-type'), /application\/json/);
      return { status: resposta.status, body: await resposta.json() };
    }
  };
}

function foto(bytes) {
  const buffer = Buffer.alloc(bytes);
  Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]).copy(buffer);
  return { tipo: 'image/png', arquivo: `data:image/png;base64,${buffer.toString('base64')}`, nome_prato: 'Teste de tamanho' };
}

test('upload HTTP aceita corpo acima de 20 KB e arquivo no limite de 3 MB', async t => {
  const c = await iniciar(t);
  for (const bytes of [30 * 1024, fotoConfig.tamanhoMaximoBytes]) {
    const payload = foto(bytes);
    assert.ok(Buffer.byteLength(JSON.stringify(payload)) < fotoConfig.corpoMaximoBytes);
    const r = await c.enviar('/api/fotos', payload);
    assert.equal(r.status, 200);
    assert.equal(r.body.foto.user_id, 'usuario-teste');
    assert.equal(c.chamadas.uploads.at(-1).bytes, bytes);
    assert.match(c.chamadas.uploads.at(-1).caminho, /^usuario-teste\//);
  }
});

test('upload HTTP rejeita excesso no arquivo e no corpo com JSON 413, sem gravar', async t => {
  const c = await iniciar(t);
  for (const payload of [foto(fotoConfig.tamanhoMaximoBytes + 1), { arquivo: 'A'.repeat(fotoConfig.corpoMaximoBytes) }]) {
    const r = await c.enviar('/api/fotos', payload);
    assert.equal(r.status, 413);
    assert.equal(r.body.error, fotoConfig.mensagemLimite);
  }
  assert.equal(c.chamadas.uploads.length, 0);
});

test('upload HTTP preserva autenticacao, assinatura real e erros de JSON', async t => {
  const c = await iniciar(t);
  const anonimo = await c.enviar('/api/fotos', foto(30000), { token: null });
  assert.equal(anonimo.status, 401);
  const invalida = await c.enviar('/api/fotos', { tipo: 'image/png', arquivo: Buffer.alloc(30000).toString('base64') });
  assert.equal(invalida.status, 400);
  const json = await c.enviar('/api/fotos', '{invalido');
  assert.equal(json.status, 400);
  assert.match(json.body.error, /JSON/);
  assert.equal(c.chamadas.uploads.length, 0);
});

test('limite HTTP de 20 KB continua nas demais rotas e metodos', async t => {
  const c = await iniciar(t);
  for (const [rota, method] of [['/gerar-cardapio', 'POST'], ['/api/precos', 'POST'], ['/api/fotos', 'PUT'], ['/api/fotos/outra', 'POST']]) {
    const r = await c.enviar(rota, { excesso: 'x'.repeat(21 * 1024) }, { method });
    assert.equal(r.status, 413);
    assert.equal(r.body.ok, false);
  }
  assert.equal(c.chamadas.prompts.length, 0);
});

function catalogoGrande() {
  return [
    ...Array.from({ length: 60 }, (_, i) => ({ id: `p${i}`, item: `Arroz ${String(i).padStart(2, '0')}`, unidade: 'kg', preco: 4 })),
    { id: 'p60', item: 'Zucchini', unidade: 'kg', preco: 10, fornecedor_id: 'f1' }
  ];
}

test('geracao HTTP usa preco depois do item 60 no custo, limitando so o prompt', async t => {
  const c = await iniciar(t, { precos: catalogoGrande() });
  const r = await c.enviar('/gerar-cardapio', { evento: { tipo: 'Almoco', pessoas: 10 } });
  assert.equal(r.status, 200);
  assert.equal(r.body.ok, true);
  assert.equal(r.body.meta.catalogo_usuario_total, 61);
  assert.equal(r.body.meta.catalogo_prompt_itens, 60);
  assert.equal(r.body.meta.catalogo_prompt_truncado, true);
  assert.equal(r.body.meta.catalogo_usuario_truncado, false);
  const custo = r.body.plano.estimativa_custo;
  assert.equal(custo.total_estimado, 5); // 500 g a R$10/kg
  assert.equal(custo.total_aproximado, 10);
  assert.equal(custo.itens[0].fornecedor, 'Fornecedor teste');
  assert.equal(custo.itens[1].correspondencia_exata, false);
  assert.equal(custo.itens[2].subtotal, null); // unidade incompativel
  assert.equal(custo.itens[3].correspondido, false);
  assert.equal((c.chamadas.prompts[0].match(/"item": "Arroz /g) || []).length, 60);
  assert.doesNotMatch(c.chamadas.prompts[0], /Zucchini/);
});

test('catalogo pequeno ou vazio nao anuncia corte, nem inventa estimativa', async t => {
  for (const precos of [[], catalogoGrande().slice(-1)]) {
    const c = await iniciar(t, { precos });
    const r = await c.enviar('/gerar-cardapio', { evento: { tipo: 'Almoco', pessoas: 10 } });
    assert.equal(r.status, 200);
    assert.equal(r.body.meta.catalogo_prompt_truncado, false);
    assert.equal(r.body.meta.catalogo_usuario_status, precos.length ? 'disponivel' : 'vazio');
    if (precos.length) assert.equal(r.body.plano.estimativa_custo.total_estimado, 5);
    else assert.equal(r.body.plano.estimativa_custo, undefined);
  }
});

test('falha de precos e sinalizada sem custo; falha de fornecedores preserva custo', async t => {
  const semPrecos = await iniciar(t, { precos: catalogoGrande(), falhaPrecos: true });
  const r1 = await semPrecos.enviar('/gerar-cardapio', { evento: { tipo: 'Almoco', pessoas: 10 } });
  assert.equal(r1.status, 200);
  assert.equal(r1.body.meta.catalogo_usuario_status, 'indisponivel');
  assert.equal(r1.body.plano.estimativa_custo, undefined);
  const semFornecedores = await iniciar(t, { precos: catalogoGrande(), falhaFornecedores: true });
  const r2 = await semFornecedores.enviar('/gerar-cardapio', { evento: { tipo: 'Almoco', pessoas: 10 } });
  assert.equal(r2.status, 200);
  assert.equal(r2.body.plano.estimativa_custo.total_estimado, 5);
  assert.equal(r2.body.plano.estimativa_custo.itens[0].fornecedor, null);
});

test('consulta de precos percorre paginas mesmo com limite menor imposto pelo banco', async () => {
  const registros = Array.from({ length: 1105 }, (_, i) => ({ id: i, item: `Item ${i}`, preco: i }));
  const inicios = [];
  const ordens = [];
  const service = criarPrecosService({ criarClientePorToken: token => {
    assert.equal(token, 'sessao-teste');
    return { from: tabela => {
      assert.equal(tabela, 'precos_usuario');
      const builder = {
        select(colunas, opcoes) {
          assert.equal(colunas, '*');
          if (inicios.length === 0) assert.equal(opcoes.count, 'exact');
          return builder;
        },
        order(campo) { ordens.push(campo); return builder; },
        async range(inicio, fim) {
          inicios.push(inicio);
          assert.ok(inicio < registros.length, 'nao deve consultar alem do total conhecido');
          return { data: registros.slice(inicio, Math.min(fim + 1, inicio + 200)), count: inicio === 0 ? registros.length : null, error: null };
        }
      };
      return builder;
    } };
  } });
  const lista = await service.listar('sessao-teste');
  assert.deepEqual(lista, registros);
  assert.deepEqual(inicios, [0, 200, 400, 600, 800, 1000]);
  assert.deepEqual(ordens.slice(0, 2), ['item', 'id']);
});

test('consulta de precos falha inteira se uma pagina falhar, sem retornar catalogo parcial', async () => {
  const service = criarPrecosService({ criarClientePorToken: () => ({ from: () => {
    const builder = {
      select() { return builder; }, order() { return builder; },
      async range(inicio) { return inicio ? { data: null, error: { message: 'Falha na segunda pagina' } } : { data: [{ item: 'Arroz' }], error: null }; }
    };
    return builder;
  } }) });
  await assert.rejects(() => service.listar('sessao-teste'), /segunda pagina/);
});

test('consulta de precos nao trata pagina vazia prematura como catalogo completo', async () => {
  const service = criarPrecosService({ criarClientePorToken: () => ({ from: () => {
    const builder = {
      select() { return builder; }, order() { return builder; },
      async range(inicio) { return { data: inicio ? [] : [{ item: 'Arroz' }], count: inicio ? null : 3, error: null }; }
    };
    return builder;
  } }) });
  await assert.rejects(() => service.listar('sessao-teste'), /catalogo mudou/);
});

function perfilTeste(tamanho, resposta) {
  const chamadas = { leituras: 0, envios: [], recargas: 0 };
  const elementos = {
    fotoErro: { textContent: '' },
    fotoArquivo: { files: [{ size: tamanho, type: 'image/png' }], value: 'foto.png' },
    fotoSubmit: { disabled: false },
    fotoNomePrato: { value: '  Prato teste  ' }
  };
  const contexto = vm.createContext({
    window: {}, console,
    document: { getElementById: id => elementos[id] },
    obterSessaoUsuario: () => ({ accessToken: 'sessao-teste' }),
    FileReader: class {
      readAsDataURL() { chamadas.leituras++; this.result = 'data:image/png;base64,teste'; this.onload(); }
    },
    capturarContextoSessao: () => 0,
    contextoSessaoAtual: () => true,
    fetchDaSessao: async (url, opcoes) => { chamadas.envios.push({ url, opcoes }); return resposta; }
  });
  for (const arquivo of ['foto-config.js', 'perfil.js']) {
    vm.runInContext(fs.readFileSync(path.join(__dirname, '../public/js', arquivo), 'utf8'), contexto);
  }
  contexto.perfilCarregarFotos = async () => { chamadas.recargas++; };
  return { contexto, elementos, chamadas };
}

test('formulario recusa foto grande antes de ler/enviar e mantém arquivo para troca', async () => {
  const c = perfilTeste(fotoConfig.tamanhoMaximoBytes + 1);
  await c.contexto.perfilEnviarFoto();
  assert.equal(c.elementos.fotoErro.textContent, fotoConfig.mensagemLimite);
  assert.equal(c.chamadas.leituras, 0);
  assert.equal(c.chamadas.envios.length, 0);
  assert.equal(c.elementos.fotoSubmit.disabled, false);
  assert.equal(c.elementos.fotoArquivo.value, 'foto.png');
});

test('formulario trata 413 da hospedagem sem tentar interpretar HTML como JSON', async () => {
  const c = perfilTeste(30000, { status: 413, ok: false, json() { throw new Error('HTML nao e JSON'); } });
  await c.contexto.perfilEnviarFoto();
  assert.equal(c.elementos.fotoErro.textContent, fotoConfig.mensagemLimite);
  assert.equal(c.elementos.fotoSubmit.disabled, false);
  assert.equal(c.elementos.fotoArquivo.value, 'foto.png');
  assert.equal(c.chamadas.recargas, 0);
});

test('formulario envia sessao e arquivo no limite, e limpa campos somente no sucesso', async () => {
  const c = perfilTeste(fotoConfig.tamanhoMaximoBytes, { status: 200, ok: true, json: async () => ({ ok: true }) });
  await c.contexto.perfilEnviarFoto();
  assert.equal(c.elementos.fotoErro.textContent, '');
  assert.equal(c.chamadas.envios[0].url, '/api/fotos');
  assert.equal(c.chamadas.envios[0].opcoes.headers.Authorization, 'Bearer sessao-teste');
  assert.equal(JSON.parse(c.chamadas.envios[0].opcoes.body).nome_prato, 'Prato teste');
  assert.equal(c.elementos.fotoArquivo.value, '');
  assert.equal(c.elementos.fotoSubmit.disabled, false);
  assert.equal(c.chamadas.recargas, 1);
});
