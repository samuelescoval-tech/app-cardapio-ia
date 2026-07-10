# Roadmap atual - Chef IA Studio

<!-- CODEX:LER_SEMPRE
Ler depois do handoff para confirmar o que ja esta concluido e qual e a proxima atualizacao curta.
Nao usar documentos historicos como prioridade se contradisserem este roadmap.
-->

<!-- CODEX:MANTER_EM_LINHA
Quando uma prioridade mudar, atualizar tambem HANDOFF_PROXIMA_ATUALIZACAO.md e o Resumo vivo do MATERIAL_APOIO_PROCESSOS_E_REQUISITOS.md.
-->

<!-- CODEX:FAZER
Executar a Porta de Passagem da demo controlada em docs/README.md e o Fluxo 6 de docs/FLUXOS_DE_PROCESSO.md, sem repetir teste ja registrado.
Evitar tecnologia nova sem necessidade.
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
- Prompt backend reformado com Arquitetura Residencial de Prompts como metodologia interna e proporcional.
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

## Proxima atualizacao curta

1. Consultar a Janela de Previa e a Porta de Passagem da demo controlada em `docs/README.md`.
2. Consultar o Registro de testes e validacoes em `HANDOFF_PROXIMA_ATUALIZACAO.md` antes de rodar qualquer nova bateria.
3. Registrar evidencias dos testes manuais ja feitos pelo usuario, especialmente modal, geracao real e PDF.
4. Seguir `FLUXOS_DE_PROCESSO.md`, Fluxo 6 - Demo controlada externa.
5. Se nao houver falha aberta, preparar teste controlado para amigo com `DEMO_ACCESS_KEY` e link temporario.

## Depois dessa atualizacao

1. Melhorar validacao de entrada e feedback de erros.
2. Ajustar responsividade do resultado.
3. Separar apresentacao/pitch do `index.html`, se ainda fizer sentido.
4. Evoluir motor local para adultos/criancas separados.
5. Reavaliar agentes IA somente se surgirem funcoes especializadas com entradas, saidas, gatilhos e validacoes proprias.
6. Migrar SDK Gemini legado para `@google/genai` somente depois da base continuar estavel.

## Observacao sobre documentacao

Documentos antigos de fase, quickstart e resumo foram removidos porque duplicavam informacao ou contradiziam o estado real. `planoCompletoChefia.md` e `PLANO_CONTINUACAO.md` foram recuperados como referencia historica/plano mestre; o estado atual valido continua no README principal, neste roadmap, em `HANDOFF_PROXIMA_ATUALIZACAO.md`, nos fluxos de processo, no material vivo de processos/requisitos, na analise de requisitos/atores/casos de uso, nos diagramas complementares e nos padroes de qualidade/priorizacao.
