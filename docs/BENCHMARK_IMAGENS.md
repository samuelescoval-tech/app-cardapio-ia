# Benchmark de referencias visuais

## Objetivo

Medir cobertura e relevancia das fontes sem gerar um novo evento no Gemini, sem gravar imagens e sem solicitar chave ao usuario.

Foram usados cinco contextos: debutante, corporativo Premium, Natal, churrasco e infantil. Cada contexto consultou capa, prato principal e sobremesa, totalizando 15 slots.

## Openverse - antes e depois

| Medida | Consulta antiga | Consulta refinada |
|---|---:|---:|
| Resultado contextual | 1/15 | 12/15 |
| Recuo generico | 4/15 | 3/15 |
| Vazio ou erro | 10/15 | 0/15 |

A consulta antiga concatenava contexto, estilo e termos longos do slot. A versao refinada usa expressoes curtas e especificas por contexto, como `quinceanera cake`, `corporate catering`, `Christmas desserts`, `Brazilian barbecue` e `birthday cake`.

O estilo continua preservado como metadado, mas deixou de ser uma palavra obrigatoria na busca porque termos como `luxury`, `refined` e `elegant` reduziam fortemente a cobertura sem provar qualidade visual.

O Openverse continua imperfeito: alguns titulos sao genericos e a relevancia final precisa de avaliacao humana. A selecao agora evita repetir a mesma obra entre slots e devolve ate tres alternativas transitorias para troca local.

Comando:

```bash
npm run benchmark:images
```

## Wikimedia Commons - sonda experimental

A API direta do Commons foi avaliada com as mesmas consultas e sem chave. A sonda recebeu 52 candidatos antes dos filtros finais e encontrou alguma licenca inicialmente compativel em 9/15 slots. O resultado nao justifica integracao automatica neste momento:

- houve resultados semanticamente incorretos, como imagens ferroviarias para `corporate desserts`;
- a busca retornou PDF e video com miniatura, exigindo filtro adicional por MIME;
- licencas CC BY-SA foram corretamente rejeitadas pela politica atual;
- a API respondeu HTTP 429 antes do fim da rodada;
- a cobertura observada ficou abaixo do Openverse refinado.

A sonda foi endurecida depois do teste para aceitar somente MIME `image/*`, aplicar recuo em 429 e manter apenas CC0, dominio publico ou CC BY. A rodada nao foi repetida no mesmo dia para nao insistir sobre o limite do provedor.

Comando futuro:

```bash
npm run benchmark:images:commons
```

## Decisao

1. Openverse permanece como fonte externa automatica e complementar.
2. SVGs locais permanecem como contingencia oficial.
3. Wikimedia Commons fica apenas como fonte experimental/manual.
4. Nenhuma politica de licenca foi ampliada automaticamente.
5. Nenhuma chave nova e necessaria.
6. Imagens continuam fora do historico e PDF.

## Fontes oficiais consultadas

- [Openverse API](https://api.openverse.org/)
- [Algoritmo de busca do Openverse](https://docs.openverse.org/api/reference/search_algorithm.html)
- [Wikimedia APIs](https://www.mediawiki.org/wiki/Wikimedia_APIs)
- [Commons API](https://commons.wikimedia.org/wiki/Commons:API)
- [MediaWiki Imageinfo](https://www.mediawiki.org/wiki/API:Imageinfo/en)
- [CommonsMetadata](https://www.mediawiki.org/wiki/Extension:CommonsMetadata/en)

