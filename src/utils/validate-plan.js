const CAMPOS_ARRAY_TEXTO = [
  "layout",
  "equipe_obs",
  "entretenimento",
  "lembrancinhas"
];

const CAMPOS_OBRIGATORIOS = [
  "cardapio",
  "receitas",
  "lista_compras",
  "cronograma",
  "decoracao",
  "checklist",
  "resumo_chef"
];

function validarPlano(data, contexto = {}) {
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
  const resumo = normalizarResumoChef(data.resumo_chef, contexto.evento);
  plano.resumo_chef = resumo.texto;

  plano.qualidade_culinaria = validarCoerenciaCulinaria(plano, contexto.diretrizCulinaria);
  if (resumo.ajuste) {
    registrarAjuste(plano.qualidade_culinaria, resumo.ajuste);
  }
  validarRequisitosDoEvento(plano, contexto.evento, plano.qualidade_culinaria);

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
    qualidade_culinaria: {
      status: "falha",
      ajustes: [],
      avisos: [mensagem || "A IA não retornou um plano válido desta vez."],
      cobertura: {
        ingredientes_total: 0,
        ingredientes_cobertos: 0,
        compras_derivadas: 0,
        pratos_com_preparo: 0,
        receitas_cobertas: 0,
        receitas_completas: 0
      }
    },
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
  const categoria = textoSeguro(valor.categoria, "");
  return {
    id: textoSeguro(valor.id, ""),
    nome: textoSeguro(valor.nome, ""),
    categoria,
    tipo_execucao: normalizarTipoExecucao(valor.tipo_execucao, categoria),
    descricao: textoSeguro(valor.descricao, ""),
    emoji: textoSeguro(valor.emoji, ""),
    quantidade: textoSeguro(valor.quantidade, ""),
    ingredientes: normalizarObjetos(valor.ingredientes, normalizarIngrediente)
  };
}

function normalizarReceita(valor) {
  if (!ehObjeto(valor)) return null;
  const preparoPassos = normalizarArrayTexto(valor.preparo_passos);
  const preparoLegado = textoSeguro(valor.preparo, "");
  return {
    cardapio_id: textoSeguro(valor.cardapio_id, ""),
    nome: textoSeguro(valor.nome, ""),
    ingredientes: normalizarObjetos(valor.ingredientes, normalizarIngrediente),
    preparo_passos: preparoPassos.length ? preparoPassos : preparoLegado ? [preparoLegado] : [],
    preparo: preparoLegado || preparoPassos.join(" "),
    tempo: textoSeguro(valor.tempo, ""),
    rendimento: textoSeguro(valor.rendimento, ""),
    quantidade_total: textoSeguro(valor.quantidade_total, "")
  };
}

function normalizarTipoExecucao(valor, categoria) {
  const tipo = textoSeguro(valor, "").toLowerCase();
  if (["preparo", "montagem", "pronto"].includes(tipo)) return tipo;
  return /^bebida$/i.test(categoria) ? "pronto" : "preparo";
}

function normalizarCompra(valor) {
  if (!ehObjeto(valor)) return null;
  return {
    item: textoSeguro(valor.item, ""),
    quantidade: textoSeguro(valor.quantidade, ""),
    setor: textoSeguro(valor.setor, "Outros"),
    natureza: textoSeguro(valor.natureza, "ingrediente"),
    origens: normalizarArrayTexto(valor.origens),
    prioridade: textoSeguro(valor.prioridade, "media")
  };
}

function normalizarIngrediente(valor) {
  if (!ehObjeto(valor)) return null;
  return {
    item: textoSeguro(valor.item, ""),
    quantidade: textoSeguro(valor.quantidade, ""),
    unidade: textoSeguro(valor.unidade, "")
  };
}

