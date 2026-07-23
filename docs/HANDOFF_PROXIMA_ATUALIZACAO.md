# Handoff - Chef IA Studio

Atualizado em 2026-07-23.

## Estado em uma frase

O Chef IA Studio e um MVP local funcional; os Planos 1 a 11 estao concluidos e
o Plano 12 recebeu uma correcao de correspondencia apos reprovar na avaliacao
visual do usuario e aguarda um novo teste no evento real.

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

1. O lote local inicial possui dez ilustracoes e ainda nao cobre todo o repertorio.
2. Algumas receitas podem se repetir em contextos equivalentes.
3. O Gemini pode exigir recuperacao automatica de receitas ou compras.
4. Nao existe catalogo regional real de precos.
5. Historico permanece restrito ao navegador atual.
6. DEMO_ACCESS_KEY nao substitui autenticacao de producao.
7. Alergenicos e contaminacao cruzada exigem confirmacao profissional.
8. Operacao deve ser conferida contra o espaco e os equipamentos reais.
9. O trabalho do Plano 11 (biblioteca visual) e do Plano 12 (correcao de
   correspondencia) descrito neste handoff ainda nao foi commitado; o HEAD do
   git esta em 3664ddb e nao inclui nenhuma dessas mudancas. Commitar antes de
   qualquer nova migracao ou backup baseado em git.

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

## Proxima acao curta

1. usuario gerar novamente o evento real e conferir os selos visuais;
2. classificar as imagens como adequada, generica ou inadequada;
3. confirmar se as quatro lacunas controladas coincidem com a percepcao real;
4. depois decidir se o Plano 13 amplia a biblioteca;
5. manter o estado somente neste handoff e no roadmap.
