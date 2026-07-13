const matriz = require("../../../data/culinary/matrix.json");
const catalogoFontes = require("../../../data/culinary/source-catalog.json");

const errosTaxonomia = validarTaxonomiaCulinaria(matriz);
if (errosTaxonomia.length) {
  throw new Error(`Matriz culinaria invalida: ${errosTaxonomia.join("; ")}`);
}

function obterDiretrizCulinaria(evento = {}) {
  const contextoEvento = normalizar(evento.tipo);
  const contextoRefeicao = normalizar(evento.refeicao);
  const contextoTema = normalizar(evento.tema);
  const contextoCompleto = normalizar([
    evento.tipo, evento.refeicao, evento.tema, evento.restricoes, evento.estilo, evento.obs
  ].filter(Boolean).join(" "));

  const perfil = matriz.profiles.find(item =>
    item.match.length && item.match.some(termo => contextoEvento.includes(normalizar(termo)))
  ) || matriz.profiles.find(item => item.id === "evento_refeicao_geral");

  const refeicao = matriz.meal_modifiers.find(item =>
    item.match.some(termo => contextoRefeicao.includes(normalizar(termo)))
  );

  const tema = matriz.themes.find(item =>
    item.match.some(termo => contextoTema.includes(normalizar(termo)))
  );
  const contextoOperacional = construirContextoOperacional(evento);

  return {
    matriz_version: matriz.version,
    catalogo_fontes_version: catalogoFontes.version,
    perfil: perfil.id,
    identidade_evento: perfil.identity,
    tipo_servico: perfil.service,
    momentos_servico: perfil.service_moments,
    elementos_esperados: perfil.required_features,
    repeticoes_essenciais: perfil.essential_repetitions,
    comidas_tipicas: perfil.typical_foods,
    elementos_opcionais: perfil.optional_features,
    evitar_no_perfil: perfil.avoid,
    modificador_refeicao: refeicao ? {
      id: refeicao.id,
      orientacoes: refeicao.guidance,
      sinais_culinarios: refeicao.signals
    } : null,
    modificador_tema: tema ? {
      id: tema.id,
      orientacao: tema.guidance,
      sinais_culinarios: tema.culinary_signals,
      evitar: tema.avoid
    } : null,
    contexto_operacional: contextoOperacional,
    quantidade_total_minima: perfil.composition.reduce((total, item) => total + item.minimum, 0),
    composicao_minima: perfil.composition,
    orientacoes: [
      ...matriz.principles,
      ...perfil.guidance,
      ...(refeicao ? refeicao.guidance : []),
      ...(tema ? [tema.guidance, tema.avoid] : []),
      ...contextoOperacional.orientacoes
    ],
    fontes: selecionarFontes(contextoCompleto)
  };
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
  const temas = Array.isArray(valor?.themes) ? valor.themes : [];

  validarIdsUnicos(perfis, "perfil", erros);
  validarIdsUnicos(modificadores, "modificador de refeicao", erros);
  validarIdsUnicos(temas, "tema", erros);

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

module.exports = { obterDiretrizCulinaria, selecionarFontes, validarTaxonomiaCulinaria, construirContextoOperacional };
