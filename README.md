# Chef IA Studio

O **Chef IA Studio** é uma aplicação web para planejamento inteligente de eventos com apoio de Inteligência Artificial.

A proposta do projeto é permitir que o usuário informe os dados principais de um evento e receba um planejamento inicial com:

* cardápio;
* lista de compras;
* utensílios;
* cronograma;
* equipe sugerida;
* orçamento estimado;
* decoração;
* checklist;
* resumo final do evento.

O projeto combina duas partes principais:

```txt
Motor local de logística + Inteligência Artificial
```

O **motor local** faz cálculos operacionais básicos, como quantidade de comida, bebidas, equipe, espaço e utensílios.

A **IA** complementa o planejamento com sugestões criativas, organização do cardápio, receitas, decoração, cronograma, checklist e apresentação final.

---

## Status atual

Este projeto está em desenvolvimento e atualmente está na fase de **estabilização técnica e organização para portfólio**.

Ele ainda não é um SaaS pronto, nem um produto comercial finalizado.

A prioridade atual é:

```txt
funcionar → organizar → documentar → testar → melhorar → publicar como portfólio
```

---

## Estado real do projeto

### Já implementado

* Frontend separado em [`public/`](https://github.com/samuelescoval-tech/app-cardapio-ia/tree/main/public)
* Backend com Node.js e Express em [`server.js`](https://github.com/samuelescoval-tech/app-cardapio-ia/blob/main/server.js)
* Integração com Gemini pelo backend em [`src/services/ai/gemini.service.js`](https://github.com/samuelescoval-tech/app-cardapio-ia/blob/main/src/services/ai/gemini.service.js)
* Motor local de logística em [`src/services/planning/motor.service.js`](https://github.com/samuelescoval-tech/app-cardapio-ia/blob/main/src/services/planning/motor.service.js)
* Prompt estruturado no backend em [`src/prompts/event.prompt.js`](https://github.com/samuelescoval-tech/app-cardapio-ia/blob/main/src/prompts/event.prompt.js)
* Extração de JSON da IA em [`src/utils/extract-json.js`](https://github.com/samuelescoval-tech/app-cardapio-ia/blob/main/src/utils/extract-json.js)
* Validação e fallback do plano em [`src/utils/validate-plan.js`](https://github.com/samuelescoval-tech/app-cardapio-ia/blob/main/src/utils/validate-plan.js)
* Renderização modular dos resultados em [`public/js/render.js`](https://github.com/samuelescoval-tech/app-cardapio-ia/blob/main/public/js/render.js)
* Histórico local usando `localStorage` em [`public/js/storage.service.js`](https://github.com/samuelescoval-tech/app-cardapio-ia/blob/main/public/js/storage.service.js)
* Funções auxiliares no frontend em [`public/js/utils.js`](https://github.com/samuelescoval-tech/app-cardapio-ia/blob/main/public/js/utils.js)
* Modelo de variáveis de ambiente em [`.env.example`](https://github.com/samuelescoval-tech/app-cardapio-ia/blob/main/.env.example)
* Proteção de arquivos sensíveis em [`.gitignore`](https://github.com/samuelescoval-tech/app-cardapio-ia/blob/main/.gitignore)

### Ainda precisa melhorar

* Validação dos dados de entrada
* Logs do backend
* Mensagens de erro para o usuário
* Exportação em PDF
* Refinamento visual dos resultados
* Deploy público
* Documentação complementar
* Migração futura do SDK Gemini
* Testes manuais mais organizados

---

## Visão geral da arquitetura

O projeto funciona com uma arquitetura simples de frontend + backend.

```txt
Usuário
↓
Interface em HTML/CSS/JS
↓
Backend Express
↓
Motor local de planejamento
↓
Prompt estruturado
↓
Gemini API
↓
Extração e validação do JSON
↓
Renderização do planejamento
↓
Histórico local
```

A IA **não é chamada diretamente pelo navegador**.

Isso é importante porque a chave da API deve ficar protegida no backend.

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

## Mapa dos arquivos principais

Esta seção explica onde cada parte importante do projeto está localizada e qual é a função de cada arquivo.

| Arquivo                                                                                                                                            | Função                                                                                                                |
| -------------------------------------------------------------------------------------------------------------------------------------------------- | --------------------------------------------------------------------------------------------------------------------- |
| [`server.js`](https://github.com/samuelescoval-tech/app-cardapio-ia/blob/main/server.js)                                                           | Arquivo principal do backend. Cria o servidor Express, serve a pasta `public/` e define as rotas da aplicação.        |
| [`package.json`](https://github.com/samuelescoval-tech/app-cardapio-ia/blob/main/package.json)                                                     | Lista as dependências do projeto e os scripts de execução.                                                            |
| [`package-lock.json`](https://github.com/samuelescoval-tech/app-cardapio-ia/blob/main/package-lock.json)                                           | Registra as versões exatas instaladas das dependências.                                                               |
| [`.env.example`](https://github.com/samuelescoval-tech/app-cardapio-ia/blob/main/.env.example)                                                     | Modelo de configuração das variáveis de ambiente. Não contém keys reais.                                              |
| [`.gitignore`](https://github.com/samuelescoval-tech/app-cardapio-ia/blob/main/.gitignore)                                                         | Define arquivos que não devem ir para o GitHub, como `.env`, `node_modules` e logs.                                   |
| [`public/index.html`](https://github.com/samuelescoval-tech/app-cardapio-ia/blob/main/public/index.html)                                           | Estrutura principal da interface. Contém o formulário, a navegação, a área de resultados e a apresentação do projeto. |
| [`public/css/style.css`](https://github.com/samuelescoval-tech/app-cardapio-ia/blob/main/public/css/style.css)                                     | Estilos visuais da aplicação. Controla layout, cores, responsividade, cards e aparência geral.                        |
| [`public/js/app.js`](https://github.com/samuelescoval-tech/app-cardapio-ia/blob/main/public/js/app.js)                                             | Controla a interação principal do usuário: formulário, botão de gerar, navegação e chamada ao backend.                |
| [`public/js/render.js`](https://github.com/samuelescoval-tech/app-cardapio-ia/blob/main/public/js/render.js)                                       | Renderiza o planejamento gerado pela IA na tela.                                                                      |
| [`public/js/storage.service.js`](https://github.com/samuelescoval-tech/app-cardapio-ia/blob/main/public/js/storage.service.js)                     | Gerencia o histórico local dos planejamentos usando `localStorage`.                                                   |
| [`public/js/utils.js`](https://github.com/samuelescoval-tech/app-cardapio-ia/blob/main/public/js/utils.js)                                         | Funções auxiliares usadas no frontend, como normalização, cálculo e escape de HTML.                                   |
| [`src/services/planning/motor.service.js`](https://github.com/samuelescoval-tech/app-cardapio-ia/blob/main/src/services/planning/motor.service.js) | Motor local de logística. Calcula quantidades, equipe, utensílios, bebidas, espaço e estimativas.                     |
| [`src/prompts/event.prompt.js`](https://github.com/samuelescoval-tech/app-cardapio-ia/blob/main/src/prompts/event.prompt.js)                       | Monta o prompt enviado para a IA com base nos dados do evento e no motor local.                                       |
| [`src/services/ai/gemini.service.js`](https://github.com/samuelescoval-tech/app-cardapio-ia/blob/main/src/services/ai/gemini.service.js)           | Serviço responsável pela comunicação com a Gemini API.                                                                |
| [`src/utils/extract-json.js`](https://github.com/samuelescoval-tech/app-cardapio-ia/blob/main/src/utils/extract-json.js)                           | Extrai JSON válido da resposta da IA, mesmo quando a resposta vem com texto extra.                                    |
| [`src/utils/validate-plan.js`](https://github.com/samuelescoval-tech/app-cardapio-ia/blob/main/src/utils/validate-plan.js)                         | Valida e normaliza o planejamento retornado pela IA.                                                                  |

---

## Fluxo principal por arquivo

Abaixo está o caminho que os dados percorrem dentro do projeto.

---

### 1. Interface inicial

O usuário acessa:

```txt
http://localhost:3000
```

O backend serve o arquivo:

[`public/index.html`](https://github.com/samuelescoval-tech/app-cardapio-ia/blob/main/public/index.html)

Esse arquivo carrega:

* [`public/css/style.css`](https://github.com/samuelescoval-tech/app-cardapio-ia/blob/main/public/css/style.css)
* [`public/js/storage.service.js`](https://github.com/samuelescoval-tech/app-cardapio-ia/blob/main/public/js/storage.service.js)
* [`public/js/utils.js`](https://github.com/samuelescoval-tech/app-cardapio-ia/blob/main/public/js/utils.js)
* [`public/js/render.js`](https://github.com/samuelescoval-tech/app-cardapio-ia/blob/main/public/js/render.js)
* [`public/js/app.js`](https://github.com/samuelescoval-tech/app-cardapio-ia/blob/main/public/js/app.js)

---

### 2. Formulário do evento

O formulário principal fica em:

[`public/index.html`](https://github.com/samuelescoval-tech/app-cardapio-ia/blob/main/public/index.html)

Campos principais:

```txt
tipo
pessoas
duracao
refeicao
restricoes
tema
orcamentoBase
alcool
estilo
userChat
```

Esses campos são lidos em:

[`public/js/app.js`](https://github.com/samuelescoval-tech/app-cardapio-ia/blob/main/public/js/app.js)

---

### 3. Envio para o backend

Quando o usuário clica no botão de gerar planejamento, o arquivo:

[`public/js/app.js`](https://github.com/samuelescoval-tech/app-cardapio-ia/blob/main/public/js/app.js)

envia os dados para:

```txt
POST /gerar-cardapio
```

Essa rota está definida em:

[`server.js`](https://github.com/samuelescoval-tech/app-cardapio-ia/blob/main/server.js)

---

### 4. Cálculo local

Antes da IA gerar o planejamento, o backend chama o motor local:

[`src/services/planning/motor.service.js`](https://github.com/samuelescoval-tech/app-cardapio-ia/blob/main/src/services/planning/motor.service.js)

Esse motor calcula dados como:

* quantidade de salgados;
* quantidade de doces;
* comida principal;
* bebidas;
* equipe;
* espaço estimado;
* utensílios;
* custo por pessoa;
* estimativa total.

Esses cálculos servem como base operacional do evento.

---

### 5. Montagem do prompt

Depois do cálculo local, o backend monta o prompt usando:

[`src/prompts/event.prompt.js`](https://github.com/samuelescoval-tech/app-cardapio-ia/blob/main/src/prompts/event.prompt.js)

Esse arquivo organiza os dados do evento e o resumo do motor local em um formato que a IA deve seguir.

---

### 6. Chamada da IA

A comunicação com a Gemini API acontece em:

[`src/services/ai/gemini.service.js`](https://github.com/samuelescoval-tech/app-cardapio-ia/blob/main/src/services/ai/gemini.service.js)

Esse arquivo:

* verifica se a key foi configurada;
* define o modelo usado;
* envia o prompt;
* recebe a resposta;
* tenta transformar a resposta em JSON válido;
* cria fallback se a IA falhar.

---

### 7. Extração e validação do JSON

A resposta da IA passa por:

[`src/utils/extract-json.js`](https://github.com/samuelescoval-tech/app-cardapio-ia/blob/main/src/utils/extract-json.js)

E depois por:

[`src/utils/validate-plan.js`](https://github.com/samuelescoval-tech/app-cardapio-ia/blob/main/src/utils/validate-plan.js)

Esses arquivos ajudam a evitar que uma resposta fora do formato esperado quebre o frontend.

---

### 8. Renderização do resultado

Depois que o backend responde, o frontend renderiza o planejamento usando:

[`public/js/render.js`](https://github.com/samuelescoval-tech/app-cardapio-ia/blob/main/public/js/render.js)

Esse arquivo monta as seções visuais do resultado, como:

* resumo executivo;
* motor de logística;
* serviço de mesa;
* cardápio;
* lista de compras;
* locais;
* layout;
* decoração;
* cronograma;
* receitas;
* utensílios;
* entretenimento;
* lembrancinhas;
* checklist;
* orçamento;
* resumo do chef.

---

### 9. Histórico local

Após gerar um planejamento, o projeto salva o resultado localmente no navegador usando:

[`public/js/storage.service.js`](https://github.com/samuelescoval-tech/app-cardapio-ia/blob/main/public/js/storage.service.js)

Esse histórico usa `localStorage`, ou seja:

* fica salvo apenas no navegador do usuário;
* não usa banco de dados;
* não exige login;
* pode ser apagado pelo próprio navegador.

---

## Como executar o projeto

### 1. Clonar o repositório

```bash
git clone https://github.com/samuelescoval-tech/app-cardapio-ia.git
cd app-cardapio-ia
```

### 2. Instalar dependências

```bash
npm install
```

### 3. Criar o arquivo `.env`

Copie o modelo:

```bash
cp .env.example .env
```

Depois edite o `.env` com sua chave real.

Exemplo mínimo:

```env
PORT=3000
GEMINI_API_KEY=sua_chave_aqui
GOOGLE_API_KEY=sua_chave_aqui
AI_PROVIDER=gemini
GEMINI_MODEL=gemini-flash-lite-latest
```

> O arquivo `.env` não deve ser enviado para o GitHub.

### 4. Iniciar o servidor

```bash
npm start
```

### 5. Abrir no navegador

```txt
http://localhost:3000
```

---

## Rotas do projeto

### Página principal

```txt
GET /
```

Abre a interface principal do projeto.

Arquivo relacionado:

[`public/index.html`](https://github.com/samuelescoval-tech/app-cardapio-ia/blob/main/public/index.html)

---

### Status da aplicação

```txt
GET /api/status
```

Verifica se o servidor está ativo e retorna informações básicas sobre:

* status da aplicação;
* status da IA;
* motor local;
* prompt backend.

Arquivo relacionado:

[`server.js`](https://github.com/samuelescoval-tech/app-cardapio-ia/blob/main/server.js)

---

### Gerar planejamento

```txt
POST /gerar-cardapio
```

Recebe os dados do evento, calcula o motor local, monta o prompt, chama a IA e retorna o planejamento.

Arquivos relacionados:

* [`server.js`](https://github.com/samuelescoval-tech/app-cardapio-ia/blob/main/server.js)
* [`src/services/planning/motor.service.js`](https://github.com/samuelescoval-tech/app-cardapio-ia/blob/main/src/services/planning/motor.service.js)
* [`src/prompts/event.prompt.js`](https://github.com/samuelescoval-tech/app-cardapio-ia/blob/main/src/prompts/event.prompt.js)
* [`src/services/ai/gemini.service.js`](https://github.com/samuelescoval-tech/app-cardapio-ia/blob/main/src/services/ai/gemini.service.js)
* [`src/utils/extract-json.js`](https://github.com/samuelescoval-tech/app-cardapio-ia/blob/main/src/utils/extract-json.js)
* [`src/utils/validate-plan.js`](https://github.com/samuelescoval-tech/app-cardapio-ia/blob/main/src/utils/validate-plan.js)

Exemplo de corpo esperado:

```json
{
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
}
```

---

## Variáveis de ambiente

As variáveis são configuradas no arquivo `.env`.

O arquivo de exemplo fica em:

[`.env.example`](https://github.com/samuelescoval-tech/app-cardapio-ia/blob/main/.env.example)

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

### Opcionais para o futuro

O arquivo [`.env.example`](https://github.com/samuelescoval-tech/app-cardapio-ia/blob/main/.env.example) também possui campos futuros para:

* OpenAI;
* OpenRouter;
* Pexels;
* Unsplash;
* EmailJS;
* Firebase;
* Supabase.

Essas keys não são necessárias para a versão atual.

---

## Funcionalidades implementadas

### Gerador de planejamento com IA

O projeto gera um planejamento completo usando dados do formulário e uma resposta estruturada da IA.

Arquivos principais:

* [`public/js/app.js`](https://github.com/samuelescoval-tech/app-cardapio-ia/blob/main/public/js/app.js)
* [`server.js`](https://github.com/samuelescoval-tech/app-cardapio-ia/blob/main/server.js)
* [`src/services/ai/gemini.service.js`](https://github.com/samuelescoval-tech/app-cardapio-ia/blob/main/src/services/ai/gemini.service.js)

---

### Motor local de logística

O motor local calcula uma base operacional antes da IA responder.

Arquivo:

[`src/services/planning/motor.service.js`](https://github.com/samuelescoval-tech/app-cardapio-ia/blob/main/src/services/planning/motor.service.js)

Ele estima:

* comida;
* bebidas;
* equipe;
* utensílios;
* espaço;
* custo por pessoa;
* custo total aproximado.

---

### Prompt estruturado

O prompt principal não fica espalhado pelo frontend.

Ele está centralizado no backend.

Arquivo:

[`src/prompts/event.prompt.js`](https://github.com/samuelescoval-tech/app-cardapio-ia/blob/main/src/prompts/event.prompt.js)

Isso facilita manutenção, ajustes e evolução futura.

---

### Renderização modular

A exibição dos resultados é feita separadamente em:

[`public/js/render.js`](https://github.com/samuelescoval-tech/app-cardapio-ia/blob/main/public/js/render.js)

Isso evita que o arquivo principal do app fique sobrecarregado.

---

### Histórico local

O histórico é salvo no navegador usando `localStorage`.

Arquivo:

[`public/js/storage.service.js`](https://github.com/samuelescoval-tech/app-cardapio-ia/blob/main/public/js/storage.service.js)

---

### Funções auxiliares

Funções de apoio ficam em:

[`public/js/utils.js`](https://github.com/samuelescoval-tech/app-cardapio-ia/blob/main/public/js/utils.js)

Esse arquivo ajuda com:

* normalização de arrays;
* cálculo simples de utensílios;
* conversão segura de números;
* proteção contra HTML inseguro.

---

## O que ainda precisa melhorar

### Validação de entrada

Hoje o projeto ainda precisa validar melhor os dados enviados pelo usuário.

Exemplos:

* impedir número de pessoas vazio;
* impedir número negativo;
* validar duração;
* validar estilo;
* validar tipo de refeição;
* tratar campos muito longos.

Arquivos relacionados:

* [`public/js/app.js`](https://github.com/samuelescoval-tech/app-cardapio-ia/blob/main/public/js/app.js)
* [`server.js`](https://github.com/samuelescoval-tech/app-cardapio-ia/blob/main/server.js)

---

### Logs

O backend ainda pode ter logs mais organizados.

Arquivo relacionado:

[`server.js`](https://github.com/samuelescoval-tech/app-cardapio-ia/blob/main/server.js)

Futuro:

```txt
logs estruturados
níveis de log
registro de erro
tempo de resposta
```

---

### PDF

O projeto já tem bibliotecas carregadas para PDF/apresentação, mas a exportação ainda pode ser melhorada.

Arquivos relacionados:

* [`public/index.html`](https://github.com/samuelescoval-tech/app-cardapio-ia/blob/main/public/index.html)
* [`public/js/render.js`](https://github.com/samuelescoval-tech/app-cardapio-ia/blob/main/public/js/render.js)

---

### Deploy

O projeto ainda precisa de uma versão pública rodando online.

Antes do deploy, verificar:

* `.env` configurado;
* servidor funcionando;
* rota `/api/status`;
* rota `/gerar-cardapio`;
* nenhuma key exposta no frontend;
* logs básicos;
* tratamento de erro.

---

## Segurança

Cuidados já aplicados:

* `.env` não deve ir para o GitHub;
* `.gitignore` protege arquivos sensíveis;
* a IA é chamada pelo backend;
* o frontend não deve ter keys;
* existe tratamento básico de JSON;
* existe escape de HTML em funções auxiliares.

Arquivos relacionados:

* [`.gitignore`](https://github.com/samuelescoval-tech/app-cardapio-ia/blob/main/.gitignore)
* [`.env.example`](https://github.com/samuelescoval-tech/app-cardapio-ia/blob/main/.env.example)
* [`src/services/ai/gemini.service.js`](https://github.com/samuelescoval-tech/app-cardapio-ia/blob/main/src/services/ai/gemini.service.js)
* [`src/utils/extract-json.js`](https://github.com/samuelescoval-tech/app-cardapio-ia/blob/main/src/utils/extract-json.js)
* [`src/utils/validate-plan.js`](https://github.com/samuelescoval-tech/app-cardapio-ia/blob/main/src/utils/validate-plan.js)
* [`public/js/utils.js`](https://github.com/samuelescoval-tech/app-cardapio-ia/blob/main/public/js/utils.js)

Melhorias futuras:

* rate limit;
* validação forte no backend;
* logs estruturados;
* CORS configurado para produção;
* autenticação, caso vire produto público.

---

## Roadmap realista

### Fase 1 — Estabilização

* Rodar localmente.
* Testar `GET /api/status`.
* Testar `POST /gerar-cardapio`.
* Confirmar se Gemini responde corretamente.
* Corrigir erros do console.
* Corrigir erros do terminal.
* Atualizar README.

### Fase 2 — Qualidade técnica

* Melhorar validação dos dados.
* Melhorar mensagens de erro.
* Melhorar logs.
* Refinar motor local.
* Revisar renderização dos resultados.

### Fase 3 — Portfólio

* Melhorar apresentação visual.
* Criar prints ou GIFs do projeto.
* Preparar descrição para LinkedIn.
* Melhorar documentação.
* Preparar deploy gratuito.

### Fase 4 — Recursos futuros

* Exportação em PDF mais completa.
* Imagens por upload ou API.
* Envio por e-mail.
* Banco de dados.
* Login.
* Painel administrativo.

### Fase 5 — Produto

Somente depois de estabilizar como portfólio:

* controle de usuários;
* limite de uso;
* logs profissionais;
* segurança de produção;
* planos;
* pagamentos;
* SaaS.

---

## Leitura realista do projeto

Este projeto é forte como projeto de estudo e portfólio.

Classificação atual aproximada:

```txt
Portfólio apresentável: avançando bem
MVP local: em construção
Produto público gratuito: ainda precisa ajustes
Produto pago/SaaS: futuro
```

O foco agora não é monetização imediata.

A prioridade é:

```txt
funcionar
organizar
documentar
testar
melhorar
publicar como portfólio
```

---

## Checklist de teste

Antes de avançar para novas funcionalidades:

* [ ] `npm install` roda sem erro
* [ ] `npm start` sobe o servidor
* [ ] `http://localhost:3000` abre a página
* [ ] `http://localhost:3000/api/status` responde
* [ ] O formulário envia dados
* [ ] A rota `/gerar-cardapio` responde
* [ ] O resultado aparece na tela
* [ ] O histórico local salva o planejamento
* [ ] O console do navegador não mostra erro crítico
* [ ] O terminal não mostra erro crítico
* [ ] Nenhuma key foi enviada para o GitHub

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
ls -la
ls -la public/
ls -la public/js/
ls -la src/
```

Testar status:

```bash
curl http://localhost:3000/api/status
```

Testar geração:

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

## Autor

Samuel Santos
GitHub: [`samuelescoval-tech`](https://github.com/samuelescoval-tech)

---

## Status

Projeto em desenvolvimento.

Foco atual:

```txt
estabilização
documentação
portfólio
```

Última atualização sugerida: 2026-07
