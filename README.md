# Chef IA Studio

Aplicacao web para planejamento de eventos com IA. O sistema combina um motor local de calculos operacionais com o Gemini no backend para gerar cardapio, lista de compras, cronograma, equipe, utensilios, orcamento e resumo do evento.

## Estado Atual

Projeto em fase de portfolio/MVP local. A prioridade atual e rodar bem, manter a arquitetura organizada, documentar o estado real e melhorar por etapas pequenas.

### Implementado

- Frontend estatico em `public/`
- Backend Node.js + Express
- Rota `GET /api/status`
- Rota `POST /gerar-cardapio`
- Integracao com Gemini pelo backend
- Prompt principal em `src/prompts/event.prompt.js`
- Prompt backend estruturado pela Arquitetura Residencial de Prompts como metodologia interna e proporcional
- Motor local em `src/services/planning/motor.service.js`
- Tratamento de JSON com extracao, normalizacao, validacao e fallback
- Renderizacao modular em `public/js/render.js`
- Historico local com `localStorage`
- Exportacao PDF inicial com `jsPDF`
- Estrutura CSS modular em `public/css/modules/`
- Modal de acesso demo com `DEMO_ACCESS_KEY`, `sessionStorage` e header `x-demo-access-key`

### Em melhoria

- Validacao de entrada
- Refinamento visual do relatorio/PDF
- Melhorias de layout e responsividade
- Testes manuais recorrentes
- Logs mais profissionais
- Migracao futura do SDK Gemini legado

### Futuro

- Deploy publico
- Banco de dados
- Login
- Controle de uso
- E-mail
- Pagamentos
- Monetizacao

## Stack

- HTML5, CSS3 e JavaScript Vanilla
- Node.js
- Express
- Google Gemini API
- `@google/generative-ai`
- Bibliotecas visuais via CDN no frontend: jsPDF, PptxGenJS, GSAP e Swiper

## Setup Local

### Requisitos

- Node.js e npm
- Chave do Google AI Studio / Gemini

### Instalar e rodar

```bash
cd app-cardapio-ia
npm install
cp .env.example .env
npm start
```

Depois acesse:

```text
http://localhost:3000
http://localhost:3000/api/status
```

## Variaveis de Ambiente

Arquivo `.env` minimo:

```env
PORT=3000
GEMINI_API_KEY=sua_chave_aqui
GOOGLE_API_KEY=sua_chave_aqui
AI_PROVIDER=gemini
GEMINI_MODEL=gemini-flash-lite-latest

# Opcional para teste externo temporario
DEMO_ACCESS_KEY=sua_senha_temporaria
```

`GEMINI_API_KEY` e o nome preferido. `GOOGLE_API_KEY` pode ser mantido por compatibilidade.

Nunca commitar `.env`.

## Estrutura Principal

```text
app-cardapio-ia/
├── public/
│   ├── index.html
│   ├── css/
│   │   ├── style.css
│   │   └── modules/
│   └── js/
│       ├── storage.service.js
│       ├── utils.js
│       ├── render.js
│       └── app.js
├── src/
│   ├── prompts/
│   │   └── event.prompt.js
│   ├── services/
│   │   ├── ai/
│   │   │   └── gemini.service.js
│   │   └── planning/
│   │       └── motor.service.js
│   └── utils/
│       ├── extract-json.js
│       └── validate-plan.js
├── docs/
├── server.js
├── package.json
├── package-lock.json
├── .env.example
└── README.md
```

## Fluxo de Dados

```text
Frontend
  ↓ POST /gerar-cardapio
Backend Express
  ↓ calcula motor local
Prompt backend com metodologia interna
  ↓ chama Gemini
Extracao + normalizacao + validacao JSON
  ↓ aplica motor local ao plano
Frontend renderiza resultado
  ↓ salva historico local
```

Motor local = numeros operacionais.
Gemini = criatividade, detalhamento e organizacao do planejamento.
Arquitetura Residencial de Prompts = estrutura interna do prompt, sem aparecer como conteudo final para o usuario.

## Testes Manuais

```bash
npm start
```

```bash
curl http://localhost:3000/api/status
```

Teste principal no navegador:

1. Abrir `http://localhost:3000`
2. Preencher o formulario
3. Clicar em `CALCULAR + GERAR PLANEJAMENTO COMPLETO`
4. Verificar se o resultado aparece
5. Verificar se o historico salva localmente

Validacao feita em 2026-07-02:

- `GET /api/status` respondeu `ok: true`
- `POST /gerar-cardapio` respondeu `ok: true`
- Gemini configurado com `gemini-flash-lite-latest`
- Motor local aplicado ao plano
- `meta.tempo_ms` corrigido para representar duracao real da chamada
- Exportacao PDF textual validada por simulacao local com `jsPDF`
- Fluxo completo validado em Chrome headless: formulario, geracao, historico e PDF
- Download real de PDF confirmado em `/tmp/chef-ia-downloads/chef-ia-download-teste.pdf`
- PDF refinado com cabecalho visual, cards de resumo, secoes destacadas e rodape
- PDF expandido com dados do evento, receitas, utensilios, local, layout, decoracao, entretenimento, lembrancinhas, checklist e cenarios de orcamento
- PDF agora mantem as secoes principais mesmo quando algum bloco vier vazio, exibindo mensagem de "Nao informado"

Validacao feita em 2026-07-08:

- `src/prompts/event.prompt.js`, `src/utils/validate-plan.js`, `server.js`, `gemini.service.js` e `motor.service.js` passaram em `node --check`
- Teste local confirmou prompt com camadas internas da metodologia e normalizacao de arrays/decoracao/checklist
- `GET /api/status` respondeu `ok: true` com motor local e prompt backend ativos
- Chamada real ao Gemini com motor local + prompt backend atual respondeu `ok: true`, `schema_ok: true`, 9 itens de cardapio, 12 compras, 4 locais e 6 momentos no cronograma
- Modal de acesso demo substituiu o `prompt()` nativo; `GET /api/status` confirmou demo ativa, requisicao sem senha retornou 401 e senha incorreta retornou 401
- `POST /gerar-cardapio` com `DEMO_ACCESS_KEY` correta respondeu status 200, `ok: true`, `schema_ok: true`, `motor_local: true`, `prompt_backend: true`, 8 itens de cardapio, 12 compras e 6 momentos no cronograma

## Cuidados

- Nao chamar Gemini diretamente pelo frontend
- Nao expor chaves no navegador
- Nao remover o motor local
- Nao mover o prompt principal para o frontend
- Manter a metodologia de prompt proporcional: ela deve organizar o plano, nao aparecer mais que o evento
- Evitar novas dependencias sem necessidade clara
- Atualizar documentacao existente quando o estado real mudar
- Tratar monetizacao como fase futura, nao prioridade atual
- Para liberar teste por link temporario, usar `DEMO_ACCESS_KEY` e manter o tunel aberto por pouco tempo

## Licenca

Projeto de portfolio e estudo. Uso privado.

---

Ultima atualizacao: 2026-07-08
