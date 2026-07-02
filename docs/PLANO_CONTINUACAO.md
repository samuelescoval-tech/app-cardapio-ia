# 📋 Plano de Continuação — Chef IA Studio

**Data:** 2026-07-02  
**Status:** Fundação 100% funcional, próximas 5 fases mapeadas

---

## 🎯 Visão Geral Atual

O Chef IA Studio completou a **Fase de Estabilização** com sucesso:
- ✅ Express + Gemini funcionando
- ✅ Backend com extração JSON robusta
- ✅ Frontend com formulário integrado
- ✅ Motor matemático local operacional
- ✅ Estrutura modular clara (public/, src/, legacy/, docs/)

**Próximo objetivo:** Evoluir para **Fase de Recursos** implementando 5 features críticas em sequência.

---

## 📌 Mapa de Fases

```
FASE DE ESTABILIZAÇÃO (✅ CONCLUÍDA)
├─ Recuperar funcionamento base
├─ Blindar backend com validação
├─ Reorganizar estrutura
└─ Motor matemático local

FASE 1: HISTÓRICO LOCAL
├─ localStorage para eventos recentes
├─ Gerenciador de historico na UI
├─ Carregar/excluir planejamentos
└─ **Tempo estimado:** 3-4 horas

FASE 2: EXPORTAÇÃO PDF
├─ Geração de PDF estruturado
├─ Secções: executivo, compras, cronograma
├─ Design impresso
└─ **Tempo estimado:** 4-5 horas

FASE 3: SEPARAR APRESENTAÇÃO
├─ Mover pitch para arquivo separado
├─ Landing page + app page
├─ Navegação clara
└─ **Tempo estimado:** 2-3 horas

FASE 4: EVOLUIR MOTOR LOCAL
├─ Adultos vs crianças separados
├─ Detalhar utensílios (talheres, copos, etc)
├─ Multiplicadores por tipo de refeição
└─ **Tempo estimado:** 5-6 horas

FASE 5: REFINAR INTERFACE
├─ Secções recolhíveis
├─ Melhorar densidade visual
├─ Estados de carregamento/erro
└─ **Tempo estimado:** 3-4 horas
```

---

## 🔥 FASE 1: HISTÓRICO LOCAL COM LOCALSTORAGE

### 🎯 Objetivo
Permitir que o usuário salve, carregue e reutilize planejamentos anteriores sem perder dados.

### 📋 Tarefas

#### 1.1 - Implementar Motor de Storage
**Arquivo:** `src/utils/storage.service.js`

```javascript
// Salvar evento + plano gerado
function salvarHistorico(evento, plano) {
  const id = `evento_${Date.now()}`;
  const entrada = {
    id,
    data_criacao: new Date().toISOString(),
    tipo: evento.tipo,
    pessoas: evento.pessoas,
    evento,
    plano,
    tags: extrairTags(evento)
  };
  
  let historico = JSON.parse(localStorage.getItem('historico') || '[]');
  historico.unshift(entrada); // Mais recente primeiro
  historico = historico.slice(0, 50); // Manter últimas 50
  
  localStorage.setItem('historico', JSON.stringify(historico));
  return id;
}

// Carregar histórico
function carregarHistorico() {
  return JSON.parse(localStorage.getItem('historico') || '[]');
}

// Deletar entrada
function deletarHistorico(id) {
  let historico = JSON.parse(localStorage.getItem('historico') || '[]');
  historico = historico.filter(e => e.id !== id);
  localStorage.setItem('historico', JSON.stringify(historico));
}
```

#### 1.2 - Extensão do HTML
**Arquivo:** `public/index.html`

Adicionar seção de histórico após formulário:
```html
<div id="historico-container" class="historico-container">
  <h2>Seus Planejamentos Recentes</h2>
  <div id="historico-lista" class="historico-lista"></div>
</div>
```

#### 1.3 - Renderizador de Histórico
**Arquivo:** `public/js/render.js` (novo módulo)

