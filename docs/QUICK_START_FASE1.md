# ⚡ Quick Start — FASE 1 Agora Mesmo

**Tempo total:** 3-4 horas  
**Complexidade:** Baixa (localStorage é simples)  
**Impacto:** Alto (usuários voltam mais)

---

## 🎯 O que vamos fazer

Implementar um **gerenciador de histórico local** que permite ao usuário:
- ✅ Salvar eventos + planejamentos gerados
- ✅ Listar 50 planejamentos recentes
- ✅ Carregar um anterior e editar
- ✅ Deletar antigos

---

## 📋 Checklist de Execução

### ✋ Antes de Começar
- [ ] Terminal em `app-cardapio-ia/`
- [ ] `npm start` rodando (servidor em http://localhost:3000)
- [ ] Navegador aberto em http://localhost:3000
- [ ] Abrir DevTools (F12) para ver console

---

## 🔧 PASSO 1: Criar storage.service.js

**Arquivo:** `src/utils/storage.service.js`

```javascript
/**
 * Storage Service - Gerenciar histórico local com localStorage
 * TAG: storage-local
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
 * Formatar data para exibição
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

// Exportar para uso global
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

module.exports = {
  salvarHistorico,
  carregarHistorico,
  carregarEntrada,
  deletarEntrada,
  limparHistorico,
  formatarDataBR
};
```

---

## 🔧 PASSO 2: Adicionar HTML do Histórico

**Arquivo:** `public/index.html`

Adicionar **após o formulário** e **antes do resultado**:

```html
<!-- TAG: historico-ui -->
<section id="historico-section" class="historico-section">
  <div class="historico-header">
    <h2>📋 Seus Planejamentos Recentes</h2>
    <button id="limpar-historico-btn" class="btn-secondary btn-small" onclick="limparHistoricoUI()">
      🗑️ Limpar Tudo
    </button>
  </div>
  
  <div id="historico-container" class="historico-container">
    <p class="historico-vazio">Nenhum planejamento salvo ainda</p>
  </div>
</section>
```

Adicionar **CSS** para estilo (`public/css/modules/form.css`):

```css
/* TAG: historico-styles */
.historico-section {
  margin: 2rem 0;
  padding: 1.5rem;
  background: #f9f9f9;
  border-radius: 8px;
  border-left: 4px solid #667eea;
}

.historico-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 1.5rem;
}

.historico-header h2 {
  margin: 0;
  font-size: 1.2rem;
  color: #333;
}

.btn-secondary {
  background: #f0f0f0;
  color: #333;
  border: 1px solid #ddd;
  padding: 0.5rem 1rem;
  border-radius: 4px;
  cursor: pointer;
  font-size: 0.9rem;
  transition: background 0.2s;
}

.btn-secondary:hover {
  background: #e0e0e0;
}

.btn-small {
  padding: 0.3rem 0.8rem;
  font-size: 0.85rem;
}

.historico-container {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(280px, 1fr));
  gap: 1rem;
  max-height: 400px;
  overflow-y: auto;
}

.historico-card {
  background: white;
  border: 1px solid #ddd;
  border-radius: 6px;
  padding: 1rem;
  cursor: pointer;
  transition: all 0.2s;
  display: flex;
  flex-direction: column;
}

.historico-card:hover {
  border-color: #667eea;
  box-shadow: 0 2px 8px rgba(102, 126, 234, 0.1);
  transform: translateY(-2px);
}

.historico-card-header {
  display: flex;
  justify-content: space-between;
  align-items: start;
  margin-bottom: 0.5rem;
}

.historico-card-title {
  font-weight: 600;
  color: #333;
  flex: 1;
}

.historico-card-meta {
  font-size: 0.85rem;
  color: #666;
  display: flex;
  gap: 0.5rem;
  margin-bottom: 0.5rem;
}

.historico-card-resumo {
  font-size: 0.85rem;
  color: #888;
  margin-bottom: 1rem;
  flex: 1;
}

.historico-card-acoes {
  display: flex;
  gap: 0.5rem;
}

.historico-card-acoes button {
  flex: 1;
  padding: 0.4rem 0.6rem;
  font-size: 0.8rem;
  border: none;
  border-radius: 4px;
  cursor: pointer;
  transition: all 0.2s;
}

.historico-btn-carregar {
  background: #667eea;
  color: white;
}

.historico-btn-carregar:hover {
  background: #5568d3;
}

.historico-btn-deletar {
  background: #ff6b6b;
  color: white;
}

.historico-btn-deletar:hover {
  background: #ff5252;
}

.historico-vazio {
  color: #999;
  font-style: italic;
  text-align: center;
  padding: 2rem;
}
```

---

## 🔧 PASSO 3: Função de Renderização

**Arquivo:** `public/js/app.js`

Adicionar função **no final do arquivo**:

```javascript
// TAG: render-historico

/**
 * Renderizar cards do histórico
 */
function renderizarHistorico() {
  const container = document.getElementById('historico-container');
  const historico = window.storageService.carregarHistorico();

  if (historico.length === 0) {
    container.innerHTML = '<p class="historico-vazio">Nenhum planejamento salvo ainda</p>';
    return;
  }

  container.innerHTML = historico.map(entrada => `
    <div class="historico-card">
      <div class="historico-card-header">
        <div class="historico-card-title">${escapeHtml(entrada.tipo)}</div>
      </div>
      <div class="historico-card-meta">
        <span>👥 ${entrada.pessoas} pessoas</span>
        <span>⏰ ${window.storageService.formatarDataBR(entrada.data_criacao)}</span>
      </div>
      <div class="historico-card-resumo">
        ${escapeHtml(entrada.resumo)}
      </div>
      <div class="historico-card-acoes">
        <button class="historico-btn-carregar" onclick="carregarDoHistorico('${entrada.id}')">
          📂 Carregar
        </button>
        <button class="historico-btn-deletar" onclick="deletarDoHistorico('${entrada.id}')">
          🗑️ Deletar
        </button>
      </div>
    </div>
  `).join('');
}

/**
 * Carregar uma entrada do histórico e preencher o formulário
 */
function carregarDoHistorico(id) {
  const entrada = window.storageService.carregarEntrada(id);
  if (!entrada) {
    alert('❌ Planejamento não encontrado');
    return;
  }

  // Preencher formulário
  const evento = entrada.evento;
  document.querySelector('input[name="tipo"]').value = evento.tipo || '';
  document.querySelector('input[name="pessoas"]').value = evento.pessoas || '';
  document.querySelector('textarea[name="restricoes"]').value = evento.restricoes || '';
  document.querySelector('textarea[name="userChat"]').value = evento.userChat || '';

  // Limpar e mostrar resultado anterior
  document.getElementById('resultado').innerHTML = '';

  // Renderizar plano anterior
  const plano = entrada.plano;
  if (plano) {
    renderResultado(plano);
    document.getElementById('resultado').scrollIntoView({ behavior: 'smooth' });
  }

  console.log('✅ Planejamento carregado:', id);
}

/**
 * Deletar uma entrada do histórico
 */
function deletarDoHistorico(id) {
  if (!confirm('Tem certeza que quer deletar este planejamento?')) {
    return;
  }

  if (window.storageService.deletarEntrada(id)) {
    renderizarHistorico();
    console.log('✅ Deletado');
  }
}

/**
 * Limpar todo o histórico
 */
function limparHistoricoUI() {
  if (!confirm('⚠️ Isso vai deletar TODOS os planejamentos salvos. Tem certeza?')) {
    return;
  }

  if (window.storageService.limparHistorico()) {
    renderizarHistorico();
  }
}

/**
 * Chamar renderização ao carregar página
 */
document.addEventListener('DOMContentLoaded', function() {
  // ... código existente ...
  
  // Renderizar histórico
  setTimeout(() => {
    renderizarHistorico();
  }, 500);
});
```

---

## 🔧 PASSO 4: Integrar no Fluxo de Geração

**Arquivo:** `public/js/app.js`

Modificar a função `handleGerar()` (ou equivalente):

```javascript
// TAG: integracao-historico

// ANTES (não tem salvar):
async function handleGerar() {
  const evento = montarEvento();
  const resposta = await fetch('/gerar-cardapio', { /* ... */ });
  const data = await resposta.json();
  renderResultado(data.plano);
}

// DEPOIS (com salvar no histórico):
async function handleGerar() {
  const evento = montarEvento();
  
  try {
    const resposta = await fetch('/gerar-cardapio', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(evento)
    });

    const data = await resposta.json();

    if (data.ok) {
      // ✅ NOVO: Salvar no histórico
      window.storageService.salvarHistorico(evento, data.plano);
      
      // Renderizar resultado
      renderResultado(data.plano);
      
      // ✅ NOVO: Atualizar lista de histórico
      renderizarHistorico();
      
      console.log('✅ Gerado e salvo no histórico');
    } else {
      mostrarErro(data.erro || 'Erro ao gerar planejamento');
    }
  } catch (error) {
    mostrarErro(error.message);
  }
}
```

---

## ✅ PASSO 5: Importar storage.service.js no HTML

**Arquivo:** `public/index.html`

Adicionar **antes do `</body>`**:

```html
<!-- TAG: scripts-storage -->
<script src="/js/storage.service.js"></script>
<script src="/js/app.js"></script>
</body>
```

**OU** se estiver usando módulos Node.js no backend, criar um arquivo `public/js/storage.service.js`:

Copiar o código do PASSO 1 removendo apenas as linhas de export:

```javascript
// Remover essa parte se estiver no frontend:
// module.exports = { ... }

// Manter apenas:
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
```

---

## 🧪 TESTE AGORA

### Teste 1: Salvar no Histórico
```
1. Preencha o formulário
2. Clique "Gerar Planejamento"
3. Veja o resultado aparecer
4. Scroll para cima → Veja novo card no histórico
```

**Esperado:** Card mostra tipo, pessoas, data e botões

### Teste 2: Persistência
```
1. Recarregue a página (F5)
2. Histórico ainda está lá? ✅
```

**Esperado:** Sim, localStorage persiste

### Teste 3: Carregar do Histórico
```
1. Clique "Carregar" em um card
2. Formulário preenche com dados antigos
3. Resultado anterior aparece
```

**Esperado:** Tudo funciona

### Teste 4: Deletar
```
1. Clique "Deletar" em um card
2. Confirme
3. Card desaparece
```

**Esperado:** Card foi removido

### Teste 5: Limpar Tudo
```
1. Clique "Limpar Tudo"
2. Confirme
3. Todos os cards desaparecem
```

**Esperado:** Mensagem "Nenhum planejamento salvo"

---

## 🐛 Debug

Se algo não funcionar:

### Console
Abra DevTools (F12) e cole:
```javascript
// Ver histórico completo
console.log(window.storageService.carregarHistorico());

// Limpar localStorage (reset)
window.storageService.limparHistorico();

// Verificar espaço usado
console.log(JSON.stringify(window.storageService.carregarHistorico()).length / 1024 + ' KB');
```

### Verificar localStorage
```javascript
// No console do browser:
localStorage.getItem('chef_ia_historico')
```

### Se não renderizar
- Verifique se `storage.service.js` está em `public/js/`
- Verifique se está importado no HTML
- Abra DevTools → Aba Network → veja se `storage.service.js` foi carregado
- Procure erros vermelhos no Console

---

## ✅ Checklist Final

- [ ] `src/utils/storage.service.js` criado ✅
- [ ] `public/js/storage.service.js` criado (cópia para frontend)
- [ ] HTML atualizado com seção de histórico
- [ ] CSS adicionado para estilo do histórico
- [ ] Funções de renderização adicionadas em `app.js`
- [ ] `salvarHistorico()` chamado após gerar
- [ ] `renderizarHistorico()` chamado ao carregar página
- [ ] Botões "Carregar" e "Deletar" funcionam
- [ ] localStorage persiste após reload
- [ ] Limite de 50 entradas funciona

---

## 🎉 Quando Terminar

Depois que passar em TODOS os testes:

1. Commit no Git:
```bash
git add .
git commit -m "FASE 1: Histórico local com localStorage"
```

2. Passar para **FASE 2: PDF Export** (próximo documento)

---

**Tempo gasto:** Marque aqui quando terminar  
⏱️ Início: ___:___  
⏱️ Fim: ___:___  
⏱️ Total: ___ horas

---

*Quick Start FASE 1 — 2026-07-02*
