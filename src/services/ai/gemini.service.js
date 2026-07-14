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

  async function gerarEstrutura(prompt) {
    const inicio = Date.now();
    try {
      if (!genAI) throw new Error("GEMINI_API_KEY ou GOOGLE_API_KEY nao configurada no .env");
      const model = genAI.getGenerativeModel({
        model: modelName,
        generationConfig: {
          responseMimeType: "application/json",
          temperature: opcoes.temperature ?? 0.7,
          maxOutputTokens: opcoes.maxOutputTokens || 8192
        }
      });
      const execucao = await executarComRetry(() => model.generateContent(prompt));
      const result = execucao.valor;
      const response = await result.response;
      const candidate = response.candidates?.[0] || {};
      const usage = response.usageMetadata || {};
      const meta = {
        tempo_ms: Date.now() - inicio,
        tentativas: execucao.tentativas,
        requested_model: modelName,
        model_version: response.modelVersion || modelName,
        finish_reason: candidate.finishReason || null,
        prompt_tokens: usage.promptTokenCount || null,
        thinking_tokens: usage.thoughtsTokenCount || null,
        output_tokens: usage.candidatesTokenCount || null,
        total_tokens: usage.totalTokenCount || null
      };
      try {
        return { ok: true, dados: extrairJSON(response.text()), meta: { ...meta, schema_ok: true } };
      } catch (error) {
        return { ok: false, dados: null, meta: { ...meta, schema_ok: false, erro: error.message } };
      }
    } catch (error) {
      return {
        ok: false,
        dados: null,
        meta: { tempo_ms: Date.now() - inicio, requested_model: modelName, schema_ok: false, erro: error.message }
      };
    }
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

  return { gerarPlano: gerar, gerarEstrutura, getGeminiStatus: getStatus };
}

async function executarComRetry(executor, maximoTentativas = 2) {
  let ultimoErro;
  for (let tentativa = 1; tentativa <= maximoTentativas; tentativa += 1) {
    try {
      return { valor: await executor(), tentativas: tentativa };
    } catch (error) {
      ultimoErro = error;
      if (tentativa >= maximoTentativas || !ehErroTransitorio(error)) throw error;
      await aguardar(1200 * tentativa);
    }
  }
  throw ultimoErro;
}

function ehErroTransitorio(error) {
  return /\b429\b|\b503\b|resource_exhausted|service unavailable|high demand|fetch failed/i.test(String(error?.message || error));
}

function aguardar(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

const defaultService = criarGeminiService();

if (!defaultService.getGeminiStatus().configured) {
  console.error("⚠️ Aviso: GEMINI_API_KEY ou GOOGLE_API_KEY nao configurada no .env");
}

module.exports = {
  criarGeminiService,
  validarNomeModelo,
  ehErroTransitorio,
  gerarPlano: defaultService.gerarPlano,
  getGeminiStatus: defaultService.getGeminiStatus
};