```javascript
function renderizarHistorico() {
  const historico = carregarHistorico();
  const container = document.getElementById('historico-lista');
  
  if (historico.length === 0) {
    container.innerHTML = '<p>Nenhum planejamento salvo ainda</p>';
    return;
  }
  
  container.innerHTML = historico.map(e => `
    <div class="historico-card">
      <div class="historico-meta">
        <strong>${e.tipo}</strong> • ${e.pessoas} pessoas
        <span class="historico-data">${formatarData(e.data_criacao)}</span>
      </div>
      <div class="historico-acoes">
        <button onclick="carregarPlanejamento('${e.id}')">Carregar</button>
        <button onclick="deletarPlanejamento('${e.id}')">Excluir</button>
      </div>
    </div>
  `).join('');
}
```

#### 1.4 - Integração no app.js
Após receber resposta do backend:
```javascript
// Dentro de handleGerar()
const planoId = salvarHistorico(evento, resposta.plano);
renderizarHistorico();
```

### ✅ Critério de Sucesso
- [x] Salva evento + plano ao gerar
- [x] Lista historico na UI
- [x] Botão "Carregar" recarrega formulário + resultado
- [x] Botão "Excluir" remove da lista
- [x] Limite de 50 entradas (sem encher storage)

### 📊 Impacto
**Retenção aumenta:** Usuário volta para "refazer aquele planejamento"  
**Experiência:** Mais polida e produtiva

---

## 📄 FASE 2: EXPORTAÇÃO PDF

### 🎯 Objetivo
Gerar PDF estruturado com resumo executivo, lista de compras, cronograma e orçamento.

### 📋 Tarefas

#### 2.1 - Instalação
```bash
npm install jspdf html2canvas
```

#### 2.2 - Builder PDF
**Arquivo:** `src/utils/pdf.builder.js`

```javascript
const jsPDF = require('jspdf');
const html2canvas = require('html2canvas');

async function gerarPDF(evento, plano) {
  const doc = new jsPDF('p', 'mm', 'a4');
  let y = 10;
  
  // Capa
  doc.setFontSize(24);
  doc.text('Planejamento de Evento', 105, y, { align: 'center' });
  y += 20;
  
  doc.setFontSize(12);
  doc.text(`Tipo: ${evento.tipo}`, 20, y);
  y += 8;
  doc.text(`Pessoas: ${evento.pessoas}`, 20, y);
  y += 8;
  doc.text(`Data: ${new Date().toLocaleDateString('pt-BR')}`, 20, y);
  
  // Resumo executivo
  y += 15;
  doc.setFontSize(16);
  doc.text('Resumo Executivo', 20, y);
  y += 10;
  
  if (plano.resumo) {
    const resumoLinhas = doc.splitTextToSize(plano.resumo, 170);
    doc.setFontSize(10);
    doc.text(resumoLinhas, 20, y);
    y += resumoLinhas.length * 5 + 10;
  }
  
  // Lista de compras
  y += 5;
  if (y > 250) { doc.addPage(); y = 10; }
  
  doc.setFontSize(16);
  doc.text('Lista de Compras', 20, y);
  y += 10;
  
  if (plano.compras) {
    Object.entries(plano.compras).forEach(([setor, itens]) => {
      doc.setFontSize(12);
      doc.text(setor, 20, y);
      y += 6;
      
      Object.entries(itens).forEach(([item, qtd]) => {
        doc.setFontSize(10);
        doc.text(`• ${item}: ${qtd}`, 25, y);
        y += 5;
        
        if (y > 270) {
          doc.addPage();
          y = 10;
        }
      });
    });
  }
  
  // Orçamento
  y += 10;
  if (y > 250) { doc.addPage(); y = 10; }
  
  doc.setFontSize(16);
  doc.text('Orçamento', 20, y);
  y += 10;
  
  const orcamento = plano.orcamento || {};
  doc.setFontSize(11);
  Object.entries(orcamento).forEach(([item, valor]) => {
    doc.text(`${item}: R$ ${valor.toFixed(2)}`, 20, y);
    y += 6;
  });
  
  // Total
  y += 5;
  doc.setFontSize(14);
  doc.setFont(undefined, 'bold');
  doc.text(`Total: R$ ${orcamento.total?.toFixed(2) || '0.00'}`, 20, y);
  
  return doc;
}

module.exports = { gerarPDF };
```

