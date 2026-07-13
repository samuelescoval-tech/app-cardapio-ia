const SPOONACULAR_API_URL = "https://api.spoonacular.com/recipes/complexSearch";

class SpoonacularError extends Error {
  constructor(message, statusCode = 500) {
    super(message);
    this.name = "SpoonacularError";
    this.statusCode = statusCode;
  }
}

function criarSpoonacularService(opcoes = {}) {
  const apiKey = opcoes.apiKey ?? process.env.SPOONACULAR_API_KEY ?? "";
  const fetchImpl = opcoes.fetchImpl || global.fetch;
  const relogio = opcoes.relogio || (() => Date.now());
  const limiteDiario = numeroNoIntervalo(
    opcoes.limiteDiario ?? process.env.SPOONACULAR_DAILY_SEARCH_LIMIT,
    1,
    20,
    5
  );
  let diaAtual = "";
  let consultasHoje = 0;
  let ultimaConsultaMs = 0;

  function getStatus() {
    atualizarDia();
    return {
      configured: Boolean(apiKey),
      mode: "transient_references",
      persistence: false,
      max_results_per_search: 3,
      daily_search_limit: limiteDiario,
      searches_remaining: Math.max(0, limiteDiario - consultasHoje),
      attribution_required: true
    };
  }

  async function buscarReferencias(valor) {
    if (!apiKey) {
      throw new SpoonacularError("Referencias externas nao estao configuradas.", 503);
    }
    if (typeof fetchImpl !== "function") {
      throw new SpoonacularError("Cliente HTTP indisponivel.", 500);
    }

    const query = validarConsulta(valor);
    atualizarDia();
    const agora = relogio();
    if (consultasHoje >= limiteDiario) {
      throw new SpoonacularError("Limite diario local de referencias atingido.", 429);
    }
    if (ultimaConsultaMs && agora - ultimaConsultaMs < 1000) {
      throw new SpoonacularError("Aguarde um segundo antes de buscar novamente.", 429);
    }

    consultasHoje += 1;
    ultimaConsultaMs = agora;
    const url = new URL(SPOONACULAR_API_URL);
    url.searchParams.set("apiKey", apiKey);
    url.searchParams.set("query", query);
    url.searchParams.set("number", "3");
    url.searchParams.set("instructionsRequired", "true");
    url.searchParams.set("addRecipeInformation", "true");
    url.searchParams.set("sort", "popularity");
    url.searchParams.set("sortDirection", "desc");

    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 10000);
    let response;
    try {
      response = await fetchImpl(url, {
        headers: { Accept: "application/json" },
        signal: controller.signal
      });
    } catch (error) {
      const mensagem = error?.name === "AbortError"
        ? "Spoonacular demorou demais para responder."
        : "Nao foi possivel consultar o Spoonacular.";
      throw new SpoonacularError(mensagem, error?.name === "AbortError" ? 504 : 502);
    } finally {
      clearTimeout(timeout);
    }

    if (!response.ok) {
      if (response.status === 401) throw new SpoonacularError("Credencial Spoonacular recusada.", 502);
      if (response.status === 402 || response.status === 429) {
        throw new SpoonacularError("Quota Spoonacular indisponivel no momento.", 429);
      }
      throw new SpoonacularError("Spoonacular nao retornou referencias validas.", 502);
    }

    const data = await response.json().catch(() => ({}));
    const referencias = Array.isArray(data.results)
      ? data.results.map(normalizarReferencia).filter(Boolean).slice(0, 3)
      : [];

    return {
      mode: "transient_references",
      persistence: false,
      query,
      references: referencias,
      attribution: "Credite e acesse sempre a fonte original indicada em cada referencia.",
      quota: lerQuota(response.headers),
      searches_remaining: Math.max(0, limiteDiario - consultasHoje)
    };
  }

  function atualizarDia() {
    const dia = new Date(relogio()).toISOString().slice(0, 10);
    if (dia !== diaAtual) {
      diaAtual = dia;
      consultasHoje = 0;
      ultimaConsultaMs = 0;
    }
  }

  return { buscarReferencias, getStatus };
}

function validarConsulta(valor) {
  if (typeof valor !== "string") {
    throw new SpoonacularError("Informe uma busca de receita.", 400);
  }
  const query = valor.replace(/\s+/g, " ").trim();
  if (query.length < 2 || query.length > 80) {
    throw new SpoonacularError("A busca deve ter entre 2 e 80 caracteres.", 400);
  }
  return query;
}

function normalizarReferencia(valor) {
  if (!valor || !Number.isInteger(valor.id) || typeof valor.title !== "string") return null;
  const sourceUrl = urlHttps(valor.sourceUrl) || urlHttps(valor.spoonacularSourceUrl);
  if (!sourceUrl) return null;
  return {
    id: valor.id,
    title: valor.title.trim(),
    image_url: urlHttps(valor.image),
    source_name: texto(valor.sourceName) || "Fonte original",
    source_url: sourceUrl,
    ready_in_minutes: Number.isFinite(valor.readyInMinutes) ? valor.readyInMinutes : null,
    servings: Number.isFinite(valor.servings) ? valor.servings : null
  };
}

function lerQuota(headers) {
  if (!headers || typeof headers.get !== "function") return null;
  return {
    request_points: numeroOuNull(headers.get("x-api-quota-request")),
    used_today: numeroOuNull(headers.get("x-api-quota-used")),
    left_today: numeroOuNull(headers.get("x-api-quota-left"))
  };
}

function urlHttps(valor) {
  if (typeof valor !== "string" || !valor.trim()) return null;
  try {
    const url = new URL(valor);
    return url.protocol === "https:" ? url.toString() : null;
  } catch {
    return null;
  }
}

function texto(valor) {
  return typeof valor === "string" ? valor.trim() : "";
}

function numeroOuNull(valor) {
  const numero = Number(valor);
  return Number.isFinite(numero) ? numero : null;
}

function numeroNoIntervalo(valor, minimo, maximo, fallback) {
  const numero = Number(valor);
  return Number.isInteger(numero) && numero >= minimo && numero <= maximo ? numero : fallback;
}

module.exports = {
  criarSpoonacularService,
  SpoonacularError,
  validarConsulta
};
