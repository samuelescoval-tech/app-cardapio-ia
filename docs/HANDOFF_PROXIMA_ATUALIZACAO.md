# Handoff - Proxima Atualizacao do Chef IA Studio

<!-- CODEX:LER_SEMPRE
Ler somente Estado atual em uma frase, ultimo registro relevante e Proxima atualizacao curta.
Consultar docs/README.md apenas se houver duvida sobre onde encontrar informacao especializada.
-->

<!-- CODEX:MANTER_EM_LINHA
Atualizar este handoff quando estado, decisao, teste relevante ou proximo passo mudar.
Atualizar roadmap apenas se a prioridade mudar; outros documentos apenas se o contrato especifico deles mudar.
-->

<!-- CODEX:FAZER
Planos 1 a 10 concluidos e validados em 2026-07-13. Nao iniciar nova frente automaticamente; apresentar ao usuario as opcoes de teste controlado, correcao por feedback, expansao de repertorio ou decisao separada de produto.
-->

Este documento resume o estado real do projeto para continuar a proxima rodada sem perder contexto.

## Estado atual em uma frase

Os Planos 1 a 10, cinco baselines tecnicos e o primeiro teste acompanhado foram concluidos; ocasioes e pedidos culinarios explicitos agora possuem contrato geral, e a proxima porta e o usuario 2 sem push automatico.

## O que foi modificado

- Conexao com Gemini estabilizada no backend usando `GEMINI_API_KEY` ou `GOOGLE_API_KEY`.
- Modelo configuravel por `.env` com `GEMINI_MODEL`.
- `server.js` aceita somente dados estruturados do evento em `/gerar-cardapio`; prompt arbitrario enviado pelo cliente e rejeitado.
- Prompt saiu do frontend e foi para `src/prompts/event.prompt.js`.
- `src/prompts/event.prompt.js` foi simplificado para Papel, Objetivo, Fontes Confiaveis, Dados, Restricoes, Contrato e Criterios de Conclusao; a metodologia permanece como referencia interna, sem pesar no runtime.
- O Gemini nao devolve mais `motor_logistica`; `aplicarMotorAoPlano()` injeta sempre a versao oficial calculada no backend.
- `src/utils/validate-event.js` valida tipo, pessoas, duracao e limites de texto antes do motor e da IA.
- Criado motor local em `src/services/planning/motor.service.js` para calcular alimentos, bebidas, equipe, espaco, utensilios e operacao.
- `src/services/planning/operational-planning.service.js` calcula complexidade, equipe por formato, fluxo de producao, equipamentos por estacao e cronograma operacional sem depender da IA.
- Resultado da IA recebe reforco do motor local antes de ir para o frontend.
- `src/utils/validate-plan.js` exige campos essenciais, normaliza a resposta e descarta campos fora do contrato antes da renderizacao.
- Testes automatizados em `test/` cobrem prompt, entrada, plano e rejeicao de prompt arbitrario.
- `public/js/app.js` ficou focado em formulario, navegacao e chamada ao backend.
- `public/js/render.js` ficou responsavel pela montagem visual do planejamento.
- `public/js/render.js` tambem gera PDF textual inicial com `jsPDF`, usando o ultimo plano renderizado.
- `public/js/utils.js` ficou com helpers, normalizadores e calculos fallback.
- `public/js/storage.service.js` cuida do historico local com `localStorage`.
- `public/js/prompt.js` foi removido porque nao e mais necessario.
- `public/css/style.css` virou entrypoint de modulos CSS.
- CSS foi separado em `public/css/modules/`.
- Documentos de plano e historico foram movidos para `docs/`.
- Arquivos duplicados/temporarios removidos: `server.log` e `package.json/package-lock.json` do snapshot legado.
- `src/services/ai/gemini.service.js` registra `meta.tempo_ms` como duracao real da chamada, nao como timestamp.

## Arquitetura atual

Fluxo principal:

1. Usuario preenche o formulario em `public/index.html`.
2. `public/js/app.js` monta o objeto `evento`.
3. O frontend envia `POST /gerar-cardapio`.
4. `src/utils/validate-event.js` valida e normaliza o evento.
5. `server.js` seleciona a diretriz culinaria e calcula o motor local com a operacao deterministica ligada aos momentos do evento.
6. `src/prompts/event.prompt.js` monta o prompt operacional para Gemini usando esses dados oficiais.
7. `src/services/ai/gemini.service.js` chama o modelo.
8. `src/utils/extract-json.js` e `src/utils/validate-plan.js` extraem, restringem, normalizam e validam o JSON.
9. `aplicarMotorAoPlano()` injeta os dados oficiais calculados no plano.
10. `public/js/render.js` exibe o planejamento completo.
11. `public/js/storage.service.js` salva e carrega o historico local.

## Arquivos principais

- `server.js`: rotas Express, status da API e endpoint de geracao.
- `src/services/ai/gemini.service.js`: integracao com Gemini.
- `src/services/planning/motor.service.js`: calculos locais do evento.
- `src/services/planning/operational-planning.service.js`: complexidade, equipe, producao, estacoes e cronograma deterministico.
- `src/prompts/event.prompt.js`: prompt de planejamento.
- `src/utils/extract-json.js`: extracao robusta de JSON da resposta da IA.
- `src/utils/validate-event.js`: validacao e normalizacao dos dados recebidos do frontend.
- `src/utils/validate-plan.js`: validacao/normalizacao do plano.
- `test/`: testes automatizados do contrato, entrada e rota.
- `public/index.html`: formulario, pitch e estrutura visual da pagina.
- `public/js/app.js`: bootstrap, formulario, navegacao e fetch.
- `public/js/render.js`: renderizacao do resultado.
- `public/js/storage.service.js`: historico local.
- `public/js/utils.js`: helpers compartilhados do frontend.
- `public/css/style.css`: imports dos modulos CSS.
- `public/css/modules/`: estilos separados por responsabilidade.
- `docs/FLUXOS_DE_PROCESSO.md`: fluxos dedicados do macroprocesso, geracao, acesso demo, PDF e atualizacao documental.
- `docs/MATERIAL_APOIO_PROCESSOS_E_REQUISITOS.md`: material vivo de apoio com BPMN simplificado, processos, requisitos, stakeholders, gargalos e resumo atualizavel.
- `docs/ANALISE_REQUISITOS_ATORES_CASOS_USO.md`: atores, casos de uso, fluxo de uso, dados gerais e validacoes do comportamento do produto.
- `docs/DIAGRAMAS_COMPLEMENTARES_ANALISE_TECNICA.md`: diagramas SGPD/LGPD, viabilidade, sequencia, atividade, mapeamento, fluxo logico e complementaridade tecnica.
- `docs/PADROES_QUALIDADE_PRIORIZACAO.md`: convencoes, normas internas, interface, coerencia, pontos fortes, oportunidades, ajustes iterativos e priorizacao.
- `docs/ROADMAP_ATUAL.md`: estado real do plano depois da limpeza.
- `CLEANUP_AUDIT.md`: auditoria de arquivos removidos, quebrados e mantidos.

