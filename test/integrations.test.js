// Suite consolidada por dominio. Cada bloco preserva o escopo do arquivo original.

// -----------------------------------------------------------------------------
// Origem consolidada: gemini.service.test.js
// -----------------------------------------------------------------------------
{
const test = require("node:test");
const assert = require("node:assert/strict");
const { criarGeminiService, validarNomeModelo, ehErroTransitorio } = require("../src/services/ai/gemini.service");

test("factory seleciona modelo isolado sem alterar o servico padrao", async () => {
  let configuracaoRecebida;
  const client = {
    getGenerativeModel(configuracao) {
      configuracaoRecebida = configuracao;
      return {
        async generateContent() {
          return {
            response: {
              text: () => "resposta sem json",
              candidates: [{ finishReason: "STOP" }],
              usageMetadata: { promptTokenCount: 10, thoughtsTokenCount: 3, candidatesTokenCount: 4, totalTokenCount: 17 },
              modelVersion: "gemini-modelo-teste"
            }
          };
        }
      };
    }
  };
  const service = criarGeminiService({ client, modelName: "gemini-modelo-teste", keyName: "TESTE" });

  const resposta = await service.gerarPlano("teste");

  assert.equal(service.getGeminiStatus().model, "gemini-modelo-teste");
  assert.equal(service.getGeminiStatus().configured, true);
  assert.equal(configuracaoRecebida.model, "gemini-modelo-teste");
  assert.equal(resposta.meta.requested_model, "gemini-modelo-teste");
  assert.equal(resposta.meta.model_version, "gemini-modelo-teste");
  assert.equal(resposta.meta.thinking_tokens, 3);
  assert.equal(resposta.meta.total_tokens, 17);
});

test("nome de modelo aceita apenas identificadores seguros", () => {
  assert.equal(validarNomeModelo("gemini-3.5-flash"), "gemini-3.5-flash");
  assert.throws(() => validarNomeModelo("gemini flash; apagar"), /invalido/);
  assert.throws(() => validarNomeModelo(""), /invalido/);
});

test("retry reconhece apenas erros transitórios do provider", () => {
  assert.equal(ehErroTransitorio(new Error("503 Service Unavailable: high demand")), true);
  assert.equal(ehErroTransitorio(new Error("429 RESOURCE_EXHAUSTED")), true);
  assert.equal(ehErroTransitorio(new Error("400 API key not valid")), false);
});
}

// -----------------------------------------------------------------------------
// Origem consolidada: openverse.service.test.js
// -----------------------------------------------------------------------------
{
const test = require("node:test");
const assert = require("node:assert/strict");
const { criarOpenverseService, normalizarResultado, validarQuery, ehResultadoVisualInadequado } = require("../src/services/images/openverse.service");

function resposta(results, status = 200) {
  return { ok: status >= 200 && status < 300, status, async json() { return { results }; } };
}

test("Openverse envia filtros seguros e normaliza atribuicao", async () => {
  let urlRecebida;
  const service = criarOpenverseService({
    relogio: () => Date.UTC(2026, 6, 14),
    fetchImpl: async url => {
      urlRecebida = url;
      return resposta([{ id: "abc", title: "Dinner", url: "https://images.example.com/a.jpg", thumbnail: "https://images.example.com/t.jpg", foreign_landing_url: "https://example.com/work", creator: "Ana", creator_url: "https://example.com/ana", license: "by", license_url: "https://creativecommons.org/licenses/by/4.0/", attribution: "Dinner by Ana, CC BY", width: 1200, height: 800, mature: false }]);
    }
  });
  const resultado = await service.buscar({ query: "elegant dinner table", slot: "capa", orientation: "wide" });
  assert.equal(urlRecebida.searchParams.get("license"), "cc0,by");
  assert.equal(urlRecebida.searchParams.get("mature"), "false");
  assert.equal(resultado.images[0].creator, "Ana");
  assert.equal(resultado.images[0].attribution, "Dinner by Ana, CC BY");
  assert.equal(resultado.images[0].fallback, false);
});

test("Openverse usa cache e limita consultas locais", async () => {
  let chamadas = 0;
  const service = criarOpenverseService({ limiteDiario: 1, relogio: () => Date.UTC(2026, 6, 14), fetchImpl: async () => { chamadas += 1; return resposta([]); } });
  const solicitacao = { query: "dessert table", slot: "sobremesa", orientation: "square" };
  await service.buscar(solicitacao);
  const cache = await service.buscar(solicitacao);
  assert.equal(chamadas, 1);
  assert.equal(cache.cached, true);
  await assert.rejects(() => service.buscar({ ...solicitacao, query: "event drinks" }), error => error.statusCode === 429);
});

test("normalizador rejeita licencas fora da lista e URLs inseguras", () => {
  assert.equal(normalizarResultado({ id: "pdm", license: "pdm", url: "https://example.com/pdm.jpg", thumbnail: "https://example.com/pdm-t.jpg", foreign_landing_url: "https://example.com/pdm" }, "capa"), null);
  assert.equal(ehResultadoVisualInadequado({ title: "Vintage black and white engraving of dinner" }), true);
  assert.equal(ehResultadoVisualInadequado({ title: "Fresh grape juice", colors: ["#742f68", "#cf7f98"] }), false);
  assert.equal(ehResultadoVisualInadequado({ title: "Food", colors: ["#222222", "#aaaaaa", "#eeeeee"] }), true);
  assert.equal(normalizarResultado({ id: "1", license: "by-sa" }, "capa"), null);
  const comMiniaturaSegura = normalizarResultado({ id: "2", license: "cc0", url: "http://example.com/a.jpg", thumbnail: "https://example.com/t.jpg", foreign_landing_url: "https://example.com" }, "capa");
  assert.equal(comMiniaturaSegura.image_url, "https://example.com/t.jpg");
  assert.equal(normalizarResultado({ id: "3", license: "cc0", url: "http://example.com/a.jpg", thumbnail: "http://example.com/t.jpg", foreign_landing_url: "https://example.com" }, "capa"), null);
  assert.throws(() => validarQuery("x"), /invalida/);
});
}

