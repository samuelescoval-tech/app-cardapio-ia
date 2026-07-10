/* ==========================================================================
   CHEF IA STUDIO | APP ENTRYPOINT
   TAG: bootstrap, navegacao, fetch-backend
   --------------------------------------------------------------------------
   Responsabilidade: estado da tela, navegacao e chamada POST /gerar-cardapio.
   Prompt, renderizacao e helpers ficam em arquivos separados.
   ========================================================================== */

/* TAG: estado-slideshow */
let curSlide = 0;
const slides = document.querySelectorAll('.slide');
let demoAccessRequired = false;
let demoAccessMessage = "";

async function inicializarAcessoDemo() {
    try {
        const response = await fetch('/api/status');
        const status = await response.json();
        demoAccessRequired = Boolean(status.demo_access?.required);
    } catch (error) {
        console.warn('Não foi possível verificar acesso demo:', error.message);
    }
}

async function obterDemoAccessKey() {
    if (!demoAccessRequired) return null;

    const key = sessionStorage.getItem('chef_ia_demo_access_key');
    if (!key) {
        return solicitarDemoAccessKey();
    }

    return key.trim();
}

function solicitarDemoAccessKey() {
    const modal = document.getElementById('demoAccessModal');
    const input = document.getElementById('demoAccessInput');
    const error = document.getElementById('demoAccessError');
    const submit = document.getElementById('demoAccessSubmit');
    const cancel = document.getElementById('demoAccessCancel');
    const close = document.getElementById('demoAccessClose');

    if (!modal || !input || !error || !submit || !cancel || !close) {
        return Promise.resolve(null);
    }

    return new Promise(resolve => {
        const finalizar = valor => {
            modal.classList.add('hidden');
            document.body.classList.remove('modal-open');
            modal.removeEventListener('keydown', handleKeydown);
            submit.onclick = null;
            cancel.onclick = null;
            close.onclick = null;
            input.oninput = null;
            resolve(valor);
        };

        const confirmar = () => {
            const key = input.value.trim();
            if (!key) {
                error.textContent = "Informe a senha temporaria para continuar.";
                input.focus();
                return;
            }

            sessionStorage.setItem('chef_ia_demo_access_key', key);
            demoAccessMessage = "";
            finalizar(key);
        };

        const cancelar = () => finalizar(null);

        function handleKeydown(event) {
            if (event.key === "Escape") cancelar();
            if (event.key === "Enter") confirmar();
        }

        input.value = "";
        error.textContent = demoAccessMessage;
        submit.onclick = confirmar;
        cancel.onclick = cancelar;
        close.onclick = cancelar;
        input.oninput = () => {
            error.textContent = "";
        };

        document.body.classList.add('modal-open');
        modal.classList.remove('hidden');
        modal.addEventListener('keydown', handleKeydown);
        requestAnimationFrame(() => input.focus());
    });
}

function limparDemoAccessKey(message = "") {
    sessionStorage.removeItem('chef_ia_demo_access_key');
    demoAccessMessage = message;
}

function exibirErroResultado(resultadoArea, mensagem) {
    resultadoArea.classList.remove('hidden');
    resultadoArea.innerHTML = `
        <div class="glass-panel error-panel">
            <p><strong>Não foi possível gerar o planejamento.</strong></p>
            <p>${escapeHTML(mensagem)}</p>
        </div>
    `;
}

/* TAG: animacao-hero */
setInterval(() => {
    if (slides.length > 0) {
        slides[curSlide].classList.remove('active');
        curSlide = (curSlide + 1) % slides.length;
        slides[curSlide].classList.add('active');
    }
}, 3500);

/* TAG: navegacao-app-pitch */
function switchView(view) {
    const app = document.getElementById('appSection');
    const pitch = document.getElementById('pitchSection');
    const btnApp = document.getElementById('btnApp');
    const btnPitch = document.getElementById('btnPitch');

    if (view === 'app') {
        app.classList.remove('hidden');
        pitch.classList.add('hidden');
        btnApp.classList.add('active');
        btnPitch.classList.remove('active');
    } else {
        app.classList.add('hidden');
        pitch.classList.remove('hidden');
        btnApp.classList.remove('active');
        btnPitch.classList.add('active');
    }
}