## Registro de testes e validacoes

Regra anti-repeticao: antes de rodar `node --check`, `GET /api/status`, `POST /gerar-cardapio`, Chrome headless, validacao visual ou PDF, consultar este registro. Repetir teste somente se o codigo relacionado mudou, o ambiente mudou, o resultado registrado estiver desatualizado, ou o usuario pedir explicitamente.

Formato esperado para novos registros: data, escopo, comando ou forma de teste, resultado observado e decisao de repeticao.

- Checagem de sintaxe em arquivos JS principais com `node --check`.
- Teste local do motor de planejamento para evento premium com 80 pessoas.
- Teste real anterior confirmou resposta do Gemini com `gemini-flash-lite-latest`.
- Em 2026-07-02, `GET /api/status` respondeu `ok: true`.
- Em 2026-07-02, `POST /gerar-cardapio` respondeu `ok: true` com plano validado, `schema_ok: true` e motor local aplicado.
- Em 2026-07-02, `meta.tempo_ms` foi corrigido e validado como duracao real da chamada.
- Em 2026-07-02, a exportacao PDF inicial foi validada por simulacao local com `jsPDF` mockado.
- Em 2026-07-02, o fluxo completo foi validado em Chrome headless: formulario carregou, planejamento foi gerado, historico salvou 1 item e o botao `Baixar PDF` chamou `jsPDF`.
- Em 2026-07-02, download real de PDF foi confirmado em `/tmp/chef-ia-downloads/chef-ia-download-teste.pdf`.
- Em 2026-07-02, o PDF foi refinado e pré-visualizado com cabecalho escuro, faixa dourada, cards de resumo, secoes destacadas e rodape.
- Em 2026-07-02, o PDF foi expandido para refletir melhor o evento e uma amostra rica gerou 4 paginas com dados do evento, cardapio, receitas, compras, servico de mesa, utensilios, local, layout, decoracao, cronograma, equipe, entretenimento, lembrancinhas, checklist e orcamento.
- Em 2026-07-02, o PDF passou a manter todas as secoes principais mesmo quando algum bloco vier vazio, exibindo "Nao informado" em vez de esconder a secao.
- Em 2026-07-02, foi adicionada protecao temporaria com `DEMO_ACCESS_KEY`: o frontend pede senha de teste e o backend exige o header `x-demo-access-key` em `/gerar-cardapio`.
- Em 2026-07-08, o prompt backend foi reformado de forma proporcional pela Arquitetura Residencial de Prompts e a validacao do plano passou a normalizar melhor campos usados pela tela e pelo PDF.
- Em 2026-07-08, `node --check` passou para prompt, validacao, servidor, Gemini e motor; o teste local confirmou prompt com camadas internas e normalizacao de plano; `GET /api/status` respondeu `ok: true`.
- Em 2026-07-08, chamada real ao Gemini com motor local + prompt backend atual respondeu `ok: true`, `schema_ok: true`, 9 itens de cardapio, 12 compras, 4 locais e 6 momentos no cronograma.
- Em 2026-07-08, o acesso demo foi trocado de `prompt()` nativo para modal/tela no frontend; `node --check public/js/app.js` passou, `GET /api/status` confirmou `demo_access.required: true`, requisicao sem senha retornou 401, senha incorreta retornou 401 e Chrome headless carregou a pagina com o markup do modal.
- Em 2026-07-08, `POST /gerar-cardapio` com `DEMO_ACCESS_KEY` correta passou pela rota Express e respondeu status 200, `ok: true`, `schema_ok: true`, `motor_local: true`, `prompt_backend: true`, 8 itens de cardapio, 12 compras e 6 momentos no cronograma.
- Em 2026-07-09, `node --check` passou novamente para `server.js`, `public/js/app.js`, `public/js/render.js`, `src/prompts/event.prompt.js` e `src/utils/validate-plan.js`. Nao repetir sem mudanca nesses arquivos.
- Em 2026-07-09, `npm start` dentro do sandbox subiu o processo, mas a porta nao ficou acessivel para outros comandos por isolamento de rede. Nao contar como validacao real de localhost.
- Em 2026-07-09, `npm start` fora do sandbox subiu `http://localhost:3000`; `curl /api/status` fora do sandbox retornou HTTP 200, `ok: true`, Gemini configurado, `demo_access.required: true`, `motor_local: true` e `prompt_backend: true`.
- Em 2026-07-09, Chrome headless carregou `http://localhost:3000` e confirmou markup principal da pagina e do modal `demoAccessModal`. Nao foi feita nova geracao Gemini nem novo PDF nesta rodada porque o usuario informou que estes testes ja haviam sido feitos e pediu registro para evitar repeticao.
- Em 2026-07-10, `npm test` passou com 4 arquivos de teste cobrindo prompt operacional, validacao do evento, restricao do plano e rejeicao de prompt arbitrario; `node --check` passou para `server.js`, `public/js/app.js`, `validate-event.js` e `validate-plan.js`.
- Em 2026-07-10, o teste local do prompt confirmou ausencia de `motor_logistica` no contrato da IA, ausencia das etiquetas metaforicas no runtime e presenca das secoes operacionais.
- Em 2026-07-10, a geracao real do novo contrato respondeu HTTP 200, `schema_ok: true`, motor local aplicado, 7 itens de cardapio, 12 compras, 4 locais e 5 momentos no cronograma. A variacao de cronograma foi classificada como qualidade editorial nao bloqueante; `schema_ok` permanece ligado a estrutura e tipos.
- Em 2026-07-10, a responsividade do resultado foi ajustada em `result.css` e `render.js`: cabecalho, grids, textos longos, servico, orcamento e tabela de utensilios passaram a adaptar o conteudo no mobile. Capturas locais e auditoria DOM em 390x844 e 1440x1000 confirmaram zero elementos fora do viewport e zero overflow horizontal.
- Em 2026-07-10, o usuario confirmou que enviou a demo controlada para outra pessoa, o app funcionou corretamente e a pessoa avaliou a experiencia de forma positiva. Nenhuma falha foi relatada; nao repetir essa passagem sem mudanca relacionada ou novo feedback.
- Em 2026-07-10, o formulario ganhou `criancas` opcional mantendo `pessoas` como total. O backend deriva adultos, aplica fator infantil de 60% ao consumo, restringe alcool aos adultos e mantem equipe, espaco e servico de mesa pelo total. `npm test` passou com 5 arquivos, incluindo regressao de evento antigo e evento misto.
- Em 2026-07-10, pais, estado, cidade e data do evento entraram no contrato. Custos fixos sem referencia foram removidos do motor e do prompt; o backend descarta orcamento da IA e a tela/PDF mostram `A cotar` sem fonte e data-base. Uma captura dirigida confirmou que historicos antigos tambem nao reapresentam totais sem rastreabilidade.
- Em 2026-07-10, foi criado o contrato JSON do catalogo regional e um exemplo piloto para Sao Paulo/SP com cinco itens, unidades normalizadas, regra de tres fontes por item, validade de 30 dias e trava de aprovacao. O exemplo permanece em `draft`, com zero fontes e zero precos publicaveis.
- Em 2026-07-10, as fontes de precificacao foram classificadas por finalidade: CEAGESP pode sustentar referencia atacadista regional quando produto/unidade/data forem compativeis; Conab sustenta tendencia nacional; Noticias Agricolas serve como confirmacao privada; IndexMundi oferece apenas contexto internacional. Indicadores de tendencia nao podem alimentar diretamente o preco local.
- Em 2026-07-10, a hierarquia foi ampliada com Procon-SP para comparacao varejista local, DIEESE/Conab para media mensal por cidade, IBGE para inflacao e CEPEA para tendencia na origem. O relatorio Procon-SP encontrado tem metodologia forte, mas coleta de dezembro de 2025 e nao pode alimentar o catalogo atual de 30 dias.
- Em 2026-07-10, a tabela oficial CEAGESP de 08/07/2026 registrou duas fontes em revisao: Tomate Pizzadoro 2A com valor comum de R$ 3,19/kg e Batata Lavada Especial com valor comum de R$ 4,42/kg. Cada item possui apenas uma fonte e continua sem resumo, faixas ou aprovacao.
- Em 2026-07-10, por decisao do usuario, o catalogo foi reduzido ao minimo confiavel: uma referencia real por item, valor central, faixa, fonte, data e validade de 30 dias. A aplicacao nao devera pesquisar varias fontes nem gastar tokens a cada evento; atualizacoes consultam diretamente CEAGESP, DIEESE/Conab, Procon-SP ou IBGE conforme a categoria. Se nao houver referencia valida, permanece `A cotar`.
- Em 2026-07-10, o usuario identificou uma falha critica de conteudo: o cardapio esta excessivamente limitado, diferencia pouco os tipos e temas de evento e a lista de compras traz poucos itens ou omite necessidades. A correcao foi registrada como proxima prioridade; nao foi implementada nesta rodada.
- A revisao tecnica confirmou quatro causas: o prompt usa apenas boas praticas genericas sem fontes culinarias ou base por evento/tema; limita o cardapio a 7-9 itens e pede apenas um minimo generico de 12 compras; nao exige ligacao verificavel entre prato, receita, ingredientes e compra; e o validador confirma estrutura, mas nao cobertura ou coerencia. O motor local tambem possui poucos perfis genericos de evento.
- Em 2026-07-11, foi criada `data/culinary/matrix.json` com perfis de casamento, corporativo/coffee break, churrasco, infantil, aniversario e evento geral, alem de orientacoes por tema e fontes editoriais do Senac e Ministerio da Saude.
- Em 2026-07-11, o contrato passou a exigir ids de pratos, ingredientes atomicos com quantidade/unidade, compras consolidadas com natureza e origens, e receitas ligadas por `cardapio_id` quando houver preparo.
- Em 2026-07-11, `validate-plan.js` passou a rejeitar ids duplicados, ingredientes ou compras incompletos, quantidades vagas, compras duplicadas, origens invalidas, ingredientes descobertos e composicao abaixo do perfil selecionado.
- Em 2026-07-11, a primeira geracao real revelou apenas 5 itens; a composicao minima foi entao transformada em porta verificavel. Depois do ajuste de itens prontos sem receita, uma nova geracao corporativa tropical para 30 pessoas respondeu `ok: true`, `schema_ok: true`, `qualidade_culinaria: true`, 13 itens de cardapio, 2 receitas e 32 compras.
- Em 2026-07-11, `npm test` passou com 6 arquivos de teste, incluindo matriz, cobertura prato-compra, composicao por categoria e rejeicao de quantidade vaga. Checagens de sintaxe passaram nos arquivos backend e frontend alterados.
- Em 2026-07-11, um casamento real falhou na validacao porque nomes/origens da lista de compras nao cobriram exatamente os ingredientes. O backend gerou fallback vazio e o frontend antigo o exibiu e salvou, explicando os contadores `-`, o desaparecimento das receitas e projetos recentes incompletos.
- Em 2026-07-11, o Plano 1 corrigiu o fluxo: `resposta.ok === false` nao e renderizada nem salva, o ultimo plano valido permanece na tela, falhas de armazenamento ficam visiveis e fallbacks antigos aparecem apenas como registros incompletos para diagnostico.
- Em 2026-07-11, o historico passou a normalizar em memoria os formatos `plano`, `planejamento` e `resultado`, tolerar campos ausentes sem apagar dados e carregar formularios sem depender da existencia de todos os campos atuais.
- Em 2026-07-11, o resumo do historico passou a usar `resumo_chef`, `cardapio` e `lista_compras`; o rodape da interface foi corrigido de 2024 para 2026.
- Em 2026-07-11, `npm test` passou com 7 arquivos, incluindo regressao do storage; `node --check`, `git diff --check` e Chrome headless passaram. O Chrome confirmou `© 2026` e a area de projetos recentes carregada.
- Em 2026-07-11, o Plano 2 separou falhas culinarias fatais de ajustes recuperaveis e avisos. Compras duplicadas sao consolidadas, plural/singular e normalizado, origens ausentes sao completadas e ingredientes sem compra geram uma compra derivada em vez de fallback.
- Em 2026-07-11, o plano passou a carregar `qualidade_culinaria` com status, ajustes, avisos e cobertura; a resposta inclui contadores em `meta` e a tela exibe um painel quando houver ajuste ou revisao.
- Em 2026-07-11, `npm test` passou com 7 arquivos apos a mudanca, incluindo derivacao de compra, recuperacao de origem, quantidade vaga, singular/plural e composicao abaixo da matriz sem descarte.
- Em 2026-07-11, o casamento real de 100 pessoas que antes virava fallback respondeu `ok: true`, `schema_ok: true`, 14 itens de cardapio, 3 receitas, 29 compras e cobertura de 28/28 ingredientes. O aviso `Boas-vindas 0/2` ficou visivel como revisao editorial sem apagar o evento.
- Em 2026-07-11, o Plano 3 usou o PDF antigo de atendimento domiciliar como baseline. O contrato passou a distinguir `preparo`, `montagem` e `pronto`; receitas agora possuem ingredientes, 3 a 6 passos, tempo, rendimento e quantidade total.
- Em 2026-07-11, a validacao passou a medir pratos com preparo, receitas cobertas e receitas completas; ingredientes e quantidade total podem ser recuperados do prato sem inventar modo de preparo.
- Em 2026-07-11, tela e PDF passaram a detalhar ingredientes e passos das receitas. Secoes editoriais nao somem quando vazias: local, layout, decoracao, cronograma, equipe, receitas, utensilios, entretenimento, lembrancinhas e checklist exibem estado nao informado.
- Em 2026-07-11, o primeiro teste domiciliar gerou 13 itens e 6 receitas, expondo 5 montagens sem ficha. O prompt foi reforcado com contagem de receitas e os minimos editoriais do PDF antigo.
- Em 2026-07-11, o teste final de atendimento domiciliar respondeu `ok: true`, `schema_ok: true`, `qualidade_culinaria_status: aprovado`, 13 itens, 10/10 preparacoes com receitas completas, 32 compras, 4 locais, 2 layouts, 6 momentos, 3 orientacoes de equipe, 3 entretenimentos, 3 lembrancinhas, decoracao 2/4 e checklist 4/3/3, sem avisos.
- Em 2026-07-11, `npm test` permaneceu aprovado com 7 arquivos; checagens de sintaxe e `git diff --check` passaram. A porta local foi reiniciada com o Plano 3.
- Em 2026-07-11, o usuario observou que a variedade esta boa, mas algumas receitas se repetem entre geracoes. Por decisao do usuario, a correcao fica futura e devera comecar por uma taxonomia mais detalhada do que cada tipo de evento, tema, horario e servico precisa; nao resolver apenas sorteando pratos.
- O Plano 4 criou `data/culinary/source-catalog.json`, agora com 10 fontes classificadas como oficiais, educacionais, pesquisa, academica, editoriais ou API externa, cada uma com papel, evidencia, uso e limitacao; 8 podem orientar o runtime e 2 ficam restritas a estrutura/descoberta futura.
- Em 2026-07-11, o catalogo passou a usar Senac para tipologia/processo/ficha tecnica; Ministerio da Saude e Anvisa para variedade, restricoes e alergenicos; Embrapa para repertorio regional e sem gluten; Panelinha e Receitas Nestle apenas como referencias editoriais secundarias, sem copia e com vies comercial registrado.
- Em 2026-07-11, a geracao normal continua sem pesquisa web. O prompt recebe somente uma selecao compacta do catalogo, proibe copiar receitas, tornar marcas obrigatorias ou prometer ausencia de contaminacao cruzada.
- Em 2026-07-11, `npm test` passou com 8 arquivos, incluindo rastreabilidade do catalogo, bundles validos, politica sem busca por evento e selecao especializada para restricoes.
- Em 2026-07-11, o primeiro teste real do Plano 4 recebeu 503 temporario por alta demanda do Gemini. A repeticao permitida passou com fonte sem gluten selecionada, `ok: true`, 13 itens, 11 receitas, 31 compras e um aviso recuperavel para mix de castanhas/frutas sem ficha.
- Em 2026-07-11, o usuario forneceu um TCC do Centro Paula Souza sobre busca/publicacao de receitas por ingredientes e utensilios. Ele entrou no catalogo apenas como fonte academica estrutural para modelagem de receita, etapas, utensilios, busca e alerta de duplicidade; `runtime_use` e falso e nenhuma receita, texto, tela ou codigo do projeto alheio pode ser copiado.
- Em 2026-07-12, o usuario sugeriu Spoonacular e forneceu uma chave. A documentacao confirmou busca por ingredientes, equipamentos, dietas, intolerancias e instrucoes, mas os termos exigem atribuicao e proibem armazenar ingredientes, instrucoes, nutricao ou dados derivados; somente id, titulo e URL da imagem podem persistir. Como o Chef IA salva historico e PDF, Spoonacular entrou no catalogo com `runtime_use: false` ate existir fluxo transitorio ou licenca compativel. A chave nao foi gravada nem testada e deve ser rotacionada por ter sido compartilhada no chat.
- Em 2026-07-12, o Plano 4B criou `src/services/recipes/spoonacular.service.js` e `POST /api/referencias-receitas`. A consulta e manual, protegida pela senha demo, limitada a 3 resultados, 1 chamada por segundo e 5 buscas locais/dia por padrao.
- Em 2026-07-12, a resposta Spoonacular e reduzida a id, titulo, imagem HTTPS, fonte/link, tempo e porcoes; ingredientes, instrucoes e nutricao sao descartados. O frontend exibe as referencias em memoria e elas nao entram em `chefIAUltimoPlano`, historico ou PDF.
- Em 2026-07-12, `.env.example` ganhou `SPOONACULAR_API_KEY` e `SPOONACULAR_DAILY_SEARCH_LIMIT`; nenhuma chave real foi gravada. O status local confirmou `configured: false`, `persistence: false`, maximo 3 resultados e 5 buscas restantes.
- Em 2026-07-12, `npm test` passou com 9 arquivos, incluindo sanitizacao de URLs, remocao de conteudo proibido, atribuicao, quota e funcionamento sem chave. Checagens de sintaxe e `git diff --check` passaram.
- Em 2026-07-12, o Plano 5 executou cinco cenarios completos pela interface real: atendimento domiciliar, casamento, churrasco, festa infantil e evento corporativo. Todos renderizaram as 14 secoes esperadas e nao apresentaram overflow horizontal no desktop.
- Em 2026-07-12, o historico acumulou os cinco projetos e recarregou corretamente o atendimento domiciliar; no viewport de 400 px, `scrollWidth` permaneceu em 400 px, sem overflow horizontal.
- Em 2026-07-12, os cinco PDFs foram baixados e inspecionados: todos em A4, com 6 paginas, texto extraivel e tamanhos entre 47.990 e 52.150 bytes. A inspecao visual do churrasco confirmou cabecalho, resumo, cardapio, receitas e compras legiveis, sem corte aparente.
- Em 2026-07-12, um falso aviso para bebida pronta sem ingredientes foi corrigido no validador. A repeticao do casamento terminou com `ok: true`, 14 itens, 13 receitas, 32 compras e cobertura completa, sem avisos.
- O Plano 5 adicionou `scripts/validate-plan5-api.js` e `scripts/validate-plan5-e2e.js` para repetir a verificacao de conteudo e o fluxo completo em Chrome sem imprimir segredos do `.env`.
- Em 2026-07-12, o Plano 6 transformou `data/culinary/matrix.json` em uma taxonomia com 7 perfis, 5 modificadores de refeicao e 8 temas. Cada perfil define identidade, servico, momentos, elementos esperados, repertorio tipico, opcionais e inadequacoes comuns.
- Os cinco eventos prioritarios possuem perfil proprio: atendimento domiciliar, casamento, churrasco, festa infantil e corporativo. Aniversario adulto e evento geral permanecem como coberturas adicionais.
- A selecao passou a usar o tipo do evento para o perfil-base, `refeicao` para o modificador de servico e `tema` para a camada tematica. Observacao livre, tema ou horario nao substituem mais a identidade principal do evento.
- O prompt passou a exigir preservacao dos momentos e elementos esperados, usando comidas tipicas como alternativas orientadoras, sem copiar todas nem transformar tema em substituto do evento.
- A referencia do Senac SP foi reconfirmada em 2026-07-12: tipologia, servico, numero de convidados, duracao, combinacao de pratos e infraestrutura devem orientar a elaboracao do cardapio. O guia do Ministerio da Saude permaneceu no catalogo, mas seu PDF nao respondeu na verificacao automatizada desta rodada.
- `scripts/validate-plan6-api.js` permite repetir todos ou apenas cenarios selecionados e registra perfil, modificadores, avisos e nomes dos pratos em `/tmp`, sem expor segredos.
- Na primeira geracao real do Plano 6, os cinco cenarios responderam `ok: true` e mantiveram 13, 14, 18, 13 e 13 itens. Depois de reforcar ingredientes, locais e cronograma, churrasco passou aprovado e infantil ajustado, ambos com zero avisos.
- A amostra final de churrasco trouxe grelha, opcao vegetal, arroz, farofa, vinagrete, mandioca, saladas e bebidas; a infantil trouxe mini porcoes, vegetais, bolo, doces e bebidas sem alcool. `npm test` passou com 9 arquivos e a taxonomia possui validacao de esquema e ids duplicados.
- Em 2026-07-12, o Plano 7 conectou o historico local a geracao por uma memoria culinaria minima: no maximo 5 projetos e 18 pratos por projeto, somente tipo, refeicao, tema, nome e categoria. Receitas, ingredientes, compras, pessoas, observacoes e referencias externas nao saem do historico para essa finalidade.
- O backend valida e limita a memoria, considera apenas perfil e refeicao equivalentes e nunca usa o historico como instrucao. A comparacao remove acentos e adjetivos superficiais como `gourmet`, `especial` e `da casa`.
- A auditoria semantica reconhece bases semelhantes, como `Pudim de Leite` e `Pudim de Leite Condensado`, mas diferencia tecnicas realmente distintas, como mandioca frita e mandioca cozida.
- Repeticoes estruturais definidas na taxonomia e bebidas basicas de servico sao justificadas; demais repeticoes ficam visiveis para revisao. O relatorio `variedade_culinaria` entra no plano, historico, tela, meta da resposta e PDF.
- `scripts/validate-plan7-variety.js` compara duas geracoes do mesmo cenario. No primeiro teste real, churrasco trouxe 15 novos, 2 essenciais e 1 para revisar; infantil trouxe 12 novos, 1 essencial e zero para revisar em uma das rodadas.
- O teste final em Chrome com historico semeado confirmou memoria enviada 1/1, status `variado`, 12 pratos novos, 1 repeticao essencial, zero a revisar, um painel de variedade, dois projetos no historico, mobile 400/400 sem overflow e PDF A4 de 6 paginas contendo a secao de variedade.
- Durante o teste foi identificado um processo antigo iniciado as 15:44 ocupando a porta 3000. Ele foi encerrado e a versao atual assumiu a porta; `/api/status` agora declara `culinary_variety_history: true`.
- Ao concluir o Plano 7, `npm test` passou com 10 arquivos, incluindo memoria compacta abaixo de 20 KB, privacidade dos campos, equivalencia de contexto, assinatura semantica e auditoria de repeticoes.
- Em 2026-07-12, o Plano 8 reorganizou o formulario em campos essenciais visiveis e `Opcoes avancadas` recolhiveis. Pais, estado, cidade e orcamento foram movidos para a area avancada sem alterar seus ids.
- Foram adicionados horario de inicio, formato do servico, faixa etaria predominante, infraestrutura disponivel e prioridade do planejamento. Horario aceita somente `HH:MM`; os outros campos aceitam apenas opcoes controladas.
- Projetos antigos continuam carregando com defaults. Projetos novos preservam os cinco campos no `localStorage`; ao carregar contexto especifico, a area avancada abre automaticamente.
- A diretriz culinaria ganhou `contexto_operacional` por periodo do dia, servico, publico, infraestrutura e prioridade. Identidade, restricoes e seguranca continuam acima da prioridade escolhida.
- O Plano 8 preservou os novos dados em `premissas`; desde o Plano 9, servico, infraestrutura, horario, duracao, publico e estilo alimentam a operacao deterministica.
- Tela ganhou a secao `Contexto informado`; o PDF registra os cinco novos dados. Com infraestrutura `A confirmar`, o prompt proibe inventar equipamentos.
- O teste corporativo real usou 08:30, estacoes/ilhas, publico adulto, cozinha de apoio limitada e prioridade de praticidade: qualidade aprovada, zero avisos, 13 pratos, 11 receitas e 28 compras.
- Chrome confirmou historico carregando todos os valores e abrindo a area avancada, desktop sem overflow, mobile 400/400 sem overflow e PDF A4 de 6 paginas com o novo contexto.
- A inspecao visual confirmou hierarquia limpa no formulario fechado. `npm test` permaneceu aprovado com 10 arquivos.
- Em 2026-07-13, o Plano 9 criou `operational-planning.service.js`. O backend classifica complexidade baixa, media ou alta por fatores visiveis e dimensiona atendimento, cozinha/reposicao, coordenacao, passe, estacoes, bar, grelha e recebimento somente quando aplicaveis.
- Producao, transporte, mise en place, finalizacao local, montagem e reposicao passaram a formar um fluxo oficial. Infraestrutura ou formato nao confirmados geram operacao provisoria e pendencias explicitas; nenhum equipamento local e presumido.
- Equipamentos sao organizados por recebimento/retaguarda, servico, bebidas e, no churrasco, grelha. O cronograma usa horario real quando informado, marca dia anterior/seguinte e incorpora os momentos do perfil culinario do Plano 6.
- Tela e PDF ganharam `Operacao do Evento` com complexidade, modelo de producao, fluxo, estacoes, responsaveis e cronograma. O resumo executivo passou a exibir o total de profissionais, nao apenas a quantidade de funcoes.
- O teste automatizado cobriu atendimento domiciliar, casamento, churrasco, infantil e corporativo em niveis baixo, medio e alto, com formatos e infraestruturas diferentes. `npm test` passou com 11 arquivos e `git diff --check` sem problemas.
- Duas geracoes corporativas reais responderam aprovadas e sem avisos, com 13 pratos, 9 a 10 receitas e 25 compras. A operacao ficou media, com 4 frentes de equipe, 6 etapas de fluxo, 3 estacoes, 9 momentos e zero confirmacoes pendentes.
- Chrome confirmou a secao operacional, historico recarregando os campos avancados, desktop sem overflow e mobile 400/400 sem overflow. O PDF A4 passou a 7 paginas, com texto extraivel; a pagina operacional foi inspecionada, ficou legivel e a repeticao confirmou os horarios em cada etapa.
- A revisao encontrou e corrigiu uma contradicao de responsabilidade: eventos sem coordenador dedicado ou sem bar agora usam uma funcao realmente presente na equipe. O teste automatizado impede que o cronograma volte a atribuir bar inexistente.
- `/api/status` declara `operational_complexity: true`. A versao final do ciclo permanece disponivel em `http://localhost:3000` enquanto o processo desta sessao estiver ativo.
- Em 2026-07-13, o Plano 10 separou editorialmente `Cronograma operacional` e `Roteiro do Evento`. O primeiro continua oficial e deterministico; o segundo mostra somente recepcao, servico, transicoes e encerramento visiveis aos convidados.
- A taxonomia permite perfis com quatro ou mais momentos de servico. O roteiro passou a aceitar 4 a 8 momentos sem criar etapas artificiais; o cronograma operacional continua com 9 ou 10 etapas nos cenarios validados.
- Ingredientes omitidos no cardapio, mas presentes na receita ligada, agora sao recuperados sem inventar conteudo. A lista de compras continua derivando qualquer ingrediente descoberto e torna o ajuste visivel.
- O prompt passou a conferir composicao por categoria e exigir bebida alcoolica quando o evento pedir alcool ou bar. A repeticao dirigida do casamento terminou sem avisos, com 14 pratos, 11 receitas, 29 compras, tres bebidas e cobertura 29/29.
- A assinatura de variedade passou a normalizar plurais e formas como `pao/paes`, `pizza/pizzas` e `brigadeiro/brigadeiros`, sem confundir tecnicas realmente diferentes. O teste final infantil trouxe 8 pratos novos, 3 repeticoes essenciais e 2 repeticoes evitaveis corretamente sinalizadas; qualidade culinaria aprovada e cobertura 24/24.
- A regressao final executou os cinco eventos com contexto avancado completo. Todos exibiram uma unica secao operacional, o `Roteiro do Evento`, contagens coerentes de receitas/compras e zero overflow no desktop.
- A recarga real da pagina preservou os cinco projetos, carregou o atendimento domiciliar e restaurou horario, servico, faixa etaria, infraestrutura, prioridade e abertura das opcoes avancadas. Mobile permaneceu 400/400 sem overflow.
- Os cinco PDFs passaram em A4 com 7 a 8 paginas, texto extraivel e presenca das secoes `Operacao deterministica` e `Roteiro do evento`. Amostras visuais infantil confirmaram legibilidade sem sobreposicao aparente.
- `npm test` passou com 11 arquivos; checagens de sintaxe e `git diff --check` passaram. `scripts/validate-plan5-e2e.js` agora aplica portas finais e recarrega a pagina; `scripts/inspect-plan-history.js` permite auditar avisos e cobertura sem nova geracao.

