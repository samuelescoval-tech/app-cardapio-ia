# Avaliacao da construcao do Karamu

Avaliado em 2026-10-04 a pedido do usuario. Base: codigo local, dependencias,
migracoes, testes, workflow existente e necessidades registradas no roadmap.
Este documento orienta arquitetura; o estado das entregas continua no roadmap
e no handoff. Ajustes abaixo sao recomendacoes, nao implementacoes concluidas.

## Decisao recomendada

Continuar com JavaScript, HTML/CSS, Node.js/Express, Supabase e Vercel.
Ajustar a organizacao gradualmente, mantendo um unico backend com modulos
separados por responsabilidade. Nao ha evidencia nesta avaliacao que justifique
reescrever o projeto em Python, Java, React ou Next.js.

Usar a mesma linguagem no navegador e no servidor ajuda o aprendizado atual.
O backend ja separa IA, planejamento, imagens e personalizacao em servicos;
isso permite melhorar partes pequenas sem reconstruir o produto inteiro.
A logica deterministica de quantidades/custos separada do texto gerado pela
IA e uma base adequada e deve ser preservada.

## O que manter e o que ajustar

| Parte | Evidencia local | Recomendacao |
| --- | --- | --- |
| Linguagem | JS no frontend e backend; validadores de evento/plano existentes | Manter JS. Documentar formatos com JSDoc e verificar tipos gradualmente; TypeScript pode entrar em modulos novos quando trouxer beneficio concreto |
| Frontend | `app.js` tem 1.289 linhas, `render.js` 1.713 e `perfil.js` 647 | Separar sessao, formulario, historico, perfil e exportacao PDF por responsabilidade, preservando fluxos homologados |
| Backend | `server.js` tem 704 linhas e concentra configuracao, rotas e orquestracao; 22 modulos em `src/services/` | Extrair rotas/handlers por dominio; manter regras do negocio nos servicos e middleware comum de autenticacao/erros |
| Validacao | `validate-plan.js` tem 924 linhas; fluxo usa JSON gerado externamente | Separar validacao de formato, normalizacao e regras culinarias quando necessario; manter contrato central e verificacao em tempo de execucao |
| IA | `@google/generative-ai` e uso de `GoogleGenerativeAI` no adaptador | Migrar para `@google/genai` em uma correcao propria, preservando a interface do servico, metadados, BYOK e comportamento de erro |
| Ambiente | `package.json` exige Node 24; terminal padrao esta em Node 22.22.1 | Alinhar ambiente local, automacao e hospedagem ao Node 24; registrar versao no projeto sem alterar o Node global sem necessidade |
| Banco | Migracoes SQL e servicos por token; historico ainda em sessionStorage | Sprint 4 com plano completo versionado, dono, politicas do banco, salvamento confirmado e recuperacao sem nova geracao |
| Testes | 229 testes passam; Chrome exercita fornecedor/fotos; parte dos testes verifica texto do codigo | Manter testes de comportamento; novas regras devem conferir entrada/saida e efeitos reais. Nao depender apenas de regex ou contagem de testes |
| Automacao | Existe `.github/workflows/codeql.yml`, sem workflow dedicado a `npm test` | Acrescentar verificacao automatica de testes em Pull Requests com Node 24 e instalacao reproduzivel; CodeQL e testes exercitam aspectos diferentes |
| Documentacao | Handoff com 3.215 linhas e roadmap com 1.045 antes desta avaliacao | Manter resumo atual curto e separar historico antigo em arquivo de consulta, com links. Evitar relatos antigos reabrindo validacoes concluidas |

Tamanho de arquivo e um sinal de manutencao, nao prova isolada de problema.
Aqui tambem ha mistura de responsabilidades e dependencias por funcoes/estado
globais (`window.chefIA*`) que tornam uma mudanca mais dificil de acompanhar.
Nao renomear tudo nem converter CommonJS e scripts do navegador de uma vez:
extrair uma parte, manter contratos, verificar comportamento e so depois seguir.

## Linguagem e framework