function toggleHeader() {
    document.getElementById('mainHero').classList.toggle('collapsed');
}

/* TAG: fluxo-principal-ia */
async function gerarTudo() {
    // 1. Captura de Campos (Nova Interface + Antiga)
    const tipo = document.getElementById('tipo').value;
    const pessoas = document.getElementById('pessoas').value;
    const estilo = document.querySelector('input[name="estilo"]:checked')?.value || "Não informado";
    
    // Se você tiver esses IDs no HTML, ele pega, senão usa padrão
    const restricoes = document.getElementById('restricoes')?.value || "Nenhuma";
    const obs = document.getElementById('userChat')?.value || "Sem observações adicionais";
    const duracao = document.getElementById('duracao')?.value || "padrao do evento";
    const refeicao = document.getElementById('refeicao')?.value || "Nao informado";
    const tema = document.getElementById('tema')?.value || "Nao informado";
    const alcool = document.getElementById('alcool')?.value || "Nao informado";
    const orcamentoBase = document.getElementById('orcamentoBase')?.value || "Nao informado";
    
    const resultadoArea = document.getElementById('resultadoArea');
    const btn = document.getElementById('btnGerar');

    if (!tipo || !pessoas) {
        alert("Por favor, informe o tipo de evento e a quantidade de pessoas.");
        return;
    }

    const evento = {
        tipo,
        pessoas,
        estilo,
        restricoes,
        obs,
        duracao,
        refeicao,
        tema,
        alcool,
        orcamentoBase
    };

    try {
        const demoAccessKey = await obterDemoAccessKey();
        if (demoAccessRequired && !demoAccessKey) {
            exibirErroResultado(resultadoArea, "A demo esta protegida. Informe a senha temporaria para gerar o planejamento.");
            return;
        }

        // Feedback visual
        btn.disabled = true;
        btn.innerText = "⚙️ CALCULANDO LOGISTICA + IA...";
        document.getElementById('mainHero').classList.add('collapsed');

        resultadoArea.classList.remove('hidden');
        resultadoArea.innerHTML = `
            <div class="glass-panel" style="text-align:center; border-top: 4px solid var(--gold);">
                <p><strong>O Chef IA está arquitetando seu evento...</strong></p>
                <p style="font-size:0.8rem; opacity:0.7;">Calculando logística para ${pessoas} convidados (${estilo})</p>
            </div>
        `;

        const headers = { "Content-Type": "application/json" };
        if (demoAccessKey) headers["x-demo-access-key"] = demoAccessKey;

        // 2. Chamada ao Servidor (Back-end)
        const response = await fetch("/gerar-cardapio", {
            method: "POST",
            headers,
            body: JSON.stringify({ evento })
        });

        if (response.status === 401) {
            demoAccessRequired = true;
            limparDemoAccessKey("Senha temporaria invalida. Confira a senha e tente novamente.");
            throw new Error("Senha temporária inválida. Tente gerar novamente e informe a senha correta.");
        }

        if (!response.ok) throw new Error("Erro no servidor.");
        const resposta = await response.json();

        // Nova estrutura: { ok, provider, plano, meta }
        // Compatibilidade: se for JSON direto, passa como está
        const dadosIA = resposta.plano || resposta;

        if (!dadosIA) {
            throw new Error("Resposta sem dados válidos.");
        }

        if (resposta.ok === false && resposta.meta?.erro) {
            console.warn("A IA retornou fallback:", resposta.meta.erro);
        }

        // 3. Exibição com visual premium e seções completas
        exibirResultadoLuxo(dadosIA, pessoas, evento);

        // TAG: integracao-historico | FASE 1
        // Salvar evento + plano no histórico
        if (window.storageService) {
            window.storageService.salvarHistorico(evento, dadosIA);
            renderizarHistorico();
        }

    } catch (error) {
        console.error(error);
        exibirErroResultado(resultadoArea, `Detalhes: ${error.message}`);
    } finally {
        btn.disabled = false;
        btn.innerText = "⚙️ CALCULAR + GERAR PLANEJAMENTO COMPLETO";
    }
}

