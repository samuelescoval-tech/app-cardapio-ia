function montarPromptCardapio(evento, motor, diretriz) {
  return `${contextoBase(evento, motor, diretriz)}

TAREFA: crie somente o conceito e o cardapio. Seja conciso para concluir o JSON.

REGRAS:
- Entregue no minimo ${diretriz.quantidade_total_minima} itens e cumpra exatamente o piso por categoria.
- Cubra todos os pedidos_culinarios_explicitos e o repertorio esperado da ocasiao.
- Aplique o estilo informado de modo concreto; Premium nao pode usar solucoes comuns ou sob demanda.
- Materialize os elementos_esperados no nome ou na descricao dos itens aplicaveis; nao os deixe apenas implicitos.
- Cada item precisa de id unico, quantidade final e ingredientes atomicos dimensionados para o evento.
- Cada prato e bebida deve permanecer individual no cardapio; blocos servem apenas para compras e operacao.
- Cumpra variedade_bebidas, diferencie refrigerantes por sabor e acucar sem marcas e, quando houver bar, varie bases e estilos alcoolicos.
- Iogurte, frutas, doces e bebidas nunca podem ser classificados como Prato Principal.
- Bebidas prontas podem ter ingredientes vazios; os demais itens nao.
- Descricoes com no maximo 18 palavras. Nao escreva receitas, compras ou operacao.

CONTRATO JSON:
{
  "resumo_chef":"3 frases curtas",
  "cardapio":[
    {"id":"prato-1","nome":"","categoria":"Boas-vindas|Entrada|Prato Principal|Acompanhamento|Salada|Sobremesa|Bebida","tipo_execucao":"preparo|montagem|pronto","descricao":"","emoji":"","quantidade":"","ingredientes":[{"item":"","quantidade":"","unidade":"kg|g|L|ml|un|maco|pacote"}]}
  ]
}`;
}

function montarPromptReceitas(evento, cardapio) {
  const preparos = cardapio.filter(item => item.tipo_execucao !== "pronto");
  return `Voce e o bloco de producao culinaria do Chef IA.
EVENTO: ${JSON.stringify(resumirEvento(evento))}
PREPARACOES: ${JSON.stringify(preparos)}

TAREFA: retorne somente receitas operacionais para todos os ids recebidos.
- Repita os ingredientes e quantidades do cardapio.
- Use 4 a 6 passos claros, tempo, rendimento e quantidade_total.
- Escreva em portugues cotidiano e explique como executar cada acao; nao use passos soltos como "decorar", "porcionar", "infusionar" ou "gelado".
- Para forno ou fogao, informe tempo e temperatura ou intensidade do fogo. Para preparos frios, informe montagem, refrigeracao e conservacao ate o servico.
- Para chas e ervas, escreva "deixar na agua quente por X minutos e coar".
- Nao acrescente pratos e nao escreva compras ou explicacoes.

CONTRATO JSON:
{"receitas":[{"cardapio_id":"prato-1","nome":"","ingredientes":[{"item":"","quantidade":"","unidade":""}],"preparo_passos":["","","",""],"tempo":"","rendimento":"","quantidade_total":""}]}`;
}

function montarPromptExperiencia(evento, motor, cardapio) {
  return `Voce e o bloco de experiencia e operacao visivel do Chef IA.
EVENTO: ${JSON.stringify(resumirEvento(evento))}
DADOS OPERACIONAIS: ${JSON.stringify({ duracao: motor.duracao, espaco: motor.espaco, perfil: motor.perfil })}
CARDAPIO RESUMIDO: ${JSON.stringify(cardapio.map(item => ({ id: item.id, nome: item.nome, categoria: item.categoria })))}

TAREFA: planeje somente ambiente, servico e experiencia. Seja conciso.
- 4 locais, 2 layouts, 2 temas e 4 itens de decoracao.
- 4 a 8 momentos no cronograma, 3 orientacoes de equipe, 3 entretenimentos e 3 lembrancinhas.
- Checklist com 4 tarefas pre, 3 durante e 2 pos-evento.
- Nao repita cardapio, receitas ou compras.

CONTRATO JSON:
{
  "local":[{"nome":"","tipo":"","capacidade":"","observacao":""}],
  "layout":[""],
  "decoracao":{"temas":["",""],"itens":["","","",""],"iluminacao":""},
  "cronograma":[{"hora":"","atividade":"","descricao":""}],
  "utensilios":[{"item":"","quantidade":"","uso":""}],
  "equipe_obs":[""],
  "entretenimento":[""],
  "lembrancinhas":[""],
  "checklist":{"pre":[""],"durante":[""],"pos":[""]}
}`;
}

function contextoBase(evento, motor, diretriz) {
  return `Voce e o bloco criativo do Chef IA Studio.
EVENTO: ${JSON.stringify(resumirEvento(evento))}
DADOS OPERACIONAIS: ${JSON.stringify({ alimentacao: motor.alimentacao, bebidas: motor.bebidas })}
DIRETRIZ CULINARIA: ${JSON.stringify({
    identidade: diretriz.identidade_evento,
    momentos: diretriz.momentos_servico,
    elementos_esperados: diretriz.elementos_esperados,
    comidas_tipicas: diretriz.comidas_tipicas,
    modificador_ocasiao: diretriz.modificador_ocasiao,
    modificador_estilo: diretriz.modificador_estilo,
    pedidos_culinarios_explicitos: diretriz.pedidos_culinarios_explicitos,
    variedade_bebidas: diretriz.variedade_bebidas,
    composicao_minima: diretriz.composicao_minima
  })}`;
}

function resumirEvento(evento) {
  const campos = ["tipo", "pessoas", "criancas", "duracao", "refeicao", "restricoes", "tema", "alcool", "estilo", "obs", "horarioInicio", "formatoServico", "faixaEtaria", "infraestrutura", "prioridade"];
  return Object.fromEntries(campos.filter(campo => evento[campo] !== undefined).map(campo => [campo, evento[campo]]));
}

module.exports = { montarPromptCardapio, montarPromptReceitas, montarPromptExperiencia };
