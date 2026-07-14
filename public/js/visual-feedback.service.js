/* ==========================================================================
   CHEF IA STUDIO | VISUAL FEEDBACK LOCAL
   TAG: preferencias-visuais, localStorage, privacidade
   --------------------------------------------------------------------------
   Persiste somente provider, id, slot e avaliacao. Nao salva URLs, evento,
   observacoes, autoria, licenca, historico culinario ou dados pessoais.
   ========================================================================== */

const VISUAL_FEEDBACK_STORAGE_KEY = "chef_ia_visual_feedback_v1";
const VISUAL_FEEDBACK_MAX_ENTRIES = 250;
const VISUAL_FEEDBACK_RATINGS = new Set(["adequada", "generica", "inadequada"]);

function criarVisualFeedbackService(storage = typeof localStorage !== "undefined" ? localStorage : null) {
  function carregar() {
    if (!storage) return {};
    try {
      const data = JSON.parse(storage.getItem(VISUAL_FEEDBACK_STORAGE_KEY) || "{}");
      const entries = data?.version === 1 && data.entries && typeof data.entries === "object"
        ? data.entries
        : {};
      return Object.fromEntries(Object.entries(entries).filter(([, entrada]) => entradaValida(entrada)));
    } catch {
      return {};
    }
  }

  function salvarAvaliacao(imagem, rating) {
    if (!storage || !VISUAL_FEEDBACK_RATINGS.has(rating)) return false;
    const entrada = normalizarEntrada(imagem, rating);
    if (!entrada) return false;
    try {
      const entries = carregar();
      delete entries[entrada.key];
      const limitadas = Object.fromEntries([
        [entrada.key, entrada],
        ...Object.entries(entries)
      ].slice(0, VISUAL_FEEDBACK_MAX_ENTRIES));
      storage.setItem(VISUAL_FEEDBACK_STORAGE_KEY, JSON.stringify({ version: 1, entries: limitadas }));
      return true;
    } catch {
      return false;
    }
  }

  function obterAvaliacao(imagem) {
    const key = chaveImagem(imagem);
    return key ? carregar()[key]?.rating || null : null;
  }

  function ordenarCandidatos(imagens) {
    if (!Array.isArray(imagens)) return [];
    const entries = carregar();
    return imagens
      .map((imagem, indice) => ({ imagem, indice, score: pontuar(entries[chaveImagem(imagem)]?.rating) }))
      .sort((a, b) => b.score - a.score || a.indice - b.indice)
      .map(item => item.imagem);
  }

  function resumir() {
    const valores = Object.values(carregar());
    return {
      total: valores.length,
      adequada: valores.filter(item => item.rating === "adequada").length,
      generica: valores.filter(item => item.rating === "generica").length,
      inadequada: valores.filter(item => item.rating === "inadequada").length
    };
  }

  function limpar() {
    if (!storage) return false;
    try {
      storage.removeItem(VISUAL_FEEDBACK_STORAGE_KEY);
      return true;
    } catch {
      return false;
    }
  }

  return { salvarAvaliacao, obterAvaliacao, ordenarCandidatos, resumir, limpar };
}

function normalizarEntrada(imagem, rating) {
  const key = chaveImagem(imagem);
  if (!key || !VISUAL_FEEDBACK_RATINGS.has(rating)) return null;
  const provider = textoSeguro(imagem?.provider, 24);
  const imageId = textoSeguro(imagem?.id, 100);
  const slot = textoSeguro(imagem?.slot, 40);
  if (!provider || !imageId || !slot) return null;
  return { key, provider, image_id: imageId, slot, rating };
}

function entradaValida(entrada) {
  return Boolean(
    entrada && typeof entrada === "object" &&
    chaveImagem({ provider: entrada.provider, id: entrada.image_id }) === entrada.key &&
    textoSeguro(entrada.slot, 40) &&
    VISUAL_FEEDBACK_RATINGS.has(entrada.rating)
  );
}

function chaveImagem(imagem) {
  const provider = textoSeguro(imagem?.provider, 24);
  const imageId = textoSeguro(imagem?.id || imagem?.image_id, 100);
  return provider && imageId ? `${provider}:${imageId}` : "";
}

function pontuar(rating) {
  if (rating === "adequada") return 20;
  if (rating === "generica") return -5;
  if (rating === "inadequada") return -100;
  return 0;
}

function textoSeguro(valor, limite) {
  return typeof valor === "string" ? valor.replace(/[^a-z0-9:_-]/gi, "").slice(0, limite) : "";
}

if (typeof window !== "undefined") {
  window.visualFeedbackService = criarVisualFeedbackService();
}

if (typeof module !== "undefined" && module.exports) {
  module.exports = {
    criarVisualFeedbackService,
    normalizarEntrada,
    chaveImagem,
    pontuar,
    VISUAL_FEEDBACK_STORAGE_KEY,
    VISUAL_FEEDBACK_MAX_ENTRIES
  };
}