Pontos condicionais para uma etapa futura, sem bloquear o ciclo concluido:

- Duas repeticoes infantis nao essenciais ficaram corretamente visiveis para revisao; mais detalhes de tema, publico e formato podem ampliar a variedade em testes futuros.
- Teste real Spoonacular somente depois de rotacionar a chave exposta e configurar uma nova chave no `.env`.

## Registro de Obra - inicio da validacao controlada

- **Mantido:** consulta Spoonacular manual, transitoria, protegida, com no maximo tres resultados e sem persistencia no plano, historico ou PDF.
- **Validado em 2026-07-13:** 11 arquivos de teste, sintaxe do servidor e do servico Spoonacular e `git diff --check` passaram.
- **Informado pelo usuario:** a chave Spoonacular anteriormente exposta foi rotacionada.
- **Pausado por decisao do usuario:** consulta real Spoonacular e configuracao da chave, porque o servico pago nao faz parte do proximo ciclo minimo.
- **Preservado para o futuro:** `scripts/validate-spoonacular-live.js` e o comando `npm run test:spoonacular:live -- "consulta"`, que permitem verificar o contrato real sem imprimir a chave caso a decisao seja revista.
- **Planejado:** executar 3 a 5 testes com usuarios conforme `PLANO_TESTES_CONTROLADOS.md` e corrigir somente falhas reproduzidas.
- **Nao alterado:** motor deterministico, contrato culinario, prompt Gemini, autenticacao, precificacao, banco, pagamentos e deploy.

