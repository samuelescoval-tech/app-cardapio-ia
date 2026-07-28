const crypto = require("node:crypto");

function obterChaveMestra(segredo) {
  const valor = segredo ?? process.env.CHAVE_IA_ENCRYPTION_SECRET;
  if (!valor) {
    throw new Error("CHAVE_IA_ENCRYPTION_SECRET nao configurada no .env.");
  }
  return crypto.createHash("sha256").update(valor).digest();
}

function cifrar(textoPlano, segredo) {
  const chaveMestra = obterChaveMestra(segredo);
  const iv = crypto.randomBytes(12);
  const cifra = crypto.createCipheriv("aes-256-gcm", chaveMestra, iv);
  const cifrado = Buffer.concat([cifra.update(String(textoPlano), "utf8"), cifra.final()]);
  return {
    chave_cifrada: cifrado.toString("base64"),
    iv: iv.toString("base64"),
    tag: cifra.getAuthTag().toString("base64")
  };
}

function decifrar({ chave_cifrada, iv, tag }, segredo) {
  const chaveMestra = obterChaveMestra(segredo);
  const decifra = crypto.createDecipheriv("aes-256-gcm", chaveMestra, Buffer.from(iv, "base64"));
  decifra.setAuthTag(Buffer.from(tag, "base64"));
  const textoPlano = Buffer.concat([decifra.update(Buffer.from(chave_cifrada, "base64")), decifra.final()]);
  return textoPlano.toString("utf8");
}

module.exports = { cifrar, decifrar };
