function avaliarResultadoBenchmark({ resposta = {}, diretriz = {}, expectativas = [] } = {}) {
  const plano = resposta.plano || {};
  const cardapio = Array.isArray(plano.cardapio) ? plano.cardapio : [];
  const receitas = Array.isArray(plano.receitas) ? plano.receitas : [];
  const compras = Array.isArray(plano.lista_compras) ? plano.lista_compras : [];
  const qualidade = plano.qualidade_culinaria || {};
  const textoCardapio = normalizar(cardapio.map(item => `${item.nome || ""} ${item.descricao || ""}`).join(" "));

  const coberturaCategorias = calcularCoberturaCategorias(cardapio, diretriz.composicao_minima);
  const gruposEsperados = combinarExpectativas(expectativas, diretriz.pedidos_culinarios_explicitos);
  const coberturaExpectativas = calcularCoberturaExpectativas(textoCardapio, gruposEsperados);
  const coberturaReceitas = calcularCoberturaReceitas(cardapio, receitas);
  const coberturaIngredientes = calcularCoberturaIngredientes(cardapio, compras);
  const avisos = Array.isArray(qualidade.avisos) ? qualidade.avisos : [];
  const respostaValida = resposta.ok === true && resposta.meta?.schema_ok === true;

  const componentesValidos = {
    contrato: (resposta.ok ? 10 : 0) + (resposta.meta?.schema_ok === true ? 10 : 0),
    categorias: pontosProporcionais(coberturaCategorias.razao, 20),
    repertorio: pontosProporcionais(coberturaExpectativas.razao, 20),
    receitas: pontosProporcionais(coberturaReceitas.razao, 15),
    ingredientes: pontosProporcionais(coberturaIngredientes.razao, 10),
    qualidade: pontosQualidade(qualidade.status),
    avisos: Math.max(0, 5 - avisos.length),
    conclusao: resposta.meta?.finish_reason === "STOP" ? 5 : 0
  };
  const componentes = respostaValida
    ? componentesValidos
    : Object.fromEntries(Object.keys(componentesValidos).map(chave => [chave, 0]));

  return {
    pontuacao_tecnica: Object.values(componentes).reduce((total, valor) => total + valor, 0),
    componentes,
    metricas: {
      itens_cardapio: cardapio.length,
      minimo_cardapio: Number(diretriz.quantidade_total_minima) || 0,
      categorias: coberturaCategorias,
      expectativas: coberturaExpectativas,
      receitas: coberturaReceitas,
      ingredientes: coberturaIngredientes,
      status_qualidade: qualidade.status || "nao_avaliado",
      avisos: avisos.length,
      ajustes: Array.isArray(qualidade.ajustes) ? qualidade.ajustes.length : 0,
      tempo_ms: resposta.meta?.tempo_ms || null,
      prompt_tokens: resposta.meta?.prompt_tokens || null,
      thinking_tokens: resposta.meta?.thinking_tokens || null,
      output_tokens: resposta.meta?.output_tokens || null,
      total_tokens: resposta.meta?.total_tokens || null,
      finish_reason: resposta.meta?.finish_reason || null,
      requested_model: resposta.meta?.requested_model || null,
      model_version: resposta.meta?.model_version || null,
      erro: resposta.meta?.erro || null
    }
  };
}

function calcularCoberturaCategorias(cardapio = [], composicao = []) {
  const contagem = new Map();
  cardapio.forEach(item => {
    const categoria = normalizar(item.categoria);
    contagem.set(categoria, (contagem.get(categoria) || 0) + 1);
  });
  const detalhes = (composicao || []).map(item => {
    const minimo = Number(item.minimum) || 0;
    const atual = contagem.get(normalizar(item.category)) || 0;
    return { categoria: item.category, minimo, atual, conforme: atual >= minimo };
  });
  const esperado = detalhes.reduce((total, item) => total + item.minimo, 0);
  const coberto = detalhes.reduce((total, item) => total + Math.min(item.atual, item.minimo), 0);
  return { coberto, esperado, razao: razao(coberto, esperado), detalhes };
}

function combinarExpectativas(expectativas = [], pedidos = []) {
  const explicitos = (pedidos || []).map(item => ({
    label: item.item,
    anyOf: Array.isArray(item.termos) && item.termos.length ? item.termos : [item.item]
  }));
  return [...(expectativas || []), ...explicitos];
}

function calcularCoberturaExpectativas(texto, expectativas = []) {
  const textoNormalizado = normalizar(texto);
  const detalhes = expectativas.map(item => {
    const termos = (item.anyOf || []).map(normalizar).filter(Boolean);
    const encontrado = termos.some(termo => textoNormalizado.includes(termo));
    return { label: item.label, encontrado };
  });
  const coberto = detalhes.filter(item => item.encontrado).length;
  return { coberto, esperado: detalhes.length, razao: razao(coberto, detalhes.length), detalhes };
}

function calcularCoberturaReceitas(cardapio = [], receitas = []) {
  const preparacoes = cardapio.filter(item => /^(preparo|montagem)$/i.test(String(item.tipo_execucao || "")));
  const ids = new Set(receitas.map(item => item.cardapio_id).filter(Boolean));
  const coberto = preparacoes.filter(item => ids.has(item.id)).length;
  return { coberto, esperado: preparacoes.length, razao: razao(coberto, preparacoes.length) };
}

function calcularCoberturaIngredientes(cardapio = [], compras = []) {
  const ingredientes = new Set(cardapio.flatMap(item => item.ingredientes || []).map(item => normalizar(item.item)).filter(Boolean));
  const comprados = new Set(compras.map(item => normalizar(item.item)).filter(Boolean));
  const coberto = Array.from(ingredientes).filter(item => comprados.has(item)).length;
  return { coberto, esperado: ingredientes.size, razao: razao(coberto, ingredientes.size) };
}

function pontosQualidade(status) {
  if (status === "aprovado") return 5;
  if (status === "ajustado") return 4;
  if (status === "revisar") return 1;
  return 0;
}

function pontosProporcionais(valor, maximo) {
  return Math.round(Math.max(0, Math.min(1, valor)) * maximo);
}

function razao(coberto, esperado) {
  return esperado > 0 ? coberto / esperado : 1;
}

function normalizar(valor) {
  return String(valor || "")
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, " ")
    .trim();
}

module.exports = {
  avaliarResultadoBenchmark,
  calcularCoberturaCategorias,
  calcularCoberturaExpectativas,
  calcularCoberturaReceitas,
  calcularCoberturaIngredientes
};