### Evidencia do pre-teste tecnico 0

- `/api/status` confirmou Gemini configurado, senha demo obrigatoria, motor local e operacao deterministica ativos; Spoonacular permaneceu desativado.
- Uma unica geracao corporativa de baseline respondeu `ok: true`, com 13 itens, 23/23 ingredientes cobertos e 7 receitas completas.
- O status culinario ficou `revisar` por faltar ficha para `Frutas da estacao fatiadas`, item de montagem. O aviso foi considerado valido e nao motivou mudanca de codigo.
- Interface, historico, operacao renderizada e PDF continuam reservados ao primeiro teste controlado com usuario.

### Evidencia do pre-teste tecnico 1

- O roteiro E2E passou a iniciar e encerrar seu proprio servidor quando a porta 3000 estiver livre, mantendo compatibilidade com um servidor ja ativo.
- O primeiro E2E corporativo passou em geracao, operacao, historico, recarga, mobile e PDF, mas a leitura do PDF encontrou resumo com restricao sem gluten nao informada e linguagem de garantia alimentar.
- `validarPlano()` passou a receber o evento e substituir deterministicamente resumo com promessa absoluta ou restricao inventada; restricoes validas recebem aviso de conferencia profissional e contaminacao cruzada.
- Dois testes de regressao cobrem substituicao do resumo inseguro e inclusao do cuidado profissional. O E2E tambem ganhou portas automaticas para essas regras.
- A repeticao com o codigo atual passou: 13 pratos, 11 receitas, 29 compras, 30/30 ingredientes cobertos, operacao media, historico recarregado, mobile 400/400 sem overflow e PDF A4 pesquisavel de 7 paginas.
- A IA omitiu 22 compras na ultima amostra; o backend recuperou todas sem aviso. Monitorar o volume nos proximos testes antes de mudar o prompt.

