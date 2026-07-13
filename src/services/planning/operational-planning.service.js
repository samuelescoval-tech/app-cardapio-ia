/* ==========================================================================
   CHEF IA STUDIO | PLANEJAMENTO OPERACIONAL DETERMINISTICO
   TAG: plano-9, complexidade, equipe, producao, cronograma
   --------------------------------------------------------------------------
   Responsabilidade: transformar o contexto confirmado do evento em uma
   operacao executavel. Nenhuma disponibilidade de infraestrutura e inventada.
   ========================================================================== */

const FORMATOS = {
  "A definir pelo Chef IA": { pontos: 1, atendimento: 22, cozinha: 35, rotulo: "servico ainda a confirmar" },
  "Buffet self-service": { pontos: 1, atendimento: 45, cozinha: 40, rotulo: "buffet self-service" },
  "Buffet com equipe servindo": { pontos: 2, atendimento: 18, cozinha: 35, rotulo: "buffet assistido" },
  "Empratado": { pontos: 4, atendimento: 10, cozinha: 25, rotulo: "servico empratado" },
  "Coquetel circulante": { pontos: 3, atendimento: 14, cozinha: 30, rotulo: "coquetel circulante" },
  "Estacoes ou ilhas": { pontos: 3, atendimento: 24, cozinha: 30, rotulo: "estacoes ou ilhas" },
  "Compartilhado a mesa": { pontos: 2, atendimento: 14, cozinha: 35, rotulo: "servico compartilhado" }
};

const INFRAESTRUTURAS = {
  "Cozinha completa no local": { pontos: 0, modelo: "Producao e finalizacao no local" },
  "Cozinha de apoio limitada": { pontos: 2, modelo: "Mise en place externa e finalizacao simples no local" },
  "Sem cozinha no local": { pontos: 4, modelo: "Producao externa completa e servico sem cocao local" },
  "Producao externa com finalizacao": { pontos: 2, modelo: "Producao externa com finalizacao controlada no local" },
  "A confirmar": { pontos: 2, modelo: "Operacao provisoria condicionada a vistoria tecnica" }
};

function calcularPlanejamentoOperacional(evento = {}, contexto = {}, diretriz = {}) {
  const pessoas = numeroSeguro(contexto.pessoas || evento.pessoas) || 1;
  const duracao = numeroSeguro(contexto.duracao || evento.duracao) || 4;
  const formatoNome = FORMATOS[evento.formatoServico] ? evento.formatoServico : "A definir pelo Chef IA";
  const infraestruturaNome = INFRAESTRUTURAS[evento.infraestrutura] ? evento.infraestrutura : "A confirmar";
  const formato = FORMATOS[formatoNome];
  const infraestrutura = INFRAESTRUTURAS[infraestruturaNome];
  const complexidade = calcularComplexidade(evento, pessoas, duracao, formato, infraestrutura);
  const equipe = calcularEquipe(evento, pessoas, formato, infraestruturaNome, complexidade);
  const estacoes = calcularEstacoes(evento, pessoas, formatoNome, infraestruturaNome, equipe);
  const fluxo = calcularFluxoProducao(evento, infraestruturaNome, formatoNome);
  const momentos = Array.isArray(diretriz.momentos_servico) && diretriz.momentos_servico.length
    ? diretriz.momentos_servico
    : momentosPadrao(evento);

  return {
    status: infraestruturaNome === "A confirmar" || formatoNome === "A definir pelo Chef IA"
      ? "condicionado_a_confirmacao"
      : "dimensionado",
    complexidade,
    formato_servico: formatoNome,
    infraestrutura: infraestruturaNome,
    modelo_producao: infraestrutura.modelo,
    equipe,
    fluxo_producao: fluxo,
    estacoes,
    cronograma_operacional: calcularCronograma(evento.horarioInicio, duracao, momentos, fluxo, equipe),
    confirmacoes_pendentes: criarConfirmacoesPendentes(formatoNome, infraestruturaNome),
    criterios: [
      "Dimensionamento calculado no backend a partir dos dados informados.",
      "Quantidades devem ser confirmadas com planta, menu final e vistoria tecnica.",
      "Regras sanitarias, cadeia fria/quente e restricoes alimentares prevalecem sobre praticidade ou custo."
    ]
  };
}

