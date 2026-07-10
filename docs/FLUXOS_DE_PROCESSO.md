# Fluxos de Processo - Chef IA Studio

<!-- CODEX:LER_POR_PROCESSO
Ler este documento quando a tarefa envolver fluxo de uso, fluxo tecnico, acesso demo, geracao, PDF, historico ou documentacao.
Este arquivo existe para deixar os fluxos faceis de achar sem procurar dentro dos documentos maiores.
-->

<!-- CODEX:LER_POR_PROCESSO
Antes de alterar qualquer etapa do fluxo principal, conferir o Fluxo 1 e o Fluxo 2.
Antes de mexer em acesso demo, conferir o Fluxo 3.
Antes de mexer em PDF, conferir o Fluxo 4.
Antes de mexer em documentacao, conferir o Fluxo 5.
-->

<!-- CODEX:MANTER_EM_LINHA
Atualizar somente o fluxo alterado. Atualizar requisitos apenas se o comportamento esperado mudar.
Registrar no handoff se a mudanca afetar estado ou proximo passo.
-->

Documento dedicado aos fluxos do Chef IA Studio.

Ultima atualizacao: 2026-07-10

## Onde estavam antes

- BPMN simplificado: `docs/MATERIAL_APOIO_PROCESSOS_E_REQUISITOS.md`, secao "BPMN simplificado do fluxo atual".
- Fluxo geral de uso: `docs/ANALISE_REQUISITOS_ATORES_CASOS_USO.md`, secao "Fluxo geral de uso".
- Casos de uso: `docs/ANALISE_REQUISITOS_ATORES_CASOS_USO.md`, secoes `UC-01` a `UC-10`.

Este arquivo replica e organiza os fluxos principais para consulta rapida.

## Indice rapido

| Fluxo | Nome | Quando ler |
|---|---|---|
| Fluxo 1 | Macroprocesso ponta a ponta | Sempre que decidir proxima etapa |
| Fluxo 2 | Geracao de planejamento | Ao mexer em formulario, backend, motor, IA ou render |
| Fluxo 3 | Acesso demo | Ao mexer em `DEMO_ACCESS_KEY`, senha, modal ou teste externo |
| Fluxo 4 | Exportacao PDF | Ao mexer no botao PDF, layout do PDF ou resultado renderizado |
| Fluxo 5 | Atualizacao documental | Ao mudar codigo, fluxo, requisito, prioridade ou gargalo |
| Fluxo 6 | Demo controlada externa | Ao preparar link temporario, roteiro de tester ou Porta de Passagem |

## Proxima atualizacao curta

Objetivo: evitar repeticao de testes e deixar a trilha pronta para teste externo controlado.

1. Consultar `docs/HANDOFF_PROXIMA_ATUALIZACAO.md`, secao Registro de testes e validacoes.
2. Registrar evidencias dos testes manuais ja feitos pelo usuario para modal, geracao real e PDF.
3. Seguir o Fluxo 6 - Demo controlada externa se nao houver falha aberta.

Fora desta rodada:

- Separar pitch.
- Motor adultos/criancas.
- Login, banco, pagamento ou SaaS.
- Migracao de SDK Gemini.

## Fluxo 1 - Macroprocesso ponta a ponta

```mermaid
flowchart LR
    inicio([Inicio])
    abrir["Usuario abre app"]
    status["Frontend consulta status"]
    preencher["Usuario preenche evento"]
    acesso{"Demo exige senha?"}
    senha["Usuario informa senha"]
    gerar["Usuario solicita geracao"]
    backend["Backend recebe evento"]
    motor["Motor local calcula numeros"]
    prompt["Backend monta prompt"]
    ia["Gemini gera plano"]
    validar["Backend valida JSON"]
    aplicar["Backend aplica motor ao plano"]
    render["Frontend renderiza resultado"]
    historico["Frontend salva historico"]
    pdf["Usuario baixa PDF"]
    validarSaida{"Resultado e PDF OK?"}
    ajustar["Registrar ajuste"]
    docs["Atualizar docs vivos"]
    fim([Fim])

    inicio --> abrir
    abrir --> status
    status --> preencher
    preencher --> acesso
    acesso -->|"Sim"| senha
    acesso -->|"Nao"| gerar
    senha --> gerar
    gerar --> backend
    backend --> motor
    motor --> prompt
    prompt --> ia
    ia --> validar
    validar --> aplicar
    aplicar --> render
    render --> historico
    historico --> pdf
    pdf --> validarSaida
    validarSaida -->|"Sim"| docs
    validarSaida -->|"Nao"| ajustar
    ajustar --> docs
    docs --> fim
```

Entradas:

- Dados do evento.
- Senha demo, quando ativa.
- Configuracao Gemini no `.env`.

Saidas:

- Planejamento renderizado.
- Historico local.
- PDF.
- Documentacao atualizada quando houver mudanca relevante.

