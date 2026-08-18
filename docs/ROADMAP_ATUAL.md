# Roadmap atual - Karamu

Atualizado em 2026-08-06.

Este arquivo registra etapas. Detalhes tecnicos e falhas atuais ficam somente
no handoff.

## Etapa atual

Plano 13 e Plano 14 concluidos (contas, banco, fornecedores, fotos proprias
e deploy na Vercel, todos testados com conta real; bug de cadastro
corrigido em 2026-07-26). Plano 15 (auditoria geral, tres rodadas) e a
remocao do `DEMO_ACCESS_KEY` das rotas de conta foram feitos em
2026-07-27 — ver secao do Plano 15 para detalhes. Em 2026-07-28: item 2 do
Plano 16 (chave Gemini propria por usuario) teve o backend concluido e
testado com o Supabase real; e o login social com Google foi implementado
e testado ao vivo (ver handoff para os detalhes de configuracao do Google
Cloud + Supabase). Em 2026-08-05: protecao de senha vazada avaliada (pago,
nao ativavel no plano gratuito) e `rls_auto_enable()` corrigido (Security
Advisor do Supabase limpo). Em 2026-08-06: item 6 do Plano 16 (precos
proprios por usuario + exportacao CSV) concluido e testado com o Supabase
real, **e a interface unificada de perfil** (fornecedores + fotos + chave
de IA + precos numa tela so, dentro do app) implementada e testada ao
vivo. No mesmo dia, apos feedback do usuario de que os cadastros estavam
isolados do gerador, fornecedores/precos passaram a alimentar de verdade
o `/gerar-cardapio` (catalogo regional no prompt + estimativa de custo
local calculada no backend) e a Chave de IA (BYOK) saiu das abas
principais para um painel avancado recolhido — ver handoff para detalhes.
No mesmo dia, **o item 7 do Plano 16 (reestruturacao de navegacao,
CRITICO) foi executado junto com a troca de nome para "Karamu"** (decidida
em 2026-08-05) — ver secao do item 7 abaixo e o handoff para os detalhes
completos. Os demais itens do Plano 16 (3 e 4) seguem sem inicio de
implementacao.

**Nome trocado: "Karamu"** (decidido em 2026-08-05, executado em
2026-08-06 — ver handoff para o processo de escolha e a lista completa do
que foi renomeado). Substituiu "Chef IA"/"Chef IA Studio" em todo o
codigo, UI e docs por conflito de marca/patente. Falta so a busca formal
do INPI por classe antes de registrar a marca de verdade (item 3 do
proxima-acao no handoff).

| Plano | Resultado | Estado |
|---|---|---|
| 1 | Estabilizar fallback, historico e projetos validos | Concluido |
| 2 | Recuperar divergencias culinarias sem apagar o evento | Concluido |
| 3 | Restaurar receitas e desenho detalhado do evento | Concluido |
| 4 | Catalogar fontes e repertorio rastreavel | Concluido |
| 4B | Spoonacular apenas como referencia transitoria | Concluido e pausado |
| 5 | Validar cinco eventos, historico, mobile e PDF | Concluido |
| 6 | Definir identidade e comidas tipicas por evento | Concluido |
| 7 | Variar receitas usando memoria local controlada | Concluido |
| 8 | Captar contexto avancado progressivamente | Concluido |
| 9 | Calcular complexidade e operacao | Concluido |
| 10 | Revisar conteudo e validar o ciclo | Concluido |
| 11 | Criar biblioteca visual local e controlada | Concluido |
| 12 | Medir e corrigir cobertura visual em eventos representativos | Concluido |
| 13 | Ampliar biblioteca visual e reduzir imagens de categoria | Concluido |
| 14 | Contas, banco de dados, personalizacao e deploy | Em andamento |
| 15 | Auditoria geral do app (o que ainda condiz, o que limpar/ajustar) | Planejado, sem inicio |

Contagem atual:

- 13 planos principais concluidos;
- 1 subplano tecnico concluido;
- 1 plano em andamento;
- 1 plano planejado, aguardando o Plano 14 terminar;
- nenhuma etapa posterior aprovada automaticamente.

## Plano 11 - resultado

1. Documentacao reduzida a handoff e roadmap; README virou apenas entrada.
2. Vinte e cinco arquivos de teste foram agrupados em seis suites por dominio.
3. Biblioteca local recebeu metadados, dez ilustracoes e selecao local primeiro.
4. Imagens exatas por familia e imagens genericas de categoria sao rotuladas.
5. Openverse permaneceu complementar e as imagens nao foram para historico/PDF.
6. Suite, sintaxe, diff e E2E visual passaram.

## Criterios de aceite

- cada cartao recebe imagem exata ou identificacao honesta de categoria;
- nenhuma imagem incorreta e exibida apenas para preencher espaco;
- arquivos locais funcionam sem Openverse;
- licenca e origem sao rastreaveis;
- Openverse continua opcional;
- historico, PDF e planejamento nao recebem campos externos acidentalmente;
- testes e documentacao permanecem enxutos.

## Depois do Plano 11

As proximas direcoes exigem escolha do usuario:

1. teste acompanhado da biblioteca visual;
2. ampliacao de eventos, temas e repertorio regional;
3. catalogo de precos piloto em uma unica cidade;
4. decisao de produto sobre deploy, login, banco e pagamentos.

Nao iniciar precificacao, SaaS ou infraestrutura de producao apenas por
continuidade tecnica.

## Plano 12 - resultado tecnico

1. Cobertura visual foi separada da nota culinaria.
2. Tela mostra familia local, categoria, Openverse e ausencia.
3. Cinco eventos e 25 pratos passaram sem depender do Openverse.
4. Nenhum prato ficou sem imagem.
5. Quatro itens permaneceram genericos: carpaccio em mini sanduiche, pao de
   alho, mini pizza e cachorro-quente.
6. Desktop e mobile passaram sem imagens quebradas ou overflow.

Feedback real reabriu o Plano 12: uma imagem de laranja foi associada a suco de
uva e apareceram referencias monocromaticas. A selecao foi endurecida para
exigir ingrediente distintivo no titulo, rejeitar conteudo monocromatico ou
arquivistico e manter categorias explicitamente genericas.

