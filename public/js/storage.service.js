/**
 * Storage Service - Gerenciar histórico local com localStorage
 * TAG: storage-local
 * FASE 1: Histórico Local
 */

const STORAGE_KEY = 'chef_ia_historico';
const MAX_ENTRIES = 50;
const MAX_VARIETY_ENTRIES = 5;
const MAX_VARIETY_DISHES = 18;
let ultimoErroHistorico = null;

/**
 * Salvar um evento + seu planejamento no histórico
 */
function salvarHistorico(evento, plano) {
  try {
    if (!planoTemConteudo(plano)) {
      ultimoErroHistorico = 'Planejamento incompleto não foi salvo.';
      console.warn('⚠️ Histórico ignorou planejamento incompleto.');
      return null;
    }

    const id = `evento_${Date.now()}`;
    const planoPersistivel = prepararPlanoParaHistorico(plano);
    const entrada = {
      id,
      data_criacao: new Date().toISOString(),
      tipo: evento.tipo,
      pessoas: evento.pessoas,
      duracao_horas: evento.duracao_horas || 'N/A',
      evento: evento,
      plano: planoPersistivel,
      resumo: extrairResumoPlano(planoPersistivel)
    };

    let historico = carregarHistorico();
    historico.unshift(entrada); // Adiciona no início (mais recente)
    historico = historico.slice(0, MAX_ENTRIES); // Mantém apenas os últimos 50

    localStorage.setItem(STORAGE_KEY, JSON.stringify(historico));
    ultimoErroHistorico = null;
    console.log('✅ Histórico salvo:', id);
    return id;
  } catch (error) {
    ultimoErroHistorico = `Não foi possível salvar o histórico: ${error.message}`;
    console.error('❌ Erro ao salvar histórico:', error);
    return null;
  }
}

/**
 * Referencias visuais sao transitorias: licencas, URLs e resultados externos
 * nao devem aumentar o localStorage nem reaparecer como se fossem permanentes.
 */
function prepararPlanoParaHistorico(plano) {
  if (!plano || typeof plano !== 'object' || Array.isArray(plano)) return plano;

  const copia = { ...plano };
  [
    'imagens_evento',
    'visual_references',
    'referencias_visuais',
    'galeria_evento'
  ].forEach(campo => delete copia[campo]);
  return copia;
}

/**
 * Carregar todo o histórico
 */
function carregarHistorico() {
  try {
    ultimoErroHistorico = null;
    const data = localStorage.getItem(STORAGE_KEY);
    if (!data) return [];

    const historico = JSON.parse(data);
    if (!Array.isArray(historico)) {
      ultimoErroHistorico = 'O histórico local está em um formato antigo não reconhecido.';
      return [];
    }

    return historico
      .map(normalizarEntradaHistorico)
      .filter(Boolean);
  } catch (error) {
    ultimoErroHistorico = `Não foi possível ler o histórico local: ${error.message}`;
    console.error('❌ Erro ao carregar histórico:', error);
    return [];
  }
}

/**
 * Carregar uma entrada específica pelo ID
 */
function carregarEntrada(id) {
  const historico = carregarHistorico();
  return historico.find(e => e.id === id) || null;
}

/**
 * Deletar uma entrada pelo ID
 */
function deletarEntrada(id) {
  try {
    let historico = carregarHistorico();
    const original_length = historico.length;
    historico = historico.filter(e => e.id !== id);

    if (historico.length < original_length) {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(historico));
      console.log('✅ Entrada deletada:', id);
      return true;
    }
    return false;
  } catch (error) {
    console.error('❌ Erro ao deletar entrada:', error);
    return false;
  }
}

/**
 * Limpar todo o histórico (cuidado!)
 */
function limparHistorico() {
  try {
    localStorage.removeItem(STORAGE_KEY);
    console.log('✅ Histórico completo limpo');
    return true;
  } catch (error) {
    console.error('❌ Erro ao limpar histórico:', error);
    return false;
  }
}

/**
 * Extrair resumo do plano para exibição
 */
function extrairResumoPlano(plano) {
  if (!plano) return 'Planejamento incompleto';

  const resumo = plano.resumo_chef || plano.resumo;
  if (typeof resumo === 'string' && resumo.trim()) {
    const texto = resumo.trim();
    return texto.length > 100 ? `${texto.substring(0, 100)}...` : texto;
  }

  const pratos = Array.isArray(plano.cardapio)
    ? plano.cardapio.length
    : Array.isArray(plano.refeicoes) ? plano.refeicoes.length : 0;
  const compras = Array.isArray(plano.lista_compras) ? plano.lista_compras.length : 0;
  return `${pratos} pratos • ${compras} itens de compra`;
}

