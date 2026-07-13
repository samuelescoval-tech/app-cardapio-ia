const MAX_EVENTOS = 5;
const MAX_PRATOS = 18;

function validarHistoricoCulinario(valor) {
  if (!Array.isArray(valor)) return [];

  return valor.slice(0, MAX_EVENTOS).flatMap(entrada => {
    if (!ehObjeto(entrada) || !ehObjeto(entrada.evento) || !Array.isArray(entrada.pratos)) return [];

    const evento = {
      tipo: textoLimitado(entrada.evento.tipo, 80),
      refeicao: textoLimitado(entrada.evento.refeicao, 80),
      tema: textoLimitado(entrada.evento.tema, 120)
    };
    if (!evento.tipo) return [];

    const pratos = entrada.pratos.slice(0, MAX_PRATOS).flatMap(prato => {
      if (!ehObjeto(prato)) return [];
      const nome = textoLimitado(prato.nome, 120);
      const categoria = textoLimitado(prato.categoria, 40);
      return nome ? [{ nome, categoria }] : [];
    });

    return pratos.length ? [{ evento, pratos }] : [];
  });
}

function textoLimitado(valor, limite) {
  if (typeof valor !== "string" && typeof valor !== "number") return "";
  return String(valor)
    .replace(/[\u0000-\u001f\u007f]/g, " ")
    .replace(/\s+/g, " ")
    .trim()
    .slice(0, limite);
}

function ehObjeto(valor) {
  return Boolean(valor) && typeof valor === "object" && !Array.isArray(valor);
}

module.exports = { validarHistoricoCulinario, MAX_EVENTOS, MAX_PRATOS };