TypeScript ajuda a detectar formas incorretas de dados durante o desenvolvimento.
Se adotado, comecar por contratos de evento/plano e servicos novos; nao exige
trocar Express ou reescrever telas. JSDoc permite descrever esses contratos
enquanto o codigo continua em JavaScript. Tipos nao substituem validacao de
dados recebidos da IA/API nem autorizacao no banco.

React/Vue poderiam ajudar se o produto passar a exigir muitas telas, estados
compartilhados e componentes reutilizaveis. Hoje, a primeira melhoria seria
modularizar o frontend existente. Adotar um framework apenas por popularidade
acrescentaria uma segunda mudanca grande antes de resolver o salvamento.

Tambem nao ha necessidade demonstrada de dividir o backend em microsservicos.
Um unico app organizado em modulos facilita testes, publicacao e aprendizado
neste estagio. Decisoes de escala precisam de medicao de uso, latencia e custo;
esta avaliacao nao fez benchmark de carga nem promete capacidade de usuarios.

## Ordem de trabalho

1. Registrar em commits o trabalho atual, ja validado, preservando a branch.
2. Fazer a manutencao do SDK Gemini e padronizar execucao/testes no Node 24
   em mudancas pequenas e verificaveis. A migracao do SDK nao foi feita hoje.
3. Sprint 4: salvar/listar/carregar/excluir planejamentos da conta. Criar a
   funcionalidade em modulos proprios, sem ampliar ainda mais `server.js`
   e `app.js`. Tratar historico antigo sem atribuicao ou descarte automaticos.
4. Refatorar trechos existentes conforme forem tocados, sem misturar grandes
   mudancas internas com correcoes culinarias, login persistente ou design.
5. Revisar UI/UX usando Figma, ideias anteriores e skills; validar navegacao,
   controles e layout com Playwright, preservando o que o usuario homologou.

Branches por funcionalidade/correcao e revisao por Pull Request ja foram
adotadas. Cada entrega deve explicar a necessidade, a mudanca e a evidencia
de teste. O guia didatico final continua solicitado; esta avaliacao e uma
orientacao inicial, nao substitui o guia baseado no codigo final.

## Ajuste do SDK Gemini

A documentacao oficial da Google informa que as bibliotecas legadas foram
descontinuadas em 30/11/2025 e que o SDK JavaScript antigo nao e mantido
ativamente. Recomenda `@google/genai`. Isso justifica uma migracao de biblioteca;
nao demonstra que o app atual deixou de funcionar ou que a linguagem deve mudar.
Fonte: [Bibliotecas da API Gemini](https://ai.google.dev/gemini-api/docs/libraries).

Criterios da migracao: preservar geracao unica/em blocos, JSON, validacao,
tratamento de resposta incompleta, metadados de consumo, limites e chave propria.
Testar com cliente ficticio e, quando autorizado, uma geracao real controlada.
Nao mudar automaticamente modelo, prompts, cotas ou limites junto com o SDK.

Node 24 segue uma linha LTS conforme o calendario oficial, alem de ser a linha
declarada no projeto. Fonte: [Calendario do Node.js](https://github.com/nodejs/Release).
Para separar endpoints sem trocar o servidor, Express oferece `Router`:
[Rotas no Express](https://expressjs.com/en/guide/routing/).

## Verificacao desta entrega

- 229 testes passaram no Node 24.21.0, sem falhas ou testes ignorados.
- Chrome com API ficticia aprovou cadastro e variedades de produtos, edicao,
  recarga, erros, exclusao preservando produtos e retorno tardio entre contas.
- Fotos: nome obrigatorio, envio/recarga, erros, isolamento, autorizacao
  independente de galeria/link, credito e revogacao aprovados no mesmo teste.
- Layout verificado em 1280, 390 e 320 px. `git diff --check` passou.

Esses testes nao consumiram IA real nem gravaram dados no Supabase. A migracao
007 foi aplicada pelo usuario conforme relato anterior. Esta avaliacao nao e
auditoria completa de seguranca, teste de carga ou verificacao de deploy.
