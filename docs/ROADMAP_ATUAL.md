# Roadmap atual - Chef IA Studio

<!-- CODEX:LER_POR_PROCESSO
Ler depois do handoff para confirmar o que ja esta concluido e qual e a proxima atualizacao curta.
Nao usar documentos historicos como prioridade se contradisserem este roadmap.
-->

<!-- CODEX:MANTER_EM_LINHA
Quando uma prioridade mudar, atualizar a Proxima atualizacao curta do handoff.
-->

Atualizado apos a limpeza e continuidade do plano.

## Quadro de etapa atual

**Etapa atual:** ciclo funcional e editorial concluido, com 10 dos 10 planos numerados validados em 2026-07-13. Nao ha Plano 11 automatico.

| Plano | Objetivo principal | Estado | Proxima relacao |
|---|---|---|---|
| 1 | Estabilizar fallback, historico e projetos validos | Concluido | Base preservada pelos demais planos. |
| 2 | Recuperar divergencias culinarias sem apagar o evento | Concluido | Porta de qualidade continua ativa. |
| 3 | Restaurar receitas completas e desenho detalhado do evento | Concluido | Tela e PDF continuam usando o contrato detalhado. |
| 4 | Criar catalogo de fontes e repertorio rastreavel | Concluido | Fontes orientam o runtime sem copia. |
| 4B | Integrar Spoonacular apenas como referencia transitoria | Concluido tecnicamente | Teste real depende de chave nova; nao faz parte dos Planos 9 e 10. |
| 5 | Validar cinco eventos, historico, responsividade e PDF | Concluido | Evidencias servem de baseline de regressao. |
| 6 | Definir identidade, comidas tipicas, refeicao e temas por evento | Concluido | Seus momentos alimentam o cronograma operacional. |
| 7 | Variar receitas com memoria local e auditoria de repeticao | Concluido | Deve permanecer ativo durante as proximas validacoes. |
| 8 | Captar contexto avancado sem sobrecarregar o formulario | Concluido | Campos alimentam diretamente a operacao. |
| 9 | Calcular complexidade operacional por servico e infraestrutura | Concluido | Backend, tela, historico, mobile e PDF validados. |
| 10 | Fazer revisao editorial e validacao final do ciclo | Concluido | Baseline final aprovado; proxima direcao depende do usuario. |

### Depois do Plano 10

O ciclo atual termina no Plano 10. Se a validacao final passar, as etapas seguintes nao sao continuacao automatica e exigem nova decisao do usuario:

1. Teste controlado com usuarios e coleta de feedback real.
2. Correcao apenas de falhas observadas nessa validacao.
3. Decidir se vale ampliar eventos, temas e repertorio regional.
4. Decidir separadamente sobre deploy, login, banco, precificacao e produto SaaS.

## Concluido

