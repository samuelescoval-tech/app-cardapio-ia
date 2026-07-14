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
