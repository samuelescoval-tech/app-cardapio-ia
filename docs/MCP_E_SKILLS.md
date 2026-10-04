# MCPs e skills do Karamu

Configurados em 2026-10-04, a pedido do usuario, no Codex global deste
computador. MCP conecta ferramentas; skill orienta como executar uma tarefa.
As conexoes globais tambem podem aparecer em outros projetos abertos no Codex.

## Conexoes

| Nome | Finalidade | Estado verificado |
| --- | --- | --- |
| `figma-ux` | Consultar e trabalhar com designs Figma | Configurado, OAuth concluido; guia `FIGMA_MCP.md` |
| `context7` | Consultar documentacao de bibliotecas | Configurado, OAuth concluido; guia `CONTEXT7_MCP.md` |
| `playwright` | Abrir navegador e verificar fluxos, controles e layout | Conexao MCP e abertura do Karamu local verificadas |
| `supabase` | Consultar estrutura do banco, diagnosticos e documentacao | Configurado, OAuth concluido, limitado ao projeto e somente leitura |

Playwright usa Chrome sem janela (`headless`) e perfil temporario isolado.
Arquivos temporarios ficam em `/tmp/karamu-playwright-mcp`.
Nao reutiliza automaticamente a conta pessoal aberta no navegador. O teste
de conexao inicializou o servidor, listou 25 ferramentas, abriu
`http://localhost:3000/` com titulo "Karamu — Planejador de Eventos com IA"
e fechou o navegador. Nao repetiu a homologacao nem gravou dados de teste.

Supabase aponta para o projeto `wcjncervehoxbtfgovab`, com
`read_only=true` e recursos `database,debugging,docs`. Este MCP nao foi
configurado para aplicar migracoes ou editar registros. Login/configuracao
confirmados; consultas pelas ferramentas desta conexao em uma nova conversa
ainda precisam ser exercitadas. A consulta anterior que confirmou a migracao
007 foi independente desta instalacao.

## Como conferir e carregar

Feche e reabra o VS Code e inicie uma nova conversa do Codex para carregar os
novos MCPs. As skills instaladas ficam disponiveis no proximo turno.
Para conferir o cadastro no terminal:

```bash
codex mcp list
```

`OAuth` significa que o login foi configurado. Playwright pode aparecer com
`Auth: Unsupported`: o servidor local nao oferece login OAuth; isso nao e
falha de instalacao. A abertura real do navegador foi verificada.

Comandos usados para os dois novos MCPs (nao precisa executar novamente):

```bash
codex mcp add playwright -- npx -y @playwright/mcp@0.0.83 --browser chrome --headless --isolated --output-dir /tmp/karamu-playwright-mcp
codex mcp add supabase --url 'https://mcp.supabase.com/mcp?project_ref=wcjncervehoxbtfgovab&read_only=true&features=database,debugging,docs'
codex mcp login supabase
```

A versao do pacote Playwright MCP foi fixada para tornar a configuracao
reproduzivel. Credenciais OAuth ficam no armazenamento do Codex e nao foram
copiadas para o repositorio. Nao e necessario compartilhar tokens no chat.

## Skills instaladas

Local: `/home/samu-alba/.codex/skills/`.

| Skill | Uso | Origem |
| --- | --- | --- |
| `frontend-design` | Criar e melhorar telas mantendo uma identidade visual coerente | ZIP `Anthropic-Frontend-Designskills-main.zip`, pasta `skills-main/skills/frontend-design/` |
| `web-design-guidelines` | Revisar interface, acessibilidade e comportamento de controles | ZIP `agent-skills-main.zip`, pasta `agent-skills-main/skills/web-design-guidelines/` |
| `ui-ux-pro-max` | Pesquisar orientacoes de UX, cores, fontes, layout e interacao | Repositorio original `nextlevelbuilder/ui-ux-pro-max-skill`, pasta `.claude/skills/ui-ux-pro-max/` |

As tres passaram pelo validador de skills. A UI UX Pro Max foi testada com
uma busca de foco de teclado em modal; retornou orientacao pertinente.
Somente seus caminhos de comandos foram adaptados para `python3` e a pasta
global do Codex; scripts e dados originais foram preservados.

A copia local da UI UX Pro Max no ZIP continha orientacoes fixadas em React
Native. Foi usada a versao original atual, que identifica a tecnologia do
projeto antes de recomendar regras. Para o Karamu, preservar HTML/CSS/JS
existentes; nao assumir React, Tailwind ou aplicativo nativo.

ZIPs originais permaneceram intactos. Nao foram instaladas copias duplicadas
nem skills especificas de React/Next.js/React Native, que nao correspondem
ao frontend atual. Selecionar skills conforme a tarefa, sem carregar todas
as orientacoes em cada etapa ou tratar sugestoes visuais como aprovacao.

Nas proximas etapas de design, combinar Figma e as skills pertinentes,
consultar as ideias antigas em `../AGENTS.md` e verificar os controles e
layout com Playwright. Usar Supabase para diagnosticar o banco quando preciso.

Fontes: [Playwright MCP](https://github.com/microsoft/playwright-mcp),
[Supabase MCP](https://supabase.com/docs/guides/ai-tools/mcp),
[UI UX Pro Max](https://github.com/nextlevelbuilder/ui-ux-pro-max-skill).