- Express servindo `public/`.
- Gemini funcionando via backend.
- Modelo configurado em `.env` com `GEMINI_MODEL`.
- Resposta normalizada em `{ ok, provider, plano, meta }`.
- Extração e validação robusta de JSON.
- Formulario enriquecido com duracao, refeicao, tema, bebidas e orcamento.
- Resultado rico: dashboard, motor, compras por setor, locais, layout, decoracao, cronograma, checklist e orcamentos.
- JS modularizado em `app.js`, `render.js`, `utils.js`.
- CSS modularizado em `public/css/modules/`.
- Documentacao movida para `docs/`.
- Prompt movido para o backend em `src/prompts/event.prompt.js`.
- Prompt backend inicialmente reformado com a metodologia e depois simplificado para rotulos operacionais proporcionais.
- Motor matematico local criado em `src/services/planning/motor.service.js`.
- Validacao do plano reforcada com normalizacao de arrays, decoracao, checklist, orcamento e resumo.
- Historico local com `localStorage`.
- Exportacao PDF inicial com `jsPDF`.
- `meta.tempo_ms` corrigido para duracao real da chamada Gemini.
- `docs/` limpo para manter apenas documentacao ativa e util.
- Fluxo completo validado em Chrome headless: formulario, geracao, historico e download de PDF.
- PDF refinado com cabecalho escuro, cards de resumo, secoes destacadas e rodape.
- PDF expandido para incluir mais conteudo do evento: dados informados, receitas, compras, servico de mesa, utensilios, local, layout, decoracao, cronograma, equipe, entretenimento, lembrancinhas, checklist e orcamento.
- PDF mantem as secoes principais mesmo quando algum bloco do plano vier vazio, com mensagens de "Nao informado".
- Protecao temporaria para teste externo com `DEMO_ACCESS_KEY` em `/gerar-cardapio`.
- Modal/tela de acesso demo implementado no frontend, substituindo o `prompt()` nativo.
- Validacao local confirmou `demo_access.required: true`, bloqueio 401 sem senha, bloqueio 401 com senha incorreta e pagina carregando com markup do modal.
- Rota real `/gerar-cardapio` validada com `DEMO_ACCESS_KEY` correta: status 200, `ok`, `schema_ok`, `motor_local` e `prompt_backend` verdadeiros.
- Decisao arquitetural: nao criar agentes IA autonomos agora; tratar motor, prompt, validacao, render, PDF e acesso demo como Unidades internas proporcionais.
- Fluxos de processo dedicados criados em `docs/FLUXOS_DE_PROCESSO.md`.
- Material de apoio criado em `docs/MATERIAL_APOIO_PROCESSOS_E_REQUISITOS.md` com BPMN simplificado, entradas, processos, saidas, stakeholders, gargalos, requisitos e resumo vivo.
- Analise de requisitos, atores e casos de uso criada em `docs/ANALISE_REQUISITOS_ATORES_CASOS_USO.md`.
- Diagramas complementares e analise tecnica criados em `docs/DIAGRAMAS_COMPLEMENTARES_ANALISE_TECNICA.md`.
- Padroes de qualidade, interface e priorizacao criados em `docs/PADROES_QUALIDADE_PRIORIZACAO.md`.
- Prompt de runtime simplificado para secoes operacionais, sem repetir a metafora nem pedir `motor_logistica` de volta ao Gemini.
- Validacao backend de evento implementada com limites de pessoas, duracao e textos; prompt arbitrario do cliente foi bloqueado.
- Validador do plano passou a exigir campos essenciais e descartar campos fora do contrato.
- Suite automatizada adicionada com `node:test`, sem dependencia nova.
- Resultado responsivo validado em desktop e mobile sem overflow horizontal.
- Demo externa controlada concluida com retorno positivo e sem falha relatada.
- Motor local evoluido para adultos e criancas, preservando `pessoas` como total e compatibilidade com historico.
- Valores financeiros sem fonte foram removidos; catalogo regional simples de Sao Paulo foi modelado com fonte, faixa, data e validade.
- Matriz culinaria local criada com perfis de evento, composicao por categoria, orientacoes tematicas e fontes editoriais rastreaveis.
- Contrato culinario ligado por ids: prato, ingredientes dimensionados, receitas aplicaveis e compras consolidadas com origens.
- Porta de qualidade culinaria implementada no backend e validada em cenario corporativo tropical com 13 itens e 32 compras cobertas.
- Plano 1 de estabilizacao concluido: fallback invalido nao e exibido nem salvo, ultimo plano valido e preservado e historico antigo e normalizado sem exclusao automatica.
- Rodape da interface corrigido para 2026 e regressao do historico coberta por teste automatizado.
- Plano 2 concluido: validacao culinaria recuperavel consolida compras, completa origens e deriva itens ausentes sem descartar o evento.
- Relatorio de qualidade culinaria adicionado ao plano, `meta` e interface, diferenciando ajuste automatico de revisao editorial.
- Casamento real de 100 pessoas validou o novo fluxo com 14 itens, 29 compras e cobertura de 28/28 ingredientes.
- Plano 3 concluido: pratos distinguem preparo, montagem e pronto; receitas incluem ingredientes, passos, tempo, rendimento e quantidade total.
- Interface e PDF restauraram receitas detalhadas e mantem visiveis todas as secoes editoriais, inclusive quando nao informadas.
- Atendimento domiciliar do PDF antigo passou com 13 itens, 10/10 receitas completas, 32 compras e minimos editoriais completos, sem avisos.
- Plano 4 concluido com catalogo local de 10 fontes, classificacao de qualidade, finalidade, evidencia e limitacoes; 8 orientam o runtime e 2 ficam restritas a estrutura/descoberta futura.
- Selecao de fontes e compacta e contextual; a geracao nao pesquisa a web, nao copia receitas e nao torna marcas obrigatorias.
- Cenario corporativo sem gluten confirmou selecao especializada e geracao completa com aviso recuperavel.
- Spoonacular foi avaliado e catalogado como API externa opcional, com runtime desativado porque seus termos de armazenamento conflitam com historico e PDF persistentes do Chef IA.
- Plano 4B concluiu consulta Spoonacular opcional e transitoria: endpoint protegido, atribuicao, limites locais e interface que nao salva referencias no plano, historico ou PDF.
- Plano 5 concluiu a regressao ponta a ponta de atendimento domiciliar, casamento, churrasco, infantil e corporativo pela interface real, com as 14 secoes renderizadas, cinco registros no historico e carregamento de projeto confirmado.
- Responsividade do Plano 5 passou em 400 px sem overflow horizontal. Os cinco PDFs passaram em A4, com 6 paginas e texto extraivel; a amostra visual de churrasco ficou legivel e sem cortes aparentes.
- O falso aviso de receita ausente para bebida pronta foi removido e protegido por teste automatizado. Scripts de validacao de API e Chrome ficaram disponiveis em `scripts/`.
- Plano 6 concluiu a taxonomia culinaria com 7 perfis de evento, 5 modificadores de refeicao e 8 temas. Identidade, momentos, elementos esperados, comidas tipicas, opcionais e inadequacoes agora chegam ao prompt de forma estruturada.
- Perfil-base e escolhido pelo tipo do evento; refeicao e tema sao camadas independentes e nao substituem casamento, churrasco, infantil, corporativo ou atendimento domiciliar.
- Cinco cenarios reais responderam com os minimos de 13, 14, 18, 13 e 13 itens. A repeticao final de churrasco e infantil terminou sem avisos e confirmou pratos coerentes com cada identidade.
- Plano 7 concluiu a variedade orientada pelo historico: memoria local compacta e limitada, comparacao apenas entre contextos equivalentes, assinatura semantica, repeticoes essenciais justificadas e repeticoes evitaveis auditadas.
- Tela e PDF exibem quantos pratos sao novos, essenciais ou precisam de revisao. O historico externo, receitas completas, ingredientes, observacoes e referencias Spoonacular nao entram na memoria enviada ao backend.
- Chrome validou uma segunda festa infantil com 12 pratos novos, 1 essencial, zero repeticoes a revisar, painel visivel, dois projetos salvos, mobile sem overflow e PDF A4 de 6 paginas.
- Plano 8 concluiu a entrada progressiva: campos essenciais continuam visiveis e horario, formato de servico, faixa etaria, infraestrutura, prioridade, localidade e orcamento ficam em opcoes avancadas.
- Backend valida horario e listas controladas; taxonomia e prompt recebem contexto operacional. Historico, tela, premissas do motor e PDF preservam os novos campos sem quebrar registros antigos.
- Cenario corporativo real com contexto avancado passou aprovado e sem avisos. Chrome confirmou carregamento dos campos, secao de contexto, mobile sem overflow e PDF A4 de 6 paginas.
- Plano 9 concluiu a operacao deterministica: complexidade explicavel, equipe por formato, producao/transporte/finalizacao, equipamentos por estacao e cronograma ligado ao horario e aos momentos do Plano 6.
- Dados nao confirmados geram pendencias, sem presumir cozinha ou equipamento local. Cinco eventos cobriram niveis baixo, medio e alto na suite automatizada.
- Cenario corporativo real confirmou operacao media, 4 frentes de equipe, 6 etapas, 3 estacoes e 9 momentos. Tela, historico, mobile 400 px e PDF A4 de 7 paginas passaram.
- Plano 10 distinguiu cronograma operacional de roteiro do evento, recuperou ingredientes a partir da receita, alinhou o minimo editorial aos momentos reais da taxonomia e reforcou categorias/bebidas.
- Cinco eventos com contexto avancado passaram na interface; uma recarga real preservou os cinco historicos e o mobile ficou sem overflow. Cinco PDFs A4 de 7 a 8 paginas contem operacao e roteiro legiveis.
- Variedade final infantil confirmou 8 pratos novos, 3 repeticoes essenciais e 2 repeticoes evitaveis sinalizadas. A auditoria normaliza plural sem confundir tecnicas diferentes.
- Suite final: 11 arquivos de teste aprovados, sintaxe valida e `git diff --check` aprovado.
- Cinco baselines tecnicos controlados foram consolidados em 2026-07-13: corporativo, infantil, casamento, churrasco e atendimento domiciliar.
- O atendimento domiciliar confirmou operacao baixa e revelou apenas perda de unidade em bebidas numericas; o backend recupera `L` sem alterar valores, e a repeticao passou com 13 itens, 11 receitas, cobertura 29/29, historico, mobile e PDF A4.
- O primeiro teste acompanhado revelou repertorio generico, pedidos nominais omitidos, poucas opcoes de refeicao e densidade visual. A correcao criou uma camada geral de ocasioes e catalogo local de pedidos explicitos, sem limitar a solucao a debutante.
- Debutante passou com 22 itens, oito pedidos nominais, 14/14 receitas, quatro bebidas e cobertura 36/36. Natal sem pratos nominais confirmou repertorio sazonal com 19 itens e 15/15 receitas.
- Imagens, fornecedores, planilha e precificacao por usuario permanecem no backlog; dados de clientes nao alimentam uma base geral de precos sem fonte e validacao.
- A revisao corporativa Premium identificou que o minimo de 13 itens vinha da composicao-base e nao de truncamento. A camada geral de estilos agora amplia Premium para 17 itens no perfil corporativo e define sinais verificaveis de alto padrao.
- Prompt e backend passaram a rejeitar cha em sache e outros itens comuns em Premium, exigir cobertura alimentar identificada e sinalizar alternativas apenas sob demanda.
- O layout irregular foi rastreado a uma tag `section` sem fechamento. A estrutura foi corrigida e a selecao de pratos ganhou carrossel uniforme com alternativa em lista.
- Geracao real atualizada: 17 itens em 5+3+4+5, nenhum item proibido, termino `STOP` com 6.931 tokens. O resultado precisa agora de nova avaliacao perceptiva do usuario.
- E2E corporativo Premium: 17 pratos, 15 receitas, 40 compras, historico recarregado, mobile 400/400 e PDF A4 de 62.758 bytes; a qualidade permaneceu em `revisar` por ausencia de evidencia de louca/acabamento e estacao especial de bebidas.