## Fluxo 2 - Geracao de planejamento

```mermaid
flowchart TD
    inicio([Inicio])
    capturar["Capturar campos do formulario"]
    validarMinimo{"Tipo e pessoas existem?"}
    montarEvento["Montar objeto evento"]
    enviar["POST /gerar-cardapio"]
    validarSenha{"Senha demo valida?"}
    validarEvento{"Evento valido?"}
    erroEntrada["Retornar 400 com campo e mensagem"]
    calcularMotor["calcularMotorEvento"]
    montarPrompt["montarPromptPlanejamento"]
    chamarGemini["gerarPlano no Gemini"]
    extrair["extrairJSON"]
    validarPlano["validarPlano"]
    aplicarMotor["aplicarMotorAoPlano"]
    responder["Retornar resposta normalizada"]
    renderizar["exibirResultadoLuxo"]
    salvar["salvarHistorico"]
    fim([Fim])

    inicio --> capturar
    capturar --> validarMinimo
    validarMinimo -->|"Nao"| fim
    validarMinimo -->|"Sim"| montarEvento
    montarEvento --> enviar
    enviar --> validarSenha
    validarSenha -->|"Nao"| fim
    validarSenha -->|"Sim"| validarEvento
    validarEvento -->|"Nao"| erroEntrada
    erroEntrada --> fim
    validarEvento -->|"Sim"| calcularMotor
    calcularMotor --> montarPrompt
    montarPrompt --> chamarGemini
    chamarGemini --> extrair
    extrair --> validarPlano
    validarPlano --> aplicarMotor
    aplicarMotor --> responder
    responder --> renderizar
    renderizar --> salvar
    salvar --> fim
```

Arquivos principais:

- `public/js/app.js`
- `server.js`
- `src/services/planning/motor.service.js`
- `src/prompts/event.prompt.js`
- `src/services/ai/gemini.service.js`
- `src/utils/extract-json.js`
- `src/utils/validate-event.js`
- `src/utils/validate-plan.js`
- `public/js/render.js`
- `public/js/storage.service.js`

Validacoes ligadas:

- `VAL-03`
- `VAL-14`
- `VAL-05`
- `VAL-06`
- `VAL-07`
- `VAL-08`
- `VAL-09`

## Fluxo 3 - Acesso demo

```mermaid
flowchart TD
    inicio([Inicio])
    status["GET /api/status"]
    verificar{"demo_access.required?"}
    usoLivre["Seguir sem senha"]
    pedirSenha["Abrir modal de senha"]
    salvarSessao["Salvar senha em sessionStorage"]
    enviarHeader["Enviar x-demo-access-key"]
    backend{"Header igual DEMO_ACCESS_KEY?"}
    liberar["Liberar geracao"]
    negar["Retornar 401"]
    limpar["Limpar senha salva"]
    erro["Mostrar erro claro"]
    fim([Fim])

    inicio --> status
    status --> verificar
    verificar -->|"Nao"| usoLivre
    verificar -->|"Sim"| pedirSenha
    pedirSenha --> salvarSessao
    salvarSessao --> enviarHeader
    enviarHeader --> backend
    backend -->|"Sim"| liberar
    backend -->|"Nao"| negar
    negar --> limpar
    limpar --> erro
    usoLivre --> fim
    liberar --> fim
    erro --> fim
```

Estado atual:

- O frontend usa modal de acesso demo com campo de senha, erro inline, cancelamento e foco automatico.
- A senha continua salva apenas em `sessionStorage` e enviada no header `x-demo-access-key`.

Validado nesta rodada:

- `GET /api/status` confirmou `demo_access.required: true`.
- `POST /gerar-cardapio` sem senha retornou 401.
- `POST /gerar-cardapio` com senha incorreta retornou 401.
- `POST /gerar-cardapio` com senha correta retornou 200, `ok: true`, `schema_ok: true`, `motor_local: true` e `prompt_backend: true`.
- Chrome headless carregou a pagina com o markup do modal.

Arquivos principais:

- `public/index.html`
- `public/js/app.js`
- `public/css/modules/form.css`
- `server.js`
- `.env.example`

Validacoes ligadas:

- `VAL-04`
- `VAL-05`
- `UC-04`

## Fluxo 4 - Exportacao PDF

