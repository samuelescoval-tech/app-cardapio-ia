# Regra de coerencia por evento e blocos

## Decisao arquitetural

O Chef IA Studio usa duas camadas complementares:

1. **Apresentacao por blocos:** agrupa variacoes relacionadas, como sucos, refrigerantes, carnes bovinas, carnes suinas, aves, doces e sobremesas.
2. **Operacao por item:** preserva cada preparacao com `id`, quantidade, ingredientes, receita e origens na lista de compras.

Agrupar diretamente os itens operacionais quebraria quantidades, receitas e compras. Manter somente itens atomicos deixaria a apresentacao inflada. As duas camadas resolvem os dois problemas sem duplicar dados.

## Ordem da geracao

1. Identificar o tipo de evento.
2. Aplicar significado social ou cultural.
3. Adicionar tema e refeicao como camadas, sem substituir o evento principal.
4. Aplicar estilo Simples, Elegante ou Premium.
5. Estruturar restricoes alimentares.
6. Considerar o orcamento apenas como envelope de decisao, sem inventar precos.
7. Escolher blocos coerentes de alimentos, bebidas e decoracao.
8. Detalhar itens, quantidades, receitas, compras e operacao.

## Catalogo de contexto

O arquivo `data/culinary/event-contexts.json` guarda significado, blocos alimentares, bebidas, cores, decoracao, sinais Premium e inadequacoes. A primeira versao cobre:

- debutante;
- Natal;
- Ano Novo;
- Pascoa;
- aniversario infantil;
- casamento;
- evento corporativo;
- churrasco;
- festa junina;
- tema tropical;
- brunch.

Tipo, tema e refeicao podem ser combinados. O tipo reconhecido permanece como camada principal.

## Restricoes

Sem lactose, sem gluten, vegetariano e vegano recebem blocos estruturados com itens a evitar e alternativas preferenciais. Isso orienta a geracao, mas nao promete ausencia de alergenicos ou contaminacao cruzada.

## Orcamento

O valor informado recebe estado `orientador_sem_cotacao`. Ele pode limitar escolhas e gerar pendencias de cotacao, mas nao vira custo, preco de mercado ou promessa de viabilidade. Valores continuam `A cotar` ate existir catalogo regional com fonte e data-base.

## Apresentacao

- O carrossel mostra blocos, nao cada sabor isolado.
- A lista usa os mesmos blocos.
- Cada bloco pode ser expandido para revelar itens e quantidades.
- Receitas e compras continuam detalhadas por item.
- Planejamentos antigos recebem agrupamento de compatibilidade por categoria.
- O PDF mostra primeiro contexto e blocos; o detalhamento operacional vem depois.

## Evidencia de 2026-07-14

| Cenario | Itens operacionais | Blocos | Receitas | Compras | PDF |
|---|---:|---:|---:|---:|---:|
| Corporativo Premium | 17 | 12 | 15 | 35 | 70.588 bytes |
| Churrasco | 19 | 13 | 14 | 30 | 67.417 bytes |
| Natal | 19 | 11 | 14 | 32 | 69.680 bytes |

Os tres cenarios passaram em historico, recarga, viewport 400/400 e PDF pesquisavel. O corporativo permaneceu em `revisar` por falta de evidencia de louca/acabamento e estacao especial de bebidas; agrupamento visual nao substitui a porta de qualidade Premium.

## Limites preservados

- Imagens exigem fonte, licenca, atribuicao e fallback antes da integracao.
- Fornecedores e precos por usuario continuam em fase futura.
- Spoonacular permanece desativado.
- Dados enviados por clientes nao alimentam uma base geral de precos sem validacao.
