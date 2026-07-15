const { calcularMinimoVariedadeBebidas } = require("./beverage-variety.service");

function avaliarQualidadeEvento(plano = {}, evento = {}, diretriz = {}) {
  const cardapio = Array.isArray(plano.cardapio) ? plano.cardapio : [];
  const avisos = Array.isArray(plano.qualidade_culinaria?.avisos) ? plano.qualidade_culinaria.avisos : [];
  const comparacao = [
    avaliarIdentidade(cardapio, avisos),
    avaliarComposicao(cardapio, diretriz),
    avaliarBebidas(cardapio, evento),
    avaliarPadrao(cardapio, evento, avisos),
    avaliarReceitas(plano),
    avaliarOperacao(avisos)
  ];
  const nota = arredondar(comparacao.reduce((total, item) => total + item.pontos, 0));
  const status = nota >= 8 ? "aprovado" : nota >= 6.5 ? "revisar" : "rascunho";
  const itensARevisar = localizarItensARevisar(cardapio, evento);
  const itensCoerentes = cardapio
    .filter(item => !itensARevisar.some(revisao => revisao.id === item.id))
    .slice(0, 12)
    .map(item => item.nome)
    .filter(Boolean);
  const falhas = comparacao.filter(item => item.pontos + 0.01 < item.maximo).map(item => item.criterio);

  return {
    versao: "1.0.0",
    nota,
    status,
    limiar_aprovacao: 8,
    comparacao,
    itens_coerentes: itensCoerentes,
    itens_a_revisar: itensARevisar,
    resumo_textual: status === "aprovado"
      ? `O evento atingiu ${formatarNota(nota)}/10 e os principais blocos estão coerentes com o contexto informado.`
      : `O evento atingiu ${formatarNota(nota)}/10. Antes de tratá-lo como versão final, revise: ${falhas.join(", ") || "os itens destacados"}.`,
    decisao: status === "rascunho"
      ? "Manter como rascunho e orientar uma única revisão pelos critérios abaixo; não repetir gerações sem comparar o resultado."
      : status === "revisar"
        ? "Utilizável como rascunho operacional, mas ainda não aprovado como entrega final."
        : "Aprovado pela barreira local de coerência; a execução ainda exige conferência profissional."
  };
}

function avaliarIdentidade(cardapio, avisos) {
  const falhas = avisos.filter(aviso => /pedido culinario explicito ausente|opcao identificada em prato principal|categoria corrigida/i.test(aviso));
  const pontos = Math.max(0, 2 - falhas.length * 0.5);
  return criterio("Ocasião e coerência dos itens", pontos, 2, falhas.length
    ? `${falhas.length} conflito(s) entre o pedido e o cardápio.`
    : `${cardapio.length} itens sem conflito estrutural pendente identificado.`);
}

function avaliarComposicao(cardapio, diretriz) {
  const regras = Array.isArray(diretriz.composicao_minima) ? diretriz.composicao_minima : [];
  if (!regras.length) return criterio("Composição das refeições", cardapio.length ? 2 : 0, 2, "Sem matriz específica para comparação.");
  const proporcoes = regras.map(regra => {
    const atual = cardapio.filter(item => chave(item.categoria) === chave(regra.category)).length;
    return Math.min(1, atual / Math.max(1, Number(regra.minimum) || 1));
  });
  const cobertura = proporcoes.reduce((total, valor) => total + valor, 0) / proporcoes.length;
  return criterio("Composição das refeições", 2 * cobertura, 2, `${Math.round(cobertura * 100)}% dos mínimos por categoria cobertos.`);
}

