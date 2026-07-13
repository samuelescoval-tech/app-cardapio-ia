const { GoogleGenerativeAI } = require("@google/generative-ai");
const { extrairJSON } = require("../../utils/extract-json");
const { validarPlano, criarFallback } = require("../../utils/validate-plan");

const apiKey = process.env.GEMINI_API_KEY || process.env.GOOGLE_API_KEY;
const modelName = process.env.GEMINI_MODEL || "gemini-flash-lite-latest";

if (!apiKey) {
  console.error("⚠️ Aviso: GEMINI_API_KEY ou GOOGLE_API_KEY não configurada no .env");
}

const genAI = apiKey ? new GoogleGenerativeAI(apiKey) : null;

function getGeminiStatus() {
  return {
    provider: "gemini",
    configured: Boolean(apiKey),
    key_name: process.env.GEMINI_API_KEY ? "GEMINI_API_KEY" : process.env.GOOGLE_API_KEY ? "GOOGLE_API_KEY" : null,
    model: modelName
  };
}

async function gerarPlano(prompt, contexto = {}) {
  const inicio = Date.now();

  try {
    if (!genAI) {
      throw new Error("GEMINI_API_KEY ou GOOGLE_API_KEY não configurada no .env");
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
          schema_ok: false
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
          schema_ok: false
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
        avisos_culinarios: dados.qualidade_culinaria?.avisos?.length || 0
      }
    };
  } catch (error) {
    console.error("❌ Erro no Gemini:", error.message);
    return {
      ok: false,
      provider: "gemini",
      plano: criarFallback("Erro ao conectar com o Gemini. Verifique sua chave de API."),
      meta: {
        erro: error.message,
        tempo_ms: Date.now() - inicio
      }
    };
  }
}

module.exports = { gerarPlano, getGeminiStatus };
