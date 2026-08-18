# Handoff - Karamu

Atualizado em 2026-08-17.

## Estado em uma frase

O Karamu (renomeado de "Chef IA Studio" em 2026-08-06 — ver secao
dedicada abaixo; nome decidido em 2026-08-05 por conflito de marca/
patente) esta em producao na Vercel, com contas de usuario reais
(Supabase Auth, agora com login por e-mail/senha **e** login social com
Google) e uma tela de perfil unificada onde o usuario gerencia
fornecedores, fotos, chave de IA propria e precos proprios; os Planos 1 a
14 estao concluidos. O Plano 15 (auditoria geral, tres rodadas) e a
remocao do `DEMO_ACCESS_KEY` das rotas de conta foram feitos em
2026-07-27. Em 2026-07-28: item 2 do Plano 16 (chave Gemini propria por
usuario) e login social com Google implementados e testados ao vivo. Em
2026-08-06: item 6 do Plano 16 (precos proprios por usuario + exportacao
CSV) e a interface unificada de perfil (fornecedores/fotos/chave-ia/precos
numa tela so) implementados e testados ao vivo; no mesmo dia, apos
feedback do usuario, fornecedores/precos passaram a alimentar de verdade
o `/gerar-cardapio` (catalogo regional no prompt + estimativa de custo
local), a chave de IA (BYOK) saiu das abas principais para um painel
"avancado" recolhido, revisao de codigo (`/code-review`) corrigiu 4
problemas reais nessa entrega, e **o item 7 do Plano 16 (reestruturacao
de navegacao, marcado CRITICO) foi executado junto com a troca de nome
para Karamu** — ver secao dedicada abaixo. Em 2026-08-17: Fases 1 e 2 da
identidade visual "Karamu Editorial" concluidas (tokens, wordmark com
acento de chapeu de chef, favicon; e consolidacao de todas as familias
de botao duplicadas/divergentes numa taxonomia so) e uma auditoria de
seguranca completa (prompt padrao do usuario) resultou em 3 correcoes
aplicadas e testadas (rate limit em duas rotas sem limitador, validacao
de imagem por conteudo real em vez de so o `Content-Type` declarado, SRI
nos scripts de CDN) e 2 itens registrados sem acao imediata (CSP
`unsafe-inline` adiado como debito tecnico mapeado; checagem manual do
redirect URL do Google no Supabase, pendente do usuario) — ver secoes
dedicadas abaixo.

## Arquitetura atual

- server.js: Express, rotas, protecao demo e composicao dos servicos.
- src/services/ai/: geracao Gemini e normalizacao das respostas.
- src/services/planning/: motor, matriz culinaria, variedade, coerencia,
  rendimento, bebidas, operacao e qualidade.
- src/services/images/: dicionario, Openverse, selecao e relevancia visual.
- public/js/: formulario, historico, renderizacao, PDF e avaliacao visual.
- data/: matrizes, fontes, precificacao de exemplo e metadados visuais.
- test/: seis suites consolidadas por dominio.

Fluxo principal: formulario, validacao, motor local, Gemini,
validacao/recuperacao, tela, historico local e PDF. Imagens seguem fluxo
separado.

## Funcionalidades preservadas

- geracao protegida no backend, sem chave no navegador;
- calculos locais para convidados, bebidas, equipe, utensilios e operacao;
- perfis de eventos, refeicoes, temas e contextos;
- pratos atomicos, receitas completas e compras ligadas por identificadores;
- recuperacao explicita de receitas, ingredientes e compras ausentes;
- auditoria de variedade, rendimento e coerencia;
- historico compativel com formatos antigos;
- interface responsiva e PDF pesquisavel;
- precos nao inventados: sem fonte regional, exibir A cotar.

## Camada visual encontrada

A base atual ja possui consultas anonimas ao Openverse, correspondencia minima
entre metadados e nome do prato, alternativas, troca, ocultacao, avaliacao
local e cinco SVGs neutros para contingencia. Referencias externas ficam fora
do historico e do PDF.

O problema observado e real: quando a fonte externa falha ou a correspondencia
e fraca, o prato fica apenas com identificacao neutra. Os SVGs nao formam uma
biblioteca de pratos e o servidor local tambem estava desligado na auditoria de
2026-07-15.

## Resultado do Plano 11

Foi criada uma biblioteca local, versionada e pesquisavel. Cada imagem possui:

- identificador estavel e arquivo local;
- titulo e texto alternativo;
- categoria, tags culinarias, pratos ou tecnicas relacionados;
- autoria, origem e licenca;
- versao e estado de aprovacao.

A selecao usa a biblioteca local primeiro. Openverse passa a ser complemento quando nao
houver correspondencia adequada. Uma imagem generica deve ser rotulada como
imagem de categoria, nunca apresentada como fotografia exata do prato.

Imagens externas continuarao fora do historico e do PDF ate existir uma decisao
explicita de persistencia e licenca. Dados de clientes nao viram dados gerais da
biblioteca.

## Falhas e riscos abertos

1. A biblioteca local tem 25 ilustracoes (apos o Plano 13) e ainda nao cobre
   todo o repertorio possivel (ex.: frutos do mar/camarao especifico, cordeiro).
2. Algumas receitas podem se repetir em contextos equivalentes.
3. O Gemini pode exigir recuperacao automatica de receitas ou compras.
4. Nao existe catalogo regional real de precos.
5. Historico permanece restrito ao navegador atual.
6. DEMO_ACCESS_KEY protege so as rotas de geracao/consulta externa
   (`/gerar-cardapio`, `/api/imagens-evento`, `/api/referencias-receitas`),
   nao existe controle de cota por usuario nessas rotas — qualquer
   possuidor da senha demo consome a cota compartilhada. Removido das
   rotas de conta (auth/fornecedores/fotos) em 2026-07-27, que ja usam
   autenticacao real do Supabase.
7. Alergenicos e contaminacao cruzada exigem confirmacao profissional.
8. Operacao deve ser conferida contra o espaco e os equipamentos reais.
9. maxOutputTokens do Gemini foi ampliado de 8192 para 32768 em 2026-07-23
   apos corte de resposta (MAX_TOKENS) num evento Premium real; nao ha
   garantia de que 32768 baste para eventos ainda maiores ou mais detalhados.
10. Salada e sobremesa continuam sem nenhuma entrada dish-family (so
    category); entrada tem dish-family so para os quatro itens originais
    (sanduiche, pao de alho, pizza, cachorro-quente), o resto cai em
    category. Principal e bebida estao bem cobertos apos o Plano 13.
11. Testado em 2026-07-23: cadastro real via `/api/auth/registrar` confirma
    que "Confirm email" continua ATIVO no projeto Supabase (nao foi
    desativado, apesar de ter sido cogitado) — o cadastro retorna
    `confirmacao_pendente: true` e exige clique no link enviado por e-mail
    antes do login funcionar. Esse e o comportamento correto/seguro para
    manter; nao ha acao pendente aqui.

## Informacoes prioritarias do evento

Tipo, adultos, criancas, restricoes, refeicao, formato de servico,
infraestrutura, horario e duracao. Tema, estilo, faixa etaria, bebidas e
localidade refinam o resultado. Decoracao e entretenimento sao editoriais e nao
devem substituir os dados operacionais.

## Seguranca e dados

- nunca versionar .env ou chaves;
- a chave Spoonacular anteriormente exposta nao deve ser reutilizada;
- nao prometer precos, disponibilidade ou ausencia de contaminacao;
- historico local e preferencias visuais devem continuar limitados;
- URLs externas devem usar HTTPS e licencas permitidas.

## Operacao local

Comandos principais: npm install, npm start, npm test e git diff --check.

Maquina nova (ex.: apos reinstalar o sistema operacional): requer Node.js e
npm (`sudo apt install nodejs npm` no Ubuntu) e Google Chrome ou Chromium para
`npm run test:gallery-ui`, que abre um Chrome headless via CDP.

Endpoints: GET /api/status, POST /gerar-cardapio, POST /api/imagens-evento e
POST /api/referencias-receitas.

Erros iniciais: conferir porta, .env, GEMINI_API_KEY, DEMO_ACCESS_KEY e a
resposta de /api/status.

## Baseline de validacao

- cinco eventos principais: domiciliar, casamento, churrasco, infantil e
  corporativo;
- historico recarregado no navegador;
- mobile sem overflow horizontal;
- PDFs A4 pesquisaveis;
- testes consolidados em seis suites, com 171 verificacoes declaradas (176
  execucoes ao rodar npm test, incluindo subtestes de um loop de cenarios;
  contagem revalidada em 2026-08-06 apos precos proprios por usuario);
- E2E visual com tres de tres imagens aplicadas aos pratos no desktop e mobile,
  sem imagem quebrada ou overflow;
- ambiente migrado de Pop!_OS para Ubuntu 26.04 LTS em 2026-07-23; npm test e
  npm run test:gallery-ui revalidados sem regressao apos a migracao.

## Plano 12 - validacao acompanhada

A interface separa a leitura visual da qualidade culinaria e mostra quatro
contagens: familia local, categoria, Openverse e sem imagem.

O teste controlado simulou Openverse indisponivel em cinco eventos, com cinco
pratos por evento:

- corporativo: 4 familias e 1 categoria;
- casamento: 5 familias e 0 categorias;
- churrasco: 4 familias e 1 categoria;
- infantil: 3 familias, 2 categorias e 1 ilustracao reutilizada;
- domiciliar: 5 familias e 0 categorias.

Resultado agregado: 25 solicitados, 25 exibidos e nenhum prato sem imagem.
Continuam genericos: mini sanduiche de carpaccio, pao de alho, mini pizza e
cachorro-quente. Esses quatro itens formam o primeiro candidato de ampliacao,
mas nenhuma imagem nova deve ser adicionada antes da avaliacao do usuario.

### Falha observada pelo usuario

Em 2026-07-15, suco de uva apareceu com referencia de laranja e houve conteudo
monocromatico ou arquivistico. A causa foi uma correspondencia permissiva:
termos amplos promoviam categorias para familias e uma tag isolada bastava para
aceitar a imagem externa.

Correcao aplicada:

- categorias locais nunca sao apresentadas como correspondencia exata;
- ingrediente distintivo deve aparecer no titulo principal da referencia;
- uma palavra generica como juice nao prova correspondencia;
- resultados PDM, monocromaticos, historicos, gravuras e pinturas sao rejeitados;
- selos passaram a dizer ilustracao da familia, imagem de categoria ou
  referencia externa, sem usar a expressao referencia conferida;
- a ilustracao generica de bebidas foi neutralizada para nao sugerir sabor.