### Evidencia do pre-teste tecnico 2

- O E2E infantil com 30 pessoas, 20 criancas e orientacao de evitar amendoim passou com 13 pratos, 11 receitas, 30 compras e cobertura 30/30.
- Nenhuma compra precisou ser derivada. Amendoim nao apareceu no cardapio, receitas ou lista de compras.
- O resumo seguro preservou a restricao informada e exibiu conferencia profissional de rotulos, preparo e contaminacao cruzada.
- Operacao media, historico, recarga dos campos avancados, mobile 400/400 sem overflow e PDF A4 pesquisavel de 7 paginas passaram.
- Nenhuma mudanca de codigo foi necessaria. O proximo baseline tecnico recomendado e casamento; teste com usuario real continua sendo a porta de validacao do produto.

### Evidencia do pre-teste tecnico 3

- O primeiro casamento utilizavel mostrou duas lacunas semanticas: opcao vegetariana apenas na Entrada e bar completo com uma unica bebida alcoolica.
- Prompt, backend e E2E agora exigem `Prato Principal` vegetariano/vegano em almoco ou jantar e bar completo com duas bebidas alcoolicas e duas nao alcoolicas.
- A matriz aumenta deterministicamente o minimo de `Bebida` para 4 quando houver bar completo; no casamento, o total minimo passou de 14 para 15.
- A regra textual deixou de confundir promessa sobre a experiencia do evento com garantia alimentar; promessa e restricao precisam estar na mesma frase para bloquear o resumo.
- O casamento final passou com 15 pratos, 12 receitas, 37 compras, cobertura 37/37, zero compras derivadas, prato principal vegetariano e bar 2+2.
- Operacao alta, historico, recarga, mobile 400/400 sem overflow e PDF A4 pesquisavel de 7 paginas passaram.
- O proximo passo continua sendo teste com pessoa usuaria; tecnicamente, os baselines corporativo, infantil e casamento estao registrados.

