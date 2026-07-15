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
let sequenciaConsultaVisual = 0;
window.chefIARecipeReferencesAvailable = false;
window.chefIAVisualReferencesAvailable = null;

async function inicializarAcessoDemo() {
    try {
        const response = await fetch('/api/status');
        const status = await response.json();
        demoAccessRequired = Boolean(status.demo_access?.required);
        window.chefIARecipeReferencesAvailable = Boolean(status.recipe_references?.configured);
        window.chefIAVisualReferencesAvailable = Boolean(status.visual_references?.configured);
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

function exibirErroResultado(resultadoArea, mensagem, resultadoAnterior = "") {
    resultadoArea.classList.remove('hidden');
    resultadoArea.innerHTML = `
        <div class="glass-panel error-panel">
            <p><strong>Não foi possível gerar o planejamento.</strong></p>
            <p>${escapeHTML(mensagem)}</p>
        </div>
        ${resultadoAnterior}
    `;
    resultadoArea.dataset.planoValido = resultadoAnterior ? "true" : "false";
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
        btnApp.setAttribute('aria-pressed', 'true');
        btnPitch.setAttribute('aria-pressed', 'false');
    } else {
        app.classList.add('hidden');
        pitch.classList.remove('hidden');
        btnApp.classList.remove('active');
        btnPitch.classList.add('active');
        btnApp.setAttribute('aria-pressed', 'false');
        btnPitch.setAttribute('aria-pressed', 'true');
    }
}

function toggleHeader() {
    const hero = document.getElementById('mainHero');
    const button = hero?.querySelector('.toggle-header');
    const collapsed = hero?.classList.toggle('collapsed');
    button?.setAttribute('aria-expanded', String(!collapsed));
    button?.setAttribute('aria-label', collapsed ? 'Expandir capa' : 'Recolher capa');
}

/* TAG: fluxo-principal-ia */
async function gerarTudo() {
    // 1. Captura de Campos (Nova Interface + Antiga)
    const tipo = document.getElementById('tipo').value;
    const pessoas = document.getElementById('pessoas').value;
    const criancas = document.getElementById('criancas')?.value || "0";
    const estilo = document.querySelector('input[name="estilo"]:checked')?.value || "Não informado";
    
    // Se você tiver esses IDs no HTML, ele pega, senão usa padrão
    const restricoes = document.getElementById('restricoes')?.value || "Nenhuma";
    const obs = document.getElementById('userChat')?.value || "Sem observações adicionais";
    const duracao = document.getElementById('duracao')?.value || "padrao do evento";
    const dataEvento = document.getElementById('dataEvento')?.value || "";
    const pais = document.getElementById('pais')?.value || "Brasil";
    const estado = document.getElementById('estado')?.value || "";
    const cidade = document.getElementById('cidade')?.value || "";
    const refeicao = document.getElementById('refeicao')?.value || "Nao informado";
    const tema = document.getElementById('tema')?.value || "Nao informado";
    const alcool = document.getElementById('alcool')?.value || "Nao informado";
    const orcamentoBase = document.getElementById('orcamentoBase')?.value || "Nao informado";
    const horarioInicio = document.getElementById('horarioInicio')?.value || "";
    const formatoServico = document.getElementById('formatoServico')?.value || "A definir pelo Chef IA";
    const faixaEtaria = document.getElementById('faixaEtaria')?.value || "Publico misto";
    const infraestrutura = document.getElementById('infraestrutura')?.value || "A confirmar";
    const prioridade = document.getElementById('prioridade')?.value || "Equilibrio geral";
    
    const resultadoArea = document.getElementById('resultadoArea');
    const btn = document.getElementById('btnGerar');
    const resultadoAnterior = resultadoArea.dataset.planoValido === "true"
        ? resultadoArea.innerHTML
        : "";

    if (!tipo || !pessoas) {
        alert("Por favor, informe o tipo de evento e a quantidade de pessoas.");
        return;
    }

    const evento = {
        tipo,
        pessoas,
        criancas,
        estilo,
        restricoes,
        obs,
        duracao,
        dataEvento,
        pais,
        estado,
        cidade,
        refeicao,
        tema,
        alcool,
        orcamentoBase,
        horarioInicio,
        formatoServico,
        faixaEtaria,
        infraestrutura,
        prioridade
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
        resultadoArea.dataset.planoValido = "false";
        resultadoArea.innerHTML = `
            <div class="glass-panel" style="text-align:center; border-top: 4px solid var(--gold);">
                <p><strong>O Chef IA está arquitetando seu evento...</strong></p>
                <p style="font-size:0.8rem; opacity:0.7;">Calculando logística para ${pessoas} convidados (${estilo})</p>
            </div>
        `;

        const headers = { "Content-Type": "application/json" };
        if (demoAccessKey) headers["x-demo-access-key"] = demoAccessKey;

        // 2. Chamada ao Servidor (Back-end)
        const historicoCulinario = window.storageService?.criarMemoriaCulinaria?.() || [];
        window.chefIALastCulinaryMemoryCount = historicoCulinario.length;
        const response = await fetch("/gerar-cardapio", {
            method: "POST",
            headers,
            body: JSON.stringify({ evento, historico_culinario: historicoCulinario })
        });
        const resposta = await response.json().catch(() => ({}));
        window.chefIALastResponseMeta = resposta.meta || null;

        if (response.status === 401) {
            demoAccessRequired = true;
            limparDemoAccessKey("Senha temporaria invalida. Confira a senha e tente novamente.");
            throw new Error("Senha temporária inválida. Tente gerar novamente e informe a senha correta.");
        }

        if (!response.ok) {
            throw new Error(resposta.error || "Erro no servidor.");
        }

        if (resposta.ok === false) {
            console.warn("A IA retornou um plano inválido:", resposta.meta?.erro || resposta.error);
            throw new Error("O plano gerado não passou pela validação. Seu último planejamento válido foi preservado; tente novamente.");
        }

        // Nova estrutura: { ok, provider, plano, meta }
        // Compatibilidade: se for JSON direto, passa como está
        const dadosIA = resposta.plano || resposta;
        if (!dadosIA) {
            throw new Error("Resposta sem dados válidos.");
        }

        // 3. Exibição com visual premium e seções completas
        exibirResultadoLuxo(dadosIA, pessoas, evento);
        resultadoArea.dataset.planoValido = "true";

        // TAG: integracao-historico | FASE 1
        // Salvar evento + plano no histórico
        if (window.storageService) {
            const historicoId = window.storageService.salvarHistorico(evento, dadosIA);
            renderizarHistorico();
            if (!historicoId) {
                resultadoArea.insertAdjacentHTML('afterbegin', `
                    <div class="glass-panel error-panel">
                        <p><strong>O planejamento foi gerado, mas não pôde ser salvo nos projetos recentes.</strong></p>
                    </div>
                `);
            }
        }

        // Referencias visuais sao transitorias e nao bloqueiam historico ou PDF.
        void carregarImagensEvento(evento, dadosIA.cardapio || [], demoAccessKey);

    } catch (error) {
        console.error(error);
        exibirErroResultado(resultadoArea, `Detalhes: ${error.message}`, resultadoAnterior);
    } finally {
        btn.disabled = false;
        btn.innerText = "⚙️ CALCULAR + GERAR PLANEJAMENTO COMPLETO";
    }
}

async function carregarImagensEvento(evento, pratos = [], demoAccessKey = null) {
    const sequencia = ++sequenciaConsultaVisual;
    if (window.chefIAVisualReferencesAvailable === false) {
        renderizarGaleriaEventoFallback("A consulta visual externa nao esta configurada.");
        return;
    }

    try {
        const headers = { "Content-Type": "application/json" };
        if (demoAccessKey) headers["x-demo-access-key"] = demoAccessKey;
        const response = await fetch("/api/imagens-evento", {
            method: "POST",
            headers,
            body: JSON.stringify({ evento, pratos })
        });
        const resultado = await response.json().catch(() => ({}));
        if (sequencia !== sequenciaConsultaVisual) return;

        if (response.status === 401) {
            demoAccessRequired = true;
            limparDemoAccessKey("Senha temporaria invalida.");
        }
        if (!response.ok || resultado.ok === false) {
            throw new Error(resultado.error || "Consulta visual indisponivel.");
        }
        renderizarGaleriaEvento(resultado);
    } catch (error) {
        if (sequencia !== sequenciaConsultaVisual) return;
        console.warn("Referencias visuais indisponiveis:", error.message);
        renderizarGaleriaEventoFallback(error.message);
    }
}

function cancelarConsultaVisualPendente() {
    sequenciaConsultaVisual += 1;
}

async function buscarReferenciasExternas() {
    const input = document.getElementById('recipeReferenceQuery');
    const resultado = document.getElementById('recipeReferenceResults');
    const botao = document.getElementById('recipeReferenceButton');
    if (!input || !resultado || !botao) return;

    const query = input.value.replace(/\s+/g, ' ').trim();
    if (query.length < 2 || query.length > 80) {
        resultado.innerHTML = '<p class="reference-message">Informe uma busca entre 2 e 80 caracteres.</p>';
        return;
    }

    try {
        const demoAccessKey = await obterDemoAccessKey();
        if (demoAccessRequired && !demoAccessKey) {
            resultado.innerHTML = '<p class="reference-message">Informe a senha temporária para consultar referências.</p>';
            return;
        }

        botao.disabled = true;
        botao.textContent = 'Consultando...';
        resultado.innerHTML = '<p class="reference-message">Busca transitória em andamento. Nenhum conteúdo será salvo.</p>';

        const headers = { 'Content-Type': 'application/json' };
        if (demoAccessKey) headers['x-demo-access-key'] = demoAccessKey;
        const response = await fetch('/api/referencias-receitas', {
            method: 'POST',
            headers,
            body: JSON.stringify({ query })
        });
        const data = await response.json().catch(() => ({}));

        if (response.status === 401) {
            demoAccessRequired = true;
            limparDemoAccessKey('Senha temporária inválida.');
        }
        if (!response.ok || data.ok === false) {
            throw new Error(data.error || 'Consulta externa indisponível.');
        }

        const referencias = Array.isArray(data.references) ? data.references : [];
        resultado.innerHTML = referencias.length
            ? `<div class="reference-grid">${referencias.map(renderReferenciaExterna).join('')}</div>
               <p class="reference-disclaimer">Resultados transitórios: não entram no planejamento, histórico ou PDF. Confira a fonte original.</p>`
            : '<p class="reference-message">Nenhuma referência encontrada para essa busca.</p>';
    } catch (error) {
        resultado.innerHTML = `<p class="reference-message">${escapeHTML(error.message)}</p>`;
    } finally {
        botao.disabled = false;
        botao.textContent = 'Buscar referências';
    }
}

function renderReferenciaExterna(referencia) {
    const sourceUrl = urlHttpsSegura(referencia.source_url);
    const imageUrl = urlHttpsSegura(referencia.image_url);
    if (!sourceUrl) return '';
    const detalhes = [
        Number.isFinite(referencia.ready_in_minutes) ? `${referencia.ready_in_minutes} min` : '',
        Number.isFinite(referencia.servings) ? `${referencia.servings} porções` : ''
    ].filter(Boolean).join(' · ');

    return `
        <article class="reference-card">
            ${imageUrl ? `<img src="${escapeHTML(imageUrl)}" alt="" loading="lazy" referrerpolicy="no-referrer">` : ''}
            <div>
                <h4>${escapeHTML(referencia.title || 'Referência culinária')}</h4>
                ${detalhes ? `<small>${escapeHTML(detalhes)}</small>` : ''}
                <a href="${escapeHTML(sourceUrl)}" target="_blank" rel="noopener noreferrer">Ver em ${escapeHTML(referencia.source_name || 'fonte original')}</a>
            </div>
        </article>
    `;
}

function urlHttpsSegura(valor) {
    if (typeof valor !== 'string' || !valor) return null;
    try {
        const url = new URL(valor);
        return url.protocol === 'https:' ? url.toString() : null;
    } catch {
        return null;
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
    const erroHistorico = window.storageService.obterUltimoErroHistorico?.();

    if (historico.length === 0) {
        container.innerHTML = erroHistorico
            ? `<p class="historico-vazio">${escapeHTML(erroHistorico)} Os dados existentes não foram apagados.</p>`
            : '<p class="historico-vazio">Nenhum planejamento salvo neste navegador e endereço.</p>';
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
                ${entrada.plano_valido ? '' : '<br><strong>Geração incompleta — mantida apenas para diagnóstico.</strong>'}
            </div>
            <div class="historico-card-acoes">
                <button type="button" class="historico-btn-carregar" ${entrada.plano_valido ? `onclick="carregarDoHistorico('${entrada.id}')"` : 'disabled'}>
                    ${entrada.plano_valido ? '📂 Carregar' : '⚠️ Incompleto'}
                </button>
                <button type="button" class="historico-btn-deletar" onclick="deletarDoHistorico('${entrada.id}')">
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

    if (!entrada.plano_valido) {
        alert('Este registro veio de uma geração incompleta e não pode substituir um planejamento válido.');
        return;
    }

    // Preencher formulário
    const evento = entrada.evento;
    definirValorCampo('tipo', evento.tipo);
    definirValorCampo('pessoas', evento.pessoas);
    definirValorCampo('criancas', evento.criancas);
    definirValorCampo('restricoes', evento.restricoes);
    definirValorCampo('userChat', evento.obs);
    definirValorCampo('duracao', evento.duracao);
    definirValorCampo('dataEvento', evento.dataEvento);
    definirValorCampo('pais', evento.pais || 'Brasil');
    definirValorCampo('estado', evento.estado);
    definirValorCampo('cidade', evento.cidade);
    definirValorCampo('refeicao', evento.refeicao);
    definirValorCampo('tema', evento.tema);
    definirValorCampo('orcamentoBase', evento.orcamentoBase);
    definirValorCampo('alcool', evento.alcool);
    definirValorCampo('horarioInicio', evento.horarioInicio);
    definirValorCampo('formatoServico', evento.formatoServico || 'A definir pelo Chef IA');
    definirValorCampo('faixaEtaria', evento.faixaEtaria || 'Publico misto');
    definirValorCampo('infraestrutura', evento.infraestrutura || 'A confirmar');
    definirValorCampo('prioridade', evento.prioridade || 'Equilibrio geral');

    const opcoesAvancadas = document.getElementById('advancedEventOptions');
    if (opcoesAvancadas) {
        opcoesAvancadas.open = Boolean(
            evento.horarioInicio ||
            (evento.formatoServico && evento.formatoServico !== 'A definir pelo Chef IA') ||
            (evento.faixaEtaria && evento.faixaEtaria !== 'Publico misto') ||
            (evento.infraestrutura && evento.infraestrutura !== 'A confirmar') ||
            (evento.prioridade && evento.prioridade !== 'Equilibrio geral')
        );
    }

    // Definir o radio button de estilo
    const radioEstilo = document.querySelector(`input[name="estilo"][value="${evento.estilo}"]`);
    if (radioEstilo) radioEstilo.checked = true;

    if (entrada.plano) {
        cancelarConsultaVisualPendente();
        exibirResultadoLuxo(entrada.plano, evento.pessoas || '', evento);
        renderizarGaleriaHistorico();
        const resultadoArea = document.getElementById('resultadoArea');
        if (resultadoArea) {
            resultadoArea.dataset.planoValido = "true";
            resultadoArea.insertAdjacentHTML('afterbegin', `
                <div class="history-loaded-banner" role="status">
                    <strong>Planejamento salvo carregado.</strong>
                    <span>Nenhuma nova geração foi realizada.</span>
                </div>
            `);
            resultadoArea.scrollIntoView({ behavior: 'smooth', block: 'start' });
        }
        window.chefIAHistoricoCarregadoId = id;
    }

    console.log('✅ Planejamento carregado:', id);
}

function definirValorCampo(id, valor) {
    const campo = document.getElementById(id);
    if (campo) campo.value = valor ?? '';
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