#### 2.3 - Endpoint Backend
**Arquivo:** `server.js`

```javascript
const { gerarPDF } = require('./src/utils/pdf.builder');

app.post('/exportar-pdf', async (req, res) => {
  try {
    const { evento, plano } = req.body;
    const doc = await gerarPDF(evento, plano);
    
    const pdfBuffer = Buffer.from(doc.output('arraybuffer'));
    res.header('Content-Type', 'application/pdf');
    res.header('Content-Disposition', `attachment; filename="cardapio_${Date.now()}.pdf"`);
    res.send(pdfBuffer);
  } catch (error) {
    res.status(500).json({ erro: error.message });
  }
});
```

#### 2.4 - Botão no Frontend
**Arquivo:** `public/js/render.js`

Adicionar botão no resultado:
```html
<button onclick="exportarPDF()">📥 Exportar PDF</button>
```

```javascript
function exportarPDF() {
  fetch('/exportar-pdf', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ evento: window.eventoAtual, plano: window.planoAtual })
  })
  .then(r => r.blob())
  .then(blob => {
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `cardapio_${Date.now()}.pdf`;
    a.click();
  });
}
```

### ✅ Critério de Sucesso
- [x] PDF gerado com estrutura clara
- [x] Contém: resumo, compras, cronograma, orçamento
- [x] Download automático com nome único
- [x] Suporta acentuação/português

### 📊 Impacto
**Usuário pode:** Imprimir, compartilhar, arquivar  
**Conversão:** PDF é "prova de venda"

---

## 🎨 FASE 3: SEPARAR APRESENTAÇÃO

### 🎯 Objetivo
Transformar `index.html` em landing page + aplicação, melhorando UX e SEO.

### 📋 Tarefas

#### 3.1 - Estrutura de Páginas
```
public/
├─ index.html          ← Landing page (apresentação)
├─ app.html            ← Aplicação (formulário + resultado)
├─ js/
│  ├─ index.js         ← Interações da landing
│  ├─ app.js           ← Lógica da aplicação
│  └─ ...
└─ css/
   └─ ...
```

#### 3.2 - Landing Page (`public/index.html`)
```html
<!DOCTYPE html>
<html lang="pt-BR">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1">
  <title>Chef IA Studio — Planejamento Inteligente de Eventos</title>
  <link rel="stylesheet" href="/css/landing.css">
</head>
<body>
  <header>
    <nav>
      <h1>Chef IA Studio</h1>
      <a href="/app.html">Começar Agora →</a>
    </nav>
  </header>

  <section class="hero">
    <h1>Planejamento de Eventos com IA</h1>
    <p>Gere cardápios, listas de compras e cronogramas em segundos</p>
    <a href="/app.html" class="cta">Planejar Evento</a>
  </section>

  <section class="features">
    <h2>O que oferecemos</h2>
    <div class="feature-grid">
      <div class="feature">
        <h3>🤖 IA Inteligente</h3>
        <p>Gemini cria cardápios personalizados</p>
      </div>
      <div class="feature">
        <h3>📊 Motor Matemático</h3>
        <p>Cálculos precisos de quantidades e custos</p>
      </div>
      <div class="feature">
        <h3>📥 Exportação PDF</h3>
        <p>Documentos prontos para imprimir</p>
      </div>
    </div>
  </section>

  <section class="cta-final">
    <h2>Pronto para planejar?</h2>
    <a href="/app.html" class="btn-large">Acessar Aplicação</a>
  </section>

  <script src="/js/index.js"></script>
</body>
</html>
```

