# Padroes de Qualidade, Interface e Priorizacao - Chef IA Studio

<!-- CODEX:LER_POR_PROCESSO
Ler o mapa de leitura, os principios de qualidade, os padroes de interface e a priorizacao antes de decidir ajuste visual, melhoria de fluxo ou refinamento de produto.
-->

<!-- CODEX:LER_POR_PROCESSO
Antes de mexer em UI, resultado, PDF, modal de acesso demo, validacao, feedback ou organizacao visual, conferir as secoes correspondentes neste documento.
Depois da mudanca, atualizar pontos fortes, oportunidades, ajustes iterativos e prioridade se o criterio mudar.
-->

<!-- CODEX:MANTER_EM_LINHA
Atualizar somente o padrao ou criterio alterado. Atualizar requisitos apenas se surgir novo criterio de aceite.
Registrar no handoff se a mudanca afetar estado ou proximo passo.
-->

<!-- CODEX:MAPA_LEITURA
Atualizar as faixas abaixo quando o documento crescer ou mudar ordem.
-->

Documento vivo para padronizar convencoes, normas internas, coerencia visual, pontos fortes, oportunidades de melhoria, ajustes iterativos e priorizacao do Chef IA Studio.

Ultima atualizacao: 2026-07-09

## Mapa de leitura rapida

| Necessidade | Ler linhas |
|---|---|
| Retomada rapida deste documento | 1-56 |
| Padroes de convencoes e normas internas | 57-89 |
| Padroes de interface e coerencia | 91-123 |
| Pontos fortes atuais | 125-138 |
| Validacao e feedback | 140-158 |
| Oportunidades de melhoria | 160-173 |
| Ajustes iterativos | 175-194 |
| Priorizacao de ajustes e coerencia documental | 196-245 |

## Principios de qualidade

- Preservar o que ja funciona antes de melhorar.
- Comecar pelo Mapa/GPS operacional em `docs/README.md`.
- Resolver o gargalo atual com a menor mudanca testavel.
- Evitar tecnologia nova se o problema pode ser resolvido com HTML, CSS, JS, Express e docs.
- Manter motor local como fonte de numeros operacionais.
- Distinguir `Cronograma operacional` deterministico de `Roteiro do Evento` editorial; producao, transporte, equipe e equipamentos nao devem aparecer como se fossem momentos dos convidados.
- Manter Gemini como apoio criativo e estruturado, nao como unica fonte de calculo.
- Usar a Arquitetura Residencial de Prompts como referencia interna e proporcional; no runtime, preferir rotulos operacionais claros e nao expor a metafora.
- Proteger `.env`, chave Gemini e acesso demo.
- Atualizar documentacao viva quando uma decisao mudar fluxo, requisito, prioridade ou comportamento.
- Consultar o Registro de testes e validacoes antes de repetir qualquer teste manual ou automatizado.
- Registrar evidencia no handoff quando um teste for feito, especialmente modal, geracao, status, PDF e responsividade.

## Padroes de convencoes e normas internas

### Documentacao

- Documento novo vivo deve nascer com marcadores `CODEX:` no topo.
- Documento novo vivo deve ser registrado em `docs/README.md`.
- Antes de decidir arquivo ou prioridade, consultar o Mapa/GPS operacional em `docs/README.md`.
- Se afetar retomada, tambem atualizar `HANDOFF_PROXIMA_ATUALIZACAO.md`.
- Se afetar prioridade, tambem atualizar `ROADMAP_ATUAL.md`.
- Se alterar inventario de docs ativos, atualizar `CLEANUP_AUDIT.md`.
- Usar linguagem objetiva, com estado real e sem prometer SaaS antes da hora.
- Preferir poucos documentos vivos bem conectados a muitos documentos repetidos.

### Codigo

- Preservar estrutura atual: `public/`, `src/`, `server.js`, `docs/`.
- Nao mover prompt principal para o frontend.
- Nao chamar provedor de IA diretamente no navegador.
- Nao remover motor local.
- Nao transformar a metodologia de prompt em saida visivel para o usuario; ela deve organizar o raciocinio e o contrato.
- Nao aceitar prompt arbitrario vindo do frontend; a rota recebe somente evento validado.
- Nao pedir `motor_logistica` ao Gemini; o backend aplica a fonte oficial depois da validacao.
- Nao criar agentes IA autonomos enquanto uma Unidade interna simples resolver o problema.
- Manter ordem dos scripts no HTML: storage, utils, render, app.
- Evitar dependencia nova sem justificativa clara.
- Nao commitar `.env`.

