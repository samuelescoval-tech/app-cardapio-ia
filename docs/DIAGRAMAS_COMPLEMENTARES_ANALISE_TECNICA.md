# Diagramas Complementares e Analise Tecnica - Chef IA Studio

<!-- CODEX:LER_SEMPRE
Ler este documento quando a tarefa pedir diagramas complementares, sequencia, atividade, viabilidade, SGPD/LGPD, mapeamento, fluxo logico ou analise tecnica de complementaridade.
Este arquivo complementa FLUXOS_DE_PROCESSO.md e ANALISE_REQUISITOS_ATORES_CASOS_USO.md.
-->

<!-- CODEX:LER_POR_PROCESSO
Antes de alterar geracao, acesso demo, PDF, historico, dados de usuario ou documentacao, conferir o diagrama correspondente neste arquivo.
Depois da mudanca, atualizar o diagrama e a tabela de status dos artefatos.
-->

<!-- CODEX:MANTER_EM_LINHA
Se este documento mudar por decisao de produto ou arquitetura, alinhar README.md, HANDOFF_PROXIMA_ATUALIZACAO.md, ROADMAP_ATUAL.md, FLUXOS_DE_PROCESSO.md e MATERIAL_APOIO_PROCESSOS_E_REQUISITOS.md quando aplicavel.
-->

<!-- CODEX:FAZER
Proximo uso recomendado: validar o modal de acesso demo no navegador e revisar o PDF real antes de teste externo.
Depois validar complementaridade com UC-03, UC-04, UC-06, Fluxo 2, Fluxo 3 e Fluxo 4.
-->

Documento de apoio para artefatos complementares que nao cabiam claramente nos documentos anteriores.

Ultima atualizacao: 2026-07-08

## Status dos artefatos pedidos

| Artefato | Status | Onde esta |
|---|---|---|
| Casos de uso | Existe | `ANALISE_REQUISITOS_ATORES_CASOS_USO.md`, secoes `UC-01` a `UC-10` |
| Diagrama de caso de uso | Existe | `ANALISE_REQUISITOS_ATORES_CASOS_USO.md`, secao "Diagrama de caso de uso" |
| Fluxos de processo | Existe | `FLUXOS_DE_PROCESSO.md` |
| Diagrama SGPD/LGPD de dados | Criado aqui | Secao "Diagrama SGPD/LGPD - fluxo de dados e protecao" |
| Diagrama de viabilidade | Criado aqui | Secao "Diagrama de viabilidade" |
| Diagramas de sequencia | Criado aqui | Secao "Diagramas de sequencia" |
| Diagramas de atividade | Criado aqui | Secao "Diagramas de atividade" |
| Caso de mapeamento | Criado aqui | Secao "Caso de mapeamento" |
| Definicao de fluxo logico | Criado aqui | Secao "Fluxo logico definido" |
| Analise tecnica de complementaridade | Criado aqui | Secao "Analise tecnica de complementaridade" |

Observacao: "SGPD" foi tratado aqui como fluxo operacional de protecao de dados e privacidade, com referencia pratica a LGPD. Este documento nao substitui avaliacao juridica.

## Diagrama SGPD/LGPD - fluxo de dados e protecao

Objetivo: mapear quais dados entram, onde passam, onde ficam e quais cuidados tecnicos existem hoje.

```mermaid
flowchart LR
    usuario["Usuario testador"]
    formulario["Formulario do evento"]
    session["sessionStorage senha demo"]
    backend["Backend Express"]
    env[".env local"]
    motor["Motor local"]
    gemini["Gemini"]
    validacao["Validacao JSON"]
    resultado["Resultado na tela"]
    historico["localStorage historico"]
    pdf["PDF baixado"]

    usuario --> formulario
    usuario --> session
    formulario --> backend
    session --> backend
    env --> backend
    backend --> motor
    backend --> gemini
    gemini --> validacao
    motor --> validacao
    validacao --> resultado
    resultado --> historico
    resultado --> pdf
```

Dados tratados:

- Dados do evento: tipo, pessoas, duracao, refeicao, tema, restricoes, bebidas, orcamento e observacoes.
- Senha demo temporaria: enviada como header e guardada em `sessionStorage`.
- Historico local: evento e plano salvos no navegador do usuario.
- Chave Gemini: somente no `.env`, nunca no frontend.

Cuidados atuais:

- A chave da IA fica no backend.
- `.env` nao deve ser commitado.
- Acesso demo bloqueia `/gerar-cardapio` quando `DEMO_ACCESS_KEY` esta ativa.
- Historico fica local no navegador, sem banco em nuvem.

Pontos a validar antes de demo publica:

- Mensagem clara sobre dados salvos localmente.
- Botao simples para limpar historico.
- Limites de tamanho em campos livres.
- Politica simples de privacidade se houver link publico.

## Diagrama de viabilidade