function validarCoerenciaCulinaria(plano, diretrizCulinaria) {
  if (!plano.cardapio.length) {
    throw new Error("Plano sem itens de cardapio.");
  }

  const relatorio = {
    status: "aprovado",
    ajustes: [],
    avisos: [],
    cobertura: {
      ingredientes_total: 0,
      ingredientes_cobertos: 0,
      compras_derivadas: 0,
      pratos_com_preparo: 0,
      receitas_cobertas: 0,
      receitas_completas: 0
    }
  };
  const ids = new Set();
  const receitasInformadasPorPrato = new Map(
    plano.receitas
      .filter(receita => receita.cardapio_id)
      .map(receita => [receita.cardapio_id, receita])
  );
  plano.cardapio.forEach((prato, indice) => {
    const rotulo = prato.nome || `item ${indice + 1}`;
    if (/^bebida$/i.test(prato.categoria) && quantidadeSomenteNumerica(prato.quantidade)) {
      prato.quantidade = `${prato.quantidade} L`;
      registrarAjuste(relatorio, `Unidade em litros recuperada no cardapio: ${rotulo}.`);
    }
    if (!prato.id || ids.has(prato.id)) {
      throw new Error(`Cardapio com id ausente ou duplicado: ${rotulo}.`);
    }
    ids.add(prato.id);

    if (!prato.nome || !prato.categoria) {
      throw new Error(`Cardapio sem nome ou categoria: ${rotulo}.`);
    }
    if (!prato.quantidade) {
      registrarAviso(relatorio, `Quantidade final ausente no prato ${rotulo}.`);
    }
    const prontoSemIngredientes = prato.tipo_execucao === "pronto" && /^bebida$/i.test(prato.categoria);
    if (!prato.ingredientes.length && !prontoSemIngredientes) {
      const receitaInformada = receitasInformadasPorPrato.get(prato.id);
      if (receitaInformada?.ingredientes?.length) {
        prato.ingredientes = receitaInformada.ingredientes.map(ingrediente => ({ ...ingrediente }));
        registrarAjuste(relatorio, `Ingredientes do prato recuperados da receita: ${rotulo}.`);
      } else {
        registrarAviso(relatorio, `Ingredientes ausentes no prato ${rotulo}.`);
      }
    }
    if (prato.tipo_execucao !== "pronto") {
      relatorio.cobertura.pratos_com_preparo += 1;
    } else if (!/^bebida$/i.test(prato.categoria) && prato.ingredientes.length > 1) {
      registrarAviso(relatorio, `Revisar classificacao como pronto: ${rotulo}.`);
    }

    prato.ingredientes.forEach(ingrediente => {
      if (!ingrediente.item || !ingrediente.quantidade || !ingrediente.unidade) {
        registrarAviso(relatorio, `Ingrediente incompleto no prato ${rotulo}: ${ingrediente.item || "sem nome"}.`);
      } else if (quantidadeEhVaga(ingrediente.quantidade)) {
        registrarAviso(relatorio, `Ingrediente sem quantidade verificavel no prato ${rotulo}: ${ingrediente.item}.`);
      }
    });
  });

  const pratosPorId = new Map(plano.cardapio.map(prato => [prato.id, prato]));
  const receitasPorPrato = new Map();
  plano.receitas = plano.receitas.filter(receita => {
    if (!receita.cardapio_id || !ids.has(receita.cardapio_id)) {
      registrarAviso(relatorio, `Receita sem prato valido foi separada para revisao: ${receita.nome || "sem nome"}.`);
      return false;
    }
    const prato = pratosPorId.get(receita.cardapio_id);
    if (!receita.nome) {
      receita.nome = prato.nome;
      registrarAjuste(relatorio, `Nome da receita recuperado: ${prato.nome}.`);
    }
    if (!receita.ingredientes.length && prato.ingredientes.length) {
      receita.ingredientes = prato.ingredientes.map(ingrediente => ({ ...ingrediente }));
      registrarAjuste(relatorio, `Ingredientes da receita recuperados do prato: ${prato.nome}.`);
    }
    if (!receita.quantidade_total && prato.quantidade) {
      receita.quantidade_total = prato.quantidade;
      registrarAjuste(relatorio, `Quantidade total da receita recuperada: ${prato.nome}.`);
    }
    if (!receita.preparo_passos.length || !receita.tempo || !receita.rendimento) {
      registrarAviso(relatorio, `Receita incompleta para ${receita.cardapio_id}.`);
    } else {
      relatorio.cobertura.receitas_completas += 1;
    }
    receitasPorPrato.set(receita.cardapio_id, receita);
    return true;
  });

  plano.cardapio.forEach(prato => {
    if (prato.tipo_execucao === "pronto") return;
    if (receitasPorPrato.has(prato.id)) {
      relatorio.cobertura.receitas_cobertas += 1;
    } else {
      registrarAviso(relatorio, `Receita ausente para ${prato.nome}.`);
    }
  });

  const compras = new Map();
  plano.lista_compras.forEach(compra => {
    const chave = chaveCulinaria(compra.item);
    if (!chave) {
      registrarAviso(relatorio, "Compra sem nome foi separada para revisao.");
      return;
    }
    if (compras.has(chave)) {
      const existente = compras.get(chave);
      existente.origens = unirOrigens(existente.origens, compra.origens);
      if (quantidadeEhVaga(existente.quantidade) && !quantidadeEhVaga(compra.quantidade)) {
        existente.quantidade = compra.quantidade;
      }
      registrarAjuste(relatorio, `Compra duplicada consolidada: ${compra.item}.`);
      return;
    }

    compra.origens = compra.origens.filter(origem => origem === "operacao" || ids.has(origem));
    if (!["ingrediente", "bebida", "operacional"].includes(compra.natureza.toLowerCase())) {
      compra.natureza = "ingrediente";
      registrarAjuste(relatorio, `Natureza de compra normalizada: ${compra.item}.`);
    }
    if ((/^bebida$/i.test(compra.natureza) || /^bebidas$/i.test(compra.setor)) && quantidadeSomenteNumerica(compra.quantidade)) {
      compra.quantidade = `${compra.quantidade} L`;
      registrarAjuste(relatorio, `Unidade em litros recuperada na compra: ${compra.item}.`);
    }
    if (!compra.origens.length && compra.natureza.toLowerCase() === "operacional") {
      compra.origens = ["operacao"];
      registrarAjuste(relatorio, `Origem operacional adicionada: ${compra.item}.`);
    }
    compras.set(chave, compra);
  });

  plano.cardapio.forEach(prato => {
    prato.ingredientes.forEach(ingrediente => {
      if (!ingrediente.item) return;
      relatorio.cobertura.ingredientes_total += 1;
      const chave = chaveCulinaria(ingrediente.item);
      let compra = compras.get(chave);

      if (!compra) {
        compra = criarCompraDerivada(ingrediente, prato);
        compras.set(chave, compra);
        relatorio.cobertura.compras_derivadas += 1;
        registrarAjuste(relatorio, `Compra derivada do cardapio: ${ingrediente.item}.`);
      } else {
        if (!compra.origens.includes(prato.id)) {
          compra.origens.push(prato.id);
          registrarAjuste(relatorio, `Origem adicionada em ${compra.item}: ${prato.id}.`);
        }
        if (compra.derivada_do_cardapio) {
          compra.quantidade = somarQuantidadeDerivada(compra.quantidade, ingrediente);
        } else if ((!compra.quantidade || quantidadeEhVaga(compra.quantidade)) && ingrediente.quantidade) {
          compra.quantidade = formatarQuantidadeIngrediente(ingrediente);
          registrarAjuste(relatorio, `Quantidade recuperada do cardapio: ${compra.item}.`);
        }
      }
      relatorio.cobertura.ingredientes_cobertos += 1;
    });
  });
  plano.lista_compras = Array.from(compras.values());
  plano.lista_compras.forEach(compra => {
    if (!compra.quantidade || quantidadeEhVaga(compra.quantidade)) {
      registrarAviso(relatorio, `Compra sem quantidade verificavel: ${compra.item}.`);
    }
  });

  if (diretrizCulinaria) {
    const totalMinimo = Number(diretrizCulinaria.quantidade_total_minima) || 0;
    if (plano.cardapio.length < totalMinimo) {
      registrarAviso(relatorio, `Cardapio abaixo da composicao minima: ${plano.cardapio.length}/${totalMinimo} itens.`);
    }

    const faltas = (diretrizCulinaria.composicao_minima || []).flatMap(regra => {
      const atual = plano.cardapio.filter(prato => chaveCulinaria(prato.categoria) === chaveCulinaria(regra.category)).length;
      return atual < regra.minimum ? [`${regra.category} ${atual}/${regra.minimum}`] : [];
    });
    if (faltas.length) {
      registrarAviso(relatorio, `Cardapio sem cobertura de categorias: ${faltas.join(", ")}.`);
    }

    const textoCardapio = ` ${normalizarTermosBusca(plano.cardapio.flatMap(prato => [
      prato.nome,
      prato.descricao,
      ...prato.ingredientes.map(ingrediente => ingrediente.item)
    ]).filter(Boolean).join(" "))} `;
    (diretrizCulinaria.pedidos_culinarios_explicitos || []).forEach(pedido => {
      const termos = [pedido.item, ...(pedido.termos || [])].map(normalizarTermosBusca).filter(Boolean);
      if (!termos.some(termo => textoCardapio.includes(` ${termo} `))) {
        registrarAviso(relatorio, `Pedido culinario explicito ausente: ${pedido.item}.`);
      }
    });
  }

  validarCompletudeEvento(plano, relatorio);

  return relatorio;
}