function avaliarBebidas(cardapio, evento) {
  const bebidas = cardapio.filter(item => chave(item.categoria) === "bebida");
  const minimo = calcularMinimoVariedadeBebidas(evento.pessoas);
  const cobertura = minimo ? Math.min(1, bebidas.length / minimo) : (bebidas.length ? 1 : 0);
  const alcool = chave(evento.alcool);
  const alcoolicas = bebidas.filter(item => /cerveja|vinho|espumante|gin|vodka|whisky|uisque|cachaca|caipirinha/.test(chave(`${item.nome} ${item.descricao}`)));
  let penalidade = 0;
  if (/sem alcool|nao alcool/.test(alcool) && alcoolicas.length) penalidade = 0.75;
  if (/bar completo/.test(alcool) && alcoolicas.length < 2) penalidade = Math.max(penalidade, 0.5);
  return criterio("Variedade de bebidas", Math.max(0, 2 * cobertura - penalidade), 2, `${bebidas.length}/${minimo || "sem mínimo"} opções; ${alcoolicas.length} alcoólica(s).`);
}

function avaliarPadrao(cardapio, evento, avisos) {
  const premium = /premium/.test(chave(evento.estilo));
  if (!premium) return criterio("Adequação ao padrão", 1.5, 1.5, "O evento não exige contrato Premium.");
  const falhasPremium = avisos.filter(aviso => /premium/i.test(aviso));
  const pontos = Math.max(0, 1.5 - falhasPremium.length * 0.5);
  return criterio("Adequação ao padrão Premium", pontos, 1.5, falhasPremium.length
    ? `${falhasPremium.length} requisito(s) Premium ainda pendente(s).`
    : `${cardapio.length} itens passaram pelos filtros Premium locais.`);
}

function avaliarReceitas(plano) {
  const cobertura = plano.qualidade_culinaria?.cobertura || {};
  const esperadas = Number(cobertura.pratos_com_preparo) || 0;
  const completas = Number(cobertura.receitas_completas) || 0;
  const proporcao = esperadas ? Math.min(1, completas / esperadas) : 1;
  return criterio("Receitas e rastreabilidade", 1.5 * proporcao, 1.5, `${completas}/${esperadas} preparações com ficha completa.`);
}

function avaliarOperacao(avisos) {
  const falhas = avisos.filter(aviso => /secao do evento abaixo|decoracao abaixo|checklist abaixo|experiencia premium sem evidencia/i.test(aviso));
  return criterio("Operação e experiência", Math.max(0, 1 - falhas.length * 0.2), 1, falhas.length
    ? `${falhas.length} lacuna(s) operacional(is) identificada(s).`
    : "Seções operacionais mínimas presentes.");
}

function localizarItensARevisar(cardapio, evento) {
  const premium = /premium/.test(chave(evento.estilo));
  return cardapio.flatMap(item => {
    const nome = chave(item.nome);
    const categoria = chave(item.categoria);
    const motivos = [];
    if (/prato principal/.test(categoria) && /iogurte|fruta|bolo|biscoito|bebida|refrigerante/.test(nome)) motivos.push("categoria incompatível com a função culinária");
    if (premium && /iogurte com mel/.test(nome) && !/grego|artesanal|compota|granola|verrine/.test(chave(`${item.nome} ${item.descricao}`))) motivos.push("apresentação genérica para o padrão Premium");
    if (premium && /biscoito de? especiarias|biscoito especiarias/.test(nome) && !/amanteigado|artesanal|decorado/.test(chave(`${item.nome} ${item.descricao}`))) motivos.push("acabamento Premium não demonstrado");
    return motivos.length ? [{ id: item.id || "", nome: item.nome || "Item", motivos }] : [];
  });
}

function criterio(criterio, pontos, maximo, resultado) {
  return { criterio, pontos: arredondar(Math.max(0, Math.min(maximo, pontos))), maximo, resultado };
}
function chave(valor) { return String(valor || "").normalize("NFD").replace(/[\u0300-\u036f]/g, "").toLowerCase(); }
function arredondar(valor) { return Math.round((Number(valor) || 0) * 10) / 10; }
function formatarNota(valor) { return Number(valor).toLocaleString("pt-BR", { minimumFractionDigits: 1, maximumFractionDigits: 1 }); }

module.exports = { avaliarQualidadeEvento };