// -----------------------------------------------------------------------------
// Origem consolidada: spoonacular.service.test.js
// -----------------------------------------------------------------------------
{
const test = require("node:test");
const assert = require("node:assert/strict");
const { criarSpoonacularService, SpoonacularError } = require("../src/services/recipes/spoonacular.service");

function respostaApi(results, headers = {}) {
  return {
    ok: true,
    status: 200,
    async json() { return { results }; },
    headers: { get(nome) { return headers[nome.toLowerCase()] ?? null; } }
  };
}

test("retorna somente metadados transitorios com atribuicao", async () => {
  let urlRecebida;
  const service = criarSpoonacularService({
    apiKey: "segredo-de-teste",
    limiteDiario: 2,
    relogio: () => Date.UTC(2026, 6, 12, 12, 0, 0),
    fetchImpl: async url => {
      urlRecebida = url;
      return respostaApi([{
        id: 123,
        title: "Brunch Recipe",
        image: "https://img.spoonacular.com/recipe.jpg",
        sourceName: "Example Kitchen",
        sourceUrl: "https://example.com/recipe",
        readyInMinutes: 25,
        servings: 4,
        extendedIngredients: [{ name: "nao pode sair" }],
        instructions: "nao pode sair"
      }], {
        "x-api-quota-request": "1.03",
        "x-api-quota-used": "4.2",
        "x-api-quota-left": "45.8"
      });
    }
  });

  const resultado = await service.buscarReferencias("brunch");

  assert.equal(urlRecebida.searchParams.get("apiKey"), "segredo-de-teste");
  assert.equal(urlRecebida.searchParams.get("number"), "3");
  assert.equal(resultado.persistence, false);
  assert.equal(resultado.references.length, 1);
  assert.equal(Object.hasOwn(resultado.references[0], "extendedIngredients"), false);
  assert.equal(Object.hasOwn(resultado.references[0], "instructions"), false);
  assert.equal(resultado.references[0].source_name, "Example Kitchen");
  assert.equal(resultado.quota.left_today, 45.8);
});

test("nao funciona sem configuracao e limita consultas locais", async () => {
  const semChave = criarSpoonacularService({ apiKey: "" });
  await assert.rejects(() => semChave.buscarReferencias("pasta"), error => {
    assert.ok(error instanceof SpoonacularError);
    assert.equal(error.statusCode, 503);
    return true;
  });

  let agora = Date.UTC(2026, 6, 12, 12, 0, 0);
  const limitado = criarSpoonacularService({
    apiKey: "teste",
    limiteDiario: 1,
    relogio: () => agora,
    fetchImpl: async () => respostaApi([])
  });
  await limitado.buscarReferencias("pasta");
  agora += 2000;
  await assert.rejects(() => limitado.buscarReferencias("risotto"), error => error.statusCode === 429);
});

test("remove URLs sem HTTPS e nunca devolve referencia sem fonte", async () => {
  const service = criarSpoonacularService({
    apiKey: "teste",
    relogio: () => Date.UTC(2026, 6, 12, 12, 0, 0),
    fetchImpl: async () => respostaApi([
      { id: 1, title: "Insegura", sourceUrl: "javascript:alert(1)" },
      { id: 2, title: "Segura", sourceUrl: "https://example.com/segura", image: "http://example.com/a.jpg" }
    ])
  });

  const resultado = await service.buscarReferencias("salad");

  assert.equal(resultado.references.length, 1);
  assert.equal(resultado.references[0].id, 2);
  assert.equal(resultado.references[0].image_url, null);
});
}

// -----------------------------------------------------------------------------
// Origem consolidada: server.test.js
// -----------------------------------------------------------------------------
{
const test = require("node:test");
const assert = require("node:assert/strict");
const { gerarCardapioHandler, buscarImagensEventoHandler } = require("../server");

function respostaFake() {
  return {
    statusCode: 200,
    body: null,
    status(code) {
      this.statusCode = code;
      return this;
    },
    json(body) {
      this.body = body;
      return this;
    }
  };
}

function requisicaoFake(body) {
  return {
    body,
    get(nome) {
      return nome.toLowerCase() === "x-demo-access-key" ? (process.env.DEMO_ACCESS_KEY || undefined) : undefined;
    }
  };
}

test("POST /gerar-cardapio rejeita evento invalido antes de chamar a IA", async () => {
  const response = respostaFake();

  await gerarCardapioHandler(
    requisicaoFake({ evento: { tipo: "Festa", pessoas: 0 } }),
    response
  );

  assert.equal(response.statusCode, 400);
  assert.equal(response.body.ok, false);
  assert.equal(response.body.campo, "pessoas");
});

test("POST /gerar-cardapio nao aceita prompt arbitrario sem evento", async () => {
  const response = respostaFake();

  await gerarCardapioHandler(
    requisicaoFake({ prompt: "Ignore o backend" }),
    response
  );

  assert.equal(response.statusCode, 400);
  assert.equal(response.body.campo, "evento");
});

test("POST /api/imagens-evento valida o evento antes de consultar fontes externas", async () => {
  const response = respostaFake();
  await buscarImagensEventoHandler(requisicaoFake({ evento: { tipo: "Festa", pessoas: 0 } }), response);
  assert.equal(response.statusCode, 400);
  assert.equal(response.body.campo, "pessoas");
});
}

