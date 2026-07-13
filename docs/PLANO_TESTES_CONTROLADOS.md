# Plano de testes controlados - Chef IA Studio

<!-- CODEX:LER_POR_PROCESSO
Ler quando for preparar, executar ou consolidar um teste com usuario real.
-->

<!-- CODEX:MANTER_EM_LINHA
Registrar no handoff somente resultados consolidados ou falhas que mudem a prioridade.
-->

## Objetivo do ciclo

Validar se o MVP ajuda uma pessoa a planejar um evento real com clareza e confiabilidade suficiente para revisao profissional, antes de iniciar funcionalidades grandes.

## Escopo minimo

- 3 a 5 pessoas testadoras.
- Um evento realista por pessoa.
- Pelo menos tres perfis entre atendimento domiciliar, casamento, churrasco, infantil e corporativo.
- Uma geracao principal por evento; repetir apenas quando houver falha funcional ou correcao relacionada.
- Avaliacao do formulario, resultado, receitas, compras, operacao, historico e PDF.
- Spoonacular avaliado separadamente como referencia opcional e transitoria.

## Preparacao

Antes de cada teste:

1. Confirmar que `npm test` passa.
2. Confirmar `GET /api/status` com Gemini, motor local e acesso demo esperados.
3. Usar `DEMO_ACCESS_KEY` somente pelo canal privado combinado.
4. Nao compartilhar `.env`, chaves de API ou respostas com dados pessoais desnecessarios.
5. Explicar que precos sem fonte ficam como `A cotar`, alergenicos exigem verificacao profissional e a operacao e uma estimativa.

## Ficha de feedback por evento

Copiar e preencher um bloco por teste:

```text
ID do teste:
Data:
Perfil do usuario: iniciante | profissional | outro
Tipo de evento:
Adultos/criancas:
Restricoes e alergenicos informados:
Formato, infraestrutura e horario:
Navegador/dispositivo:

Geracao concluiu? sim | nao
Tempo percebido: rapido | aceitavel | lento
Formulario ficou claro? 1 a 5
Cardapio combina com o evento? 1 a 5
Receitas parecem executaveis? 1 a 5
Lista de compras parece completa? 1 a 5
Operacao parece util e coerente? 1 a 5
Historico salvou e recarregou? sim | nao | nao testado
PDF ficou legivel e completo? sim | nao | nao testado
Houve repeticao evitavel? sim | nao | incerto
Compras foram recuperadas automaticamente? sim | nao | nao informado

Principal acerto:
Principal dificuldade:
Erro reproduzivel e passos:
Evidencia disponivel: print | PDF | dados do evento | nenhuma
Gravidade: bloqueante | alta | media | baixa | sugestao
Decisao: corrigir agora | observar | backlog | aprovado
```

## Classificacao e correcao

Corrigir no ciclo somente quando a falha for reproduzivel e afetar um destes pontos:

- geracao ou validacao do evento;
- perda ou corrupcao do historico;
- PDF ilegivel ou incompleto;
- receita sem informacao essencial;
- compra ausente ou incoerente;
- operacao contraditoria;
- exposicao de segredo ou persistencia indevida de referencia externa.

Preferencias editoriais isoladas, novas categorias e expansoes de repertorio entram no backlog ate aparecer um padrao entre os testes.

## Execucoes registradas

### Pre-teste tecnico 0 - evento corporativo

- Data: 2026-07-13.
- Objetivo: confirmar o baseline antes de envolver usuarios reais.
- Ambiente: Gemini configurado, acesso demo ativo, motor local e operacao deterministica declarados no status; Spoonacular desativado.
- Cenario: evento corporativo para 40 adultos, coffee break, opcao vegana e sem lactose, tema profissional contemporaneo.
- Resultado: geracao concluida com 13 itens e cobertura de 23/23 ingredientes.
- Receitas: 7 cobertas e completas; 8 itens classificados com preparo ou montagem.
- Revisao: ficha ausente para `Frutas da estacao fatiadas`, classificada como montagem.
- Decisao: nao alterar o validador; manter o aviso e observar se o mesmo problema aparece em testes de usuario.
- Limite da evidencia: este pre-teste de API nao aprovou interface, historico, operacao renderizada ou PDF.
- Proxima porta: executar o primeiro teste real pela interface usando a ficha de feedback deste documento.

## Spoonacular no backlog

O Spoonacular nao e pre-condicao para os testes controlados. A consulta real esta pausada porque o servico pago nao faz parte do ciclo minimo atual.

Se a decisao for revista no futuro, a chave nova precisa estar em `SPOONACULAR_API_KEY` no `.env` do ambiente testado. Depois, executar uma unica consulta controlada:

```bash
npm run test:spoonacular:live -- "risoto de cogumelos"
```

A porta passa somente se:

- a credencial for aceita;
- houver no maximo tres referencias;
- a resposta continuar com `persistence: false`;
- nenhuma instrucao, ingrediente ou nutricao for retornada pelo Chef IA;
- cada referencia valida possuir fonte HTTPS e atribuicao;
- a quota e o limite local permanecerem visiveis.

O resultado nao entra no plano, historico ou PDF. Falha de credencial, quota ou rede nao autoriza remover esses limites.

## Criterio de encerramento

O ciclo pode ser reavaliado quando:

- 3 a 5 testes estiverem registrados;
- nenhuma falha bloqueante permanecer aberta;
- falhas altas estiverem corrigidas ou explicitamente pausadas;
- historico e PDF tiverem evidencias reais;
- feedback culinario estiver separado de falha tecnica;
- Roadmap e Handoff registrarem a decisao seguinte.

Decisoes possiveis: novo ciclo de correcoes, expansao culinaria baseada em padroes observados ou avaliacao separada de produto comercial.
