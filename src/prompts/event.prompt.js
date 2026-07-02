/* ==========================================================================
   CHEF IA STUDIO | PROMPT DE EVENTO
   TAG: prompt-backend, schema-json, motor-local
   --------------------------------------------------------------------------
   Responsabilidade: montar o prompt no backend usando o motor local.
   ========================================================================== */

function montarPromptPlanejamento(evento, motor) {
  return `
Voce e o Chef IA Studio, um planejador profissional de eventos gastronomicos no Brasil.
Use o resumo do motor local como verdade operacional. Nao contradiga esses numeros.

Dados do cliente:
- Tipo de evento: ${evento.tipo}
- Convidados: ${evento.pessoas}
- Estilo: ${evento.estilo}
- Duracao: ${evento.duracao || "padrao do evento"}
- Tipo de refeicao: ${evento.refeicao || "Nao informado"}
- Tema/decoracao: ${evento.tema || "Nao informado"}
- Bebidas: ${evento.alcool || "Nao informado"}
- Orcamento desejado: ${evento.orcamentoBase || "Nao informado"}
- Restricoes alimentares: ${evento.restricoes || "Nenhuma"}
- Observacoes do cliente: ${evento.obs || "Sem observacoes"}

Resumo do motor local:
${JSON.stringify(motor, null, 2)}

Responda SOMENTE com JSON valido, sem markdown, sem comentarios, sem texto fora do JSON.

Formato obrigatorio:
{
  "motor_logistica": ${JSON.stringify(motor, null, 2)},
  "cardapio": [
    {"nome":"", "categoria":"Entrada|Prato Principal|Acompanhamento|Sobremesa|Bebida", "descricao":"1 frase curta", "emoji":"", "quantidade":"", "ingredientes":["item 1","item 2"]}
  ],
  "receitas": [
    {"nome":"", "preparo":"passo a passo curto", "tempo":"", "rendimento":""}
  ],
  "lista_compras": [
    {"item":"", "quantidade":"", "setor":"Hortifruti|Acougue|Bebidas|Mercearia|Frios|Padaria|Descartaveis|Limpeza|Outros", "prioridade":"alta|media|baixa"}
  ],
  "utensilios": [
    {"item":"", "quantidade":"", "uso":""}
  ],
  "local": [
    {"tipo":"", "capacidade":"", "pros":"", "contras":"", "custo":"", "recomendado":true}
  ],
  "layout": ["opcao detalhada 1", "opcao detalhada 2"],
  "decoracao": {
    "temas":["tema 1", "tema 2"],
    "itens":["item 1", "item 2", "item 3", "item 4"],
    "iluminacao":"dica pratica"
  },
  "cronograma": [
    {"hora":"HH:MM", "atividade":"", "descricao":""}
  ],
  "equipe_obs": ["orientacao 1", "orientacao 2", "orientacao 3"],
  "entretenimento": ["atividade 1", "atividade 2", "atividade 3"],
  "lembrancinhas": ["opcao 1", "opcao 2", "opcao 3"],
  "checklist": {
    "pre":["tarefa 1", "tarefa 2", "tarefa 3", "tarefa 4"],
    "durante":["tarefa 1", "tarefa 2", "tarefa 3"],
    "pos":["tarefa 1", "tarefa 2"]
  },
  "orcamento": {
    "economico":{"total":"R$ X","local":"","buffet":"","decoracao":"","som":"","equipe":"","outros":""},
    "medio":{"total":"R$ X","local":"","buffet":"","decoracao":"","som":"","equipe":"","outros":""},
    "sofisticado":{"total":"R$ X","local":"","buffet":"","decoracao":"","som":"","equipe":"","outros":""}
  },
  "resumo_chef":"3 a 5 frases com recomendacao final"
}

Regras:
- Gere 7 a 9 itens de cardapio.
- Gere 4 a 5 opcoes de local.
- Gere 6 a 8 momentos no cronograma.
- A lista de compras deve ter pelo menos 12 itens, organizada por setor.
- Detalhe utensilios especificos com quantidade e uso.
- Preserve os numeros de motor_logistica exatamente como recebidos.
- Nao use aspas curvas, nao use trailing comma.
`;
}

module.exports = { montarPromptPlanejamento };
