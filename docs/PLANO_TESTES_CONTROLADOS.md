# Plano de testes controlados - Chef IA Studio

<!-- CODEX:LER_POR_PROCESSO
Ler quando for preparar, executar ou consolidar um teste com usuario real.
-->

<!-- CODEX:MANTER_EM_LINHA
Registrar no handoff somente resultados consolidados ou falhas que mudem a prioridade.
-->

## Objetivo do ciclo

Validar se o MVP ajuda uma pessoa a planejar um evento real com clareza e confiabilidade suficiente para revisao profissional, antes de iniciar funcionalidades grandes.

## Escopo minimo

- 3 a 5 pessoas testadoras.
- Um evento realista por pessoa.
- Pelo menos tres perfis entre atendimento domiciliar, casamento, churrasco, infantil e corporativo.
- Uma geracao principal por evento; repetir apenas quando houver falha funcional ou correcao relacionada.
- Avaliacao do formulario, resultado, receitas, compras, operacao, historico e PDF.
- Spoonacular avaliado separadamente como referencia opcional e transitoria.

## Preparacao

Antes de cada teste:

1. Confirmar que `npm test` passa.
2. Confirmar `GET /api/status` com Gemini, motor local e acesso demo esperados.
3. Usar `DEMO_ACCESS_KEY` somente pelo canal privado combinado.
4. Nao compartilhar `.env`, chaves de API ou respostas com dados pessoais desnecessarios.
5. Explicar que precos sem fonte ficam como `A cotar`, alergenicos exigem verificacao profissional e a operacao e uma estimativa.

## Ficha de feedback por evento

Copiar e preencher um bloco por teste:

```text
ID do teste:
Data:
Perfil do usuario: iniciante | profissional | outro
Tipo de evento:
Adultos/criancas:
Restricoes e alergenicos informados:
Formato, infraestrutura e horario:
Navegador/dispositivo:

Geracao concluiu? sim | nao
Tempo percebido: rapido | aceitavel | lento
Formulario ficou claro? 1 a 5
Cardapio combina com o evento? 1 a 5
Receitas parecem executaveis? 1 a 5
Lista de compras parece completa? 1 a 5
Operacao parece util e coerente? 1 a 5
Historico salvou e recarregou? sim | nao | nao testado
PDF ficou legivel e completo? sim | nao | nao testado
Houve repeticao evitavel? sim | nao | incerto
Compras foram recuperadas automaticamente? sim | nao | nao informado

Principal acerto:
Principal dificuldade:
Erro reproduzivel e passos:
Evidencia disponivel: print | PDF | dados do evento | nenhuma
Gravidade: bloqueante | alta | media | baixa | sugestao
Decisao: corrigir agora | observar | backlog | aprovado
```

## Classificacao e correcao

Corrigir no ciclo somente quando a falha for reproduzivel e afetar um destes pontos:

- geracao ou validacao do evento;
- perda ou corrupcao do historico;
- PDF ilegivel ou incompleto;
- receita sem informacao essencial;
- compra ausente ou incoerente;
- operacao contraditoria;
- exposicao de segredo ou persistencia indevida de referencia externa.

Preferencias editoriais isoladas, novas categorias e expansoes de repertorio entram no backlog ate aparecer um padrao entre os testes.

## Execucoes registradas

### Pre-teste tecnico 0 - evento corporativo

- Data: 2026-07-13.
- Objetivo: confirmar o baseline antes de envolver usuarios reais.
- Ambiente: Gemini configurado, acesso demo ativo, motor local e operacao deterministica declarados no status; Spoonacular desativado.
- Cenario: evento corporativo para 40 adultos, coffee break, opcao vegana e sem lactose, tema profissional contemporaneo.
- Resultado: geracao concluida com 13 itens e cobertura de 23/23 ingredientes.
- Receitas: 7 cobertas e completas; 8 itens classificados com preparo ou montagem.
- Revisao: ficha ausente para `Frutas da estacao fatiadas`, classificada como montagem.
- Decisao: nao alterar o validador; manter o aviso e observar se o mesmo problema aparece em testes de usuario.
- Limite da evidencia: este pre-teste de API nao aprovou interface, historico, operacao renderizada ou PDF.
- Proxima porta: executar o primeiro teste real pela interface usando a ficha de feedback deste documento.