/* TAG: render-historico | FASE 1 */

/**
 * Renderizar cards do histórico
 */
function renderizarHistorico() {
    const container = document.getElementById('historico-container');
    if (!container || !window.storageService) return;

    const historico = window.storageService.carregarHistorico();

    if (historico.length === 0) {
        container.innerHTML = '<p class="historico-vazio">Nenhum planejamento salvo ainda</p>';
        return;
    }

    container.innerHTML = historico.map(entrada => `
        <div class="historico-card">
            <div class="historico-card-header">
                <div class="historico-card-title">${escapeHTML(entrada.tipo)}</div>
            </div>
            <div class="historico-card-meta">
                <span>👥 ${entrada.pessoas} pessoas</span>
                <span>⏰ ${window.storageService.formatarDataBR(entrada.data_criacao)}</span>
            </div>
            <div class="historico-card-resumo">
                ${escapeHTML(entrada.resumo)}
            </div>
            <div class="historico-card-acoes">
                <button class="historico-btn-carregar" onclick="carregarDoHistorico('${entrada.id}')">
                    📂 Carregar
                </button>
                <button class="historico-btn-deletar" onclick="deletarDoHistorico('${entrada.id}')">
                    🗑️ Deletar
                </button>
            </div>
        </div>
    `).join('');
}

/**
 * Carregar uma entrada do histórico e preencher o formulário
 */
function carregarDoHistorico(id) {
    if (!window.storageService) return;

    const entrada = window.storageService.carregarEntrada(id);
    if (!entrada) {
        alert('❌ Planejamento não encontrado');
        return;
    }

    // Preencher formulário
    const evento = entrada.evento;
    document.getElementById('tipo').value = evento.tipo || '';
    document.getElementById('pessoas').value = evento.pessoas || '';
    document.getElementById('restricoes').value = evento.restricoes || '';
    document.getElementById('userChat').value = evento.obs || '';
    document.getElementById('duracao').value = evento.duracao || '';
    document.getElementById('refeicao').value = evento.refeicao || '';
    document.getElementById('tema').value = evento.tema || '';
    document.getElementById('orcamentoBase').value = evento.orcamentoBase || '';
    document.getElementById('alcool').value = evento.alcool || '';

    // Definir o radio button de estilo
    const radioEstilo = document.querySelector(`input[name="estilo"][value="${evento.estilo}"]`);
    if (radioEstilo) radioEstilo.checked = true;

    // Scroll para o formulário
    document.getElementById('formCard').scrollIntoView({ behavior: 'smooth' });

    if (entrada.plano) {
        exibirResultadoLuxo(entrada.plano, evento.pessoas || '', evento);
    }

    console.log('✅ Planejamento carregado:', id);
}

/**
 * Deletar uma entrada do histórico
 */
function deletarDoHistorico(id) {
    if (!window.storageService) return;

    if (!confirm('Tem certeza que quer deletar este planejamento?')) {
        return;
    }

    if (window.storageService.deletarEntrada(id)) {
        renderizarHistorico();
        console.log('✅ Deletado');
    }
}

/**
 * Limpar todo o histórico
 */
function limparHistoricoUI() {
    if (!window.storageService) return;

    if (!confirm('⚠️ Isso vai deletar TODOS os planejamentos salvos. Tem certeza?')) {
        return;
    }

    if (window.storageService.limparHistorico()) {
        renderizarHistorico();
    }
}

/* TAG: init-historico | Chamar ao carregar página */
document.addEventListener('DOMContentLoaded', function() {
    inicializarAcessoDemo();

    // Renderizar histórico ao carregar
    setTimeout(() => {
        renderizarHistorico();
    }, 500);
});