### Evidencia do pre-teste tecnico 4

- O primeiro churrasco revelou que bebidas do cardapio/compras podiam ficar abaixo dos litros oficiais do motor: 18/48 L nao alcoolicos e 30/56 L alcoolicos.
- Prompt, backend e E2E agora conferem separadamente os litros. O backend nao inventa distribuicao: mantem o plano e registra deficit exato como revisao.
- O churrasco final passou com 18 pratos, 15 receitas, 30 compras, cobertura 29/29 e zero compras derivadas.
- A opcao vegetariana ficou em `Prato Principal` e foi ligada a receita de grelha separada. Bebidas fecharam 48/48 L nao alcoolicos e 56/56 L alcoolicos para adultos.
- Operacao media com churrasqueiro e estacao de grelha, historico, mobile 400/400 e PDF A4 pesquisavel de 7 paginas passaram.
- Quatro baselines tecnicos estao registrados: corporativo, infantil, casamento e churrasco. Falta atendimento domiciliar antes da consolidacao tecnica.

### Evidencia do pre-teste tecnico 5

- O atendimento domiciliar para 5 adultos reproduziu perda de unidade: cardapio e compras continham `1` e `1,4`, mas sem `L`, fazendo a verificacao do motor registrar zero litro.
- O validador agora recupera somente a unidade ausente em quantidades numericas de itens explicitamente classificados como Bebida, sem alterar os valores; o prompt reforca `L` ou `ml` e a regressao cobre o contrato.
- O E2E passou a persistir diagnostico detalhado em `/tmp` quando uma porta falha, incluindo bebidas do cardapio e da lista de compras.
- A repeticao final passou com 13 itens, 11 receitas, 34 compras, cobertura 29/29, 1/1 L nao alcoolico e 1,4/1,4 L alcoolico.
- Seis compras foram derivadas automaticamente; observar a recorrencia nos testes com usuarios antes de mudar novamente o prompt.
- Operacao baixa, historico, recarga, mobile 400/400 e PDF A4 pesquisavel de 7 paginas passaram.
- Os cinco baselines tecnicos estao consolidados: corporativo, infantil, casamento, churrasco e atendimento domiciliar. A proxima evidencia necessaria e de uso acompanhado por pessoas reais.

