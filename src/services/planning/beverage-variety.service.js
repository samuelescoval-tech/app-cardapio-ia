function calcularMinimoVariedadeBebidas(pessoas) {
  const convidados = numeroPositivo(pessoas);
  if (!convidados) return 0;
  if (convidados <= 100) return Math.max(3, Math.ceil(convidados / 10));
  return 10 + Math.ceil((convidados - 100) / 50);
}

function garantirVariedadeBebidas(plano, evento = {}) {
  if (!plano || !Array.isArray(plano.cardapio) || !Array.isArray(plano.lista_compras)) return [];
  const minimoRegra = calcularMinimoVariedadeBebidas(evento.pessoas);
  if (!minimoRegra) return [];

  const alcool = normalizar(evento.alcool);
  const semAlcool = /sem alcool|nao alcool/.test(alcool);
  const ajustes = [];
  if (semAlcool) removerBebidasAlcoolicas(plano, ajustes);
  const barCompleto = /bar completo/.test(alcool);
  const comAlcool = !semAlcool && /alcool|bar/.test(alcool);
  const minimoTotal = barCompleto ? Math.max(4, minimoRegra) : minimoRegra;
  const minimoAlcoolicas = barCompleto
    ? Math.max(2, Math.floor(minimoTotal / 2))
    : comAlcool ? (minimoTotal >= 5 ? 2 : 1) : 0;
  const minimoNaoAlcoolicas = minimoTotal - minimoAlcoolicas;
  const bebidas = plano.cardapio.filter(item => normalizar(item.categoria) === "bebida");
  const alcoolicas = bebidas.filter(ehBebidaAlcoolica);
  const naoAlcoolicas = bebidas.filter(item => !ehBebidaAlcoolica(item));
  completarGrupo(plano, naoAlcoolicas, minimoNaoAlcoolicas, CATALOGO_NAO_ALCOOLICO, ajustes);
  completarGrupo(plano, alcoolicas, minimoAlcoolicas, CATALOGO_ALCOOLICO, ajustes);

  const totalAtual = plano.cardapio.filter(item => normalizar(item.categoria) === "bebida").length;
  if (totalAtual < minimoTotal) {
    completarGrupo(plano, [], minimoTotal - totalAtual, CATALOGO_NAO_ALCOOLICO, ajustes, true);
  }
  return ajustes;
}

function removerBebidasAlcoolicas(plano, ajustes) {
  const removidas = plano.cardapio.filter(item => normalizar(item.categoria) === "bebida" && ehBebidaAlcoolica(item));
  if (!removidas.length) return;
  const ids = new Set(removidas.map(item => item.id).filter(Boolean));
  plano.cardapio = plano.cardapio.filter(item => !ids.has(item.id));
  if (Array.isArray(plano.receitas)) plano.receitas = plano.receitas.filter(item => !ids.has(item.cardapio_id));
  plano.lista_compras = plano.lista_compras.flatMap(compra => {
    const origensAnteriores = Array.isArray(compra.origens) ? compra.origens : [];
    const origens = origensAnteriores.filter(origem => !ids.has(origem));
    if (origensAnteriores.some(origem => ids.has(origem)) && !origens.length) return [];
    return [{ ...compra, origens }];
  });
  removidas.forEach(item => ajustes.push(`Bebida alcoolica removida porque o evento foi definido sem alcool: ${item.nome}.`));
}

function completarGrupo(plano, existentes, minimo, catalogo, ajustes, quantidadeDireta = false) {
  const faltantes = quantidadeDireta ? minimo : Math.max(0, minimo - existentes.length);
  if (!faltantes) return;
  const nomesUsados = new Set(plano.cardapio.map(item => assinatura(item.nome)));
  let adicionadas = 0;

  for (const modelo of catalogo) {
    if (adicionadas >= faltantes) break;
    if (nomesUsados.has(assinatura(modelo.nome))) continue;
    const id = criarIdUnico(plano.cardapio, modelo.id);
    const item = {
      id,
      nome: modelo.nome,
      categoria: "Bebida",
      tipo_execucao: "pronto",
      descricao: modelo.descricao,
      emoji: "🥤",
      quantidade: "1 L",
      ingredientes: []
    };
    plano.cardapio.push(item);
    plano.lista_compras.push({
      item: modelo.nome,
      quantidade: "1 L",
      setor: "Bebidas",
      natureza: "bebida",
      origens: [id],
      prioridade: "media"
    });
    nomesUsados.add(assinatura(modelo.nome));
    adicionadas += 1;
    ajustes.push(`Bebida adicionada para cumprir a variedade por publico: ${modelo.nome}.`);
  }
}

function criarIdUnico(cardapio, base) {
  const ids = new Set(cardapio.map(item => item.id));
  let id = `bebida-${base}`;
  let sufixo = 2;
  while (ids.has(id)) id = `bebida-${base}-${sufixo++}`;
  return id;
}