function validarCompletudeEvento(plano, relatorio) {
  const secoes = [
    ["utensilios", plano.utensilios, 1],
    ["local", plano.local, 4],
    ["layout", plano.layout, 2],
    ["cronograma", plano.cronograma, 4],
    ["equipe_obs", plano.equipe_obs, 3],
    ["entretenimento", plano.entretenimento, 3],
    ["lembrancinhas", plano.lembrancinhas, 3]
  ];
  secoes.forEach(([nome, conteudo, minimo]) => {
    const quantidade = Array.isArray(conteudo) ? conteudo.length : 0;
    if (quantidade < minimo) {
      registrarAviso(relatorio, `Secao do evento abaixo do minimo: ${nome} ${quantidade}/${minimo}.`);
    }
  });
  const temas = plano.decoracao?.temas?.length || 0;
  const itensDecoracao = plano.decoracao?.itens?.length || 0;
  if (temas < 2 || itensDecoracao < 4 || !plano.decoracao?.iluminacao) {
    registrarAviso(relatorio, `Decoracao abaixo do minimo: ${temas}/2 temas e ${itensDecoracao}/4 itens.`);
  }
  const pre = plano.checklist?.pre?.length || 0;
  const durante = plano.checklist?.durante?.length || 0;
  const pos = plano.checklist?.pos?.length || 0;
  if (pre < 4 || durante < 3 || pos < 2) {
    registrarAviso(relatorio, `Checklist abaixo do minimo: pre ${pre}/4, durante ${durante}/3, pos ${pos}/2.`);
  }
}