Teste tecnico com evento real em 2026-07-23 (detalhes no handoff): corrigido um
bug que truncava a resposta do Gemini em eventos Premium; a cobertura visual
real caiu quase toda em imagem de categoria, sugerindo que a lacuna da
biblioteca e maior que os quatro itens originais.

**Plano 12 concluido em 2026-07-23**: o usuario gerou um evento real (Ceia de
Natal, 15 pessoas) pela tela e aprovou o conteudo (nota 9,8/10, sem problema
apontado). A cobertura visual generica foi aceita como pendencia conhecida,
nao como bloqueio. Corrigido tambem um painel de carregamento sem indicacao
visual durante a geracao (agora com spinner e aviso de tempo).

## Plano 13 - ampliar biblioteca visual

Objetivo: reduzir a proporcao de pratos que caem em imagem de categoria.

Primeiro incremento aplicado em 2026-07-23: nova ilustracao dish-family para
porco/tender/pernil e termos peru/chester adicionados a familia de aves.
Reteste com os 20 pratos reais da Ceia de Natal: familia local subiu de 1/20
para 3/20. Detalhes tecnicos e o diagnostico corrigido (o gap era peru e
porco faltando, nao "nomes elaborados" em geral) ficam no handoff.

Segundo incremento (2026-07-23): tres sub-familias de bebida (laranja, uva,
cafe). Fecha definitivamente o caso original do Plano 12 (suco de uva/laranja)
- esse cenario agora resolve local, sem consultar Openverse.

Terceiro incremento (2026-07-23, plano concluido): sete sub-familias de
bebida adicionais (agua, refrigerante cola, guarana, vinho tinto, vinho
branco/espumante, cerveja, cha) e quatro sub-familias de entrada cobrindo os
itens genericos originais (mini sanduiche, pao de alho, mini pizza,
cachorro-quente). Reteste real: os quatro itens originais agora resolvem
4/4 como familia local, cobertura "controlled", zero dependencia externa. No
evento real da Ceia de Natal, familia local subiu de 3/20 para 7/20 e a
dependencia de Openverse caiu a zero. Detalhes tecnicos, incluindo um risco de
colisao de termo corrigido (cola/chocolate), ficam no handoff.

Escopo remanescente, nao feito por falta de gap concreto identificado: entrada
alem dos quatro itens, salada e sobremesa continuam apenas em category. Fica
para decisao futura caso surja evidencia de necessidade.

## Plano 14 - contas, banco de dados, personalizacao e deploy

Decisao do usuario em 2026-07-23 (prioridade: custo zero para comecar, com
caminho de migracao pago depois):

- **Hospedagem do app**: Vercel (gratuito para comecar).
- **Banco de dados + autenticacao + armazenamento de fotos**: Supabase
  (Postgres, Auth e Storage no mesmo plano gratuito).
- **Pagamentos**: adiado. Quando houver modelo de cobranca definido, Mercado
  Pago e o candidato principal (PIX/boleto/cartao, mercado brasileiro).

Objetivo: sair do estado atual (zero contas, historico so no navegador) para
usuarios com conta propria, cada um podendo cadastrar seus proprios
fornecedores/locais de compra e enviar suas proprias fotos de pratos e
receitas, com o app publicado (nao so local).

Fases previstas:

1. Criar projeto Supabase (banco + auth + storage), RLS automatico ativado;
   chaves no `.env`, nunca versionadas. **Concluido em 2026-07-23.**
2. Cadastro/login de usuario via Supabase Auth. **Concluido em 2026-07-23**
   (backend: endpoints `/api/auth/registrar`, `/api/auth/login`,
   `/api/auth/perfil`; frontend: modal de login/cadastro na tela principal).
   Testado ponta a ponta com conta real.
3. Tabela e endpoints para fornecedores proprios por usuario (CRUD).
   **Concluido em 2026-07-25** (endpoints `/api/fornecedores` GET/POST/PUT/DELETE,
   RLS por dono, testado ponta a ponta com conta real).
4. Tabela, endpoints e Storage para fotos proprias de prato/receita por
   usuario. **Concluido em 2026-07-26** (bucket privado `fotos-pratos` criado
   via API, endpoints `/api/fotos` GET/POST/DELETE, URL assinada por 10 min
   ao listar, RLS por dono na tabela e no storage, testado ponta a ponta com
   conta real).
5. Adaptar o app para rodar como funcao serverless, criar o projeto Vercel
   (importar o repositorio) e conectar ao Supabase; deploy e teste ponta a
   ponta em producao. So aqui a conta Vercel e efetivamente usada.
   **Concluido em 2026-07-26** (`api/index.js` + `vercel.json`, apos tres
   rounds de correcao de exportacao/rewrite; `GET /` e as rotas de API
   confirmadas em producao). Teste do usuario em producao revelou um bug real
   de cadastro (e-mail ja existente reportado como sucesso falso pelo
   Supabase) — corrigido no mesmo dia; ver detalhes no handoff. Gate de
   `DEMO_ACCESS_KEY` removido das rotas de auth/fornecedores/fotos em
   2026-07-27 (ver handoff). Login social continua como pendencia sem
   urgencia para antes do lancamento real.

Pre-requisito do usuario antes da fase 1: criar conta gratuita em
supabase.com (feito em 2026-07-23, RLS automatico ativado, chaves no `.env`
confirmadas). Conta Vercel ja criada tambem, mas so sera configurada na
fase 5 — nao ha nada a fazer la por enquanto.

## Plano 15 - auditoria geral do app (primeira rodada concluida em 2026-07-27)

Registrado a pedido do usuario depois do Plano 14: revisar o app como um
todo, o que ainda condiz com o codigo/documentacao atual e o que precisa ser
limpo ou ajustado.

Primeira rodada (2026-07-27), achados e correcoes:

- `README.md` estava desatualizado (ainda dizia "MVP local", "sem conta ou
  sincronizacao" e "login/banco exigem decisao separada" — tudo isso ja foi
  resolvido pelo Plano 14). Corrigido para refletir o estado atual.