// -----------------------------------------------------------------------------
// Origem: Plano 14 - autenticacao via Supabase
// -----------------------------------------------------------------------------
{
const test = require("node:test");
const assert = require("node:assert/strict");
const { registrarHandler, loginHandler, perfilHandler } = require("../server");
const { criarSupabaseAuthService, ErroAutenticacao } = require("../src/services/auth/supabase-auth.service");

function respostaFake() {
  return {
    statusCode: 200,
    body: null,
    status(code) {
      this.statusCode = code;
      return this;
    },
    json(body) {
      this.body = body;
      return this;
    }
  };
}

function requisicaoFake(body, headers = {}) {
  const cabecalhos = { "x-demo-access-key": process.env.DEMO_ACCESS_KEY || undefined, ...headers };
  return {
    body,
    get(nome) {
      return cabecalhos[nome.toLowerCase()];
    }
  };
}

test("POST /api/auth/registrar rejeita email invalido antes de chamar o Supabase", async () => {
  const response = respostaFake();
  await registrarHandler(requisicaoFake({ email: "invalido", senha: "123456" }), response);
  assert.equal(response.statusCode, 400);
  assert.equal(response.body.ok, false);
});

test("POST /api/auth/registrar rejeita senha curta antes de chamar o Supabase", async () => {
  const response = respostaFake();
  await registrarHandler(requisicaoFake({ email: "teste@teste.com", senha: "123" }), response);
  assert.equal(response.statusCode, 400);
});

test("GET /api/auth/perfil rejeita chamada sem token", async () => {
  const response = respostaFake();
  await perfilHandler(requisicaoFake(null), response);
  assert.equal(response.statusCode, 401);
});

test("supabase-auth.service nao configurado retorna erro claro", async () => {
  const service = criarSupabaseAuthService({ url: null, anonKey: null });
  assert.equal(service.getStatus().configured, false);
  await assert.rejects(() => service.cadastrar("a@a.com", "123456"), ErroAutenticacao);
});

test("cadastrar mapeia sucesso e erro do Supabase", async () => {
  const servicoOk = criarSupabaseAuthService({ client: {
    auth: {
      async signUp() {
        return { data: { user: { id: "u1", email: "a@a.com" }, session: null }, error: null };
      }
    }
  } });
  const resultado = await servicoOk.cadastrar("a@a.com", "123456");
  assert.equal(resultado.usuario_id, "u1");
  assert.equal(resultado.confirmacao_pendente, true);

  const servicoErro = criarSupabaseAuthService({ client: {
    auth: {
      async signUp() {
        return { data: {}, error: { message: "Email ja cadastrado", status: 422 } };
      }
    }
  } });
  await assert.rejects(() => servicoErro.cadastrar("a@a.com", "123456"), ErroAutenticacao);
});

test("cadastrar detecta e-mail ja existente (usuario fantasma sem identities do Supabase)", async () => {
  const servicoFantasma = criarSupabaseAuthService({ client: {
    auth: {
      async signUp() {
        return { data: { user: { id: "u1", email: "a@a.com", identities: [] }, session: null }, error: null };
      }
    }
  } });
  await assert.rejects(
    () => servicoFantasma.cadastrar("a@a.com", "123456"),
    error => error instanceof ErroAutenticacao && error.statusCode === 409
  );
});

test("login mapeia sucesso e erro do Supabase", async () => {
  const servicoOk = criarSupabaseAuthService({ client: {
    auth: {
      async signInWithPassword() {
        return { data: { user: { id: "u1", email: "a@a.com" }, session: { access_token: "tok123", expires_at: 999 } }, error: null };
      }
    }
  } });
  const resultado = await servicoOk.login("a@a.com", "123456");
  assert.equal(resultado.access_token, "tok123");

  const servicoErro = criarSupabaseAuthService({ client: {
    auth: {
      async signInWithPassword() {
        return { data: {}, error: { message: "Credenciais invalidas", status: 400 } };
      }
    }
  } });
  await assert.rejects(() => servicoErro.login("a@a.com", "senhaerrada"), ErroAutenticacao);
});

test("obterUsuario valida token ausente e token invalido", async () => {
  const service = criarSupabaseAuthService({ client: {
    auth: {
      async getUser() {
        return { data: { user: null }, error: { message: "invalido" } };
      }
    }
  } });
  await assert.rejects(() => service.obterUsuario(""), ErroAutenticacao);
  await assert.rejects(() => service.obterUsuario("token-invalido"), ErroAutenticacao);
});
}