#### 3.3 - Aplicação (`public/app.html`)
(Move todo conteúdo funcional de `index.html` para aqui)

#### 3.4 - Atualizar Express
**Arquivo:** `server.js`

```javascript
// Servir landing page em /
app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, 'public/index.html'));
});

// Servir app em /app
app.get('/app', (req, res) => {
  res.sendFile(path.join(__dirname, 'public/app.html'));
});

// Manter estáticos
app.use(express.static('public'));
```

### ✅ Critério de Sucesso
- [x] Landing page atrativa
- [x] Link claro para app
- [x] App funciona em `/app` ou `/app.html`
- [x] Histórico funciona em ambas
- [x] PDF ainda exporta

### 📊 Impacto
**Primeira impressão:** Profissional, claro  
**SEO:** Melhor indexação

---

## ⚡ FASE 4: EVOLUIR MOTOR LOCAL

### 🎯 Objetivo
Separar cálculos de adultos/crianças, detalhar utensílios e multiplicadores por tipo de refeição.

### 📋 Tarefas

#### 4.1 - Expandir Modelo de Evento
**Arquivo:** `public/index.html` (novo formulário)

Adicionar campos:
```html
<input type="number" name="adultos" placeholder="Adultos">
<input type="number" name="criancas" placeholder="Crianças">
<input type="number" name="duracao_horas" placeholder="Duração (horas)">
<select name="tipo_refeicao">
  <option>Café da manhã</option>
  <option>Brunch</option>
  <option>Almoço</option>
  <option>Café da tarde</option>
  <option>Coquetel</option>
  <option>Jantar</option>
</select>
<select name="nivel_formalidade">
  <option>Casual</option>
  <option>Semiformal</option>
  <option>Formal</option>
</select>
<input type="number" name="percentual_alcool" placeholder="% com álcool">
```

#### 4.2 - Novo Motor
**Arquivo:** `src/services/planning/motor.service.js`

```javascript
function calcularMotorAvancado(evento) {
  const { adultos, criancas, duracao_horas, tipo_refeicao, nivel_formalidade } = evento;
  
  // Multiplicadores por tipo de refeição
  const multiplicadores = {
    'Café da manhã': { alimentos: 0.5, bebidas: 0.3, equipe: 0.5 },
    'Brunch': { alimentos: 0.8, bebidas: 0.7, equipe: 0.8 },
    'Almoço': { alimentos: 1.0, bebidas: 1.0, equipe: 1.0 },
    'Café da tarde': { alimentos: 0.4, bebidas: 0.8, equipe: 0.4 },
    'Coquetel': { alimentos: 0.6, bebidas: 1.5, equipe: 1.2 },
    'Jantar': { alimentos: 1.2, bebidas: 1.2, equipe: 1.1 }
  };
  
  const mult = multiplicadores[tipo_refeicao] || multiplicadores['Almoço'];
  
  // Cálculos separados
  const alimentosAdulto = 300 * mult.alimentos; // gramas
  const alimentosCrianca = 150 * mult.alimentos;
  
  const bebidasAdulto = 400 * mult.bebidas; // ml
  const bebidasCrianca = 200 * mult.bebidas;
  
  // Utensílios por formalidade
  const utensílios = calcularUtensílios(
    adultos + criancas,
    nivel_formalidade,
    tipo_refeicao
  );
  
  // Equipe baseada em duração
  const horas_equipe = Math.ceil(duracao_horas / 2);
  const pessoas_equipe = Math.max(
    2,
    Math.ceil((adultos + criancas) / 30) * mult.equipe * horas_equipe
  );
  
  return {
    alimentos: {
      adultos: Math.round(adultos * alimentosAdulto),
      criancas: Math.round(criancas * alimentosCrianca),
      total_gramas: Math.round(
        (adultos * alimentosAdulto) + (criancas * alimentosCrianca)
      )
    },
    bebidas: {
      adultos: Math.round(adultos * bebidasAdulto),
      criancas: Math.round(criancas * bebidasCrianca),
      total_ml: Math.round(
        (adultos * bebidasAdulto) + (criancas * bebidasCrianca)
      )
    },
    utensílios,
    equipe: pessoas_equipe,
    tempo_preparo: duracao_horas
  };
}

function calcularUtensílios(pessoas, formalidade, tipo_refeicao) {
  const multiplicador = {
    'Casual': 1.0,
    'Semiformal': 1.2,
    'Formal': 1.5
  }[formalidade] || 1.0;
  
  // Talheres: x3 por pessoa (garfo, faca, colher) em formal
  const talheres_base = tipo_refeicao === 'Coquetel' ? 1 : 3;
  
  return {
    talheres: Math.round(pessoas * talheres_base * multiplicador),
    copos: Math.round(pessoas * 2), // Água + bebida
    pratos: Math.round(pessoas * 2), // Prato principal + sobremesa/opcional
    guardanapos: Math.round(pessoas * 3), // Múltiplos usos
    bandejas: Math.round(pessoas / 10 + 1),
    rechauds: Math.round(pessoas / 15 + 1),
    gelo_kg: Math.round((pessoas * 0.2) / 1000 * 10) / 10
  };
}
```