function calcularComplexidade(evento, pessoas, duracao, formato, infraestrutura) {
  const fatores = [];
  let pontuacao = formato.pontos + infraestrutura.pontos;

  fatores.push(`${formato.rotulo}: +${formato.pontos}`);
  fatores.push(`${infraestrutura.modelo.toLowerCase()}: +${infraestrutura.pontos}`);

  if (pessoas > 150) adicionarFator("mais de 150 convidados", 3);
  else if (pessoas > 80) adicionarFator("mais de 80 convidados", 2);
  else if (pessoas > 40) adicionarFator("mais de 40 convidados", 1);

  if (duracao >= 6) adicionarFator("duracao igual ou superior a 6 horas", 1);
  if (/premium/i.test(evento.estilo || "")) adicionarFator("estilo premium", 2);
  else if (/elegante/i.test(evento.estilo || "")) adicionarFator("estilo elegante", 1);
  const tipo = String(evento.tipo || "");
  if (/casamento|noivado/i.test(tipo)) adicionarFator("cerimonial de casamento ou noivado", 1);
  else if (/churrasco/i.test(tipo)) adicionarFator("operacao com grelha e controle de fogo", 1);
  else if (/infantil/i.test(tipo)) adicionarFator("servico com publico infantil", 1);
  else adicionarFator("tipo de evento sem acrescimo operacional", 0);

  if (evento.horarioInicio) {
    const horaInicio = Number(evento.horarioInicio.slice(0, 2));
    adicionarFator(horaInicio < 7 || horaInicio >= 22
      ? "inicio em janela operacional estendida"
      : "horario dentro da janela operacional regular", horaInicio < 7 || horaInicio >= 22 ? 1 : 0);
  } else {
    adicionarFator("horario ainda nao informado", 0);
  }

  if (evento.faixaEtaria === "Predominantemente infantil" || evento.faixaEtaria === "Adultos e idosos") {
    adicionarFator(`cuidados de servico para ${evento.faixaEtaria.toLowerCase()}`, 1);
  } else {
    adicionarFator("publico sem acrescimo operacional especifico", 0);
  }
  if (evento.prioridade === "Apresentacao") adicionarFator("prioridade de apresentacao", 1);
  if (evento.prioridade === "Praticidade de servico" || evento.prioridade === "Economia operacional") {
    adicionarFator("prioridade reduz montagem concorrente", -1);
  }

  const pontuacaoFinal = Math.max(0, pontuacao);
  const nivel = pontuacaoFinal <= 3 ? "Baixa" : pontuacaoFinal <= 7 ? "Media" : "Alta";
  return {
    nivel,
    pontuacao: pontuacaoFinal,
    fatores,
    leitura: {
      Baixa: "Fluxo direto, poucas frentes simultaneas e reposicao simples.",
      Media: "Exige coordenacao de montagem, temperatura e reposicao entre frentes.",
      Alta: "Exige lideranca dedicada, ensaio de fluxo e controle rigoroso de tempos."
    }[nivel]
  };

  function adicionarFator(nome, pontos) {
    pontuacao += pontos;
    fatores.push(`${nome}: ${pontos > 0 ? "+" : ""}${pontos}`);
  }
}

function calcularEquipe(evento, pessoas, formato, infraestrutura, complexidade) {
  const atendimento = Math.max(1, Math.ceil(pessoas / formato.atendimento));
  const cozinha = Math.max(1, Math.ceil(pessoas / formato.cozinha));
  const equipe = [
    { funcao: "Atendimento de salao", quantidade: `${atendimento}`, observacao: `1 a cada ${formato.atendimento} pessoas para ${formato.rotulo}` },
    { funcao: "Cozinha e reposicao", quantidade: `${cozinha}`, observacao: `1 a cada ${formato.cozinha} pessoas; inclui mise en place, finalizacao e reposicao` }
  ];

  if (complexidade.nivel !== "Baixa" || pessoas > 80) {
    equipe.unshift({ funcao: "Coordenacao operacional", quantidade: "1", observacao: "lidera briefing, tempos, fornecedores e pontos criticos" });
  } else {
    equipe.unshift({ funcao: "Responsavel operacional", quantidade: "1", observacao: "acumula briefing, conferencia e fechamento no fluxo simples" });
  }
  if (evento.formatoServico === "Empratado") {
    equipe.push({ funcao: "Passe e montagem de pratos", quantidade: `${Math.max(1, Math.ceil(pessoas / 40))}`, observacao: "controla sequencia, acabamento e temperatura no passe" });
  }
  if (evento.formatoServico === "Estacoes ou ilhas") {
    equipe.push({ funcao: "Responsaveis por estacao", quantidade: `${Math.max(2, Math.ceil(pessoas / 45))}`, observacao: "ao menos um responsavel por frente ativa" });
  }
  if (/com alcool|com álcool|bar/i.test(evento.alcool || "")) {
    equipe.push({ funcao: "Bar e bebidas", quantidade: `${Math.max(1, Math.ceil(pessoas / 60))}`, observacao: "montagem, controle de gelo e reposicao de bebidas" });
  }
  if (/churrasco/i.test(evento.tipo || "")) {
    equipe.push({ funcao: "Churrasqueiro", quantidade: `${Math.max(1, Math.ceil(pessoas / 50))}`, observacao: "controle de fogo, pontos e rodadas de grelha" });
  }
  if (infraestrutura === "Sem cozinha no local") {
    equipe.push({ funcao: "Recebimento e controle termico", quantidade: "1", observacao: "confere chegada, integridade, temperatura e lotes de reposicao" });
  }

  return equipe;
}

