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
    get() {
      return process.env.DEMO_ACCESS_KEY || undefined;
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

test("POST /api/auth/registrar exige a senha de demo quando configurada", async () => {
  const response = respostaFake();
  await registrarHandler(requisicaoFake({ email: "teste@teste.com", senha: "123456" }, { "x-demo-access-key": "errada" }), response);
  assert.equal(response.statusCode, 401);
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

test("POST /api/fornecedores exige a senha de demo quando configurada", async () => {
  const response = respostaFake();
  await criarFornecedorHandler(requisicaoFake({ nome: "Distribuidora Boa Vista" }, { "x-demo-access-key": "errada" }), response);
  assert.equal(response.statusCode, 401);
});

test("PUT/DELETE /api/fornecedores/:id exigem a senha de demo quando configurada", async () => {
  const responseUpdate = respostaFake();
  await atualizarFornecedorHandler(requisicaoFake({ nome: "X" }, { "x-demo-access-key": "errada" }, { id: "f1" }), responseUpdate);
  assert.equal(responseUpdate.statusCode, 401);

  const responseDelete = respostaFake();
  await removerFornecedorHandler(requisicaoFake(null, { "x-demo-access-key": "errada" }, { id: "f1" }), responseDelete);
  assert.equal(responseDelete.statusCode, 401);
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

test("POST /api/fotos exige a senha de demo quando configurada", async () => {
  const response = respostaFake();
  await criarFotoHandler(requisicaoFake({ tipo: "image/png", arquivo: PNG_1X1_BASE64 }, { "x-demo-access-key": "errada" }), response);
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
