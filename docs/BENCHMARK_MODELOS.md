# Benchmark de modelos do Chef IA

## Objetivo

Comparar modelos com os mesmos eventos e uma pontuacao tecnica reproduzivel antes de trocar o modelo usado no aplicativo.

A pontuacao nao afirma que um evento e Premium ou comercialmente excelente. Essa aprovacao continua dependendo de avaliacao humana.

## Catalogo

O arquivo `data/benchmarks/model-comparison.json` contem dez cenarios:

1. debutante;
2. corporativo Premium;
3. Natal;
4. casamento;
5. churrasco;
6. infantil;
7. atendimento domiciliar;
8. Pascoa;
9. Carnaval;
10. Ano Novo.

Os tres primeiros formam o ciclo rapido. O catalogo completo somente deve ser executado depois que o ciclo rapido passar e houver cota disponivel.

## Pontuacao tecnica

- contrato e JSON validado: 20 pontos;
- composicao minima por categoria: 20 pontos;
- repertorio esperado e pedidos explicitos: 20 pontos;
- receitas ligadas aos preparos: 15 pontos;
- ingredientes ligados as compras: 10 pontos;
- estado da revisao culinaria: 5 pontos;
- ausencia de avisos: 5 pontos;
- conclusao normal do modelo: 5 pontos.

Tempo, tokens e versao efetivamente respondida sao registrados, mas o tempo nao reduz a pontuacao de qualidade.

## Comandos

Conferir a matriz sem chamar a API:

```bash
npm run benchmark:models:dry
```

Executar o ciclo rapido com o modelo configurado e o candidato padrao:

```bash
npm run benchmark:models
```

Escolher modelos ou cenarios:

```bash
npm run benchmark:models -- --models=gemini-flash-lite-latest,gemini-3.5-flash --scenarios=debutante,natal
```

Executar os dez cenarios:

```bash
npm run benchmark:models -- --full
```

Os relatorios sao gravados em `/tmp` por padrao. Eles nao incluem a chave da API.

## Regra de decisao

Um modelo candidato nao deve substituir o atual por uma unica amostra. A troca exige:

1. todas as geracoes concluidas;
2. contrato valido em todos os cenarios;
3. melhoria consistente de repertorio ou reducao de avisos;
4. consumo compativel com a cota gratuita;
5. avaliacao humana de pelo menos um evento Premium e um evento familiar.

## Ciclo rapido de 2026-07-14

O primeiro ciclo real comparou os dois modelos com o mesmo limite de 8.192 tokens de geracao e o mesmo prompt.

| Modelo | Conclusoes | Pontuacao tecnica media | Tempo medio | Tokens totais medios |
| --- | ---: | ---: | ---: | ---: |
| `gemini-flash-lite-latest` | 3/3 | 92,7 | 15,7 s | 16.696 |
| `gemini-3.5-flash` | 0/3 | 0 | 45,5 s | 19.234 |

Resultados do modelo atual:

- debutante: 92/100, repertorio esperado 5/5, tres avisos;
- corporativo Premium: 91/100, repertorio esperado 4/5, um aviso;
- Natal: 95/100, repertorio esperado 3/3, um aviso.

O Gemini 3.5 Flash terminou os tres casos com `MAX_TOKENS` e JSON incompleto. O total de tokens indica que o modelo consumiu quase todo o limite com processamento interno antes de concluir a resposta extensa.

Decisao: nao trocar o modelo por configuracao. Primeiro dividir o planejamento em blocos menores, registrar tokens de pensamento e somente entao repetir o ciclo rapido. O resultado tambem reforca a migracao futura do SDK legado para o SDK atual do Gemini, onde o nivel de raciocinio pode ser configurado explicitamente.