## Proxima atualizacao curta

1. Reavaliar o workshop corporativo com o novo contrato Premium pela interface real.
2. Coletar referencias visuais do usuario e transformar somente padroes aprovados em componentes reutilizaveis.
3. Projetar envelope orcamentario por percentuais e estado `A cotar`, sem precos de mercado inventados.
4. Especificar a futura camada de imagens com licenca, atribuicao, cache e fallback.
5. Executar o proximo teste acompanhado com outra pessoa e outro tipo de evento.
6. Manter Spoonacular desativado e fora do ciclo atual.
7. Nao iniciar deploy, login, banco, precificacao ou SaaS antes da consolidacao dos testes com usuarios.

Em 2026-07-13, o usuario informou que a chave Spoonacular exposta foi rotacionada. A auditoria local passou nos 11 arquivos de teste, na sintaxe e em `git diff --check`; depois da revisao de custo, o usuario decidiu pausar a consulta real por ser um servico pago. Isso nao bloqueia os testes controlados do MVP.

## Falha critica de qualidade registrada

Sintoma observado em uso real:

- Cardapios pouco variados e pouco sensiveis ao tipo e ao tema do evento.
- Lista de compras curta ou sem todos os itens necessarios.
- Resultado estruturalmente valido, mas culinariamente superficial.

