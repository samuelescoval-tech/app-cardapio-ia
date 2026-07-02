# Chef IA Studio

Aplicação web para planejamento inteligente de eventos com IA, combinando um **motor local de logística** com geração de planejamento usando **Google Gemini API**.

O sistema permite informar dados de um evento e gerar um planejamento com cardápio, lista de compras, utensílios, cronograma, equipe, orçamento estimado e resumo final.

---

## Status do projeto

Projeto em desenvolvimento, atualmente em fase de **estabilização técnica e organização para portfólio**.

### Já implementado

* Frontend organizado em `public/`
* Backend Node.js + Express
* Integração com Gemini API pelo backend
* Rota de status da aplicação
* Rota para geração de planejamento
* Motor local de logística e cálculos operacionais
* Prompt estruturado no backend
* Tratamento e validação básica de JSON retornado pela IA
* Renderização modular dos resultados
* Histórico local com `localStorage`
* Estrutura inicial de documentação e variáveis de ambiente

### Em melhoria

* Validação mais forte dos dados de entrada
* Refinamento dos cálculos do motor local
* Melhorias no relatório/PDF
* Melhor organização visual dos resultados
* Logs mais claros no backend
* Migração futura do SDK Gemini legado para SDK mais atual
* Preparação para deploy público

### Futuro

* Imagens via upload ou API gratuita
* Exportação em PDF mais completa
* Envio de relatório por e-mail
* Banco de dados
* Autenticação de usuários
* Painel administrativo
* Deploy público
* Possível versão SaaS no futuro

---

## Stack utilizada

### Frontend

* HTML5
* CSS3
* JavaScript Vanilla
* GSAP
* Swiper
* jsPDF
* pptxgenjs

### Backend

* Node.js
* Express.js
* dotenv
* Google Gemini API

### Armazenamento atual

* `localStorage` para histórico local

---

## Estrutura do projeto

```txt
app-cardapio-ia/
├── public/
│   ├── index.html
│   ├── css/
│   │   └── style.css
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
├── server.js
├── package.json
├── package-lock.json
├── .env.example
├── .gitignore
└── README.md
```

---

## Como funciona

Fluxo principal:

```txt
Usuário preenche o formulário
↓
Frontend envia dados do evento
↓
Backend recebe em /gerar-cardapio
↓
Motor local calcula logística base
↓
Backend monta prompt estruturado
↓
Gemini gera planejamento
↓
Backend valida/normaliza resposta
↓
Frontend renderiza o relatório
↓
Histórico é salvo no localStorage
```

---

## Requisitos

* Node.js
* npm
* Conta no Google AI Studio
* Chave da Gemini API

---

## Instalação

Clone o repositório:

```bash
git clone https://github.com/samuelescoval-tech/app-cardapio-ia.git
cd app-cardapio-ia
```

Instale as dependências:

```bash
npm install
```

Crie o arquivo `.env` a partir do exemplo:

```bash
cp .env.example .env
```

Edite o `.env` e configure sua chave:

```env
PORT=3000
GEMINI_API_KEY=sua_chave_aqui
GOOGLE_API_KEY=sua_chave_aqui
AI_PROVIDER=gemini
GEMINI_MODEL=gemini-flash-lite-latest
```

Inicie o servidor:

```bash
npm start
```

Acesse no navegador:

```txt
http://localhost:3000
```

---

## Rotas disponíveis

### Status da aplicação

```txt
GET /api/status
```

Retorna o estado básico da aplicação, incluindo configuração da IA e motor local.

### Gerar planejamento

```txt
POST /gerar-cardapio
```

Exemplo de corpo esperado:

```json
{
  "evento": {
    "tipo": "Casamento",
    "pessoas": "50",
    "duracao": "5",
    "refeicao": "Almoço ou jantar",
    "restricoes": "Sem lactose",
    "tema": "Clássico",
    "orcamentoBase": "R$ 5000",
    "alcool": "Com álcool moderado",
    "estilo": "Elegante",
    "obs": "Preferência por comida brasileira"
  }
}
```

---

## Variáveis de ambiente

O arquivo `.env` não deve ser enviado para o GitHub.

Use `.env.example` como referência.

### Obrigatórias agora

```env
PORT=3000
GEMINI_API_KEY=sua_chave_aqui
AI_PROVIDER=gemini
```

### Compatibilidade

```env
GOOGLE_API_KEY=sua_chave_aqui
```

### Futuras/opcionais

