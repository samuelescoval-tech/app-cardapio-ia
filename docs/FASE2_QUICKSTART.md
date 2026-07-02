# 🚀 FASE 2: PDF Export — Quick Start Guide

## 🎯 Objetivo
Adicionar capacidade de exportar planejamento completo como PDF com cardápio, logística, compras, equipe e orçamento.

## 📦 Dependências Necessárias
```bash
npm install jspdf html2canvas
```

## 🏗️ Plano de Implementação

### 1. Criar Controller PDF (30 min)
**File**: `/src/controllers/pdf.controller.js`
```javascript
const jsPDF = require('jspdf');
const canvas = require('html2canvas');

async function exportarPDF(req, res) {
  try {
    const { plano, tipo, pessoas } = req.body;
    
    // Renderizar HTML do planejamento
    const html = construirHTMLPDF(plano, tipo, pessoas);
    
    // Converter para canvas
    const canvas = await html2canvas(html);
    
    // Gerar PDF
    const pdf = new jsPDF();
    pdf.addImage(canvas.toDataURL(), 'PNG', 10, 10, 190, 277);
    
    // Enviar resposta
    res.contentType('application/pdf');
    res.send(pdf.output('arraybuffer'));
  } catch (error) {
    res.status(500).json({ erro: error.message });
  }
}
```

### 2. Adicionar Rota (10 min)
**File**: `/src/routes/pdf.routes.js` (NOVO)
```javascript
const express = require('express');
const pdfController = require('../controllers/pdf.controller');

router.post('/exportar-pdf', pdfController.exportarPDF);

module.exports = router;
```

### 3. Integrar em server.js (5 min)
```javascript
const pdfRoutes = require('./src/routes/pdf.routes');
app.use('/', pdfRoutes);
```

### 4. Frontend: Adicionar Botão (20 min)
**File**: `/public/js/app.js`
- Novo botão "📥 Exportar PDF" no resultado
- Click handler chama `/exportar-pdf`
- Dispara download: `planejamento-${tipo}-${data}.pdf`

### 5. CSS: Estilizar Botão (10 min)
**File**: `/public/css/modules/result.css`
```css
.btn-export-pdf {
  background: linear-gradient(135deg, #d32f2f, #ff6f00);
  color: white;
  padding: 10px 20px;
  border-radius: 4px;
  cursor: pointer;
  font-weight: bold;
}
```

## 📊 Estimativa de Tempo
- Controller PDF: 30 min
- Rota: 10 min
- Integração server: 5 min
- Button frontend: 20 min
- Testes browser: 30 min
- **Total: 1h 35min (ou 4-5h com refinamentos)**

## ✅ Checklist de Conclusão
- [ ] jsPDF + html2canvas instalados
- [ ] `/src/controllers/pdf.controller.js` criado
- [ ] `/src/routes/pdf.routes.js` criado
- [ ] Rota integrada em server.js
- [ ] Botão adicionado ao resultado
- [ ] CSS estilizado
- [ ] Teste no browser: gerar → clicar export → PDF baixa
- [ ] Renomear para: `planejamento-{tipo}-{data}.pdf`
- [ ] Documento FASE2_COMPLETA.md criado

## 🧪 Teste de Validação
1. Gerar planejamento
2. Ver resultado com botão "📥 Exportar PDF"
3. Clicar botão
4. PDF baixa com nome: `planejamento-casamento-2024-07-02.pdf`
5. Abrir PDF: deve conter cardápio, logística, compras, equipe, orçamento

## 📝 Notas
- Usar html2canvas com `scale: 2` para melhor qualidade
- PDF em A4 landscape para tabelas caberem melhor
- Incluir header com: tipo, pessoas, data, orçamento
- Footer com: "Gerado por Chef IA Studio"

## 🔗 Referência
- Docs FASE1: [FASE1_COMPLETA.md](./FASE1_COMPLETA.md)
- jsPDF Docs: https://github.com/parallax/jsPDF
- html2canvas Docs: https://html2canvas.hertzen.com/

## 🎯 Após FASE 2
Prosseguir para FASE 3: Separar Apresentação (Landing Page + App)
