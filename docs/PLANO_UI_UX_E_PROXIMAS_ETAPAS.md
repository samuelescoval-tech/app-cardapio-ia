# Karamu — refinamento UI/UX e próximas etapas

Registrado em 2026-10-14 e atualizado em 2026-11-16. As Sprints 6A e 6B foram
concluídas e publicadas pelos PRs 11 e 12. Projetos/Perfil, novos protótipos Figma,
imagens e a animação de entrada continuam na revisão visual posterior e Sprint 7.

## Ponto de partida

- Sprints 4 e 5 publicadas. Fornecedores/produtos, fotos autorizadas e projetos
  privados permanecem entregas concluídas. A suíte de 243 testes foi executada
  novamente após este primeiro lote visual, com todos aprovados.
- Confirmações anteriores do usuário continuam válidas. Não solicitar novamente
  a mesma rodada de login/logout, isolamento, fornecedores, fotos e projetos/PDF.
- A migração 008 foi relatada como provavelmente aplicada. Não reaplicar por
  padrão nem confundir publicação no GitHub com aplicação no Supabase.
- Manter HTML/CSS/JavaScript, Express e Supabase. Refinar por componentes e fluxos,
  com branches e PRs pequenos, sem reescrever o produto.
- Histórico antigo sem dono continua preservado. Sua recuperação exige decisão
  específica; não deve ser atribuído automaticamente à conta atual.

## Primeiro lote implementado localmente — identidade e apresentação

A captura do usuário antecipou a apresentação para a Sprint 6A. Corrigida a
causa da dupla rolagem: painel interno de 100vh com rodapé externo, cujo
bloqueio era indevidamente compartilhado com login/demo. Agora a página tem
um único scroll e apenas modais reais bloqueiam o fundo.

Base editorial aplicada em `base.css`, `layout.css`, `form.css` e `pitch.css`:
títulos em três escalas, corpo 16–17px, rótulos/auxiliares 14px, contraste,
raios 8/12/16px, sombras discretas e fotos 4:3 sem inclinação. Logo e relação
visual da seção ativa preservados. CSS compartilhado foi conferido no perfil.