### Pre-teste tecnico 1 - E2E corporativo pela interface

- Data: 2026-07-13.
- Escopo: formulario, geracao real, renderizacao, operacao, historico, recarga, mobile e PDF.
- Resultado final: 13 pratos, 11 receitas, 29 compras e cobertura de 30/30 ingredientes.
- Operacao: complexidade media, 4 frentes de equipe, 6 etapas de fluxo, 3 estacoes, 9 momentos e nenhuma confirmacao pendente.
- Interface: 16 secoes esperadas, sem duplicacao operacional e sem overflow no desktop ou em 400 px.
- Historico: um projeto salvo, recarregado com todos os campos avancados e painel avancado aberto.
- PDF: A4, 7 paginas, 57.588 bytes e texto pesquisavel.
- Falha encontrada: o primeiro PDF afirmou uma restricao sem gluten nao informada e usou linguagem de garantia alimentar.
- Correcao: o backend agora substitui resumos com promessa absoluta ou restricao inventada por texto deterministico baseado no evento, com aviso de conferencia profissional e contaminacao cruzada.
- Regressao: o E2E passou a rejeitar promessa alimentar absoluta, restricao a gluten nao informada e falta de cuidado profissional.
- Ponto a observar: 22 compras foram recuperadas automaticamente. A cobertura final ficou completa, mas o volume de recuperacao deve ser comparado com os proximos testes antes de alterar o prompt.
- Proxima porta: primeiro teste com uma pessoa usuaria e preenchimento da ficha de feedback.

### Pre-teste tecnico 2 - E2E infantil com restricao

- Data: 2026-07-13.
- Cenario: festa infantil para 30 pessoas, sendo 20 criancas, com orientacao de evitar amendoim.
- Resultado: 13 pratos, 11 receitas, 30 compras e cobertura de 30/30 ingredientes.
- Compras: nenhuma compra precisou ser derivada automaticamente nesta amostra.
- Alergenicos: amendoim nao apareceu no cardapio, receitas ou compras; o resumo orienta conferencia profissional de rotulos, preparo e contaminacao cruzada.
- Operacao: complexidade media, 3 frentes de equipe, 6 etapas de fluxo, 3 estacoes, 9 momentos e nenhuma confirmacao pendente.
- Interface e historico: 16 secoes renderizadas, um projeto salvo e recarregado com todos os campos avancados.
- Mobile: viewport e largura do documento em 400 px, sem overflow horizontal.
- PDF: A4, 7 paginas, 57.334 bytes, texto pesquisavel e restricao visivel.
- Decisao: aprovado como baseline tecnico; nenhuma correcao adicional de codigo.
- Proxima porta tecnica: validar o cenario de casamento, que acrescenta escala, bar completo, publico misto e opcao vegetariana.

### Pre-teste tecnico 3 - E2E de casamento

- Data: 2026-07-13.
- Cenario: casamento para 100 pessoas, sendo 15 criancas, servico empratado, cozinha de apoio limitada, opcao vegetariana e bar completo.
- Falhas encontradas na primeira amostra utilizavel: a opcao vegetariana estava apenas na Entrada e o bar tinha uma unica bebida alcoolica.
- Correcao de contrato: almoco ou jantar com restricao vegetariana exige identificacao em `Prato Principal`; bar completo exige duas bebidas alcoolicas e duas nao alcoolicas.
- Correcao da matriz: o minimo de `Bebida` sobe de 3 para 4 quando houver bar completo; no casamento, o total minimo sobe de 14 para 15 itens.
- Correcao de teste: promessa sobre a experiencia do evento e permitida; promessa alimentar absoluta continua bloqueada quando estiver na mesma frase de restricao ou alergenico.
- Resultado final: 15 pratos, 12 receitas, 37 compras e cobertura de 37/37 ingredientes, sem compra derivada.
- Inclusao: um `Prato Principal` vegetariano identificado.
- Bar: duas bebidas alcoolicas e duas nao alcoolicas; estimativa de alcool continua restrita aos 85 adultos.
- Operacao: complexidade alta, 5 frentes de equipe, 6 etapas de fluxo, 3 estacoes, 10 momentos e nenhuma confirmacao pendente.
- Interface e documentos: historico recarregado, mobile 400/400 sem overflow e PDF A4 pesquisavel de 7 paginas e 60.401 bytes.
- Decisao: aprovado como baseline tecnico depois da correcao; teste com pessoa usuaria continua necessario para validar clareza e utilidade real.