function chaveCulinaria(valor) {
  return String(valor || "")
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, " ")
    .split(" ")
    .map(palavra => palavra.length > 3 && palavra.endsWith("s") ? palavra.slice(0, -1) : palavra)
    .join(" ")
    .trim();
}

function quantidadeEhVaga(valor) {
  return /a gosto|a definir|a cotar|conforme (necessario|necessaria)|quanto baste|suficiente/i.test(String(valor || ""));
}

function quantidadeSomenteNumerica(valor) {
  return /^\s*\d+(?:[.,]\d+)?\s*$/.test(String(valor || ""));
}

function criarCompraDerivada(ingrediente, prato) {
  return {
    item: ingrediente.item,
    quantidade: formatarQuantidadeIngrediente(ingrediente),
    setor: inferirSetor(ingrediente.item),
    natureza: /^bebida$/i.test(prato.categoria) ? "bebida" : "ingrediente",
    origens: [prato.id],
    prioridade: "media",
    derivada_do_cardapio: true
  };
}

function formatarQuantidadeIngrediente(ingrediente) {
  const quantidade = textoSeguro(ingrediente.quantidade, "Revisar");
  const unidade = textoSeguro(ingrediente.unidade, "");
  if (!unidade || chaveCulinaria(quantidade).endsWith(chaveCulinaria(unidade))) return quantidade;
  return `${quantidade} ${unidade}`;
}