- Contagem de testes no handoff estava desatualizada (139/144, de antes do
  Plano 14); atualizada para 160 verificacoes declaradas / 165 execucoes.
- `public/index.html` carregava tres bibliotecas via CDN (PptxGenJS, GSAP,
  Swiper — incluindo o CSS do Swiper) sem nenhum uso real no codigo
  (confirmado por busca em todo o projeto). Removidas; `jsPDF` foi mantido
  por ser realmente usado em `public/js/render.js`. Testado com Chrome
  headless apos a remocao: pagina carrega sem erro de console (so um 404 de
  favicon, pre-existente e sem relacao).
- `scripts/` tinha 5 arquivos avulsos de validacao manual dos Planos 5-7
  (`inspect-plan-history.js`, `validate-plan5-api.js`,
  `validate-plan6-api.js`, `validate-plan7-variety.js` e, por engano,
  `validate-plan5-e2e.js`) sem entrada correspondente no `package.json`.
  Removidos os 4 primeiros (confirmado que nada os referencia). O quinto
  (`validate-plan5-e2e.js`) foi restaurado: `test/visual.test.js` le o
  arquivo como texto para validar convencoes do proprio script-fonte, entao
  ele nao e orfao — leitura de codigo-fonte por outro teste, nao execucao.
  Licao: antes de remover um script "sem uso aparente", buscar tambem por
  leituras de conteudo (`fs.readFileSync` do caminho), nao so por chamadas
  de execucao.
- `.env.example`: secao do Supabase estava rotulada "OPCIONAIS - para
  futuro" junto com Firebase, mas o Supabase ja e usado de verdade desde o
  Plano 14. Reordenado: Supabase vira sua propria secao obrigatoria (para
  contas), Firebase fica comentado como registro historico da decisao de
  ter migrado para Supabase.
- Suite completa revalidada apos as remocoes: 165/165.

Segunda rodada (2026-07-27), consistencia de dados e codigo morto no
frontend:

- `data/culinary/*.json` (event-contexts, food-catalog, matrix,
  source-catalog): todos confirmados em uso real por
  `culinary-matrix.service.js`/`event-coherence.service.js` e cobertos por
  `test/planning.test.js`. Nenhuma divergencia encontrada.
- `data/pricing/catalog.schema.json` e `sao-paulo.example.json`: confirmado
  que nao sao carregados por nenhum codigo hoje. Isso e esperado, nao e
  achado de limpeza — sao o schema/exemplo de referencia para o catalogo
  regional de precos que ainda nao existe (ver item 6 do Plano 16); mantidos
  como estao.
- `data/images/image.schema.json`: tambem sem nenhum carregamento em tempo
  de execucao (e so referencia de schema para `local-library.json`, sem
  validacao automatizada contra ele). Baixa prioridade; poderia virar um
  teste de validacao de schema no futuro, mas nao e uma pendencia urgente.
- Busca por funcoes definidas e nunca chamadas em `public/js/*.js`: achadas
  e removidas `rotuloServico(chave)` e `rotuloOrcamento(chave)` em
  `render.js` (a rotulagem real ja acontece inline em outro ponto do mesmo
  arquivo, essas eram sobras de uma versao anterior) e `renderListaTags()`
  (nunca chamada; a classe CSS `.tag-list` que so ela usava tambem foi
  removida de `result.css`, mantendo `.motor-pills`/`.theme-row` que
  continuam em uso no mesmo seletor combinado).
- Erro cometido e corrigido nesta rodada: `imagensLocaisGaleria()` parecia
  igualmente morta pela mesma busca (zero chamadas em `public/`), mas
  `npm run test:gallery-ui` quebrou com `ReferenceError` ao rodar de
  verdade — a funcao e chamada via CDP por `scripts/validate-gallery-ui.js`,
  fora da pasta `public/`. Restaurada; suite completa (165/165) e o E2E de
  galeria (`npm run test:gallery-ui`, desktop e mobile) revalidados com
  sucesso depois. Licao registrada: para achar codigo morto no frontend,
  buscar em todo o repositorio (inclusive `scripts/`), nao so em
  `public/js/` e `public/index.html` — scripts de validacao E2E injetam e
  chamam funcoes do browser por nome.

Leitura de `app.js`/`storage.service.js`/`utils.js`/`visual-feedback.service.js`
em busca de mais codigo morto (mesma busca da segunda rodada, agora cobrindo
esses arquivos): nenhuma funcao morta encontrada.

Terceira rodada (2026-07-27), revisao de seguranca de dados/site (fecha o
item 5 do Plano 16):

- **RLS revisada de novo, ponta a ponta**: `fornecedores` tem policy
  separada para select/insert/update/delete, todas exigindo
  `auth.uid() = user_id`; `fotos_pratos` (select/insert/delete, sem update —
  condiz com o servico) e o `storage.objects` do bucket `fotos-pratos`
  (select/insert/delete por pasta do usuario) tambem. Nenhuma lacuna
  encontrada — um usuario nao consegue ler/alterar/apagar dado de outro nem
  adivinhando IDs.
- **Sem nenhum cabecalho de seguranca HTTP** (`helmet`, `cors`,
  `express-rate-limit` — nenhum dos tres estava instalado). Adicionado
  `helmet` com uma Content-Security-Policy pragmatica: o front-end usa
  `onclick=""` e `style=""` inline em varios lugares, entao `script-src`,
  `script-src-attr` e `style-src` precisam de `'unsafe-inline'` (senão a
  pagina toda quebra); ainda assim `frame-ancestors 'none'` bloqueia
  clickjacking, `object-src`/`base-uri` ficam travados e `img-src`/
  `font-src`/`connect-src` ficam restritos as origens realmente usadas
  (cdnjs, fonts.google, images.unsplash, mais `'self'`). CORS nao foi
  adicionado: o front-end so chama a propria origem (`fetch` sempre para
  caminhos relativos), entao nao ha necessidade.
  - **Armadilha encontrada e corrigida**: o valor padrao do helmet para
    `script-src-attr` e `'none'`, que sobrepoe `script-src` especificamente
    para atributos tipo `onclick=""` — isso quebraria todos os botoes da
    pagina silenciosamente. Só foi percebido inspecionando o header CSP
    devolvido pelo servidor real antes de testar no navegador. Corrigido
    explicitando `scriptSrcAttr: ["'unsafe-inline'"]`.
  - Validado depois com `npm run test:gallery-ui` completo (desktop e
    mobile, troca de imagem, ocultar prato, lista, historico, PDF) e com
    Chrome headless direto: tudo funcionando sob a CSP nova, zero erro de
    console.
