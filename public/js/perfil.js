/* ==========================================================================
   KARAMU | PERFIL DO USUARIO
   TAG: perfil-fornecedores, perfil-fotos, perfil-chave-ia, perfil-precos
   --------------------------------------------------------------------------
   Fornecedores, fotos, chave de IA propria e precos proprios do usuario
   logado. So chamado quando ha sessao (ver abrirPainelPerfil() em app.js).
   ========================================================================== */

const CATEGORIAS_PERFIL = ["Hortifruti", "Acougue", "Bebidas", "Mercearia", "Frios", "Padaria", "Descartaveis", "Limpeza", "Outros"];

let perfilEventosLigados = false;
let perfilFornecedoresCache = [];
let perfilPrecosCache = [];
let perfilFornecedorSelecionado = null;
let perfilFornecedorEdicao = null;
let perfilPrecoEdicao = null;

function perfilToken() {
    const sessao = obterSessaoUsuario();
    return sessao ? sessao.accessToken : null;
}

function perfilHeaders(comJson = true) {
    const headers = comJson ? { "Content-Type": "application/json" } : {};
    const token = perfilToken();
    if (token) headers["Authorization"] = `Bearer ${token}`;
    return headers;
}

function perfilPreencherSelect(select, valorSelecionado = "") {
    if (!select) return;
    const atual = select.value || valorSelecionado;
    select.innerHTML = '<option value="">Sem categoria</option>' +
        CATEGORIAS_PERFIL.map(c => `<option value="${escapeHTML(c)}">${escapeHTML(c)}</option>`).join("");
    if (atual) select.value = atual;
}

const PERFIL_PAINEL_POR_ABA = {
    fornecedores: "perfilPainelFornecedores",
    fotos: "perfilPainelFotos"
};

function perfilAtivarAba(nome) {
    document.querySelectorAll(".perfil-tab").forEach(botao => {
        botao.classList.toggle("active", botao.dataset.perfilTab === nome);
    });
    document.querySelectorAll(".perfil-painel").forEach(painel => {
        painel.classList.toggle("active", painel.id === PERFIL_PAINEL_POR_ABA[nome]);
    });
}

/* ---------- FORNECEDORES ---------- */

async function perfilConsultarJSON(url, opcoes, contexto, mensagem) {
    const response = await fetchDaSessao(url, opcoes, contexto);
    const dados = await response.json();
    if (!response.ok || dados.ok === false) throw new Error(dados.error || mensagem);
    if (!contextoSessaoAtual(contexto)) throw new DOMException('Sessao alterada', 'AbortError');
    return dados;
}

function perfilMensagem(texto) {
    document.getElementById('perfilCatalogoInfo').textContent = texto;
}

function perfilRenderFornecedores() {
    const lista = document.getElementById('fornecedoresLista');
    document.getElementById('fornecedoresVazio').classList.toggle('hidden', perfilFornecedoresCache.length > 0);
    lista.innerHTML = perfilFornecedoresCache.map(f => {
        const total = perfilPrecosCache.filter(p => p.fornecedor_id === f.id).length;
        return `<div class="perfil-item-card">
            <strong>${escapeHTML(f.nome)}</strong>
            <small>${escapeHTML(f.categoria || 'Sem categoria')}</small>
            ${f.telefone ? `<small>${icon('phone')} ${escapeHTML(f.telefone)}</small>` : ''}
            ${f.endereco ? `<small>${icon('map-pin')} ${escapeHTML(f.endereco)}</small>` : ''}
            ${f.observacoes ? `<small>${escapeHTML(f.observacoes)}</small>` : ''}
            <div class="perfil-item-actions">
                <button type="button" class="btn-secondary btn-small" data-produtos-fornecedor="${escapeHTML(f.id)}">Produtos (${total})</button>
                <button type="button" class="btn-secondary btn-small" data-editar-fornecedor="${escapeHTML(f.id)}">Editar dados</button>
                <button type="button" class="btn-secondary btn-small" data-remover-fornecedor="${escapeHTML(f.id)}">Remover</button>
            </div>
        </div>`;
    }).join('');
    const semFornecedor = perfilPrecosCache.filter(p => !p.fornecedor_id).length;
    const botao = document.getElementById('produtosSemFornecedor');
    botao.textContent = `Produtos sem fornecedor (${semFornecedor})`;
    botao.classList.toggle('hidden', !semFornecedor);
    lista.querySelectorAll('[data-produtos-fornecedor]').forEach(b => { b.onclick = () => perfilSelecionarFornecedor(b.dataset.produtosFornecedor); });
    lista.querySelectorAll('[data-editar-fornecedor]').forEach(b => { b.onclick = () => perfilEditarFornecedor(b.dataset.editarFornecedor); });
    lista.querySelectorAll('[data-remover-fornecedor]').forEach(b => { b.onclick = () => perfilRemoverFornecedor(b.dataset.removerFornecedor); });
}