Teste ao vivo: as referencias incorretas retornadas para suco de uva e suco de
laranja foram rejeitadas. Nos dois casos, o sistema preferiu a imagem neutra de
categoria. A prioridade agora e correspondencia honesta, nao cobertura forcada.

### Bug encontrado e corrigido em 2026-07-23: resposta do Gemini truncada

Ao gerar um evento corporativo Premium real (80 pessoas, sem mock), o backend
retornou cardapio vazio com `finish_reason: MAX_TOKENS` e `schema_ok: false`.
Causa: `src/services/ai/gemini.service.js` limitava `maxOutputTokens` a 8192,
insuficiente para o contrato de resposta completo (cardapio, receitas com 4 a
6 passos por prato, local, layout, decoracao, cronograma e checklist) em
eventos Premium ou com muitos itens. Corrigido para 32768. Reteste com o mesmo
evento: `finish_reason: STOP`, `schema_ok: true`, 25 pratos completos usando
19055 tokens de saida. Nenhum outro evento foi testado para confirmar se
32768 e suficiente em todos os casos; eventos ainda maiores podem repetir o
problema e exigir um novo ajuste ou paginacao da resposta.

### Teste com evento real pos-correcao: cobertura visual mais generica que o esperado

Com o cardapio real gerado acima (20 pratos avaliados), a cobertura visual
foi: 0 familia local, 19 categoria, 1 Openverse, 0 sem imagem (status
"review"). Isso diverge do teste controlado anterior (que usava nomes de
prato fixos e obtinha maioria de familia local): os dez itens da biblioteca
local sao todos de categoria ampla (entrada, principal-carne, sobremesa etc.),
nao de prato especifico, e os nomes reais gerados pelo Gemini em estilo
Premium sao elaborados demais (ex.: "Verrine de Iogurte com Coulis de Frutas
Vermelhas") para casar com esses termos ou com a ancora exigida do Openverse.
O sistema nao exibiu nenhuma imagem enganosa; apenas caiu quase sempre na
imagem honesta de categoria. A unica foto do Openverse (cafe) foi conferida
visualmente e e uma foto real de cafe fumegante, mas em ambiente domestico
(sofa e jornal), estilo destoante de um coffee break corporativo. Isso
antecipa a resposta da acao curta abaixo: para menus elaborados, esperar
predominancia de imagem de categoria e nao de familia local.

### Validacao final do Plano 12 pelo usuario (2026-07-23)

O usuario gerou um evento real pela tela (Ceia de Natal, 15 pessoas, formato
elegante) e aprovou o resultado: 20 itens de cardapio, 16 fichas de receita,
lista de compras com 63 itens, cronograma e checklist completos, nota de
auditoria 9,8/10. Nenhum problema de conteudo foi apontado. A cobertura visual
(predominio de imagem de categoria) foi reconhecida como esperada e aceita
como pendencia de melhoria futura, nao como bloqueio. O Plano 12 esta
concluido.

Durante esse teste, o usuario tambem relatou que a tela nao dava nenhum
indicio visual de que o evento estava sendo gerado (o painel de carregamento
era so texto estatico, sem animacao, contra uma espera real de 15 a 40
segundos). Corrigido em `public/js/app.js`: o painel agora usa o mesmo spinner
girante (`.gallery-loading-visual`) ja usado na galeria de imagens, com um
aviso de tempo estimado.

### Plano 13 - diagnostico corrigido e primeiro incremento (2026-07-23)

A hipotese inicial ("nomes elaborados quebram a correspondencia de familia de
forma ampla") estava incompleta. Reconferindo os 20 pratos reais da Ceia de
Natal contra `/api/imagens-evento`:

- causa principal: das cinco entradas `dish-family` existentes, nenhuma cobria
  peru/chester (fica fora de `principal-frango`) nem porco/tender/pernil
  (nao existia entrada alguma para a familia suina);
- "Lasanha Vegetariana..." ja batia corretamente em `principal-massa` (a
  correspondencia funciona quando o termo existe);
- gap estrutural maior: os slots entrada, salada, sobremesa e bebida nao tem
  nenhuma entrada em modo `dish-family` — so existe o nivel `category` para
  eles, entao nunca teriam uma imagem de familia, nao importa o nome do prato.

Incremento aplicado: nova entrada local `principal-porco`
(`public/images/library/main-pork.svg`, termos porco/suino/tender/lombo/
pernil/presunto/bacon/linguica/leitao) e termos peru/chester adicionados a
`principal-frango`. Reteste com os mesmos 20 pratos da Ceia de Natal: familia
local subiu de 1/20 para 3/20 (peru, tender e lasanha), categoria caiu de
18/20 para 16/20. Suite completa (144 testes) permanece verde.

Decisao do usuario (resolvida no terceiro incremento abaixo): ampliar tambem
bebida e os quatro itens genericos originais de entrada.

### Plano 13 - segundo incremento: sub-familias de bebida (2026-07-23)

A pedido do usuario, criadas tres novas entradas dish-family para o slot
bebida (antes so existia a categoria generica): `bebida-laranja`
(`beverage-orange.svg`, termo "laranja"), `bebida-uva` (`beverage-grape.svg`,
termo "uva") e `bebida-cafe` (`beverage-coffee.svg`, termo "cafe"; removido de
`bebida-ilustrada` para nao empatar). Termos usados como radicais (ex.:
"citric" cobriria "citricas"), nao a palavra completa, para casar variacoes
de genero/plural.

A correspondencia local dish-family agora e verificada antes do Openverse
(`image-selection.service.js`) e, quando existe, o Openverse nem chega a ser
consultado para aquele prato. Teste direto do cenario original do bug:
"Suco de uva integral", "Suco de laranja natural" e "Cafe expresso" agora
resolvem 3/3 como `local`/`dish-family`, cobertura "controlled", zero
consultas externas — fecha definitivamente o caso que abriu o Plano 12
(imagem de laranja aparecendo para suco de uva).

Ajuste de teste necessario: dois testes em `visual.test.js` assumiam
"categoria" para suco de uva; atualizados para refletir o novo resultado
correto (`dish-family`), e o teste de aceitacao de foto do Openverse passou a
usar refrigerante de cola (sem familia local) em vez de uva, ja que uva agora
sempre resolve localmente antes de chegar ao Openverse. Suite completa
(144 testes) permanece verde.

Termos ainda sem familia dedicada em bebida: agua, cha, refrigerante
generico/guarana/cola, vinho, cerveja, espumante — ficam em categoria por
enquanto (decisao de escopo do Plano 13 continua aberta, ver acima).

### Plano 13 - terceiro incremento e conclusao (2026-07-23)

Completado o restante do slot bebida e os quatro itens genericos originais do
slot entrada:

- bebida: `bebida-agua` (agua), `bebida-cola` (refrigerante cola), `bebida-guarana`
  (refrigerante guarana), `bebida-vinho-tinto` (vinho tinto), `bebida-vinho-branco`
  (vinho branco/espumante/champagne/prosecco), `bebida-cerveja` (cerveja),
  `bebida-cha` (cha de/cha gelado/cha quente);
- entrada: `entrada-sanduiche` (sanduiche), `entrada-pao-de-alho` (pao de
  alho), `entrada-pizza` (pizza), `entrada-cachorro-quente` (cachorro
  quente/cachorro-quente).

Risco encontrado e corrigido antes de testar: o termo "cola" (sozinho) e
substring de "chocolate" ("cho-COLA-te"), o que faria um chocolate quente
cair na imagem errada de refrigerante. Trocado para termos compostos
("refrigerante cola", "cola tradicional", "coca-cola").

Reteste real:

- os quatro itens genericos originais (mini sanduiche, pao de alho, mini
  pizza, cachorro-quente) agora resolvem 4/4 como familia local, cobertura
  "controlled", zero dependencia externa;
- no evento real da Ceia de Natal (20 pratos), familia local subiu de 3/20
  para 7/20 e a dependencia de Openverse caiu de 1 para 0 (o vinho tinto, que
  antes ia para o Openverse, agora resolve local).

Efeito colateral nos testes: a mudanca fez `pratos[0]` ("Mini sanduiche de
carpaccio...") e `pratos[1]` ("Agua mineral...") — fixtures compartilhadas por
tres testes em `visual.test.js` que dependiam de NAO ter familia local —
passarem a resolver localmente, quebrando esses testes. Corrigido renomeando
os fixtures para pratos sem familia dedicada ("Carpaccio com alcaparras",
"Gin tonica com limao") e trocando o teste de aceitacao de Openverse de cola
para whisky (tambem sem familia dedicada). Suite completa (144 testes)
permanece verde.

Escopo restante nao feito, por falta de gap concreto ja identificado: entrada
alem dos quatro itens, salada e sobremesa continuam so em category. O Plano
13 e considerado concluido; essa ampliacao adicional fica para quando surgir
evidencia real de necessidade (ex.: usuario reportar outro item generico
especifico).

### Ideia de produto para o futuro: personalizacao por usuario

O usuario expressou uma pretensao de longo prazo: cada usuario poder
personalizar sua propria conta — listar fornecedores/locais de compra
proprios e enviar suas proprias fotos de pratos e receitas. Essa pretensao
virou o Plano 14 (ver roadmap para as fases completas).

### Plano 14 - stack decidida e preparo tecnico inicial (2026-07-23)

Decisao do usuario: Supabase (banco Postgres, autenticacao e storage de
fotos, tudo no plano gratuito) + Vercel (hospedagem, plano gratuito).
Pagamento adiado; Mercado Pago e o candidato quando houver modelo de
cobranca. Fases completas em `docs/ROADMAP_ATUAL.md`, secao "Plano 14".

Preparo tecnico ja feito, sem depender de conta nenhuma:

- dependencia `@supabase/supabase-js` instalada (`package.json`);
- `.env.example` atualizado com `SUPABASE_URL`, `SUPABASE_ANON_KEY` e
  `SUPABASE_SERVICE_ROLE_KEY` (antes so existia um placeholder comentado com
  nomes diferentes), incluindo instrucoes de onde achar cada chave no painel
  do Supabase;
- suite completa (144 testes) revalidada depois da instalacao, continua verde.

Fase 1 concluida em 2026-07-23: usuario criou o projeto Supabase (RLS
automatico ativado) e a conta Vercel, e confirmou as 3 chaves no `.env`
(formato conferido). A conta Vercel nao exige nenhuma configuracao adicional
agora; so sera usada na fase 5 (deploy), pois o app precisa de ajuste para
rodar em funcao serverless antes disso.

### Plano 14 - fase 2 concluida no backend: cadastro e login (2026-07-23)

Criado `src/services/auth/supabase-auth.service.js` (factory
`criarSupabaseAuthService`, com `client` injetavel para teste, igual ao
padrao ja usado em `image-selection.service.js`). Endpoints novos em
`server.js`, todos protegidos por `DEMO_ACCESS_KEY` como os demais:

- `POST /api/auth/registrar` (email + senha, minimo 6 caracteres);
- `POST /api/auth/login` (retorna `access_token`);
- `GET /api/auth/perfil` (header `Authorization: Bearer <token>`, retorna
  `usuario_id` e `email`);
- `/api/status` agora inclui `auth: { provider, configured }`.

Testado de ponta a ponta com conta real (`escoval54@gmail.com`): cadastro
enviou e-mail de confirmacao (confirmado que "Confirm email" continua ativo
no Supabase, ver risco 11), apos clicar no link o login retornou token valido
e `/api/auth/perfil` devolveu os dados corretos.

8 testes novos em `test/integrations.test.js` (validacao de handler sem rede
real + `supabase-auth.service` com client mockado, sem depender do Supabase
de verdade durante `npm test`). Suite completa: 152 testes, todos verdes.

### Plano 14 - fase 2 concluida (frontend): modal de cadastro/login (2026-07-23)

Usuario escolheu modal (nao pagina dedicada), reaproveitando o padrao visual
do modal de senha de demo ja existente. Implementado:

- `public/index.html`: novo modal `authModal` (mesmas classes
  `access-modal`/`premium-input`/`btn-epic` do modal de demo) e botao
  `👤 ENTRAR` na nav principal, que mostra o e-mail quando logado;
- `public/js/app.js`: `abrirModalConta()` alterna entre login/cadastro no
  mesmo modal, `salvarSessaoUsuario`/`encerrarSessaoUsuario` guardam
  `access_token` + e-mail em `sessionStorage` (`chef_ia_sessao_usuario`),
  sem refresh automatico de token ainda (sessao dura o tempo do token do
  Supabase, hoje ~1h por padrao).

Testado num Chrome headless real: login com `escoval54@gmail.com` fecha o
modal, salva a sessao com token JWT valido, botao passa a mostrar o e-mail.
Suite automatizada nao cobre este JS de tela (mesma limitacao dos outros
arquivos em `public/js/`); validado manualmente via CDP.

Ideia do usuario para o futuro (nao e a prioridade agora): uma tela de
abertura animada com o logo do Chef IA Studio, que dai leva para cadastro ou
para o app. Guardar essa intencao para quando a tela de login for revisada;
o modal atual foi escolhido para nao bloquear o Plano 14 agora.

### Plano 14 - fase 3: fornecedores proprios (2026-07-25)

Migracao `supabase/migrations/001_fornecedores.sql`: tabela `fornecedores`
(nome, categoria, telefone, endereco, observacoes), RLS por dono, grant
explicito para `authenticated` (sem isso da "permission denied" mesmo com RLS
certo), trigger para `updated_at`, `check` na categoria usando as mesmas
opcoes de `setor` da lista de compras (Hortifruti/Acougue/Bebidas/Mercearia/
Frios/Padaria/Descartaveis/Limpeza/Outros).

`src/services/personalizacao/fornecedores.service.js`: usa um client Supabase
por requisicao, autenticado com o token do proprio usuario (nao o
service_role), entao a RLS filtra tudo automaticamente. Endpoints:
`GET/POST /api/fornecedores`, `PUT/DELETE /api/fornecedores/:id`, todos atras
da senha de demo + token de usuario valido. Testado ponta a ponta com conta
real. 6 testes novos.

### Plano 14 - fase 4: fotos proprias de prato/receita (2026-07-26)

Bucket de storage `fotos-pratos` criado direto por codigo (API do
service_role, nao pelo painel): privado, limite 5MB, so jpeg/png/webp.
Migracao `supabase/migrations/002_fotos_pratos.sql`: tabela `fotos_pratos`
(nome_prato opcional, storage_path unico), RLS por dono na tabela e em
`storage.objects` (cada usuario so acessa arquivos dentro da propria pasta
`<user_id>/...`), `check` garantindo que `storage_path` sempre comeca com o
`user_id` da linha.

`src/services/personalizacao/fotos.service.js`: recebe a imagem em base64 no
corpo JSON (rota com limite de 8MB, maior que o padrao de 20KB do resto do
app), decodifica, valida tipo/tamanho, envia pro storage com nome aleatorio
(uuid) dentro da pasta do usuario, salva metadados. Ao listar, gera URL
assinada (valida 10 minutos) por foto. Endpoints: `GET/POST /api/fotos`,
`DELETE /api/fotos/:id`. Testado ponta a ponta com conta real (enviar, listar
com URL assinada, remover, confirmar remocao no storage e no banco). 6 testes
novos.

Revisao de seguranca (Supabase Advisors) apos as migracoes: 0 erros, 4
avisos. Corrigido o que era meu (funcao de trigger sem `search_path` fixo,
ver `003_fix_search_path.sql`). Os outros 3 avisos sao da plataforma, nao do
codigo deste projeto, e ficam registrados como pendencia de baixa prioridade
para antes de qualquer lancamento real:

- `rls_auto_enable()` (criada pelo proprio Supabase ao ativar RLS automatico):
  **corrigido em 2026-07-28** (`supabase/migrations/005_revoke_rls_auto_enable.sql`,
  aplicado pelo usuario no painel). `revoke execute` de `public`, `anon` e
  `authenticated` — so o Supabase internamente ainda pode chamar a funcao
  via trigger. Confirmado ao vivo depois: insert/select/delete em
  `fornecedores` via RLS continuam funcionando normalmente para um usuario
  de teste descartavel; nada quebrou;
- protecao contra senha vazada (checagem contra o HaveIBeenPwned): **correcao
  de registro anterior** — nao e gratuita. Testado ao vivo em 2026-07-28: o
  toggle em Authentication → Sign In / Providers → Email → "Prevent use of
  leaked passwords" fica travado com a nota "Only available on Pro plan and
  above". Como o projeto prioriza plano gratuito (ver decisao do Plano 14),
  fica registrada como limitacao conhecida, sem acao — nao migrar de plano
  so por causa disso;
- (ja registrado antes) "Confirm email" continua ativo, que e o correto.

### CAPTCHA nas rotas de auth: avaliado e adiado (2026-07-28)

Cogitado ativar "Enable Captcha protection" (hCaptcha) no Supabase junto
com a checagem de senha vazada, mas descartado por enquanto. Motivo:

- as rotas `/api/auth/registrar` e `/api/auth/login` ja tem
  `limitadorAuth` (20 tentativas/15min por IP, ver Plano 15) — isso ja cobre
  a maior parte do abuso automatizado (criacao de contas em massa, forca
  bruta de senha) que o CAPTCHA tambem resolveria;
- CAPTCHA adiciona friccao real ao usuario (mais uma etapa visivel no
  cadastro/login) sem beneficio adicional relevante no volume de trafego
  atual (projeto em fase de teste, poucos usuarios reais);
- nao e so um toggle: exigiria criar conta no hCaptcha, adicionar o widget
  no formulario de cadastro/login (`public/index.html`/`app.js`), e propagar
  o token do captcha do front-end ate `supabaseAuthService.cadastrar/login`
  no backend — trabalho de implementacao real, nao configuracao.

Reavaliar se: (a) aparecer spam real de contas na lista de usuarios do
Supabase, ou (b) o trafego crescer significativamente antes do lancamento
real. Ate la, nao e uma pendencia — foi avaliado e decidido nao fazer, com
motivo registrado.

### Plano 14 - fase 5: primeiro deploy na Vercel, crash e correcao (2026-07-26)

Criados `api/index.js` (reexporta so o `app` de `server.js`) e `vercel.json`
(rewrite geral pra essa funcao). Testado localmente com `http.createServer`
simulando exatamente a invocacao da Vercel: todas as rotas (estatico, API,
protegida) responderam certo.

Primeiro deploy real: **crash** (`500 FUNCTION_INVOCATION_FAILED`). Log real:
"Exportação inválida encontrada no módulo /var/task/server.js. A exportação
padrão deve ser uma função ou um servidor." Causa: a Vercel detectou o preset
"Express" e usou `server.js` direto (via `"main"` do `package.json`),
ignorando `api/index.js`; `server.js` exporta um objeto (`{ app, ... }`), nao
uma funcao, e o preset exige a exportacao padrao ser a funcao/app diretamente.

Corrigido mudando so o `"main"` do `package.json` para `api/index.js` (nao
mexe em `server.js` nem nos testes, que importam por caminho relativo).
Tambem chave `engines.node` atualizada de `22.x` para `24.x` (a Vercel avisou
que 22.x seria substituido). Suite completa revalidada apos a mudanca.

Tambem chave `rotacionada` em 2026-07-26: `SUPABASE_SERVICE_ROLE_KEY`,
`GEMINI_API_KEY`/`GOOGLE_API_KEY` e `DEMO_ACCESS_KEY` local foram expostas
sem querer numa saida de comando durante o troubleshooting e foram
rotacionadas por precaucao. Nenhum codigo do app usa
`SUPABASE_SERVICE_ROLE_KEY` em tempo de execucao hoje (so foi usada uma vez,
manualmente, pra criar o bucket de storage), entao a rotacao nao teve
impacto funcional.

Segundo deploy (apos a correcao do `main`): a funcao parou de crashar
(`/api/status`, `/js/app.js`, `/gerar-cardapio` e `/api/auth/login`
responderam certo em producao), mas `GET /` deu 500. Causa: a Vercel serve
`public/` como estatico separado da funcao; minha regra de rewrite generica
(`/(.*)`) tambem capturava a rota raiz `/` e mandava pra funcao, que tentava
`res.sendFile` num arquivo que nao existe no pacote da funcao. Corrigido no
`vercel.json` adicionando uma regra especifica antes da generica, mandando
`/` direto pro `index.html` estatico (sem passar pela funcao). Esse ajuste
sozinho nao resolveu: o log do proximo deploy mostrou o mesmo erro exato
("Exportação inválida... /var/task/server.js"), sugerindo que o projeto na
Vercel guardou uma configuracao de framework ("Express") vinculada
diretamente ao `server.js`, independente do `vercel.json` ou do `main` do
`package.json`.

Correcao definitiva, na raiz: `server.js` agora exporta a propria funcao
Express como padrao (`module.exports = app`) e anexa os handlers como
propriedades via `Object.assign` (`app.gerarCardapioHandler = ...` etc.),
preservando `const { app, xHandler } = require('../server')` nos testes.
Assim, seja qual for o arquivo que a Vercel decidir usar como entrada
(`server.js` ou `api/index.js`), ambos agora exportam uma funcao valida.
Confirmado localmente com `http.createServer` chamando os dois diretamente:
os dois respondem `GET /` e `GET /api/status` corretamente. Suite completa
(164 testes) revalidada.

### Plano 14 - fase 5, bug real pos-deploy: cadastro "sem retorno" para e-mail ja existente (2026-07-26)

Apos o deploy funcionar, o usuario testou a producao e relatou tres pontos:
(a) nao conseguia criar conta — bug real; (b) nao ha login social/Google —
funcionalidade ausente, sem urgencia; (c) a exigencia da senha demo no
cadastro/login e aceitavel agora, mas precisa sair antes do lancamento real.

Investigando (a): reproduzido localmente com CDP (Chrome headless) o fluxo
exato do usuario (abrir modal de conta, alternar para cadastro, preencher,
clicar em "Cadastrar", responder ao modal aninhado de senha demo). Com um
e-mail novo o fluxo funcionou de ponta a ponta sem erro. A diferenca: o
usuario tentou cadastrar `escoval54@gmail.com`, que ja tinha conta criada
durante os testes da fase 2.

Causa raiz confirmada com uma chamada direta ao Supabase (`auth.signUp` no
projeto real, fora do app): quando o e-mail ja tem conta e "Confirm email"
esta ativo, o Supabase **nao retorna erro** — devolve um usuario "fantasma"
(`identities: []`, sem sessao) como protecao contra enumeracao de contas por
e-mail. `src/services/auth/supabase-auth.service.js` nao tratava esse caso e
interpretava a ausencia de sessao como `confirmacao_pendente: true`, entao a
tela mostrava "Cadastro criado. Confira seu e-mail..." mesmo sem criar nada e
sem enviar e-mail algum — por isso "o botao nao da retorno": a mensagem
aparecia, mas era falsa, e nenhuma confirmacao chegava.

Corrigido em `cadastrar()`: quando `data.session` for nulo e
`data.user.identities` for um array vazio, agora lanca `ErroAutenticacao`
("Este e-mail ja possui uma conta. Tente entrar ou recuperar sua senha.",
status 409) em vez de reportar sucesso falso. `server.js` ja propagava
`error.statusCode`/`error.message` corretamente, entao nenhuma mudanca foi
necessaria ali. Verificado com uma chamada real contra
`escoval54@gmail.com`: o erro 409 correto agora e retornado. Teste de
regressao adicionado em `test/integrations.test.js`
("cadastrar detecta e-mail ja existente..."); suite completa em 165/165.

(b) e (c) permanecem como pendencias documentadas, sem acao nesta sessao.

### Remocao do DEMO_ACCESS_KEY das rotas de conta (2026-07-27)

Pendencia (c) acima resolvida. `DEMO_ACCESS_KEY` agora protege **so** as
rotas que consomem cota externa paga/limitada: `/gerar-cardapio`
(Gemini), `/api/imagens-evento` (Openverse) e `/api/referencias-receitas`
(Spoonacular). Removido de `registrarHandler`, `loginHandler`,
`perfilHandler` e de todos os handlers de `/api/fornecedores` e
`/api/fotos` em `server.js` — essas rotas ja sao protegidas de verdade
pelo token do Supabase (RLS + `obterUsuario`), a senha demo nunca foi mais
que uma camada extra redundante ali, e para contas reais ela so atrapalhava.

Efeito colateral bom: o front-end (`public/js/app.js`, funcao `enviar()`
do modal de conta) parou de chamar `obterDemoAccessKey()` antes de
cadastrar/logar, entao o modal aninhado de senha demo (a causa do bug
original desta fase) nao aparece mais nesse fluxo — resolvido de forma
definitiva, nao so contornado.

Testado ao vivo: login/registro sem nenhum header de demo key retornam o
erro real de credenciais (nao mais 401 de senha demo); `/gerar-cardapio`
sem a chave continua dando 401 normalmente; `/api/fornecedores` sem token
continua dando 401 por token ausente. Fluxo completo de cadastro
reproduzido via Chrome headless: sem modal de demo, cadastro concluido em
uma unica etapa. 4 testes que verificavam o gate antigo (registrar,
POST/PUT/DELETE fornecedores, POST fotos) foram removidos de
`test/integrations.test.js` por descreverem um comportamento que nao
existe mais; suite completa em 161/161.

**Falha encontrada numa segunda revisao pedida pelo usuario, e corrigida no
mesmo dia**: ao remover o gate de demo de `/api/fornecedores` e
`/api/fotos`, essas rotas ficaram sem nenhum throttling — diferente de
`/api/imagens-evento` e `/api/referencias-receitas`, que tem contadores
diarios proprios (Openverse/Spoonacular), fornecedores e fotos so validam
o token do usuario, sem limite de quantas escritas por minuto. Um usuario
autenticado rodando um script em loop podia estourar a cota gratuita de
banco/storage do Supabase rapidamente (ex.: ~200 chamadas de upload de
foto de 5MB esgotariam o 1GB gratuito). Corrigido com um novo limitador
(`limitadorPersonalizacao`, 30 requisicoes/min por IP) aplicado as 7 rotas
de fornecedores e fotos. Testado ao vivo: 30 requisicoes passam, a 31a
recebe 429. Suite completa e E2E de galeria revalidados sem regressao.

### Plano 16, item 2: usuario usar a propria chave Gemini (2026-07-28)

Implementado por completo (so backend, sem UI ainda — mesmo padrao de
fornecedores/fotos na Fase 3/4, que tambem ficaram sem tela dedicada).

- Nova tabela `chave_ia_usuario` (migracao
  `supabase/migrations/004_chave_ia_usuario.sql`, aplicada pelo usuario no
  painel do Supabase): uma linha por usuario, RLS identica ao padrao de
  fornecedores/fotos (`auth.uid() = user_id` em select/insert/update/delete).
- A chave nunca chega ao banco em texto plano: `src/utils/crypto-chave-ia.js`
  cifra com AES-256-GCM antes de gravar (`chave_cifrada` + `iv` + `tag`),
  usando uma chave mestra propria (`CHAVE_IA_ENCRYPTION_SECRET`, gerada e
  gravada direto no `.env` nesta sessao, nunca exibida no chat). Um segredo
  errado ou ausente faz a decifragem falhar (GCM detecta), tratado como "sem
  chave configurada" em vez de erro fatal.
- `src/services/personalizacao/chave-ia.service.js` segue o mesmo formato
  de `fornecedores.service.js`/`fotos.service.js` (cliente por token,
  `ErroChaveIA` com `statusCode`).
- Novas rotas em `server.js`: `GET/PUT/DELETE /api/perfil/chave-ia`
  (status/salvar/remover), protegidas por token real (nao por senha demo) e
  pelo `limitadorPersonalizacao` ja existente.
- `gerarCardapioHandler` agora verifica, antes do gate de demo, se quem
  fez a chamada tem token valido **e** chave propria configurada; se tiver,
  usa `criarGeminiService({ apiKey: chaveDoUsuario })` (a factory ja
  aceitava uma chave alternativa, criada para os scripts de benchmark) em
  vez do servico padrao, **e pula o gate de `DEMO_ACCESS_KEY`** — faz
  sentido, pois quem traz a propria chave nao consome a cota compartilhada.
  O rate limit de geracao (`limitadorGeracao`) continua valendo para todos.
  A resposta ganha `meta.chave_ia_propria: true/false` para transparencia.
- Testado ao vivo contra o Supabase real (usuario de teste descartavel,
  criado e removido via `service_role`, nunca a conta pessoal do usuario):
  status antes/depois de configurar, geracao real de cardapio (13 pratos)
  **sem nenhum header de senha demo**, `meta.chave_ia_propria: true`
  confirmado, remocao da chave e volta correta a exigir a senha demo depois
  de removida. Suite completa (167/167, 6 testes novos) e E2E de galeria
  revalidados sem regressao.

### Login social com Google (2026-07-28)

Implementado e testado ao vivo. Diferente do login por e-mail/senha (100%
backend), OAuth com Google exige o navegador ser redirecionado pro Google e
voltar com a sessao — isso e feito pelo `supabase-js` direto no
navegador (carregado via CDN jsdelivr), so para esse fluxo. O resto do app
continua falando so com o nosso backend, sem mudanca.

- **Google Cloud**: projeto `app-cardapio-ia` criado (nome tecnico neutro —
  ver `project_name_trademark_conflict` na memoria: "Chef IA" tem conflito
  de marca/patente e vai precisar ser renomeado antes do lancamento real,
  ainda sem nome definido; por isso nada novo foi criado usando esse nome).
  Tela de consentimento OAuth (Externo, modo Teste) + credencial Web com
  redirect URI `https://<projeto>.supabase.co/auth/v1/callback`.
- **Supabase**: provider Google habilitado (Authentication → Providers) com
  o Client ID/Secret do Google; `Redirect URLs` em URL Configuration inclui
  `http://localhost:3000/**`. "Skip nonce checks" e "Allow users without an
  email" deixados desligados (nao se aplicam ao nosso caso e reduziriam
  seguranca/exigem tratamento que o app nao tem).
- **Backend**: `/api/status` agora expoe `auth.supabase_url` e
  `auth.supabase_anon_key` — seguro por design (RLS protege os dados; a
  anon key sozinha nao da acesso a nada). CSP (`server.js`) ganhou
  `https://cdn.jsdelivr.net` em `script-src` e a URL do proprio Supabase em
  `connect-src`, senao o `supabase-js` no navegador seria bloqueado.
- **Front-end**: botao "Entrar com Google" no modal de conta
  (`public/index.html`); `public/js/app.js` inicializa um `supabaseClient`
  com a URL/chave publicas, e um listener `onAuthStateChange` converte a
  sessao do Google pro mesmo formato que o login por e-mail/senha ja usa
  (`salvarSessaoUsuario`), fechando o modal automaticamente.
- Testado ao vivo (Chrome headless) ate o ponto onde so falta a senha real
  do Google: biblioteca carregada sem erro de CSP, `supabaseClient`
  inicializado, clique no botao navegou corretamente ate
  `accounts.google.com` com o Client ID e redirect_uri certos. O usuario
  completou o login de verdade manualmente depois e confirmou funcionando
  (nav trocou de "ENTRAR" para o e-mail da conta Google).
- **Achado do usuario durante o teste, registrado para o Plano 16 item 7**:
  a barra de navegacao mostra "GERADOR IA", "APRESENTACAO" e a conta do
  usuario logado com o mesmo peso visual (tres botoes lado a lado) — reforca
  a necessidade da reestruturacao ja planejada (apresentacao -> login ->
  gerador, com a conta tratada como status, nao como aba de navegacao).

### Nome novo escolhido: "Karamu" (2026-08-05)

Resolvida a pendencia de conflito de marca/patente com "Chef IA" (ver
Plano 15/16 mais acima). Processo: brainstorm de nomes compostos por raizes
de idiomas diferentes (portugues/latim, arabe, turco, frances, sanscrito,
japones, suaili), testando cada candidato via busca na web antes de
apresentar — varias colisoes reais encontradas nesse processo (Convivia,
Saboria, Cardápia e Nutrivia ja existem como apps no mesmo nicho de
comida/eventos/IA; Sofra, Hostly, Gatherly, Feastify, Utsav e Bereket
tambem colidem forte). Shortlist final: Karamu (suaili, "banquete/festa")
vs Convive (frances, "comensal"). O usuario fez a busca real no INPI
(busca.inpi.gov.br) em "Convive": so achou marca de administradora de
condominios, uma extinta e duas com pedido indeferido, classe nao
relacionada — nao seria problema, mas decidiu por Karamu mesmo assim
("Karamu" tambem sem nada registrado no INPI).

Decidido explicitamente **nao** usar "Chef Karamu": juntar de volta a
palavra generica problematica ("Chef") enfraqueceria a marca (uma palavra
unica e distintiva sozinha e mais forte juridicamente) e soaria mais como
nome de uma pessoa/chef do que de um produto.

**Forma final confirmada: "Karamu" sozinho, sem "Studio".** Execucao da
troca (README, estes documentos, texto visivel em `public/index.html`,
`package.json`, e opcionalmente os nomes ja criados no Google Cloud/OAuth
que usam o placeholder neutro `app-cardapio-ia`) foi **adiada de proposito
pelo usuario** para acontecer junto com a reestruturacao de navegacao
(Plano 16, item 7) — nao fazer a troca antes disso sem o usuario pedir.
Falta ainda: busca formal no INPI por classe (provavel NCL 42, possivelmente
9/35/41) antes de registrar de verdade a marca ou comprar dominio.

### Plano 16, item 6: precos proprios por usuario (2026-08-06)

Implementado por completo no backend (mesmo padrao das outras rotas de
personalizacao: fornecedores/fotos/chave-ia).

- Nova tabela `precos_usuario` (migracao
  `supabase/migrations/006_precos_usuario.sql`, aplicada pelo usuario no
  Supabase): `item`, `unidade`, `preco` (numeric, >= 0), `categoria`
  (mesma lista de `fornecedores`), `observacoes`, e `fornecedor_id`
  opcional (FK para `fornecedores`, `on delete set null`). RLS identica ao
  padrao existente (`auth.uid() = user_id` em select/insert/update/delete).
- `src/services/personalizacao/precos.service.js`: reaproveita
  `CATEGORIAS_VALIDAS` de `fornecedores.service.js` em vez de duplicar a
  lista. Quando `fornecedor_id` e informado, o service confirma que o
  fornecedor pertence ao mesmo usuario antes de gravar (consulta usando o
  client escopado pelo token do proprio usuario — a RLS de `fornecedores`
  ja faz o trabalho de esconder fornecedores de outra pessoa, entao a
  consulta so "encontra" o registro se for realmente do dono).
- Rotas em `server.js`: `GET/POST/PUT/DELETE /api/precos` e
  `GET /api/precos/exportar` — exportacao em CSV com separador `;` e
  virgula decimal (formato que o Excel brasileiro espera nativamente,
  sem precisar de configuracao especial na importacao), com BOM UTF-8 no
  inicio do arquivo para acentos aparecerem corretos no Excel.
- Testado ao vivo contra o Supabase real (usuario de teste descartavel):
  criar fornecedor, criar preco vinculado a ele, listar, atualizar,
  exportar CSV (conferido o conteudo exato), e confirmado que tentar
  vincular um preco ao fornecedor de **outro** usuario retorna 404
  corretamente (RLS bloqueando por baixo). Suite completa (171/171
  declaradas, 176 execucoes) e E2E de galeria revalidados sem regressao.
- Falta so a interface — mesma situacao das outras rotas de personalizacao
  (fornecedores/fotos/chave-ia), nenhuma tem tela ainda.

### Interface unificada de perfil (2026-08-06)

Construida a tela de perfil que faltava para fornecedores, fotos, chave de
IA e precos — as quatro personalizacoes do Plano 14/16 que so tinham
backend ate agora ganharam UI de uma vez so, em vez de quatro telas
separadas (era a recomendacao ja registrada aqui mesmo).

- **Onde fica**: nao mudou a hierarquia da navegacao (isso continua
  reservado para o Plano 16 item 7, critico). O botao de conta (email do
  usuario) agora abre essa tela em vez de perguntar login/logout na hora;
  `switchView()` em `app.js` ganhou um terceiro estado ('perfil'), ao lado
  de 'app'/'pitch'. O botao "Sair da conta" ficou dentro da propria tela.
- **HTML**: nova secao `#perfilSection` em `public/index.html`, com 4 abas
  (Fornecedores, Fotos, Chave de IA, Precos) usando as mesmas classes CSS
  ja existentes (`glass-panel`, `form-grid`, `premium-input`, etc.) mais um
  punhado de classes novas e pequenas em `form.css`
  (`.perfil-tab`, `.perfil-item-card`, `.perfil-status-badge`).
- **JS**: novo arquivo `public/js/perfil.js` (carregado depois de
  `app.js`), com todo o CRUD via fetch para as rotas ja existentes
  (`/api/fornecedores`, `/api/fotos`, `/api/perfil/chave-ia`,
  `/api/precos`), incluindo upload de foto (le o arquivo como data URL no
  navegador antes de enviar) e exportacao do CSV de precos (baixa via
  `Blob`/`URL.createObjectURL`, sem precisar de link direto — a rota exige
  token, entao nao daria pra usar um `<a href>` simples).
- **CSP ajustada**: as miniaturas de foto vem de URL assinada do Supabase
  Storage (mesmo dominio do projeto), e `img-src` so tinha `'self'`,
  `data:` e o Unsplash — sem a URL do Supabase, as fotos ficariam
  quebradas. Corrigido em `server.js` junto desta mudanca.
- **Achado durante os testes**: um teste em `test/visual.test.js` fazia
  checagem literal de texto-fonte (`btnApp.setAttribute('aria-pressed',
  'true')`) que quebrou quando o `switchView()` foi reescrito de if/else
  para um loop (mesmo comportamento, codigo diferente). Ajustado o teste
  para checar o padrao novo em vez de reverter uma simplificacao razoavel.
- Testado ao vivo (Chrome headless, usuario de teste descartavel):
  criar fornecedor (aparece na lista e no select de fornecedor dos
  precos), enviar foto (aparece com miniatura), salvar chave de IA (badge
  muda para "configurada"), criar preco vinculado ao fornecedor (aparece
  com valor formatado em R$), trocar de aba, remover a chave de IA (badge
  volta), exportar CSV (conteudo conferido). Zero erros/avisos de console
  em todo o fluxo. Suite completa (176/176) e E2E de galeria revalidados
  sem regressao.

### Fornecedores/precos passam a "conversar" com o gerador; chave de IA sai das abas principais (2026-08-06)

Feedback do usuario ao ver a interface de perfil pronta: fornecedores e
precos eram cadastros isolados, sem nenhuma ligacao com `/gerar-cardapio` —
o usuario podia cadastrar um fornecedor e um preco e isso nao mudava em
nada o cardapio gerado. E a aba "Chave de IA" (BYOK) ficava lado a lado com
fornecedores/fotos/precos como se fosse um recurso comum, quando na
pratica reduz conversao (a maioria dos usuarios nao tem chave Gemini
propria) e amplia a superficie de seguranca (chave de terceiro
armazenada, ainda que cifrada).

- **Catalogo regional no prompt + estimativa de custo local**: nova funcao
  `obterCatalogoUsuarioOuNulo()` em `server.js` busca fornecedores+precos
  do usuario autenticado (quando existem) e passa como
  `catalogoUsuario` para `montarPromptPlanejamento()`
  (`src/prompts/event.prompt.js`), numa secao nova "CATALOGO REGIONAL DO
  USUARIO". A IA continua proibida de gerar precos/custos nos campos de
  saida (regra ja existia), mas agora e instruida a preferir, quando fizer
  sentido, os mesmos nomes de item do catalogo do usuario — isso permite
  o cruzamento automatico depois.
- Novo servico puro `src/services/planning/custo-estimado.service.js`
  (`calcularEstimativaCusto`) cruza `lista_compras` do plano gerado com o
  catalogo do usuario por nome (normalizado, sem acento) e unidade
  (converte kg/g, L/ml automaticamente quando compativel), somando um
  `total_estimado`. Roda depois da geracao, sem custo de mais uma chamada
  a IA; falha silenciosa (nunca derruba a geracao) se der erro.
  `gerarCardapioHandler` anexa o resultado em `plano.estimativa_custo` e
  em `meta.catalogo_usuario_aplicado`/`meta.custo_estimado_total`.
- **Frontend**: `render.js` ganhou `renderEstimativaCusto()` (secao "Custo
  Estimado com Seus Fornecedores", com o total e quantos itens foram
  encontrados) e a lista de compras (`renderCompras`) agora mostra uma
  etiqueta de preco/fornecedor ao lado de cada item que bateu no catalogo.
- **Chave de IA saiu das abas principais**: em `public/index.html`, o
  painel `#perfilPainelChaveIA` deixou de ser uma 5a aba e virou um
  `<details>` recolhido ("Configuracoes avancadas: usar minha propria
  chave de IA") logo acima do botao "Sair da conta". `perfil.js` perdeu a
  entrada `"chave-ia"` do mapa `PERFIL_PAINEL_POR_ABA`; o backend e o
  restante do fluxo (salvar/remover chave, badge de status) nao mudaram.
  As abas visiveis agora sao so Fornecedores, Fotos e Precos.
- Testado ao vivo (usuario descartavel + Chrome headless): fornecedor +
  preco cadastrados via API, `/gerar-cardapio` chamado de verdade — a IA
  usou o nome exato "Tomate" do catalogo, o backend casou e calculou
  `R$ 12,75` (1,5 kg a R$ 8,50/kg) e devolveu tudo em
  `meta.catalogo_usuario_aplicado`/`plano.estimativa_custo`. Renderizacao
  da secao de custo e das etiquetas de preco na lista de compras
  conferida em Chrome headless (sem erros de console). Fluxo completo de
  perfil (fornecedores/fotos/chave-ia via `<details>`/precos) reexecutado
  sem regressao. Suite completa: 183/183.

### Revisao de codigo do catalogo/estimativa de custo e 4 correcoes (2026-08-06)

`/code-review` (7 subagentes em paralelo) sobre o trabalho acima encontrou 4
problemas reais, todos corrigidos no mesmo dia (mais um 5o achado que foi
checado ao vivo contra o Supabase real e **descartado** por nao reproduzir:
a suspeita de que `preco.preco.toFixed(2)` em `exportarCSV` quebraria porque
PostgREST devolveria `numeric` como string — testado com insert/select reais
e confirmado que este projeto devolve `number`, sem bug):

- **Correspondencia por substring podia pegar o preco de um produto errado**
  (`custo-estimado.service.js`): catalogo "Frango" (kg) casava por substring
  com uma compra "Frango a Passarinho" (kg) e usava o preco do frango
  inteiro para um produto diferente, sem nenhum aviso. Corrigido separando
  correspondencia exata de aproximada (`correspondencia_exata`): so a exata
  entra no `total_estimado` principal; a aproximada vai para
  `total_aproximado`/`itens_aproximados`, mostrada a parte na tela com "~"
  e um aviso explicito de que pode nao ser o mesmo produto.
- **Nomes duplicados na lista de compras mostravam o preco errado**
  (`render.js`, `renderCompras`): a etiqueta de preco era casada por nome
  num `Map`, entao duas linhas com o mesmo item (ex.: "Tomate" usado em dois
  pratos, quantidades diferentes) faziam a segunda sobrescrever a primeira e
  as duas mostravam o subtotal da ultima. Corrigido: `calcularEstimativaCusto`
  agora garante 1 item de saida por linha de `lista_compras`, na mesma
  ordem (nunca mais usa `continue` sem empurrar um item, mesmo em nomes
  vazios), e `renderCompras` pareia por indice em vez de por nome — nao
  precisa mais de normalizacao de texto nesse ponto.
- **Duas chamadas serializadas ao Supabase Auth por geracao de cardapio**
  (`server.js`): `obterChaveIAUsuarioOuNulo` e `obterCatalogoUsuarioOuNulo`
  cada um verificava o token por conta propria. Corrigido com
  `obterTokenAutenticadoOuNulo` (verifica uma vez) + os dois lookups de
  dados rodando em paralelo via `Promise.all`.
- **`normalizarTexto` duplicado**: o arquivo novo repetia a mesma funcao de
  remover acento/normalizar caixa que ja existia em `render.js`
  (`normalizarTextoComparacao`, removida — deixou de ser necessaria depois
  do fix de indice acima) e, no backend, em pelo menos 12 outros arquivos em
  `src/` (pre-existentes, nao criados nesta sessao). Extraido
  `src/utils/text-normalize.js` e `custo-estimado.service.js` passou a
  importar de la. **Nao mexido**: os ~12 outros arquivos do backend que já
  tinham sua propria copia antes desta sessao — consolida-los é um
  refactor maior, fora do escopo deste fix pontual; registrado como
  proxima acao abaixo.
- Todas as correcoes reverificadas: suite completa 185/185, `/gerar-cardapio`
  chamado de verdade de novo (fornecedor+preco reais, geracao real,
  `correspondencia_exata: true` no resultado), e um teste de renderizacao
  em Chrome headless simulando duas linhas duplicadas + uma correspondencia
  aproximada confirmando que cada linha mostra seu proprio subtotal correto
  e a aproximada aparece marcada com "~"/"(aprox.)".

### Plano 16, item 7: reestruturacao de navegacao + execucao do rename para "Karamu" (2026-08-06)

Item marcado **CRITICO** pelo proprio usuario ("nao pode ser esquecido pois
isso resulta na falha do projeto"), executado junto com a troca de nome
combinada desde a decisao de 2026-08-05. Duas decisoes de produto foram
tomadas antes de mexer no codigo (perguntadas diretamente ao usuario, ja
que o roadmap registrava isso como questao em aberto):

- **Acesso demo continua existindo**, mas so depois da apresentacao — nao
  mais como atalho direto pro gerador. Visitante ve a apresentacao
  primeiro e la escolhe "Criar conta / Entrar" OU "Testar com senha demo"
  (sem criar conta).
- **A apresentacao so aparece para quem ainda nao tem sessao nem escolheu
  o modo demo.** Quem ja passou por um dos dois (sessao real ou flag de
  modo demo, ambos em `sessionStorage`) cai direto no gerador nos proximos
  carregamentos da pagina, sem repetir o gate.

**O que mudou:**

- **Nav de 3 abas paralelas removida.** `<nav class="mode-nav">` com
  "GERADOR IA" / "APRESENTACAO" / "ENTRAR" lado a lado (mesmo peso visual,
  dava pra pular direto pro gerador) virou `<nav class="status-bar">` com
  so 2 botoes: a marca ("🍽️ Karamu", volta pra apresentacao — nao mais um
  botao de aba) e o status de conta (`#btnConta`, visualmente mais
  discreto que antes — `.account-status` em `layout.css` — porque agora e
  um indicador de status, nao uma acao de mesmo peso que o gerador).
- **Fluxo sequencial**: `public/index.html` inverteu os `class="hidden"`
  padrao (`appSection` comeca escondido, `pitchSection` comeca visivel) pra
  evitar flash da tela errada antes do JS rodar; `switchView()` em
  `app.js` perdeu a logica de sincronizar `aria-pressed`/`.active` dos
  antigos botoes (nao existem mais) e ganhou a chamada a
  `atualizarPitchCta()` sempre que mostra a apresentacao.
- Novo CTA no fim da apresentacao (`#pitchCtaArea`, dentro do ultimo slide
  do pitch deck), preenchido dinamicamente por `atualizarPitchCta()`:
  mostra "Criar conta / Entrar" + "Testar com senha demo" para quem
  chega pela primeira vez, ou um unico "Ir para o gerador →" para quem ja
  tem sessao ou ja escolheu o modo demo.
- Novo estado `chef_ia_modo_demo_ativo` em `sessionStorage` (funcao
  `modoDemoAtivo()`/`entrarModoDemo()`), no mesmo padrao ja usado por
  `chef_ia_sessao_usuario`. Login/cadastro por e-mail, login social
  (Google) e o clique em "Testar com senha demo" agora levam direto pro
  gerador (`switchView('app')`) em vez de deixar o usuario parado na
  apresentacao depois de entrar.
- `atualizarBotaoConta()` ganhou um terceiro estado: sem sessao mostra
  "Entrar"; sem sessao mas com modo demo ativo mostra "Modo demo · Criar
  conta" (convite a conversao); com sessao mostra o e-mail (como ja era).
- **Achado durante o teste ao vivo**: `entrarModoDemo()` inicialmente nao
  chamava `atualizarBotaoConta()`, entao o status de conta ficava
  "Entrar" por mais um ciclo depois de ativar o modo demo (so corrigia no
  proximo reload). Corrigido antes de fechar a tarefa.

**Execucao do rename "Chef IA"/"Chef IA Studio" -> "Karamu"** (decidido em
2026-08-05, adiado de proposito ate aqui):

- Cobertura: titulo da pagina, hero (`Kara<span>mu</span>`), todos os
  comentarios de cabecalho `CHEF IA STUDIO | ...` em `public/js/*.js`,
  `public/css/*.css` e `src/**/*.js`, textos de UI (modais, rodape,
  mensagens de loading), o prompt do Gemini (`"Voce e o Karamu..."` em
  `event.prompt.js` e `block-prompts.js`), atribuicoes de imagem
  (`creator`/`attribution` em `image-catalog.service.js`,
  `local-library.json`, `scripts/validate-gallery-ui.js`), textos em
  `data/culinary/source-catalog.json`, `data/pricing/catalog.schema.json`,
  `data/images/image.schema.json`, o SVG de fallback de capa de evento, o
  nome do arquivo PDF baixado (`karamu-{slug}.pdf`, atualizado tambem no
  script `scripts/validate-plan5-e2e.js` que confere esse nome), `.env.example`
  e `README.md`.
- **Dois valores funcionais** (nao so cosmeticos) tambem tiveram que ser
  renomeados com cuidado, por serem comparados/usados como chave em varios
  pontos do backend: o sentinela `"A definir pelo Chef IA"` (formato de
  servico padrao, usado como chave de dicionario e valor de comparacao em
  `validate-event.js`, `operational-planning.service.js`,
  `motor.service.js`, `culinary-matrix.service.js`, `app.js`, `render.js`
  e no `<option>` do HTML) virou `"A definir pelo Karamu"`, e a licenca
  `"chef-ia-original"` (comparada em `image-catalog.service.js`, presente
  no enum de `image.schema.json` e em `local-library.json`, e exibida ao
  usuario em maiusculas como legenda de imagem) virou
  `"karamu-original"`. Ambos renomeados de forma consistente em todos os
  pontos e revalidados pela suite de testes.
- **Deixado de fora de proposito** (nao e branding, e risco real de perda
  de dado ou fora de escopo): as chaves de `sessionStorage`/`localStorage`
  (`chef_ia_sessao_usuario`, `chef_ia_demo_access_key`, `chef_ia_historico`,
  `chef_ia_visual_feedback_v1`) continuam com o nome antigo — renomear
  faria qualquer usuario com dado salvo no navegador (historico de eventos,
  por exemplo) "perder" esse dado silenciosamente no proximo acesso, ja
  que o app passaria a procurar uma chave diferente. Tambem deixados de
  fora: os globais internos `window.chefIA*` (nunca aparecem pro usuario),
  os prefixos de arquivo temporario dos scripts de validacao em
  `/tmp/chef-ia-*` (uso interno de dev, nao branding), e o `$id` do schema
  `data/pricing/catalog.schema.json` (identificador estavel de um arquivo
  ja confirmado como nao carregado por nenhum codigo — ver roadmap).
- Testado ao vivo em Chrome headless, ponta a ponta, com usuario de teste
  descartavel: visitante novo cai na apresentacao (gerador escondido);
  clicar em "testar com senha demo" mostra o gerador e atualiza o status
  de conta; reload com modo demo ativo continua no gerador (nao volta pra
  apresentacao); voltar pra apresentacao pelo clique na marca mostra o CTA
  correto ("ir pro gerador", ja que ha modo demo ativo); login real leva
  direto ao gerador e mostra o e-mail no status de conta; clicar no status
  de conta logado abre o perfil; reload com sessao ativa continua no
  gerador. Zero erros/avisos de console em toda a sequencia. Suite
  completa revalidada: 185/185.

### Segunda revisao de codigo (`/code-review`, 8 subagentes) sobre a reestruturacao de navegacao + rename (2026-08-06)

Achados confirmados e corrigidos:

- **Historico legado quebrado pelo rename**: eventos salvos no `localStorage`
  antes da troca de nome tinham `evento.formatoServico === "A definir pelo
  Chef IA"`; ao restaurar, o `<select>` ficava sem opcao selecionada (valor
  nao existe mais) e o acordeao "opcoes avancadas" abria sozinho (tratava o
  padrao antigo como customizado). Corrigido normalizando o sentinela
  legado no inicio de `carregarDoHistorico()` (`public/js/app.js`).
- **`GET /api/auth/perfil` sem rate limit**: unica rota de conta sem
  nenhum limitador, apesar de chamar o Supabase Auth a cada requisicao —
  permitia sondagem ilimitada de tokens. Adicionado `limitadorPersonalizacao`.
- **Erros reais engolidos sem log**: `obterChaveIAUsuarioOuNulo` e
  `obterCatalogoUsuarioOuNulo` (`server.js`) tinham `catch { return null }`
  silencioso mesmo apos o token ja validado — uma falha real do Supabase
  desaparecia sem rastro. Adicionado `console.error` nos dois.
- **Match aproximado pegava o item errado do catalogo**:
  `encontrarCorrespondencia` (`custo-estimado.service.js`) usava o primeiro
  item que desse substring match (ordem alfabetica), nao o mais especifico
  — "Frango a Passarinho" podia ser precificado com o valor de "Frango".
  Corrigido para priorizar o termo mais longo/especifico entre os
  candidatos aproximados.
- **Formatacao de preco BRL duplicada**: `perfil.js` tinha sua propria
  `perfilFormatarPreco` + prefixo "R$" manual, duplicando `formatarPrecoBRL`
  ja existente em `render.js` (mesmo escopo global, carregado antes).
  Consolidado — `perfil.js` agora reusa `formatarPrecoBRL`.
- **Reexport morto** de `normalizarTexto` em `custo-estimado.service.js`
  (ninguem importava por ali) — removido.
- **Catalogo de precos cortado em 60 itens sem sinalizacao**: usuario com
  mais de 60 precos cadastrados perdia silenciosamente os itens depois do
  corte alfabetico, sem indicacao. Adicionado `meta.catalogo_usuario_truncado`
  quando isso acontece (ainda sem indicacao na UI — so no `meta` por
  enquanto).
- Todas as correcoes verificadas contra o Supabase real (nao so leitura de
  codigo): `/api/auth/perfil` chamado de verdade com usuario descartavel
  (retorna `ok:true` e o cabecalho `RateLimit-Limit: 30`); 65 precos reais
  inseridos para confirmar `meta.catalogo_usuario_truncado: true` disparando
  de verdade em `/gerar-cardapio`; restauracao de historico legado e
  formatacao de preco no perfil conferidas em Chrome headless. Suite
  completa: 187/187 (2 testes novos cobrindo o sentinela legado e o
  tie-break do match aproximado).

### Identidade visual "Karamu Editorial", Fase 2 (botoes) (2026-08-17)

Plano completo em `~/.claude/plans/elegant-skipping-planet.md` (Fase 1 —
tokens/wordmark/favicon — concluida antes, ver roadmap). Fase 2 consolida
as familias de botao fragmentadas que o catalogo original do sistema
visual (feito antes de escrever o plano) tinha identificado: varias
receitas quase-duplicadas sem taxonomia comum. Cada merge foi conferido
contra o codigo real (uso em HTML/JS, se a selecao em JS era por classe
ou por atributo `data-*`, se algum teste fixava o nome da classe) antes
de mexer, nao só copiado do plano original.

- **`.btn-print` → `.btn-epic.btn-compact`**: em vez de uma receita CSS
  paralela (so usada no botao "Baixar PDF" do resultado), virou um
  modificador do `.btn-epic` ja existente (`form.css`), ganhando de
  brinde o efeito de hover (lift) que o `.btn-print` nunca tinha.
- **3 CTAs com `style="width:auto;padding:18px 34px"` inline
  (`app.js`, funcao `atualizarPitchCta`) → `.btn-wide`**: modificador
  novo, mesmo padrao "bare" (sem `--`) que `.btn-small` ja usava
  combinado com `.btn-secondary` — por isso `.btn-compact`/`.btn-wide`
  seguiram esse nome em vez do `.btn-epic--compact` sugerido no rascunho
  original do plano, pra nao introduzir uma segunda convencao de
  nomenclatura ao lado da que ja existe no codebase.
- **`.btn-util` (botao de importar projeto) + `.access-modal-close`
  (fechar modal) → `.btn-icon` (base) + `.btn-round` (modificador do
  botao circular)**: preservado o visual exato de cada um (checado que
  nao havia nenhum `font-size` cascateando pro "X" do modal antes de
  fundir, pra nao mudar o tamanho do glifo sem querer).
- **`.menu-view-btn`/`.menu-nav-btn` (cardapio) e
  `.gallery-view-btn`/`.gallery-nav-btn` (galeria) → `.carousel-toggle`/
  `.carousel-nav` compartilhados**: esse par era o caso mais divergente
  (formatos, cores e tamanhos diferentes pros dois contextos, sem
  motivo). Confirmado antes de mexer que `render.js` sempre seleciona
  esses botoes por atributo (`document.querySelectorAll("[data-menu-view]")`
  etc.), nunca por classe, e que nenhum teste fixa esses nomes de classe
  — a fusao era segura. Design final: formato pilula (ja o padrao
  dominante no resto do app — 14+ usos de `border-radius:999px` so em
  `result.css`, contra o retangulo de cantos leves que so a galeria
  usava) com estado ativo em fundo `--ink-strong` + texto `--gold`
  (adotando o tratamento que a galeria ja tinha, mais alinhado a regra
  "dourado como unico destaque decorativo" da Fase 1). O anel de foco
  customizado que so a galeria tinha (`outline:2px solid
  rgba(213,165,20,.24)`, diferente do `button:focus-visible` global
  definido em `base.css` na Fase 1) foi removido a favor do global, em
  vez de mantido como uma segunda regra de foco conflitante.
- **`.btn-secondary` retintado**: as 4 cores cinza hardcoded
  (`#f0f0f0`/`#ddd`/`#999`/`#333`, usado em ~7 pontos — cancelar,
  limpar historico, exportar CSV, remover fornecedor/foto/preco) viraram
  os tokens da Fase 1 (`--cream-border`/`--sand`/`--ink`/`--ink-faint`),
  saindo do cinza neutro pro tom creme quente da identidade.
- **Codigo morto removido**: `.dish-card`/`.card-top` (ja apontado como
  morto no catalogo original do plano) e, achado nesta fase com a mesma
  verificacao (zero referencia em HTML/JS), `.live-item`/
  `.live-item.checked` — o comentario "CHECKLIST" que só introduzia essas
  duas regras tambem foi removido (a renderizacao real de checklist usa
  markup generico de secao, nunca usou essa classe).
- **Achado durante a limpeza**: uma segunda ocorrencia de `.btn-util`
  dentro do media query mobile de `form.css` (linha ~604, uma regra
  responsiva separada da definicao principal) nao apareceu na primeira
  varredura e só foi pega numa segunda busca ampla por qualquer
  referencia remanescente ao nome antigo — corrigida antes de considerar
  a fase concluida.
- Verificado: `npm test` (189/189, sem nenhum teste fixando os nomes de
  classe antigos), `node --check` em `render.js`/`app.js`, contagem de
  chaves `{`/`}` balanceada nos dois CSS tocados, e verificacao visual
  real em Chrome headless (1440px desktop + 390px mobile) nos 6 pontos
  afetados: CTA da apresentacao, modal de senha demo (botao fechar),
  botao de importar no formulario, e os grupos de alternar
  carrossel/lista + navegar do cardapio e da galeria (markup identico ao
  que `render.js` gera de verdade, injetado na pagina real pra testar
  contra o CSS real). Zero erro de console, nenhuma regressao visual.

### Auditoria de seguranca (prompt padrao do usuario) e correcoes, ponto a ponto (2026-08-17)

Usuario enviou um prompt-template proprio, reutilizavel entre projetos,
de "Auditoria de Seguranca de Aplicacao Web" (contexto preenchido:
Node/Express + Supabase + Gemini, hospedado na Vercel, com autenticacao
real). Apos confirmacao do contexto, a auditoria cobriu autenticacao/
sessao, controle de acesso (RLS), validacao de entrada, dependencias
(`npm audit` — limpo), cabecalhos HTTP/CSP, upload de arquivos e
integridade de recursos externos. Achados organizados por risco; usuario
pediu correcao "ponto por ponto", na ordem abaixo.

**Confirmado como correto, sem acao** (defesa ja existente, verificada
contra o codigo real): RLS por dono (`auth.uid() = user_id`) em todas as
tabelas de personalizacao, sempre via client escopado por token do
usuario (nunca `service_role`) — o mesmo padrao usado desde o Plano 14 e
ja reconferido nas duas rodadas de `/code-review` anteriores; chave de IA
do usuario cifrada em repouso (AES-256-GCM, IV aleatorio + tag verificada
por operacao, `src/utils/crypto-chave-ia.js`).

1. **Duas rotas sem nenhum rate limiter** — `/api/referencias-receitas` e
   `/api/imagens-evento` (`server.js`) dependiam so da senha demo
   compartilhada e de um contador diario *global* (Openverse/Spoonacular),
   sem nenhum limite por IP — diferente de todas as outras rotas
   sensiveis do app, que ja tem algum limitador. Corrigido aplicando
   `limitadorPersonalizacao` (30 req/min/IP, o mesmo ja usado em
   fornecedores/fotos/precos) nas duas.
2. **Tipo de imagem validado so pelo `Content-Type` declarado pelo
   cliente** — `fotos.service.js` confiava no campo `tipo` do corpo da
   requisicao sem checar o conteudo real do arquivo; um usuario podia
   mandar `image/png` com qualquer outro conteudo dentro do base64.
   Corrigido com `assinaturaBate()`: confere os magic bytes reais (PNG
   `89 50 4E 47 0D 0A 1A 0A`, JPEG `FF D8 FF`, WEBP `RIFF....WEBP`) logo
   apos o limite de tamanho, antes de aceitar o upload. 2 testes novos
   (`test/integrations.test.js`): rejeita conteudo que nao bate com o
   tipo declarado, aceita os 3 formatos reais.
3. **Scripts de CDN sem Subresource Integrity (SRI)** — `jspdf` e
   `supabase-js` (`public/index.html`) eram carregados de CDN externo sem
   `integrity`/`crossorigin`; se o CDN fosse comprometido ou servisse
   outro arquivo, o navegador executaria o script trocado sem aviso. Alem
   disso, `supabase-js@2` usava uma faixa de versao flutuante,
   incompativel com SRI (o hash quebraria a cada build novo servido sob a
   mesma URL). Corrigido: versao fixada no exato build hoje resolvido
   (`@2.112.3`, consultado via API de resolucao do jsdelivr) + hash
   SHA-384 calculado sobre o arquivo real de cada CDN, com
   `crossorigin="anonymous"` nos dois `<script>`. Verificado ao vivo
   (Chrome headless via CDP): ambos os scripts carregam e executam sem
   erro de integridade (`window.jspdf`/`window.supabase` presentes, sem
   mensagem de "Failed to find a valid digest" no console).
4. **CSP com `'unsafe-inline'` em `scriptSrc`/`scriptSrcAttr`** — reduz o
   valor do CSP como mitigacao de XSS (um script injetado inline ainda
   executaria). Escopo real mapeado antes de perguntar ao usuario: ~26
   atributos `onclick`/`onchange` inline em 3 arquivos (14 em
   `render.js`, 6 em `index.html`, 5 em `app.js`), a maioria dentro de
   template strings que geram cards dinamicamente — exigiria delegacao de
   evento, nao so trocar 1 por 1 por `addEventListener`. **Usuario optou
   por documentar e adiar** (nao e uma vulnerabilidade ativa exploravel
   hoje, e um refactor real). Fica registrado como debito tecnico em
   "Proxima acao curta" abaixo, com o escopo ja mapeado para quando for
   priorizado.
5. **Allowlist de redirect URL do OAuth do Google** — nao e algo
   corrigivel por codigo; exige checagem manual no painel do Supabase
   (Authentication → URL Configuration → Redirect URLs) para confirmar
   que nao ha wildcard aberto alem do `http://localhost:3000/**` ja
   registrado (ver secao "Login social com Google" acima). **Acao
   pendente do usuario**, nao verificavel por mim.

Suite completa revalidada apos os pontos 1-3: 189/189 (2 testes novos).
Pontos 4 e 5 nao alteram esse numero (adiado / acao manual).

## Skills locais disponiveis (adicionadas pelo usuario, fora do repo)

Usuario baixou 8 zips de skills de terceiros em 2026-08-10, extraidos numa
pasta local (`skills anttropic/`, na raiz do projeto, **fora do controle de
versao** — ja adicionada ao `.gitignore`; sao so instrucoes de referencia
pra mim seguir em cenarios especificos, nao fazem parte do app). Catalogo
do que cada uma cobre e quando usar, priorizado pelo que realmente se
aplica a esse projeto (Node/Express + JS/CSS puro sem framework, deploy na
Vercel, sem React/Next.js):

**Diretamente uteis para este projeto:**
- `theme-factory` (Anthropic) — toolkit pra estilizar com temas prontos ou
  gerar um novo; relevante agora, na reforma de identidade visual
  "Karamu Editorial" (Fases 2-5 do plano de identidade).
- `frontend-design` (Anthropic) — construir interfaces com qualidade
  visual alta, evitando "cara de IA generica"; mesmo uso.
- `web-design-guidelines` (Vercel) — revisao de UI contra guidelines de
  interface web; bom pra usar como checklist ao final de cada fase da
  reforma visual.
- `webapp-testing` (Anthropic) — toolkit de teste de app web local via
  Playwright (screenshot, log do navegador, verificacao de UI). **Nota
  importante**: esse projeto ja tem um jeito equivalente, so que feito na
  mao com Chrome headless + CDP direto (usado a sessao inteira pra
  verificar as mudancas visuais) — vale considerar trocar pelo Playwright
  formal dessa skill num momento de folga, reduziria os scripts
  descartaveis que hoje sao escritos do zero a cada verificacao.
- `deploy-to-vercel` / `vercel-cli-with-tokens` (Vercel) — o app ja e
  hospedado na Vercel; uteis quando chegar a hora de publicar de verdade
  (ainda nao formalizado nesta sessao).
- `accesslint` / skill `audit` (AccessLint) — auditoria e correcao de
  acessibilidade (WCAG 2.2); esse codebase ja se preocupa com
  aria-label/foco visivel em varios lugares, boa skill pra rodar antes de
  um lancamento real.
- `design-audit`, `typography` (`ui-typography`), `bencium-controlled-ux-designer`
  (bencium) — auditoria de UI existente e regras tipograficas; podem
  complementar a reforma visual em andamento, mas se sobrepõem parcialmente
  com `frontend-design`/`web-design-guidelines` acima — nao rodar todas ao
  mesmo tempo, escolher uma por etapa pra nao duplicar esforco.
- `ui-ux-pro-max-skill` (terceiro, nao-Anthropic/Vercel) — ferramenta a
  parte (CLI + banco de 67 estilos de UI, 161 paletas, 57 pares de fonte,
  99 diretrizes de UX). Pode ajudar a validar as decisoes de paleta/
  tipografia da identidade visual, mas parece exigir instalacao propria
  (CLI via npm, `uipro-cli`) — **nao instalar sem perguntar antes**,
  conforme combinado.

**Disponiveis mas nao se aplicam a este projeto agora** (stack
React/Next.js/React Native — Karamu e JS puro sem framework):
`composition-patterns`, `react-best-practices`, `react-native-skills`,
`react-view-transitions`, `vercel-optimize`.

**Genericas do Anthropic, fora do escopo deste projeto** (utilitarios de
documento/produtividade, nao logica de app):
`docx`, `pdf`, `pptx`, `xlsx`, `slack-gif-creator`, `internal-comms`,
`doc-coauthoring`, `mcp-builder`, `claude-api`, `skill-creator`,
`algorithmic-art`, `canvas-design`, `web-artifacts-builder`,
`brand-guidelines` (aplica a marca do Anthropic especificamente, nao a do
Karamu).

**Bencium (marketplace de um autor terceiro), avaliar com cautela**:
varias skills desse pacote sao filosofia/metodologia de design ou
variantes de outras ja listadas acima (`bencium-impact-designer`/
`bencium-innovative-ux-designer` sao baseadas na `frontend-design` do
Anthropic; `human-architect-mindset`, `negentropy-lens`,
`renaissance-architecture`, `vanity-engineering-review`, `relationship-design`,
`adaptive-communication` sao lentes de raciocinio/revisao, nao ferramentas
de execucao — podem ser uteis pontualmente mas nao sao prioridade agora).
`bencium-code-conventions` e explicitamente pessoal do autor original
("quando escrever codigo... para o Bence") — **nao aplicavel a este
projeto**, ignorar. `bencium-aeo`/`organic-first-campaign` sao
marketing/SEO, fora de escopo enquanto o app nao tem usuarios reais.

**Duplicatas encontradas**: 4 dos 8 zips (`agent-skills-main.zip`,
`Vercel Composition Patterns-agent-skills-main.zip`,
`vercel-labs-agent-skills-agent-skills-main (1).zip`,
`Vercel-React-Best_Practicesagent-skills-main.zip`) sao o mesmo repositorio
da Vercel Labs baixado 4 vezes; o `(1)` tem uma skill a mais
(`vercel-optimize`) que os outros nao tem — se for limpar a pasta local,
esse e o unico dos 4 que vale manter.

## Proxima acao curta

1. antes de lancar para usuarios reais: publicar o app do Google em modo
   "Producao" (hoje esta em "Teste", so e-mails cadastrados como testadores
   conseguem logar com Google) — protecao de senha vazada e
   `rls_auto_enable()` ja resolvidos/registrados, ver secoes acima;
2. antes de registrar a marca/comprar dominio de verdade: fazer a busca
   formal do INPI por classe para "Karamu" (so foram feitas buscas pontuais
   ate agora);
3. limpeza tecnica de baixa prioridade, sem pressa: consolidar as ~12 copias
   pre-existentes de `normalizarTexto` (remover acento/normalizar caixa)
   espalhadas em `src/` (`validate-plan.js`, `motor.service.js`,
   `event-coherence.service.js`, `culinary-variety.service.js`,
   `culinary-matrix.service.js`, `event-quality.service.js`,
   `food-yield.service.js`, `beverage-variety.service.js`,
   `image-selection.service.js`, `image-catalog.service.js`, entre outras)
   para importar de `src/utils/text-normalize.js` (criado em 2026-08-06,
   ver secao acima) — nenhuma delas foi tocada ainda, e sao pre-existentes
   ao trabalho desta sessao, entao nao entraram no fix pontual;
4. baixa prioridade: mostrar na UI quando `meta.catalogo_usuario_truncado`
   vier `true` (hoje so fica no `meta`, sem aviso visual pro usuario com
   mais de 60 precos cadastrados);
5. **acao manual pendente do usuario** (auditoria de seguranca,
   2026-08-17, ponto 5): conferir no painel do Supabase (Authentication →
   URL Configuration → Redirect URLs) que nao ha wildcard aberto alem do
   `http://localhost:3000/**` ja registrado — nao verificavel por codigo;
6. **debito tecnico documentado, sem data** (auditoria de seguranca,
   2026-08-17, ponto 4): remover `'unsafe-inline'` de `scriptSrc`/
   `scriptSrcAttr` no CSP (`server.js`) exige antes converter ~26
   atributos `onclick`/`onchange` inline para `addEventListener` (14 em
   `render.js`, 6 em `index.html`, 5 em `app.js`; a maioria em
   `render.js` esta dentro de template strings de cards gerados
   dinamicamente, entao precisa de delegacao de evento, nao troca 1 por
   1). Usuario optou explicitamente por adiar (nao e vulnerabilidade
   ativa hoje) — retomar quando houver folga para o refactor;
7. commit pendente: interface de perfil, integracao catalogo/custo,
   reestruturacao de navegacao e rename Karamu **ja foram commitados**
   (`f32a5fb`, 2026-08-09). O que resta pendente agora (19 itens no
   `git status`: 14 modificados + 5 novos) e so o trabalho depois desse
   commit — identidade visual "Karamu Editorial" Fase 1 (tokens,
   wordmark, favicon: `base.css`, `layout.css`, `pitch.css`, `index.html`,
   os 4 arquivos de favicon novos) e Fase 2 (botoes: `form.css`,
   `result.css`, `render.js`, `app.js`, mais os mesmos `index.html`/
   `layout.css`/`pitch.css` da Fase 1), e as 3 correcoes da auditoria de
   seguranca de 2026-08-17 (`server.js`, `fotos.service.js`,
   `test/integrations.test.js`, `.gitignore`, e estes dois documentos) —
   ainda nao commitado nem enviado, aguardando confirmacao do usuario.
   Ha tambem uma pasta `.vscode/` nao rastreada, de origem nao confirmada
   (configuracao de editor) — conferir o conteudo antes de incluir num
   commit;
8. manter o estado somente neste handoff e no roadmap.
