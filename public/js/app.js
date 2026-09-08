/* ==========================================================================
   KARAMU | APP ENTRYPOINT
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

let supabaseClient = null;

async function inicializarAcessoDemo() {
    try {
        const response = await fetch('/api/status');
        const status = await response.json();
        demoAccessRequired = Boolean(status.demo_access?.required);
        window.chefIARecipeReferencesAvailable = Boolean(status.recipe_references?.configured);
        window.chefIAVisualReferencesAvailable = Boolean(status.visual_references?.configured);
        inicializarLoginSocial(status.auth?.supabase_url, status.auth?.supabase_anon_key);
    } catch (error) {
        console.warn('Não foi possível verificar acesso demo:', error.message);
    }
}

// Login social (Google): usa o supabase-js direto no navegador so para esse
// fluxo (redireciona pro Google e volta com a sessao). O restante do app
// continua falando so com o nosso backend, como sempre.
function inicializarLoginSocial(supabaseUrl, supabaseAnonKey) {
    if (!supabaseUrl || !supabaseAnonKey || !window.supabase?.createClient) return;
    supabaseClient = window.supabase.createClient(supabaseUrl, supabaseAnonKey);
    supabaseClient.auth.onAuthStateChange((event, session) => {
        if (event !== 'SIGNED_IN' || !session?.user) return;
        salvarSessaoUsuario({ email: session.user.email, accessToken: session.access_token });
        const modal = document.getElementById('authModal');
        if (modal && !modal.classList.contains('hidden')) {
            modal.classList.add('hidden');
            document.body.classList.remove('modal-open');
        }
        switchView('app');
    });
}

async function entrarComGoogle() {
    if (!supabaseClient) return;
    await supabaseClient.auth.signInWithOAuth({
        provider: 'google',
        options: { redirectTo: window.location.origin }
    });
}

async function obterDemoAccessKey() {
    if (!demoAccessRequired) return null;
    // Usuario com sessao real (e-mail/senha ou Google) dispensa a senha demo
    // (decisao do usuario em 2026-08-31, espelha o bypass feito no servidor
    // em gerarCardapioHandler/buscarReferenciasHandler/buscarImagensEventoHandler).
    if (obterSessaoUsuario()) return null;

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

/* TAG: autenticacao-usuario | Plano 14 - cadastro e login via Supabase */
let authModoCadastro = false;

function obterSessaoUsuario() {
    try {
        const bruto = sessionStorage.getItem('chef_ia_sessao_usuario');
        return bruto ? JSON.parse(bruto) : null;
    } catch (error) {
        return null;
    }
}

// TAG: bug-header-sessao-ausente | /gerar-cardapio, /api/imagens-evento e
// /api/referencias-receitas nunca mandavam Authorization: Bearer <token> —
// so perfil.js fazia isso certinho (perfilHeaders()). Resultado real:
// obterTokenAutenticadoOuNulo() no servidor sempre via o usuario como
// anonimo nessas 3 rotas, entao o bypass "logado dispensa a senha demo"
// (2026-08-31) nunca chegava a valer pra elas. O gerador principal so
// parecia funcionar pra quem ja tinha chave Gemini propria configurada
// (bypass antigo, sem relacao com sessao) — imagens/receitas nao tem
// esse bypass alternativo, entao sempre caiam em 401 "senha invalida",
// que o front trata como "nenhuma fotografia confiavel encontrada".
// Achado ao vivo testando um evento real (Toy Story), 2026-09-07.
function headersComSessao(comJson = true) {
    const headers = comJson ? { "Content-Type": "application/json" } : {};
    const sessao = obterSessaoUsuario();
    if (sessao?.accessToken) headers["Authorization"] = `Bearer ${sessao.accessToken}`;
    return headers;
}

function salvarSessaoUsuario(sessao) {
    sessionStorage.setItem('chef_ia_sessao_usuario', JSON.stringify(sessao));
    atualizarBotaoConta();
}

function encerrarSessaoUsuario() {
    sessionStorage.removeItem('chef_ia_sessao_usuario');
    atualizarBotaoConta();
}

// Visitante que escolhe testar sem criar conta (senha demo compartilhada,
// ver obterDemoAccessKey). Nao e uma sessao de verdade, mas conta como
// "ja passou da apresentacao" para nao repetir o gate a cada reload.
function modoDemoAtivo() {
    return sessionStorage.getItem('chef_ia_modo_demo_ativo') === 'true';
}

function entrarModoDemo() {
    sessionStorage.setItem('chef_ia_modo_demo_ativo', 'true');
    atualizarBotaoConta();
    switchView('app');
}

