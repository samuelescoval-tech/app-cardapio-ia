const matriz = require("../../../data/culinary/matrix.json");
const catalogoFontes = require("../../../data/culinary/source-catalog.json");
const catalogoAlimentos = require("../../../data/culinary/food-catalog.json");
const { construirContextoEvento } = require("./event-coherence.service");

const errosTaxonomia = validarTaxonomiaCulinaria(matriz);
if (errosTaxonomia.length) {
  throw new Error(`Matriz culinaria invalida: ${errosTaxonomia.join("; ")}`);
}

function obterDiretrizCulinaria(evento = {}) {
  const contextoEvento = normalizar(evento.tipo);
  const contextoRefeicao = normalizar(evento.refeicao);
  const contextoTema = normalizar(evento.tema);
  const contextoOcasiao = normalizar([
    evento.tipo, evento.tema, evento.obs
  ].filter(Boolean).join(" "));
  const contextoCompleto = normalizar([
    evento.tipo, evento.refeicao, evento.tema, evento.restricoes, evento.estilo, evento.alcool, evento.obs
  ].filter(Boolean).join(" "));

  const perfil = matriz.profiles.find(item =>
    item.match.length && item.match.some(termo => contextoEvento.includes(normalizar(termo)))
  ) || matriz.profiles.find(item => item.id === "evento_refeicao_geral");

  const refeicao = matriz.meal_modifiers.find(item =>
    item.match.some(termo => contextoRefeicao.includes(normalizar(termo)))
  );

  const ocasiao = matriz.occasion_modifiers.find(item =>
    item.match.some(termo => contextoOcasiao.includes(normalizar(termo)))
  );

  const tema = matriz.themes.find(item =>
    item.match.some(termo => contextoTema.includes(normalizar(termo)))
  );
  const estilo = matriz.style_modifiers.find(item =>
    item.match.some(termo => normalizar(evento.estilo).includes(normalizar(termo)))
  );
  const contextoOperacional = construirContextoOperacional(evento);
  const composicaoMinima = ajustarComposicaoAoEvento(
    perfil.composition,
    evento,
    ocasiao?.composition_overrides,
    estilo?.minimum_increment_each_category
  );
  const pedidosExplicitos = extrairPedidosCulinarios(evento);
  const contextoEventoEstruturado = construirContextoEvento(evento);

  return {
    matriz_version: matriz.version,
    catalogo_fontes_version: catalogoFontes.version,
    catalogo_alimentos_version: catalogoAlimentos.version,
    perfil: perfil.id,
    contexto_evento: contextoEventoEstruturado,
    identidade_evento: perfil.identity,
    tipo_servico: perfil.service,
    momentos_servico: combinarListas(perfil.service_moments, ocasiao?.service_moments),
    elementos_esperados: combinarListas(
      combinarListas(perfil.required_features, ocasiao?.required_features),
      estilo?.required_features
    ),
    repeticoes_essenciais: combinarListas(perfil.essential_repetitions, ocasiao?.essential_repetitions),
    comidas_tipicas: perfil.typical_foods,
    elementos_opcionais: perfil.optional_features,
    evitar_no_perfil: combinarListas(perfil.avoid, estilo?.avoid),
    pedidos_culinarios_explicitos: pedidosExplicitos,
    modificador_refeicao: refeicao ? {
      id: refeicao.id,
      orientacoes: refeicao.guidance,
      sinais_culinarios: refeicao.signals
    } : null,
    modificador_ocasiao: ocasiao ? {
      id: ocasiao.id,
      identidade: ocasiao.identity,
      comidas_tipicas: ocasiao.typical_foods,
      orientacoes: ocasiao.guidance,
      evitar: ocasiao.avoid
    } : null,
    modificador_tema: tema ? {
      id: tema.id,
      orientacao: tema.guidance,
      sinais_culinarios: tema.culinary_signals,
      evitar: tema.avoid
    } : null,
    modificador_estilo: estilo ? {
      id: estilo.id,
      identidade: estilo.identity,
      orientacoes: estilo.guidance,
      evitar: estilo.avoid,
      incremento_minimo_por_categoria: estilo.minimum_increment_each_category
    } : null,
    contexto_operacional: contextoOperacional,
    quantidade_total_minima: composicaoMinima.reduce((total, item) => total + item.minimum, 0),
    composicao_minima: composicaoMinima,
    orientacoes: [
      ...matriz.principles,
      ...perfil.guidance,
      ...(refeicao ? refeicao.guidance : []),
      ...(ocasiao ? ocasiao.guidance : []),
      ...(tema ? [tema.guidance, tema.avoid] : []),
      ...(estilo ? [estilo.identity, ...estilo.guidance, ...estilo.avoid.map(item => `Evitar no estilo ${estilo.id}: ${item}.`)] : []),
      ...contextoOperacional.orientacoes
    ],
    fontes: selecionarFontes(contextoCompleto)
  };
}

