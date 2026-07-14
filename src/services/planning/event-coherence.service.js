const catalogoContextos = require("../../../data/culinary/event-contexts.json");

const errosCatalogo = validarCatalogoContextos(catalogoContextos);
if (errosCatalogo.length) {
  throw new Error(`Catalogo de contextos invalido: ${errosCatalogo.join("; ")}`);
}

function construirContextoEvento(evento = {}) {
  const tipo = normalizar(evento.tipo);
  const tema = normalizar(evento.tema);
  const refeicao = normalizar(evento.refeicao);
  const porEscopo = escopo => catalogoContextos.contexts.find(contexto =>
    contexto.scope === escopo && contexto.match.some(termo => {
      const alvo = escopo === "type" ? tipo : escopo === "theme" ? tema : refeicao;
      return alvo.includes(normalizar(termo));
    })
  );
  const camadas = [porEscopo("type"), porEscopo("theme"), porEscopo("meal")].filter(Boolean);
  const principal = camadas[0] || null;
  const estilo = normalizarEstilo(evento.estilo);
  const restricoes = construirBlocosRestricoes(evento.restricoes);
  const orcamento = construirContextoOrcamento(evento.orcamentoBase, estilo);

  return {
    catalogo_version: catalogoContextos.version,
    tipo_informado: evento.tipo || "Evento",
    tipologia_reconhecida: principal?.id || "geral",
    camadas_aplicadas: camadas.map(camada => camada.id),
    significado_social_cultural: principal?.meaning || "Evento sem contexto cultural especifico; preservar as informacoes do cliente e explicitar as premissas adotadas.",
    significados_complementares: camadas.slice(1).map(camada => camada.meaning),
    estilo,
    nivel_sofisticacao: estilo,
    blocos_alimentares_esperados: combinar(camadas.flatMap(camada => camada.food_blocks)),
    blocos_bebidas_esperados: combinar(camadas.flatMap(camada => camada.beverage_blocks)),
    cores_coerentes: combinar(camadas.flatMap(camada => camada.colors)),
    decoracao_coerente: combinar(camadas.flatMap(camada => camada.decor)),
    sinais_premium: estilo === "premium" ? combinar(camadas.flatMap(camada => camada.premium)) : [],
    evitar: combinar(camadas.flatMap(camada => camada.avoid)),
    restricoes_alimentares: restricoes,
    orcamento
  };
}

function construirBlocosRestricoes(valor) {
  const texto = normalizar(valor);
  if (!texto || /^(nenhuma|nao informado|nao informada)$/.test(texto)) return [];

  const regras = [
    {
      id: "sem_lactose",
      match: /lactose/,
      rotulo: "Sem lactose",
      evitar: ["leite comum", "queijo comum", "manteiga", "creme de leite", "iogurte comum"],
      preferir: ["leites vegetais", "cremes vegetais", "frutas", "leite de coco", "produtos identificados sem lactose"]
    },
    {
      id: "sem_gluten",
      match: /gluten|celiac/,
      rotulo: "Planejado sem ingredientes com gluten",
      evitar: ["pao comum", "farinha de trigo", "bolo comum", "quiche comum", "biscoito comum"],
      preferir: ["tapioca", "farinha de arroz", "polvilho", "frutas", "preparacoes identificadas sem gluten"]
    },
    {
      id: "vegetariano",
      match: /vegetarian/,
      rotulo: "Vegetariano",
      evitar: ["carnes", "aves", "peixes", "presunto", "bacon", "caldo de carne"],
      preferir: ["legumes", "queijos", "ovos", "cogumelos", "graos", "pastas vegetais"]
    },
    {
      id: "vegano",
      match: /vegano/,
      rotulo: "Vegano",
      evitar: ["carnes", "leite", "ovos", "mel", "queijo", "manteiga"],
      preferir: ["legumes", "graos", "cogumelos", "leites vegetais", "tofu", "homus", "doces veganos"]
    }
  ];

  return regras
    .filter(regra => regra.match.test(texto))
    .map(({ match, ...regra }) => regra);
}