function perfilSelecionarFornecedor(id) {
    perfilFornecedorSelecionado = id;
    perfilCancelarPreco();
    perfilCancelarFornecedor();
    document.getElementById('fornecedoresVisaoLista').classList.add('hidden');
    document.getElementById('fornecedorCadastro').classList.add('hidden');
    document.getElementById('perfilPainelPrecos').classList.remove('hidden');
    const fornecedor = perfilFornecedoresCache.find(f => f.id === id);
    document.getElementById('produtosFornecedorTitulo').textContent = fornecedor ? `Produtos de ${fornecedor.nome}` : 'Produtos sem fornecedor';
    document.getElementById('produtosFornecedorDados').textContent = fornecedor
        ? [fornecedor.categoria, fornecedor.telefone, fornecedor.endereco, fornecedor.observacoes].filter(Boolean).join(' · ')
        : 'Escolha um fornecedor ao editar cada produto para vinculá-lo.';
    document.getElementById('produtoFornecedorCampo').classList.toggle('hidden', Boolean(id));
    document.getElementById('precoFornecedor').value = id || '';
    perfilPreencherSelect(document.getElementById('precoCategoria'), fornecedor?.categoria || '');
    perfilRenderPrecos();
    document.getElementById('perfilSection').scrollTop = 0;
}

function perfilVoltarFornecedores() {
    perfilFornecedorSelecionado = null;
    perfilCancelarPreco();
    perfilCancelarFornecedor();
    document.getElementById('fornecedoresVisaoLista').classList.remove('hidden');
    document.getElementById('fornecedorCadastro').classList.remove('hidden');
    document.getElementById('perfilPainelPrecos').classList.add('hidden');
    perfilRenderFornecedores();
}

function perfilCancelarFornecedor() {
    perfilFornecedorEdicao = null;
    for (const id of ['fornecedorNome', 'fornecedorTelefone', 'fornecedorEndereco', 'fornecedorObservacoes', 'fornecedorCategoria']) document.getElementById(id).value = '';
    document.getElementById('fornecedorCadastroTitulo').textContent = 'Adicionar fornecedor';
    document.getElementById('fornecedorSubmit').textContent = 'Salvar fornecedor e adicionar produtos';
    document.getElementById('fornecedorCancelar').classList.add('hidden');
    document.getElementById('fornecedorCadastro').open = false;
    document.getElementById('fornecedorErro').textContent = '';
}

function perfilEditarFornecedor(id) {
    const f = perfilFornecedoresCache.find(f => f.id === id);
    if (!f) return;
    perfilFornecedorEdicao = id;
    for (const [campo, valor] of Object.entries({Nome: f.nome, Categoria: f.categoria, Telefone: f.telefone, Endereco: f.endereco, Observacoes: f.observacoes})) document.getElementById(`fornecedor${campo}`).value = valor || '';
    document.getElementById('fornecedorCadastroTitulo').textContent = `Editar ${f.nome}`;
    document.getElementById('fornecedorSubmit').textContent = 'Salvar dados do fornecedor';
    document.getElementById('fornecedorCancelar').classList.remove('hidden');
    const cadastro = document.getElementById('fornecedorCadastro');
    cadastro.classList.remove('hidden');
    cadastro.open = true;
    document.getElementById('fornecedorNome').focus();
}

async function perfilCarregarFornecedores() {
    const contextoSessao = capturarContextoSessao();
    try {
        const dados = await perfilConsultarJSON('/api/fornecedores', { headers: perfilHeaders(false) }, contextoSessao, 'Não foi possível carregar os fornecedores.');
        const fornecedores = dados.fornecedores || [];
        perfilFornecedoresCache = fornecedores;

        perfilPreencherSelectFornecedores();

        perfilRenderFornecedores();
        return true;
    } catch (error) {
        if (!contextoSessaoAtual(contextoSessao) || error.name === 'AbortError') return;
        document.getElementById('catalogoErro').textContent = error.message;
        return false;
    }
}

