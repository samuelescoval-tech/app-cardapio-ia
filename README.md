# Karamu

App para planejar eventos com cardapio, receitas, compras, quantidades,
equipe, operacao e PDF, com contas de usuario (fornecedores e fotos proprias)
e deploy na Vercel. O motor local calcula as partes deterministicas e o
Gemini gera o conteudo editorial pelo backend.

## O que o Karamu faz

- gera um cardapio completo (pratos, bebidas e receitas com ingredientes e
  modo de preparo) a partir do tipo de evento, numero de convidados,
  restricoes alimentares e estilo de servico;
- calcula lista de compras, quantidade de utensilios/equipe e cronograma
  operacional de forma deterministica, sem depender da IA pra matematica;
- exporta um relatorio em PDF pesquisavel, pronto pra salvar ou enviar;
- ilustra os pratos com uma biblioteca visual local, complementada por
  busca no Openverse quando preciso — sempre com identificacao honesta,
  nunca apresentando uma imagem generica como se fosse exata;
- contas de usuario reais (e-mail/senha ou login com Google), onde cada
  usuario cadastra seus proprios fornecedores, fotos de prato e precos
  regionais, que alimentam o gerador com uma estimativa de custo real sem
  a IA inventar valores;
- opcional: usar a propria chave de IA (Gemini) em vez da compartilhada,
  cifrada em repouso antes de gravar no banco.

## Stack

- Frontend: HTML/CSS/JS puro, sem framework, identidade visual propria
  ("Karamu Editorial");
- Backend: Node.js + Express;
- IA: Google Gemini (`@google/generative-ai`);
- Banco, autenticacao e storage de fotos: Supabase (Postgres + Auth +
  Storage), com RLS por usuario em toda tabela de dado pessoal;
- Hospedagem: Vercel;
- PDF: jsPDF.

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
proteger testes locais. SUPABASE_URL, SUPABASE_ANON_KEY e
SUPABASE_SERVICE_ROLE_KEY habilitam login, fornecedores e fotos proprias
(veja .env.example); sem eles, a geracao de cardapio continua funcionando,
so a parte de contas fica desativada. Nunca versionar chaves.

## Validar

Comandos: npm test e git diff --check.

Os testes estao agrupados em seis dominios em test/: planejamento, validacao do
plano, integracoes, visual, benchmarks e armazenamento.

## Limites atuais

- precos reais permanecem A cotar sem catalogo regional rastreavel;
- historico de eventos gerados usa localStorage (por navegador); contas,
  fornecedores e fotos ja sao sincronizados via Supabase (Plano 14);
- referencias Openverse sao transitorias;
- pagamentos permanecem adiados (sem decisao de cobranca ainda).
