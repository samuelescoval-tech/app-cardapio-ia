/**
 * Storage Service - Gerenciar histórico local com localStorage
 * TAG: storage-local
 * FASE 1: Histórico Local
 */

const STORAGE_KEY = 'chef_ia_historico';
const MAX_ENTRIES = 50;

/**
 * Salvar um evento + seu planejamento no histórico
 */
function salvarHistorico(evento, plano) {
  try {
    const id = `evento_${Date.now()}`;
    const entrada = {
      id,
      data_criacao: new Date().toISOString(),
      tipo: evento.tipo,
      pessoas: evento.pessoas,
      duracao_horas: evento.duracao_horas || 'N/A',
      evento: evento,
      plano: plano,
      resumo: extrairResumoPlano(plano)
    };

    let historico = carregarHistorico();
    historico.unshift(entrada); // Adiciona no início (mais recente)
    historico = historico.slice(0, MAX_ENTRIES); // Mantém apenas os últimos 50

    localStorage.setItem(STORAGE_KEY, JSON.stringify(historico));
    console.log('✅ Histórico salvo:', id);
    return id;
  } catch (error) {
    console.error('❌ Erro ao salvar histórico:', error);
    return null;
  }
}

/**
 * Carregar todo o histórico
 */
function carregarHistorico() {
  try {
    const data = localStorage.getItem(STORAGE_KEY);
    return data ? JSON.parse(data) : [];
  } catch (error) {
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

  // Tentar extrair do resumo se existir
  if (plano.resumo) {
    return plano.resumo.substring(0, 100) + '...';
  }

  // Fallback: usar informações disponíveis
  const equipe = plano.equipe || '?';
  const refeicoes = plano.refeicoes?.length || '?';
  return `${refeicoes} pratos • Equipe: ${equipe}`;
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
    formatarDataBR
  };
}
