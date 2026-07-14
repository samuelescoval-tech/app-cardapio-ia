# Imagens, fontes e licencas - Chef IA Studio

## Estado atual

A infraestrutura visual existe, mas ainda nao esta conectada automaticamente ao resultado, historico ou PDF.

O objetivo desta separacao e impedir que uma falha externa quebre a geracao do evento e evitar persistencia de imagens sem metadados de licenca.

## Dicionario visual

`data/images/visual-dictionary.json` define:

- dez contextos de evento;
- modificadores Simples, Elegante e Premium;
- oito slots: capa, entrada, principal, acompanhamento, salada, sobremesa, bebida e ambiente;
- limite de oito imagens por evento;
- consulta contextual e consulta generica de recuo;
- fallback SVG local por slot.

## Contrato permitido

Toda imagem precisa manter:

- id e slot;
- provider;
- URL HTTPS da imagem e miniatura;
- pagina original da obra;
- criador e pagina do criador, quando informados;
- licenca e URL da licenca;
- texto de atribuicao;
- texto alternativo;
- indicacao de fallback.

As licencas externas aceitas nesta fase sao `CC0`, `PDM` e `CC BY`. Licencas ShareAlike, nao comerciais ou sem metadados suficientes ficam fora da selecao automatica inicial.

## Openverse

O cliente usa acesso anonimo, sem chave, com:

- conteudo maduro desativado;
- filtro de uso comercial;
- somente URLs HTTPS;
- ate quatro candidatos normalizados por consulta;
- cache em memoria por 24 horas;
- limite local padrao de 40 consultas por dia;
- no maximo uma consulta contextual e uma generica por slot.

O endpoint `POST /api/imagens-evento` usa o mesmo controle de acesso da demonstracao e retorna fallbacks locais quando o provider estiver indisponivel.

## Evidencia ao vivo de 2026-07-14

- A consulta contextual de evento corporativo Premium nao retornou resultados.
- A busca de recuo `table setting` retornou uma imagem HTTPS do Flickr indexada pelo Openverse.
- Licenca: CC BY 2.0.
- Criador: Tracy Hunter.
- Pagina original e atribuicao foram preservadas.

Conclusao: Openverse e adequado como fonte gratuita complementar e fallback de descoberta. Sua cobertura contextual nao e suficiente para ser a unica fonte de imagens Premium.

## Proxima porta

1. buscar imagens somente depois que o planejamento estiver validado;
2. exibir uma galeria separada com estado de carregamento e fallback;
3. manter atribuicao visivel junto da imagem;
4. testar falha de URL e mobile;
5. nao persistir imagem externa no historico ate definir politica de selecao;
6. testar CORS antes de incorporar qualquer imagem ao PDF;
7. avaliar Pexels como fonte principal quando houver chave gratuita.