function somarQuantidadeDerivada(atual, ingrediente) {
  const unidade = textoSeguro(ingrediente.unidade, "");
  const numeroAtual = extrairNumero(atual);
  const numeroNovo = extrairNumero(ingrediente.quantidade);
  if (!unidade || numeroAtual === null || numeroNovo === null || !chaveCulinaria(atual).endsWith(chaveCulinaria(unidade))) {
    return atual;
  }
  const total = Math.round((numeroAtual + numeroNovo) * 100) / 100;
  return `${String(total).replace(".", ",")} ${unidade}`;
}

function extrairNumero(valor) {
  const correspondencia = String(valor || "").match(/\d+(?:[.,]\d+)?/);
  if (!correspondencia) return null;
  const numero = Number(correspondencia[0].replace(",", "."));
  return Number.isFinite(numero) ? numero : null;
}

function inferirSetor(item) {
  const chave = chaveCulinaria(item);
  if (/agua|suco|refrigerante|cerveja|vinho|espumante/.test(chave)) return "Bebidas";
  if (/carne|frango|peixe|salmao|tilapia|linguica|bacon/.test(chave)) return "Acougue";
  if (/leite|queijo|manteiga|creme|iogurte|requeijao/.test(chave)) return "Frios";
  if (/pao|brioche|torrada|massa folhada/.test(chave)) return "Padaria";
  if (/tomate|cebola|alho|batata|fruta|folha|alface|rucula|legume|limao|morango|amora|erva|coentro|manjericao/.test(chave)) return "Hortifruti";
  return "Mercearia";
}

function unirOrigens(primeiras, segundas) {
  return Array.from(new Set([...(primeiras || []), ...(segundas || [])]));
}

function registrarAjuste(relatorio, mensagem) {
  relatorio.ajustes.push(mensagem);
  if (relatorio.status === "aprovado") relatorio.status = "ajustado";
}

