/* ==========================================================================
   CHEF IA STUDIO | MOTOR LOCAL DE EVENTOS
   TAG: motor-matematico, planejamento-local, calculos-operacionais
   --------------------------------------------------------------------------
   Responsabilidade: calcular numeros operacionais antes da IA.
   A IA deve complementar criatividade, mas nao contradizer estes valores.
   ========================================================================== */

const PERFIS_EVENTO = {
  casamento: { horas: 6, m2: 2.5, staff: 12 },
  aniversario: { horas: 4, m2: 1.2, staff: 22 },
  corporativo: { horas: 3, m2: 1.5, staff: 20 },
  churrasco: { horas: 5, m2: 1.5, staff: 18 },
  infantil: { horas: 4, m2: 1.4, staff: 20 },
  default: { horas: 4, m2: 1.2, staff: 20 }
};

const FATOR_CONSUMO_CRIANCA = 0.6;
const { calcularPlanejamentoOperacional } = require("./operational-planning.service");

function calcularMotorEvento(evento = {}, diretrizCulinaria = null) {
  const pessoas = numeroSeguro(evento.pessoas) || 1;
  const criancas = Math.min(numeroSeguro(evento.criancas), pessoas);
  const adultos = pessoas - criancas;
  const pessoasConsumo = adultos + criancas * FATOR_CONSUMO_CRIANCA;
  const tipo = String(evento.tipo || "").toLowerCase();
  const estiloKey = normalizarEstilo(evento.estilo);
  const perfil = obterPerfil(tipo);
  const duracao = numeroSeguro(evento.duracao) || perfil.horas;
  const temAlcool = /com alcool|com álcool|bar|moderado/i.test(evento.alcool || "");
  const refeicao = String(evento.refeicao || "").toLowerCase();
  const coquetel = /coquetel|finger|coffee|brunch/.test(refeicao);

  const salgados = coquetel ? Math.ceil(pessoasConsumo * 15) : Math.ceil(pessoasConsumo * 5);
  const doces = coquetel ? Math.ceil(pessoasConsumo * 5) : Math.ceil(pessoasConsumo * 3);
  const pesoComidaKg = coquetel ? 0 : arredondar1(pessoasConsumo * 0.42);
  const bebidasNaoAlcoolicasL = arredondar1((adultos * 0.2 + criancas * 0.16) * duracao);
  const bebidasAlcoolicasL = temAlcool ? arredondar1(adultos * 0.28 * duracao) : 0;
  const espacoM2 = Math.ceil(pessoas * perfil.m2);
  const composicaoPublico = criancas
    ? `${pessoas} pessoas (${adultos} adultos + ${criancas} criancas)`
    : `${pessoas} pessoas`;

  const operacao = calcularPlanejamentoOperacional(evento, { pessoas, duracao }, diretrizCulinaria || {});

  return {
    perfil: `${evento.tipo || "Evento"} · ${composicaoPublico} · ${rotuloEstilo(estiloKey)}`,
    duracao: `${duracao}h`,
    espaco: `${espacoM2}m2`,
    alimentacao: [
      { item: "Salgados/canapes", quantidade: `${salgados} un`, observacao: coquetel ? "15 por adulto equivalente" : "apoio para refeicao principal" },
      { item: "Doces/sobremesas", quantidade: `${doces} un`, observacao: coquetel ? "5 por adulto equivalente" : "3 por adulto equivalente" },
      ...(pesoComidaKg ? [{ item: "Comida principal", quantidade: `${pesoComidaKg} kg`, observacao: "420g por adulto equivalente" }] : [])
    ],
    bebidas: [
      { item: "Bebidas nao alcoolicas", quantidade: `${bebidasNaoAlcoolicasL}L`, observacao: "agua, suco e refrigerante" },
      { item: "Bebidas alcoolicas", quantidade: `${bebidasAlcoolicasL}L`, observacao: temAlcool ? "estimativa para adultos" : "nao previsto" }
    ],
    staff: operacao.equipe,
    operacao,
    servico_mesa: calcularServicoMesa(pessoas),
    custo_adulto: null,
    custo_crianca: null,
    estimativa_total: null,
    precificacao: criarEstadoPrecificacao(evento),
    premissas: {
      pessoas,
      adultos,
      criancas,
      fator_consumo_crianca: FATOR_CONSUMO_CRIANCA,
      tipo: evento.tipo || "Evento",
      estilo: rotuloEstilo(estiloKey),
      duracao_horas: duracao,
      refeicao: evento.refeicao || "Nao informado",
      alcool: evento.alcool || "Nao informado",
      tema: evento.tema || "Nao informado",
      orcamento_base: evento.orcamentoBase || "Nao informado",
      horario_inicio: evento.horarioInicio || "Nao informado",
      formato_servico: evento.formatoServico || "A definir pelo Chef IA",
      faixa_etaria: evento.faixaEtaria || "Publico misto",
      infraestrutura: evento.infraestrutura || "A confirmar",
      prioridade: evento.prioridade || "Equilibrio geral"
    }
  };
}

