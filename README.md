# Chef IA Studio

MVP local para planejar eventos com cardapio, receitas, compras, quantidades,
equipe, operacao e PDF. O motor local calcula as partes deterministicas e o
Gemini gera o conteudo editorial pelo backend.

## Documentacao viva

O projeto possui apenas duas fontes de estado:

- Handoff: docs/HANDOFF_PROXIMA_ATUALIZACAO.md
- Roadmap: docs/ROADMAP_ATUAL.md

O README e somente a porta de entrada. Nao registrar progresso aqui.

## Executar

Comandos: npm install e npm start.

Acesse http://localhost:3000. O status tecnico fica em
http://localhost:3000/api/status.

O arquivo .env deve conter GEMINI_API_KEY e pode usar DEMO_ACCESS_KEY para
proteger testes locais. Nunca versionar chaves.

## Validar

Comandos: npm test e git diff --check.

Os testes estao agrupados em seis dominios em test/: planejamento, validacao do
plano, integracoes, visual, benchmarks e armazenamento.

## Limites atuais

- precos reais permanecem A cotar sem catalogo regional rastreavel;
- historico usa localStorage, sem conta ou sincronizacao;
- referencias Openverse sao transitorias;
- login, banco, pagamentos, deploy e SaaS exigem decisao separada.