function construirContextoOrcamento(valor, estilo) {
  const texto = String(valor || "").trim();
  const informado = Boolean(texto) && !/^(nao informado|a definir)$/i.test(texto);
  return {
    status: informado ? "orientador_sem_cotacao" : "nao_informado",
    valor_informado: informado ? texto : null,
    regra: informado
      ? `Usar o envelope como limite de decisao para o estilo ${estilo}, sem inventar precos; destacar escolhas que dependem de cotacao regional.`
      : "Nao presumir faixa de preco; manter valores como A cotar ate existir catalogo regional rastreavel."
  };
}

function construirBlocosCardapio(cardapio = [], evento = {}) {
  const grupos = new Map();
  (Array.isArray(cardapio) ? cardapio : []).forEach((prato, indice) => {
    if (!prato || typeof prato !== "object") return;
    const familia = inferirFamiliaBloco(prato, evento);
    if (!grupos.has(familia.id)) {
      grupos.set(familia.id, {
        id: familia.id,
        nome: familia.nome,
        categoria: familia.categoria || prato.categoria || "Cardapio",
        descricao: familia.descricao,
        itens: [],
        nomes_itens: []
      });
    }
    const grupo = grupos.get(familia.id);
    const id = prato.id || `item-${indice + 1}`;
    grupo.itens.push(id);
    grupo.nomes_itens.push(prato.nome || "Item do cardapio");
  });

  return Array.from(grupos.values()).map(grupo => ({
    ...grupo,
    quantidade_itens: grupo.itens.length,
    resumo: `${grupo.nome} — ${grupo.nomes_itens.join(", ")}.`
  }));
}

function inferirFamiliaBloco(prato, evento) {
  const texto = normalizar([prato.nome, prato.descricao, prato.categoria].filter(Boolean).join(" "));
  const categoria = String(prato.categoria || "Cardapio");
  const tipo = normalizar(evento.tipo);
  const estilo = normalizarEstilo(evento.estilo);

  const regras = [
    [/agua de coco/, "agua_de_coco", "Agua de coco e hidratacao tropical", "Bebida"],
    [/\bagua\b|hidratacao/, "aguas_hidratacao", "Aguas e hidratacao", "Bebida"],
    [/suco|limonada/, "sucos_naturais", "Sucos naturais variados", "Bebida"],
    [/refrigerante/, "refrigerantes", "Refrigerantes variados", "Bebida"],
    [/mocktail|drink sem alcool|coquetel sem alcool/, "mocktails", "Mocktails sem alcool", "Bebida"],
    [/cafe|cappuccino|cold brew/, "cafes", estilo === "premium" ? "Estacao de cafes especiais" : "Cafes e bebidas quentes", "Bebida"],
    [/\bcha\b|infus/, "infusoes", estilo === "premium" ? "Infusoes naturais" : "Chas e infusoes", "Bebida"],
    [/vinho|espumante/, "vinhos_espumantes", "Vinhos e espumantes", "Bebida"],
    [/cerveja/, "cervejas", "Cervejas", "Bebida"],
    [/caipirinha|cachaca|gin|vodka|whisky|uisque|drink alcool|coquetel alcool/, "drinks_alcoolicos", "Drinks alcoolicos para adultos", "Bebida"],
    [/picanha|alcatra|maminha|fraldinha|patinho|carne bovina|rosbife|file mignon|contrafile/, "carnes_bovinas", estilo === "premium" ? "Carnes bovinas nobres" : "Carnes bovinas", "Prato Principal"],
    [/lombo|costelinha|pernil|linguica|carne suina|porco/, "carnes_suinas", "Carnes suinas e linguicas", "Prato Principal"],
    [/frango|sobrecoxa|coxa|asa|\baves?\b|peru|chester/, "aves", /natal/.test(tipo) ? "Aves e carnes natalinas" : "Aves", "Prato Principal"],
    [/peixe|bacalhau|salmao|tilapia|camarao|frutos do mar/, "peixes", "Peixes e frutos do mar", "Prato Principal"],
    [/fruta|salada de frutas/, "frutas", "Frutas e preparacoes frescas", categoria],
    [/brigadeiro|beijinho|cupcake|macaron|bem.casado|bombom|petit four|verrine|mini doce/, "doces", nomeBlocoDoces(tipo, estilo), "Sobremesa"],
    [/panetone|chocotone|rabanada|pave|sobremesa natalina/, "sobremesas_natalinas", "Sobremesas natalinas", "Sobremesa"],
    [/pao|croissant|brioche|torrada|sanduiche/, "paes_lanches", /brunch|corporativ|workshop/.test(tipo) ? "Paes artesanais e mini lanches" : "Paes e lanches", categoria]
  ];
  const correspondencia = regras.find(([padrao]) => padrao.test(texto));
  if (correspondencia) {
    const [, id, nome, categoriaBloco] = correspondencia;
    return { id, nome, categoria: categoriaBloco, descricao: `Bloco coerente de ${nome.toLowerCase()}.` };
  }

  const chaveCategoria = slug(categoria || "cardapio");
  return {
    id: `categoria_${chaveCategoria}`,
    nome: nomeBlocoCategoria(categoria),
    categoria,
    descricao: `Preparacoes relacionadas a categoria ${categoria || "Cardapio"}.`
  };
}