Causas confirmadas no codigo atual:

- Prompt sem fontes culinarias ou base estruturada por evento e tema.
- Faixas fixas de 7-9 itens de cardapio e minimo generico de 12 compras.
- Receitas e compras geradas como blocos independentes, sem regra de cobertura.
- Validador estrutural sem verificacao semantica de tema, ingredientes ou compras.
- Motor local com poucos perfis genericos de evento.

Porta de qualidade para considerar a correcao concluida:

- Cardapio coerente com evento, tema, refeicao, publico e restricoes.
- Cada prato possui componentes ou ingredientes verificaveis.
- Toda necessidade culinaria aparece na lista de compras, sem duplicacao relevante.
- Quantidades de compra se relacionam ao motor local e ao numero de convidados.
- Bebidas e materiais operacionais ficam separados dos ingredientes.
- Cenários representativos passam por revisao de conteudo, nao apenas por `schema_ok`.

## Trilha de precificacao

### Curto prazo

- Quantidades continuam no motor local.
- Precos sem fonte ficam como `A cotar`, nunca como valor real.
- Todo preco futuro exige regiao, moeda, unidade, fonte, data-base e validade.
- Primeiro catalogo deve cobrir uma unica cidade e ser validado contra cotacao real.

### Medio prazo

- Importacao de catalogo por CSV/JSON.
- Multiplas referencias por item e faixas economica, media e sofisticada baseadas em mercado.
- Atualizacao de bases antigas com indice oficial, sem usar inflacao como substituto de cotacao.

### Longo prazo

- Banco PostgreSQL quando houver varias regioes, historico, fornecedores ou painel administrativo.
- Integracoes de cotacao, moedas, impostos e indices por pais.
- Orcamento comercial somente com fontes e regras juridicas adequadas.

## Depois dessa atualizacao

1. Completar e conectar o catalogo simples de precos de Sao Paulo.
2. Retomar multiplicadores do motor por tipo de refeicao, alinhados a nova matriz culinaria.
3. Separar apresentacao/pitch do `index.html`, se ainda fizer sentido.
4. Migrar SDK Gemini legado somente depois da base continuar estavel.

## Observacao sobre documentacao

Documentos antigos de fase, quickstart e resumo foram removidos porque duplicavam informacao ou contradiziam o estado real. `planoCompletoChefia.md` e `PLANO_CONTINUACAO.md` foram recuperados como referencia historica/plano mestre; o estado atual valido continua no README principal, neste roadmap, em `HANDOFF_PROXIMA_ATUALIZACAO.md`, nos fluxos de processo, no material vivo de processos/requisitos, na analise de requisitos/atores/casos de uso, nos diagramas complementares e nos padroes de qualidade/priorizacao.