[Guia no Figma](https://www.figma.com/design/GhvrTeIvj1Y92o0G4Jt0Xy?node-id=3-2)
criado com variáveis, estilos e exemplos editáveis. Regras duráveis em
[MASTER.md](../design-system/karamu/MASTER.md). Isto é a base comum; protótipos
completos do Gerador/Projetos/Perfil e demais melhorias abaixo continuam pendentes.

Validação do primeiro lote: 243 testes Node 24 aprovados; regressão Chrome em
320/390/768/1280/1920px e reflow equivalente a 200% (viewport/DPR), com API fictícia,
incluindo fechar login/demo e Escape, rodapé, alternância entre seções sem perder
campos/capa e bloqueio de modais. Fornecedores/fotos conferidos em 320/390/1280px.
Capturas separadas em 390/1280px com Montserrat e Playfair realmente carregadas e
fotos decodificadas; somente recursos públicos de fontes/imagens liberados. Não houve
login real, IA ou alteração no Supabase. Nenhuma homologação antiga solicitada ao
usuário. Os lotes locais estão na branch `feature/gerador-ux`, ainda não publicados.

## Segundo lote implementado localmente — Gerador e resultado

O cabeçalho do Gerador ganhou introdução e atalho para projetos. O resultado agora
fica imediatamente após o formulário, antes do histórico. Tipo e convidados exibem
erros junto aos campos, com `aria-invalid`, `role="alert"` e foco no primeiro erro;
convidados exige inteiro entre 1 e 5000 e não usa mais `alert`. Os erros limpam ao
corrigir ou limpar a sessão, e a lista de sugestões não cobre a mensagem.

O estado de geração tem spinner, texto legível, botão desabilitado e rolagem até o
resultado. O cabeçalho concluído usa os tokens editoriais de tipografia, cor, raio
e sombra. Foram preservadas as correções de XSS e rolagem e o comportamento homologado.

Validação final: 246 testes Node 24 aprovados; `validate-presentation-ui.js` em
320/390/768/1280/1920px e reflow equivalente a 200%, incluindo erros inline, sugestões,
rolagem única, modais, capa e navegação. Estados vazio/inválido em 1280px e inválido,
gerando/concluído em 390px e 1280px inspecionados com dados fictícios, sem IA, login
ou Supabase reais; sem transbordamento horizontal. `git diff --check` aprovado.

## Diagnóstico inicial e melhorias ainda a completar

| Prioridade | Evidência observada antes deste lote | Situação / próxima melhoria |
| --- | --- | --- |
| Alta | `public/css/modules/layout.css:3`: barra fixa sem compensação de rolagem. Em Chrome local, ao posicionar o campo Convidados a 30px do topo, a barra o cobriu parcialmente em 1280, 390 e 320px. | Compensação de destinos aplicada neste lote. Revisar também foco de teclado e estados dos demais fluxos. |
| Alta | `public/css/modules/form.css:20` e `public/css/modules/base.css:11`: rótulos de cerca de 11,5px, dourado `#b8860b` sobre branco, contraste aproximado 3,25:1. | Aplicado nos fundamentos, navegação, formulário e cabeçalho do resultado. Conferir os demais estados do perfil no próximo lote. |
| Alta | `public/js/app.js:627` e `:642`, `public/index.html:527`: perfil abre sem mover foco, fecha sem devolvê-lo; backdrop e semântica de diálogo precisam ser coerentes. Chrome confirmou foco no botão Conta após abrir. | Definir comportamento modal, foco inicial/retorno, Escape, Tab e estado acessível das abas. |
| Alta | `public/js/app.js:695`: validação inicial de tipo/convidados usa `alert`; requisitos não aparecem claramente junto aos campos. | Implementado localmente: campos obrigatórios, erros inline acessíveis, foco no primeiro erro e inteiro de 1 a 5000 antes do envio. Validação no servidor preservada. |
| Alta | `public/index.html:494`, `public/js/app.js:1311`: botão Importar projeto Chef abre arquivo, mas a importação não existe. | Retirar a ação sem efeito do fluxo principal. Importação real, se retomada, terá escopo e validação próprios. Não apagar arquivos antigos. |
| Alta | `public/js/perfil.js:601`: saída ainda recomenda salvar PDF por histórico temporário; `public/privacidade.html:49–50` descreve histórico/memória antigos. | Avisos de saída e ajuda devem distinguir projeto confirmado na conta, gravação pendente e demo. Atualizar explicações públicas conforme o funcionamento efetivo. |
| Média | `public/css/modules/layout.css:300`: catálogo no painel de perfil de até 580px; `public/index.html:501`: projetos entre formulário e resultado. | Resultado agora vem antes dos projetos e há atalho no cabeçalho do Gerador. Resta prototipar um espaço confortável para fornecedor/produtos/fotos. Isso é oportunidade de organização, não prova de falha de salvamento. |
| Média | `public/index.html:678` em diante: apresentação longa e textos sobre geração de imagens, envio de e-mail, aprendizado individual e painel administrativo sem os respectivos fluxos encontrados nesta inspeção. | Encurtar apresentação, destacar a próxima ação e conferir cada promessa contra o código antes de publicá-la. |

As evidências desta tabela são da inspeção inicial, anterior ao lote acima;
as referências de linha correspondem àquela revisão. Inspeção no Chrome com
cópia local e dados fictícios, destinos HTTPS bloqueados.
Não houve login real, gravação em conta, chamada Gemini, Supabase ou Openverse.
Sem transbordamento horizontal nas três larguras inspecionadas. Capturas usam
fontes alternativas porque os recursos externos foram bloqueados; não representam
uma auditoria completa de tipografia ou todos os estados autenticados em produção.
Para revisar abertura do perfil, a carga de dados foi substituída por uma função
vazia; foco/posicionamento usam as funções reais do app.
Artefatos temporários: `/tmp/karamu-ux-review.json`,
`/tmp/karamu-ux-gerador-desktop.png`, `/tmp/karamu-ux-foco-320.png` e
`/tmp/karamu-ux-perfil-mobile.png`. Evidências resumidas acima para sobreviver
à limpeza de `/tmp`.

## Sequência definida

A Sprint 6 foi desdobrada para antecipar UI/UX funcional sem perder as pendências
de conta e comunicação. A qualidade do planejamento ganha uma entrega explícita.
As letras abaixo são etapas; cada etapa pode ter mais de um PR pequeno.

### 6A — identidade, apresentação e uso diário (em andamento)

1. Base visual, correção da apresentação e segundo lote do Gerador implementados
   localmente, incluindo estados vazio, inválido, gerando e concluído. Os protótipos
   de Gerador/resultado, Projetos e Perfil em desktop e celular continuam pendentes
   no Figma; a conexão está autenticada, mas precisa de um arquivo aberto/carregado.
2. Preservar creme, preto, dourado, logo e identidade editorial. Simplificar
   sombras, espaços e bordas; preferir cantos menos arredondados. Manter logo
   maior/texto menor na seção ativa e a relação inversa na outra seção.
3. No Gerador, o acesso a projetos e a proximidade entre ação e resultado foram
   implementados localmente. Manter opções avançadas recolhíveis e revisar o acesso
   sem percorrer todo o formulário ou ampliar excessivamente a barra.
4. No Perfil, preservar fornecedor e seus produtos/variedades no mesmo fluxo;
   explorar painel mais amplo no desktop e área confortável no celular.
   Fotos continuam com nome obrigatório, privadas por padrão e compartilhamento
   explícito por galeria/link. Indicar o alcance da autorização e sua revogação.
5. Contraste e erros junto aos campos do Gerador foram implementados localmente.
   Restam foco do perfil, mensagens de salvamento, demais ações com rótulos claros
   e retirada do botão de importação sem efeito. Manter expandir/recolher capa
   sempre acessível.

Aceite: navegação e foco visíveis; leitura confortável; estados e ações claros;
fluxos novos verificados em 320, 390, 768 e 1280px, zoom de 200%, teclado e
movimento reduzido. A entrega 6A foi concluída/publicada pelo PR 11. Projetos/Perfil
e novos protótipos ficam para a revisão visual posterior, sem reabrir esta entrega.
Testes de regressão pertinentes serão executados pelo agente; o usuário revisa o
novo visual, sem refazer homologações antigas.

### 6B — conta, demo e explicações coerentes (concluída e publicada)

- "Permanecer conectado" foi implementado como opt-in. A sessão temporária não
  aparece em nova aba; a opção persistente restaura a conta, e o logout sincronizado
  remove as credenciais e os dados privados da interface.
- A senha demo foi substituída por um planejamento fictício pronto, sem IA nem
  conta. Geração personalizada, imagens e referências externas exigem autenticação
  no frontend e no backend; `DEMO_ACCESS_KEY` saiu do fluxo e do exemplo de configuração.
- Privacidade, termos, mensagens de saída e ajuda agora descrevem projetos salvos,
  persistência opcional, exemplo sem IA e compartilhamento autorizado de fotos.
  Coerência técnica do texto não equivale a revisão jurídica concluída.

Validação: 252 testes no Node 24.21.0; apresentação em cinco larguras e reflow
de 200%; sessão no Chrome com SDK Supabase real/Auth fictício; galeria desktop e
mobile; recarga real do exemplo em 390px sem overflow. Não houve conta real, IA,
escrita no Supabase ou revisão Figma. O E2E autenticado real não foi executado.
PR 12 integrado, CodeQL/Vercel aprovados e arquivos/política conferidos em produção.
Não há SQL nem configuração externa nova a executar. A próxima etapa é a 6C.

### 6C — qualidade dos eventos gerados

- Aniversário infantil: incluir receitas de doces ou indicar claramente compra/
  encomenda, com quantidades e vínculo na lista de compras.
- Variar sucos e refrigerantes distribuindo o volume total entre opções; separar
  porções de bolo das unidades de docinhos.
- Fazer a auditoria refletir lacunas e alertas; não apresentar uma pontuação alta
  como garantia de completude.
- Diagnosticar por que uma tentativa foi recusada e a seguinte aceita. Preservar
  o último plano válido e explicar a falha; não enfraquecer a validação para aceitar
  qualquer resposta.

Aceite: casos fixos infantil/empresarial com cobertura esperada, receitas ou compra
explícita, quantidades consistentes e ausência de reaproveitamento indevido entre
eventos. A independência já foi homologada; novas regressões serão automatizadas.
As ilustrações da Sprint 5 não resolvem essas lacunas de conteúdo.

### 7 — apresentação e preparação para lançamento

- Reduzir a narrativa de apresentação e expor o acesso ao Gerador logo no início.
- Retomar no Figma a ideia salva de mesa gastronômica vista de cima, com movimento
  por rolagem. Experimentar camadas leves antes de 3D; a composição final continua
  em aberto. Preservar acesso imediato, celular e movimento reduzido.
- Conferir a jornada completa: entrar, gerar, revisar, salvar, recuperar e exportar.
  Pedir validação humana apenas do que mudou ou ainda depende de contexto real.
- Entregar o guia didático de construção do Karamu solicitado para o final do
  projeto, com exemplos do código real e exercícios de backend/Git.

## Manutenção durante essas etapas

Em PRs separados: rodar testes no CI com Node 24, revisar dependências e planejar
migração do SDK Gemini antigo. Os cinco avisos moderados registrados anteriormente
precisam de nova triagem antes de afirmar seu estado atual. Manter a stack e
organizar módulos conforme os fluxos forem alterados.

Fora desta entrega: pagamentos, expansão do catálogo regional, aumento do contexto
de preços enviado à IA e descarte/importação automática do histórico sem dono.

## Referências e critérios

- Preferências e fluxo: `../AGENTS.md` e `FLUXO_DE_TRABALHO.md`.
- Estado e pendências: `ROADMAP_ATUAL.md`, `HANDOFF_PROXIMA_ATUALIZACAO.md` e
  `AVALIACAO_TECNICA.md`.
- Skills usadas: UI UX Pro Max (buscas focadas em visibilidade do foco/teclado) e
  Web Design Guidelines. Diretrizes consultadas em 2026-10-14:
  [Web Interface Guidelines](https://raw.githubusercontent.com/vercel-labs/web-interface-guidelines/main/command.md).
  Aplicar contraste, foco, semântica, feedback e movimento reduzido ao contexto do
  Karamu; sugestões automáticas não substituem preferências do usuário.