// -----------------------------------------------------------------------------
// Origem: Plano 14 - fornecedores proprios por usuario
// -----------------------------------------------------------------------------
{
const test = require("node:test");
const assert = require("node:assert/strict");
const {
  listarFornecedoresHandler, criarFornecedorHandler, atualizarFornecedorHandler, removerFornecedorHandler
} = require("../server");
const { criarFornecedoresService, ErroFornecedor } = require("../src/services/personalizacao/fornecedores.service");

function respostaFake() {
  return {
    statusCode: 200,
    body: null,
    status(code) { this.statusCode = code; return this; },
    json(body) { this.body = body; return this; }
  };
}

function requisicaoFake(body, headers = {}, params = {}) {
  const cabecalhos = { "x-demo-access-key": process.env.DEMO_ACCESS_KEY || undefined, ...headers };
  return { body, params, get(nome) { return cabecalhos[nome.toLowerCase()]; } };
}

function builderFake(resultado) {
  const builder = {
    select() { return builder; },
    insert() { return builder; },
    update() { return builder; },
    delete() { return builder; },
    eq() { return builder; },
    order() { return builder; },
    single: async () => resultado,
    maybeSingle: async () => resultado,
    then(resolve, reject) { return Promise.resolve(resultado).then(resolve, reject); }
  };
  return builder;
}

function clienteFake(resultado) {
  return { from() { return builderFake(resultado); } };
}

test("GET /api/fornecedores exige token de acesso", async () => {
  const response = respostaFake();
  await listarFornecedoresHandler(requisicaoFake(null), response);
  assert.equal(response.statusCode, 401);
});

test("fornecedoresService valida nome obrigatorio e categoria permitida", async () => {
  const service = criarFornecedoresService({ criarClientePorToken: () => clienteFake({ data: {}, error: null }) });
  await assert.rejects(() => service.criar("tok", "u1", { nome: "" }), ErroFornecedor);
  await assert.rejects(() => service.criar("tok", "u1", { nome: "Ok", categoria: "Categoria invalida" }), ErroFornecedor);
});

test("fornecedoresService cria, lista, atualiza e remove com sucesso", async () => {
  const registro = { id: "f1", user_id: "u1", nome: "Distribuidora Boa Vista", categoria: "Hortifruti" };

  const servicoCriar = criarFornecedoresService({ criarClientePorToken: () => clienteFake({ data: registro, error: null }) });
  const criado = await servicoCriar.criar("tok", "u1", { nome: registro.nome, categoria: registro.categoria });
  assert.equal(criado.id, "f1");

  const servicoListar = criarFornecedoresService({ criarClientePorToken: () => clienteFake({ data: [registro], error: null }) });
  const lista = await servicoListar.listar("tok");
  assert.equal(lista.length, 1);

  const servicoAtualizar = criarFornecedoresService({ criarClientePorToken: () => clienteFake({ data: { ...registro, telefone: "11999999999" }, error: null }) });
  const atualizado = await servicoAtualizar.atualizar("tok", "f1", { telefone: "11999999999" });
  assert.equal(atualizado.telefone, "11999999999");

  const servicoRemover = criarFornecedoresService({ criarClientePorToken: () => clienteFake({ data: registro, error: null }) });
  const removido = await servicoRemover.remover("tok", "f1");
  assert.equal(removido.removido, true);
});

test("fornecedoresService retorna 404 ao atualizar/remover id que nao existe (ou nao e do usuario)", async () => {
  const servicoAtualizar = criarFornecedoresService({ criarClientePorToken: () => clienteFake({ data: null, error: null }) });
  await assert.rejects(() => servicoAtualizar.atualizar("tok", "inexistente", { nome: "X" }), ErroFornecedor);

  const servicoRemover = criarFornecedoresService({ criarClientePorToken: () => clienteFake({ data: null, error: null }) });
  await assert.rejects(() => servicoRemover.remover("tok", "inexistente"), ErroFornecedor);
});
}

