const { GoogleGenerativeAI } = require("@google/generative-ai");
const { extrairJSON } = require("../../utils/extract-json");
const { validarPlano, criarFallback } = require("../../utils/validate-plan");

const DEFAULT_MODEL = process.env.GEMINI_MODEL || "gemini-flash-lite-latest";

function validarNomeModelo(valor) {
  const nome = String(valor || "").trim();
  if (!/^[a-z0-9][a-z0-9._-]{1,127}$/i.test(nome)) {
    throw new Error("Nome de modelo Gemini invalido.");
  }
  return nome;
}

function criarGeminiService(opcoes = {}) {
  const apiKey = Object.prototype.hasOwnProperty.call(opcoes, "apiKey")
    ? opcoes.apiKey
    : process.env.GEMINI_API_KEY || process.env.GOOGLE_API_KEY;
  const modelName = validarNomeModelo(opcoes.modelName || DEFAULT_MODEL);
  const keyName = opcoes.keyName || (
    process.env.GEMINI_API_KEY
      ? "GEMINI_API_KEY"
      : process.env.GOOGLE_API_KEY ? "GOOGLE_API_KEY" : null
  );
  const genAI = opcoes.client || (apiKey ? new GoogleGenerativeAI(apiKey) : null);

  function getStatus() {
    return {
      provider: "gemini",
      configured: Boolean(genAI),
      key_name: keyName,
      model: modelName
    };
  }

  async function gerar(prompt, contexto = {}) {
    const inicio = Date.now();

    try {
      if (!genAI) {
        throw new Error("GEMINI_API_KEY ou GOOGLE_API_KEY nao configurada no .env");
      }

      const model = genAI.getGenerativeModel({
        model: modelName,
        generationConfig: {
          responseMimeType: "application/json",
          temperature: 0.7,
          maxOutputTokens: 8192
        }
      });

      const result = await model.generateContent(prompt);
      const response = await result.response;
      const text = response.text();
      const candidate = response.candidates?.[0] || {};
      const usage = response.usageMetadata || {};
      const generationMeta = {
        requested_model: modelName,
        model_version: response.modelVersion || modelName,
        finish_reason: candidate.finishReason || null,
        prompt_tokens: usage.promptTokenCount || null,
        thinking_tokens: usage.thoughtsTokenCount || null,
        output_tokens: usage.candidatesTokenCount || null,
        total_tokens: usage.totalTokenCount || null
      };

      // 1. Tentar extrair JSON com fallback
      let dados;
      try {
        dados = extrairJSON(text);
      } catch (extractError) {
        console.warn("⚠️ Erro ao extrair JSON:", extractError.message);
        return {
          ok: false,
          provider: "gemini",
          plano: criarFallback(extractError.message),
          meta: {
            erro: extractError.message,
            tempo_ms: Date.now() - inicio,
            schema_ok: false,
            ...generationMeta
          }
        };
      }

      // 2. Validar e normalizar
      try {
        dados = validarPlano(dados, contexto);
      } catch (validationError) {
        console.warn("⚠️ Resposta fora do contrato:", validationError.message);
        return {
          ok: false,
          provider: "gemini",
          plano: criarFallback(validationError.message),
          meta: {
            erro: validationError.message,
            tempo_ms: Date.now() - inicio,
            schema_ok: false,
            ...generationMeta
          }
        };
      }

      return {
        ok: true,
        provider: "gemini",
        plano: dados,
        meta: {
          tempo_ms: Date.now() - inicio,
          schema_ok: true,
          qualidade_culinaria: dados.qualidade_culinaria?.status !== "revisar",
          qualidade_culinaria_status: dados.qualidade_culinaria?.status || "nao_avaliado",
          ajustes_culinarios: dados.qualidade_culinaria?.ajustes?.length || 0,
          avisos_culinarios: dados.qualidade_culinaria?.avisos?.length || 0,
          ...generationMeta
        }
      };
    } catch (error) {
      console.error("❌ Erro no Gemini:", error.message);
      return {
        ok: false,
        provider: "gemini",
        plano: criarFallback("Erro ao conectar com o Gemini. Verifique sua chave de API."),
        meta: {
          requested_model: modelName,
          erro: error.message,
          tempo_ms: Date.now() - inicio
        }
      };
    }
  }

  return { gerarPlano: gerar, getGeminiStatus: getStatus };
}

const defaultService = criarGeminiService();

if (!defaultService.getGeminiStatus().configured) {
  console.error("⚠️ Aviso: GEMINI_API_KEY ou GOOGLE_API_KEY nao configurada no .env");
}

module.exports = {
  criarGeminiService,
  validarNomeModelo,
  gerarPlano: defaultService.gerarPlano,
  getGeminiStatus: defaultService.getGeminiStatus
};