### Evidencia do teste acompanhado 1

- O participante planejou aniversario de debutante para 150 pessoas e atribuiu notas 2 ao formulario, 3 ao cardapio, 2 as receitas, 2 as compras e 3 a operacao; historico e PDF funcionaram.
- A reproducao confirmou o problema: o perfil generico entregava 13 itens, apenas um prato principal e omitia carnes nomeadas no pedido.
- A matriz ganhou camada geral de ocasioes, inicialmente com debutante, Natal, Ano Novo, Pascoa e Carnaval. Novas ocasioes podem ser adicionadas como dados, sem criar fluxo exclusivo no codigo.
- Um catalogo culinario local inicial separa pedidos nominais do repertorio tipico. O prompt recebe a lista estruturada, e o backend marca qualquer pedido ausente como revisao.
- O aceite final de debutante passou com 22 itens, oito pedidos nominais presentes, 14/14 receitas completas, 36/36 ingredientes, zero compras derivadas e quatro bebidas.
- Natal validou o comportamento sem pratos nominais: 19 itens, 15/15 receitas, repertorio sazonal coerente, quatro bebidas, historico, mobile e PDF A4 de 8 paginas.
- O formulario oferece sugestoes de eventos sem bloquear texto livre e tres refeicoes combinadas adicionais. A lista de compras separa visualmente natureza e nome; detalhes operacionais ficam recolhidos por padrao.
- Imagens, fornecedores, planilha e precificacao por usuario foram classificados como backlog. Precos continuam `A cotar` ate existir catalogo regional com fonte, data-base e validacao.

### Evidencia da revisao corporativa Premium

- O workshop corporativo de 80 pessoas recebeu 6,5/10 como rascunho e 4,5/10 como experiencia Premium; os principais sinais foram 13 itens, cha em sache, restricoes pouco claras, ambientacao comum e layout irregular.
- A causa dos 13 itens era deterministica: a composicao corporativa-base somava 4+2+3+4. A resposta antiga terminou normalmente, sem corte por tokens.
- A taxonomia agora possui modificadores de estilo. Premium acrescenta uma opcao por categoria e define criterios verificaveis de curadoria, servico, apresentacao e inclusao.
- Prompt e backend rejeitam itens comuns incompativeis com Premium e cobram duas opcoes identificadas por restricao em eventos com varios momentos de servico.
- Um `section` sem fechamento causava a grade visual quebrada. A estrutura foi corrigida e a selecao de pratos ganhou carrossel uniforme, setas e visualizacao alternativa em lista.
- O teste real atualizado entregou 17 itens em 5+3+4+5, nenhum item proibido, `STOP` e 6.931 tokens. A abreviacao `Veg` foi incorporada ao validador.
- O E2E confirmou 17 pratos, 15 receitas, 40 compras, historico, mobile 400/400 e PDF A4 de 62.758 bytes. A porta de qualidade manteve `revisar` por falta de evidencia de louca/acabamento e estacao de bebidas especiais.
- Precos, imagens e fornecedores continuam separados: `A cotar` permanece correto ate existir fonte regional; a avaliacao de envelope orcamentario deve ser uma etapa explicita, sem simular cotacao.