function perfilPreencherSelectFornecedores() {
    const select = document.getElementById("precoFornecedor");
    if (!select) return;
    const atual = select.value;
    select.innerHTML = '<option value="">Sem fornecedor</option>' +
        perfilFornecedoresCache.map(f => `<option value="${escapeHTML(f.id)}">${escapeHTML(f.nome)}</option>`).join("");
    if (atual) select.value = atual;
}

async function perfilCriarFornecedor() {
    const contextoSessao = capturarContextoSessao();
    const erro = document.getElementById("fornecedorErro");
    erro.textContent = "";
    const botao = document.getElementById('fornecedorSubmit');
    if (botao.disabled) return;
    if (!document.getElementById('fornecedorNome').reportValidity()) return;
    botao.disabled = true;
    const edicao = perfilFornecedorEdicao;
    const corpo = {
        nome: document.getElementById("fornecedorNome").value.trim(),
        categoria: document.getElementById("fornecedorCategoria").value,
        telefone: document.getElementById("fornecedorTelefone").value.trim(),
        endereco: document.getElementById("fornecedorEndereco").value.trim(),
        observacoes: document.getElementById("fornecedorObservacoes").value.trim()
    };
    try {
        const dados = await perfilConsultarJSON(edicao ? `/api/fornecedores/${encodeURIComponent(edicao)}` : '/api/fornecedores', { method: edicao ? 'PUT' : 'POST', headers: perfilHeaders(), body: JSON.stringify(corpo) }, contextoSessao, 'Não foi possível salvar o fornecedor.');
        const fornecedor = dados.fornecedor;
        if (!fornecedor?.id) throw new Error('O servidor não confirmou o fornecedor salvo.');
        perfilFornecedoresCache = [fornecedor, ...perfilFornecedoresCache.filter(f => f.id !== fornecedor.id)];
        perfilPreencherSelectFornecedores();
        perfilRenderFornecedores();
        perfilSelecionarFornecedor(fornecedor.id);
        perfilMensagem('Fornecedor salvo. Adicione os produtos abaixo, um por vez.');
    } catch (error) {
        if (!contextoSessaoAtual(contextoSessao) || error.name === 'AbortError') return;
        erro.textContent = error.message || 'Erro de conexão. Tente novamente.';
    } finally {
        if (contextoSessaoAtual(contextoSessao)) botao.disabled = false;
    }
}

async function perfilRemoverFornecedor(id) {
    const contextoSessao = capturarContextoSessao();
    if (!confirm('Remover este fornecedor? Os produtos serão mantidos em “Produtos sem fornecedor”.')) return;
    try {
        await perfilConsultarJSON(`/api/fornecedores/${encodeURIComponent(id)}`, { method: 'DELETE', headers: perfilHeaders(false) }, contextoSessao, 'Não foi possível remover o fornecedor.');
        perfilFornecedoresCache = perfilFornecedoresCache.filter(f => f.id !== id);
        perfilPrecosCache = perfilPrecosCache.map(p => p.fornecedor_id === id ? { ...p, fornecedor_id: null } : p);
        perfilPreencherSelectFornecedores();
        if (perfilFornecedorSelecionado === id) perfilVoltarFornecedores();
        perfilRenderFornecedores();
        perfilMensagem('Fornecedor removido. Seus produtos foram preservados.');
    } catch (error) {
        if (!contextoSessaoAtual(contextoSessao) || error.name === 'AbortError') return;
        document.getElementById('catalogoErro').textContent = error.message;
    }
}

/* ---------- FOTOS ---------- */

