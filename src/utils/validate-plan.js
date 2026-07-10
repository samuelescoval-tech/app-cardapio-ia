const CAMPOS_ARRAY = [
  "cardapio",
  "receitas",
  "lista_compras",
  "utensilios",
  "local",
  "layout",
  "cronograma",
  "equipe_obs",
  "entretenimento",
  "lembrancinhas"
];

function validarPlano(data) {
  if (!ehObjeto(data)) {
    throw new Error("Plano inválido.");
  }

  const plano = { ...data };

  CAMPOS_ARRAY.forEach(campo => {
    plano[campo] = normalizarArray(plano[campo]);
  });

  plano.motor_logistica = ehObjeto(plano.motor_logistica) ? plano.motor_logistica : null;
  plano.servico_mesa = ehObjeto(plano.servico_mesa) ? plano.servico_mesa : null;
  plano.decoracao = normalizarDecoracao(plano.decoracao);
  plano.checklist = normalizarChecklist(plano.checklist);
  plano.orcamento = normalizarOrcamento(plano.orcamento);
  plano.resumo_chef = textoSeguro(plano.resumo_chef, "Resumo indisponível.");

  return plano;
}

function criarFallback(mensagem) {
  return {
    cardapio: [],
    receitas: [],
    lista_compras: [],
    utensilios: [],
    local: [],
    layout: [],
    decoracao: null,
    cronograma: [],
    equipe_obs: [],
    entretenimento: [],
    lembrancinhas: [],
    checklist: null,
    orcamento: null,
    motor_logistica: null,
    servico_mesa: null,
    resumo_chef: mensagem || "A IA não retornou um plano válido desta vez."
  };
}

function normalizarArray(valor) {
  if (Array.isArray(valor)) {
    return valor.filter(item => item !== null && item !== undefined && item !== "");
  }

  if (typeof valor === "string" && valor.trim()) {
    return [valor.trim()];
  }

  return [];
}

function normalizarDecoracao(valor) {
  if (!ehObjeto(valor)) return null;

  return {
    ...valor,
    temas: normalizarArray(valor.temas),
    itens: normalizarArray(valor.itens),
    iluminacao: textoSeguro(valor.iluminacao, "")
  };
}

function normalizarChecklist(valor) {
  if (!ehObjeto(valor)) return null;

  return {
    ...valor,
    pre: normalizarArray(valor.pre),
    durante: normalizarArray(valor.durante),
    pos: normalizarArray(valor.pos)
  };
}

function normalizarOrcamento(valor) {
  if (!ehObjeto(valor)) return null;

  return {
    ...valor,
    economico: ehObjeto(valor.economico) ? valor.economico : {},
    medio: ehObjeto(valor.medio) ? valor.medio : {},
    sofisticado: ehObjeto(valor.sofisticado) ? valor.sofisticado : {}
  };
}

function textoSeguro(valor, fallback) {
  if (typeof valor !== "string") return fallback;
  const texto = valor.trim();
  return texto || fallback;
}

function ehObjeto(valor) {
  return Boolean(valor) && typeof valor === "object" && !Array.isArray(valor);
}

module.exports = { validarPlano, criarFallback };
