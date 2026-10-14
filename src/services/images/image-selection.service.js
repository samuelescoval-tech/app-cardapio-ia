const { construirSolicitacoesImagem, selecionarImagensLocais } = require("./image-catalog.service");
const { normalizarTexto } = require("../../utils/text-normalize");
const { validarImagem } = require('./image-catalog.service');

function criarImageSelectionService(opcoes = {}) {
  const concorrencia = Math.min(3, Math.max(1, Math.floor(Number(opcoes.concorrencia) || 3)));
  const tempoMaxMs = Math.max(1, Math.min(15000, Number(opcoes.tempoMaxMs) || 12000));
  async function selecionarParaEvento(evento, pratos = []) {
    const solicitacoes = construirSolicitacoesImagem(evento, pratos);
    const fim = Date.now() + tempoMaxMs;
    const imagens = [], alternativas = {}, avisos = [], usados = new Set();
    let fotosAutorizadas = [];
    try {
      if (opcoes.fotoCompartilhamentoService) fotosAutorizadas = await comPrazo(
        signal => opcoes.fotoCompartilhamentoService.listarCatalogo({signal}), Math.min(2000, tempoMaxMs));
    } catch { avisos.push('As fotos autorizadas não puderam ser consultadas; usando outras fontes.'); }
    const preparados = solicitacoes.map(solicitacao => {
      const locais = selecionarImagensLocais(solicitacao);
      const foto = fotosAutorizadas.find(f => /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(f.id) && normalizarNomePrato(f.nome_prato) === normalizarNomePrato(solicitacao.nome));
      const local = locais.find(i => i.match_type === 'dish-family' && !usados.has(chaveImagem(i))) || locais.find(i => i.match_type === 'dish-family');
      let escolhida = local;
      if (foto) {
        const url = `/api/fotos-publicas/${foto.id}/imagem`;
        escolhida = validarImagem({id: `community-${foto.id}`, provider: 'community', license: 'owner-authorized', target_id: solicitacao.target_id, slot: solicitacao.slot, image_url: url, thumbnail_url: url, source_url: url, creator: foto.credito_publico || 'Colaborador Karamu', attribution: `Foto de ${foto.credito_publico || 'Colaborador Karamu'}, com autorização para uso no Karamu.`, alt: foto.nome_prato, match_type: 'dish-family', fallback: false});
      }
      if (escolhida) usados.add(chaveImagem(escolhida));
      return {solicitacao, locais, escolhida, resultado: null, erro: ''};
    });
    // A busca pode terminar fora de ordem; selecao/deduplicacao respeita o cardapio.
    const pendentes = preparados.filter(p => !p.escolhida);
    let proximo = 0;
    await Promise.all(Array.from({length: Math.min(concorrencia, pendentes.length)}, async () => {
      while (proximo < pendentes.length) {
        const p = pendentes[proximo++];
        const restante = fim - Date.now();
        try {
          if (restante <= 0) throw new Error('O prazo das imagens externas terminou');
          if (!opcoes.openverseService) throw new Error('Busca externa indisponível');
          p.resultado = await comPrazo(signal => opcoes.openverseService.buscar(p.solicitacao, {signal}), restante);
        } catch (error) { p.erro = error.message; }
      }
    }));
    for (const p of preparados) {
      const {solicitacao, locais} = p;
      if (p.escolhida) {
        imagens.push(p.escolhida);
        alternativas[solicitacao.target_id] = locais.filter(i => i.id !== p.escolhida.id);
        continue;
      }
      const candidatos = (p.resultado?.images || [])
        .filter(i => !usados.has(chaveImagem(i)))
        .map(i => ({...i, target_id: solicitacao.target_id, relevance_score: pontuarRelevancia(i, solicitacao)}))
        .filter(i => i.relevance_score >= 1 && temAncoraVisual(i, solicitacao))
        .sort((a,b) => b.relevance_score - a.relevance_score);
      const escolhida = candidatos[0];
      if (escolhida) {
        imagens.push(escolhida); usados.add(chaveImagem(escolhida));
        alternativas[solicitacao.target_id] = [...candidatos.slice(1,3).filter(i => !usados.has(chaveImagem(i))), ...locais];
      } else usarImagemLocalDeCategoria(solicitacao, locais, imagens, alternativas, avisos, usados, p.erro);
    }
    const locaisTotal = imagens.filter(i => i.provider === 'local').length;
    return {
      version: '1.3.0', provider: imagens.some(i => i.provider === 'community') ? 'community+library' : locaisTotal === imagens.length ? 'local' : 'local+openverse', persistence: false,
      context_id: solicitacoes[0]?.context_id || 'evento-geral', style_id: solicitacoes[0]?.style_id || 'sem-modificador', requested_targets: solicitacoes.length,
      images: imagens, alternatives: alternativas, warnings: avisos,
      local_images: locaisTotal, external_images: imagens.filter(i => i.provider === 'openverse').length,
      community_images: imagens.filter(i => i.provider === 'community').length, coverage: criarCoberturaVisual(solicitacoes.length, imagens),
      attribution_notice: 'Fotos autorizadas são usadas para nomes equivalentes do mesmo prato. Ilustrações de família podem se repetir; origem e tipo acompanham cada item.'
    };
  }
  return {selecionarParaEvento};
}