async function perfilCarregarFotos() {
    const contextoSessao = capturarContextoSessao();
    const lista = document.getElementById("fotosLista");
    const vazio = document.getElementById("fotosVazio");
    try {
        const dados = await perfilConsultarJSON('/api/fotos', { headers: perfilHeaders(false) }, contextoSessao, 'Não foi possível carregar as fotos.');
        const fotos = dados.fotos || [];

        vazio.classList.toggle("hidden", fotos.length > 0);
        lista.innerHTML = fotos.map(f => `
            <div class="perfil-item-card">
                ${f.url ? `<img class="perfil-foto-thumb" src="${escapeHTML(f.url)}" alt="${escapeHTML(f.nome_prato || 'Foto do prato')}">` : '<p class="field-hint">Foto cadastrada, mas a imagem não pôde ser carregada. Reabra o perfil para tentar novamente.</p>'}
                <strong>${escapeHTML(f.nome_prato || "Sem nome")}</strong>
                ${dados.compartilhamento?.disponivel ? `<details class="perfil-foto-compartilhamento" data-compartilhamento-foto="${escapeHTML(f.id)}">
                    <summary>Compartilhamento: ${f.compartilhada_catalogo || f.token_compartilhamento ? 'autorizado' : 'privado'}</summary>
                    <p class="field-hint">Compartilhe somente fotos que são suas ou que você tem permissão para disponibilizar.</p>
                    <label><input type="checkbox" data-foto-galeria ${f.compartilhada_catalogo ? 'checked' : ''}> Autorizar uso na galeria pública e como imagem de pratos nos planejamentos do Karamu</label>
                    <label><input type="checkbox" data-foto-link ${f.token_compartilhamento ? 'checked' : ''}> Autorizar acesso por link (qualquer pessoa com o link poderá ver)</label>
                    <label>Crédito público <input class="premium-input" data-foto-credito maxlength="80" value="${escapeHTML(f.credito_publico || '')}" placeholder="Seu nome ou apelido (opcional)"></label>
                    <button type="button" class="btn-secondary btn-small" data-salvar-compartilhamento>Salvar autorização</button>
                    ${f.token_compartilhamento ? `<label>Link de compartilhamento <input class="premium-input" readonly value="${escapeHTML(location.origin + '/foto/' + f.token_compartilhamento)}"></label><a href="/foto/${escapeHTML(f.token_compartilhamento)}" target="_blank" rel="noopener noreferrer">Abrir foto compartilhada</a>` : ''}
                    <p class="field-hint">Desmarque e salve para revogar. Cópias já baixadas não podem ser recolhidas.</p>
                </details>` : `<p class="field-hint">${escapeHTML(dados.compartilhamento?.motivo || 'Foto privada.')}</p>`}
                <div class="perfil-item-actions">
                    <button type="button" class="btn-secondary btn-small" data-remover-foto="${escapeHTML(f.id)}">Remover</button>
                </div>
            </div>
        `).join("");

        lista.querySelectorAll("[data-remover-foto]").forEach(botao => {
            botao.onclick = () => perfilRemoverFoto(botao.dataset.removerFoto);
        });
        lista.querySelectorAll('[data-salvar-compartilhamento]').forEach(botao => {
            botao.onclick = () => perfilSalvarCompartilhamento(botao.closest('[data-compartilhamento-foto]'));
        });
        lista.querySelectorAll('img').forEach(img => {
            img.onerror = () => {
                const aviso = document.createElement('p');
                aviso.className = 'field-hint';
                aviso.textContent = 'Não foi possível exibir a imagem. Reabra o perfil para tentar novamente.';
                img.replaceWith(aviso);
            };
        });
        return true;
    } catch (error) {
        if (!contextoSessaoAtual(contextoSessao) || error.name === 'AbortError') return;
        vazio.classList.add('hidden');
        document.getElementById('fotoErro').textContent = error.message;
        return false;
    }
}

async function perfilSalvarCompartilhamento(painel) {
    const contexto = capturarContextoSessao();
    const botao = painel.querySelector('[data-salvar-compartilhamento]');
    if (botao.disabled) return;
    const corpo = {
        galeria: painel.querySelector('[data-foto-galeria]').checked,
        link: painel.querySelector('[data-foto-link]').checked,
        credito: painel.querySelector('[data-foto-credito]').value.trim(),
        autorizacao: true
    };
    if ((corpo.galeria || corpo.link) && !confirm('Autoriza o compartilhamento desta foto nas opções marcadas? Você pode revogar depois.')) return;
    botao.disabled = true;
    document.getElementById('fotoErro').textContent = '';
    try {
        await perfilConsultarJSON(`/api/fotos/${encodeURIComponent(painel.dataset.compartilhamentoFoto)}/compartilhamento`, {method: 'PUT', headers: perfilHeaders(), body: JSON.stringify(corpo)}, contexto, 'Não foi possível salvar a autorização.');
        document.getElementById('fotoInfo').textContent = corpo.galeria || corpo.link ? 'Autorização salva nas opções escolhidas.' : 'Compartilhamento revogado. A foto está privada.';
        await perfilCarregarFotos();
    } catch (error) {
        if (contextoSessaoAtual(contexto) && error.name !== 'AbortError') document.getElementById('fotoErro').textContent = error.message;
    } finally { if (contextoSessaoAtual(contexto)) botao.disabled = false; }
}