### Pre-teste tecnico 4 - E2E de churrasco

- Data: 2026-07-13.
- Cenario: churrasco para 50 pessoas, sendo 10 criancas, estacoes/ilhas, cozinha limitada, alcool moderado e opcao vegetariana na grelha.
- Primeira divergencia: o cardapio e as compras cobriam apenas 18/48 L de bebidas nao alcoolicas e 30/56 L de alcoolicas, apesar de o motor exibir os totais oficiais.
- Correcao: o prompt passou a exigir soma separada dos litros; o backend compara cardapio com o motor e gera revisao com deficit exato; o E2E bloqueia a divergencia.
- Resultado final: 18 pratos, 15 receitas, 30 compras, cobertura 29/29 e nenhuma compra derivada.
- Grelha: picanha, frango, linguica e `Prato Principal` vegetariano; a receita vegetal determina preparo separado.
- Bebidas: 16 L de agua e 32 L de refrigerante totalizam 48 L nao alcoolicos; cerveja totaliza os 56 L alcoolicos estimados somente para adultos.
- Operacao: complexidade media, 6 frentes de equipe, 4 estacoes incluindo grelha, 6 etapas de fluxo, 9 momentos e nenhuma confirmacao pendente.
- Interface e documentos: historico recarregado, mobile 400/400 sem overflow e PDF A4 pesquisavel de 7 paginas e 59.042 bytes.
- Decisao: aprovado como quarto baseline tecnico; o proximo cenario e atendimento domiciliar.

### Pre-teste tecnico 5 - E2E de atendimento domiciliar

- Data: 2026-07-13.
- Cenario: brunch elegante para 5 adultos, buffet self-service, cozinha completa no local, conforto como prioridade e alcool moderado.
- Falha reproduzida: a IA retornou os valores corretos de bebidas, `1` e `1,4`, mas sem a unidade; por isso, o motor interpretou ambos como zero litro.
- Correcao: quantidades puramente numericas de itens e compras classificados como Bebida recebem apenas a unidade `L`, sem alterar ou inventar o valor; o prompt passou a proibir numero isolado nesses campos.
- Diagnostico: o E2E agora grava o resultado detalhado em `/tmp` quando uma porta de validacao falha.
- Resultado final: 13 itens, 11 receitas completas, 34 compras e cobertura de 29/29 ingredientes.
- Compras: 6 itens foram derivados do cardapio; a cobertura ficou completa e o volume deve ser observado nos testes com usuarios, sem nova alteracao antecipada.
- Bebidas: 1 L de suco e 1,4 L de espumante cobrem exatamente os totais oficiais do motor.
- Operacao: complexidade baixa, 4 frentes de equipe, 6 etapas de fluxo, 3 estacoes, 10 momentos e nenhuma confirmacao pendente.
- Interface e documentos: historico recarregado com campos avancados, mobile 400/400 sem overflow e PDF A4 pesquisavel de 7 paginas e 57.169 bytes.
- Decisao: aprovado como quinto baseline tecnico; os cinco perfis representativos estao prontos para o inicio dos testes acompanhados com pessoas usuarias.

### Teste acompanhado 1 - aniversario de debutante

