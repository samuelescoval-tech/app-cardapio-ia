/* Projetos da conta: API, pendencias e paginacao separados do bootstrap. */
function criarProjetosConta({ storage, sessao, capturar, atual, requisitar, headers, aoMudar = () => {}, novoId = () => crypto.randomUUID() }) {
    let dono = null;
    let resumos = [];
    let proximo = null;
    let carregando = false;
    let erroLista = '';
    let revisaoLista = 0;
    const emEnvio = new Set();
    const detalhePendente = new Map();
    function ativa() { return Boolean(dono && sessao()?.usuarioId === dono); }
    function conferirContexto(contexto, usuario) {
        if (!atual(contexto) || dono !== usuario || !ativa()) throw Object.assign(new Error('A sessão mudou.'), { name: 'AbortError' });
    }
    async function api(caminho, opcoes = {}, contexto = capturar(), usuario = dono) {
        conferirContexto(contexto, usuario);
        const resposta = await requisitar('/api/projetos' + caminho, { ...opcoes, headers: headers() }, contexto);
        const dados = await resposta.json().catch(error => { if (error.name === 'AbortError') throw error; return {}; });
        conferirContexto(contexto, usuario);
        if (!resposta.ok || dados.ok !== true) throw Object.assign(new Error(dados.error || 'Não foi possível acessar os projetos. Tente novamente.'), { status: resposta.status });
        return dados;
    }
    function definirDono(id) {
        dono = id || null; resumos = []; proximo = null; erroLista = ''; carregando = false;
        revisaoLista++; emEnvio.clear(); detalhePendente.clear();
        aoMudar();
    }
    function locais() { return ativa() ? storage.carregarHistorico() : []; }
    function estado() {
        const pendentes = locais().filter(p => p.estado_conta !== 'salvo').map(p => ({ ...p, estado_conta: emEnvio.has(p.id) ? 'salvando' : 'pendente' }));
        const extras = [...detalhePendente.values()].filter(p => !pendentes.some(e => e.id === p.id));
        const pendencias = [...extras, ...pendentes];
        const idsPendentes = new Set(pendencias.map(p => p.remoto_id));
        return { entradas: [...pendencias, ...resumos.filter(p => !idsPendentes.has(p.id))], proximo, carregando, erro: erroLista };
    }
    async function listar({ mais = false } = {}) {
        if (!ativa() || (mais && proximo === null)) return;
        const contexto = capturar(), usuario = dono, revisao = ++revisaoLista;
        const offset = mais ? proximo : 0;
        carregando = true; erroLista = ''; aoMudar();
        try {
            const dados = await api(`?offset=${offset}&limit=20`, {}, contexto, usuario);
            if (revisao !== revisaoLista) return;
            const entradas = dados.projetos.map(p => ({ ...p, data_criacao: p.created_at, plano_valido: p.versao === 1, estado_conta: 'salvo' }));
            resumos = mais ? [...new Map([...resumos, ...entradas].map(p => [p.id, p])).values()] : entradas;
            proximo = dados.proximo_offset;
        } catch (error) { if (error.name !== 'AbortError' && atual(contexto) && usuario === dono && revisao === revisaoLista) erroLista = error.message; }
        finally { if (atual(contexto) && usuario === dono && revisao === revisaoLista) { carregando = false; aoMudar(); } }
    }
    function registrar(evento, plano) {
        if (!ativa()) return null;
        const idLocal = storage.salvarHistorico(evento, plano);
        const id = novoId();
        const entrada = { ...(idLocal ? storage.carregarEntrada(idLocal) : {}), id: idLocal || id,
            remoto_id: id, evento: JSON.parse(JSON.stringify(evento)), plano: storage.prepararPlanoParaHistorico(plano),
            tipo: evento.tipo, pessoas: evento.pessoas, data_criacao: new Date().toISOString(),
            plano_valido: true, resumo: String(plano.resumo_chef || plano.resumo || '').slice(0,100), estado_conta: 'pendente' };
        if (idLocal) storage.atualizarEntrada(idLocal, { remoto_id: id, estado_conta: 'pendente' });
        detalhePendente.set(entrada.id, entrada); aoMudar();
        void tentarSalvar(entrada.id);
        return entrada.id;
    }
    async function tentarSalvar(id) {
        const entrada = detalhePendente.get(id) || storage.carregarEntrada(id);
        if (!ativa() || !entrada || entrada.estado_conta === 'salvo' || emEnvio.has(id)) return;
        const contexto = capturar(), usuario = dono;
        entrada.remoto_id ||= novoId();
        entrada.estado_conta = 'salvando'; entrada.erro_conta = '';
        detalhePendente.set(id, entrada);
        storage.atualizarEntrada(id, { remoto_id: entrada.remoto_id, estado_conta: 'salvando', erro_conta: '' });
        emEnvio.add(id); aoMudar();
        try {
            const dados = await api('/' + entrada.remoto_id, { method: 'PUT', body: JSON.stringify({ versao: 1, evento: entrada.evento, plano: entrada.plano }) }, contexto, usuario);
            if (dados.projeto?.id !== entrada.remoto_id) throw new Error('Não foi possível confirmar o salvamento. Tente novamente.');
            entrada.estado_conta = 'salvo';
            storage.atualizarEntrada(id, { estado_conta: 'salvo', erro_conta: '' });
            detalhePendente.delete(id);
            const p = dados.projeto;
            resumos = [{ id: p.id, tipo: p.tipo, pessoas: p.pessoas, resumo: p.resumo, data_criacao: p.created_at, plano_valido: true, estado_conta: 'salvo' }, ...resumos.filter(e => e.id !== p.id)];
            void listar();
        } catch (error) {
            if (error.name === 'AbortError' || !atual(contexto) || usuario !== dono) return;
            entrada.estado_conta = 'pendente'; entrada.erro_conta = error.message;
            storage.atualizarEntrada(id, { estado_conta: 'pendente', erro_conta: error.message });
        } finally { if (atual(contexto) && usuario === dono) { emEnvio.delete(id); aoMudar(); } }
    }
    async function carregar(id) {
        const local = detalhePendente.get(id) || storage.carregarEntrada(id);
        if (local && local.estado_conta !== 'salvo') return { ...local };
        const { projeto } = await api('/' + encodeURIComponent(id));
        return { ...projeto, data_criacao: projeto.created_at, plano_valido: storage.planoTemConteudo(projeto.plano) };
    }
    async function remover(id) {
        // O resultado da escrita pode ser desconhecido apos falha de rede.
        // Remover pendencia tambem tenta remover o mesmo UUID no servidor.
        if (emEnvio.has(id)) throw new Error('Aguarde o salvamento terminar antes de excluir.');
        const local = detalhePendente.get(id) || storage.carregarEntrada(id);
        const remotoId = local?.remoto_id || id;
        try { await api('/' + encodeURIComponent(remotoId), { method: 'DELETE' }); }
        catch (error) { if (!(error.status === 404)) throw error; }
        if (local) storage.deletarEntrada(local.id);
        detalhePendente.delete(id); resumos = resumos.filter(p => p.id !== remotoId); aoMudar();
        await listar();
    }
    async function limpar() {
        if (emEnvio.size) throw new Error('Aguarde os salvamentos terminarem antes de excluir.');
        await api('', { method: 'DELETE' });
        revisaoLista++; carregando = false; erroLista = '';
        storage.limparHistorico(); detalhePendente.clear(); resumos = []; proximo = null; aoMudar();
    }
    return { ativa, definirDono, estado, listar, registrar, tentarSalvar, carregar, remover, limpar };
}
if (typeof module !== 'undefined' && module.exports) module.exports = { criarProjetosConta };
