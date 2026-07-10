# Roadmap atual - Chef IA Studio

<!-- CODEX:LER_POR_PROCESSO
Ler depois do handoff para confirmar o que ja esta concluido e qual e a proxima atualizacao curta.
Nao usar documentos historicos como prioridade se contradisserem este roadmap.
-->

<!-- CODEX:MANTER_EM_LINHA
Quando uma prioridade mudar, atualizar a Proxima atualizacao curta do handoff.
-->

Atualizado apos a limpeza e continuidade do plano.

## Concluido

- Express servindo `public/`.
- Gemini funcionando via backend.
- Modelo configurado em `.env` com `GEMINI_MODEL`.
- Resposta normalizada em `{ ok, provider, plano, meta }`.
- Extração e validação robusta de JSON.
- Formulario enriquecido com duracao, refeicao, tema, bebidas e orcamento.
- Resultado rico: dashboard, motor, compras por setor, locais, layout, decoracao, cronograma, checklist e orcamentos.
- JS modularizado em `app.js`, `render.js`, `utils.js`.
- CSS modularizado em `public/css/modules/`.
- Documentacao movida para `docs/`.
- Prompt movido para o backend em `src/prompts/event.prompt.js`.
- Prompt backend inicialmente reformado com a metodologia e depois simplificado para rotulos operacionais proporcionais.
- Motor matematico local criado em `src/services/planning/motor.service.js`.
- Validacao do plano reforcada com normalizacao de arrays, decoracao, checklist, orcamento e resumo.
- Historico local com `localStorage`.
- Exportacao PDF inicial com `jsPDF`.
- `meta.tempo_ms` corrigido para duracao real da chamada Gemini.
- `docs/` limpo para manter apenas documentacao ativa e util.
- Fluxo completo validado em Chrome headless: formulario, geracao, historico e download de PDF.
- PDF refinado com cabecalho escuro, cards de resumo, secoes destacadas e rodape.
- PDF expandido para incluir mais conteudo do evento: dados informados, receitas, compras, servico de mesa, utensilios, local, layout, decoracao, cronograma, equipe, entretenimento, lembrancinhas, checklist e orcamento.
- PDF mantem as secoes principais mesmo quando algum bloco do plano vier vazio, com mensagens de "Nao informado".
- Protecao temporaria para teste externo com `DEMO_ACCESS_KEY` em `/gerar-cardapio`.
- Modal/tela de acesso demo implementado no frontend, substituindo o `prompt()` nativo.
- Validacao local confirmou `demo_access.required: true`, bloqueio 401 sem senha, bloqueio 401 com senha incorreta e pagina carregando com markup do modal.
- Rota real `/gerar-cardapio` validada com `DEMO_ACCESS_KEY` correta: status 200, `ok`, `schema_ok`, `motor_local` e `prompt_backend` verdadeiros.
- Decisao arquitetural: nao criar agentes IA autonomos agora; tratar motor, prompt, validacao, render, PDF e acesso demo como Unidades internas proporcionais.
- Fluxos de processo dedicados criados em `docs/FLUXOS_DE_PROCESSO.md`.
- Material de apoio criado em `docs/MATERIAL_APOIO_PROCESSOS_E_REQUISITOS.md` com BPMN simplificado, entradas, processos, saidas, stakeholders, gargalos, requisitos e resumo vivo.
- Analise de requisitos, atores e casos de uso criada em `docs/ANALISE_REQUISITOS_ATORES_CASOS_USO.md`.
- Diagramas complementares e analise tecnica criados em `docs/DIAGRAMAS_COMPLEMENTARES_ANALISE_TECNICA.md`.
- Padroes de qualidade, interface e priorizacao criados em `docs/PADROES_QUALIDADE_PRIORIZACAO.md`.
- Prompt de runtime simplificado para secoes operacionais, sem repetir a metafora nem pedir `motor_logistica` de volta ao Gemini.
- Validacao backend de evento implementada com limites de pessoas, duracao e textos; prompt arbitrario do cliente foi bloqueado.
- Validador do plano passou a exigir campos essenciais e descartar campos fora do contrato.
- Suite automatizada adicionada com `node:test`, sem dependencia nova.
- Resultado responsivo validado em desktop e mobile sem overflow horizontal.
- Demo externa controlada concluida com retorno positivo e sem falha relatada.
- Motor local evoluido para adultos e criancas, preservando `pessoas` como total e compatibilidade com historico.

## Proxima atualizacao curta

1. Coletar pais, estado, cidade e data do evento.
2. Remover totais financeiros sem fonte comprovada.
3. Exibir que a cotacao depende de catalogo regional com fonte e data-base.
4. Preparar o contrato de um catalogo inicial para uma unica cidade.

## Trilha de precificacao

### Curto prazo

- Quantidades continuam no motor local.
- Precos sem fonte ficam como `A cotar`, nunca como valor real.
- Todo preco futuro exige regiao, moeda, unidade, fonte, data-base e validade.
- Primeiro catalogo deve cobrir uma unica cidade e ser validado contra cotacao real.

### Medio prazo

- Importacao de catalogo por CSV/JSON.
- Multiplas referencias por item e faixas economica, media e sofisticada baseadas em mercado.
- Atualizacao de bases antigas com indice oficial, sem usar inflacao como substituto de cotacao.

### Longo prazo

- Banco PostgreSQL quando houver varias regioes, historico, fornecedores ou painel administrativo.
- Integracoes de cotacao, moedas, impostos e indices por pais.
- Orcamento comercial somente com fontes e regras juridicas adequadas.

## Depois dessa atualizacao

1. Criar e validar catalogo inicial de uma cidade.
2. Retomar multiplicadores do motor por tipo de refeicao.
3. Separar apresentacao/pitch do `index.html`, se ainda fizer sentido.
4. Migrar SDK Gemini legado somente depois da base continuar estavel.

## Observacao sobre documentacao

Documentos antigos de fase, quickstart e resumo foram removidos porque duplicavam informacao ou contradiziam o estado real. `planoCompletoChefia.md` e `PLANO_CONTINUACAO.md` foram recuperados como referencia historica/plano mestre; o estado atual valido continua no README principal, neste roadmap, em `HANDOFF_PROXIMA_ATUALIZACAO.md`, nos fluxos de processo, no material vivo de processos/requisitos, na analise de requisitos/atores/casos de uso, nos diagramas complementares e nos padroes de qualidade/priorizacao.