- Data: 2026-07-13.
- Perfil: dono do projeto como primeira pessoa usuaria; evento realista de debutante para 150 pessoas.
- Geracao: concluida; historico e PDF funcionaram. O campo deixado como `sim/nao` foi registrado como `sim` porque o participante avaliou o resultado, recarregou o historico e abriu o PDF.
- Notas: formulario 2/5; cardapio 3/5; receitas 2/5; compras 2/5; operacao 3/5.
- Principal acerto: pedidos nominais simples, como picanha, sao reconhecidos pelo Chef IA.
- Dificuldades: formulario e resultado densos; poucas opcoes de refeicao; repertorio generico quando o usuario nao nomeia pratos; bebidas pouco variadas; receitas percebidas como limitadas; natureza da compra colada ao nome; ausencia de estimativa financeira.
- Pedido culinario do teste: bebidas leves, bolo, brigadeiro, beijinho, almoco com churrasco, alcatra, patinho, linguica, asa/coxa de frango e baiao de dois; publico adolescente com adultos; danca, DJ e area livre para coreografia.
- Reproducao anterior a correcao: 13 itens e somente um `Prato Principal`, o baiao de dois; as carnes nomeadas foram omitidas e vieram apenas agua, suco e refrigerante.
- Correcao geral: criada camada extensivel de ocasioes, inicialmente com debutante, Natal, Ano Novo, Pascoa e Carnaval; perfil-base, refeicao, ocasiao e tema permanecem independentes.
- Diferenciacao: repertorio da ocasiao completa o planejamento quando o usuario nao especifica; alimentos reconhecidos no catalogo local viram pedidos explicitos estruturados e sua ausencia gera revisao no backend.
- Interface: campo de evento ganhou sugestoes sem perder texto livre; refeicoes combinadas foram ampliadas; natureza da compra recebeu rotulo separado; operacao detalhada fica recolhida por padrao e continua disponivel.
- Aceite final de debutante: 22 itens, todos os oito pedidos nominais, 14/14 receitas completas, 36/36 ingredientes, nenhuma compra derivada, quatro bebidas, historico, mobile e PDF aprovados.
- Aceite sazonal: Natal sem pratos nominais gerou 19 itens, 15/15 receitas completas e repertorio coerente com peru, tender, farofa, salpicao, rabanada, pave e panetone; quatro bebidas e PDF A4 de 8 paginas.
- Ponto a observar: a amostra de Natal recuperou 25 compras automaticamente. A lista final ficou completa, mas a recorrencia deve ser medida nos proximos usuarios.
- Backlog: imagens ilustrativas com fonte/licenca; fornecedores e precos por usuario; importacao de planilha; catalogo regional auditavel. Nenhum valor enviado por usuario vira referencia geral sem validacao.
- Decisao: falhas reproduziveis de repertorio, pedidos explicitos e formatacao foram corrigidas; imagens e precificacao permanecem fora deste ciclo.

### Revisao acompanhada 2 - workshop corporativo Premium

- Data: 2026-07-13.
- Cenario: workshop corporativo de tecnologia para 80 pessoas, seis horas, coffee break, sem alcool, estilo Premium, sem cozinha no local e prioridade de apresentacao.
- Feedback: resultado operacional 6,5/10 e experiencia Premium 4,5/10; layout irregular, somente 13 itens, cha em sache, cardapio comum, cobertura pouco clara de restricoes, ambientacao generica e orcamento desejado de R$ 30.000 sem uso visivel.
- Diagnostico de quantidade: 13 era exatamente a composicao-base do perfil corporativo, nao truncamento. A amostra antiga terminou com `STOP` e 5.444 tokens.
- Diagnostico visual: o painel de qualidade nao fechava a tag `section`; por isso, contexto e motor eram encaixados na grade anterior com alturas e espacos incoerentes.
- Correcao de estilo: criada camada geral `style_modifiers` para Simples, Elegante e Premium. Premium acrescenta um item por categoria, exige evidencia concreta de curadoria e evita sache, bolo simples, biscoito comum, cafe soluvel, suco em po e alternativa somente sob demanda.
- Correcao de inclusao: evento Premium com restricoes solicita ao menos duas opcoes identificadas por grupo; o backend avisa quando a cobertura textual estiver abaixo do minimo ou apenas sob demanda.
- Correcao visual: cardapio passou a carrossel horizontal com tres cartoes uniformes no desktop, setas, rolagem e alternativa em lista; o painel HTML foi fechado corretamente.
- Aceite automatizado: 11 arquivos de teste aprovados e sintaxe valida.
- Aceite visual: Chrome headless confirmou contexto e motor em blocos independentes, carrossel uniforme e lista compacta funcional.
- Aceite real apos reiniciar o servidor: 17 itens nas proporcoes 5 entradas, 3 acompanhamentos, 4 sobremesas e 5 bebidas; nenhum termo proibido; `STOP` com 6.931 tokens.
- E2E pela interface: 17 pratos, 15 receitas, 40 compras, historico salvo e recarregado, mobile 400/400 sem overflow e PDF A4 de 62.758 bytes.
- Porta Premium: o E2E ficou corretamente em `revisar` por nao evidenciar louca/acabamento de alto padrao nem estacao de bebidas especiais; validade tecnica nao e mais tratada como aprovacao Premium automatica.
- Ponto a observar: a IA abreviou vegetariano como `Veg`; o backend passou a reconhecer a etiqueta sem perder a regra principal. O novo resultado ainda precisa de avaliacao humana para confirmar se a curadoria percebida atingiu o padrao Premium.
- Decisao financeira: manter `A cotar` sem catalogo regional. O valor desejado pode orientar uma futura distribuicao de envelope, mas nao autoriza inventar precos.

