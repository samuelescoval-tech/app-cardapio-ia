# Roadmap atual - Chef IA Studio

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
- Motor matematico local criado em `src/services/planning/motor.service.js`.

## Proxima fase recomendada

1. Historico local com `localStorage`.
2. Exportacao PDF usando o plano renderizado.
3. Separar apresentacao/pitch do `index.html`.
4. Evoluir motor local para adultos/criancas separados.
5. Migrar SDK Gemini legado para `@google/genai` quando for conveniente.

## Observacao sobre FASE3

`FASE3_COMPLETA.md` e documentos antigos registram o historico da estabilizacao, mas alguns nomes de modelo/SDK ficaram desatualizados em relacao ao estado real. O estado atual valido esta neste arquivo e em `CLEANUP_AUDIT.md`.