function ajustarComposicaoAoEvento(composicao, evento, substituicoes = [], incrementoPorCategoria = 0) {
  const barCompleto = normalizar(evento.alcool).includes("bar completo");
  const categorias = new Map(composicao.map(item => [normalizar(item.category), { ...item }]));
  substituicoes.forEach(item => {
    const chave = normalizar(item.category);
    const atual = categorias.get(chave);
    categorias.set(chave, {
      category: atual?.category || item.category,
      minimum: Math.max(Number(atual?.minimum) || 0, Number(item.minimum) || 0)
    });
  });
  return Array.from(categorias.values()).map(item => ({
    ...item,
    minimum: barCompleto && normalizar(item.category) === "bebida"
      ? Math.max(item.minimum + incrementoPorCategoria, 4)
      : item.minimum + incrementoPorCategoria
  }));
}

function combinarListas(base = [], adicional = []) {
  return Array.from(new Set([...(base || []), ...(adicional || [])]));
}

function extrairPedidosCulinarios(evento = {}) {
  const contexto = normalizarTermos([evento.tema, evento.obs].filter(Boolean).join(" "));
  if (!contexto) return [];
  let restante = ` ${contexto} `;
  const candidatos = catalogoAlimentos.terms.flatMap((entrada, indice) => {
    const termos = combinarListas([entrada.item], entrada.aliases).map(normalizarTermos).filter(Boolean);
    const correspondencias = termos.filter(termo => restante.includes(` ${termo} `));
    return correspondencias.length ? [{ item: entrada.item, termos, correspondencias, indice }] : [];
  }).sort((a, b) => Math.max(...b.correspondencias.map(termo => termo.length)) - Math.max(...a.correspondencias.map(termo => termo.length)));

  const pedidos = [];
  candidatos.forEach(candidato => {
    const termo = candidato.correspondencias.find(item => restante.includes(` ${item} `));
    if (!termo) return;
    pedidos.push(candidato);
    restante = restante.replace(` ${termo} `, " ");
  });
  return pedidos
    .sort((a, b) => a.indice - b.indice)
    .map(({ item, termos }) => ({ item, termos }));
}

function normalizarTermos(valor) {
  return normalizar(valor).replace(/[^a-z0-9]+/g, " ").trim();
}