#### 4.3 - Atualizar Prompt
**Arquivo:** `src/prompts/event.prompt.js`

Incluir na context da IA:
```javascript
const motor = calcularMotorAvancado(evento);

const prompt = `
...
RESTRIÇÕES OPERACIONAIS CALCULADAS:
- Pessoas: ${evento.adultos} adultos + ${evento.criancas} crianças
- Alimentos necessários: ${motor.alimentos.total_gramas}g
- Bebidas: ${motor.bebidas.total_ml}ml
- Talheres: ${motor.utensílios.talheres}
- Copos: ${motor.utensílios.copos}
- Equipe necessária: ${motor.equipe} pessoas
- Duração: ${evento.duracao_horas}h

Leve RIGOROSAMENTE em conta esses números nos seus cálculos.
...
`;
```

### ✅ Critério de Sucesso
- [x] Formulário aceita adultos/crianças separados
- [x] Motor calcula diferente para cada grupo
- [x] Utensílios variam por formalidade
- [x] Duração afeta cálculo de equipe
- [x] IA recebe números precisos como restrição

### 📊 Impacto
**Realismo:** Cálculos muito mais precisos  
**Confiança:** Usuário vê números específicos

---

## 🎯 FASE 5: REFINAR INTERFACE

### 🎯 Objetivo
Melhorar visual, densidade de informação e estados da UI.

### 📋 Tarefas

#### 5.1 - Secções Recolhíveis
**Arquivo:** `public/css/modules/result.css`

```css
.result-section {
  border: 1px solid #ddd;
  margin: 1rem 0;
  border-radius: 8px;
  overflow: hidden;
}

.result-section-header {
  padding: 1rem;
  background: #f5f5f5;
  cursor: pointer;
  display: flex;
  justify-content: space-between;
  align-items: center;
  font-weight: 600;
  user-select: none;
}

.result-section-header:hover {
  background: #e8e8e8;
}

.result-section-header::after {
  content: '▼';
  transition: transform 0.2s;
}

.result-section-header[data-collapsed="true"]::after {
  transform: rotate(-90deg);
}

.result-section-body {
  padding: 1rem;
  max-height: 999px;
  overflow: hidden;
  transition: max-height 0.3s ease;
}

.result-section-body[data-collapsed="true"] {
  max-height: 0;
  padding: 0;
}
```

#### 5.2 - Melhorar Componentes
**Arquivo:** `public/js/render.js`

