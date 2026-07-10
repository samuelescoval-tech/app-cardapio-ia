# Docs - Chef IA Studio

<!-- CODEX:LER_POR_PROCESSO
Ler este indice somente quando houver duvida sobre qual documento consultar.
-->

<!-- CODEX:MANTER_EM_LINHA
Quando criar, remover ou recuperar documento em docs/, atualizar este indice e, se for relevante, CLEANUP_AUDIT.md.
-->

Documentacao enxuta do projeto. A ideia e manter poucos arquivos vivos, sem duplicar guias antigos ou fases ja concluidas.

## Hierarquia de informacao

Use a menor quantidade de informacao capaz de orientar a tarefa:

1. **Codigo e testes atuais:** fonte principal do comportamento real.
2. **`HANDOFF_PROXIMA_ATUALIZACAO.md`:** estado, ultimo resultado relevante e proximo passo unico.
3. **`ROADMAP_ATUAL.md`:** consultar somente ao escolher ou mudar prioridade.
4. **Documento especializado:** consultar somente quando a tarefa tocar aquele processo.
5. **Documentos historicos:** contexto opcional; nunca definem o trabalho atual.

Documentos especializados:

| Assunto | Documento |
|---|---|
| Fluxo tecnico ou de uso | `FLUXOS_DE_PROCESSO.md` |
| Requisito, ator ou validacao | `ANALISE_REQUISITOS_ATORES_CASOS_USO.md` |
| Processo maior ou regra de negocio | `MATERIAL_APOIO_PROCESSOS_E_REQUISITOS.md` |
| UI, qualidade ou criterio de prioridade | `PADROES_QUALIDADE_PRIORIZACAO.md` |
| Privacidade, viabilidade ou diagramas | `DIAGRAMAS_COMPLEMENTARES_ANALISE_TECNICA.md` |
| Erro conhecido | `TROUBLESHOOTING.md` |
| GitHub e segredos | `SEGURANCA_GITHUB.md` |

## Processo eficiente

1. Ler o pedido e as secoes **Estado atual**, **Proxima atualizacao curta** e, quando necessario, o ultimo teste do handoff.
2. Definir um objetivo, os arquivos provaveis e um criterio de conclusao.
3. Inspecionar o codigo relacionado; nao analisar o repositorio inteiro.
4. Implementar uma mudanca coerente por vez.
5. Rodar somente testes afetados; teste completo apenas no fechamento.
6. Atualizar o handoff se estado, decisao ou proximo passo mudou.
7. Atualizar outro documento somente se o contrato dele mudou.
8. Encerrar com o quadro breve solicitado pelo usuario e aguardar a decisao seguinte.

Limites de trabalho:

- Uma etapa ativa por vez.
- Diferencas editoriais ou de quantidade da IA nao bloqueiam JSON valido e utilizavel.
- Uma chamada real de IA por mudanca de prompt; repetir apenas por falha funcional comprovada.
- Roadmap nao e reescrito durante uma correcao tecnica, salvo mudanca real de prioridade.
- Nenhum documento novo sem lacuna clara de informacao.

## Porta de Passagem - demo controlada

Esta porta decide se o projeto pode sair do uso interno e ir para um teste externo pequeno. Ela nao cria funcionalidade nova; apenas organiza a passagem para uma pessoa testar com escopo protegido.

Pre-condicoes para abrir a porta:

- Registro de testes e validacoes consultado em `docs/HANDOFF_PROXIMA_ATUALIZACAO.md`.
- Evidencias manuais registradas ou confirmadas para modal, geracao real, historico e PDF.
- Nenhuma falha aberta bloqueando geracao, senha demo, renderizacao principal ou PDF.
- `DEMO_ACCESS_KEY` ativa para teste controlado.
- Link temporario definido sem expor `.env`, chave Gemini ou senha em docs publicos.

Roteiro para a pessoa testadora:

1. Abrir o link temporario.
2. Informar a senha temporaria quando o modal pedir.
3. Criar um evento realista com tipo, convidados, duracao, refeicao, estilo e observacoes.
4. Gerar o planejamento.
5. Conferir se resultado, compras, cronograma, orcamento, historico e PDF fazem sentido.
6. Reportar erro com: tipo de evento, numero de convidados, navegador, passo em que falhou e print se houver.

Nao entra nesta passagem:

- Login, banco, pagamento ou SaaS.
- Motor adultos/criancas.
- Agentes IA autonomos.
- Refatoracao do pitch.
- Testes repetidos sem mudanca relacionada.

## Marcadores de leitura para IA

Use `rg "CODEX:" docs` para encontrar rapidamente as marcacoes de conducao.

- `CODEX:LER_SEMPRE`: bloco que deve ser conferido em toda retomada ou antes de decidir prioridade.
- `CODEX:LER_POR_PROCESSO`: bloco que deve ser conferido quando aquele processo especifico for alterado ou executado.
- `CODEX:MANTER_EM_LINHA`: documentos que precisam ficar coerentes entre si quando houver mudanca.
- `CODEX:FAZER`: proximo foco recomendado ou acao minima associada ao documento.
- `CODEX:MAPA_LEITURA`: bloco que indica que o documento tem faixas de linhas para leitura seletiva.

## Documentos ativos

- `HANDOFF_PROXIMA_ATUALIZACAO.md`: resumo de retomada mais importante para a proxima sessao.
- `ROADMAP_ATUAL.md`: estado real do projeto e proximas etapas.
- `FLUXOS_DE_PROCESSO.md`: fluxos de processo dedicados, com macroprocesso, geracao, acesso demo, PDF e atualizacao documental.
- `MATERIAL_APOIO_PROCESSOS_E_REQUISITOS.md`: BPMN simplificado, entradas, processos, saidas, stakeholders, gargalos, requisitos e resumo vivo.
- `ANALISE_REQUISITOS_ATORES_CASOS_USO.md`: atores, requisitos por ator, diagramas de caso de uso, fluxo de uso, dados gerais e validacoes.
- `DIAGRAMAS_COMPLEMENTARES_ANALISE_TECNICA.md`: SGPD/LGPD, viabilidade, sequencia, atividade, mapeamento, fluxo logico e complementaridade tecnica.
- `PADROES_QUALIDADE_PRIORIZACAO.md`: convencoes, normas internas, metodologia interna de prompt, padroes de interface, pontos fortes, melhorias, ajustes iterativos e priorizacao.
- `TROUBLESHOOTING.md`: diagnosticos e comandos de debug.
- `SEGURANCA_GITHUB.md`: checklist de seguranca antes de publicar ou versionar.

## Referencias recuperadas

- `planoCompletoChefia.md`: plano mestre/diagnostico arquitetural original. Use como contexto historico, nao como fonte unica do estado atual.
- `PLANO_CONTINUACAO.md`: roteiro de fases recuperado. As fases 1 e 2 ja avancaram; confirme sempre com o handoff e o roadmap antes de executar.

## Referencia principal

O README principal do projeto fica em `../README.md`.

## Regra de manutencao

- Atualizar estes arquivos quando o codigo ou o fluxo mudar.
- Evitar criar novos `.md` quando a informacao couber aqui, no README principal, no handoff ou no roadmap.
- Criar novo documento apenas quando houver um proposito claro e nao houver redundancia.