Objetivo: decidir se uma melhoria entra agora, vai para backlog ou deve ser recusada no momento.

```mermaid
flowchart TD
    ideia["Nova ideia ou pedido"]
    ajudaAgora{"Ajuda o app a rodar melhor agora?"}
    preserva{"Preserva arquitetura atual?"}
    custo{"Exige nova dependencia, API ou custo?"}
    testavel{"E pequena e testavel?"}
    risco{"Aumenta risco de quebrar fluxo principal?"}
    executar["Executar agora"]
    backlog["Registrar no backlog futuro"]
    recusar["Nao executar nesta fase"]

    ideia --> ajudaAgora
    ajudaAgora -->|"Nao"| backlog
    ajudaAgora -->|"Sim"| preserva
    preserva -->|"Nao"| recusar
    preserva -->|"Sim"| custo
    custo -->|"Sim"| backlog
    custo -->|"Nao"| testavel
    testavel -->|"Nao"| backlog
    testavel -->|"Sim"| risco
    risco -->|"Alto"| backlog
    risco -->|"Baixo"| executar
```

Leitura atual de viabilidade:

| Iniciativa | Viabilidade agora | Motivo |
|---|---|---|
| Validacao visual do modal demo | Alta | Modal ja implementado; falta confirmar experiencia no navegador real. |
| Validar PDF no navegador | Alta | Confirma entrega principal antes de teste externo. |
| Melhorar validacao de entrada | Media/alta | Reduz erro, mas deve ser feito pequeno. |
| Separar pitch do `index.html` | Media | Ajuda organizacao, mas nao bloqueia teste. |
| Adultos/criancas no motor | Media | Melhora calculo, mas mexe em motor e contrato. |
| Login/banco/pagamento | Baixa agora | Futuro, aumenta complexidade. |

## Diagramas de sequencia

### Sequencia 1 - Gerar planejamento

```mermaid
sequenceDiagram
    participant U as Usuario
    participant F as Frontend
    participant B as Backend
    participant M as Motor local
    participant G as Gemini
    participant V as Validacao JSON
    participant S as Storage local

    U->>F: Preenche evento e clica gerar
    F->>B: POST /gerar-cardapio
    B->>B: Valida acesso demo
    B->>M: calcularMotorEvento
    M-->>B: Numeros operacionais
    B->>B: montarPromptPlanejamento
    B->>G: gerarPlano
    G-->>B: JSON de planejamento
    B->>V: extrairJSON e validarPlano
    V-->>B: Plano normalizado
    B->>B: aplicarMotorAoPlano
    B-->>F: Resposta normalizada
    F->>F: exibirResultadoLuxo
    F->>S: salvarHistorico
    F-->>U: Planejamento na tela
```

### Sequencia 2 - Acesso demo

```mermaid
sequenceDiagram
    participant U as Usuario
    participant F as Frontend
    participant B as Backend
    participant E as Env local

    F->>B: GET /api/status
    B-->>F: demo_access.required
    U->>F: Informa senha demo
    F->>B: POST /gerar-cardapio com x-demo-access-key
    B->>E: Compara DEMO_ACCESS_KEY
    alt senha valida
        B-->>F: Continua geracao
    else senha invalida
        B-->>F: 401
        F->>F: Limpa sessionStorage
        F-->>U: Mostra erro claro
    end
```

### Sequencia 3 - Baixar PDF

```mermaid
sequenceDiagram
    participant U as Usuario
    participant F as Frontend
    participant R as Render
    participant P as jsPDF

    U->>F: Clica Baixar PDF
    F->>R: baixarRelatorioPDF
    R->>R: Verifica ultimo plano
    R->>P: Cria documento A4
    R->>P: Adiciona secoes e paginacao
    R->>P: Adiciona rodape
    P-->>U: Salva arquivo PDF
```

## Diagramas de atividade

### Atividade 1 - Uso principal

```mermaid
flowchart TD
    inicio([Inicio])
    abrir["Abrir app"]
    preencher["Preencher formulario"]
    validar{"Dados minimos OK?"}
    corrigir["Corrigir campos"]
    gerar["Clicar gerar"]
    aguardar["Aguardar IA e motor"]
    revisar["Revisar resultado"]
    baixar["Baixar PDF"]
    salvar["Historico fica salvo"]
    fim([Fim])

    inicio --> abrir
    abrir --> preencher
    preencher --> validar
    validar -->|"Nao"| corrigir
    corrigir --> preencher
    validar -->|"Sim"| gerar
    gerar --> aguardar
    aguardar --> revisar
    revisar --> baixar
    revisar --> salvar
    baixar --> fim
    salvar --> fim
```

### Atividade 2 - Resolver acesso demo