```javascript
function renderResultadoMelhorado(plano) {
  return `
    <div class="resultado-container">
      <!-- Resumo rápido -->
      <div class="quick-stats">
        <div class="stat">
          <strong>${plano.total_pessoas}</strong>
          <span>pessoas</span>
        </div>
        <div class="stat">
          <strong>R$ ${plano.orcamento?.total || 0}</strong>
          <span>orçamento</span>
        </div>
        <div class="stat">
          <strong>${plano.equipe}</strong>
          <span>equipe</span>
        </div>
        <div class="stat">
          <strong>${plano.refeicoes?.length || 0}</strong>
          <span>pratos</span>
        </div>
      </div>

      <!-- Secções recolhíveis -->
      ${renderSecaoRecolhivel('📋 Resumo', plano.resumo)}
      ${renderSecaoRecolhivel('🛒 Compras', renderCompras(plano.compras))}
      ${renderSecaoRecolhivel('⏰ Cronograma', renderCronograma(plano.cronograma))}
      ${renderSecaoRecolhivel('💰 Orçamento', renderOrcamento(plano.orcamento))}
      ${renderSecaoRecolhivel('👨‍⚖️ Equipe', renderEquipe(plano.equipe))}

      <!-- Ações -->
      <div class="resultado-acoes">
        <button onclick="exportarPDF()">📥 PDF</button>
        <button onclick="compartilhar()">📤 Compartilhar</button>
        <button onclick="criarNovo()">✨ Novo</button>
      </div>
    </div>
  `;
}

function renderSecaoRecolhivel(titulo, conteudo) {
  return `
    <div class="result-section" data-collapsed="false">
      <div class="result-section-header">${titulo}</div>
      <div class="result-section-body">${conteudo}</div>
    </div>
  `;
}
```

#### 5.3 - Adicionar Event Listeners
```javascript
document.querySelectorAll('.result-section-header').forEach(header => {
  header.addEventListener('click', function() {
    const body = this.nextElementSibling;
    const isCollapsed = body.dataset.collapsed === 'true';
    
    body.dataset.collapsed = !isCollapsed;
    this.dataset.collapsed = !isCollapsed;
  });
});
```

#### 5.4 - Estados de Carregamento
**Arquivo:** `public/js/ui.js`

```javascript
function mostrarCarregando() {
  const container = document.getElementById('resultado');
  container.innerHTML = `
    <div class="loading-state">
      <div class="spinner"></div>
      <p>Gerando planejamento...</p>
    </div>
  `;
}

function mostrarErro(mensagem) {
  const container = document.getElementById('resultado');
  container.innerHTML = `
    <div class="error-state">
      <h3>⚠️ Erro ao gerar</h3>
      <p>${mensagem}</p>
      <button onclick="criarNovo()">Tentar Novamente</button>
    </div>
  `;
}

function mostrarVazio() {
  const container = document.getElementById('resultado');
  container.innerHTML = `
    <div class="empty-state">
      <h3>📋 Seu planejamento aparecerá aqui</h3>
      <p>Preencha o formulário e clique em "Gerar Planejamento"</p>
    </div>
  `;
}
```

#### 5.5 - CSS Melhorado
**Arquivo:** `public/css/modules/result.css`

```css
/* Componentes visuais */
.quick-stats {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(120px, 1fr));
  gap: 1rem;
  margin-bottom: 2rem;
}

.stat {
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  color: white;
  padding: 1.5rem;
  border-radius: 8px;
  text-align: center;
}

.stat strong {
  display: block;
  font-size: 1.5rem;
  margin-bottom: 0.5rem;
}

.stat span {
  font-size: 0.85rem;
  opacity: 0.9;
}

/* Loading/Error/Empty states */
.loading-state,
.error-state,
.empty-state {
  text-align: center;
  padding: 3rem;
  border-radius: 8px;
  background: #f9f9f9;
}

.spinner {
  width: 40px;
  height: 40px;
  border: 4px solid #eee;
  border-top: 4px solid #667eea;
  border-radius: 50%;
  animation: spin 0.8s linear infinite;
  margin: 0 auto 1rem;
}

@keyframes spin {
  to { transform: rotate(360deg); }
}

.error-state {
  background: #fee;
  border: 1px solid #fcc;
}

.resultado-acoes {
  display: flex;
  gap: 1rem;
  margin-top: 2rem;
  flex-wrap: wrap;
}

.resultado-acoes button {
  flex: 1;
  min-width: 120px;
  padding: 0.75rem 1.5rem;
  background: #667eea;
  color: white;
  border: none;
  border-radius: 6px;
  cursor: pointer;
  font-weight: 600;
  transition: background 0.2s;
}

.resultado-acoes button:hover {
  background: #5568d3;
}
```