function ehBebidaAlcoolica(item) {
  return /cerveja|vinho|espumante|gin|vodka|whisky|uisque|cachaca|caipirinha|alcool/.test(
    normalizar([item?.nome, item?.descricao].filter(Boolean).join(" "))
  );
}

function assinatura(valor) {
  return normalizar(valor)
    .replace(/\b(artesanal|especial|premium|classico|classica|gelado|gelada)\b/g, "")
    .replace(/\s+/g, " ")
    .trim();
}

function normalizar(valor) {
  return String(valor || "").normalize("NFD").replace(/[\u0300-\u036f]/g, "").toLowerCase();
}

function numeroPositivo(valor) {
  const numero = Number(valor);
  return Number.isFinite(numero) && numero > 0 ? numero : 0;
}

const CATALOGO_NAO_ALCOOLICO = [
  { id: "agua-sem-gas", nome: "Água mineral sem gás", descricao: "Servida gelada em estação de hidratação." },
  { id: "agua-com-gas", nome: "Água mineral com gás", descricao: "Opção gaseificada servida gelada." },
  { id: "cola-acucar", nome: "Refrigerante sabor cola com açúcar", descricao: "Opção por sabor, sem indicação de marca." },
  { id: "cola-zero", nome: "Refrigerante sabor cola zero açúcar", descricao: "Opção sem açúcar, sem indicação de marca." },
  { id: "guarana-acucar", nome: "Refrigerante sabor guaraná com açúcar", descricao: "Opção brasileira por sabor, sem indicação de marca." },
  { id: "guarana-zero", nome: "Refrigerante sabor guaraná zero açúcar", descricao: "Opção brasileira sem açúcar e sem indicação de marca." },
  { id: "limao", nome: "Refrigerante sabor limão", descricao: "Opção cítrica por sabor, sem indicação de marca." },
  { id: "suco-laranja", nome: "Suco integral de laranja", descricao: "Suco sem diluição, servido gelado." },
  { id: "suco-uva", nome: "Suco integral de uva", descricao: "Suco integral servido gelado." },
  { id: "limonada", nome: "Limonada natural", descricao: "Bebida cítrica preparada para o serviço." },
  { id: "cha-gelado", nome: "Chá gelado natural com cítricos", descricao: "Infusão natural, sem sachê no serviço." },
  { id: "cafe-especial", nome: "Café coado especial", descricao: "Café de grãos selecionados preparado na estação." },
  { id: "mocktail", nome: "Mocktail cítrico com ervas", descricao: "Coquetel sem álcool finalizado no serviço." },
  { id: "agua-coco", nome: "Água de coco", descricao: "Opção leve de hidratação servida gelada." },
  { id: "tonica", nome: "Água tônica com cítricos", descricao: "Bebida gaseificada amarga servida com guarnição cítrica." },
  { id: "mate", nome: "Mate gelado com limão", descricao: "Infusão de mate preparada e resfriada para o serviço." },
  { id: "abacaxi-hortela", nome: "Suco de abacaxi com hortelã", descricao: "Suco natural com perfil tropical." },
  { id: "frutas-vermelhas", nome: "Soda de frutas vermelhas sem álcool", descricao: "Bebida gaseificada de frutas, preparada sem álcool." }
];

const CATALOGO_ALCOOLICO = [
  { id: "gin-tonica", nome: "Gin tônica com cítricos", descricao: "Coquetel de gin preparado para adultos." },
  { id: "whisky", nome: "Whisky com serviço de gelo e água", descricao: "Destilado servido em dose controlada para adultos." },
  { id: "cerveja-pilsen", nome: "Cerveja estilo Pilsen", descricao: "Cerveja clara e leve servida para adultos." },
  { id: "cerveja-ipa", nome: "Cerveja estilo IPA", descricao: "Cerveja lupulada para ampliar a variedade do bar." },
  { id: "vinho-tinto", nome: "Vinho tinto seco", descricao: "Vinho selecionado conforme harmonização e cotação." },
  { id: "espumante-brut", nome: "Espumante brut", descricao: "Espumante seco para recepção ou brinde." },
  { id: "caipirinha", nome: "Caipirinha de limão", descricao: "Coquetel brasileiro preparado para adultos." },
  { id: "cerveja-weiss", nome: "Cerveja estilo Weiss", descricao: "Cerveja de trigo para ampliar os estilos disponíveis." },
  { id: "vinho-branco", nome: "Vinho branco seco", descricao: "Vinho servido resfriado conforme harmonização." },
  { id: "vodka", nome: "Vodka com frutas cítricas", descricao: "Coquetel de vodka preparado em dose controlada." }
];

module.exports = {
  calcularMinimoVariedadeBebidas,
  garantirVariedadeBebidas,
  ehBebidaAlcoolica
};
