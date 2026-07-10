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
Proxima atualizacao recomendada: escolher uma cidade piloto e montar um catalogo pequeno com fontes e data-base reais.
Aguardar decisao do usuario antes de iniciar.
-->

Este documento resume o estado real do projeto para continuar a proxima rodada sem perder contexto.

## Estado atual em uma frase

O app gera planejamento com Gemini, calcula quantidades localmente, coleta regiao/data e mostra `A cotar` quando nao existe fonte financeira rastreavel; a proxima recomendacao e validar um catalogo real para uma cidade piloto.

## O que foi modificado

- Conexao com Gemini estabilizada no backend usando `GEMINI_API_KEY` ou `GOOGLE_API_KEY`.
- Modelo configuravel por `.env` com `GEMINI_MODEL`.
- `server.js` aceita somente dados estruturados do evento em `/gerar-cardapio`; prompt arbitrario enviado pelo cliente e rejeitado.
- Prompt saiu do frontend e foi para `src/prompts/event.prompt.js`.
- `src/prompts/event.prompt.js` foi simplificado para Papel, Objetivo, Fontes Confiaveis, Dados, Restricoes, Contrato e Criterios de Conclusao; a metodologia permanece como referencia interna, sem pesar no runtime.
- O Gemini nao devolve mais `motor_logistica`; `aplicarMotorAoPlano()` injeta sempre a versao oficial calculada no backend.
- `src/utils/validate-event.js` valida tipo, pessoas, duracao e limites de texto antes do motor e da IA.
- Criado motor local em `src/services/planning/motor.service.js` para calcular alimentos, bebidas, equipe, espaco, custo e utensilios.
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
5. `server.js` calcula o motor local com `calcularMotorEvento(evento)`.
6. `src/prompts/event.prompt.js` monta o prompt operacional para Gemini.
7. `src/services/ai/gemini.service.js` chama o modelo.
8. `src/utils/extract-json.js` e `src/utils/validate-plan.js` extraem, restringem, normalizam e validam o JSON.
9. `aplicarMotorAoPlano()` injeta os dados oficiais calculados no plano.
10. `public/js/render.js` exibe o planejamento completo.
11. `public/js/storage.service.js` salva e carrega o historico local.

## Arquivos principais

- `server.js`: rotas Express, status da API e endpoint de geracao.
- `src/services/ai/gemini.service.js`: integracao com Gemini.
- `src/services/planning/motor.service.js`: calculos locais do evento.
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

Ainda falta registrar ou validar depois da proxima rodada:

- Evidencia do acabamento visual do PDF em navegador aberto pelo usuario, se esse teste ja foi feito.
- Exportacao PDF apos ajustes visuais, se houver.

## Proxima atualizacao curta

Objetivo recomendado: validar o modelo financeiro com poucos dados reais antes de criar banco.

1. Escolher uma cidade piloto.
2. Coletar um catalogo pequeno com item, unidade, moeda, fonte, data-base e validade.
3. Comparar um evento calculado com uma cotacao real.
4. So depois decidir importacao CSV/JSON e regras de atualizacao por inflacao.

Nao fazer nesta atualizacao:

- Separar pitch do `index.html`.
- Migrar SDK Gemini.
- Criar login, banco, pagamento ou SaaS.
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
