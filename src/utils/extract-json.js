function extrairJSON(raw) {
  if (!raw || typeof raw !== "string") {
    throw new Error("Resposta vazia da IA.");
  }

  const limpado = raw.replace(/```json|```/gi, "").trim();

  // Tentativa direta
  try {
    return JSON.parse(limpado);
  } catch {}

  // Procura primeiro objeto JSON bem formado
  const inicio = limpado.indexOf("{");
  if (inicio === -1) {
    throw new Error("Nenhum JSON encontrado na resposta.");
  }

  let profundidade = 0;
  let fim = -1;

  for (let i = inicio; i < limpado.length; i++) {
    const ch = limpado[i];
    if (ch === "{") profundidade++;
    if (ch === "}") profundidade--;
    if (profundidade === 0) {
      fim = i;
      break;
    }
  }

  if (fim === -1) {
    throw new Error("JSON incompleto na resposta.");
  }

  const trecho = limpado.slice(inicio, fim + 1);
  return JSON.parse(trecho);
}

module.exports = { extrairJSON };