function normalizarEntradaHistorico(entrada, indice = 0) {
  if (!entrada || typeof entrada !== 'object' || Array.isArray(entrada)) return null;

  const evento = entrada.evento && typeof entrada.evento === 'object'
    ? entrada.evento
    : {};
  const plano = entrada.plano || entrada.planejamento || entrada.resultado || null;

  return {
    ...entrada,
    id: entrada.id || `evento_legado_${indice}`,
    data_criacao: entrada.data_criacao || entrada.data || new Date(0).toISOString(),
    tipo: entrada.tipo || evento.tipo || 'Evento sem título',
    pessoas: entrada.pessoas || evento.pessoas || '?',
    evento: {
      ...evento,
      tipo: evento.tipo || entrada.tipo || '',
      pessoas: evento.pessoas || entrada.pessoas || ''
    },
    plano,
    plano_valido: planoTemConteudo(plano),
    resumo: entrada.resumo || extrairResumoPlano(plano)
  };
}

function planoTemConteudo(plano) {
  if (!plano || typeof plano !== 'object' || Array.isArray(plano)) return false;
  return ['cardapio', 'receitas', 'lista_compras', 'cronograma'].some(campo =>
    Array.isArray(plano[campo]) && plano[campo].length > 0
  );
}

function obterUltimoErroHistorico() {
  return ultimoErroHistorico;
}

/**
 * Cria uma memoria culinaria minima para variar novas geracoes.
 * Nao envia receitas, ingredientes, observacoes, pessoas ou referencias externas.
 */
function criarMemoriaCulinaria(historico = carregarHistorico()) {
  if (!Array.isArray(historico)) return [];

  return historico
    .filter(entrada => entrada?.plano_valido !== false && planoTemConteudo(entrada?.plano))
    .slice(0, MAX_VARIETY_ENTRIES)
    .flatMap(entrada => {
      const pratos = Array.isArray(entrada.plano?.cardapio)
        ? entrada.plano.cardapio.slice(0, MAX_VARIETY_DISHES).flatMap(prato => {
            const nome = textoCompacto(prato?.nome, 80);
            const categoria = textoCompacto(prato?.categoria, 30);
            return nome ? [{ nome, categoria }] : [];
          })
        : [];
      if (!pratos.length) return [];

      return [{
        evento: {
          tipo: textoCompacto(entrada.evento?.tipo || entrada.tipo, 80),
          refeicao: textoCompacto(entrada.evento?.refeicao, 80),
          tema: textoCompacto(entrada.evento?.tema, 120)
        },
        pratos
      }];
    });
}

function textoCompacto(valor, limite) {
  if (typeof valor !== 'string' && typeof valor !== 'number') return '';
  return String(valor).replace(/\s+/g, ' ').trim().slice(0, limite);
}

/**
 * Formatar data para exibição em português
 */
function formatarDataBR(isoString) {
  const data = new Date(isoString);
  const agora = new Date();
  const diff = agora - data; // em ms
  const minutos = Math.floor(diff / 60000);
  const horas = Math.floor(diff / 3600000);
  const dias = Math.floor(diff / 86400000);

  if (minutos < 1) return 'Agora';
  if (minutos < 60) return `há ${minutos}m`;
  if (horas < 24) return `há ${horas}h`;
  if (dias < 7) return `há ${dias}d`;

  return data.toLocaleDateString('pt-BR');
}

// Exportar para uso global no navegador
if (typeof window !== 'undefined') {
  window.storageService = {
    salvarHistorico,
    carregarHistorico,
    carregarEntrada,
    deletarEntrada,
    limparHistorico,
    criarMemoriaCulinaria,
    formatarDataBR,
    planoTemConteudo,
    prepararPlanoParaHistorico,
    obterUltimoErroHistorico
  };
}

if (typeof module !== 'undefined' && module.exports) {
  module.exports = {
    extrairResumoPlano,
    normalizarEntradaHistorico,
    planoTemConteudo,
    prepararPlanoParaHistorico,
    criarMemoriaCulinaria
  };
}
