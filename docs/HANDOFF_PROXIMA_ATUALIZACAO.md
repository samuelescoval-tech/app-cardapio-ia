# Handoff - Chef IA Studio

Atualizado em 2026-07-23.

## Estado em uma frase

O Chef IA Studio e um MVP local funcional; os Planos 1 a 13 estao concluidos.
O Plano 14 comecou: contas de usuario, banco de dados, personalizacao
(fornecedores e fotos proprias) e deploy, usando Supabase (banco, auth e
storage) e Vercel (hospedagem), ambos no plano gratuito. Bloqueado ate o
usuario criar as duas contas gratuitas.

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
6. DEMO_ACCESS_KEY nao substitui autenticacao de producao.
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
- testes consolidados em seis suites, com 139 verificacoes declaradas (144
  execucoes ao rodar npm test, incluindo subtestes de um loop de cenarios);
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

Ainda nao feito: fases 3 e 4 do Plano 14 (fornecedores e fotos proprias por
usuario).

## Proxima acao curta

1. fase 3 do Plano 14: criar tabela de fornecedores no Supabase (com RLS por
   usuario) e endpoints CRUD;
2. fase 4: tabela + Storage para fotos proprias de prato/receita;
3. manter o estado somente neste handoff e no roadmap.
