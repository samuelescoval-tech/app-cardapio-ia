# Imagens, fontes e licencas - Chef IA Studio

## Estado atual

A infraestrutura visual esta conectada automaticamente ao resultado validado. A galeria permanece separada do plano culinario, do historico e do PDF.

O objetivo desta separacao e impedir que uma falha externa quebre a geracao do evento e evitar persistencia de imagens ou URLs cuja disponibilidade e licenca podem mudar.

## Integracao na interface

- A consulta comeca somente depois que o planejamento foi validado, renderizado e salvo.
- O carregamento de imagens nao bloqueia cardapio, receitas, compras, historico ou PDF.
- A galeria oferece carrossel e lista, com cartoes uniformes e controles proprios.
- Cada imagem externa exibe autoria, licenca, atribuicao e link para a fonte original.
- URLs externas precisam usar HTTPS; caminhos locais ficam limitados a `public/images/fallback/`.
- Falha de endpoint ou de arquivo individual troca a imagem por um SVG local.
- Projetos carregados do historico exibem somente fallbacks locais e informam que as referencias externas nao foram salvas.
- `prepararPlanoParaHistorico()` remove defensivamente campos visuais transitorios caso sejam anexados ao plano no futuro.

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

## Validacao da interface em 2026-07-14

- `npm test`: 20 arquivos aprovados.
- `node --check`: app, render e storage aprovados.
- Chrome headless: cinco imagens, cinco linhas de credito e `aria-busy=false`.
- Mobile: viewport/documento `390/390`, sem overflow e quatro controles com 44 px.
- A troca para lista atualizou `aria-pressed` e ocultou as setas do carrossel.
- A captura recortada confirmou hierarquia, legibilidade, cartoes e aviso de nao persistencia.
- A validacao nao chamou Gemini nem Openverse; usou dados e SVGs locais.

## Refinamento de relevancia em 2026-07-14

- O benchmark inicial encontrou somente 1/15 resultados contextuais, 4/15 recuos genericos e 10/15 vazios.
- Consultas curtas por contexto elevaram a cobertura para 12/15 contextuais, 3/15 recuos e zero vazios.
- A selecao evita repetir a mesma obra em slots diferentes e preserva alternativas da mesma resposta.
- A tela permite trocar ou ocultar uma referencia sem nova chamada e sem regenerar o evento.
- Um caminho local incorreto (`savory-course.svg`) foi corrigido para o arquivo existente `savory-food.svg`.
- A validacao real confirmou zero imagens quebradas e as novas acoes no mobile.
- A sonda Wikimedia Commons encontrou resultados permitidos, mas tambem ruido semantico, arquivos que nao eram imagens e HTTP 429; nao foi integrada automaticamente.
- Evidencias e fontes: `docs/BENCHMARK_IMAGENS.md`.

## Avaliacao local em 2026-07-14

- Cada imagem pode ser marcada como adequada, generica ou inadequada.
- A nota fica somente no navegador, ligada ao identificador exato da imagem.
- Uma imagem inadequada troca automaticamente quando existe alternativa ja carregada.
- Repeticoes futuras do mesmo identificador sao reordenadas; nao ha generalizacao por evento ou usuario.
- O limite local e de 250 preferencias, sem URLs, evento, observacoes ou dados pessoais.
- O usuario pode limpar apenas as preferencias visuais sem apagar o historico.
- Contrato e roteiro de avaliacao: `docs/AVALIACAO_VISUAL_LOCAL.md`.

## Proxima porta

1. usuario gerar e avaliar imagens em eventos reais;
2. observar o resumo local de adequadas, genericas e inadequadas;
3. estudar pontuacao por titulo/tags somente depois dessa avaliacao;
4. manter Commons apenas como sonda ate existir estrategia de cota e relevancia;
5. manter imagens fora do PDF ate validar CORS, estabilidade e politica de reutilizacao;
6. avaliar Pexels somente se o ganho justificar cadastro e chave gratuita.