function nomeBlocoDoces(tipo, estilo) {
  if (/natal/.test(tipo)) return "Sobremesas natalinas";
  if (/infantil|anivers|debutante|15 anos/.test(tipo)) return "Doces de festa e mini sobremesas";
  if (estilo === "premium" || /casamento|corporativ|workshop/.test(tipo)) return "Doces finos e mini sobremesas";
  return "Doces e mini sobremesas";
}

function nomeBlocoCategoria(categoria) {
  const chave = normalizar(categoria);
  if (/boas.vindas|entrada/.test(chave)) return "Boas-vindas e entradas";
  if (/prato principal/.test(chave)) return "Pratos principais";
  if (/acompanhamento|salada/.test(chave)) return "Acompanhamentos e saladas";
  if (/sobremesa/.test(chave)) return "Sobremesas";
  if (/bebida/.test(chave)) return "Bebidas selecionadas";
  return categoria || "Selecao do cardapio";
}

function validarCatalogoContextos(valor) {
  const erros = [];
  const contextos = Array.isArray(valor?.contexts) ? valor.contexts : [];
  const ids = new Set();
  if (!valor?.version) erros.push("versao ausente");
  if (!contextos.length) erros.push("contextos ausentes");
  contextos.forEach(contexto => {
    if (!contexto.id || ids.has(contexto.id)) erros.push(`id ausente ou duplicado: ${contexto.id || "sem-id"}`);
    ids.add(contexto.id);
    if (!["type", "theme", "meal"].includes(contexto.scope)) erros.push(`${contexto.id}: escopo invalido`);
    ["match", "food_blocks", "beverage_blocks", "colors", "decor", "premium", "avoid"].forEach(campo => {
      if (!Array.isArray(contexto[campo]) || !contexto[campo].length) erros.push(`${contexto.id}: ${campo} ausente`);
    });
    if (!contexto.meaning) erros.push(`${contexto.id}: significado ausente`);
  });
  return erros;
}

function normalizarEstilo(valor) {
  const texto = normalizar(valor);
  if (texto.includes("premium")) return "premium";
  if (texto.includes("elegante")) return "elegante";
  return "simples";
}

function combinar(itens) {
  return Array.from(new Set((itens || []).filter(Boolean)));
}

function normalizar(valor) {
  return String(valor || "")
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase();
}

function slug(valor) {
  return normalizar(valor).replace(/[^a-z0-9]+/g, "_").replace(/^_|_$/g, "") || "geral";
}

module.exports = {
  construirContextoEvento,
  construirBlocosCardapio,
  construirBlocosRestricoes,
  construirContextoOrcamento,
  validarCatalogoContextos
};
