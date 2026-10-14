# Imagens do cardapio — Sprint 5

O Karamu usa fotos autorizadas pelo proprietario, ilustracoes da biblioteca
local e referencias externas. Os rotulos distinguem essas fontes: uma
ilustracao da familia nao comprova a aparencia exata da receita gerada.

A biblioteca agora cobre brigadeiro, beijinho, coxinha, arroz/risoto, pudim,
bolo e salada de folhas. Os cinco novos SVGs sao desenhos originais do projeto.
Ingredientes, recheios e sabores diferentes continuam descritos no plano;
nao sao inventadas fotografias especificas para preencher os cards.

Fotos compartilhadas na galeria podem ser selecionadas para o mesmo nome de
prato, incluindo uma lista pequena de plurais equivalentes. Por exemplo,
Brigadeiro corresponde a Brigadeiros; Brigadeiro de morango permanece outro
nome. Nao usar aproximação por substring ou apagar ingredientes do nome.
Compartilhar somente por link nao autoriza inclusao na galeria.

Buscas externas sao limitadas a tres simultaneas e um prazo global de 12
segundos; a consulta ao catalogo autorizado recebe ate dois segundos. O
resultado mantem a ordem do cardapio e evita repetir fotografias externas.
Uma falha ou cota indisponivel deixa a biblioteca local disponivel.

Durante o carregamento, o card preserva espaco e anuncia o estado ocupado.
Uma imagem quebrada ou foto cuja autorizacao foi revogada usa a proxima
alternativa segura. O credito e o link mudam junto com a imagem; nao ficam
atribuindo a ilustração ao dono da foto anterior. Se as alternativas falharem,
o menu volta a uma identificacao neutra. Erros atrasados de um card anterior
nao substituem a imagem do evento atual.

Essa etapa nao adiciona receitas/doces ao plano, nao muda o historico salvo
e nao publica fotos particulares. Qualidade culinaria, login persistente,
controle de demo e redesign amplo ficam nas frentes registradas no roadmap.

## Verificacao reproduzivel

No Node 24:

```sh
npm test
node scripts/validate-images-ui.js
```

O segundo comando precisa de `google-chrome`. Usa perfil temporario e API
ficticia local, bloqueia destinos externos e nao consome IA nem grava no
Supabase. Verifica carregamento, recuperacao e layout em 1280/390/320px.
Capturas ficam em `/tmp/karamu-imagens-{1280,390,320}.png`.

Nenhuma migracao nova ou credencial adicional e necessaria. A utilizacao
real das fotos autorizadas continua dependendo da migracao 007 e da
configuracao existente. Evidencias e publicacao ficam no handoff e roadmap.