function atualizarBotaoConta() {
    const botao = document.getElementById('btnConta');
    if (!botao) return;
    const sessao = obterSessaoUsuario();
    if (sessao) {
        botao.innerHTML = `${icon("account")} ${escapeHTML(sessao.email)}`;
    } else if (modoDemoAtivo()) {
        botao.innerHTML = `${icon("account")} Modo demo · Criar conta`;
    } else {
        botao.innerHTML = `${icon("account")} Entrar`;
    }
}

// Preenche o CTA no fim da apresentacao: quem ja tem sessao ou ja escolheu
// o modo demo vai direto pro gerador; quem esta chegando agora escolhe
// entre criar conta/entrar ou testar sem conta.
function atualizarPitchCta() {
    const area = document.getElementById('pitchCtaArea');
    if (!area) return;
    if (obterSessaoUsuario() || modoDemoAtivo()) {
        area.innerHTML = `<button type="button" class="btn-epic btn-wide" data-action="switch-app">IR PARA O GERADOR →</button>`;
    } else {
        area.innerHTML = `
            <button type="button" class="btn-epic btn-wide" data-action="abrir-conta">CRIAR CONTA / ENTRAR</button>
            <button type="button" class="btn-secondary btn-wide" data-action="modo-demo">TESTAR COM SENHA DEMO</button>
        `;
    }
}

/* TAG: delegacao-pitch-cta | CSP sem 'unsafe-inline' (mesmo raciocinio
   da delegacao em render.js): #pitchCtaArea e estatico, so o innerHTML
   muda a cada chamada de atualizarPitchCta(). */
document.getElementById("pitchCtaArea")?.addEventListener("click", event => {
    const alvo = event.target.closest("[data-action]");
    if (!alvo) return;
    switch (alvo.dataset.action) {
        case "switch-app": switchView("app"); break;
        case "abrir-conta": abrirModalConta(); break;
        case "modo-demo": entrarModoDemo(); break;
    }
});

function abrirModalConta() {
    const sessao = obterSessaoUsuario();
    if (sessao) {
        const painel = document.getElementById('perfilSection');
        if (painel && !painel.classList.contains('hidden')) {
            fecharPainelPerfil();
        } else {
            abrirPainelPerfil();
        }
        return;
    }
    authModoCadastro = false;
    atualizarTextoModalAuth();

    const modal = document.getElementById('authModal');
    const email = document.getElementById('authEmailInput');
    const senha = document.getElementById('authSenhaInput');
    const erro = document.getElementById('authModalError');
    const info = document.getElementById('authModalInfo');
    const submit = document.getElementById('authModalSubmit');
    const toggle = document.getElementById('authModalToggle');
    const close = document.getElementById('authModalClose');

    email.value = "";
    senha.value = "";
    erro.textContent = "";
    info.textContent = "";

    const fechar = () => {
        modal.classList.add('hidden');
        document.body.classList.remove('modal-open');
        modal.removeEventListener('keydown', handleKeydown);
    };

    async function enviar() {
        erro.textContent = "";
        info.textContent = "";

        const rota = authModoCadastro ? "/api/auth/registrar" : "/api/auth/login";
        try {
            const response = await fetch(rota, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ email: email.value.trim(), senha: senha.value })
            });
            const dados = await response.json();
            if (!response.ok || dados.ok === false) {
                erro.textContent = dados.error || "Nao foi possivel completar a operacao.";
                return;
            }

            if (authModoCadastro) {
                if (dados.confirmacao_pendente) {
                    info.textContent = "Cadastro criado. Confira seu e-mail para confirmar antes de entrar.";
                    return;
                }
                salvarSessaoUsuario({ email: dados.email, accessToken: dados.access_token });
                fechar();
                switchView('app');
                return;
            }

            salvarSessaoUsuario({ email: dados.email, accessToken: dados.access_token });
            fechar();
            switchView('app');
        } catch (error) {
            erro.textContent = "Erro de conexao. Tente novamente.";
        }
    }

    function handleKeydown(event) {
        if (event.key === "Escape") fechar();
        if (event.key === "Enter") enviar();
    }

    const google = document.getElementById('authGoogleButton');
    if (google) {
        google.disabled = !supabaseClient;
        google.onclick = entrarComGoogle;
    }

    submit.onclick = enviar;
    close.onclick = fechar;
    toggle.onclick = () => {
        authModoCadastro = !authModoCadastro;
        erro.textContent = "";
        info.textContent = "";
        atualizarTextoModalAuth();
    };

    document.body.classList.add('modal-open');
    modal.classList.remove('hidden');
    modal.addEventListener('keydown', handleKeydown);
    requestAnimationFrame(() => email.focus());
}