function aplicarMotorAoPlano(plano, motor) {
  const resultado = {
    ...plano,
    motor_logistica: motor,
    servico_mesa: motor.servico_mesa,
    orcamento: null,
    precificacao: motor.precificacao
  };
  resultado.reconciliacao_bebidas = reconciliarCoberturaBebidas(resultado, motor);
  return resultado;
}

function reconciliarCoberturaBebidas(plano, motor) {
  const relatorio = plano.qualidade_culinaria;
  if (!relatorio || !Array.isArray(relatorio.avisos) || !Array.isArray(plano.cardapio)) {
    return { status: "nao_avaliado", grupos: [] };
  }

  const bebidas = plano.cardapio.filter(item => /bebida/i.test(item.categoria || ""));
  const esperado = {
    naoAlcoolicas: litrosDoMotor(motor, "Bebidas nao alcoolicas"),
    alcoolicas: litrosDoMotor(motor, "Bebidas alcoolicas")
  };
  const grupos = [
    reconciliarGrupoBebidas(plano, relatorio, "nao alcoolicas", bebidas.filter(item => !ehBebidaAlcoolica(item)), esperado.naoAlcoolicas),
    reconciliarGrupoBebidas(plano, relatorio, "alcoolicas", bebidas.filter(ehBebidaAlcoolica), esperado.alcoolicas)
  ];
  sincronizarComprasBebidas(plano);

  return {
    status: grupos.some(grupo => grupo.status === "insuficiente")
      ? "revisar"
      : grupos.some(grupo => grupo.status === "ajustado") ? "ajustado" : "conforme",
    grupos
  };
}

function reconciliarGrupoBebidas(plano, relatorio, rotulo, itens, esperado) {
  const atual = arredondar1(itens.reduce((total, item) => total + litrosDaQuantidade(item.quantidade), 0));
  if (esperado <= 0) {
    return { classe: rotulo, status: "nao_previsto", esperado: 0, antes: atual, depois: atual, itens: [] };
  }
  if (atual + 0.01 >= esperado) {
    return { classe: rotulo, status: "conforme", esperado, antes: atual, depois: atual, itens: [] };
  }

  const positivos = itens.filter(item => litrosDaQuantidade(item.quantidade) > 0);
  if (!positivos.length) {
    registrarDeficitBebida(relatorio, rotulo, atual, esperado);
    return { classe: rotulo, status: "insuficiente", esperado, antes: atual, depois: atual, itens: [] };
  }

  const fator = esperado / atual;
  let acumulado = 0;
  const alteracoes = positivos.map((item, indice) => {
    const antes = litrosDaQuantidade(item.quantidade);
    const depois = indice === positivos.length - 1
      ? arredondar1(esperado - acumulado)
      : arredondar1(antes * fator);
    acumulado = arredondar1(acumulado + depois);
    item.quantidade = `${formatarLitros(depois)} L`;
    return { cardapio_id: item.id || "", nome: item.nome || "Bebida", antes, depois };
  });

  registrarAjusteBebida(
    relatorio,
    `Volume de bebidas ${rotulo} reconciliado pelo motor: ${formatarLitros(atual)} L para ${formatarLitros(esperado)} L, distribuido entre ${alteracoes.length} item(ns).`
  );

  return {
    classe: rotulo,
    status: "ajustado",
    esperado,
    antes: atual,
    depois: esperado,
    fator: Math.round(fator * 1000) / 1000,
    itens: alteracoes
  };
}

