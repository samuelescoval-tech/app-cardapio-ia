function avaliarRendimentoAlimentar(plano = {}, evento = {}, motor = {}) {
  const pessoasEquivalentes = calcularPessoasEquivalentes(evento, motor);
  const contexto = normalizar([evento.tipo, evento.refeicao].filter(Boolean).join(" "));
  const coffeeBreak = /coffee|coquetel|finger|brunch|cafe da manha/.test(contexto);
  const churrasco = /churrasco|grelha/.test(contexto);
  const refeicaoPrincipal = /almoco|jantar|ceia/.test(contexto) && !coffeeBreak;
  const minimoProteinaPorPessoaKg = churrasco ? 0.35 : refeicaoPrincipal ? 0.2 : coffeeBreak ? 0.06 : 0.12;
  const proteinaKg = somarProteinasKg(plano.lista_compras);
  const minimoProteinaKg = arredondar1(pessoasEquivalentes * minimoProteinaPorPessoaKg);
  const salgadosEsperados = quantidadeMotor(motor, "Salgados/canapes");
  const docesEsperados = quantidadeMotor(motor, "Doces/sobremesas");
  const salgadosPlanejados = somarUnidadesCardapio(plano.cardapio, /boas-vindas|entrada|prato principal/);
  const docesPlanejados = somarUnidadesCardapio(plano.cardapio, /sobremesa/);
  const verificacoes = [];

  if (minimoProteinaKg > 0) {
    verificacoes.push({
      id: "proteinas",
      rotulo: "Proteínas compradas",
      planejado: proteinaKg,
      minimo: minimoProteinaKg,
      unidade: "kg",
      por_pessoa: pessoasEquivalentes ? Math.round((proteinaKg * 1000) / pessoasEquivalentes) : 0,
      conforme: proteinaKg + 0.01 >= minimoProteinaKg,
      criterio: `${Math.round(minimoProteinaPorPessoaKg * 1000)} g por pessoa equivalente para ${rotuloServico(coffeeBreak, churrasco, refeicaoPrincipal)}.`
    });
  }
  if (salgadosEsperados > 0 && salgadosPlanejados > 0) {
    verificacoes.push({
      id: "salgados",
      rotulo: "Porções salgadas",
      planejado: salgadosPlanejados,
      minimo: salgadosEsperados,
      unidade: "un",
      por_pessoa: pessoasEquivalentes ? arredondar1(salgadosPlanejados / pessoasEquivalentes) : 0,
      conforme: salgadosPlanejados >= salgadosEsperados,
      criterio: "Comparação entre as unidades do cardápio e o total oficial do motor."
    });
  }
  if (docesEsperados > 0 && docesPlanejados > 0) {
    verificacoes.push({
      id: "doces",
      rotulo: "Doces e sobremesas",
      planejado: docesPlanejados,
      minimo: docesEsperados,
      unidade: "un",
      por_pessoa: pessoasEquivalentes ? arredondar1(docesPlanejados / pessoasEquivalentes) : 0,
      conforme: docesPlanejados >= docesEsperados,
      criterio: "Comparação entre as unidades do cardápio e o total oficial do motor."
    });
  }

  const pendencias = verificacoes.filter(item => !item.conforme);
  return {
    versao: "1.0.0",
    status: pendencias.length ? "revisar" : "conforme",
    pessoas_equivalentes: arredondar1(pessoasEquivalentes),
    contexto_servico: rotuloServico(coffeeBreak, churrasco, refeicaoPrincipal),
    verificacoes,
    avisos: pendencias.map(item => `${item.rotulo} abaixo da referência: ${formatar(item.planejado)} ${item.unidade} de ${formatar(item.minimo)} ${item.unidade}.`),
    leitura: pendencias.length
      ? "Há quantidades abaixo das referências do motor; o plano não deve ser tratado como final antes da revisão."
      : "As quantidades verificáveis atingem as referências mínimas do motor para este formato de serviço."
  };
}

function calcularPessoasEquivalentes(evento, motor) {
  const adultos = numero(motor?.premissas?.adultos);
  const criancas = numero(motor?.premissas?.criancas);
  if (adultos || criancas) return adultos + criancas * (numero(motor?.premissas?.fator_consumo_crianca) || 0.6);
  const pessoas = numero(evento.pessoas);
  const criancasEvento = Math.min(numero(evento.criancas), pessoas);
  return Math.max(1, pessoas - criancasEvento + criancasEvento * 0.6);
}

function somarProteinasKg(compras) {
  const vistos = new Set();
  return arredondar1((Array.isArray(compras) ? compras : []).reduce((total, compra) => {
    const nome = normalizar(compra?.item);
    if (!/carne|bovina|suina|picanha|alcatra|patinho|carpaccio|frango|galinha|peru|chester|linguica|peixe|tilapia|salmao|bacalhau|camarao/.test(nome)) return total;
    const chave = `${nome}|${compra?.quantidade || ""}`;
    if (vistos.has(chave)) return total;
    vistos.add(chave);
    return total + quantidadeKg(compra?.quantidade);
  }, 0));
}

function somarUnidadesCardapio(cardapio, categorias) {
  return Math.round((Array.isArray(cardapio) ? cardapio : []).reduce((total, item) => {
    if (!categorias.test(normalizar(item?.categoria))) return total;
    return total + quantidadeUnidades(item?.quantidade);
  }, 0));
}

function quantidadeMotor(motor, nome) {
  const item = (Array.isArray(motor?.alimentacao) ? motor.alimentacao : []).find(valor => valor?.item === nome);
  return quantidadeUnidades(item?.quantidade);
}

function quantidadeKg(valor) {
  const correspondencia = String(valor || "").replace(",", ".").match(/(\d+(?:\.\d+)?)\s*(kg|g)\b/i);
  if (!correspondencia) return 0;
  const quantidade = Number(correspondencia[1]);
  return correspondencia[2].toLowerCase() === "g" ? quantidade / 1000 : quantidade;
}

function quantidadeUnidades(valor) {
  const correspondencia = String(valor || "").replace(",", ".").match(/(\d+(?:\.\d+)?)\s*(un|unidade|unidades|porcao|porcoes)\b/i);
  return correspondencia ? Number(correspondencia[1]) : 0;
}

function rotuloServico(coffeeBreak, churrasco, refeicaoPrincipal) {
  if (churrasco) return "churrasco ou serviço de grelha";
  if (refeicaoPrincipal) return "almoço, jantar ou refeição principal";
  if (coffeeBreak) return "coffee break, brunch ou coquetel";
  return "evento geral";
}

function normalizar(valor) { return String(valor || "").normalize("NFD").replace(/[\u0300-\u036f]/g, "").toLowerCase(); }
function numero(valor) { const resultado = Number(valor); return Number.isFinite(resultado) && resultado > 0 ? resultado : 0; }
function arredondar1(valor) { return Math.round((Number(valor) || 0) * 10) / 10; }
function formatar(valor) { return Number(valor).toLocaleString("pt-BR", { maximumFractionDigits: 1 }); }

module.exports = { avaliarRendimentoAlimentar, quantidadeKg, quantidadeUnidades, somarProteinasKg };