```env
OPENAI_API_KEY=
OPENROUTER_API_KEY=
UNSPLASH_ACCESS_KEY=
PEXELS_API_KEY=
EMAILJS_PUBLIC_KEY=
SUPABASE_URL=
FIREBASE_API_KEY=
```

Essas chaves não são necessárias para rodar a versão atual.

---

## Funcionalidades principais

### Motor local de logística

O projeto possui um motor local responsável por calcular:

* quantidade base de comida;
* salgados/canapés;
* doces/sobremesas;
* bebidas;
* equipe;
* espaço estimado;
* utensílios;
* custo por pessoa;
* estimativa total.

A IA não substitui esses cálculos. Ela complementa o planejamento.

### Integração com IA

A IA é usada para gerar:

* cardápio;
* receitas;
* lista de compras;
* locais sugeridos;
* layout;
* decoração;
* cronograma;
* equipe;
* entretenimento;
* lembrancinhas;
* checklist;
* orçamento;
* resumo final.

### Histórico local

Os planejamentos gerados podem ser salvos no navegador usando `localStorage`.

---

## Segurança

Boas práticas já consideradas:

* Chaves ficam no backend, nunca no frontend.
* `.env` está no `.gitignore`.
* Chamadas para a IA passam pelo servidor Express.
* Resposta da IA passa por extração e validação básica de JSON.
* Conteúdo renderizado usa escape HTML em pontos importantes.

Melhorias futuras:

* Rate limit nas rotas públicas.
* Validação forte de entrada.
* Logs estruturados.
* CORS configurado para produção.
* Autenticação, caso o projeto vire produto público.

---

## Comandos úteis

Iniciar servidor:

```bash
npm start
```

Reinstalar dependências:

```bash
rm -rf node_modules package-lock.json
npm install
```

Verificar estrutura:

```bash
ls -la public/ src/
```

Testar status:

```bash
curl http://localhost:3000/api/status
```

Testar geração via API:

```bash
curl -X POST http://localhost:3000/gerar-cardapio \
  -H "Content-Type: application/json" \
  -d '{
    "evento": {
      "tipo": "Casamento",
      "pessoas": "50",
      "duracao": "5",
      "refeicao": "Almoço ou jantar",
      "restricoes": "Nenhuma",
      "tema": "Clássico",
      "orcamentoBase": "R$ 5000",
      "alcool": "Com álcool moderado",
      "estilo": "Elegante",
      "obs": "Evento familiar com jantar completo"
    }
  }'
```

---

## Checklist de desenvolvimento

Antes de avançar para novas funcionalidades:

* [ ] `npm install` roda sem erro
* [ ] `npm start` sobe o servidor
* [ ] `GET /api/status` responde corretamente
* [ ] Página inicial abre em `http://localhost:3000`
* [ ] Formulário envia dados ao backend
* [ ] Gemini responde
* [ ] Resultado aparece na tela
* [ ] Histórico local salva o planejamento
* [ ] Nenhuma chave foi enviada ao GitHub
* [ ] Console do navegador sem erro crítico
* [ ] Terminal sem erro crítico

---

## Roadmap realista

### Fase 1 — Estabilização

* Testar o projeto localmente
* Corrigir erros de execução
* Atualizar README
* Validar `.env.example`
* Confirmar funcionamento do fluxo completo

### Fase 2 — Qualidade técnica

* Melhorar validação de entrada
* Melhorar mensagens de erro
* Melhorar logs
* Refinar motor local
* Revisar renderização dos resultados

### Fase 3 — Portfólio

* Melhorar apresentação visual
* Criar prints ou GIF de demonstração
* Escrever descrição para LinkedIn
* Preparar deploy gratuito
* Ajustar documentação para recrutadores/devs

### Fase 4 — Funcionalidades futuras

* PDF mais completo
* Imagens
* Envio por e-mail
* Banco de dados
* Login
* Painel administrativo

### Fase 5 — Produto

Somente depois de estabilizar o projeto como portfólio:

* Controle de usuários
* Limites de uso
* Logs profissionais
* Segurança de produção
* Pagamentos
* Planos
* SaaS

---

## Observação sobre monetização

O Chef IA Studio tem potencial para evoluir para produto, consultoria ou template.

No estágio atual, a prioridade é:

```txt
1. Funcionamento local
2. Código organizado
3. Documentação clara
4. Demonstração pública
5. Portfólio
```

Monetização deve ser considerada uma etapa futura, não o foco imediato.

---

## Autor

Samuel Santos
GitHub: `samuelescoval-tech`

---

**Status atual:** Em desenvolvimento — fase de estabilização e portfólio
**Última atualização sugerida:** 2026-07
