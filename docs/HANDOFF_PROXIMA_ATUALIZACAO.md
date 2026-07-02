# Handoff - Proxima Atualizacao do Chef IA Studio

Este documento resume o estado real do projeto para continuar a proxima rodada sem perder contexto.

## Estado atual em uma frase

O app ja gera planejamento de evento com Gemini via backend, usa um motor matematico local para quantidades/custos e renderiza um resultado rico; a proxima fase deve melhorar historico, PDF, interface e detalhamento operacional.

## O que foi modificado

- Conexao com Gemini estabilizada no backend usando `GEMINI_API_KEY` ou `GOOGLE_API_KEY`.
- Modelo configuravel por `.env` com `GEMINI_MODEL`.
- `server.js` passou a aceitar dados estruturados do evento em `/gerar-cardapio`.
- Prompt saiu do frontend e foi para `src/prompts/event.prompt.js`.
- Criado motor local em `src/services/planning/motor.service.js` para calcular alimentos, bebidas, equipe, espaco, custo e utensilios.
- Resultado da IA recebe reforco do motor local antes de ir para o frontend.
- `public/js/app.js` ficou focado em formulario, navegacao e chamada ao backend.
- `public/js/render.js` ficou responsavel pela montagem visual do planejamento.
- `public/js/utils.js` ficou com helpers, normalizadores e calculos fallback.
- `public/js/prompt.js` foi removido porque nao e mais necessario.
- `public/css/style.css` virou entrypoint de modulos CSS.
- CSS foi separado em `public/css/modules/`.
- Documentos de plano e historico foram movidos para `docs/`.
- Arquivos duplicados/temporarios removidos: `server.log` e `package.json/package-lock.json` do snapshot legado.

## Arquitetura atual

Fluxo principal:

1. Usuario preenche o formulario em `public/index.html`.
2. `public/js/app.js` monta o objeto `evento`.
3. O frontend envia `POST /gerar-cardapio`.
4. `server.js` calcula o motor local com `calcularMotorEvento(evento)`.
5. `src/prompts/event.prompt.js` monta o prompt completo para Gemini.
6. `src/services/ai/gemini.service.js` chama o modelo.
7. `src/utils/extract-json.js` e `src/utils/validate-plan.js` tratam e validam o JSON.
8. `aplicarMotorAoPlano()` injeta dados calculados no plano.
9. `public/js/render.js` exibe o planejamento completo.

## Arquivos principais

- `server.js`: rotas Express, status da API e endpoint de geracao.
- `src/services/ai/gemini.service.js`: integracao com Gemini.
- `src/services/planning/motor.service.js`: calculos locais do evento.
- `src/prompts/event.prompt.js`: prompt de planejamento.
- `src/utils/extract-json.js`: extracao robusta de JSON da resposta da IA.
- `src/utils/validate-plan.js`: validacao/normalizacao do plano.
- `public/index.html`: formulario, pitch e estrutura visual da pagina.
- `public/js/app.js`: bootstrap, formulario, navegacao e fetch.
- `public/js/render.js`: renderizacao do resultado.
- `public/js/utils.js`: helpers compartilhados do frontend.
- `public/css/style.css`: imports dos modulos CSS.
- `public/css/modules/`: estilos separados por responsabilidade.
- `docs/ROADMAP_ATUAL.md`: estado real do plano depois da limpeza.
- `CLEANUP_AUDIT.md`: auditoria de arquivos removidos, quebrados e mantidos.

## Validacoes ja feitas

- Checagem de sintaxe em arquivos JS principais com `node --check`.
- Teste local do motor de planejamento para evento premium com 80 pessoas.
- Teste real anterior confirmou resposta do Gemini com `gemini-flash-lite-latest`.

Ainda falta validar depois da proxima rodada:

- Fluxo completo no navegador apos qualquer alteracao visual.
- Chamada real ao Gemini apos mudancas no prompt ou contrato JSON.
- Responsividade em desktop e mobile.
- Exportacao PDF quando for implementada.

## Proxima atualizacao recomendada

1. Implementar historico local com `localStorage`.
   - Salvar evento + plano gerado.
   - Listar planejamentos recentes.
   - Permitir carregar, excluir e criar novo a partir de um historico.

2. Implementar exportacao PDF.
   - Usar o plano renderizado como base.
   - Priorizar resumo executivo, lista de compras, cronograma, equipe e orcamento.
   - Evitar depender de captura visual frágil; gerar conteudo organizado.

3. Separar a apresentacao/pitch do `index.html`.
   - Mover para `public/pitch.html` ou `public/js/pitch.js`.
   - Deixar `index.html` mais curto e focado no app.

4. Evoluir o motor local.
   - Separar adultos e criancas nos calculos.
   - Detalhar talheres, copos, guardanapos, bandejas, rechauds, gelo e descartaveis.
   - Ajustar multiplicadores por tipo de refeicao, duracao, estilo e alcool.

5. Refinar a interface.
   - Melhorar densidade do resultado para leitura rapida.
   - Criar secoes recolhiveis mais claras.
   - Melhorar estados de carregamento, erro e plano vazio.
   - Destacar numeros operacionais: equipe, talheres, utensilios, bebidas, custo e margem.

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
- `docs/FASE3_COMPLETA.md`, `docs/STATUS.md` e `docs/PROXIMOS_PASSOS.md` sao historicos; o estado mais atual esta em `docs/ROADMAP_ATUAL.md`, `CLEANUP_AUDIT.md` e neste handoff.
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
