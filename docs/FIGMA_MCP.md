# Figma MCP no Codex

Configuracao global corrigida e login OAuth concluido em 2026-10-04
(`Successfully logged in.`). Nome cadastrado: `figma-ux`.
Endereco: `https://mcp.figma.com/mcp`.

`https://figma.com` e o site do Figma, nao o endpoint MCP. Por isso o login
anterior falhava na descoberta OAuth. `mcp` nao e um comando instalado neste
ambiente: a administracao da conexao e feita por `codex mcp`.

## Concluir ou repetir o login

1. No terminal, execute `codex mcp login figma-ux`.
2. Abra o endereco de autorizacao mostrado, entre na conta Figma e permita
   o acesso. Aguarde a confirmacao de sucesso no terminal.
3. Confira o cadastro com `codex mcp list`. A lista confirma a configuracao;
   so a conclusao do login e o uso de uma ferramenta comprovam acesso.
4. Reabra o VS Code e inicie uma nova conversa do Codex para carregar a
   conexao atualizada. Salve arquivos antes de fechar o editor.

O Codex CLI e a extensao compartilham a configuracao global em
`~/.codex/config.toml`. Nao e preciso colocar token pessoal no repositorio
ou no `.env` do Karamu para esse fluxo OAuth.

Para cadastrar novamente, se necessario:

```sh
codex mcp add figma-ux --url https://mcp.figma.com/mcp
```

## Uso no projeto

A conexao permite trazer contexto do Figma para a implementacao. Nas etapas
de design, trabalhar uma tela ou fluxo por vez: objetivo e problemas atuais,
proposta visual, revisao e implementacao com verificacao em desktop e celular.
Para ler um design existente, fornecer o link do frame ou camada e confirmar
que a conta autenticada tem acesso. Exemplo: "Use o Figma para revisar o
layout do perfil e alinhar os campos, preservando fornecedores e produtos".

Fontes: [instalacao oficial do Figma](https://developers.figma.com/docs/figma-mcp-server/remote-server-installation/)
e [configuracao MCP do Codex](https://developers.openai.com/codex/mcp/).