function perfilLerArquivoComoDataUrl(arquivo) {
    return new Promise((resolve, reject) => {
        const leitor = new FileReader();
        leitor.onload = () => resolve(leitor.result);
        leitor.onerror = () => reject(new Error("Nao foi possivel ler o arquivo."));
        leitor.readAsDataURL(arquivo);
    });
}

async function perfilEnviarFoto() {
    const contextoSessao = capturarContextoSessao();
    const botao = document.getElementById('fotoSubmit');
    if (botao.disabled) return;
    const erro = document.getElementById("fotoErro");
    erro.textContent = "";
    document.getElementById('fotoInfo').textContent = '';
    const nomePrato = document.getElementById('fotoNomePrato').value.trim();
    if (!nomePrato) {
        erro.textContent = 'Informe o nome do prato antes de enviar a foto.';
        document.getElementById('fotoNomePrato').focus();
        return;
    }
    const input = document.getElementById("fotoArquivo");
    const arquivo = input.files?.[0];
    if (!arquivo) {
        erro.textContent = "Escolha um arquivo de imagem.";
        return;
    }
    if (arquivo.size > FOTO_UPLOAD_CONFIG.tamanhoMaximoBytes) {
        erro.textContent = FOTO_UPLOAD_CONFIG.mensagemLimite;
        return;
    }
    botao.disabled = true;
    try {
        const dataUrl = await perfilLerArquivoComoDataUrl(arquivo);
        if (!contextoSessaoAtual(contextoSessao)) return;
        const corpo = {
            tipo: arquivo.type,
            arquivo: dataUrl,
            nome_prato: nomePrato
        };
        const response = await fetchDaSessao("/api/fotos", { method: "POST", headers: perfilHeaders(), body: JSON.stringify(corpo) }, contextoSessao);
        // A hospedagem pode rejeitar antes do Express e devolver texto/HTML.
        if (response.status === 413) {
            erro.textContent = FOTO_UPLOAD_CONFIG.mensagemLimite;
            return;
        }
        const dados = await response.json();
        if (!contextoSessaoAtual(contextoSessao)) return;
        if (!response.ok || dados.ok === false) {
            erro.textContent = dados.error || "Nao foi possivel enviar a foto.";
            return;
        }
        if (!dados.foto?.id) throw new Error('O servidor não confirmou a foto salva.');
        document.getElementById("fotoNomePrato").value = "";
        input.value = "";
        document.getElementById('fotoInfo').textContent = `${nomePrato}: foto salva.`;
        await perfilCarregarFotos();
    } catch (error) {
        if (!contextoSessaoAtual(contextoSessao) || error.name === 'AbortError') return;
        erro.textContent = error.message || "Erro de conexao. Tente novamente.";
    } finally {
        if (contextoSessaoAtual(contextoSessao)) botao.disabled = false;
    }
}

async function perfilRemoverFoto(id) {
    const contextoSessao = capturarContextoSessao();
    if (!confirm("Remover esta foto?")) return;
    try {
        document.getElementById('fotoErro').textContent = '';
        await perfilConsultarJSON(`/api/fotos/${encodeURIComponent(id)}`, { method: 'DELETE', headers: perfilHeaders(false) }, contextoSessao, 'Não foi possível remover a foto.');
        document.getElementById('fotoInfo').textContent = 'Foto removida.';
        await perfilCarregarFotos();
    } catch (error) {
        if (!contextoSessaoAtual(contextoSessao) || error.name === 'AbortError') return;
        document.getElementById('fotoErro').textContent = error.message;
    }
}

/* ---------- CHAVE DE IA ---------- */

async function perfilCarregarChaveIA() {
    const contextoSessao = capturarContextoSessao();
    const badge = document.getElementById("chaveIABadge");
    const removerBtn = document.getElementById("chaveIARemover");
    try {
        const response = await fetchDaSessao("/api/perfil/chave-ia", { headers: perfilHeaders(false) }, contextoSessao);
        const dados = await response.json();
        const configurada = Boolean(dados.configurada);
        badge.innerHTML = configurada ? `${icon("check")} Chave configurada` : "Nenhuma chave configurada";
        badge.classList.toggle("configurada", configurada);
        badge.classList.toggle("nao-configurada", !configurada);
        removerBtn.classList.toggle("hidden", !configurada);
    } catch (error) {
        if (!contextoSessaoAtual(contextoSessao) || error.name === 'AbortError') return;
        console.warn("Nao foi possivel consultar a chave de IA:", error.message);
    }
}