function registrarAviso(relatorio, mensagem) {
  relatorio.avisos.push(mensagem);
  relatorio.status = "revisar";
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

function normalizarResumoChef(valor, evento) {
  const original = textoSeguro(valor, "Resumo indisponível.");
  if (!ehObjeto(evento)) return { texto: original, ajuste: null };

  const resumoNormalizado = normalizarTextoBusca(original);
  const restricoes = textoSeguro(evento.restricoes, "Nenhuma");
  const restricoesNormalizadas = normalizarTextoBusca(restricoes);
  const possuiRestricao = restricoesNormalizadas && !/^(nenhuma|nao informado|nao informada)$/.test(restricoesNormalizadas);
  const promessaAbsoluta = temPromessaAlimentarAbsoluta(resumoNormalizado);
  const restricaoInventada = [
    /gluten|celiac/,
    /lactose/,
    /amendoim/
  ].some(padrao => padrao.test(resumoNormalizado) && !padrao.test(restricoesNormalizadas));

  if (promessaAbsoluta || restricaoInventada) {
    return {
      texto: construirResumoSeguro(evento, restricoes),
      ajuste: "Resumo do Chef substituido por versao segura devido a promessa absoluta ou restricao nao informada."
    };
  }

  if (possuiRestricao && !/contaminacao cruzada|conferencia profissional/.test(resumoNormalizado)) {
    return {
      texto: `${original} Restrições alimentares exigem conferência profissional de ingredientes, rótulos, preparo e risco de contaminação cruzada.`,
      ajuste: "Aviso de seguranca alimentar adicionado ao Resumo do Chef."
    };
  }

  return { texto: original, ajuste: null };
}

function temPromessaAlimentarAbsoluta(texto) {
  return String(texto || "")
    .split(/[.!?]+/)
    .some(frase => /atende rigorosamente|cumpre rigorosamente|garant|assegur/.test(frase)
      && /restri|alergen|gluten|lactose|celiac|contamin/.test(frase));
}

function validarRequisitosDoEvento(plano, evento, relatorio) {
  if (!ehObjeto(evento)) return;

  const restricoes = normalizarTextoBusca(evento.restricoes);
  const refeicao = normalizarTextoBusca(evento.refeicao);
  const alcool = normalizarTextoBusca(evento.alcool);
  const estilo = normalizarTextoBusca(evento.estilo);
  const itens = plano.cardapio.map(item => ({
    categoria: normalizarTextoBusca(item.categoria),
    texto: normalizarTextoBusca([item.nome, item.descricao].filter(Boolean).join(" "))
  }));

  validarContratoPremium(itens, estilo, relatorio);
  validarCoberturaDeRestricoes(itens, restricoes, estilo, relatorio);
  validarExperienciaPremium(plano, evento, estilo, relatorio);

  const exigePrincipalVegetariano = /vegetar|vegano/.test(restricoes) && /almoco|jantar/.test(refeicao);
  const possuiPrincipalVegetariano = itens.some(item => /prato principal/.test(item.categoria) && /vegetar|vegano|\bveg\b/.test(item.texto));
  if (exigePrincipalVegetariano && !possuiPrincipalVegetariano) {
    registrarAviso(relatorio, "Restricao vegetariana ou vegana sem opcao identificada em Prato Principal.");
  }

  const bebidas = itens.filter(item => /bebida/.test(item.categoria));
  const alcoolicas = bebidas.filter(item => ehBebidaAlcoolica(item.texto));
  const naoAlcoolicas = bebidas.filter(item => !ehBebidaAlcoolica(item.texto));
  if (/bar completo/.test(alcool) && alcoolicas.length < 2) {
    registrarAviso(relatorio, `Bar completo abaixo do minimo de bebidas alcoolicas: ${alcoolicas.length}/2.`);
  } else if (!/sem alcool|nao alcool/.test(alcool) && /alcool|bar/.test(alcool) && !alcoolicas.length) {
    registrarAviso(relatorio, "Evento com alcool sem bebida alcoolica identificada no cardapio.");
  }

  if (/bar completo/.test(alcool) && naoAlcoolicas.length < 2) {
    registrarAviso(relatorio, `Bar completo abaixo do minimo de bebidas nao alcoolicas: ${naoAlcoolicas.length}/2.`);
  }
}

function validarContratoPremium(itens, estilo, relatorio) {
  if (!/premium/.test(estilo)) return;

  const criteriosComuns = [
    [/(cha.{0,20}sache|sache.{0,20}cha)/, "cha em sache"],
    [/bolo simples/, "bolo simples"],
    [/biscoito comum/, "biscoito comum"],
    [/cafe soluvel/, "cafe soluvel"],
    [/suco em po/, "suco em po"]
  ];
  const encontrados = criteriosComuns
    .filter(([padrao]) => itens.some(item => padrao.test(item.texto)))
    .map(([, rotulo]) => rotulo);

  if (encontrados.length) {
    registrarAviso(relatorio, `Contrato Premium violado por item comum: ${encontrados.join(", ")}.`);
  }
}

function validarCoberturaDeRestricoes(itens, restricoes, estilo, relatorio) {
  if (!restricoes || /^(nenhuma|nao informado|nao informada)$/.test(restricoes)) return;

  const minimo = /premium/.test(estilo) ? 2 : 1;
  const regras = [
    { solicitada: /vegetar|vegano/.test(restricoes), padrao: /vegetar|vegano|\bveg\b/, rotulo: "vegetariana ou vegana" },
    { solicitada: /lactose/.test(restricoes), padrao: /sem lactose|zero lactose/, rotulo: "sem lactose" },
    { solicitada: /gluten|celiac/.test(restricoes), padrao: /sem gluten|gluten free/, rotulo: "planejada sem ingredientes com gluten" }
  ];

  regras.filter(regra => regra.solicitada).forEach(regra => {
    const cobertura = itens.filter(item => regra.padrao.test(item.texto)).length;
    if (cobertura < minimo) {
      registrarAviso(relatorio, `Restricao ${regra.rotulo} com cobertura identificada insuficiente: ${cobertura}/${minimo} itens.`);
    }
  });

  if (itens.some(item => /sob demanda/.test(item.texto) && /vegetar|vegano|lactose|gluten|celiac/.test(item.texto))) {
    registrarAviso(relatorio, "Restricao alimentar apresentada somente sob demanda; planejar alternativa identificada e integrada ao servico.");
  }
}

function validarExperienciaPremium(plano, evento, estilo, relatorio) {
  if (!/premium/.test(estilo)) return;

  const textoExperiencia = normalizarTextoBusca([
    ...normalizarArrayTexto(plano.layout),
    ...normalizarArrayTexto(plano.equipe_obs),
    ...normalizarArrayTexto(plano.entretenimento),
    ...normalizarArrayTexto(plano.decoracao?.temas),
    ...normalizarArrayTexto(plano.decoracao?.itens),
    plano.decoracao?.iluminacao || "",
    ...(Array.isArray(plano.cronograma) ? plano.cronograma : []).flatMap(item => [item.hora, item.atividade, item.descricao]),
    ...normalizarArrayTexto(plano.checklist?.pre),
    ...normalizarArrayTexto(plano.checklist?.durante)
  ].join(" "));
  const criterios = [
    { padrao: /sinaliz|identidade visual|branding|placa|menu identificad/, rotulo: "sinalizacao ou identidade visual" },
    { padrao: /louca|porcelana|vidro|talher|guardanapo de tecido/, rotulo: "louca ou acabamento de servico" },
    { padrao: /estacao de cafe|estacao de bebidas|coffee station|ilha de bebidas|infus/, rotulo: "estacao de bebidas especiais" }
  ];
  if (/corporativ|empresa|workshop|networking|congresso|seminario|treinamento/.test(normalizarTextoBusca(evento.tipo))) {
    criterios.push({ padrao: /networking|circulacao|interacao|conversa/, rotulo: "circulacao para networking" });
  }
  const ausentes = criterios.filter(criterio => !criterio.padrao.test(textoExperiencia)).map(criterio => criterio.rotulo);

  if (ausentes.length) {
    registrarAviso(relatorio, `Experiencia Premium sem evidencia de: ${ausentes.join(", ")}.`);
  }
}

function ehBebidaAlcoolica(texto) {
  const normalizado = normalizarTextoBusca(texto);
  if (/sem alcool|nao alcool/.test(normalizado)) return false;
  return /cerveja|vinho|espumante|caipirinha|cachaca|gin|vodka|whisky|uisque|drink alcool|coquetel alcool/.test(normalizado);
}

function normalizarTextoBusca(valor) {
  return String(valor || "")
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase();
}

function normalizarTermosBusca(valor) {
  return normalizarTextoBusca(valor).replace(/[^a-z0-9]+/g, " ").trim();
}

function construirResumoSeguro(evento, restricoes) {
  const tipo = textoSeguro(evento.tipo, "evento");
  const pessoas = Number(evento.pessoas);
  const publico = Number.isFinite(pessoas) && pessoas > 0 ? ` para ${pessoas} convidados` : "";
  const refeicao = textoSeguro(evento.refeicao, "");
  const formato = textoSeguro(evento.formatoServico, "");
  const contexto = [refeicao, formato].filter(Boolean).join(" e ");
  const fraseContexto = contexto ? `, considerando ${contexto}` : "";

  return `Planejamento para ${tipo}${publico}${fraseContexto}. `
    + `As restrições registradas para revisão são: ${restricoes}. `
    + "Cardápio, receitas e compras devem ser conferidos antes da execução. "
    + "Restrições alimentares exigem conferência profissional de ingredientes, rótulos, preparo e risco de contaminação cruzada.";
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