- **Sem rate limiting em nenhuma rota**: `/api/auth/login` podia ser
  tentada infinitamente (forca bruta contra contas reais) e
  `/gerar-cardapio` podia ser chamada sem limite, o que estoura a cota
  diaria compartilhada do Gemini (1.500/dia, ver Plano 16 item 1) de
  proposito ou nao. Adicionado `express-rate-limit`: 20 tentativas/15min
  por IP em `/api/auth/registrar` e `/api/auth/login` (o limite e
  compartilhado entre as duas rotas, por IP), e 10 chamadas/min em
  `/gerar-cardapio`. `app.set('trust proxy', 1)` adicionado — necessario
  para o rate limit identificar o IP real do visitante atras do proxy da
  Vercel; sem isso, todo mundo cairia no mesmo balde (ou o pacote lança um
  aviso/erro de configuracao).
  - Testado ao vivo: 21ª tentativa de login em 15 min retorna 429; testado
    tambem pela propria pagina (nao só via requisicao direta) que a UI real
    mostra a mensagem "Muitas tentativas..." corretamente quando o limite e
    atingido durante um cadastro de verdade (passando pelo modal de senha
    demo aninhado).
- **`npm audit`: 2 vulnerabilidades conhecidas** (`body-parser` 2.0.0-2.2.2 e
  `qs` 6.11.1-6.15.1, ambas DoS de severidade baixa/moderada, trazidas como
  dependencias transitivas do `express@5.2.1`, que ainda nao foi atualizado
  rio acima). Como ja existem versoes corrigidas publicadas dessas duas
  libs de forma independente, adicionado um bloco `overrides` no
  `package.json` forcando `body-parser@^2.3.0` e `qs@^6.15.3`. `npm audit`
  agora reporta 0 vulnerabilidades; suite completa revalidada (165/165).
- **Achado, nao critico**: o proprio pacote `dotenv` (usado para carregar o
  `.env`) imprime "dicas" promocionais aleatorias no console a cada
  carregamento, incluindo uma que divulga um produto nao relacionado do
  mantenedor (`vestauth`, ligado a um dominio externo). Confirmado que isso
  esta no codigo-fonte oficial do pacote (nao e sinal de pacote
  comprometido), mas e ruido desnecessario em log de producao vindo de uma
  dependencia amplamente usada. Suprimido com a opcao `{ quiet: true }` no
  `dotenv.config()`.
- **Nota, nao corrigida**: `package.json` exige `engines.node: "24.x"`
  (ajustado no Plano 14 fase 5 para a Vercel), mas a maquina de
  desenvolvimento local roda Node 22.22.1, gerando um aviso `EBADENGINE` a
  cada `npm install`. Nao afeta a Vercel (que usa a versao declarada) nem
  quebra nada localmente; registrado para quando fizer sentido atualizar o
  Node local.

Com isso, a auditoria de seguranca de dados/site do Plano 15 esta concluida
e o item 5 do Plano 16 pode ser considerado feito.

## Plano 16 - preparacao para escala e lancamento real (planejado, sem inicio)

Registrado a pedido do usuario em 2026-07-26, logo apos a fase 5 do Plano 14
ficar pronta: uma lista de perguntas e ideias para o **futuro**, para nao
perder de vista na formulacao dos proximos planos. Nada aqui foi implementado
nesta sessao.

### 1. Capacidade atual na configuracao gratuita (pesquisado em 2026-07-26)

Numeros reais dos tres servicos usados hoje, todos no plano gratuito:

- **Gemini API (`gemini-flash-lite-latest`, usado em
  `src/services/ai/gemini.service.js`)**: 1.500 requisicoes/dia, 30
  requisicoes/minuto, 1M tokens/minuto, por projeto Google Cloud (nao por
  chave). Reseta a meia-noite no horario do Pacifico. Como hoje 1 evento
  gerado = 1 chamada ao Gemini, isso da um teto teorico de ~1.500 eventos
  gerados por dia somando todos os usuarios (a chave e unica, compartilhada
  — ver item 2 abaixo).
- **Supabase (banco + auth + storage)**: 500 MB de banco, 1 GB de storage de
  arquivos, 50.000 usuarios ativos por mes (MAU, so conta quem loga no mes),
  5 GB de saida de dados (egress) por mes. O storage de 1 GB tende a ser o
  primeiro limite real a bater (fotos de prato dos usuarios), bem antes do
  banco ou do limite de MAU. Projeto gratuito tambem pausa apos uma semana
  sem uso.
- **Vercel (hospedagem, plano Hobby)**: 100 GB de banda/mes, ate 1 milhao de
  invocacoes de funcao/mes, 100 horas de execucao de funcao/mes. A duracao
  maxima por chamada e 300s (5 min) por padrao no Hobby com Fluid Compute —
  confirmado direto na documentacao oficial da Vercel em 2026-07-26, entao a
  geracao de cardapio (15 a 40s observados) tem folga confortavel e nao deve
  estourar timeout na configuracao atual.
- **Ponto de atencao legal, nao so tecnico**: o plano Hobby da Vercel e para
  uso pessoal/nao comercial; o proprio termo de uso da Vercel proibe projetos
  que cobram de usuarios ou rodam anuncios nesse plano. Isso bate exatamente
  com a decisao ja tomada (custo zero agora, pago quando houver cobranca via
  Mercado Pago) — o gatilho concreto para migrar a Vercel para o plano Pro
  (pago) e o momento em que o Plano 14 de pagamentos entrar em producao, nao
  antes.