async function perfilSalvarChaveIA() {
    const contextoSessao = capturarContextoSessao();
    const erro = document.getElementById("chaveIAErro");
    const info = document.getElementById("chaveIAInfo");
    erro.textContent = "";
    info.textContent = "";
    const input = document.getElementById("chaveIAInput");
    try {
        const response = await fetchDaSessao("/api/perfil/chave-ia", {
            method: "PUT", headers: perfilHeaders(), body: JSON.stringify({ chave: input.value.trim() })
        }, contextoSessao);
        const dados = await response.json();
        if (!response.ok || dados.ok === false) {
            erro.textContent = dados.error || "Nao foi possivel salvar a chave.";
            return;
        }
        input.value = "";
        info.textContent = "Chave salva com sucesso.";
        await perfilCarregarChaveIA();
    } catch (error) {
        if (!contextoSessaoAtual(contextoSessao) || error.name === 'AbortError') return;
        erro.textContent = "Erro de conexao. Tente novamente.";
    }
}

async function perfilRemoverChaveIA() {
    const contextoSessao = capturarContextoSessao();
    if (!confirm("Remover sua chave Gemini? A geracao voltara a usar a chave compartilhada.")) return;
    const erro = document.getElementById("chaveIAErro");
    const info = document.getElementById("chaveIAInfo");
    erro.textContent = "";
    info.textContent = "";
    try {
        const response = await fetchDaSessao("/api/perfil/chave-ia", { method: "DELETE", headers: perfilHeaders(false) }, contextoSessao);
        const dados = await response.json();
        if (!response.ok || dados.ok === false) {
            erro.textContent = dados.error || "Nao foi possivel remover a chave.";
            return;
        }
        info.textContent = "Chave removida.";
        await perfilCarregarChaveIA();
    } catch (error) {
        if (!contextoSessaoAtual(contextoSessao) || error.name === 'AbortError') return;
        erro.textContent = "Erro de conexao. Tente novamente.";
    }
}

/* ---------- PRECOS ---------- */
// Formatacao de preco (formatarPrecoBRL) vem de render.js, carregado antes
// deste arquivo em index.html — mesmo escopo global, sem precisar duplicar.

function perfilRenderPrecos() {
    const precos = perfilPrecosCache.filter(p => perfilFornecedorSelecionado === '' ? !p.fornecedor_id : p.fornecedor_id === perfilFornecedorSelecionado);
    const lista = document.getElementById('precosLista');
    document.getElementById('precosVazio').classList.toggle('hidden', precos.length > 0);
    lista.innerHTML = precos.map(p => `<div class="perfil-item-card">
        <strong>${escapeHTML(p.item)}</strong>
        <small>${escapeHTML(formatarPrecoBRL(p.preco))} / ${escapeHTML(p.unidade)} · ${escapeHTML(p.categoria || 'Sem categoria')}</small>
        ${p.observacoes ? `<small>${escapeHTML(p.observacoes)}</small>` : ''}
        <div class="perfil-item-actions">
            <button type="button" class="btn-secondary btn-small" data-editar-preco="${escapeHTML(p.id)}">Editar produto</button>
            <button type="button" class="btn-secondary btn-small" data-remover-preco="${escapeHTML(p.id)}">Remover</button>
        </div>
    </div>`).join('');
    lista.querySelectorAll('[data-editar-preco]').forEach(b => { b.onclick = () => perfilEditarPreco(b.dataset.editarPreco); });
    lista.querySelectorAll('[data-remover-preco]').forEach(b => { b.onclick = () => perfilRemoverPreco(b.dataset.removerPreco); });
}

function perfilCancelarPreco() {
    perfilPrecoEdicao = null;
    for (const id of ['precoItem', 'precoUnidade', 'precoValor', 'precoObservacoes']) document.getElementById(id).value = '';
    const fornecedor = perfilFornecedoresCache.find(f => f.id === perfilFornecedorSelecionado);
    document.getElementById('precoCategoria').value = fornecedor?.categoria || '';
    document.getElementById('precoFornecedor').value = perfilFornecedorSelecionado || '';
    document.getElementById('precoFormularioTitulo').textContent = 'Adicionar produto';
    document.getElementById('precoSubmit').textContent = 'Salvar produto e adicionar outro';
    document.getElementById('precoCancelar').classList.add('hidden');
    document.getElementById('precoErro').textContent = '';
}