// -----------------------------------------------------------------------------
// Origem: Plano 14 - fotos proprias de prato/receita por usuario
// -----------------------------------------------------------------------------
{
const test = require("node:test");
const assert = require("node:assert/strict");
const { listarFotosHandler, criarFotoHandler, removerFotoHandler } = require("../server");
const { criarFotosService, ErroFoto } = require("../src/services/personalizacao/fotos.service");

const PNG_1X1_BASE64 = "iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mNk+A8AAQUBAScY42YAAAAASUVORK5CYII=";

function respostaFake() {
  return {
    statusCode: 200,
    body: null,
    status(code) { this.statusCode = code; return this; },
    json(body) { this.body = body; return this; }
  };
}

function requisicaoFake(body, headers = {}, params = {}) {
  const cabecalhos = { "x-demo-access-key": process.env.DEMO_ACCESS_KEY || undefined, ...headers };
  return { body, params, get(nome) { return cabecalhos[nome.toLowerCase()]; } };
}

function clienteStorageFake({ tabela, storageUpload, storageRemove, storageSignedUrl } = {}) {
  const tabelaBuilder = {
    select() { return tabelaBuilder; },
    insert() { return tabelaBuilder; },
    delete() { return tabelaBuilder; },
    eq() { return tabelaBuilder; },
    order() { return tabelaBuilder; },
    single: async () => tabela,
    maybeSingle: async () => tabela,
    then(resolve, reject) { return Promise.resolve(tabela).then(resolve, reject); }
  };
  return {
    from() { return tabelaBuilder; },
    storage: {
      from() {
        return {
          upload: async () => storageUpload || { data: { path: "x" }, error: null },
          remove: async () => storageRemove || { data: {}, error: null },
          createSignedUrl: async () => storageSignedUrl || { data: { signedUrl: "https://exemplo.com/assinada" }, error: null }
        };
      }
    }
  };
}

test("GET /api/fotos exige token de acesso", async () => {
  const response = respostaFake();
  await listarFotosHandler(requisicaoFake(null), response);
  assert.equal(response.statusCode, 401);
});

test("fotosService rejeita tipo de imagem invalido e arquivo ausente", async () => {
  const service = criarFotosService({ criarClientePorToken: () => clienteStorageFake({ tabela: { data: {}, error: null } }) });
  await assert.rejects(() => service.criar("tok", "u1", { tipo: "application/pdf", arquivo: PNG_1X1_BASE64 }), ErroFoto);
  await assert.rejects(() => service.criar("tok", "u1", { tipo: "image/png", arquivo: "" }), ErroFoto);
});

test("fotosService rejeita imagem acima de 5MB", async () => {
  const service = criarFotosService({ criarClientePorToken: () => clienteStorageFake({ tabela: { data: {}, error: null } }) });
  const grande = Buffer.alloc(6 * 1024 * 1024, 1).toString("base64");
  await assert.rejects(() => service.criar("tok", "u1", { tipo: "image/png", arquivo: grande }), ErroFoto);
});

test("fotosService rejeita quando o conteudo real do arquivo nao bate com o tipo declarado (auditoria 2026-08)", async () => {
  const service = criarFotosService({ criarClientePorToken: () => clienteStorageFake({ tabela: { data: {}, error: null } }) });
  const naoEhImagem = Buffer.from("isso nao e uma imagem de verdade, so texto qualquer").toString("base64");
  await assert.rejects(() => service.criar("tok", "u1", { tipo: "image/png", arquivo: naoEhImagem }), ErroFoto);
  await assert.rejects(() => service.criar("tok", "u1", { tipo: "image/webp", arquivo: PNG_1X1_BASE64 }), ErroFoto);
});

test("fotosService aceita PNG/JPEG/WEBP reais (assinatura de bytes bate)", async () => {
  const registro = { id: "f1", user_id: "u1", storage_path: "u1/x.png" };
  const service = criarFotosService({ criarClientePorToken: () => clienteStorageFake({ tabela: { data: registro, error: null } }) });
  const jpeg = Buffer.from([0xff, 0xd8, 0xff, 0xe0, 0, 0, 0, 0]).toString("base64");
  const webp = Buffer.concat([Buffer.from("RIFF"), Buffer.alloc(4), Buffer.from("WEBP")]).toString("base64");
  await service.criar("tok", "u1", { tipo: "image/png", arquivo: PNG_1X1_BASE64 });
  await service.criar("tok", "u1", { tipo: "image/jpeg", arquivo: jpeg });
  await service.criar("tok", "u1", { tipo: "image/webp", arquivo: webp });
});

test("fotosService envia, lista com url assinada e remove com sucesso", async () => {
  const registro = { id: "p1", user_id: "u1", nome_prato: "Bolo de cenoura", storage_path: "u1/abc.png" };

  const servicoCriar = criarFotosService({ criarClientePorToken: () => clienteStorageFake({ tabela: { data: registro, error: null } }) });
  const criada = await servicoCriar.criar("tok", "u1", { tipo: "image/png", arquivo: PNG_1X1_BASE64, nome_prato: "Bolo de cenoura" });
  assert.equal(criada.id, "p1");

  const servicoListar = criarFotosService({ criarClientePorToken: () => clienteStorageFake({ tabela: { data: [registro], error: null } }) });
  const lista = await servicoListar.listar("tok");
  assert.equal(lista.length, 1);
  assert.equal(lista[0].url, "https://exemplo.com/assinada");

  const servicoRemover = criarFotosService({ criarClientePorToken: () => clienteStorageFake({ tabela: { data: registro, error: null } }) });
  const removida = await servicoRemover.remover("tok", "p1");
  assert.equal(removida.removido, true);
});

test("fotosService retorna 404 ao remover foto que nao existe (ou nao e do usuario)", async () => {
  const service = criarFotosService({ criarClientePorToken: () => clienteStorageFake({ tabela: { data: null, error: null } }) });
  await assert.rejects(() => service.remover("tok", "inexistente"), ErroFoto);
});
}

