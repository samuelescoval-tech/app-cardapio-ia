function validarPlano(data) {
  if (!data || typeof data !== "object") {
    throw new Error("Plano inválido.");
  }

  if (!Array.isArray(data.cardapio)) data.cardapio = [];
  if (!Array.isArray(data.receitas)) data.receitas = [];
  if (!Array.isArray(data.lista_compras)) data.lista_compras = [];
  if (!Array.isArray(data.utensilios)) data.utensilios = [];
  if (!Array.isArray(data.local)) data.local = [];
  if (!Array.isArray(data.layout)) data.layout = [];
  if (!Array.isArray(data.cronograma)) data.cronograma = [];
  if (!Array.isArray(data.equipe_obs)) data.equipe_obs = [];
  if (!Array.isArray(data.entretenimento)) data.entretenimento = [];
  if (!Array.isArray(data.lembrancinhas)) data.lembrancinhas = [];
  if (!data.motor_logistica || typeof data.motor_logistica !== "object") data.motor_logistica = null;
  if (!data.servico_mesa || typeof data.servico_mesa !== "object") data.servico_mesa = null;
  if (!data.decoracao || typeof data.decoracao !== "object") data.decoracao = null;
  if (!data.checklist || typeof data.checklist !== "object") data.checklist = null;
  if (!data.orcamento || typeof data.orcamento !== "object") data.orcamento = null;
  if (typeof data.resumo_chef !== "string") data.resumo_chef = "Resumo indisponível.";

  return data;
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

module.exports = { validarPlano, criarFallback };