function calcularFluxoProducao(evento, infraestrutura, formato) {
  const porInfraestrutura = {
    "Cozinha completa no local": {
      producao: "Preparo principal no local, com bases adiantadas e coccoes proximas ao servico.",
      transporte: "Transportar insumos protegidos e identificados; manter pereciveis sob controle termico.",
      finalizacao: "Finalizacao completa permitida somente apos confirmar capacidade, energia e refrigeracao."
    },
    "Cozinha de apoio limitada": {
      producao: "Concentrar cortes, molhos, bases e coccoes longas na cozinha de producao.",
      transporte: "Separar cargas frias e quentes em recipientes fechados e identificados por etapa.",
      finalizacao: "Limitar o local a aquecimento, acabamento, porcionamento e montagem simples."
    },
    "Sem cozinha no local": {
      producao: "Concluir externamente todo preparo que dependa de cocao ou equipamento fixo.",
      transporte: "Usar lotes menores em caixas termicas separadas para frio e quente, com registro de saida e chegada.",
      finalizacao: "No local, apenas desembalar, conferir, porcionar e servir; nenhuma cocao esta presumida."
    },
    "Producao externa com finalizacao": {
      producao: "Produzir externamente bases e itens de maior risco ou duracao.",
      transporte: "Expedir por familia de prato, temperatura e ordem de entrada no servico.",
      finalizacao: "Executar somente acabamentos repetiveis e previamente testados no local."
    },
    "A confirmar": {
      producao: "Adotar provisoriamente producao externa ate concluir a vistoria do local.",
      transporte: "Reservar logistica para cargas frias e quentes sem depender de equipamentos ainda nao confirmados.",
      finalizacao: "Nao programar cocao local antes de confirmar energia, agua, refrigeracao, exaustao e bancada."
    }
  }[infraestrutura];

  const montagem = {
    "Empratado": "Organizar passe unico, louca por lote e sequencia de montagem antes de liberar o salao.",
    "Coquetel circulante": "Montar bandejas por ondas curtas e manter retorno separado de louca usada.",
    "Estacoes ou ilhas": "Montar pontos independentes, cada um com estoque inicial, utensilio e responsavel.",
    "Compartilhado a mesa": "Montar travessas por mesa e rota de entrega, evitando cruzamento com retornos.",
    "Buffet com equipe servindo": "Montar linha assistida com porcionadores padronizados e acesso de reposicao traseiro.",
    "Buffet self-service": "Montar fluxo de entrada e saida, identificacao e acesso de reposicao sem cruzar convidados.",
    "A definir pelo Chef IA": "Manter layout modular e confirmar o formato antes de fechar louca, equipamentos e escala."
  }[formato];

  return [
    { etapa: "Producao", orientacao: porInfraestrutura.producao },
    { etapa: "Transporte e recebimento", orientacao: porInfraestrutura.transporte },
    { etapa: "Mise en place", orientacao: "Separar por prato e momento de servico; etiquetar quantidade, destino e restricoes." },
    { etapa: "Finalizacao local", orientacao: porInfraestrutura.finalizacao },
    { etapa: "Montagem", orientacao: montagem },
    { etapa: "Reposicao", orientacao: "Trabalhar com estoque de retaguarda e lotes menores; registrar inicio, saldo e proxima reposicao." }
  ];
}