function atualizarTextoModalAuth() {
    const tag = document.getElementById('authModalTag');
    const titulo = document.getElementById('authModalTitle');
    const descricao = document.getElementById('authModalDescricao');
    const submit = document.getElementById('authModalSubmit');
    const toggle = document.getElementById('authModalToggle');

    if (authModoCadastro) {
        tag.textContent = "Cadastro";
        titulo.textContent = "Criar minha conta";
        descricao.textContent = "Crie sua conta para salvar fornecedores e fotos proprias.";
        submit.textContent = "Cadastrar";
        toggle.textContent = "Ja tenho conta";
    } else {
        tag.textContent = "Entrar";
        titulo.textContent = "Acesse sua conta";
        descricao.textContent = "Entre com seu e-mail e senha.";
        submit.textContent = "Entrar";
        toggle.textContent = "Ainda nao tenho conta";
    }
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

// Fluxo sequencial (apresentacao -> login/demo -> gerador; conta como status,
// nao aba paralela). 'pitch' e a porta de entrada para quem ainda nao tem
// sessao nem escolheu o modo demo (ver determinarViewInicial); depois disso
// o app vira a tela principal e a apresentacao fica a um clique na barra de
// status, sem concorrer visualmente com o gerador. O perfil NAO faz parte
// dessa troca de secoes: e um painel sobreposto (ver abrirPainelPerfil),
// entao trocar de view so precisa fechar o painel se estiver aberto.
function switchView(view) {
    const secoes = { app: 'appSection', pitch: 'pitchSection' };

    for (const [nome, idSecao] of Object.entries(secoes)) {
        const secao = document.getElementById(idSecao);
        if (secao) secao.classList.toggle('hidden', nome !== view);
    }

    // TAG: fix-scroll-duplo | #pitchSection e 100vh com scroll proprio
    // (carrossel de slides), mas fica dentro do fluxo normal da pagina,
    // logo depois do .hero — que nunca era escondido pelo switchView.
    // hero + pitchSection juntos passavam da altura da tela, entao a
    // pagina externa TAMBEM precisava rolar, gerando duas areas de scroll
    // simultaneas (achado real, confirmado via scrollHeight/clientHeight
    // ao vivo, Sprint 1 - Saude tecnica, 2026-08-31). Escondendo o hero
    // (redundante durante a apresentacao, que ja tem sua propria abertura)
    // e travando o scroll externo (reaproveita body.modal-open, mesmo
    // mecanismo ja usado nos modais de login/demo), pitchSection passa a
    // ocupar exatamente a tela, sem disputa de scroll.
    const hero = document.getElementById('mainHero');
    if (hero) hero.classList.toggle('hidden', view === 'pitch');
    document.body.classList.toggle('modal-open', view === 'pitch');

    if (view === 'pitch') atualizarPitchCta();
    fecharPainelPerfil();
}

/* TAG: perfil-painel-sobreposto | Dropdown de conta estilo Google/rede
   social: abre por cima da tela atual (nao troca de secao), entao o
   formulario ou resultado em andamento continua visivel e intacto atras
   do painel. */
function posicionarPainelPerfil() {
    const painel = document.getElementById('perfilSection');
    const botao = document.getElementById('btnConta');
    if (!painel || !botao) return;

    if (window.innerWidth <= 768) {
        painel.style.top = '';
        painel.style.right = '';
        painel.style.left = '';
        return;
    }

    const rect = botao.getBoundingClientRect();
    const largura = painel.offsetWidth || 440;
    const margem = 12;
    let direita = window.innerWidth - rect.right;
    direita = Math.max(margem, Math.min(direita, window.innerWidth - largura - margem));

    painel.style.left = '';
    painel.style.right = `${direita}px`;
    painel.style.top = `${rect.bottom + margem}px`;
}

function handlePerfilKeydown(event) {
    if (event.key === 'Escape') fecharPainelPerfil();
}

function abrirPainelPerfil() {
    const painel = document.getElementById('perfilSection');
    const fundo = document.getElementById('perfilBackdrop');
    if (!painel) return;

    painel.classList.remove('hidden');
    if (fundo) fundo.classList.remove('hidden');
    posicionarPainelPerfil();

    if (window.chefIAPerfil) window.chefIAPerfil.abrir();

    document.addEventListener('keydown', handlePerfilKeydown);
    window.addEventListener('resize', posicionarPainelPerfil);
}

function fecharPainelPerfil() {
    const painel = document.getElementById('perfilSection');
    const fundo = document.getElementById('perfilBackdrop');
    if (painel) painel.classList.add('hidden');
    if (fundo) fundo.classList.add('hidden');

    document.removeEventListener('keydown', handlePerfilKeydown);
    window.removeEventListener('resize', posicionarPainelPerfil);
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
    const formatoServico = document.getElementById('formatoServico')?.value || "A definir pelo Karamu";
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
        // TAG: bug-bloqueio-mesmo-logado | demoAccessRequired reflete so a
        // config do SERVIDOR (DEMO_ACCESS_KEY existe), independente de
        // sessao — continua true mesmo pra quem esta logado. Desde o fix
        // "logado dispensa a senha demo" (2026-08-31), obterDemoAccessKey()
        // corretamente devolve null nesse caso, mas essa checagem nao tinha
        // sido atualizada e bloqueava a geracao mesmo assim, achado testando
        // ao vivo (usuario logado continuava vendo "demo esta protegida").
        if (demoAccessRequired && !demoAccessKey && !obterSessaoUsuario()) {
            exibirErroResultado(resultadoArea, "A demo esta protegida. Informe a senha temporaria para gerar o planejamento.");
            return;
        }

        // Feedback visual
        btn.disabled = true;
        btn.innerHTML = `${icon("generate")} CALCULANDO LOGISTICA + IA...`;
        document.getElementById('mainHero').classList.add('collapsed');

        resultadoArea.classList.remove('hidden');
        resultadoArea.dataset.planoValido = "false";
        resultadoArea.innerHTML = `
            <div class="glass-panel" style="text-align:center; border-top: 4px solid var(--gold);">
                <span class="gallery-loading-visual" aria-hidden="true" style="display:inline-block; margin-bottom:12px;"></span>
                <p><strong>O Karamu está arquitetando seu evento...</strong></p>
                <p style="font-size:0.8rem; opacity:0.7;">Calculando logística para ${pessoas} convidados (${estilo}). Pode levar de 15 a 40 segundos.</p>
            </div>
        `;

        const headers = headersComSessao();
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

        // TAG: aviso-catalogo-truncado | server.js corta o catalogo de
        // precos do usuario em 60 itens (ordem alfabetica); antes isso so
        // ficava em meta, sem aviso visual pra quem tem mais de 60 precos
        // cadastrados (item de baixa prioridade da Sprint 1, 2026-08-31).
        if (resposta.meta?.catalogo_usuario_truncado) {
            const painelCusto = resultadoArea.querySelector('.cost-estimate-panel');
            if (painelCusto) {
                const aviso = document.createElement('p');
                aviso.className = 'cost-estimate-note cost-estimate-note--aviso';
                aviso.textContent = 'Seu catálogo de preços tem mais de 60 itens cadastrados — só os 60 primeiros (ordem alfabética) entraram nesta estimativa. Os demais não foram considerados no cálculo.';
                painelCusto.appendChild(aviso);
            }
        }

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
        btn.innerHTML = `${icon("generate")} CALCULAR + GERAR PLANEJAMENTO COMPLETO`;
    }
}