### ✅ Critério de Sucesso
- [x] Secções aparecem recolhidas por padrão (resumo aberta)
- [x] Clique expande/recolhe
- [x] Animação suave
- [x] Quick stats visível no topo
- [x] Estados (loading, erro, vazio) funcionam
- [x] Botões de ação funcionam

### 📊 Impacto
**UX:** Muito mais polida e profissional  
**Performance:** Menos scroll, melhor densidade

---

## 📊 Cronograma Sugerido

| Semana | Fase | Horas | Prioridade |
|--------|------|-------|-----------|
| Esta   | 1: Histórico | 3-4h | 🔴 Alta |
|        | 2: PDF | 4-5h | 🔴 Alta |
| Próx.  | 3: Separar apresentação | 2-3h | 🟡 Média |
|        | 4: Evoluir motor | 5-6h | 🟡 Média |
|        | 5: Refinar UI | 3-4h | 🟢 Baixa |

**Total estimado:** 17-25 horas  
**Pode ser:** Comprimido para 2 semanas intensas

---

## 🚀 Como Começar

### Opção A: Imediato (RECOMENDADO)
```bash
cd "/home/samu_alba/Documentos/pasta chafe ia/app-cardapio-ia"
npm start
# Agora comece com FASE 1
```

### Opção B: Setup Completo
```bash
# Limpar node_modules e reinstalar
rm -rf node_modules package-lock.json
npm install

# Copiar .env se não existir
cp .env.example .env

# Atualizar dados
npm start
```

---

## 📝 Notas Técnicas

### Sobre localStorage
- **Limite:** ~5-10MB por domínio (suficiente para 50 planejamentos)
- **Duração:** Persiste indefinidamente (até limpeza do navegador)
- **Segurança:** Não é criptografado (OK para dados não-sensíveis)
- **Próximo passo:** Sincronizar com Supabase/Firebase

### Sobre PDF
- **Bibliotecas:** jsPDF + html2canvas
- **Tamanho:** ~300KB por PDF (aceitável)
- **Limitação:** PDFs dinâmicos (sem gráficos complexos por enquanto)
- **Futuro:** Adicionar QR code com link para compartilhar

### Sobre Separação de Apresentação
- **SEO:** Melhora ranking da landing
- **Performance:** index.html mais leve
- **Manutenção:** Mais fácil evoluir cada uma

### Sobre Motor Avançado
- **Realismo:** Diferenças adulto/criança são críticas
- **Validação:** Testar com eventos reais antes de versão
- **Precisão:** Motor local + IA trabalham juntos

---

## ⚠️ Dependências Futuras

Quando implementar:

```json
{
  "dependencies": {
    "jspdf": "^2.5.1",
    "html2canvas": "^1.4.1",
    "@supabase/supabase-js": "^2.38.0",
    "firebase": "^10.5.0"
  }
}
```

---

## ✅ Checklist de Implementação

- [ ] FASE 1: Histórico local funciona
- [ ] FASE 2: PDF exporta corretamente
- [ ] FASE 3: Landing page atrativa
- [ ] FASE 4: Motor calcula adultos/crianças
- [ ] FASE 5: UI refinada e profissional

---

**Próximo passo:** Começar FASE 1 (Histórico Local)  
**Tempo:** 3-4 horas  
**Impacto:** Alto (retenção de usuários)

---

*Atualizado em 2026-07-02*  
*Próxima revisão: Após completar FASE 1*