function construirContextoOperacional(evento) {
  const horario = evento.horarioInicio || "";
  const formato = evento.formatoServico || "A definir pelo Chef IA";
  const faixaEtaria = evento.faixaEtaria || "Publico misto";
  const infraestrutura = evento.infraestrutura || "A confirmar";
  const prioridade = evento.prioridade || "Equilibrio geral";
  const orientacoes = [];

  if (horario) {
    const hora = Number(horario.slice(0, 2));
    if (hora < 11) orientacoes.push("Inicio matinal: priorizar frescor, bebidas quentes e preparacoes adequadas a cafe da manha ou brunch quando coerente.");
    else if (hora < 15) orientacoes.push("Inicio no horario de almoco: garantir opcao substanciosa e progressao de refeicao completa quando a duracao exigir.");
    else if (hora < 18) orientacoes.push("Inicio vespertino: equilibrar lanches, itens de circulacao e transicao para refeicao se o evento avancar pela noite.");
    else orientacoes.push("Inicio noturno: considerar conforto, temperatura dos pratos e encerramento coerente com a duracao informada.");
  }

  const orientacaoFormato = {
    "Buffet self-service": "Buffet self-service: priorizar fluxo, identificacao dos pratos e preparacoes estaveis durante a reposicao.",
    "Buffet com equipe servindo": "Buffet servido: prever porcionamento consistente, fila assistida e utensilios de servico adequados.",
    "Empratado": "Servico empratado: reduzir finalizacoes concorrentes e manter sequencia, temperatura e padrao visual.",
    "Coquetel circulante": "Coquetel circulante: usar porcoes seguras para consumo em pe, bandejas e reposicao por ondas.",
    "Estacoes ou ilhas": "Estacoes ou ilhas: distribuir funcoes culinarias, evitar filas concentradas e prever equipamentos por ponto.",
    "Compartilhado a mesa": "Servico compartilhado: escolher travessas, porcoes e utensilios adequados a divisao na mesa."
  }[formato];
  if (orientacaoFormato) orientacoes.push(orientacaoFormato);

  const orientacaoFaixa = {
    "Predominantemente adultos": "Publico adulto predominante: equilibrar variedade, intensidade de sabores e consumo de bebidas conforme as preferencias informadas.",
    "Predominantemente infantil": "Publico infantil predominante: adaptar tamanho, textura, temperatura, identificacao e seguranca dos alimentos.",
    "Adolescentes e jovens": "Publico jovem: combinar formatos praticos, opcoes reconheciveis e variedade sem infantilizar a apresentacao.",
    "Adultos e idosos": "Publico com adultos e idosos: oferecer texturas confortaveis, boa identificacao e alternativas menos intensas sem presumir restricao clinica."
  }[faixaEtaria];
  if (orientacaoFaixa) orientacoes.push(orientacaoFaixa);

  const orientacaoInfraestrutura = {
    "Cozinha completa no local": "Cozinha completa informada: ainda confirmar capacidade, energia, refrigeracao e utensilios antes da execucao.",
    "Cozinha de apoio limitada": "Cozinha limitada: reduzir tecnicas simultaneas e priorizar mise en place externa com finalizacao simples.",
    "Sem cozinha no local": "Sem cozinha local: priorizar producao externa, transporte seguro e itens que nao dependam de cocao no evento.",
    "Producao externa com finalizacao": "Producao externa: concentrar preparo antecipado e limitar a finalizacao local a etapas controlaveis."
  }[infraestrutura];
  if (orientacaoInfraestrutura) orientacoes.push(orientacaoInfraestrutura);

  const orientacaoPrioridade = {
    "Variedade culinaria": "Prioridade variedade: ampliar bases, tecnicas e texturas sem aumentar categorias ou complexidade artificialmente.",
    "Praticidade de servico": "Prioridade praticidade: reduzir montagem durante o evento e favorecer reposicao, transporte e consumo simples.",
    "Apresentacao": "Prioridade apresentacao: planejar acabamento visual repetivel sem comprometer temperatura e ritmo.",
    "Conforto dos convidados": "Prioridade conforto: favorecer acesso, identificacao, porcoes e ritmo adequados ao publico.",
    "Economia operacional": "Prioridade economia operacional: compartilhar bases e mise en place de forma coerente sem repetir o mesmo prato."
  }[prioridade];
  if (orientacaoPrioridade) orientacoes.push(orientacaoPrioridade);

  return {
    horario_inicio: horario || null,
    formato_servico: formato,
    faixa_etaria: faixaEtaria,
    infraestrutura,
    prioridade,
    orientacoes
  };
}

function selecionarFontes(contexto) {
  const ids = new Set([
    ...catalogoFontes.bundles.core,
    ...catalogoFontes.bundles.repertoire
  ]);
  if (/sem gluten|celiac|alerg|lactose|restri/.test(contexto)) {
    catalogoFontes.bundles.restrictions.forEach(id => ids.add(id));
  }

  return catalogoFontes.sources
    .filter(fonte => ids.has(fonte.id))
    .map(fonte => ({
      id: fonte.id,
      nome: fonte.name,
      qualidade: fonte.quality,
      papeis: fonte.roles,
      uso: fonte.usage,
      limite: fonte.limitations
    }));
}

