// Contexto de trabalho: respostas iniciadas por uma conta nao podem voltar
// para a tela de outra, mesmo quando o transporte ignora AbortController.
function criarControleSessao({ fetchImpl = (...args) => fetch(...args), aoTrocar = () => {} } = {}) {
    let sessao = null;
    let versao = 0;
    const pendentes = new Set();
    const abortado = () => Object.assign(new Error('A sessão mudou.'), { name: 'AbortError' });
    function definir(nova, forcar = false) {
        if (forcar || (sessao?.usuarioId || null) !== (nova?.usuarioId || null)) {
            versao++;
            for (const controller of pendentes) controller.abort();
            pendentes.clear();
            sessao = nova;
            aoTrocar(nova);
        } else sessao = nova; // renovacao de token nao apaga o trabalho
    }
    async function requisitar(url, opcoes = {}, contexto = versao) {
        if (contexto !== versao) throw abortado();
        const controller = new AbortController();
        pendentes.add(controller);
        try {
            const resposta = await fetchImpl(url, { ...opcoes, signal: controller.signal });
            if (contexto !== versao) throw abortado();
            for (const metodo of ['json', 'blob', 'text']) {
                if (typeof resposta[metodo] !== 'function') continue;
                const ler = resposta[metodo].bind(resposta);
                resposta[metodo] = async () => {
                    if (contexto !== versao) throw abortado();
                    const dados = await ler();
                    if (contexto !== versao) throw abortado();
                    return dados;
                };
            }
            return resposta;
        } catch (error) {
            if (contexto !== versao) throw abortado();
            throw error;
        } finally { pendentes.delete(controller); }
    }
    return { definir, obter: () => sessao, capturar: () => versao, atual: valor => valor === versao, requisitar };
}

if (typeof module !== 'undefined' && module.exports) module.exports = { criarControleSessao };
