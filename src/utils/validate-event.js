const LIMITES_TEXTO = {
  tipo: 80,
  estilo: 30,
  refeicao: 80,
  restricoes: 500,
  tema: 120,
  alcool: 80,
  orcamentoBase: 80,
  obs: 1000,
  pais: 60,
  estado: 80,
  cidade: 120
};

class ErroValidacaoEvento extends Error {
  constructor(message, campo) {
    super(message);
    this.name = "ErroValidacaoEvento";
    this.campo = campo;
  }
}

function validarEvento(valor) {
  if (!ehObjeto(valor)) {
    throw new ErroValidacaoEvento("Dados do evento sao obrigatorios.", "evento");
  }

  const tipo = textoObrigatorio(valor.tipo, "tipo", 2);
  const pessoas = inteiroNoIntervalo(valor.pessoas, "pessoas", 1, 5000);
  const criancas = inteiroOpcional(valor.criancas, "criancas", 0, pessoas, 0);
  const duracao = duracaoOpcional(valor.duracao);
  const dataEvento = dataEventoOpcional(valor.dataEvento);

  return {
    tipo,
    pessoas,
    criancas,
    estilo: textoOpcional(valor.estilo, "estilo", "Simples"),
    ...(duracao ? { duracao } : {}),
    dataEvento,
    pais: textoOpcional(valor.pais, "pais", "Brasil"),
    estado: textoOpcional(valor.estado, "estado", ""),
    cidade: textoOpcional(valor.cidade, "cidade", ""),
    refeicao: textoOpcional(valor.refeicao, "refeicao", "Nao informado"),
    restricoes: textoOpcional(valor.restricoes, "restricoes", "Nenhuma"),
    tema: textoOpcional(valor.tema, "tema", "Nao informado"),
    alcool: textoOpcional(valor.alcool, "alcool", "Nao informado"),
    orcamentoBase: textoOpcional(valor.orcamentoBase, "orcamentoBase", "Nao informado"),
    obs: textoOpcional(valor.obs, "obs", "Sem observacoes adicionais")
  };
}

function textoObrigatorio(valor, campo, minimo) {
  const texto = textoNormalizado(valor);
  if (texto.length < minimo) {
    throw new ErroValidacaoEvento(`O campo ${campo} deve ter pelo menos ${minimo} caracteres.`, campo);
  }

  validarTamanho(texto, campo);
  return texto;
}

function textoOpcional(valor, campo, fallback) {
  const texto = textoNormalizado(valor);
  if (!texto) return fallback;

  validarTamanho(texto, campo);
  return texto;
}

function validarTamanho(texto, campo) {
  const limite = LIMITES_TEXTO[campo];
  if (texto.length > limite) {
    throw new ErroValidacaoEvento(`O campo ${campo} deve ter no maximo ${limite} caracteres.`, campo);
  }
}

function duracaoOpcional(valor) {
  const texto = textoNormalizado(valor);
  if (!texto || /^padrao do evento$/i.test(texto)) return null;
  return inteiroNoIntervalo(texto, "duracao", 1, 24);
}

function dataEventoOpcional(valor) {
  const texto = textoNormalizado(valor);
  if (!texto) return null;
  if (!/^\d{4}-\d{2}-\d{2}$/.test(texto)) {
    throw new ErroValidacaoEvento("O campo dataEvento deve usar o formato AAAA-MM-DD.", "dataEvento");
  }

  const data = new Date(`${texto}T00:00:00Z`);
  if (Number.isNaN(data.getTime()) || data.toISOString().slice(0, 10) !== texto) {
    throw new ErroValidacaoEvento("O campo dataEvento deve conter uma data valida.", "dataEvento");
  }

  return texto;
}

function inteiroNoIntervalo(valor, campo, minimo, maximo) {
  const texto = textoNormalizado(valor);
  if (!/^\d+$/.test(texto)) {
    throw new ErroValidacaoEvento(`O campo ${campo} deve ser um numero inteiro.`, campo);
  }

  const numero = Number(texto);
  if (!Number.isSafeInteger(numero) || numero < minimo || numero > maximo) {
    throw new ErroValidacaoEvento(`O campo ${campo} deve estar entre ${minimo} e ${maximo}.`, campo);
  }

  return numero;
}

function inteiroOpcional(valor, campo, minimo, maximo, fallback) {
  const texto = textoNormalizado(valor);
  if (!texto) return fallback;
  return inteiroNoIntervalo(texto, campo, minimo, maximo);
}

function textoNormalizado(valor) {
  if (valor === null || valor === undefined) return "";
  if (typeof valor !== "string" && typeof valor !== "number") return "";
  return String(valor).replace(/\s+/g, " ").trim();
}

function ehObjeto(valor) {
  return Boolean(valor) && typeof valor === "object" && !Array.isArray(valor);
}

module.exports = { validarEvento, ErroValidacaoEvento };