Resumo pratico: hoje o gargalo mais provavel de aparecer primeiro, por ordem,
seria (1) storage de fotos do Supabase (1 GB), depois (2) o limite diario do
Gemini (1.500/dia) se o uso crescer bastante, e so depois (3) os limites da
Vercel. Nenhum desses limites e um problema agora, com poucos usuarios de
teste; isso deve ser reavaliado quando houver uso real recorrente.

### 2. Usuario usar a propria chave de IA em vez da chave compartilhada

**Backend concluido em 2026-07-28** (ver detalhes completos no handoff).
Tabela `chave_ia_usuario` (RLS por dono, igual ao padrao de
fornecedores/fotos), chave cifrada com AES-256-GCM antes de gravar (nunca
em texto puro no banco), rotas `GET/PUT/DELETE /api/perfil/chave-ia`, e
`/gerar-cardapio` passa a usar a chave do usuario (e pular o gate de
`DEMO_ACCESS_KEY`) quando ela estiver configurada — cai de volta pra chave
compartilhada automaticamente quando nao estiver. Testado ao vivo contra
o Supabase real com um usuario de teste descartavel (geracao real de
cardapio usando a chave propria, sem senha demo). **Interface concluida em
2026-08-06**, junto com fornecedores/fotos/precos, numa tela de perfil so
(ver handoff e item 6 abaixo).

### 3. Politicas para protecao legal e de dados (a implementar antes do lancamento real)

- Politica de Privacidade e Termos de Uso publicados no site, cobrindo o que
  e coletado (e-mail, fornecedores, fotos de prato) e como e usado;
- adequacao a LGPD (o app e brasileiro, tem usuarios reais com e-mail e
  fotos pessoais no Supabase): direito de exclusao de conta e dos dados,
  base legal para o tratamento, retencao de dados;
- ~~revisar se `DEMO_ACCESS_KEY` deve sair das rotas de auth~~ — **feito em
  2026-07-27**, removido de auth/fornecedores/fotos (ver handoff);
- ~~ativar protecao contra senha vazada no Supabase Auth~~ — **avaliado em
  2026-07-28**: e recurso pago (Pro plan), nao ativavel no plano gratuito.
  Registrado como limitacao conhecida, sem acao (ver handoff);
- ~~revogar execute publico de `rls_auto_enable()`~~ — **feito em
  2026-07-28** (migracao 005), testado ao vivo sem regressao.

### 4. Ajustes visuais no app (exemplos concretos recebidos em 2026-08-06)

Primeiros exemplos concretos, a partir de um print real da tela de
resultado (evento de Reveillon gerado com sucesso). Ainda nao
implementado — registrar aqui antes de qualquer mudanca:

- **Lista de Compras por Setor muito larga/espalhada**: com muitos itens
  (76 no exemplo), os 4 cartoes de setor lado a lado (`.sector-grid` em
  `result.css`) ficam com scroll vertical grande e dificeis de escanear.
  Usuario quer uma visualizacao melhor, sugerindo algo que expande/recolhe
  (ex.: acordeao por setor) em vez de tudo aberto ao mesmo tempo.
- **Vies das imagens dos pratos**: usuario notou que as fotos/ilustracoes
  associadas aos pratos gerados "nao estao comuns" — precisa investigar
  com exemplos mais especificos do que esperado vs. o que aparece (qual
  prato, qual imagem veio) antes de mexer em `image-selection.service.js`.
- **Perfil do usuario pouco obvio + perde o evento atual ao clicar**: o
  acesso ao perfil (clique no status de conta) nao e intuitivo, e hoje
  navega para `perfilSection` trocando a tela inteira — o formulario/
  resultado do evento em andamento fica escondido (ainda salvo em
  memoria/DOM, mas a navegacao "perde o contexto" visualmente). Usuario
  queria algo mais parecido com um menu de conta do Google ou de rede
  social (dropdown/painel sobreposto que nao troca de tela) do que uma
  navegacao para pagina separada.
- Usuario deixou explicito que **isso fica para depois** — nao e para
  implementar agora, so para nao perder de vista.

**Escopo ampliado em 2026-08-09**: usuario vai buscar referencias visuais e
trouxe um pedido mais amplo de identidade visual, nao so os ajustes
pontuais acima. Nada disso foi implementado ainda; registrar antes de
comecar:

- **Criar um logo** para o Karamu (hoje o app so tem o nome em texto no
  hero/nav, sem nenhum simbolo/marca grafica).
- **Nome**: ja decidido ("Karamu", ver secao do rename acima) — o pedido
  aqui e sobre a identidade visual em torno do nome (logo, tipografia),
  nao escolher outro nome de novo.
- **Aperfeicoar a experiencia de usuario/perfil**, retomando o ponto ja
  registrado acima (perfil pouco obvio, perde contexto do evento ao
  clicar) — mesmo pedido, nao e algo novo.
- **Embelezar botoes** e **ajustar cores** — sem exemplos especificos
  ainda de quais botoes/cores incomodam; pedir print/exemplo concreto
  quando for priorizado, como foi feito com a lista de compras acima.
- **Criar identidade visual** como um todo (paleta, tipografia, tom),
  coerente com o nome "Karamu" (banquete/festa em suaili) e com o
  publico do app (planejamento de eventos gastronomicos no Brasil).
- **Sites de referencia trazidos pelo usuario** (para inspiracao de
  estilo/interacao, nao para copiar):
  - https://resn.co.nz/#!/work/ — estudio criativo, animacoes/transicoes
    fortes e experimentais.
  - https://staratlas.com/ — jogo/produto sci-fi, visual escuro e
    cinematografico.
  - https://ryazbek.com.br/ — portfolio/agencia brasileira.
  - https://demo.templatemonster.com/pt-br/demo/51689.html — template
    comercial pronto.
  - https://demo.templatemonster.com/pt-br/demo/53136.html — template
    comercial pronto.
