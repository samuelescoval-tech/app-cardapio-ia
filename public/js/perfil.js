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
    fotos: "perfilPainelFotos",
    precos: "perfilPainelPrecos"
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

async function perfilCarregarFornecedores() {
    const contextoSessao = capturarContextoSessao();
    const lista = document.getElementById("fornecedoresLista");
    const vazio = document.getElementById("fornecedoresVazio");
    try {
        const response = await fetchDaSessao("/api/fornecedores", { headers: perfilHeaders(false) }, contextoSessao);
        const dados = await response.json();
        const fornecedores = dados.fornecedores || [];
        perfilFornecedoresCache = fornecedores;

        perfilPreencherSelectFornecedores();

        vazio.classList.toggle("hidden", fornecedores.length > 0);
        lista.innerHTML = fornecedores.map(f => `
            <div class="perfil-item-card">
                <strong>${escapeHTML(f.nome)}</strong>
                <small>${escapeHTML(f.categoria || "Sem categoria")}</small>
                ${f.telefone ? `<small>${icon("phone")} ${escapeHTML(f.telefone)}</small>` : ""}
                ${f.endereco ? `<small>${icon("map-pin")} ${escapeHTML(f.endereco)}</small>` : ""}
                ${f.observacoes ? `<small>${escapeHTML(f.observacoes)}</small>` : ""}
                <div class="perfil-item-actions">
                    <button type="button" class="btn-secondary btn-small" data-remover-fornecedor="${f.id}">Remover</button>
                </div>
            </div>
        `).join("");

        lista.querySelectorAll("[data-remover-fornecedor]").forEach(botao => {
            botao.onclick = () => perfilRemoverFornecedor(botao.dataset.removerFornecedor);
        });
    } catch (error) {
        if (!contextoSessaoAtual(contextoSessao) || error.name === 'AbortError') return;
        console.warn("Nao foi possivel carregar fornecedores:", error.message);
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
    const corpo = {
        nome: document.getElementById("fornecedorNome").value.trim(),
        categoria: document.getElementById("fornecedorCategoria").value,
        telefone: document.getElementById("fornecedorTelefone").value.trim(),
        endereco: document.getElementById("fornecedorEndereco").value.trim(),
        observacoes: document.getElementById("fornecedorObservacoes").value.trim()
    };
    try {
        const response = await fetchDaSessao("/api/fornecedores", { method: "POST", headers: perfilHeaders(), body: JSON.stringify(corpo) }, contextoSessao);
        const dados = await response.json();
        if (!response.ok || dados.ok === false) {
            erro.textContent = dados.error || "Nao foi possivel adicionar o fornecedor.";
            return;
        }
        ["fornecedorNome", "fornecedorTelefone", "fornecedorEndereco", "fornecedorObservacoes"].forEach(id => document.getElementById(id).value = "");
        document.getElementById("fornecedorCategoria").value = "";
        await perfilCarregarFornecedores();
    } catch (error) {
        if (!contextoSessaoAtual(contextoSessao) || error.name === 'AbortError') return;
        erro.textContent = "Erro de conexao. Tente novamente.";
    }
}

async function perfilRemoverFornecedor(id) {
    const contextoSessao = capturarContextoSessao();
    if (!confirm("Remover este fornecedor?")) return;
    try {
        await fetchDaSessao(`/api/fornecedores/${id}`, { method: "DELETE", headers: perfilHeaders(false) }, contextoSessao);
        await perfilCarregarFornecedores();
    } catch (error) {
        if (!contextoSessaoAtual(contextoSessao) || error.name === 'AbortError') return;
        console.warn("Nao foi possivel remover fornecedor:", error.message);
    }
}

/* ---------- FOTOS ---------- */

async function perfilCarregarFotos() {
    const contextoSessao = capturarContextoSessao();
    const lista = document.getElementById("fotosLista");
    const vazio = document.getElementById("fotosVazio");
    try {
        const response = await fetchDaSessao("/api/fotos", { headers: perfilHeaders(false) }, contextoSessao);
        const dados = await response.json();
        const fotos = dados.fotos || [];

        vazio.classList.toggle("hidden", fotos.length > 0);
        lista.innerHTML = fotos.map(f => `
            <div class="perfil-item-card">
                ${f.url ? `<img class="perfil-foto-thumb" src="${escapeHTML(f.url)}" alt="${escapeHTML(f.nome_prato || 'Foto do prato')}">` : ""}
                <strong>${escapeHTML(f.nome_prato || "Sem nome")}</strong>
                <div class="perfil-item-actions">
                    <button type="button" class="btn-secondary btn-small" data-remover-foto="${f.id}">Remover</button>
                </div>
            </div>
        `).join("");

        lista.querySelectorAll("[data-remover-foto]").forEach(botao => {
            botao.onclick = () => perfilRemoverFoto(botao.dataset.removerFoto);
        });
    } catch (error) {
        if (!contextoSessaoAtual(contextoSessao) || error.name === 'AbortError') return;
        console.warn("Nao foi possivel carregar fotos:", error.message);
    }
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
    const erro = document.getElementById("fotoErro");
    erro.textContent = "";
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
    const botao = document.getElementById("fotoSubmit");
    botao.disabled = true;
    try {
        const dataUrl = await perfilLerArquivoComoDataUrl(arquivo);
        if (!contextoSessaoAtual(contextoSessao)) return;
        const corpo = {
            tipo: arquivo.type,
            arquivo: dataUrl,
            nome_prato: document.getElementById("fotoNomePrato").value.trim()
        };
        const response = await fetchDaSessao("/api/fotos", { method: "POST", headers: perfilHeaders(), body: JSON.stringify(corpo) }, contextoSessao);
        // A hospedagem pode rejeitar antes do Express e devolver texto/HTML.
        if (response.status === 413) {
            erro.textContent = FOTO_UPLOAD_CONFIG.mensagemLimite;
            return;
        }
        const dados = await response.json();
        if (!response.ok || dados.ok === false) {
            erro.textContent = dados.error || "Nao foi possivel enviar a foto.";
            return;
        }
        document.getElementById("fotoNomePrato").value = "";
        input.value = "";
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
        await fetchDaSessao(`/api/fotos/${id}`, { method: "DELETE", headers: perfilHeaders(false) }, contextoSessao);
        await perfilCarregarFotos();
    } catch (error) {
        if (!contextoSessaoAtual(contextoSessao) || error.name === 'AbortError') return;
        console.warn("Nao foi possivel remover foto:", error.message);
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

async function perfilCarregarPrecos() {
    const contextoSessao = capturarContextoSessao();
    const lista = document.getElementById("precosLista");
    const vazio = document.getElementById("precosVazio");
    try {
        const response = await fetchDaSessao("/api/precos", { headers: perfilHeaders(false) }, contextoSessao);
        const dados = await response.json();
        const precos = dados.precos || [];

        vazio.classList.toggle("hidden", precos.length > 0);
        lista.innerHTML = precos.map(p => {
            const fornecedor = perfilFornecedoresCache.find(f => f.id === p.fornecedor_id);
            return `
            <div class="perfil-item-card">
                <strong>${escapeHTML(p.item)} — ${escapeHTML(formatarPrecoBRL(p.preco))} / ${escapeHTML(p.unidade)}</strong>
                <small>${escapeHTML(p.categoria || "Sem categoria")}</small>
                ${fornecedor ? `<small>${icon("store")} ${escapeHTML(fornecedor.nome)}</small>` : ""}
                ${p.observacoes ? `<small>${escapeHTML(p.observacoes)}</small>` : ""}
                <div class="perfil-item-actions">
                    <button type="button" class="btn-secondary btn-small" data-remover-preco="${p.id}">Remover</button>
                </div>
            </div>
        `;
        }).join("");

        lista.querySelectorAll("[data-remover-preco]").forEach(botao => {
            botao.onclick = () => perfilRemoverPreco(botao.dataset.removerPreco);
        });
    } catch (error) {
        if (!contextoSessaoAtual(contextoSessao) || error.name === 'AbortError') return;
        console.warn("Nao foi possivel carregar precos:", error.message);
    }
}

async function perfilCriarPreco() {
    const contextoSessao = capturarContextoSessao();
    const erro = document.getElementById("precoErro");
    erro.textContent = "";
    const corpo = {
        item: document.getElementById("precoItem").value.trim(),
        unidade: document.getElementById("precoUnidade").value.trim(),
        preco: Number(document.getElementById("precoValor").value),
        categoria: document.getElementById("precoCategoria").value,
        fornecedor_id: document.getElementById("precoFornecedor").value || null,
        observacoes: document.getElementById("precoObservacoes").value.trim()
    };
    try {
        const response = await fetchDaSessao("/api/precos", { method: "POST", headers: perfilHeaders(), body: JSON.stringify(corpo) }, contextoSessao);
        const dados = await response.json();
        if (!response.ok || dados.ok === false) {
            erro.textContent = dados.error || "Nao foi possivel adicionar o preco.";
            return;
        }
        ["precoItem", "precoUnidade", "precoValor", "precoObservacoes"].forEach(id => document.getElementById(id).value = "");
        document.getElementById("precoCategoria").value = "";
        document.getElementById("precoFornecedor").value = "";
        await perfilCarregarPrecos();
    } catch (error) {
        if (!contextoSessaoAtual(contextoSessao) || error.name === 'AbortError') return;
        erro.textContent = "Erro de conexao. Tente novamente.";
    }
}

async function perfilRemoverPreco(id) {
    const contextoSessao = capturarContextoSessao();
    if (!confirm("Remover este preco?")) return;
    try {
        await fetchDaSessao(`/api/precos/${id}`, { method: "DELETE", headers: perfilHeaders(false) }, contextoSessao);
        await perfilCarregarPrecos();
    } catch (error) {
        if (!contextoSessaoAtual(contextoSessao) || error.name === 'AbortError') return;
        console.warn("Nao foi possivel remover preco:", error.message);
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
        console.warn("Nao foi possivel exportar precos:", error.message);
    }
}

/* ---------- ENTRADA/SAIDA DO PERFIL ---------- */

function perfilLigarEventosUmaVez() {
    if (perfilEventosLigados) return;
    perfilEventosLigados = true;

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
    perfilPreencherSelectFornecedores();
    for (const id of ['fornecedorErro', 'fotoErro', 'chaveIAErro', 'chaveIAInfo', 'precoErro']) {
        const el = document.getElementById(id);
        if (el) el.textContent = '';
    }
    const badge = document.getElementById('chaveIABadge');
    if (badge) { badge.textContent = 'Entre para consultar'; badge.classList.remove('configurada'); }
    document.querySelectorAll('#perfilSection button').forEach(botao => { botao.disabled = false; });
}

window.chefIAPerfil = { abrir: perfilAbrir, limpar: perfilLimpar };
