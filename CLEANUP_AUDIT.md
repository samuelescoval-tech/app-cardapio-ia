# Auditoria de limpeza - Chef IA Studio

## Estado atual

O projeto principal esta em `app-cardapio-ia/` e a versao antiga esta em `legacy/simple-current/`.

Arquivos que mais pesavam manutencao antes desta limpeza:

- `public/js/app.js`: tinha 652 linhas misturando estado, prompt, renderizacao e helpers.
- `public/css/style.css`: tinha 1633 linhas; agora e apenas o entrypoint dos modulos CSS.
- `public/index.html`: tem 450 linhas, aceitavel por enquanto, mas deve perder os slides de pitch quando a apresentacao virar arquivo proprio.

## O que foi quebrado agora

- `public/js/app.js`: ficou como entrada principal, navegacao e chamada ao backend.
- `public/js/render.js`: renderizacao do resultado completo.
- `public/js/utils.js`: helpers, escape de HTML e calculos fallback.

## Removido nesta limpeza

- `app-cardapio-ia/server.log`: arquivo de execucao local.
- `legacy/simple-current/package.json`: o legado permanece como referencia visual/codigo, nao como app executavel separado.
- `legacy/simple-current/package-lock.json`: lock antigo do snapshot legado.

## Movido para `app-cardapio-ia/docs/`

- `TROUBLESHOOTING.md`
- `HANDOFF_PROXIMA_ATUALIZACAO.md`
- `ROADMAP_ATUAL.md`
- `SEGURANCA_GITHUB.md`

## Documentacao redundante removida depois

Em 2026-07-02, `docs/` foi reduzido para evitar arquivos com a mesma funcao ou informacao antiga.

Removidos:

- Guias de fase ja executada: `FASE1_COMPLETA.md`, `FASE2_QUICKSTART.md`, `FASE3_COMPLETA.md`, `QUICK_START_FASE1.md`.
- Resumos e indices redundantes: `RESUMO_2MIN.md`, `RESUMO_SESSAO_FINAL.md`, `README_CONTINUACAO.md`, `VISAO_GERAL.md`, `STATUS.md`.
- Checklists/roteiros antigos: `CHECKLIST_PROXIMO_PASSO.md`, `PROXIMOS_PASSOS.md`, `RECOMENDACAO_GITHUB.md`.
- Pesquisas/planos longos desatualizados: `deep-research-report.md`.

Recuperados como referencia historica depois da limpeza:

- `PLANO_CONTINUACAO.md`: roteiro de fases original.
- `planoCompletoChefia.md`: plano mestre/diagnostico arquitetural original.

Documentos ativos em `docs/`:

- `README.md`
- `HANDOFF_PROXIMA_ATUALIZACAO.md`
- `ROADMAP_ATUAL.md`
- `FLUXOS_DE_PROCESSO.md`
- `MATERIAL_APOIO_PROCESSOS_E_REQUISITOS.md`
- `ANALISE_REQUISITOS_ATORES_CASOS_USO.md`
- `DIAGRAMAS_COMPLEMENTARES_ANALISE_TECNICA.md`
- `PADROES_QUALIDADE_PRIORIZACAO.md`
- `TROUBLESHOOTING.md`
- `SEGURANCA_GITHUB.md`

Referencias recuperadas em `docs/`:

- `PLANO_CONTINUACAO.md`
- `planoCompletoChefia.md`

## Limpeza estrutural aplicada

- Removido bloco `:root` duplicado em `public/css/style.css`.
- Atualizado `package.json` principal: `"main"` agora aponta para `server.js`.
- Removido `public/js/prompt.js`: prompt passou para o backend.
- Criado `src/prompts/event.prompt.js`: contrato do prompt com motor local.
- Criado `src/services/planning/motor.service.js`: calculos operacionais locais.

## Manter por enquanto

- `legacy/simple-current/index.html`, `style.css`, `script.js`, `server.js`: ainda servem como snapshot da versao simples.
- `package-lock.json` principal: manter para reproducibilidade.
- `.env.example`: manter como referencia de configuracao.

## Proxima quebra recomendada

1. Mover a apresentacao para `public/pitch.html` ou `public/js/pitch.js`.
2. Refinar exportacao PDF depois de teste visual no navegador.
3. Evoluir motor local para adultos/criancas e validacao de entrada.
4. So depois remover o legado que nao for mais util.

## CSS quebrado em modulos

- `public/css/style.css`: entrypoint com imports.
- `public/css/modules/base.css`: variaveis, reset e utilitarios.
- `public/css/modules/layout.css`: navegacao, hero e container principal.
- `public/css/modules/form.css`: formulario, chat, botao e componentes antigos do app.
- `public/css/modules/pitch.css`: apresentacao comercial.
- `public/css/modules/result.css`: planejamento completo, dashboard, compras, cronograma, orcamento e servico de mesa.

## Tags usadas no codigo

- `TAG: bootstrap`
- `TAG: navegacao`
- `TAG: prompt-backend`
- `TAG: ui-render`
- `TAG: helpers`
- `TAG: calculos-fallback`
- `TAG: resultado`
- `TAG: formulario`
