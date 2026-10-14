# Organizacao e aprendizado — Karamu

Adotado pelo usuario em 2026-10-04 para o trabalho daqui em diante.

## Fluxo de desenvolvimento

1. Definir uma funcionalidade ou correcao com resultado verificavel.
2. Criar uma branch a partir da main atualizada: `feature/nome` para
   funcionalidade ou `fix/nome` para correcao. A sprint organiza entregas;
   uma sprint pode conter mais de uma branch.
3. Implementar e fazer commits com mensagens que expliquem a mudanca.
4. Rodar os testes pertinentes e registrar resultados e limites no handoff.
5. Conferir com o usuario os fluxos que dependem de contas/servicos reais.
6. Enviar a branch ao GitHub e abrir Pull Request para revisar as diferencas.
7. Integrar na main conforme autorizacao de publicacao e conferir o deploy
   da Vercel. A branch remota isolada nao equivale a publicar em producao.

Alteracoes no banco devem informar separadamente quais migracoes precisam
ser aplicadas e como validar. Push de codigo nao confirma aplicacao no Supabase.
Nao reescrever o historico anterior para adotar esse fluxo. Preservar alteracoes
locais existentes. Nao repetir pedidos de autorizacao ja concedida na sessao.

Primeira branch: `feature/fornecedores-produtos`, com o ajuste integrado do
perfil e os registros de homologacao acumulados. Commit local de funcionalidades
e testes criado por autorizacao do usuario em 2026-10-04, com documentacao e
avaliacao tecnica agrupadas separadamente. Atualizacao em 2026-10-14: entrega
integrada pelo PR 1, seguida da Sprint 4 pelo PR 2. Codigo publicado na Vercel;
main local sincronizada. A proxima funcionalidade parte da main atualizada.

## Design e ferramentas

Nas etapas futuras de design/UI/UX usar o Figma e
rever as ideias anteriores, conforme pedido do usuario em 2026-10-04.
Diretrizes em `../AGENTS.md`; conexao em `FIGMA_MCP.md`.

MCPs globais configurados: Figma, Context7, Playwright e Supabase. Context7
teve login concluido com DCR apos erro de redirect_uri no metodo automatico;
guia em `CONTEXT7_MCP.md`. Playwright abriu o Karamu local em Chrome isolado.
Supabase teve OAuth concluido e ficou limitado ao projeto, somente leitura,
com recursos de banco, diagnostico e documentacao. Consultas por essa nova
conexao ainda nao exercitadas em uma nova conversa.

Skills instaladas: `frontend-design` e `web-design-guidelines`, selecionadas
dos ZIPs locais, e `ui-ux-pro-max`, obtida do repositorio original atual e
adaptada ao caminho do Codex. A copia ZIP desta ultima fixava React Native;
o projeto deve continuar usando sua tecnologia real. Validacao das tres
skills e busca local de UX concluidas. Detalhes em `MCP_E_SKILLS.md`.
Reabrir o VS Code/nova conversa para carregar MCPs; skills no proximo turno.

Fontes: [UI UX Pro Max](https://github.com/nextlevelbuilder/ui-ux-pro-max-skill),
[Playwright MCP](https://github.com/microsoft/playwright-mcp),
[Supabase MCP](https://supabase.com/docs/guides/ai-tools/mcp) e
[Context7](https://github.com/upstash/context7).

## Guia solicitado para o final do projeto

Entrega futura, ainda pendente: guia didatico em portugues, baseado no codigo
que realmente estiver no projeto, para um estudante iniciante em backend
que desenvolveu com apoio de IA. Explicar conceitos com exemplos do Karamu,
evitando depender de conhecimento previo ou de copiar comandos sem entende-los.

O guia deve cobrir:

- Como sair de uma necessidade para uma funcionalidade e criterios de teste.
- Estrutura das pastas e responsabilidades de frontend, backend e banco.
- Caminho completo de uma requisicao: formulario, API, validacao, banco e resposta.
- Modelagem de fornecedores e produtos, vinculos e variedades distintas.
- Autenticacao, sessoes, autorizacao e isolamento entre contas.
- Integracao de IA, verificacao do resultado e controle de consumo.
- Git: branch, commit, push, Pull Request, merge e diferenca entre local e remoto.
- Testes, investigacao de erros e limites da verificacao automatizada.
- Ambiente local, variaveis de ambiente, migracoes e deploy Vercel/Supabase.
- Exercicios pequenos para implementar e explicar mudancas com autonomia.

Ate la, as entregas devem explicar brevemente o que mudou, por que e como
foi verificado. Atualizar os registros de decisoes para ajudar a compor o guia
final; nao marcar essa entrega concluida apenas por registrar seu escopo.