// -----------------------------------------------------------------------------
// Origem: Plano 16, item 2 - usuario usar a propria chave Gemini
// -----------------------------------------------------------------------------
{
const test = require("node:test");
const assert = require("node:assert/strict");
const { cifrar, decifrar } = require("../src/utils/crypto-chave-ia");
const { criarChaveIAService, ErroChaveIA } = require("../src/services/personalizacao/chave-ia.service");
const { obterStatusChaveIAHandler, salvarChaveIAHandler, removerChaveIAHandler } = require("../server");

const SEGREDO_TESTE = "segredo-de-teste-nao-usar-em-producao";

function respostaFake() {
  return {
    statusCode: 200,
    body: null,
    status(code) { this.statusCode = code; return this; },
    json(body) { this.body = body; return this; }
  };
}

function requisicaoFake(body, headers = {}) {
  return { body, get(nome) { return headers[nome.toLowerCase()]; } };
}

function clienteFake(resultado) {
  const builder = {
    select() { return builder; },
    upsert() { return builder; },
    delete() { return builder; },
    eq() { return builder; },
    maybeSingle: async () => resultado,
    then(resolve, reject) { return Promise.resolve(resultado).then(resolve, reject); }
  };
  return { from() { return builder; } };
}

test("cifrar/decifrar fazem round-trip e rejeitam segredo errado", () => {
  const original = "AIzaSy-chave-fake-de-teste-1234567890";
  const cifrado = cifrar(original, SEGREDO_TESTE);
  assert.equal(decifrar(cifrado, SEGREDO_TESTE), original);
  assert.throws(() => decifrar(cifrado, "segredo-errado"));
});

test("chaveIAService rejeita chave vazia ou com formato invalido", async () => {
  const service = criarChaveIAService({ segredoCifragem: SEGREDO_TESTE, criarClientePorToken: () => clienteFake({ data: null, error: null }) });
  await assert.rejects(() => service.salvar("tok", "u1", { chave: "" }), ErroChaveIA);
  await assert.rejects(() => service.salvar("tok", "u1", { chave: "curta" }), ErroChaveIA);
});

test("chaveIAService salva, informa status e permite obter decifrada", async () => {
  const service = criarChaveIAService({ segredoCifragem: SEGREDO_TESTE, criarClientePorToken: () => clienteFake({ data: null, error: null }) });
  const salvo = await service.salvar("tok", "u1", { chave: "AIzaSy-chave-fake-de-teste-1234567890" });
  assert.equal(salvo.configurada, true);

  const { chave_cifrada, iv, tag } = cifrar("AIzaSy-chave-fake-de-teste-1234567890", SEGREDO_TESTE);
  const serviceComDados = criarChaveIAService({
    segredoCifragem: SEGREDO_TESTE,
    criarClientePorToken: () => clienteFake({ data: { chave_cifrada, iv, tag, atualizado_em: "2026-01-01" }, error: null })
  });
  const status = await serviceComDados.obterStatus("tok");
  assert.equal(status.configurada, true);

  const decifrada = await serviceComDados.obterChaveDecifrada("tok");
  assert.equal(decifrada, "AIzaSy-chave-fake-de-teste-1234567890");
});

test("chaveIAService informa nao configurada quando nao ha registro", async () => {
  const service = criarChaveIAService({ segredoCifragem: SEGREDO_TESTE, criarClientePorToken: () => clienteFake({ data: null, error: null }) });
  const status = await service.obterStatus("tok");
  assert.equal(status.configurada, false);
  const decifrada = await service.obterChaveDecifrada("tok");
  assert.equal(decifrada, null);
});

test("chaveIAService remove com sucesso", async () => {
  const service = criarChaveIAService({ segredoCifragem: SEGREDO_TESTE, criarClientePorToken: () => clienteFake({ data: null, error: null }) });
  const removido = await service.remover("tok", "u1");
  assert.equal(removido.removido, true);
});

test("GET/PUT/DELETE /api/perfil/chave-ia exigem token de acesso", async () => {
  const respGet = respostaFake();
  await obterStatusChaveIAHandler(requisicaoFake(null), respGet);
  assert.equal(respGet.statusCode, 401);

  const respPut = respostaFake();
  await salvarChaveIAHandler(requisicaoFake({ chave: "AIzaSy-chave-fake-de-teste-1234567890" }), respPut);
  assert.equal(respPut.statusCode, 401);

  const respDelete = respostaFake();
  await removerChaveIAHandler(requisicaoFake(null), respDelete);
  assert.equal(respDelete.statusCode, 401);
});
}

