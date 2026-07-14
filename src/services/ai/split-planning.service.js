const { validarPlano, criarFallback } = require("../../utils/validate-plan");
const { montarPromptCardapio, montarPromptReceitas, montarPromptExperiencia } = require("../../prompts/block-prompts");

async function gerarPlanoEmBlocos({ evento, motor, diretriz, menuService, detailService }) {
  const inicio = Date.now();
  const etapas = {};
  const promptCardapio = montarPromptCardapio(evento, motor, diretriz);
  let menu = await menuService.gerarEstrutura(promptCardapio);
  etapas.cardapio_primario = menu.meta;
  let fallbackMenu = false;
  if (!menu.ok || !Array.isArray(menu.dados?.cardapio)) {
    fallbackMenu = true;
    menu = await detailService.gerarEstrutura(promptCardapio);
    etapas.cardapio_fallback = menu.meta;
  }
  if (!menu.ok || !Array.isArray(menu.dados?.cardapio)) {
    return falha("cardapio", menu.meta?.erro || "Bloco de cardapio invalido.", etapas, inicio);
  }

  const cardapio = menu.dados.cardapio;
  const [receitas, experiencia] = await Promise.all([
    detailService.gerarEstrutura(montarPromptReceitas(evento, cardapio)),
    detailService.gerarEstrutura(montarPromptExperiencia(evento, motor, cardapio))
  ]);
  etapas.receitas = receitas.meta;
  etapas.experiencia = experiencia.meta;

  const bruto = {
    resumo_chef: menu.dados.resumo_chef || "Planejamento criado em blocos especializados.",
    cardapio,
    receitas: receitas.dados?.receitas || [],
    lista_compras: [],
    local: experiencia.dados?.local || [],
    layout: experiencia.dados?.layout || [],
    decoracao: experiencia.dados?.decoracao || null,
    cronograma: experiencia.dados?.cronograma || [],
    utensilios: experiencia.dados?.utensilios || [],
    equipe_obs: experiencia.dados?.equipe_obs || [],
    entretenimento: experiencia.dados?.entretenimento || [],
    lembrancinhas: experiencia.dados?.lembrancinhas || [],
    checklist: experiencia.dados?.checklist || null
  };

  try {
    const plano = validarPlano(bruto, { evento, diretrizCulinaria: diretriz });
    const todasEtapasOk = menu.ok && receitas.ok && experiencia.ok;
    return {
      ok: todasEtapasOk,
      provider: "gemini-split",
      plano,
      meta: {
        ...agregarMeta(etapas, inicio, todasEtapasOk, todasEtapasOk ? null : "Uma etapa secundaria falhou."),
        fallback_menu: fallbackMenu
      }
    };
  } catch (error) {
    return falha("validacao", error.message, etapas, inicio);
  }
}

function falha(etapa, erro, etapas, inicio) {
  return {
    ok: false,
    provider: "gemini-split",
    plano: criarFallback(erro),
    meta: agregarMeta(etapas, inicio, false, erro, etapa)
  };
}

function agregarMeta(etapas, inicio, schemaOk, erro = null, etapaFalha = null) {
  const valores = Object.values(etapas);
  const metaCardapio = etapas.cardapio_fallback || etapas.cardapio_primario;
  return {
    tempo_ms: Date.now() - inicio,
    schema_ok: schemaOk,
    finish_reason: schemaOk ? "STOP" : valores.find(item => item?.finish_reason !== "STOP")?.finish_reason || null,
    prompt_tokens: somar(valores, "prompt_tokens"),
    thinking_tokens: somar(valores, "thinking_tokens"),
    output_tokens: somar(valores, "output_tokens"),
    total_tokens: somar(valores, "total_tokens"),
    requested_model: `${metaCardapio?.requested_model || "?"} + ${etapas.receitas?.requested_model || "?"}`,
    model_version: `${metaCardapio?.model_version || "?"} + ${etapas.receitas?.model_version || "?"}`,
    generation_mode: "split",
    etapa_falha: etapaFalha,
    erro,
    etapas
  };
}

function somar(valores, campo) {
  const numeros = valores.map(item => Number(item?.[campo])).filter(Number.isFinite);
  return numeros.length ? numeros.reduce((total, valor) => total + valor, 0) : null;
}

module.exports = { gerarPlanoEmBlocos };
