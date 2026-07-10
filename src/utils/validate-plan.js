const CAMPOS_ARRAY_TEXTO = [
  "layout",
  "equipe_obs",
  "entretenimento",
  "lembrancinhas"
];

const CAMPOS_OBRIGATORIOS = [
  "cardapio",
  "lista_compras",
  "cronograma",
  "decoracao",
  "checklist",
  "resumo_chef"
];

function validarPlano(data) {
  if (!ehObjeto(data)) {
    throw new Error("Plano inválido.");
  }

  const ausentes = CAMPOS_OBRIGATORIOS.filter(campo => !Object.hasOwn(data, campo));
  if (ausentes.length) {
    throw new Error(`Plano incompleto. Campos ausentes: ${ausentes.join(", ")}.`);
  }

  const plano = {};

  CAMPOS_ARRAY_TEXTO.forEach(campo => {
    plano[campo] = normalizarArrayTexto(data[campo]);
  });

  plano.cardapio = normalizarObjetos(data.cardapio, normalizarCardapio);
  plano.receitas = normalizarObjetos(data.receitas, normalizarReceita);
  plano.lista_compras = normalizarObjetos(data.lista_compras, normalizarCompra);
  plano.utensilios = normalizarObjetos(data.utensilios, normalizarUtensilio);
  plano.local = normalizarObjetos(data.local, normalizarLocal);
  plano.cronograma = normalizarObjetos(data.cronograma, normalizarCronograma);

  plano.motor_logistica = null;
  plano.servico_mesa = null;
  plano.precificacao = null;
  plano.decoracao = normalizarDecoracao(data.decoracao);
  plano.checklist = normalizarChecklist(data.checklist);
  plano.orcamento = null;
  plano.resumo_chef = textoSeguro(data.resumo_chef, "Resumo indisponível.");

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
    precificacao: null,
    motor_logistica: null,
    servico_mesa: null,
    resumo_chef: mensagem || "A IA não retornou um plano válido desta vez."
  };
}

function normalizarArrayTexto(valor) {
  if (Array.isArray(valor)) {
    return valor
      .map(item => textoSeguro(item, ""))
      .filter(Boolean);
  }

  if (typeof valor === "string" && valor.trim()) {
    return [valor.trim()];
  }

  return [];
}

function normalizarObjetos(valor, normalizador) {
  if (!Array.isArray(valor)) return [];
  return valor.map(normalizador).filter(Boolean);
}

function normalizarCardapio(valor) {
  if (!ehObjeto(valor)) return null;
  return {
    nome: textoSeguro(valor.nome, ""),
    categoria: textoSeguro(valor.categoria, ""),
    descricao: textoSeguro(valor.descricao, ""),
    emoji: textoSeguro(valor.emoji, ""),
    quantidade: textoSeguro(valor.quantidade, ""),
    ingredientes: normalizarArrayTexto(valor.ingredientes)
  };
}

function normalizarReceita(valor) {
  if (!ehObjeto(valor)) return null;
  return {
    nome: textoSeguro(valor.nome, ""),
    preparo: textoSeguro(valor.preparo, ""),
    tempo: textoSeguro(valor.tempo, ""),
    rendimento: textoSeguro(valor.rendimento, "")
  };
}

function normalizarCompra(valor) {
  if (!ehObjeto(valor)) return null;
  return {
    item: textoSeguro(valor.item, ""),
    quantidade: textoSeguro(valor.quantidade, ""),
    setor: textoSeguro(valor.setor, "Outros"),
    prioridade: textoSeguro(valor.prioridade, "media")
  };
}

function normalizarUtensilio(valor) {
  if (!ehObjeto(valor)) return null;
  return {
    item: textoSeguro(valor.item, ""),
    quantidade: textoSeguro(valor.quantidade, ""),
    uso: textoSeguro(valor.uso, "")
  };
}

function normalizarLocal(valor) {
  if (!ehObjeto(valor)) return null;
  return {
    tipo: textoSeguro(valor.tipo, ""),
    capacidade: textoSeguro(valor.capacidade, ""),
    pros: textoSeguro(valor.pros, ""),
    contras: textoSeguro(valor.contras, ""),
    recomendado: valor.recomendado === true
  };
}

function normalizarCronograma(valor) {
  if (!ehObjeto(valor)) return null;
  return {
    hora: textoSeguro(valor.hora, ""),
    atividade: textoSeguro(valor.atividade, ""),
    descricao: textoSeguro(valor.descricao, "")
  };
}

function normalizarDecoracao(valor) {
  if (!ehObjeto(valor)) return null;

  return {
    temas: normalizarArrayTexto(valor.temas),
    itens: normalizarArrayTexto(valor.itens),
    iluminacao: textoSeguro(valor.iluminacao, "")
  };
}

function normalizarChecklist(valor) {
  if (!ehObjeto(valor)) return null;

  return {
    pre: normalizarArrayTexto(valor.pre),
    durante: normalizarArrayTexto(valor.durante),
    pos: normalizarArrayTexto(valor.pos)
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
