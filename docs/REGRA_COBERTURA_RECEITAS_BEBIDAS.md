# Cobertura de receitas e reconciliacao de bebidas

Data: 2026-07-14.

## Objetivo

Garantir que toda preparacao operacional tenha uma ficha rastreavel e que os volumes de bebidas respeitem os minimos calculados pelo motor local, sem inventar novas bebidas, precos ou uma falsa precisao culinaria.

## Classificacao dos itens

- `preparo`: possui cocao ou tecnica culinaria e exige receita;
- `montagem`: combina ou finaliza componentes e exige receita;
- `pronto`: produto realmente pronto para servir e pode ficar sem receita;
- bebida sem classificacao explicita continua como `pronto`; preparacoes de cafe, infusao, suco ou coquetel devem vir classificadas pela IA quando exigirem tecnica.

O backend nao transforma automaticamente alimentos complexos em `pronto`. Se um item pronto nao relacionado a bebidas possuir varios ingredientes, a classificacao continua sinalizada para revisao.

## Recuperacao de ficha operacional

Quando a IA omite uma receita de um item `preparo` ou `montagem`, o backend cria uma ficha usando somente:

- `cardapio_id`, nome, descricao e quantidade do item;
- ingredientes e quantidades ja presentes no cardapio;
- tres etapas operacionais de conferencia, execucao/montagem e porcionamento seguro.

A ficha recebe:

- `origem: backend` ou `ia_complementada_backend`;
- `status: ficha_operacional_recuperada`;
- observacao explicita de que tecnica, tempo e seguranca precisam de conferencia profissional;
- tempo `Validar em teste de producao`, sem inventar minutos.

Fichas parciais preservam os passos originais e recebem apenas os complementos necessarios. Tela e PDF identificam a recuperacao; a cobertura registra `receitas_recuperadas`.

## Reconciliacao de bebidas

O motor local continua sendo a fonte dos litros minimos para bebidas alcoolicas e nao alcoolicas. Quando as opcoes escolhidas somam menos que o minimo:

1. o backend separa bebidas alcoolicas e nao alcoolicas;
2. preserva os nomes escolhidos;
3. distribui o deficit proporcionalmente entre itens com volume positivo;
4. ajusta compras diretas de bebidas ligadas por origem ou nome;
5. registra classe, volume anterior, volume final, fator e itens alterados.

Se nao existir nenhuma bebida da classe exigida com volume positivo, o backend nao inventa uma opcao e mantem o aviso de insuficiencia.

## Evidencias

- teste unitario: nao alcoolicas `18 -> 48 L` e alcoolicas `30 -> 56 L`, com compras diretas sincronizadas;
- corporativo: 16 itens, 15/15 receitas completas, 37 compras e PDF de 73.516 bytes;
- churrasco: 19 itens, 16/16 receitas, 9 fichas recuperadas, 31 compras e PDF de 73.584 bytes;
- Natal: 19 itens, 15/15 receitas, 44 compras e PDF de 75.481 bytes;
- historico com tres eventos recarregado;
- viewport/documento `390/390`, sem overflow.

O corporativo permaneceu em `revisar` por motivos independentes: 16/17 itens, cha em sache e sinais Premium insuficientes. As portas nao foram relaxadas.

## Limites

- ficha recuperada nao substitui teste de producao nem responsavel tecnico;
- o ajuste de litros nao cria sabor, marca ou bebida nova;
- compras de ingredientes de bebidas preparadas continuam ligadas as quantidades informadas no cardapio e exigem conferencia operacional;
- nenhum valor financeiro e calculado nesta regra.