```mermaid
flowchart TD
    inicio([Inicio])
    existePlano{"Existe ultimo plano renderizado?"}
    erroPlano["Avisar para gerar ou carregar planejamento"]
    jsPdf{"jsPDF disponivel?"}
    imprimir["Usar window.print"]
    criarDoc["Criar documento A4"]
    cabecalho["Montar cabecalho e resumo"]
    secoes["Adicionar secoes do evento"]
    paginar["Controlar quebras de pagina"]
    rodape["Adicionar rodape"]
    salvar["Salvar arquivo PDF"]
    revisar{"PDF legivel?"}
    ajustar["Ajustar layout ou conteudo"]
    fim([Fim])

    inicio --> existePlano
    existePlano -->|"Nao"| erroPlano
    existePlano -->|"Sim"| jsPdf
    jsPdf -->|"Nao"| imprimir
    jsPdf -->|"Sim"| criarDoc
    criarDoc --> cabecalho
    cabecalho --> secoes
    secoes --> paginar
    paginar --> rodape
    rodape --> salvar
    salvar --> revisar
    revisar -->|"Sim"| fim
    revisar -->|"Nao"| ajustar
    erroPlano --> fim
    imprimir --> fim
    ajustar --> fim
```

Arquivos principais:

- `public/js/render.js`
- `public/index.html`

Validacoes ligadas:

- `VAL-10`
- `VAL-11`
- `UC-06`

## Fluxo 5 - Atualizacao documental

```mermaid
flowchart TD
    inicio([Inicio])
    mudou{"Mudou codigo, fluxo, requisito ou prioridade?"}
    semDoc["Nao atualizar docs vivos"]
    processo{"Mudou processo ou gargalo?"}
    uso{"Mudou ator, caso de uso ou validacao?"}
    prioridade{"Mudou proxima etapa?"}
    indice{"Criou, removeu ou recuperou doc?"}
    material["Atualizar MATERIAL_APOIO_PROCESSOS_E_REQUISITOS"]
    casos["Atualizar ANALISE_REQUISITOS_ATORES_CASOS_USO"]
    handoff["Atualizar HANDOFF_PROXIMA_ATUALIZACAO"]
    roadmap["Atualizar ROADMAP_ATUAL"]
    readme["Atualizar docs/README"]
    audit["Atualizar CLEANUP_AUDIT"]
    fim([Fim])

    inicio --> mudou
    mudou -->|"Nao"| semDoc
    mudou -->|"Sim"| processo
    processo -->|"Sim"| material
    processo -->|"Nao"| uso
    material --> uso
    uso -->|"Sim"| casos
    uso -->|"Nao"| prioridade
    casos --> prioridade
    prioridade -->|"Sim"| handoff
    prioridade -->|"Nao"| indice
    handoff --> roadmap
    roadmap --> indice
    indice -->|"Sim"| readme
    indice -->|"Nao"| fim
    readme --> audit
    audit --> fim
    semDoc --> fim
```

Regra:

- Documento novo vivo deve nascer com marcadores `CODEX:`.
- Mudanca em fluxo deve atualizar este arquivo e os documentos que ele referencia.

## Fluxo 6 - Demo controlada externa

```mermaid
flowchart TD
    inicio([Inicio])
    janela["Consultar Janela de Previa no docs/README"]
    registro["Consultar Registro de testes e validacoes"]
    evidencias{"Evidencias manuais estao registradas?"}
    registrar["Registrar evidencias pendentes no handoff"]
    falha{"Ha falha aberta em geracao, senha, resultado ou PDF?"}
    corrigir["Corrigir somente o fluxo afetado"]
    senha{"DEMO_ACCESS_KEY esta ativa?"}
    ativar["Ativar senha temporaria no .env local/ambiente"]
    link["Preparar link temporario"]
    roteiro["Enviar roteiro curto para tester"]
    testar["Tester gera evento realista e baixa PDF"]
    feedback["Coletar feedback objetivo"]
    registrarFeedback["Registrar feedback e falhas no handoff"]
    fim([Fim])

    inicio --> janela
    janela --> registro
    registro --> evidencias
    evidencias -->|"Nao"| registrar
    evidencias -->|"Sim"| falha
    registrar --> falha
    falha -->|"Sim"| corrigir
    falha -->|"Nao"| senha
    corrigir --> fim
    senha -->|"Nao"| ativar
    senha -->|"Sim"| link
    ativar --> link
    link --> roteiro
    roteiro --> testar
    testar --> feedback
    feedback --> registrarFeedback
    registrarFeedback --> fim
```

Escopo do teste:

- Gerar um planejamento realista.
- Conferir modal de senha, resultado principal, historico e PDF.
- Reportar somente falhas ou confusoes do fluxo principal.

Fora do teste:

- Login, banco, pagamento ou SaaS.
- Motor adultos/criancas.
- Refatoracao do pitch.
- Agentes IA autonomos.
- Testes repetidos sem mudanca relacionada.

Entrada esperada do feedback:

- Tipo de evento.
- Numero de convidados.
- Navegador/dispositivo.
- Passo em que falhou ou confundiu.
- Print ou descricao curta, quando possivel.

## Comandos para encontrar fluxos

```bash
rg -n "Fluxo [0-9]|flowchart|BPMN|UC-" docs
```

```bash
rg -n "CODEX:" docs
```
