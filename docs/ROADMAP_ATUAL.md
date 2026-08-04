# Roadmap atual - Chef IA Studio

Atualizado em 2026-07-28.

Este arquivo registra etapas. Detalhes tecnicos e falhas atuais ficam somente
no handoff.

## Etapa atual

Plano 13 e Plano 14 concluidos (contas, banco, fornecedores, fotos proprias
e deploy na Vercel, todos testados com conta real; bug de cadastro
corrigido em 2026-07-26). Plano 15 (auditoria geral, tres rodadas) e a
remocao do `DEMO_ACCESS_KEY` das rotas de conta foram feitos em
2026-07-27 — ver secao do Plano 15 para detalhes. Em 2026-07-28: item 2 do
Plano 16 (chave Gemini propria por usuario) teve o backend concluido e
testado com o Supabase real (falta so a interface); e o login social com
Google foi implementado e testado ao vivo (ver handoff para os detalhes de
configuracao do Google Cloud + Supabase). Os demais itens do Plano 16
seguem sem inicio de implementacao.

**Pendencia registrada sem prazo**: o nome "Chef IA" tem conflito de
marca/patente e precisa ser trocado antes do lancamento real; nenhum nome
novo foi escolhido ainda (ver detalhes no handoff).

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
cardapio usando a chave propria, sem senha demo). Falta so a interface:
hoje nao existe nenhuma tela onde o usuario cola a propria chave (mesma
situacao de fornecedores/fotos, que tambem sao backend-only ainda) — a
proxima etapa natural e uma tela de perfil que junte os tres (fornecedores,
fotos, chave de IA) em vez de telas separadas.

### 3. Politicas para protecao legal e de dados (a implementar antes do lancamento real)

- Politica de Privacidade e Termos de Uso publicados no site, cobrindo o que
  e coletado (e-mail, fornecedores, fotos de prato) e como e usado;
- adequacao a LGPD (o app e brasileiro, tem usuarios reais com e-mail e
  fotos pessoais no Supabase): direito de exclusao de conta e dos dados,
  base legal para o tratamento, retencao de dados;
- ~~revisar se `DEMO_ACCESS_KEY` deve sair das rotas de auth~~ — **feito em
  2026-07-27**, removido de auth/fornecedores/fotos (ver handoff);
- ativar protecao contra senha vazada no Supabase Auth (ja listado como
  pendencia opcional no Plano 14).

### 4. Ajustes visuais no app (a definir)

Mencionado como necessario, ainda sem lista concreta do que precisa mudar.
Quando o usuario tiver exemplos especificos (telas, prints, comportamentos),
detalhar aqui antes de qualquer implementacao.

### 5. Revisao de seguranca de dados e do site/privacidade

**Concluido em 2026-07-27** dentro da terceira rodada do Plano 15 (ver
secao do Plano 15 acima para detalhes completos): RLS revalidada sem
lacunas, `helmet` com CSP adicionado, rate limiting adicionado em
auth/geracao, 2 vulnerabilidades de dependencias corrigidas via
`overrides`. O que ainda falta, fora do escopo tecnico desta rodada: a
politica de privacidade tecnica (o que e armazenado e por quanto tempo) em
formato de documento publicavel para os usuarios — isso fica com o item 3
abaixo (politicas legais), que ainda nao foi iniciado.

### 6. Precos proprios por usuario (perfil) e documento de precos

Ideia: permitir que cada usuario cadastre seus proprios precos (por
fornecedor/ingrediente) no perfil, alem de gerar um documento/lista de
precos exportavel. Isso resolveria diretamente o risco ja registrado no
handoff ("Nao existe catalogo regional real de precos", item 4 de "Falhas e
riscos abertos") de forma personalizada por usuario, em vez de um catalogo
regional unico e centralizado. Depende da tabela de fornecedores do Plano 14
(fase 3) como base, adicionando um campo/tabela de preco por item.

### 7. Reestruturar a navegacao: apresentacao -> login -> app

Hoje (`public/index.html`) a navegacao mostra tres botoes lado a lado com o
mesmo peso: "GERADOR IA" (abre direto, e a tela inicial padrao), "APRESENTACAO"
e "ENTRAR" — o usuario pode pular a apresentacao e o login e ir direto pro
gerador. A ideia registrada e inverter isso: o visitante ve a apresentacao
primeiro, depois faz login/cadastro, e so entao cai na tela do Chef IA
(gerador). Isso muda o fluxo de "abas paralelas" para um fluxo sequencial
com o login como porta de entrada. Ainda sem decisao de como tratar visitantes
que querem so espiar sem conta (ex.: modo demonstracao antes do login, ou
login obrigatorio para tudo) — decidir quando esse item for priorizado.

**Reforcado pelo usuario em 2026-07-28**, testando o login com Google pela
primeira vez: com a conta logada, o e-mail do usuario passou a ocupar um
terceiro botao no mesmo nivel visual de "GERADOR IA"/"APRESENTACAO",
confirmando ao vivo o problema de hierarquia ja descrito acima.

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
