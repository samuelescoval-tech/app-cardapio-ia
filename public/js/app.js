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
        // 2. Chamada ao Servidor (Back-end)
        const response = await fetch("/gerar-cardapio", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ evento })
        });

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
        exibirResultadoLuxo(dadosIA, pessoas);

        // TAG: integracao-historico | FASE 1
        // Salvar evento + plano no histórico
        if (window.storageService) {
            window.storageService.salvarHistorico(evento, dadosIA);
            renderizarHistorico();
        }

    } catch (error) {
        console.error(error);
        resultadoArea.innerHTML = `<p style="color:red; text-align:center;">Erro ao conectar com o servidor Node.js. Detalhes: ${error.message}</p>`;
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
    // Renderizar histórico ao carregar
    setTimeout(() => {
        renderizarHistorico();
    }, 500);
});