- Ainda sem nenhuma decisao de direcao visual a partir dessas referencias
  — usuario disse que vai olhar as referencias e retomar depois ("por
  hoje e so"). Quando retomar, vale perguntar o que especificamente em
  cada referencia chamou atencao (estilo, cor, animacao, layout) antes de
  implementar, em vez de assumir.

**Reforma "Karamu Editorial" em andamento (2026-08-10)**: usuario escolheu
a direcao entre 3 opcoes propostas (base clara, cards com foto+degrade,
dourado como unico destaque, wordmark tipografico) e aprovou trocar todos
os emoji por icones SVG proprios. Plano completo em 5 fases (ver
`docs/HANDOFF_PROXIMA_ATUALIZACAO.md` para o link do arquivo de plano e o
detalhamento). Fase 1 (tokens novos em `base.css`, wordmark aplicado em
nav/hero/rodape, favicon SVG+PNG gerado do zero — o app nao tinha nenhum
antes) concluida e testada (187/187, verificacao visual em Chrome
headless). Fases 2-5 (botoes, cards, icones, polimento) ainda pendentes.

**Fase 2 (botoes) concluida em 2026-08-17**: consolidados os pares de
botao duplicados identificados no catalogo original do sistema visual.
`.btn-print` virou modificador `.btn-compact` de `.btn-epic` (em vez de
receita propria repetida); os 3 CTAs da apresentacao/rodape que usavam
`style="width:auto;padding:18px 34px"` inline viraram o modificador
`.btn-wide`; `.btn-util` (botao de importar projeto) e `.access-modal-close`
(fechar modal) fundiram em `.btn-icon`/`.btn-round`. Os dois pares mais
divergentes — `.menu-view-btn`/`.menu-nav-btn` (cardapio, formato pilula) e
`.gallery-view-btn`/`.gallery-nav-btn` (galeria de imagens, formato
retangular com cantos leves, cor de foco diferente) — viraram uma familia
so, `.carousel-toggle`/`.carousel-nav`: padronizado no formato pilula (ja
o padrao dominante no resto do app, 14+ usos) com estado ativo em fundo
escuro (`--ink-strong`) + texto dourado (`--gold`), e o anel de foco
customizado (que divergia do `button:focus-visible` global ja definido na
Fase 1) removido a favor do global. `.btn-secondary` (usado em ~7 pontos)
teve as 4 cores cinza hardcoded (`#f0f0f0`/`#ddd`/`#999`/`#333`) retintadas
para os tokens `--cream-border`/`--sand`/`--ink`/`--ink-faint` da Fase 1,
saindo do cinza neutro para o tom creme quente da identidade. `.dish-card`/
`.card-top` (o par que o catalogo original ja apontava como codigo morto)
e mais `.live-item`/`.live-item.checked` (achado nesta fase, mesma
verificacao de zero uso em HTML/JS) foram removidos. Testado: 189/189,
`node --check` nos JS tocados, e verificacao visual real em Chrome
headless (desktop 1440px e mobile 390px) cobrindo os 6 estados afetados —
CTA da apresentacao, modal de senha demo, botao de importar no formulario,
e os grupos de carrossel/navegacao do cardapio e da galeria — confirmando
zero erro de console e nenhuma regressao visual. Ver handoff para a lista
completa arquivo por arquivo.

**Nota adicional do usuario (2026-08-10)**: a secao de apresentacao
dentro do app (`#pitchSection`, hoje so 1 slide de capa + poucos slides
genericos) esta "muito simples" — falta publico-alvo/personas ("atores"),
explicacao das ferramentas/tecnologias usadas, status do projeto (o que
foi feito, o que falta), e objetivos/tecnicas do app. Confirmado
visualmente durante a Fase 1 (screenshot do primeiro slide mostra so
titulo + 1 paragrafo + 3 badges + 1 foto). Registrado como pendente de
revisao de conteudo — nao implementado ainda, escopo e prioridade a
combinar com o usuario.

**Correcao ao plano original**: a direcao "Karamu Editorial" tinha decidido
por wordmark tipografico *sem* icone/simbolo. Ao ver o resultado ao vivo,
o usuario pediu um icone mesmo assim — logo virou um monograma "K" com
chapeu de chef (toque) integrado, testado em 3 variacoes visuais (chapeu
separado sobre o K, chapeu integrado ao talo, K classico + chapeu pequeno
de badge) e o usuario escolheu a segunda (chapeu integrado ao talo do K).
Implementado em `public/favicon.svg` (+ PNGs 16/32/180px regenerados) e
como `<symbol id="logo-mark">` reutilizavel via `<use>` em
`public/index.html`.

**Tres rodadas de ajuste apos ver ao vivo**: (1) usuario pediu pra marca
*substituir* o K de KARAMU em vez de ficar do lado; (2) mesmo alinhado, a
caixa dourada com gradiente do icone destoava visualmente das letras
planas (cor OK, mas a caixa em si nao combinava); (3) mesmo sem caixa,
usuario apontou que a *proporcao* continuava errada — o K desenhado a mao
nunca batia exatamente com a altura/peso das outras letras (Montserrat
800), e ficou mais evidente sem a caixa escondendo o problema.

**Solucao final**: abandonar de vez o K desenhado a mao. O texto agora e
"KARAMU" de verdade (fonte real, garantindo proporcao identica as outras
letras — impossivel destoar, e literalmente a mesma fonte). Só o chapeu de
chef (sem o K) virou um simbolo separado, `<symbol id="chef-hat-accent">`,
posicionado como um acento/diacritico via `position:absolute` por cima do
K de verdade. Posicionamento calibrado por medicao real no navegador (nao
no olho): script via CDP mediu com `canvas.measureText()` a altura exata
do topo do "K" (`actualBoundingBoxAscent`, ~0.70em) e seu centro
horizontal (~0.365em) nos 3 contextos (nav/hero/rodape, tamanhos de fonte
bem diferentes), garantindo que o chapeu sente exatamente em cima da
letra em qualquer tamanho. Wrapper novo `.wordmark-mark` (`inline-block`)
precisou existir porque o `<h1>`/`<p>` do hero/rodape sao centralizados e
de largura total — sem esse wrapper, a posicao do "K" dentro deles varia
com a largura da tela, e um `position:absolute` fixo desalinha. Simbolo
`#logo-mark` (com caixa/gradiente) continua existindo so pro favicon,
onde faz sentido ter uma marca solida.

**Quarta rodada**: centro-de-massa do glifo inteiro (usado na calibragem
acima) nao e o mesmo que o centro do *talo vertical* do K — o "K" tem duas
diagonais que puxam o centro do glifo pra direita, entao o chapeu ficava
meio deslocado do talo (a "perna" que sozinha parece um "I"). Usuario
pediu pra centralizar especificamente no talo, e mais destaque visual (o
acento pequeno com `currentColor` ficou "minimalista" demais). Recalibrado
com varredura de pixel real (nao estimativa): `canvas.fillText` numa
resolucao alta (400px), depois conta, coluna por coluna, quantos pixels
tem tinta — colunas com cobertura ≥85% da altura do glifo sao o talo
solido (as diagonais só tem tinta em faixas parciais de altura, entao tem
cobertura bem menor). Centro do talo achado assim: ~0.1675em (contra
~0.365em do glifo inteiro, quase o dobro mais a esquerda). Chapeu tambem
aumentado (`.34em`→`.4em`) e trocado de `currentColor` pra `var(--gold)`
(destaque de verdade, coerente com "dourado como unico acento decorativo"
da direcao "Karamu Editorial").

Testado ao vivo apos cada rodada (4 no total): 187/187, zero erro de
console, screenshot conferido nos 3 pontos (nav/hero/rodape) a cada
ajuste.

**Ideia nova do usuario (2026-08-10)**: animacao de abertura (splash) —
logo aparece, depois o nome, depois abre pro site, inspirado no loading
do resn.co.nz (uma das referencias enviadas antes). **Isso e a mesma ideia
ja registrada antes como "splash screen animado"** (ver
`project_future_splash_screen` na memoria — intro animado ramificando pra
cadastro/app, adiado, usando modal simples por enquanto). Ainda nao
implementado, nao decidido se entra nesta rodada de identidade visual ou
fica pra depois — perguntar ao usuario antes de comecar.

**Nota adicional do usuario (2026-08-10)**: reforcou o problema ja
registrado de navegacao do perfil (clicar no status de conta troca de
tela inteira e "perde" o evento em andamento) e sugeriu uma solucao
concreta — um botao proprio de "voltar" dentro da tela de perfil, que so
volta pro gerador sem deslogar (hoje so existe "Sair da conta", que
desloga). Correcao pequena e bem definida, boa candidata a implementar
logo.

**Nota adicional do usuario (2026-08-10)**: notou uma "descontinuidade
causada por duas scroll" no app — parece haver 2 barras de rolagem
verticais visiveis simultaneamente (uma parcial perto do topo, sobre o
`.hero`, e a barra normal da pagina abaixo dela). Usuario marcou como
"ajustar no futuro", nao urgente. Precisa investigar se e um elemento com
`overflow` proprio criando um scroll aninhado (candidato mais provavel:
`.hero{overflow:hidden}` em `layout.css` interagindo com algum filho, ou
o `<nav class="status-bar">` fixo sobrepondo a barra de rolagem nativa)
antes de decidir a correcao.

**Skills locais adicionadas pelo usuario (2026-08-10)**: 8 pacotes de
skills de terceiros (Anthropic, Vercel, AccessLint, bencium, e uma
ferramenta independente de UI/UX) baixados numa pasta fora do repositorio
(`skills anttropic/`, no `.gitignore`). Catalogo completo — o que cada uma
faz, quais se aplicam a este projeto e quais nao, duplicatas encontradas —
esta no handoff, secao "Skills locais disponiveis". Resumo: as mais uteis
pra fase atual sao `theme-factory`/`frontend-design`/`web-design-guidelines`
(identidade visual em andamento) e `webapp-testing` (poderia substituir os
scripts manuais de Chrome headless/CDP usados hoje pra verificacao visual).

### 5. Revisao de seguranca de dados e do site/privacidade

**Concluido em 2026-07-27** dentro da terceira rodada do Plano 15 (ver
secao do Plano 15 acima para detalhes completos): RLS revalidada sem
lacunas, `helmet` com CSP adicionado, rate limiting adicionado em
auth/geracao, 2 vulnerabilidades de dependencias corrigidas via
`overrides`. O que ainda falta, fora do escopo tecnico desta rodada: a
politica de privacidade tecnica (o que e armazenado e por quanto tempo) em
formato de documento publicavel para os usuarios — isso fica com o item 3
abaixo (politicas legais), que ainda nao foi iniciado.

**Segunda rodada em 2026-08-17**, usando um prompt-template proprio do
usuario para auditoria de seguranca de aplicacao web (autenticacao/sessao,
RLS, validacao de entrada, dependencias, cabecalhos HTTP/CSP, upload,
integridade de recursos externos). 3 correcoes aplicadas e testadas
(rate limit em `/api/referencias-receitas` e `/api/imagens-evento`,
validacao de imagem por assinatura de bytes real em vez de so o
`Content-Type` declarado, SRI + versao fixada nos scripts de CDN
`jspdf`/`supabase-js`); RLS e criptografia da chave de IA reconferidas
como corretas, sem acao. 2 itens registrados sem correcao nesta rodada:
CSP `'unsafe-inline'` em `scriptSrc` fica como debito tecnico documentado
(usuario optou por adiar, escopo de ~26 handlers inline ja mapeado) e a
allowlist de redirect URL do Google no painel do Supabase precisa de
checagem manual do usuario. Ver handoff para a lista completa dos 5
achados e como cada um foi tratado.

### 6. Precos proprios por usuario (perfil) e documento de precos

**Backend concluido em 2026-08-06** (ver detalhes completos no handoff).
Tabela `precos_usuario` (RLS por dono, mesmo padrao das outras tabelas de
personalizacao), ligada opcionalmente a um fornecedor proprio do usuario
(`fornecedor_id`, valida que o fornecedor pertence a quem esta criando o
preco). Rotas `GET/POST/PUT/DELETE /api/precos` e `GET /api/precos/exportar`
(CSV com separador `;` e virgula decimal, formato que o Excel brasileiro
espera). Isso resolve diretamente o risco ja registrado no handoff ("Nao
existe catalogo regional real de precos", item 4 de "Falhas e riscos
abertos") de forma personalizada por usuario, em vez de um catalogo
regional unico e centralizado. Testado ao vivo contra o Supabase real,
incluindo a validacao de que um preco nao pode ser vinculado ao fornecedor
de outro usuario (404 correto).

**Interface unificada concluida em 2026-08-06** — nova secao `#perfilSection`
em `public/index.html` (`public/js/perfil.js`), acessivel pelo botao de
conta no menu (nao muda a hierarquia da navegacao — isso continua no item
7). Todo o CRUD via fetch para as rotas ja existentes, upload de foto
lendo o arquivo como data URL no navegador, exportacao do CSV de precos
via `Blob`. Testado ao vivo (Chrome headless, usuario descartavel): os
paineis funcionam ponta a ponta, zero erros de console. Ver handoff para
detalhes completos.

**Integracao com o gerador, no mesmo dia** — feedback do usuario ao ver a
tela pronta: fornecedores/precos eram cadastros isolados, sem nenhuma
ligacao real com `/gerar-cardapio`. Corrigido: o backend monta um
"catalogo regional do usuario" (fornecedores + precos) e passa como
contexto no prompt (`src/prompts/event.prompt.js`), e depois cruza a
`lista_compras` gerada com esse catalogo para calcular uma estimativa de
custo local (`src/services/planning/custo-estimado.service.js`), sem
pedir a IA para gerar precos. Resultado aparece em
`plano.estimativa_custo` e na tela (nova secao "Custo Estimado" + etiqueta
de preco por item da lista de compras). Testado ao vivo de ponta a ponta
(fornecedor + preco reais, geracao real de cardapio, IA usando o nome do
item do catalogo, backend calculando o subtotal certo). **Abas visiveis
agora sao so Fornecedores/Fotos/Precos** — Chave de IA (BYOK) saiu das
abas principais e virou um painel "avancado" recolhido (`<details>`),
porque como estava (aba igual as demais) reduzia conversao e ampliava
superficie de seguranca sem beneficio claro pra maioria dos usuarios; o
backend/criptografia nao mudaram, so a exposicao na UI. Ver handoff para
detalhes completos.

**Revisao de codigo e correcoes, no mesmo dia** — `/code-review` encontrou
4 problemas reais nessa integracao (casamento por substring podia atribuir
preco de produto errado; nomes duplicados na lista de compras mostravam
preco da linha errada; duas chamadas serializadas ao Supabase Auth por
geracao; `normalizarTexto` duplicado). Todos corrigidos e reverificados
(suite 185/185 + testes ao vivo). Consolidar as ~12 copias *pre-existentes*
de `normalizarTexto` espalhadas pelo resto do backend ficou de fora
(fora do escopo do fix pontual) e esta registrado como proxima acao no
handoff. Ver handoff para a lista completa dos achados e como cada um foi
corrigido.

### 7. Reestruturar a navegacao: apresentacao -> login -> app — **CRITICO, nao e so estetica** — RESOLVIDO em 2026-08-06

O usuario classificou este item como algo que "nao pode ser esquecido pois
isso resulta na falha do projeto" (2026-07-28). Nao tratado como polimento
cosmetico de baixa prioridade — era um problema de arquitetura de produto
na visao do usuario, e foi tratado como tal.

**Como estava**: a navegacao mostrava tres botoes lado a lado com o mesmo
peso: "GERADOR IA" (abre direto, era a tela inicial padrao), "APRESENTACAO"
e "ENTRAR" — dava pra pular a apresentacao e o login e ir direto pro
gerador. Reforcado pelo usuario em 2026-07-28, testando o login com Google
pela primeira vez: com a conta logada, o e-mail do usuario passou a ocupar
um terceiro botao no mesmo nivel visual dos outros dois, confirmando ao
vivo o problema de hierarquia.

**Como ficou**: fluxo sequencial — visitante sem sessao e sem modo demo
ativo cai na apresentacao primeiro; de la escolhe "Criar conta / Entrar"
ou "Testar com senha demo" (decisao tomada com o usuario: manter o acesso
demo, mas so depois da apresentacao, nao mais como atalho direto). Quem ja
tem sessao real ou ja escolheu o modo demo cai direto no gerador nos
proximos carregamentos (segunda decisao tomada com o usuario: a
apresentacao so repete o gate para quem ainda nao passou por nenhum dos
dois). A navegacao virou uma barra de status com 2 elementos — a marca
(volta a apresentacao) e o status de conta, esse ultimo visualmente mais
discreto que antes, porque agora e um indicador, nao uma aba de mesmo
peso que o gerador.

**Combinado com a troca de nome**, como planejado: a execucao da troca de
"Chef IA"/"Chef IA Studio" para "Karamu" (decidido em 2026-08-05) aconteceu
junto, no mesmo dia. Ver handoff (secao "Plano 16, item 7") para a lista
completa do que mudou em `public/index.html`/`app.js`/CSS, o escopo
completo do rename (incluindo os dois valores funcionais que precisaram de
cuidado extra: o sentinela de formato de servico e a licenca de imagem
local) e os testes ao vivo em Chrome headless que validaram o fluxo
inteiro.

## Depois do Plano 13

O item "decisao de produto sobre deploy, login, banco e pagamentos" virou o
Plano 14 (acima). Direcoes ainda sem escolha do usuario:

1. ampliacao de eventos, temas e repertorio regional;
2. catalogo de precos piloto em uma unica cidade;
3. ampliar entrada/salada/sobremesa dish-family alem dos quatro itens ja
   cobertos, se surgir evidencia de necessidade;
4. Plano 15 (auditoria geral, acima) - so depois do Plano 14 terminar.

Nao iniciar precificacao, SaaS ou infraestrutura de producao apenas por
continuidade tecnica. Novas tarefas devem ser adicionadas aqui conforme forem
decididas, mantendo o estado somente neste roadmap e no handoff.
