# Chef IA Studio

Aplicação web para planejamento inteligente de eventos com IA, geração de cardápios, listas de compras e relatórios.

## Estado atual

Projeto em fase de reorganização arquitetural:
- ✅ Frontend estático reorganizado em `public/`
- ✅ Backend Node.js + Express com tratamento robusto de JSON
- ✅ Integração com Gemini API no backend
- 🔄 Planejado: motor matemático local, histórico, PDF e imagens

## Stack

- HTML5, CSS3, JavaScript Vanilla
- Node.js (v18+)
- Express.js
- Google Gemini API
- GSAP (animações)
- Swiper (carrossel)
- jsPDF (relatórios)

## Instalação

### Requisitos

- Node.js LTS (v24.16.0 recomendado)
- npm
- Chave de API do Google Gemini

### Setup

```bash
# Clonar ou acessar o projeto
cd app-cardapio-ia

# Instalar dependências
npm install

# Criar arquivo .env
cat > .env << 'EOF'
PORT=3000
GEMINI_API_KEY=sua_chave_aqui
GOOGLE_API_KEY=sua_chave_aqui
AI_PROVIDER=gemini
EOF

# Iniciar servidor
npm start
```

Acesse: `http://localhost:3000`

## Variáveis de ambiente

Crie um arquivo `.env` na raiz do projeto:

```env
PORT=3000

# Provider principal
GEMINI_API_KEY=sua_chave_aqui
GOOGLE_API_KEY=sua_chave_aqui

# Seleção de provider
AI_PROVIDER=gemini
```

**Nunca commitar `.env` para git!**

## Estrutura do projeto

```
chef-ia-studio/
├── public/                    # Arquivos estáticos servidos
│   ├── index.html
│   ├── css/
│   │   └── style.css
│   ├── js/
│   │   └── app.js
│   └── assets/
├── src/                       # Lógica do backend
│   ├── services/
│   │   └── ai/
│   │       └── gemini.service.js
│   ├── utils/
│   │   ├── extract-json.js
│   │   └── validate-plan.js
│   ├── routes/
│   ├── controllers/
│   └── middleware/
├── legacy/                    # Versões anteriores
│   ├── simple-current/        # Backup da versão simples
│   └── advanced-claude-fragments/
├── server.js                  # Entry point do backend
├── package.json
└── README.md
```

## Funcionalidades

### Implementadas

- ✅ Gerador de cardápios via IA
- ✅ Captura de dados do evento (tipo, pessoas, restrições, estilo)
- ✅ Renderização de resultados (cardápio, lista de compras, utensílios, resumo)
- ✅ Tratamento robusto de JSON com fallback
- ✅ Interface responsiva com tema luxe

### Em desenvolvimento

- 🔄 Motor matemático local para cálculos confiáveis
- 🔄 Lista de compras organizada por setor
- 🔄 Exportação em PDF
- 🔄 Histórico local com localStorage

### Futuras

- ⏳ Imagens via Unsplash/Pexels
- ⏳ Envio por e-mail via EmailJS
- ⏳ Autenticação e banco de dados
- ⏳ Painel administrativo
- ⏳ Multi-provider (OpenAI, OpenRouter)

## Fluxo de dados

```
Frontend (HTML/CSS/JS)
         ↓
    POST /gerar-cardapio
         ↓
    Backend Express
         ↓
    Gemini API
         ↓
    Resposta (JSON)
         ↓
    Validação + Fallback
         ↓
    Frontend renderiza resultado
```

## Desenvolvimento

### Testando a API

```bash
curl -X POST http://localhost:3000/gerar-cardapio \
  -H "Content-Type: application/json" \
  -d '{"prompt":"Planeje um evento de casamento para 50 pessoas"}'
```

### Checklist antes de publicar

- [ ] `npm install` roda sem erro
- [ ] `npm start` sobe o servidor
- [ ] `GET /` abre a aplicação
- [ ] `POST /gerar-cardapio` responde JSON válido
- [ ] Nenhuma chave exposta no frontend
- [ ] `.env` está no `.gitignore`
- [ ] Sem chamadas diretas a providers do navegador
- [ ] Fallback JSON trata respostas ruins

## Roadmap

### Semana 1-2: Estabilização Base
- [x] Corrigir HTML e estrutura
- [x] Reorganizar em `public/` e `src/`
- [x] Adicionar tratamento robusto de JSON

### Semana 3-4: Motor Local
- [ ] Implementar cálculos locais
- [ ] Integrar com respostas da IA
- [ ] Validação de dados

### Semana 5-6: Recursos
- [ ] Histórico com localStorage
- [ ] Exportação em PDF
- [ ] Imagens

### Semana 7+: Produção
- [ ] Temas adicionais
- [ ] Deploy inicial
- [ ] Documentação final

## Comandos úteis

```bash
# Iniciar servidor em desenvolvimento
npm start

# Limpar e reinstalar dependências
rm -rf node_modules package-lock.json
npm install

# Ver estrutura de pastas
ls -la public/ src/

# Verificar logs
tail -f /tmp/npm-start.log
```

## Notas de segurança

1. **Nunca exponha chaves no frontend**
2. **Todas as chamadas de IA devem passar pelo backend**
3. **Validar e sanitizar inputs sempre**
4. **Rate limit nas rotas públicas** (futuro)
5. **CORS explícito quando separar frontend/backend** (futuro)

## Autor & Licença

Projeto de portfólio - Uso privado

Para questões técnicas, abra uma issue ou entre em contato.

---

**Última atualização**: 2026-06-14  
**Status**: Em desenvolvimento (Fase 1 - Estabilização)