### Nomes e contratos

- Campos atuais do formulario: `tipo`, `pessoas`, `duracao`, `refeicao`, `restricoes`, `tema`, `orcamentoBase`, `alcool`, `estilo`, `userChat`.
- Resposta backend esperada: `{ ok, provider, plano, meta }`.
- Metadados importantes: `tempo_ms`, `schema_ok`, `motor_local`, `prompt_backend`.
- Marcadores de requisitos: `RF-`, `RNF-`, `UC-`, `VAL-`, `AT-`.
- O prompt backend traduz a metodologia para: Papel, Objetivo, Fontes Confiaveis, Dados do Evento, Dados Operacionais, Restricoes, Contrato e Criterios de Conclusao.
- Unidades internas atuais: motor local, prompt backend, validador JSON, render, historico, acesso demo e PDF.

## Padroes de interface e coerencia

### Experiencia geral

- A primeira tela deve ser o app utilizavel, nao uma landing page.
- O usuario precisa entender rapidamente: preencher, gerar, revisar e baixar.
- Estados de carregamento devem explicar o que esta acontecendo.
- Erros precisam dizer a acao correta, nao apenas "erro no servidor".
- A interface deve evitar sobrepor texto, botoes ou cards em desktop e mobile.
- A navegacao deve ser clara, especialmente entre app e apresentacao.

### Resultado gerado

- Destacar numeros operacionais: pessoas, duracao, custo, equipe, bebidas, utensilios e estimativa.
- Organizar secoes para leitura rapida.
- Usar "Nao informado" quando dado estiver vazio, sem esconder secao essencial.
- Evitar blocos longos sem hierarquia.
- Manter resumo, compras, cronograma, equipe e orcamento sempre faceis de achar.

### PDF

- PDF deve funcionar como entrega compartilhavel.
- Cabecalho, resumo e rodape devem manter identidade do app.
- Quebras de pagina precisam preservar legibilidade.
- Secoes principais nao devem desaparecer quando um bloco vier vazio.
- Antes de teste externo, confirmar no handoff se o PDF real ja foi revisado e registrar evidencia se ainda faltar.

### Acesso demo

- Evitar `prompt()` como experiencia final de teste.
- Usar modal ou tela curta com campo de senha, erro claro e tentativa novamente.
- Senha invalida deve limpar `sessionStorage` e permitir nova tentativa.
- Nao exibir valor da senha na tela, logs ou docs.

## Pontos fortes atuais

| Ponto forte | Por que importa |
|---|---|
| Backend Express funcionando | Permite proteger chave e prompt. |
| Gemini isolado no backend | Evita exposicao de API key no navegador. |
| Motor local implementado | Da confianca aos numeros operacionais. |
| Prompt backend operacional e proporcional | Organiza contexto, limites, fontes e contrato sem expor nem repetir a metafora ao usuario. |
| Validacao e fallback de JSON | Evita que uma resposta ruim quebre a UI. |
| Resultado rico renderizado | Mostra valor alem de um cardapio simples. |
| Historico local | Permite recuperar planejamentos sem banco. |
| PDF expandido | Cria uma saida compartilhavel para teste real. |
| Documentacao viva | Reduz risco de perder contexto entre sessoes. |
| Marcadores `CODEX:` | Ajudam leitura seletiva sem reler tudo. |

## Validacao e feedback

Ja existe validacao e feedback documentados em:

- `ANALISE_REQUISITOS_ATORES_CASOS_USO.md`, secoes `VAL-01` a `VAL-12`.
- `FLUXOS_DE_PROCESSO.md`, fluxos de geracao, acesso demo, PDF e documentacao.
- `TROUBLESHOOTING.md`, para erros de servidor, arquivos, API e frontend.

Padrao de feedback esperado:

| Situacao | Feedback ideal |
|---|---|
| Campos obrigatorios vazios | Mensagem simples indicando tipo e pessoas. |
| Senha demo ausente | Explicar que a demo esta protegida. |
| Senha demo invalida | Avisar erro e permitir tentar novamente. |
| IA lenta | Mostrar estado de carregamento com contexto. |
| IA falha | Mostrar fallback controlado e orientar nova tentativa. |
| PDF indisponivel | Usar impressao ou avisar alternativa. |
| Historico vazio | Mostrar estado vazio sem parecer erro. |

