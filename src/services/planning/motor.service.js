/* ==========================================================================
   CHEF IA STUDIO | MOTOR LOCAL DE EVENTOS
   TAG: motor-matematico, planejamento-local, calculos-operacionais
   --------------------------------------------------------------------------
   Responsabilidade: calcular numeros operacionais antes da IA.
   A IA deve complementar criatividade, mas nao contradizer estes valores.
   ========================================================================== */

const PERFIS_EVENTO = {
  casamento: { fator: 2.2, horas: 6, m2: 2.5, staff: 12 },
  aniversario: { fator: 1.0, horas: 4, m2: 1.2, staff: 22 },
  corporativo: { fator: 1.3, horas: 3, m2: 1.5, staff: 20 },
  churrasco: { fator: 1.1, horas: 5, m2: 1.5, staff: 18 },
  infantil: { fator: 0.9, horas: 4, m2: 1.4, staff: 20 },
  default: { fator: 1.0, horas: 4, m2: 1.2, staff: 20 }
};

const MULTIPLICADOR_ESTILO = {
  simples: 1,
  elegante: 1.7,
  premium: 2.6
};

function calcularMotorEvento(evento = {}) {
  const pessoas = numeroSeguro(evento.pessoas) || 1;
  const tipo = String(evento.tipo || "").toLowerCase();
  const estiloKey = normalizarEstilo(evento.estilo);
  const perfil = obterPerfil(tipo);
  const duracao = numeroSeguro(evento.duracao) || perfil.horas;
  const temAlcool = /com alcool|com álcool|bar|moderado/i.test(evento.alcool || "");
  const refeicao = String(evento.refeicao || "").toLowerCase();
  const coquetel = /coquetel|finger|coffee|brunch/.test(refeicao);
  const mult = MULTIPLICADOR_ESTILO[estiloKey] || 1;

  const salgados = coquetel ? Math.ceil(pessoas * 15) : Math.ceil(pessoas * 5);
  const doces = coquetel ? Math.ceil(pessoas * 5) : Math.ceil(pessoas * 3);
  const pesoComidaKg = coquetel ? 0 : arredondar1(pessoas * 0.42);
  const bebidasNaoAlcoolicasL = arredondar1(pessoas * 0.2 * duracao);
  const bebidasAlcoolicasL = temAlcool ? arredondar1(pessoas * 0.28 * duracao) : 0;
  const garcons = Math.max(1, Math.ceil(pessoas / perfil.staff));
  const apoioCozinha = Math.max(1, Math.ceil(pessoas / 35));
  const espacoM2 = Math.ceil(pessoas * perfil.m2);
  const custoPessoa = Math.ceil((85 * perfil.fator * mult + 35) / 10) * 10;
  const estimativaTotal = custoPessoa * pessoas;

  return {
    perfil: `${evento.tipo || "Evento"} · ${pessoas} pessoas · ${rotuloEstilo(estiloKey)}`,
    duracao: `${duracao}h`,
    espaco: `${espacoM2}m2`,
    alimentacao: [
      { item: "Salgados/canapes", quantidade: `${salgados} un`, observacao: coquetel ? "15 por pessoa" : "apoio para refeicao principal" },
      { item: "Doces/sobremesas", quantidade: `${doces} un`, observacao: coquetel ? "5 por pessoa" : "3 por pessoa" },
      ...(pesoComidaKg ? [{ item: "Comida principal", quantidade: `${pesoComidaKg} kg`, observacao: "420g por pessoa" }] : [])
    ],
    bebidas: [
      { item: "Bebidas nao alcoolicas", quantidade: `${bebidasNaoAlcoolicasL}L`, observacao: "agua, suco e refrigerante" },
      { item: "Bebidas alcoolicas", quantidade: `${bebidasAlcoolicasL}L`, observacao: temAlcool ? "estimativa para adultos" : "nao previsto" }
    ],
    staff: [
      { funcao: "Garcom", quantidade: `${garcons}`, observacao: `1 a cada ${perfil.staff} pessoas` },
      { funcao: "Apoio de cozinha", quantidade: `${apoioCozinha}`, observacao: "preparo, reposicao e limpeza operacional" }
    ],
    servico_mesa: calcularServicoMesa(pessoas),
    custo_adulto: formatarBRL(custoPessoa),
    estimativa_total: formatarBRL(estimativaTotal),
    premissas: {
      pessoas,
      tipo: evento.tipo || "Evento",
      estilo: rotuloEstilo(estiloKey),
      duracao_horas: duracao,
      refeicao: evento.refeicao || "Nao informado",
      alcool: evento.alcool || "Nao informado",
      tema: evento.tema || "Nao informado",
      orcamento_base: evento.orcamentoBase || "Nao informado"
    }
  };
}

function aplicarMotorAoPlano(plano, motor) {
  return {
    ...plano,
    motor_logistica: motor,
    servico_mesa: motor.servico_mesa
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

function formatarBRL(valor) {
  return new Intl.NumberFormat("pt-BR", {
    style: "currency",
    currency: "BRL",
    maximumFractionDigits: 0
  }).format(valor);
}

module.exports = {
  calcularMotorEvento,
  aplicarMotorAoPlano
};
