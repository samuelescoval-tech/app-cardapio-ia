# Fotos autorizadas no Karamu

Implementado localmente em 2026-10-04. Ativacao no banco e homologacao real
ainda pendentes; sem publicacao. Nao repete o teste de isolamento ja aprovado.

## Ativar no Supabase

1. Abra o projeto do Karamu no Supabase, entre em **SQL Editor** e crie uma consulta.
2. Copie o conteudo inteiro de `supabase/migrations/007_compartilhamento_fotos.sql`
   para a consulta e execute **Run**. A migracao acrescenta autorizacoes privadas
   por padrao e permite somente ao proprietario altera-las. Nao torna o bucket publico.
3. Volte a `http://localhost:3000/`, atualize e reabra **Meu Perfil → Fotos**.
   Em cada foto com nome, a secao **Compartilhamento** permite escolher os dois usos.

O backend precisa de `SUPABASE_SERVICE_ROLE_KEY`, ja presente no ambiente local.
Para publicar depois, conferir essa variavel no ambiente da Vercel. Nunca copiar
essa chave para o navegador, para commits ou para o formulario de fotos.
Se banco/chave nao estiverem preparados, o app informa indisponibilidade;
cadastro e listagem privados continuam funcionando.

## Como o proprietario autoriza

- **Galeria publica e planejamentos:** permite usar a foto para ilustrar pratos
  de outros usuarios. O nome do prato deve corresponder ao nome do item do plano.
- **Acesso por link:** gera um endereco para enviar a outras pessoas, que poderao
  ver sem entrar na conta. Isso sozinho nao disponibiliza a foto ao gerador.
- As duas opcoes podem ser marcadas juntas. Nenhuma vem marcada num novo envio.
- O credito publico pode ser nome/apelido; vazio usa "Colaborador Karamu".
- **Salvar autorizacao** pede confirmacao antes de disponibilizar. Para revogar,
  desmarque a opcao e salve. Revogar link e reativar gera outro endereco.
- Revogacao impede novos acessos; nao recolhe copias ja baixadas ou PDFs exportados.

Fotos antigas sem nome permanecem na conta. Para compartilhar, envie uma nova
foto identificada. Nao ha edicao de nome de foto antiga neste incremento.

## Validacao deste novo recurso

1. Envie uma foto com nome "Bolo de cenoura" e confira que esta privada por padrao.
2. Autorize somente o link, abra-o em janela anonima e confira foto/credito.
   Revogue o link e atualize a janela: deve indicar indisponibilidade.
3. Autorize somente o uso na galeria. Num planejamento novo cujo cardapio tenha
   o nome "Bolo de cenoura", confira a foto e o credito na galeria de imagens.
   Os nomes sao comparados sem diferenca de acentos/maiusculas; variantes com
   ingredientes diferentes nao sao tratadas como o mesmo prato.
4. Autorize ambos e confira os dois usos. Desmarque ambos/salve e reabra o link
   e a imagem do plano: novos acessos devem ser recusados, com fallback visual.

Ninguem pode autorizar fotos da conta de outra pessoa. Testes locais cobrem
esse contrato com fronteiras ficticias; a politica RLS/migracao precisa ser
conferida no banco real. Compartilhar nao inclui fornecedores, precos, e-mail
ou outros dados do perfil. Nome do prato e credito escolhido ficam visiveis.

## Decisoes tecnicas para o guia final

O bucket permanece privado e a imagem compartilhada passa por rota do backend.
A rota consulta autorizacao em cada acesso e usa `Cache-Control: no-store`.
Isso evita depender de uma URL assinada publica ainda valida apos a revogacao;
a documentacao do Supabase explica que URLs assinadas duram ate expirar:
[arquivos em buckets privados](https://supabase.com/docs/guides/storage/serving/downloads).
A chave privilegiada serve apenas para leitura controlada no backend; edicao
de consentimento usa token do proprietario e
[Row Level Security](https://supabase.com/docs/guides/database/postgres/row-level-security).

Nao existe licencia aberta/CC para essas fotos. O metadado `owner-authorized`
representa autorizacao para esses usos no Karamu. O nome correspondente nao
prova que a foto representa corretamente o prato: a galeria mantem revisao visual.
Catalogo considera ate 200 fotos autorizadas mais recentes; paginacao/busca
para catalogo maior e evolucao futura. Nao ha moderacao automatizada do conteudo.
