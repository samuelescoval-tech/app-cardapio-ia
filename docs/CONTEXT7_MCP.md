# Context7 MCP no Codex

Servidor global `context7` cadastrado em 2026-10-04, com endpoint OAuth
`https://mcp.context7.com/mcp/oauth`. Login OAuth concluido com sucesso via
registro dinamico de cliente (DCR).

## Configuracao e login

```sh
codex mcp add context7 --url https://mcp.context7.com/mcp/oauth
```

O cadastro inicia o fluxo OAuth. Entre ou crie sua conta no navegador e
autorize a conexao; aguarde `Successfully logged in.` no terminal.
Se precisar iniciar o login novamente:

```sh
codex mcp login context7 --oauth-client-registration dcr
```

Confira com `codex mcp list`. `Not logged in` indica que a autenticacao
ainda nao terminou. Apos concluir, salve os arquivos, reabra o VS Code e
inicie uma nova conversa do Codex para carregar a conexao global.

Neste ambiente, a primeira tentativa automatica (CIMD) falhou com
`invalid_grant`, indicando diferenca no `redirect_uri`. Repetir o login com
`--oauth-client-registration dcr` concluiu a autenticacao sem chave manual.

O endpoint `/mcp/oauth` usa login pelo navegador. Nao e preciso copiar uma
chave de API para o projeto nesse fluxo. O endpoint `/mcp` e outra opcao,
com autenticacao por chave ou acesso anonimo limitado.

## Uso no Karamu

Context7 consulta documentacao e exemplos de bibliotecas. Ao implementar
integracoes, informar a biblioteca e a versao usada no `package.json` ou
lockfile. Exemplo: "Use Context7 para consultar a documentacao do Supabase
JS correspondente a versao instalada antes de alterar o upload de fotos".
Nao e uma ferramenta de desenho; Figma continua destinado ao design/UI/UX.

Fonte: [configuracao oficial do Context7](https://context7.com/docs/resources/all-clients).