function sincronizarComprasBebidas(plano) {
  if (!Array.isArray(plano.lista_compras)) return;
  const bebidas = plano.cardapio.filter(item => /bebida/i.test(item.categoria || ""));
  const porId = new Map(bebidas.filter(item => item.id).map(item => [item.id, item]));

  plano.lista_compras.forEach(compra => {
    const origens = Array.isArray(compra.origens) ? compra.origens : [];
    let relacionadas = origens.map(origem => porId.get(origem)).filter(Boolean);
    if (!relacionadas.length && ehCompraDiretaBebida(compra)) {
      const chaveCompra = chaveTexto(compra.item);
      relacionadas = bebidas.filter(item => chaveTexto(item.nome) === chaveCompra);
    }
    if (!relacionadas.length) return;

    const total = arredondar1(relacionadas.reduce((soma, item) => soma + litrosDaQuantidade(item.quantidade), 0));
    if (total > 0 && ehCompraDiretaBebida(compra)) {
      compra.quantidade = `${formatarLitros(total)} L`;
    }
  });
}

function ehCompraDiretaBebida(compra) {
  return /^bebida$/i.test(compra?.natureza || "") || /^bebidas$/i.test(compra?.setor || "");
}

function chaveTexto(valor) {
  return String(valor || "")
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, " ")
    .trim();
}

function registrarAjusteBebida(relatorio, mensagem) {
  if (!Array.isArray(relatorio.ajustes)) relatorio.ajustes = [];
  relatorio.ajustes.push(mensagem);
  if (relatorio.status === "aprovado") relatorio.status = "ajustado";
}

function registrarDeficitBebida(relatorio, rotulo, atual, esperado) {
  if (esperado <= 0 || atual + 0.01 >= esperado) return;
  relatorio.avisos.push(`Bebidas ${rotulo} abaixo da estimativa do motor: ${formatarLitros(atual)}/${formatarLitros(esperado)} L.`);
  relatorio.status = "revisar";
}

function litrosDoMotor(motor, item) {
  return litrosDaQuantidade(motor?.bebidas?.find(entrada => entrada.item === item)?.quantidade);
}

function litrosDaQuantidade(valor) {
  const texto = String(valor || "").toLowerCase();
  const correspondencia = texto.match(/\d+(?:[.,]\d+)?/);
  if (!correspondencia) return 0;
  const numero = Number(correspondencia[0].replace(",", "."));
  if (!Number.isFinite(numero)) return 0;
  if (/\bml\b/.test(texto)) return numero / 1000;
  if (/\bl\b|litro/.test(texto.replace(/(\d)l\b/, "$1 l"))) return numero;
  return 0;
}

function ehBebidaAlcoolica(item) {
  const texto = String([item?.nome, item?.descricao].filter(Boolean).join(" "))
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase();
  if (/sem alcool|nao alcool/.test(texto)) return false;
  return /cerveja|vinho|espumante|caipirinha|cachaca|gin|vodka|whisky|uisque|drink alcool|coquetel alcool/.test(texto);
}

function formatarLitros(valor) {
  return String(Math.round(valor * 10) / 10).replace(".", ",");
}