async function carregarImagensEvento(evento, pratos = [], demoAccessKey = null) {
    const sequencia = ++sequenciaConsultaVisual;
    if (window.chefIAVisualReferencesAvailable === false) {
        renderizarGaleriaEventoFallback("A consulta visual externa nao esta configurada.");
        return;
    }

    try {
        const headers = headersComSessao();
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
        // Mesmo raciocinio da checagem em gerarTudo(): demoAccessRequired
        // reflete config do servidor, nao sessao — usuario logado tem
        // demoAccessKey null por design, nao deve ser bloqueado aqui.
        if (demoAccessRequired && !demoAccessKey && !obterSessaoUsuario()) {
            resultado.innerHTML = '<p class="reference-message">Informe a senha temporária para consultar referências.</p>';
            return;
        }

        botao.disabled = true;
        botao.textContent = 'Consultando...';
        resultado.innerHTML = '<p class="reference-message">Busca transitória em andamento. Nenhum conteúdo será salvo.</p>';

        const headers = headersComSessao();
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
                <span>${icon("users")} ${entrada.pessoas} pessoas</span>
                <span>${icon("clock")} ${window.storageService.formatarDataBR(entrada.data_criacao)}</span>
            </div>
            <div class="historico-card-resumo">
                ${escapeHTML(entrada.resumo)}
                ${entrada.plano_valido ? '' : '<br><strong>Geração incompleta — mantida apenas para diagnóstico.</strong>'}
            </div>
            <div class="historico-card-acoes">
                <button type="button" class="historico-btn-carregar" ${entrada.plano_valido ? `data-action="carregar-historico" data-id="${escapeHTML(entrada.id)}"` : 'disabled'}>
                    ${entrada.plano_valido ? `${icon("folder")} Carregar` : `${icon("warning")} Incompleto`}
                </button>
                <button type="button" class="historico-btn-deletar" data-action="deletar-historico" data-id="${escapeHTML(entrada.id)}">
                    ${icon("trash")} Deletar
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
    // Historico salvo antes do rename para "Karamu" pode ter o sentinela
    // antigo ("A definir pelo Chef IA"); normaliza aqui para nao cair fora
    // das opcoes do <select> nem ser tratado como formato customizado.
    if (evento.formatoServico === 'A definir pelo Chef IA') {
        evento.formatoServico = 'A definir pelo Karamu';
    }
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
    definirValorCampo('formatoServico', evento.formatoServico || 'A definir pelo Karamu');
    definirValorCampo('faixaEtaria', evento.faixaEtaria || 'Publico misto');
    definirValorCampo('infraestrutura', evento.infraestrutura || 'A confirmar');
    definirValorCampo('prioridade', evento.prioridade || 'Equilibrio geral');

    const opcoesAvancadas = document.getElementById('advancedEventOptions');
    if (opcoesAvancadas) {
        opcoesAvancadas.open = Boolean(
            evento.horarioInicio ||
            (evento.formatoServico && evento.formatoServico !== 'A definir pelo Karamu') ||
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

/* TAG: delegacao-historico | mesmo raciocinio das outras delegacoes:
   #historico-container e estatico, so o innerHTML muda a cada
   renderizarHistorico(). */
document.getElementById('historico-container')?.addEventListener('click', event => {
    const alvo = event.target.closest('[data-action]');
    if (!alvo) return;
    const id = alvo.dataset.id;
    if (alvo.dataset.action === 'carregar-historico') carregarDoHistorico(id);
    if (alvo.dataset.action === 'deletar-historico') deletarDoHistorico(id);
});

/* TAG: ligacao-botoes-estaticos | CSP sem 'unsafe-inline': botoes que ja
   existem no HTML no carregamento da pagina (nao gerados por template
   string) sao ligados aqui uma unica vez, em vez de onclick="" inline. */
function ligarBotoesEstaticos() {
    document.getElementById('btnApresentacao')?.addEventListener('click', () => switchView('pitch'));
    document.getElementById('btnConta')?.addEventListener('click', abrirModalConta);
    document.getElementById('btnToggleHeader')?.addEventListener('click', toggleHeader);
    document.getElementById('btnGerar')?.addEventListener('click', gerarTudo);
    document.getElementById('limpar-historico-btn')?.addEventListener('click', limparHistoricoUI);
    document.getElementById('perfilBackdrop')?.addEventListener('click', fecharPainelPerfil);
    document.getElementById('perfilFechar')?.addEventListener('click', fecharPainelPerfil);

    document.getElementById('btnImportarProjeto')?.addEventListener('click', () => {
        document.getElementById('importChef')?.click();
    });
    // TAG: bug-preexistente-importarProjeto | importarProjeto() nunca foi
    // implementada em nenhum arquivo (achado durante a remocao do
    // 'unsafe-inline', 2026-08-31) — o botao de importar projeto Chef
    // nunca funcionou. Guarda defensiva preserva o comportamento atual
    // (nada acontece de util) sem lancar erro nao tratado; decisao de
    // implementar de verdade ou remover o botao fica para o usuario.
    document.getElementById('importChef')?.addEventListener('change', event => {
        if (typeof importarProjeto === 'function') importarProjeto(event);
        else console.warn('⚠️ importarProjeto() nao implementada — botao de importar projeto Chef nao funciona.');
    });
}

/* TAG: init-historico | Chamar ao carregar página */
document.addEventListener('DOMContentLoaded', function() {
    ligarBotoesEstaticos();
    inicializarAcessoDemo();
    atualizarBotaoConta();
    // Quem ja tem sessao ou ja escolheu o modo demo cai direto no gerador;
    // visitante novo ve a apresentacao primeiro (Plano 16, item 7).
    switchView(obterSessaoUsuario() || modoDemoAtivo() ? 'app' : 'pitch');

    // Renderizar histórico ao carregar
    setTimeout(() => {
        renderizarHistorico();
    }, 500);
});