async function comPrazo(operacao, ms) {
  const controller = new AbortController();
  let timer;
  const expiracao = new Promise((resolve, reject) => {
    timer = setTimeout(() => { controller.abort(); reject(new Error('O prazo da consulta visual terminou')); }, ms);
  });
  try { return await Promise.race([Promise.resolve().then(() => operacao(controller.signal)), expiracao]); }
  finally { clearTimeout(timer); }
}

function criarCoberturaVisual(solicitados, imagens) {
  const familiaLocal = imagens.filter(imagem => imagem.provider === "local" && imagem.match_type === "dish-family").length;
  const categoriaLocal = imagens.filter(imagem => imagem.provider === "local" && imagem.match_type === "category").length;
  const externas = imagens.filter(imagem => imagem.provider === "openverse").length;
  const exibidas = imagens.length;
  const ausentes = Math.max(0, solicitados - exibidas);
  return {
    requested: solicitados,
    displayed: exibidas,
    local_family: familiaLocal,
    local_category: categoriaLocal,
    external: externas,
    community: imagens.filter(i => i.provider === 'community').length,
    missing: ausentes,
    status: ausentes ? "incomplete" : categoriaLocal || externas || imagens.some(i => i.provider === 'community') ? "review" : "controlled"
  };
}

function normalizarNomePrato(nome) {
  const equivalentes = {brigadeiros:'brigadeiro',beijinhos:'beijinho',coxinhas:'coxinha',bolos:'bolo',pudins:'pudim',sucos:'suco',sanduiches:'sanduiche',tortas:'torta'};
  return normalizarTexto(nome).replace(/[^\p{L}\p{N}]+/gu, ' ').trim().split(/\s+/).map(p => equivalentes[p] || p).join(' ');
}

function usarImagemLocalDeCategoria(solicitacao, locais, imagens, alternativas, avisos, usados, motivoExterno = "") {
  const local = locais.find(imagem => imagem.match_type === "category" && !usados.has(chaveImagem(imagem)))
    || locais.find(imagem => imagem.match_type === "category")
    || locais.find(imagem => !usados.has(chaveImagem(imagem)))
    || locais[0];
  if (!local) {
    avisos.push(`${solicitacao.nome}: sem imagem local ou externa confiavel.`);
    return;
  }
  imagens.push(local);
  usados.add(chaveImagem(local));
  alternativas[solicitacao.target_id] = locais.filter(imagem => imagem.id !== local.id);
  const tipo = local.match_type === "category" ? "imagem de categoria usada" : "ilustracao da familia reutilizada";
  avisos.push(`${solicitacao.nome}: ${tipo}${motivoExterno ? ` porque ${motivoExterno}` : ""}.`);
}

function pontuarRelevancia(imagem, solicitacao) {
  const metadados = normalizar([
    imagem?.alt,
    imagem?.attribution,
    ...(Array.isArray(imagem?.tags) ? imagem.tags : [])
  ].filter(Boolean).join(" "));
  if (!metadados) return 0;
  const termos = Array.isArray(solicitacao?.match_terms) ? solicitacao.match_terms : [];
  return termos.reduce((total, termo) => total + (metadados.includes(normalizar(termo)) ? 1 : 0), 0);
}

function temAncoraVisual(imagem, solicitacao) {
  const ancoras = Array.isArray(solicitacao?.anchor_terms) ? solicitacao.anchor_terms.map(normalizar).filter(Boolean) : [];
  if (!ancoras.length) return false;
  const titulo = normalizar(imagem?.alt);
  if (!titulo || !ancoras.some(termo => titulo.includes(termo))) return false;
  if (ancoras.length >= 2) return true;
  const contexto = TERMOS_APRESENTACAO[solicitacao?.slot] || [];
  return contexto.some(termo => titulo.includes(termo));
}

function normalizar(valor) {
  return normalizarTexto(valor);
}

function chaveImagem(imagem) {
  return String(imagem?.source_url || imagem?.id || "").trim();
}

const TERMOS_APRESENTACAO = {
  bebida: ["juice", "drink", "beverage", "cocktail", "glass", "coffee", "tea", "wine", "beer", "water", "soda"],
  sobremesa: ["dessert", "cake", "pudding", "mousse", "sweet", "pastry", "tart", "truffle", "flan"],
  entrada: ["appetizer", "canape", "sandwich", "tartare", "skewer", "bread", "pizza", "hot dog"],
  principal: ["main course", "plate", "steak", "fish", "chicken", "pasta", "risotto", "meal"],
  acompanhamento: ["side dish", "rice", "salad", "vegetable", "farofa"],
  salada: ["salad", "leaves", "vegetable"]
};

module.exports = { criarImageSelectionService, criarCoberturaVisual, chaveImagem, pontuarRelevancia, temAncoraVisual };