function perfilEditarPreco(id) {
    const p = perfilPrecosCache.find(p => p.id === id);
    if (!p) return;
    perfilPrecoEdicao = id;
    for (const [campo, valor] of Object.entries({Item: p.item, Unidade: p.unidade, Valor: p.preco, Categoria: p.categoria, Fornecedor: p.fornecedor_id, Observacoes: p.observacoes})) document.getElementById(`preco${campo}`).value = valor ?? '';
    document.getElementById('precoFormularioTitulo').textContent = `Editar ${p.item}`;
    document.getElementById('precoSubmit').textContent = 'Salvar alterações do produto';
    document.getElementById('precoCancelar').classList.remove('hidden');
    document.getElementById('precoItem').focus();
}

async function perfilCarregarPrecos() {
    const contextoSessao = capturarContextoSessao();
    try {
        const dados = await perfilConsultarJSON('/api/precos', { headers: perfilHeaders(false) }, contextoSessao, 'Não foi possível carregar os produtos.');
        perfilPrecosCache = dados.precos || [];
        perfilRenderFornecedores();
        perfilRenderPrecos();
        return true;
    } catch (error) {
        if (!contextoSessaoAtual(contextoSessao) || error.name === 'AbortError') return;
        document.getElementById('catalogoErro').textContent = error.message;
        return false;
    }
}

async function perfilCriarPreco() {
    const contextoSessao = capturarContextoSessao();
    const erro = document.getElementById("precoErro");
    erro.textContent = "";
    const botao = document.getElementById('precoSubmit');
    if (botao.disabled || perfilFornecedorSelecionado === null) return;
    for (const id of ['precoItem', 'precoUnidade', 'precoValor']) if (!document.getElementById(id).reportValidity()) return;
    botao.disabled = true;
    const edicao = perfilPrecoEdicao;
    const selecionado = perfilFornecedorSelecionado;
    const corpo = {
        item: document.getElementById("precoItem").value.trim(),
        unidade: document.getElementById("precoUnidade").value.trim(),
        preco: Number(document.getElementById("precoValor").value),
        categoria: document.getElementById("precoCategoria").value,
        fornecedor_id: selecionado || document.getElementById("precoFornecedor").value || null,
        observacoes: document.getElementById("precoObservacoes").value.trim()
    };
    try {
        const dados = await perfilConsultarJSON(edicao ? `/api/precos/${encodeURIComponent(edicao)}` : '/api/precos', { method: edicao ? 'PUT' : 'POST', headers: perfilHeaders(), body: JSON.stringify(corpo) }, contextoSessao, 'Não foi possível salvar o produto.');
        if (!dados.preco?.id) throw new Error('O servidor não confirmou o produto salvo.');
        perfilPrecosCache = [dados.preco, ...perfilPrecosCache.filter(p => p.id !== dados.preco.id)];
        perfilRenderFornecedores();
        perfilRenderPrecos();
        if (perfilFornecedorSelecionado === selecionado && perfilPrecoEdicao === edicao) {
            perfilCancelarPreco();
            perfilMensagem(`${corpo.item} salvo${dados.preco.fornecedor_id ? ' no fornecedor' : ''}. Você pode adicionar outro produto.`);
            document.getElementById('precoItem').focus();
        }
    } catch (error) {
        if (!contextoSessaoAtual(contextoSessao) || error.name === 'AbortError') return;
        if (perfilFornecedorSelecionado === selecionado) erro.textContent = error.message || 'Erro de conexão. Tente novamente.';
    } finally {
        if (contextoSessaoAtual(contextoSessao)) botao.disabled = false;
    }
}

async function perfilRemoverPreco(id) {
    const contextoSessao = capturarContextoSessao();
    if (!confirm('Remover este produto do catálogo?')) return;
    try {
        await perfilConsultarJSON(`/api/precos/${encodeURIComponent(id)}`, { method: 'DELETE', headers: perfilHeaders(false) }, contextoSessao, 'Não foi possível remover o produto.');
        perfilPrecosCache = perfilPrecosCache.filter(p => p.id !== id);
        if (perfilPrecoEdicao === id) perfilCancelarPreco();
        perfilRenderPrecos();
        perfilRenderFornecedores();
        perfilMensagem('Produto removido.');
    } catch (error) {
        if (!contextoSessaoAtual(contextoSessao) || error.name === 'AbortError') return;
        document.getElementById('precoErro').textContent = error.message;
    }
}