function calcularEstacoes(evento, pessoas, formato, infraestrutura, equipe) {
  const pontosServico = formato === "Estacoes ou ilhas" ? Math.max(2, Math.ceil(pessoas / 45)) : 1;
  const estacoes = [
    {
      estacao: "Recebimento e retaguarda",
      pontos: 1,
      equipamentos: infraestrutura === "Cozinha completa no local"
        ? ["termometro culinario", "etiquetas e planilha de recebimento", "prateleiras ou bancadas separadas"]
        : ["caixas termicas para frio e quente", "termometro culinario", "etiquetas e planilha de recebimento"],
      responsavel: equipe.some(item => item.funcao === "Recebimento e controle termico") ? "Recebimento e controle termico" : "Cozinha e reposicao"
    },
    {
      estacao: rotuloEstacaoServico(formato),
      pontos: pontosServico,
      equipamentos: equipamentosServico(formato, pessoas, pontosServico),
      responsavel: formato === "Estacoes ou ilhas" ? "Responsaveis por estacao" : "Atendimento de salao"
    },
    {
      estacao: "Bebidas e hidratacao",
      pontos: Math.max(1, Math.ceil(pessoas / 80)),
      equipamentos: ["jarras ou dispensadores", "cubas ou caixas para gelo", "abridores e bandejas antiderrapantes"],
      responsavel: equipe.some(item => item.funcao === "Bar e bebidas") ? "Bar e bebidas" : "Atendimento de salao"
    }
  ];

  if (/churrasco/i.test(evento.tipo || "")) {
    estacoes.push({
      estacao: "Grelha e descanso de carnes",
      pontos: Math.max(1, Math.ceil(pessoas / 60)),
      equipamentos: ["grelha confirmada", "pegadores separados", "tabuas de corte", "termometro culinario", "area protegida para descanso"],
      responsavel: "Churrasqueiro"
    });
  }

  return estacoes;
}

function equipamentosServico(formato, pessoas, pontos) {
  const lotes = Math.max(2, Math.ceil(pessoas / 25));
  const mapa = {
    "Buffet self-service": [`${pontos} linha(s) de buffet`, `${lotes} recipientes de exposicao por rodada`, "utensilios de servir identificados", "protecao e identificacao dos pratos"],
    "Buffet com equipe servindo": [`${pontos} linha(s) assistida(s)`, `${lotes} recipientes de exposicao por rodada`, "porcionadores padronizados", "bancada de reposicao"],
    "Empratado": ["bancada de passe", `${Math.max(2, Math.ceil(pessoas / 40))} lotes de louca organizados`, "lampadas ou manutencao termica confirmada", "bandejas de saida"],
    "Coquetel circulante": [`${Math.max(3, Math.ceil(pessoas / 15))} bandejas antiderrapantes`, "prateleira de bandejas prontas", "ponto separado para retorno de louca"],
    "Estacoes ou ilhas": [`${pontos} bancadas ou ilhas`, "um jogo de utensilios por ponto", "identificacao de pratos e restricoes", "estoque de retaguarda por estacao"],
    "Compartilhado a mesa": [`${Math.max(2, Math.ceil(pessoas / 8))} travessas por rodada`, "utensilios de servir por mesa", "carros ou bandejas de distribuicao"],
    "A definir pelo Chef IA": ["bancadas modulares", "utensilios de servico reservados", "equipamentos finais condicionados a confirmacao do formato"]
  };
  return mapa[formato];
}

