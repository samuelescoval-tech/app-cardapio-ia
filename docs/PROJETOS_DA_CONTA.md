# Projetos da conta — Sprint 4

Implementacao local preparada em 2026-10-07. Em 2026-10-14, usuario esclareceu
que os testes de salvar/retornar, carregar/PDF e isolamento entre contas ja
foram feitos. Validacoes funcionais concluidas por relato; nao repetir. Usuario
acredita ter aplicado a migracao 008; nao exigir reaplicacao por padrao. Estado de commit/integracao/publicacao acompanhado no roadmap e no handoff.

Ao gerar com uma conta, o Karamu guarda uma copia completa do evento e do
planejamento. A interface diferencia "Salvando", "Salvo na conta" e "Pendente".
Somente a confirmacao do servidor permite anunciar o salvamento. Se falhar,
o resultado continua na tela e o botao "Tentar salvar na conta" reutiliza o
mesmo identificador para evitar duplicatas. Salve o PDF antes de sair se
ainda houver pendencias; a copia temporaria nao substitui a gravacao na conta.

Carregar recupera o plano sem chamar a IA ou aplicar precos/quantidades novos.
Dados pessoais sao privados; sair limpa a exibicao e preserva os projetos
salvos. "Limpar Tudo" exclui os projetos da conta apos confirmacao explicita.
Demo continua temporaria. Projetos antigos sem dono no navegador continuam
preservados e nao sao atribuidos, importados ou descartados automaticamente.

## Referencia de aplicacao e validacao no Supabase

Roteiro de referencia, nao uma nova solicitacao de testes. Os testes funcionais
confirmados acima nao devem ser repetidos por causa desta lista. Cenarios de
falha/retry possuem testes locais; nao foram confirmados individualmente pelo
usuario neste esclarecimento.

1. No projeto Supabase usado pelo Karamu, abrir SQL Editor → New query.
2. Copiar o arquivo completo `supabase/migrations/008_projetos.sql` e executar.
3. Conferir a tabela `public.projetos`, RLS habilitada e quatro politicas
   para select/insert/update/delete do proprio usuario. Nenhum acesso anonimo.
4. Com a versao local desta branch, entrar na conta A e gerar um evento.
   Aguardar "Salvo na conta". Sair e entrar novamente: o card deve reaparecer.
5. Carregar: formulario, receitas, compras e cronograma devem corresponder
   ao evento salvo. Exportar PDF; carregar/exportar nao deve gerar nova IA.
6. Em outro navegador ou dispositivo, entrar na mesma conta A e recuperar
   o projeto. Isso verifica a gravacao real, independente do cache da aba.
7. Na conta B, esse projeto nao deve aparecer. Criar um projeto B e conferir
   que cada conta conserva apenas os seus. Exclusao em B nao pode remover A.
8. Testar falha de conexao durante salvamento: manter resultado, mostrar
   pendente, reconectar e usar retry. O card deve virar salvo sem duplicar.

Esta rodada trata somente projetos; nao exige refazer a homologacao anterior
de fornecedores/produtos/fotos. Aplicar SQL e publicar codigo sao passos
distintos. Sem migracao, uma falha deve aparecer como indisponibilidade e
nao como sucesso. Publicacao remota depende da autorizacao correspondente.

## Contrato e organizacao

- `PUT /api/projetos/:id`: UUID gerado uma vez pelo cliente, corpo com
  `{ versao: 1, evento, plano }`. Dono vem da sessao validada, nunca do corpo.
- `GET /api/projetos?offset=0&limit=20`: pagina de resumos, sem carregar todos
  os planos; ordem por data e UUID. Mostrar mais continua; Atualizar reinicia.
- `GET /api/projetos/:id`: snapshot completo desta conta.
- `DELETE /api/projetos/:id` ou `/api/projetos`: exclusao individual ou total
  desta conta. Falhas nao apagam os cards como se a exclusao tivesse ocorrido.

API no-store; validacao de evento, versao/conteudo/tamanho; parser de ate 1 MiB
restrito ao salvamento. Banco tambem limita tamanho. Referencias visuais
transitorias ficam de fora; receitas, custos, compras e operacao permanecem.
Atualizacoes concorrentes da lista nao formam um snapshot transacional;
Atualizar reinicia a consulta. Cada nova geracao recebe UUID proprio.

Router trata HTTP/autenticacao, servico trata snapshot e banco, e modulo do
navegador trata sincronizacao. Essa separacao permite construir a funcionalidade
na linguagem atual sem concentrar mais logica no arquivo principal.

Fontes consultadas: [upsert](https://supabase.com/docs/reference/javascript/upsert)
e [RLS](https://supabase.com/docs/guides/database/postgres/row-level-security).

## Testes locais reproduziveis

Suite habitual: `npm test` no Node 24. Novos cenarios em `test/projetos.test.js`.
Politicas SQL podem ser verificadas em PostgreSQL WASM descartavel, sem
conectar ao Supabase. Chrome usa API ficticia e exportacao real de PDF.
Auxiliares opcionais ficam fora das dependencias do produto:

```sh
npm install --prefix /tmp/karamu-db-test --no-package-lock --ignore-scripts @electric-sql/pglite@0.5.8 jspdf@2.5.1
KARAMU_TEST_PG_DIR=/tmp/karamu-db-test node scripts/validate-projetos-rls.js
KARAMU_TEST_PG_DIR=/tmp/karamu-db-test node scripts/validate-projects-ui.js
```

Chrome deve estar disponivel como `google-chrome`; executar com Node 24.
O banco local usa usuarios ficticios e funcao auth.uid equivalente para
testar permissoes reais do PostgreSQL. Isso nao confirma configuracao de Auth,
PostgREST, politicas adicionais ou migracao no projeto Supabase real.