function criarEstadoPrecificacao(evento) {
  return {
    status: "aguardando_catalogo",
    moeda: "BRL",
    regiao: {
      pais: evento.pais || "Brasil",
      estado: evento.estado || "",
      cidade: evento.cidade || ""
    },
    data_evento: evento.dataEvento || null,
    fonte: null,
    data_base: null,
    mensagem: "Valores financeiros ficam como A cotar ate existir catalogo regional com fonte e data-base."
  };
}

function calcularServicoMesa(pessoas) {
  const reserva = Math.ceil(pessoas * 1.15);
  const copos = Math.ceil(pessoas * 1.5);
  const guardanapos = Math.ceil(pessoas * 4);
  const travessas = Math.max(2, Math.ceil(pessoas / 8));
  const pegadores = Math.max(2, Math.ceil(travessas * 0.8));
  const bandejas = Math.max(2, Math.ceil(pessoas / 10));

  return {
    talheres: [
      { item: "Garfos de mesa", quantidade: `${reserva} un`, calculo: "1 por pessoa + 15% reserva" },
      { item: "Facas de mesa", quantidade: `${reserva} un`, calculo: "1 por pessoa + 15% reserva" },
      { item: "Colheres de sobremesa", quantidade: `${reserva} un`, calculo: "1 por pessoa + 15% reserva" }
    ],
    loucas: [
      { item: "Pratos rasos", quantidade: `${reserva} un`, calculo: "1 por pessoa + 15% reserva" },
      { item: "Pratos de sobremesa", quantidade: `${reserva} un`, calculo: "1 por pessoa + 15% reserva" }
    ],
    copos: [
      { item: "Copos de agua/suco", quantidade: `${copos} un`, calculo: "1,5 por pessoa" },
      { item: "Jarras ou suqueiras", quantidade: `${Math.max(2, Math.ceil(pessoas / 12))} un`, calculo: "1 a cada 12 pessoas" }
    ],
    descartaveis: [
      { item: "Guardanapos", quantidade: `${guardanapos} un`, calculo: "4 por pessoa" },
      { item: "Sacos de lixo reforcados", quantidade: `${Math.max(3, Math.ceil(pessoas / 12))} un`, calculo: "limpeza e descarte" }
    ],
    apoio_cozinha: [
      { item: "Travessas/refratarios", quantidade: `${travessas} un`, calculo: "1 a cada 8 pessoas" },
      { item: "Pegadores/colheres de servir", quantidade: `${pegadores} un`, calculo: "1 por travessa principal" },
      { item: "Bandejas de reposicao", quantidade: `${bandejas} un`, calculo: "1 a cada 10 pessoas" }
    ],
    observacao: "Quantidades com margem operacional para perda, reposicao e troca durante o evento."
  };
}

function obterPerfil(tipo) {
  if (/casamento|noivado/.test(tipo)) return PERFIS_EVENTO.casamento;
  if (/corporativo|empresa|workshop|networking/.test(tipo)) return PERFIS_EVENTO.corporativo;
  if (/churrasco/.test(tipo)) return PERFIS_EVENTO.churrasco;
  if (/infantil|crian/.test(tipo)) return PERFIS_EVENTO.infantil;
  if (/anivers/.test(tipo)) return PERFIS_EVENTO.aniversario;
  return PERFIS_EVENTO.default;
}

function normalizarEstilo(estilo = "") {
  const value = String(estilo).toLowerCase();
  if (value.includes("premium")) return "premium";
  if (value.includes("elegante")) return "elegante";
  return "simples";
}

function rotuloEstilo(estilo) {
  return { simples: "Simples", elegante: "Elegante", premium: "Premium" }[estilo] || "Simples";
}

function numeroSeguro(valor) {
  const n = parseInt(String(valor || "").replace(/\D/g, ""), 10);
  return Number.isFinite(n) ? n : 0;
}

function arredondar1(valor) {
  return Math.round(valor * 10) / 10;
}

module.exports = {
  calcularMotorEvento,
  aplicarMotorAoPlano
};
