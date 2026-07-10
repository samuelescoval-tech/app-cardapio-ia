# Docs - Chef IA Studio

<!-- CODEX:LER_SEMPRE
Ler este indice quando houver duvida sobre qual documento consultar. Ele define fontes vivas e referencias historicas.
-->

<!-- CODEX:MANTER_EM_LINHA
Quando criar, remover ou recuperar documento em docs/, atualizar este indice e, se for relevante, CLEANUP_AUDIT.md.
-->

Documentacao enxuta do projeto. A ideia e manter poucos arquivos vivos, sem duplicar guias antigos ou fases ja concluidas.

## Mapa/GPS operacional

Comece sempre por este Mapa/GPS antes de alterar codigo, fluxo, prompt, UI, PDF ou documentacao. Ele define onde procurar cada tipo de informacao e qual fonte tem prioridade.

Ordem de consulta:

1. `docs/README.md`: Mapa/GPS do projeto, documentos ativos, referencias historicas e regra de manutencao.
2. `docs/HANDOFF_PROXIMA_ATUALIZACAO.md`: estado real mais recente, registro de testes/validacoes, pendencias e proxima atualizacao curta.
3. `docs/ROADMAP_ATUAL.md`: prioridades atuais e o que nao deve ser aberto agora.
4. `docs/MATERIAL_APOIO_PROCESSOS_E_REQUISITOS.md`: processo maior, entradas, saidas, gargalos, requisitos, Unidades internas e decisoes como agentes IA.
5. Documento especifico do processo:
   - Fluxo ou sequencia: `docs/FLUXOS_DE_PROCESSO.md`.
   - Ator, requisito, caso de uso ou validacao: `docs/ANALISE_REQUISITOS_ATORES_CASOS_USO.md`.
   - Qualidade, UI, priorizacao ou criterio de decisao: `docs/PADROES_QUALIDADE_PRIORIZACAO.md`.
   - Diagrama, viabilidade, complementaridade tecnica ou SGPD/LGPD: `docs/DIAGRAMAS_COMPLEMENTARES_ANALISE_TECNICA.md`.
   - Erro ou debug: `docs/TROUBLESHOOTING.md`.
   - Publicacao, segredo ou GitHub: `docs/SEGURANCA_GITHUB.md`.
6. Codigo-fonte correspondente, depois dos docs vivos.

Fontes historicas como `planoCompletoChefia.md` e `PLANO_CONTINUACAO.md` ajudam como contexto, mas nao vencem README, handoff, roadmap e material vivo quando houver conflito.

Antes de repetir testes, consulte o Registro de testes e validacoes em `docs/HANDOFF_PROXIMA_ATUALIZACAO.md`. So repetir quando o codigo relacionado mudou, o ambiente mudou, o registro estiver desatualizado, ou o usuario pedir explicitamente.

## Janela de Previa de continuidade

Pela Arquitetura Residencial de Prompts, Janela de Previa nao e a entrega final. Ela e uma pre-execucao: mostra entendimento, estrutura proposta, lacunas, riscos, redundancias, decisoes pendentes e plano de entrega antes de consolidar no Telhado.

Use esta janela para enxergar o proximo movimento do projeto antes de executar. Ela ajuda a decidir se devemos avancar, pausar, simplificar, corrigir ou reformar alguma parte.

| Horizonte | Onde olhar | Proximo movimento | Cuidado |
|---|---|---|---|
| Agora | `docs/HANDOFF_PROXIMA_ATUALIZACAO.md`, Registro de testes e validacoes | Registrar evidencias manuais ja feitas: modal, geracao real, historico e PDF | Nao repetir testes ja registrados sem mudanca relacionada. |
| Curto prazo | `docs/ROADMAP_ATUAL.md` | Preparar demo controlada com `DEMO_ACCESS_KEY` e link temporario, se nao houver falha aberta | Nao abrir login, banco, pagamento ou SaaS. |
| Se aparecer falha | `docs/FLUXOS_DE_PROCESSO.md` e `docs/ANALISE_REQUISITOS_ATORES_CASOS_USO.md` | Corrigir somente o fluxo afetado e testar apenas o caminho alterado | Registrar o novo teste no handoff. |
| Proxima melhoria | `docs/PADROES_QUALIDADE_PRIORIZACAO.md` | Melhorar validacao de entrada, feedback de erro e responsividade do resultado | Evitar dependencia nova sem necessidade. |
| Futuro | `docs/MATERIAL_APOIO_PROCESSOS_E_REQUISITOS.md` | Reavaliar motor adultos/criancas, fornecedores, pesquisa externa ou agentes IA | So criar agente quando houver entrada, saida, gatilho e validacao proprios. |

Decisao rapida: se o entendimento esta claro, nao ha falha aberta e os testes manuais ja foram registrados, abrir a Porta de Passagem para demo controlada. Se ha lacuna ou risco, corrigir a menor parte afetada antes do Telhado. Se a ideia for nova funcionalidade, conferir primeiro se ela pertence ao curto prazo ou ao backlog.

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