### Evidencia da regra de coerencia e blocos

- O requisito de 2026-07-14 foi implementado com duas camadas: blocos para apresentacao e itens atomicos para receitas, quantidades e compras.
- `data/culinary/event-contexts.json` cobre 11 contextos e combina tipo, tema e refeicao sem substituir o evento principal.
- `contexto_evento` estrutura significado, alimentos, bebidas, cores, decoracao, estilo, inadequacoes, restricoes e orcamento orientador sem cotacao.
- O backend deriva `blocos_cardapio` por familia sem aceitar blocos inventados pelo cliente ou pela IA como fonte operacional.
- Tela e PDF mostram blocos antes do detalhamento; planejamentos antigos recebem agrupamento por categoria.
- E2E: corporativo 17/12, churrasco 19/13 e Natal 19/11 em itens/blocos; historico, recarga, mobile e PDFs passaram.
- A especificacao tecnica ativa esta em `docs/REGRA_COERENCIA_BLOCOS_EVENTO.md`.

### Evidencia do refinamento mobile

- A regra responsiva geral saiu do modulo de pitch; o app agora controla sua propria primeira dobra em `300px` e `270px`.
- Formulario, chat, historico e acoes foram compactados com campos de `54px` e alvos de toque de no minimo `44px`.
- Em `390 x 844`, o documento mediu `390px`, sem overflow; controles do cardapio mediram `340px` e o primeiro cartao `296px`.
- O E2E salva captura e metricas mobile antes da avaliacao culinaria. Assim, falha de receita ou bebida nao apaga evidencia visual.
- Duas amostras mantiveram portas funcionais ativas: corporativo com 11/14 receitas e churrasco com 35/48 L de bebidas nao alcoolicas.
- Especificacao e evidencias: `docs/VALIDACAO_MOBILE.md`.

### Evidencia de receitas e bebidas

- Itens `preparo` e `montagem` agora terminam com ficha ligada por `cardapio_id`; `pronto` permanece sem receita obrigatoria.
- Fichas omitidas ou parciais sao completadas somente com dados do cardapio, marcadas como recuperadas e acompanhadas de aviso profissional.
- O motor reconcilia deficits de bebidas proporcionalmente entre opcoes existentes e atualiza compras diretas; sem item positivo, o aviso permanece.
- O E2E usa porta propria para nao validar acidentalmente um servidor antigo aberto pelo usuario.
- Resultado real: corporativo 15/15, churrasco 16/16 com 9 recuperadas e Natal 15/15; todos passaram em historico, PDF e mobile.
- O corporativo ainda reprova sinais Premium e composicao 16/17. Nao tratar cobertura de receitas como aprovacao total do evento.
- Especificacao: `docs/REGRA_COBERTURA_RECEITAS_BEBIDAS.md`.

## Proxima atualizacao curta

O usuario escolheu teste controlado, pausou o Spoonacular por custo, concluiu cinco baselines tecnicos, o primeiro teste acompanhado e uma revisao corporativa Premium:

1. Receber do usuario a proxima atividade relacionada ao Chef IA antes de abrir outra frente.
2. Manter como pendencia visivel a composicao e os sinais Premium do corporativo.
3. Pedir uma nova avaliacao perceptiva do workshop e do mobile quando o usuario desejar retomar os testes.
4. Separar qualidade culinaria, ambientacao, restricoes e clareza visual em notas independentes.
5. Projetar futuras referencias visuais somente depois da nova atividade solicitada.
6. Manter envelope orcamentario, imagens licenciadas e fornecedores como trilhas separadas.
7. Manter Spoonacular no backlog e os commits locais sem push ate um marco combinado.

Nao fazer nesta atualizacao:

- Separar pitch do `index.html`.
- Migrar SDK Gemini.
- Criar login, banco, pagamento ou SaaS.
- Conectar o catalogo em rascunho ao calculo ou exibir seus valores como cotacao.
- Executar pesquisa ampla ou consultar varias fontes em toda geracao de evento.
- Tratar `schema_ok`, 7-9 pratos ou 12 compras como prova de qualidade do conteudo.
- Voltar a usar contagem generica de pratos ou compras sem verificar categorias e cobertura.
- Reabrir prompt ou interface sem mudanca de contrato necessaria.

## Possibilidades de melhoria dentro do plano

- Historico persistente em nuvem depois do `localStorage`, usando Supabase ou Firebase.
- Biblioteca de modelos por tipo de evento: aniversario, casamento, corporativo, churrasco, coffee break.
- Cadastro de fornecedores, precos locais e margens personalizadas.
- Motor de pesquisa para referencias externas, imagens, tendencias e fornecedores.
- Modo comparativo entre cenarios economico, medio e sofisticado.
- Testes automatizados para o motor local e para validacao do JSON da IA.
- Migracao futura do SDK Gemini legado para `@google/genai`, quando for conveniente.

## Cuidados para a proxima rodada

- `.env` nao deve ser commitado.
- Este handoff e a unica leitura obrigatoria de retomada; codigo e testes continuam sendo a fonte do comportamento real.
- `docs/planoCompletoChefia.md` e `docs/PLANO_CONTINUACAO.md` foram recuperados como referencias historicas/plano mestre. Antes de executar qualquer item antigo, conferir se ele ainda bate com o roadmap atual.
- Atualizar documento especializado somente quando a mudanca alterar diretamente seu fluxo, requisito, regra ou decisao.
- `legacy/simple-current/` deve permanecer como referencia visual por enquanto.
- `public/js/prompt.js` foi removido de proposito.
- `public/css/style.css` esta pequeno porque agora importa os modulos em `public/css/modules/`.

## Comandos uteis de retomada

```bash
cd "/home/samu_alba/Documentos/pasta chafe ia/app-cardapio-ia"
npm start
```

```bash
node --check server.js
node --check src/services/ai/gemini.service.js
node --check src/services/planning/motor.service.js
node --check src/prompts/event.prompt.js
node --check public/js/app.js
node --check public/js/render.js
node --check public/js/utils.js
```

```bash
curl http://localhost:3000/api/status
```