## Oportunidades de melhoria

| Oportunidade | Tipo | Impacto | Observacao |
|---|---|---|---|
| Executar Porta de Passagem da demo controlada | Produto/qualidade | Alto | Permite teste externo pequeno sem abrir frente nova. |
| Validacao de entrada mais clara | UX/dados | Alto | Reduz requests fracos e melhora plano. |
| Registrar evidencia visual do PDF real | Entrega | Alto | Confirma saida compartilhavel sem repetir teste ja feito. |
| Responsividade do resultado | UI | Medio/alto | Resultado grande precisa ser confortavel no celular. |
| Secoes recolhiveis | UI | Medio | Ajuda leitura de plano extenso. |
| Separar pitch do `index.html` | Organizacao | Medio | Reduz complexidade sem mudar stack. |
| Adultos e criancas no motor | Produto/calculo | Medio | Melhora precisao, mas exige contrato novo. |
| Agentes IA especializados | Arquitetura futura | Medio/baixo agora | Reavaliar apenas se houver papeis com entrada, saida, gatilho e validacao proprios. |
| Logs mais limpos | Manutencao | Medio | Ajuda debug sem poluir console. |
| Testes automatizados do motor | Qualidade | Medio | Evita regressao nos calculos. |

## Ajustes iterativos

Padrao de ciclo:

1. Escolher um gargalo.
2. Conferir docs vivos e marcadores `CODEX:`.
3. Fazer a menor alteracao util.
4. Rodar checagem local.
5. Validar no navegador se afetar UI/PDF e o teste ainda nao estiver registrado.
6. Atualizar docs afetados.
7. Registrar proximo ajuste.

Exemplo para acesso demo:

1. Confirmar `Fluxo 3 - Acesso demo`.
2. Confirmar `UC-04`.
3. Consultar o Registro de testes e validacoes no handoff.
4. Repetir senha ausente, invalida, valida e geracao somente se houver mudanca relacionada ou falha aberta.
5. Registrar evidencia nova no handoff quando o teste for executado.
6. Atualizar docs se fluxo mudar.

## Priorizacao de ajustes

### Matriz simples

| Prioridade | Criterio | Exemplo atual |
|---|---|---|
| P0 | Bloqueia app, seguranca ou geracao | Servidor nao sobe, chave exposta, Gemini quebrado. |
| P1 | Bloqueia teste externo ou entrega principal | Acesso demo ruim, PDF ilegivel, erro sem feedback. |
| P2 | Melhora uso frequente sem mudar arquitetura | Validacao de entrada, responsividade, secoes recolhiveis. |
| P3 | Organizacao e evolucao controlada | Separar pitch, limpar logs, testes do motor. |
| P4 | Futuro ou monetizacao | Login, banco, pagamentos, SaaS. |

### Fila curta da proxima atualizacao

1. P1 - Definir nivel de complexidade operacional por servico, infraestrutura, horario e publico.
2. P1 - Dimensionar equipe, utensilios, producao, montagem e reposicao com regras locais verificaveis.
3. P1 - Gerar cronograma operacional ligado ao horario de inicio e aos momentos do evento.

### Fila logo depois

1. P2 - Refinar regras de entrada conforme feedback real.
2. P3 - Avaliar secoes recolhiveis para resultados extensos.
3. P3 - Ampliar perfis regionais somente com revisao editorial e fontes adequadas.

### Regra de decisao

Uma melhoria sobe de prioridade quando:

- impede teste externo;
- causa erro ou confusao no usuario;
- afeta seguranca ou chave;
- compromete PDF ou resultado principal;
- reduz risco de retrabalho nas proximas etapas.

Uma melhoria desce para backlog quando:

- exige nova tecnologia sem urgencia;
- pertence a monetizacao;
- depende de login, banco ou pagamento;
- aumenta complexidade antes da base estar validada.

## Coerencia entre documentos

Quando este documento mudar:

- Se mudar prioridade, atualizar `ROADMAP_ATUAL.md`.
- Se mudar proxima rodada, atualizar `HANDOFF_PROXIMA_ATUALIZACAO.md`.
- Se mudar criterio de validacao, atualizar `ANALISE_REQUISITOS_ATORES_CASOS_USO.md`.
- Se mudar fluxo, atualizar `FLUXOS_DE_PROCESSO.md`.
- Se mudar inventario, atualizar `docs/README.md` e `CLEANUP_AUDIT.md`.
