# Validacao mobile do Chef IA Studio

Data: 2026-07-14.

## Escopo

Esta fase altera somente a experiencia responsiva e a evidencia de teste. A geracao culinaria, o motor de quantidades e os contratos de qualidade permanecem inalterados.

## Ajustes aplicados

- primeira dobra reduzida de `50vh` para alturas previsiveis de `300px` e `270px`;
- navegacao fixa limitada a largura da tela e botoes com pelo menos `44px` de altura;
- painel, titulos, campos, chat e botao principal compactados sem reduzir legibilidade;
- campos principais com `54px` de altura e fonte de `16px`, evitando zoom involuntario no celular;
- controles de carrossel e lista reorganizados em grade no viewport estreito;
- rotulos associados aos campos, estados `aria-pressed`, resultado `aria-live` e suporte a movimento reduzido;
- teste E2E registra metricas e captura mobile antes das portas culinarias, inclusive quando o conteudo gerado e reprovado.

## Evidencia em 390 x 844

- viewport: `390px`;
- largura do documento: `390px`;
- overflow horizontal: `false`;
- largura dos controles do cardapio: `340px`;
- largura do primeiro cartao do carrossel: `296px`;
- comparacao da pagina inicial: a mesma primeira tela passou de aproximadamente dois campos visiveis para quatro campos uteis.

## Resultado dos testes

- 13 arquivos de teste automatizado aprovados;
- sintaxe do script E2E valida;
- pagina inicial e resultado capturados em Chrome headless no viewport mobile;
- o teste culinario corporativo foi barrado por 3 receitas ausentes;
- o teste de churrasco foi barrado por `35/48 L` de bebidas nao alcoolicas.

As duas ultimas falhas sao de conteudo e permanecem visiveis para a proxima fase. Elas nao representam overflow ou quebra do layout e nao devem ser removidas por relaxamento das portas de qualidade.

## Criterio de aceite

O refinamento mobile e aceito quando a pagina e o resultado mantem `scrollWidth` igual ao viewport, controles de toque com pelo menos `44px`, campos legiveis e navegacao utilizavel. A qualidade culinaria continua sendo avaliada separadamente.
