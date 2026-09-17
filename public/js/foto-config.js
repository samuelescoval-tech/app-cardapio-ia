// Compartilhado pelo navegador e backend. 3 MiB viram 4 MiB em base64;
// a margem para JSON permanece abaixo dos 4,5 MB de payload da Vercel.
const FOTO_UPLOAD_CONFIG = Object.freeze({
    tamanhoMaximoBytes: 3 * 1024 * 1024,
    corpoMaximoBytes: 4 * 1024 * 1024 + 20 * 1024,
    mensagemLimite: 'A foto deve ter até 3 MB. Escolha uma imagem menor.'
});

if (typeof module !== 'undefined' && module.exports) {
    module.exports = FOTO_UPLOAD_CONFIG;
}