### Regra de coerencia e blocos - regressao de 2026-07-14

- Requisito: pensar por contexto cultural, estilo, restricoes e orcamento; apresentar variacoes relacionadas em blocos sem perder receitas, quantidades e compras.
- Arquitetura: contexto estruturado e blocos de apresentacao sao deterministicos; itens operacionais continuam atomicos e ligados por `id`.
- Catalogo inicial: 11 contextos de tipo, tema ou refeicao, combinados em camadas sem substituir o perfil-base.
- Corporativo: 17 itens, 12 blocos, 15 receitas, 35 compras e PDF de 70.588 bytes.
- Churrasco: 19 itens, 13 blocos, 14 receitas, 30 compras e PDF de 67.417 bytes.
- Natal: 19 itens, 11 blocos, 14 receitas, 32 compras e PDF de 69.680 bytes.
- Interface: um painel de coerencia e um detalhe expansivel por bloco; carrossel e lista usam a mesma estrutura.
- Documentos: PDFs pesquisaveis incluem coerencia, cardapio por blocos e detalhamento de itens e quantidades.
- Compatibilidade: historico, recarga e viewport 400/400 passaram sem overflow.
- Porta Premium preservada: o corporativo continuou em `revisar` por ausencia de evidencia de louca/acabamento e estacao especial de bebidas.

## Spoonacular no backlog

O Spoonacular nao e pre-condicao para os testes controlados. A consulta real esta pausada porque o servico pago nao faz parte do ciclo minimo atual.

Se a decisao for revista no futuro, a chave nova precisa estar em `SPOONACULAR_API_KEY` no `.env` do ambiente testado. Depois, executar uma unica consulta controlada:

```bash
npm run test:spoonacular:live -- "risoto de cogumelos"
```

A porta passa somente se:

- a credencial for aceita;
- houver no maximo tres referencias;
- a resposta continuar com `persistence: false`;
- nenhuma instrucao, ingrediente ou nutricao for retornada pelo Chef IA;
- cada referencia valida possuir fonte HTTPS e atribuicao;
- a quota e o limite local permanecerem visiveis.

O resultado nao entra no plano, historico ou PDF. Falha de credencial, quota ou rede nao autoriza remover esses limites.

## Criterio de encerramento

O ciclo pode ser reavaliado quando:

- 3 a 5 testes estiverem registrados;
- nenhuma falha bloqueante permanecer aberta;
- falhas altas estiverem corrigidas ou explicitamente pausadas;
- historico e PDF tiverem evidencias reais;
- feedback culinario estiver separado de falha tecnica;
- Roadmap e Handoff registrarem a decisao seguinte.

Decisoes possiveis: novo ciclo de correcoes, expansao culinaria baseada em padroes observados ou avaliacao separada de produto comercial.
