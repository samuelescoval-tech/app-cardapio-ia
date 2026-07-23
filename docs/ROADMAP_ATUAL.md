# Roadmap atual - Chef IA Studio

Atualizado em 2026-07-15.

Este arquivo registra etapas. Detalhes tecnicos e falhas atuais ficam somente
no handoff.

## Etapa atual

Plano 12 em validacao do usuario: cobertura visual acompanhada.

| Plano | Resultado | Estado |
|---|---|---|
| 1 | Estabilizar fallback, historico e projetos validos | Concluido |
| 2 | Recuperar divergencias culinarias sem apagar o evento | Concluido |
| 3 | Restaurar receitas e desenho detalhado do evento | Concluido |
| 4 | Catalogar fontes e repertorio rastreavel | Concluido |
| 4B | Spoonacular apenas como referencia transitoria | Concluido e pausado |
| 5 | Validar cinco eventos, historico, mobile e PDF | Concluido |
| 6 | Definir identidade e comidas tipicas por evento | Concluido |
| 7 | Variar receitas usando memoria local controlada | Concluido |
| 8 | Captar contexto avancado progressivamente | Concluido |
| 9 | Calcular complexidade e operacao | Concluido |
| 10 | Revisar conteudo e validar o ciclo | Concluido |
| 11 | Criar biblioteca visual local e controlada | Concluido |
| 12 | Medir e corrigir cobertura visual em eventos representativos | Novo teste do usuario |

Contagem atual:

- 11 planos principais concluidos;
- 1 subplano tecnico concluido;
- 1 plano tecnicamente pronto para validacao do usuario;
- nenhuma etapa posterior aprovada automaticamente.

## Plano 11 - resultado

1. Documentacao reduzida a handoff e roadmap; README virou apenas entrada.
2. Vinte e cinco arquivos de teste foram agrupados em seis suites por dominio.
3. Biblioteca local recebeu metadados, dez ilustracoes e selecao local primeiro.
4. Imagens exatas por familia e imagens genericas de categoria sao rotuladas.
5. Openverse permaneceu complementar e as imagens nao foram para historico/PDF.
6. Suite, sintaxe, diff e E2E visual passaram.

## Criterios de aceite

- cada cartao recebe imagem exata ou identificacao honesta de categoria;
- nenhuma imagem incorreta e exibida apenas para preencher espaco;
- arquivos locais funcionam sem Openverse;
- licenca e origem sao rastreaveis;
- Openverse continua opcional;
- historico, PDF e planejamento nao recebem campos externos acidentalmente;
- testes e documentacao permanecem enxutos.

## Depois do Plano 11

As proximas direcoes exigem escolha do usuario:

1. teste acompanhado da biblioteca visual;
2. ampliacao de eventos, temas e repertorio regional;
3. catalogo de precos piloto em uma unica cidade;
4. decisao de produto sobre deploy, login, banco e pagamentos.

Nao iniciar precificacao, SaaS ou infraestrutura de producao apenas por
continuidade tecnica.

## Plano 12 - resultado tecnico

1. Cobertura visual foi separada da nota culinaria.
2. Tela mostra familia local, categoria, Openverse e ausencia.
3. Cinco eventos e 25 pratos passaram sem depender do Openverse.
4. Nenhum prato ficou sem imagem.
5. Quatro itens permaneceram genericos: carpaccio em mini sanduiche, pao de
   alho, mini pizza e cachorro-quente.
6. Desktop e mobile passaram sem imagens quebradas ou overflow.

O plano sera marcado como concluido depois da avaliacao visual do usuario. O
Plano 13 nao deve iniciar automaticamente.

Feedback real reabriu o Plano 12: uma imagem de laranja foi associada a suco de
uva e apareceram referencias monocromaticas. A selecao foi endurecida para
exigir ingrediente distintivo no titulo, rejeitar conteudo monocromatico ou
arquivistico e manter categorias explicitamente genericas. Aguarda novo teste.