// -----------------------------------------------------------------------------
// Origem: Plano 16, item 6 - precos proprios por usuario (por fornecedor/item)
// -----------------------------------------------------------------------------
{
const test = require("node:test");
const assert = require("node:assert/strict");
const { criarPrecosService, ErroPreco } = require("../src/services/personalizacao/precos.service");
const { listarPrecosHandler, criarPrecoHandler, atualizarPrecoHandler, removerPrecoHandler, exportarPrecosHandler } = require("../server");

function respostaFake() {
  return {
    statusCode: 200,
    body: null,
    headers: {},
    setHeader(nome, valor) { this.headers[nome] = valor; return this; },
    status(code) { this.statusCode = code; return this; },
    json(body) { this.body = body; return this; },
    send(body) { this.body = body; return this; }
  };
}

function requisicaoFake(body, headers = {}, params = {}) {
  return { body, params, get(nome) { return headers[nome.toLowerCase()]; } };
}

function builderFake(resultado) {
  const builder = {
    select() { return builder; },
    insert() { return builder; },
    update() { return builder; },
    delete() { return builder; },
    eq() { return builder; },
    order() { return builder; },
    single: async () => resultado,
    maybeSingle: async () => resultado,
    then(resolve, reject) { return Promise.resolve(resultado).then(resolve, reject); }
  };
  return builder;
}

function clienteFake(resultado, resultadoFornecedor) {
  return {
    from(tabela) {
      if (tabela === "fornecedores") return builderFake(resultadoFornecedor ?? { data: { id: "f1" }, error: null });
      return builderFake(resultado);
    }
  };
}

test("GET /api/precos exige token de acesso", async () => {
  const response = respostaFake();
  await listarPrecosHandler(requisicaoFake(null), response);
  assert.equal(response.statusCode, 401);
});

test("precosService rejeita item vazio, unidade ausente e preco invalido", async () => {
  const service = criarPrecosService({ criarClientePorToken: () => clienteFake({ data: {}, error: null }) });
  await assert.rejects(() => service.criar("tok", "u1", { unidade: "kg", preco: 5 }), ErroPreco);
  await assert.rejects(() => service.criar("tok", "u1", { item: "Tomate", preco: 5 }), ErroPreco);
  await assert.rejects(() => service.criar("tok", "u1", { item: "Tomate", unidade: "kg", preco: -1 }), ErroPreco);
  await assert.rejects(() => service.criar("tok", "u1", { item: "Tomate", unidade: "kg", preco: "abc" }), ErroPreco);
});

test("precosService rejeita categoria invalida", async () => {
  const service = criarPrecosService({ criarClientePorToken: () => clienteFake({ data: {}, error: null }) });
  await assert.rejects(
    () => service.criar("tok", "u1", { item: "Tomate", unidade: "kg", preco: 5, categoria: "Eletronicos" }),
    ErroPreco
  );
});

test("precosService rejeita fornecedor_id que nao pertence ao usuario", async () => {
  const service = criarPrecosService({
    criarClientePorToken: () => clienteFake({ data: {}, error: null }, { data: null, error: null })
  });
  await assert.rejects(
    () => service.criar("tok", "u1", { item: "Tomate", unidade: "kg", preco: 5, fornecedor_id: "de-outro-usuario" }),
    ErroPreco
  );
});

test("precosService cria, lista, atualiza e remove com sucesso", async () => {
  const registro = { id: "p1", user_id: "u1", item: "Tomate", unidade: "kg", preco: 8.5, categoria: "Hortifruti" };

  const servicoCriar = criarPrecosService({ criarClientePorToken: () => clienteFake({ data: registro, error: null }) });
  const criado = await servicoCriar.criar("tok", "u1", { item: "Tomate", unidade: "kg", preco: 8.5, categoria: "Hortifruti" });
  assert.equal(criado.id, "p1");

  const servicoListar = criarPrecosService({ criarClientePorToken: () => clienteFake({ data: [registro], error: null }) });
  const lista = await servicoListar.listar("tok");
  assert.equal(lista.length, 1);

  const servicoAtualizar = criarPrecosService({ criarClientePorToken: () => clienteFake({ data: { ...registro, preco: 9 }, error: null }) });
  const atualizado = await servicoAtualizar.atualizar("tok", "p1", { preco: 9 });
  assert.equal(atualizado.preco, 9);

  const servicoRemover = criarPrecosService({ criarClientePorToken: () => clienteFake({ data: registro, error: null }) });
  const removido = await servicoRemover.remover("tok", "p1");
  assert.equal(removido.removido, true);
});

test("precosService retorna 404 ao atualizar/remover preco que nao existe (ou nao e do usuario)", async () => {
  const service = criarPrecosService({ criarClientePorToken: () => clienteFake({ data: null, error: null }) });
  await assert.rejects(() => service.atualizar("tok", "inexistente", { preco: 1 }), ErroPreco);
  await assert.rejects(() => service.remover("tok", "inexistente"), ErroPreco);
});

test("precosService.exportarCSV gera cabecalho e linhas com separador ; e virgula decimal", () => {
  const service = criarPrecosService({ criarClientePorToken: () => clienteFake({ data: {}, error: null }) });
  const csv = service.exportarCSV([
    { item: "Tomate", categoria: "Hortifruti", unidade: "kg", preco: 8.5, observacoes: null },
    { item: 'Água "com gás"', categoria: null, unidade: "un", preco: 3, observacoes: "trazer gelada" }
  ]);
  const linhas = csv.split("\r\n");
  assert.equal(linhas[0], '"Item";"Categoria";"Unidade";"Preco";"Observacoes"');
  assert.match(linhas[1], /"Tomate".*"8,50"/);
  assert.match(linhas[2], /""com gás""/);
});

test("POST/PUT/DELETE /api/precos exigem token de acesso", async () => {
  const respPost = respostaFake();
  await criarPrecoHandler(requisicaoFake({ item: "Tomate", unidade: "kg", preco: 5 }), respPost);
  assert.equal(respPost.statusCode, 401);

  const respPut = respostaFake();
  await atualizarPrecoHandler(requisicaoFake({ preco: 6 }, {}, { id: "p1" }), respPut);
  assert.equal(respPut.statusCode, 401);

  const respDelete = respostaFake();
  await removerPrecoHandler(requisicaoFake(null, {}, { id: "p1" }), respDelete);
  assert.equal(respDelete.statusCode, 401);
});

test("GET /api/precos/exportar exige token de acesso", async () => {
  const response = respostaFake();
  await exportarPrecosHandler(requisicaoFake(null), response);
  assert.equal(response.statusCode, 401);
});
}