```mermaid
flowchart TD
    inicio([Inicio])
    status["Frontend consulta status"]
    exige{"Senha exigida?"}
    livre["Gerar sem senha"]
    pedir["Pedir senha"]
    enviar["Enviar header"]
    valido{"Backend aceitou?"}
    continuar["Continuar geracao"]
    erro["Exibir erro e permitir tentar de novo"]
    fim([Fim])

    inicio --> status
    status --> exige
    exige -->|"Nao"| livre
    exige -->|"Sim"| pedir
    pedir --> enviar
    enviar --> valido
    valido -->|"Sim"| continuar
    valido -->|"Nao"| erro
    livre --> fim
    continuar --> fim
    erro --> pedir
```

## Caso de mapeamento

Objetivo: ligar ator, caso de uso, processo, arquivo e validacao.

| Ator | Caso de uso | Processo | Arquivos | Validacao |
|---|---|---|---|---|
| Usuario testador | UC-02 Informar dados | Captura de formulario | `public/index.html`, `public/js/app.js` | VAL-03 |
| Usuario testador | UC-04 Validar acesso demo | Acesso demo | `public/js/app.js`, `server.js` | VAL-04, VAL-05 |
| Usuario testador | UC-03 Gerar planejamento | Geracao | `server.js`, `motor.service.js`, `gemini.service.js` | VAL-06, VAL-07 |
| Usuario testador | UC-05 Visualizar planejamento | Renderizacao | `public/js/render.js`, `public/js/utils.js` | VAL-08 |
| Usuario testador | UC-06 Baixar PDF | Exportacao PDF | `public/js/render.js` | VAL-10, VAL-11 |
| Usuario testador | UC-07/UC-08 Historico | Historico local | `public/js/storage.service.js`, `public/js/app.js` | VAL-09 |
| Assistente tecnico | UC-10 Atualizar docs | Documentacao | `docs/*.md`, `CLEANUP_AUDIT.md` | VAL-12 |

## Fluxo logico definido

Regra de ordem logica do sistema:

1. Capturar dados do evento.
2. Validar minimo no frontend.
3. Validar acesso demo no backend.
4. Calcular motor local.
5. Montar prompt no backend.
6. Chamar Gemini.
7. Extrair e validar JSON.
8. Aplicar motor ao plano.
9. Renderizar resultado.
10. Salvar historico local.
11. Exportar PDF se usuario pedir.
12. Atualizar documentacao se o fluxo mudou.

Representacao:

```mermaid
flowchart LR
    captura["Captura"]
    validacaoFrontend["Validacao frontend"]
    acesso["Acesso demo"]
    motor["Motor local"]
    prompt["Prompt backend"]
    ia["Gemini"]
    json["Validacao JSON"]
    plano["Plano enriquecido"]
    tela["Tela"]
    historico["Historico"]
    pdf["PDF"]
    docs["Docs"]

    captura --> validacaoFrontend
    validacaoFrontend --> acesso
    acesso --> motor
    motor --> prompt
    prompt --> ia
    ia --> json
    json --> plano
    plano --> tela
    tela --> historico
    tela --> pdf
    pdf --> docs
```

## Analise tecnica de complementaridade

| Componente | Funcao principal | Complementa | Nao deve substituir |
|---|---|---|---|
| Frontend | Captura dados, renderiza resultado e aciona PDF | Backend e storage local | Backend, motor ou prompt principal |
| Backend Express | Orquestra acesso, motor, prompt, IA e resposta | Frontend, motor e Gemini | Frontend visual |
| Motor local | Calcula numeros operacionais | Gemini | Criatividade textual da IA |
| Gemini | Gera plano criativo e detalhado | Motor local | Calculos operacionais deterministas |
| Validadores JSON | Protegem contrato da resposta | Gemini e renderizacao | Motor ou regras de negocio |
| Storage local | Mantem historico no navegador | Renderizacao e formulario | Banco futuro |
| PDF | Entrega compartilhavel | Resultado renderizado | Tela interativa |
| Documentacao viva | Guia retomada e decisoes | Codigo e testes | Verificacao real no app |

Conclusao tecnica:

- A arquitetura atual funciona por complementaridade entre motor local e IA.
- O motor local deve continuar sendo a fonte de numeros.
- O Gemini deve continuar gerando conteudo criativo e estruturado.
- O backend deve continuar protegendo chave, prompt e acesso demo.
- O frontend deve continuar focado em experiencia, historico e PDF.
- Toda mudanca relevante precisa manter docs vivos alinhados.

## Lacunas restantes

| Lacuna | Prioridade | Observacao |
|---|---|---|
| Validacao visual do modal demo | Alta | Confirmar foco, mensagens e responsividade. |
| Validacao visual real do PDF | Alta | Confirma a entrega antes de teste externo. |
| Limites formais de campos | Media | Ajuda fluxo logico e seguranca. |
| Privacidade para demo publica | Media | Necessaria antes de link publico amplo. |
| Diagrama formal em ferramenta externa | Baixa agora | Markdown/Mermaid basta para o repo nesta fase. |