function normalizar(valor) {
  return String(valor || "")
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase();
}

function validarTaxonomiaCulinaria(valor) {
  const erros = [];
  const perfis = Array.isArray(valor?.profiles) ? valor.profiles : [];
  const modificadores = Array.isArray(valor?.meal_modifiers) ? valor.meal_modifiers : [];
  const ocasioes = Array.isArray(valor?.occasion_modifiers) ? valor.occasion_modifiers : [];
  const temas = Array.isArray(valor?.themes) ? valor.themes : [];
  const estilos = Array.isArray(valor?.style_modifiers) ? valor.style_modifiers : [];

  validarIdsUnicos(perfis, "perfil", erros);
  validarIdsUnicos(modificadores, "modificador de refeicao", erros);
  validarIdsUnicos(ocasioes, "modificador de ocasiao", erros);
  validarIdsUnicos(temas, "tema", erros);
  validarIdsUnicos(estilos, "modificador de estilo", erros);

  if (!perfis.some(perfil => perfil.id === "evento_refeicao_geral")) {
    erros.push("perfil geral ausente");
  }

  perfis.forEach(perfil => {
    if (!perfil.identity || !perfil.service) erros.push(`${perfil.id}: identidade ou servico ausente`);
    if (!Array.isArray(perfil.service_moments) || perfil.service_moments.length < 4) erros.push(`${perfil.id}: poucos momentos de servico`);
    if (!Array.isArray(perfil.required_features) || perfil.required_features.length < 4) erros.push(`${perfil.id}: poucos elementos esperados`);
    if (!Array.isArray(perfil.essential_repetitions) || !perfil.essential_repetitions.length) erros.push(`${perfil.id}: repeticoes essenciais ausentes`);
    if (!perfil.typical_foods || Object.keys(perfil.typical_foods).length < 4) erros.push(`${perfil.id}: repertorio tipico insuficiente`);
    if (!Array.isArray(perfil.composition) || !perfil.composition.length) erros.push(`${perfil.id}: composicao ausente`);
  });

  ocasioes.forEach(ocasiao => {
    if (!Array.isArray(ocasiao.match) || !ocasiao.match.length) erros.push(`${ocasiao.id}: termos de ocasiao ausentes`);
    if (!ocasiao.identity || !Array.isArray(ocasiao.guidance) || !ocasiao.guidance.length) erros.push(`${ocasiao.id}: identidade ou orientacao ausente`);
    if (!ocasiao.typical_foods || Object.keys(ocasiao.typical_foods).length < 3) erros.push(`${ocasiao.id}: repertorio de ocasiao insuficiente`);
    if (!Array.isArray(ocasiao.composition_overrides) || !ocasiao.composition_overrides.length) erros.push(`${ocasiao.id}: composicao de ocasiao ausente`);
  });

  estilos.forEach(estilo => {
    if (!Array.isArray(estilo.match) || !estilo.match.length) erros.push(`${estilo.id}: termos de estilo ausentes`);
    if (!estilo.identity || !Array.isArray(estilo.guidance) || !estilo.guidance.length) erros.push(`${estilo.id}: identidade ou orientacao ausente`);
    if (!Array.isArray(estilo.required_features) || estilo.required_features.length < 2) erros.push(`${estilo.id}: elementos de estilo insuficientes`);
    if (!Array.isArray(estilo.avoid) || estilo.avoid.length < 2) erros.push(`${estilo.id}: criterios de exclusao insuficientes`);
    if (!Number.isInteger(estilo.minimum_increment_each_category) || estilo.minimum_increment_each_category < 0) erros.push(`${estilo.id}: incremento de composicao invalido`);
  });

  return erros;
}

function validarIdsUnicos(itens, rotulo, erros) {
  const ids = new Set();
  itens.forEach(item => {
    if (!item?.id) {
      erros.push(`${rotulo} sem id`);
    } else if (ids.has(item.id)) {
      erros.push(`${rotulo} duplicado: ${item.id}`);
    }
    ids.add(item?.id);
  });
}

module.exports = { obterDiretrizCulinaria, selecionarFontes, validarTaxonomiaCulinaria, construirContextoOperacional, extrairPedidosCulinarios };