{
const test = require("node:test");
const assert = require("node:assert/strict");
const { calcularEstimativaCusto, extrairQuantidade, normalizarUnidade } = require("../src/services/planning/custo-estimado.service");
const { montarPromptPlanejamento } = require("../src/prompts/event.prompt");

const CATALOGO = [
  { item: "Tomate", unidade: "kg", preco: 8.5, fornecedor: "Hortifruti Central" },
  { item: "Refrigerante Cola", unidade: "L", preco: 6, fornecedor: "Bebidas Silva" }
];

test("extrairQuantidade le numero e unidade de textos livres, com virgula ou ponto", () => {
  assert.deepEqual(extrairQuantidade("3 kg"), { valor: 3, unidade: { familia: "peso", fator: 1000 } });
  assert.deepEqual(extrairQuantidade("2,5 L"), { valor: 2.5, unidade: { familia: "volume", fator: 1000 } });
  assert.equal(extrairQuantidade("a gosto"), null);
  assert.equal(extrairQuantidade(""), null);
});

test("normalizarUnidade reconhece sinonimos e ignora acentos/maiusculas", () => {
  assert.deepEqual(normalizarUnidade("Kg"), { familia: "peso", fator: 1000 });
  assert.deepEqual(normalizarUnidade("litro"), { familia: "volume", fator: 1000 });
  assert.equal(normalizarUnidade("caminhao"), null);
});

test("calcularEstimativaCusto casa item exato por nome, converte unidades compativeis e soma no total principal", () => {
  const compras = [
    { item: "Tomate", quantidade: "3 kg" },
    { item: "Refrigerante Cola", quantidade: "2000 ml" }
  ];
  const estimativa = calcularEstimativaCusto(compras, CATALOGO);
  assert.equal(estimativa.itens_com_preco, 2);
  assert.equal(estimativa.total_itens, 2);
  assert.equal(estimativa.total_estimado, 37.5);
  assert.equal(estimativa.itens[0].correspondencia_exata, true);
  assert.equal(estimativa.itens[0].fornecedor, "Hortifruti Central");
});

test("calcularEstimativaCusto separa correspondencia aproximada (substring) do total principal", () => {
  // "Tomate cereja" so bate por substring com o catalogo "Tomate" - produto
  // diferente na pratica, entao nao deve ser somado como se fosse exato.
  const estimativa = calcularEstimativaCusto([{ item: "Tomate cereja", quantidade: "500 g" }], CATALOGO);
  assert.equal(estimativa.itens[0].correspondido, true);
  assert.equal(estimativa.itens[0].correspondencia_exata, false);
  assert.equal(estimativa.itens[0].subtotal, 4.25);
  assert.equal(estimativa.itens_com_preco, 0);
  assert.equal(estimativa.itens_aproximados, 1);
  assert.equal(estimativa.total_estimado, 0);
  assert.equal(estimativa.total_aproximado, 4.25);
});

test("calcularEstimativaCusto prefere o termo aproximado mais especifico (mais longo), nao o primeiro encontrado", () => {
  // Regressao: "Frango" e "Frango a Passarinho" sao produtos/precos
  // diferentes; uma compra "Frango a Passarinho Temperado" deve casar com
  // o termo mais longo/especifico do catalogo, nao com "Frango" so porque
  // veio primeiro na lista.
  const catalogoComDoisFrangos = [
    { item: "Frango", unidade: "kg", preco: 18, fornecedor: "Acougue A" },
    { item: "Frango a Passarinho", unidade: "kg", preco: 32, fornecedor: "Acougue B" }
  ];
  const estimativa = calcularEstimativaCusto(
    [{ item: "Frango a Passarinho Temperado", quantidade: "2 kg" }],
    catalogoComDoisFrangos
  );
  assert.equal(estimativa.itens[0].preco_unitario, 32);
  assert.equal(estimativa.itens[0].fornecedor, "Acougue B");
  assert.equal(estimativa.itens[0].subtotal, 64);
});

test("calcularEstimativaCusto produz um item de saida por entrada de compras, na mesma ordem (alinhamento por indice)", () => {
  // Regressao: duas linhas com o mesmo nome ("Tomate") precisam continuar
  // separadas na saida, para o front-end conseguir parear por indice em vez
  // de por nome (evita mostrar o preco errado numa das duas linhas).
  const compras = [
    { item: "Tomate", quantidade: "1 kg" },
    { item: "Tomate", quantidade: "3 kg" }
  ];
  const estimativa = calcularEstimativaCusto(compras, CATALOGO);
  assert.equal(estimativa.itens.length, 2);
  assert.equal(estimativa.itens[0].subtotal, 8.5);
  assert.equal(estimativa.itens[1].subtotal, 25.5);
});

test("calcularEstimativaCusto marca item sem correspondencia e nao soma no total", () => {
  const estimativa = calcularEstimativaCusto([{ item: "Queijo parmesao", quantidade: "1 kg" }], CATALOGO);
  assert.equal(estimativa.itens_com_preco, 0);
  assert.equal(estimativa.total_estimado, 0);
  assert.equal(estimativa.itens[0].correspondido, false);
});

test("calcularEstimativaCusto marca item correspondido mas com unidade incompativel, sem subtotal", () => {
  const estimativa = calcularEstimativaCusto([{ item: "Tomate", quantidade: "5 un" }], CATALOGO);
  assert.equal(estimativa.itens[0].correspondido, true);
  assert.equal(estimativa.itens[0].subtotal, null);
  assert.equal(estimativa.itens_com_preco, 0);
});

test("calcularEstimativaCusto ignora entradas sem lista de compras ou catalogo", () => {
  assert.equal(calcularEstimativaCusto([], CATALOGO).total_itens, 0);
  assert.equal(calcularEstimativaCusto([{ item: "Tomate", quantidade: "1 kg" }], []).itens[0].correspondido, false);
  assert.equal(calcularEstimativaCusto(null, null).total_itens, 0);
});

test("montarPromptPlanejamento inclui CATALOGO REGIONAL DO USUARIO somente quando ha itens", () => {
  const evento = { tipo: "Aniversario", pessoas: 20 };
  const motor = {};
  const diretriz = { quantidade_total_minima: 5 };

  const semCatalogo = montarPromptPlanejamento(evento, motor, diretriz, null, null);
  assert.doesNotMatch(semCatalogo, /CATALOGO REGIONAL DO USUARIO\n\[/);
  assert.doesNotMatch(semCatalogo, /Hortifruti Central/);

  const comCatalogo = montarPromptPlanejamento(evento, motor, diretriz, null, CATALOGO);
  assert.match(comCatalogo, /CATALOGO REGIONAL DO USUARIO\n\[/);
  assert.match(comCatalogo, /Hortifruti Central/);
  assert.match(comCatalogo, /nunca para copiar nos campos de saida/);
});
}