function calcularCronograma(horarioInicio, duracao, momentos, fluxo, equipe) {
  const lideranca = equipe.some(item => item.funcao === "Coordenacao operacional")
    ? "Coordenacao operacional"
    : "Responsavel operacional";
  const responsavelBebidas = equipe.some(item => item.funcao === "Bar e bebidas")
    ? "Bar e bebidas"
    : "Atendimento de salao";
  const etapas = [
    { deslocamento: -24 * 60, atividade: "Mise en place principal", descricao: fluxo[0].orientacao, responsavel: "Cozinha e reposicao" },
    { deslocamento: -4 * 60, atividade: "Expedicao e transporte", descricao: fluxo[1].orientacao, responsavel: "Cozinha e reposicao" },
    { deslocamento: -2 * 60, atividade: "Recebimento e montagem", descricao: fluxo[3].orientacao, responsavel: lideranca },
    { deslocamento: -45, atividade: "Briefing e liberacao das estacoes", descricao: "Conferir equipe, restricoes, temperaturas, estoque inicial e rota de reposicao.", responsavel: lideranca }
  ];
  const duracaoMinutos = duracao * 60;
  const limiteMomentos = Math.max(1, momentos.length - 1);
  momentos.forEach((momento, indice) => {
    const deslocamento = indice === 0 ? 0 : Math.round((duracaoMinutos - 30) * (indice / limiteMomentos));
    etapas.push({
      deslocamento,
      atividade: capitalizar(momento),
      descricao: indice === 0 ? "Abrir o servico com estoque inicial conferido." : "Liberar o lote previsto e repor sem cruzar o fluxo dos convidados.",
      responsavel: /bebida|hidratacao|cafe/i.test(momento) ? responsavelBebidas : "Atendimento de salao e cozinha"
    });
  });
  etapas.push({
    deslocamento: duracaoMinutos + 30,
    atividade: "Fechamento operacional",
    descricao: "Recolher, conferir sobras, separar descarte, registrar ocorrencias e liberar o local.",
    responsavel: lideranca
  });

  return etapas.map(item => ({
    hora: horarioInicio ? formatarHorarioRelativo(horarioInicio, item.deslocamento) : formatarDeslocamento(item.deslocamento),
    atividade: item.atividade,
    descricao: item.descricao,
    responsavel: item.responsavel
  }));
}

function formatarHorarioRelativo(horarioInicio, deslocamento) {
  const [hora, minuto] = horarioInicio.split(":").map(Number);
  const totalInicio = hora * 60 + minuto;
  const total = totalInicio + deslocamento;
  const dia = Math.floor(total / (24 * 60));
  const minutoDia = ((total % (24 * 60)) + 24 * 60) % (24 * 60);
  const horario = `${String(Math.floor(minutoDia / 60)).padStart(2, "0")}:${String(minutoDia % 60).padStart(2, "0")}`;
  if (dia < 0) return `Dia anterior · ${horario}`;
  if (dia > 0) return `Dia seguinte · ${horario}`;
  return horario;
}

function formatarDeslocamento(minutos) {
  if (minutos === 0) return "Inicio";
  const prefixo = minutos < 0 ? "T-" : "T+";
  const absoluto = Math.abs(minutos);
  if (absoluto % 60 === 0) return `${prefixo}${absoluto / 60}h`;
  return `${prefixo}${absoluto}min`;
}

function criarConfirmacoesPendentes(formato, infraestrutura) {
  const pendencias = [];
  if (formato === "A definir pelo Chef IA") pendencias.push("Confirmar formato de servico antes de fechar equipe, louca e layout.");
  if (infraestrutura === "A confirmar") pendencias.push("Vistoriar energia, agua, refrigeracao, exaustao, bancadas e acesso de carga.");
  return pendencias;
}

function momentosPadrao(evento) {
  if (/corporativo|coffee/i.test(`${evento.tipo || ""} ${evento.refeicao || ""}`)) return ["recepcao", "intervalo principal", "reposicao de bebidas", "encerramento"];
  if (/infantil/i.test(evento.tipo || "")) return ["recepcao e lanches", "servico principal", "parabens, bolo e doces", "encerramento"];
  return ["recepcao", "entrada", "servico principal", "sobremesa", "encerramento"];
}

function rotuloEstacaoServico(formato) {
  return {
    "Empratado": "Passe e montagem de pratos",
    "Coquetel circulante": "Montagem e saida de bandejas",
    "Estacoes ou ilhas": "Estacoes de servico",
    "Compartilhado a mesa": "Montagem de travessas e distribuicao",
    "Buffet com equipe servindo": "Buffet assistido",
    "Buffet self-service": "Buffet self-service",
    "A definir pelo Chef IA": "Servico modular provisório"
  }[formato];
}

function capitalizar(texto) {
  const valor = String(texto || "Momento de servico");
  return valor.charAt(0).toUpperCase() + valor.slice(1);
}

function numeroSeguro(valor) {
  const numero = Number.parseInt(String(valor || "").replace(/\D/g, ""), 10);
  return Number.isFinite(numero) ? numero : 0;
}

module.exports = { calcularPlanejamentoOperacional };