async function perfilExportarPrecosCSV() {
    const contextoSessao = capturarContextoSessao();
    try {
        const response = await fetchDaSessao("/api/precos/exportar", { headers: perfilHeaders(false) }, contextoSessao);
        if (!response.ok) throw new Error("Falha ao exportar.");
        const blob = await response.blob();
        const url = URL.createObjectURL(blob);
        const link = document.createElement("a");
        link.href = url;
        link.download = "precos.csv";
        document.body.appendChild(link);
        link.click();
        link.remove();
        URL.revokeObjectURL(url);
    } catch (error) {
        if (!contextoSessaoAtual(contextoSessao) || error.name === 'AbortError') return;
        document.getElementById('catalogoErro').textContent = 'Não foi possível exportar o catálogo. Tente novamente.';
    }
}

/* ---------- ENTRADA/SAIDA DO PERFIL ---------- */

function perfilLigarEventosUmaVez() {
    if (perfilEventosLigados) return;
    perfilEventosLigados = true;

    document.getElementById('perfilPainelFornecedores').insertBefore(document.getElementById('perfilPainelPrecos'), document.getElementById('fornecedorCadastro'));
    document.getElementById('produtosVoltar').onclick = perfilVoltarFornecedores;
    document.getElementById('produtosSemFornecedor').onclick = () => perfilSelecionarFornecedor('');
    document.getElementById('fornecedorCancelar').onclick = perfilCancelarFornecedor;
    document.getElementById('precoCancelar').onclick = perfilCancelarPreco;

    document.querySelectorAll(".perfil-tab").forEach(botao => {
        botao.onclick = () => perfilAtivarAba(botao.dataset.perfilTab);
    });

    document.getElementById("fornecedorSubmit").onclick = perfilCriarFornecedor;
    document.getElementById("fotoSubmit").onclick = perfilEnviarFoto;
    document.getElementById("chaveIASalvar").onclick = perfilSalvarChaveIA;
    document.getElementById("chaveIARemover").onclick = perfilRemoverChaveIA;
    document.getElementById("precosExportar").onclick = perfilExportarPrecosCSV;
    document.getElementById("precoSubmit").onclick = perfilCriarPreco;
    document.getElementById("perfilSair").onclick = () => {
        if (confirm("Sair da conta? O histórico temporário desta sessão será removido. Salve o PDF antes de sair.")) void encerrarSessaoUsuario();
    };
}

async function perfilAbrir() {
    const contextoSessao = capturarContextoSessao();
    const sessao = obterSessaoUsuario();
    if (!sessao) return;

    perfilLigarEventosUmaVez();
    document.getElementById("perfilEmailLabel").textContent = sessao.email;
    perfilPreencherSelect(document.getElementById("fornecedorCategoria"));
    perfilPreencherSelect(document.getElementById("precoCategoria"));
    document.getElementById('catalogoErro').textContent = '';
    document.getElementById('fotoErro').textContent = '';

    await perfilCarregarFornecedores();
    if (!contextoSessaoAtual(contextoSessao)) return;
    await Promise.all([
        perfilCarregarFotos(),
        perfilCarregarChaveIA(),
        perfilCarregarPrecos()
    ]);
}

function perfilLimpar() {
    perfilFornecedoresCache = [];
    perfilPrecosCache = [];
    perfilFornecedorSelecionado = null;
    perfilFornecedorEdicao = null;
    perfilPrecoEdicao = null;
    perfilPreencherSelectFornecedores();
    perfilVoltarFornecedores();
    perfilMensagem('');
    document.getElementById('produtosFornecedorTitulo').textContent = '';
    document.getElementById('produtosFornecedorDados').textContent = '';
    perfilRenderPrecos();
    for (const id of ['fornecedorErro', 'fotoErro', 'fotoInfo', 'chaveIAErro', 'chaveIAInfo', 'precoErro', 'catalogoErro']) {
        const el = document.getElementById(id);
        if (el) el.textContent = '';
    }
    const badge = document.getElementById('chaveIABadge');
    if (badge) { badge.textContent = 'Entre para consultar'; badge.classList.remove('configurada'); }
    document.querySelectorAll('#perfilSection button').forEach(botao => { botao.disabled = false; });
}

window.chefIAPerfil = { abrir: perfilAbrir, limpar: perfilLimpar };
