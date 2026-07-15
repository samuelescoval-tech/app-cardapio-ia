/* ==========================================================================
   CHEF IA STUDIO | RENDER
   TAG: ui-render, resultado, componentes-visuais
   --------------------------------------------------------------------------
   Responsabilidade: transformar o JSON normalizado da IA em HTML.
   ========================================================================== */

function exibirResultadoLuxo(dados, pessoas, evento = null) {
    const area = document.getElementById('resultadoArea');
    const cardapio = normalizarArray(dados.cardapio);
    const compras = normalizarArray(dados.lista_compras);
    const receitas = normalizarArray(dados.receitas);
    const utensilios = normalizarArray(dados.utensilios);
    const locais = normalizarArray(dados.local);
    const layout = normalizarArray(dados.layout);
    const cronograma = normalizarArray(dados.cronograma);
    const equipeObs = normalizarArray(dados.equipe_obs);
    const entretenimento = normalizarArray(dados.entretenimento);
    const lembrancinhas = normalizarArray(dados.lembrancinhas);
    const servicoMesa = dados.motor_logistica?.servico_mesa || dados.servico_mesa || calcularServicoMesa(pessoas);
    window.chefIAUltimoPlano = { dados, pessoas, evento };

    area.innerHTML = `
        <div class="resultado-premium" style="animation: fadeInUp 0.8s ease;">
            <div class="result-header">
                <div>
                    <h2>Planejamento para ${escapeHTML(pessoas)} pessoas</h2>
                    <p>Cardapio, logistica, compras, equipe, roteiro e contexto de precificacao em um unico plano.</p>
                </div>
                <button class="btn-print" onclick="baixarRelatorioPDF()">Baixar PDF</button>
            </div>

            ${renderResumoExecutivo(dados, pessoas, cardapio, compras)}
            ${renderAvaliacaoEvento(dados.avaliacao_evento)}
            ${renderQualidadeCulinaria(dados.qualidade_culinaria)}
            ${renderReconciliacaoBebidas(dados.reconciliacao_bebidas)}
            ${renderVariedadeCulinaria(dados.variedade_culinaria)}
            ${renderCoerenciaEvento(dados.contexto_evento)}
            ${renderContextoInformado(evento, dados.motor_logistica?.premissas)}
            ${renderMotorLogistica(dados.motor_logistica)}
            ${renderDetalhesExpansiveis("Detalhes da operação", "Equipe, fluxo, estações e cronograma técnico", renderOperacaoDeterministica(dados.motor_logistica?.operacao))}
            ${renderServicoMesa(servicoMesa)}
            ${renderCardapio(cardapio)}
            ${renderGaleriaEventoPendente()}
            ${renderCompras(compras)}
            ${renderLocais(locais)}
            ${renderSecao("Layout", layout.length ? renderListaCards(layout, "layout-card") : renderConteudoAusente("Layout não informado."))}
            ${renderDecoracao(dados.decoracao || {})}
            ${renderCronograma(cronograma)}
            ${renderSecao("Observacoes de Equipe", equipeObs.length ? renderListaCards(equipeObs, "note-card") : renderConteudoAusente("Orientações de equipe não informadas."))}
            ${renderReceitas(receitas)}
            ${renderReferenciasExternas()}
            ${renderUtensiliosDetalhados(utensilios, pessoas)}
            ${renderSecao("Entretenimento", entretenimento.length ? renderListaCards(entretenimento, "note-card") : renderConteudoAusente("Entretenimento não informado."))}
            ${renderSecao("Lembrancinhas", lembrancinhas.length ? renderListaCards(lembrancinhas, "note-card") : renderConteudoAusente("Lembrancinhas não informadas."))}
            ${renderChecklist(dados.checklist || {})}
            ${dados.orcamento && precificacaoEhConfiavel(dados.precificacao) ? renderOrcamento(dados.orcamento) : ""}
            ${dados.resumo_chef ? renderSecao("Resumo do Chef", `<div class="chef-summary">${escapeHTML(dados.resumo_chef)}</div>`) : ""}
        </div>
    `;
    ativarFallbackImagensCardapio();
}

function renderGaleriaEventoPendente() {
    return `
        <section class="result-section event-gallery-section" id="eventGallerySection" aria-live="polite" aria-busy="true">
            <div class="section-head gallery-head">
                <div>
                    <h3>Fontes das imagens do cardapio</h3>
                    <small>Créditos e alternativas das referências aplicadas aos pratos acima.</small>
                </div>
            </div>
            <details class="gallery-sources-details" id="eventGalleryDetails" open>
                <summary id="eventGallerySummary">Preparando fontes visuais...</summary>
                <div class="gallery-controls" id="eventGalleryControls" aria-label="Visualizacao das referencias visuais" hidden>
                    <span id="eventGalleryCount">Preparando</span>
                    <button type="button" class="gallery-view-btn active" data-gallery-view="carousel" aria-pressed="true" onclick="alternarVisualizacaoGaleria('carousel')">Carrossel</button>
                    <button type="button" class="gallery-view-btn" data-gallery-view="list" aria-pressed="false" onclick="alternarVisualizacaoGaleria('list')">Lista</button>
                    <button type="button" class="gallery-nav-btn" data-gallery-nav="prev" aria-label="Imagens anteriores" onclick="rolarGaleria(-1)">←</button>
                    <button type="button" class="gallery-nav-btn" data-gallery-nav="next" aria-label="Proximas imagens" onclick="rolarGaleria(1)">→</button>
                </div>
                <div id="eventGalleryContent" class="event-gallery-loading">
                    <span class="gallery-loading-visual" aria-hidden="true"></span>
                    <div><strong>Buscando referencias compativeis...</strong><small>O planejamento ja esta disponivel; esta etapa visual acontece separadamente.</small></div>
                </div>
            </details>
        </section>
    `;
}

function renderizarGaleriaEvento(resultado, opcoes = {}) {
    const secao = document.getElementById("eventGallerySection");
    const conteudo = document.getElementById("eventGalleryContent");
    const controles = document.getElementById("eventGalleryControls");
    const contador = document.getElementById("eventGalleryCount");
    const detalhes = document.getElementById("eventGalleryDetails");
    const resumo = document.getElementById("eventGallerySummary");
    if (!secao || !conteudo || !controles || !contador) return;

    const imagensBase = normalizarArray(resultado?.images).map(normalizarImagemEvento).filter(Boolean);
    const alternativasBase = normalizarAlternativasGaleria(resultado?.alternatives);
    const historico = Boolean(opcoes.historico);
    const preferencias = historico
        ? { images: imagensBase, alternatives: alternativasBase }
        : aplicarPreferenciasVisuais(imagensBase, alternativasBase);
    const imagens = preferencias.images;
    const alternativas = preferencias.alternatives;
    secao.setAttribute("aria-busy", "false");
    window.chefIAGaleriaEstado = {
        images: imagens,
        alternatives: alternativas,
        warnings: normalizarArray(resultado?.warnings),
        attribution_notice: resultado?.attribution_notice || "",
        opcoes: { historico }
    };

    if (!imagens.length) {
        controles.hidden = true;
        if (resumo) resumo.textContent = "Fontes visuais indisponíveis";
        if (detalhes) detalhes.open = false;
        conteudo.className = "event-gallery-empty";
        conteudo.innerHTML = `<strong>Referencias visuais indisponiveis.</strong><small>O planejamento culinario permanece completo e pode ser usado normalmente.</small>`;
        return;
    }

    contador.textContent = `${imagens.length} ${imagens.length === 1 ? "imagem" : "imagens"}`;
    if (resumo) resumo.textContent = `Ver fontes e avaliar ${imagens.length} ${imagens.length === 1 ? "imagem" : "imagens"}`;
    controles.hidden = false;
    conteudo.className = "event-gallery-body";
    conteudo.innerHTML = `
        <div class="event-gallery-track" id="eventGalleryVisualizacao">
            ${imagens.map(imagem => renderImagemEvento(imagem, alternativas[imagem.slot]?.length > 0, historico)).join("")}
        </div>
        ${renderResumoFeedbackVisual(historico)}
        <div class="gallery-notice">
            <strong>${historico ? "Visualizacao local do historico" : "Referencias ilustrativas"}</strong>
            <span>${escapeHTML(historico
                ? "As imagens externas nao sao salvas. Gere o evento novamente para atualizar as referencias do Openverse."
                : resultado?.attribution_notice || "Confira autoria, licenca e fonte antes de reutilizar uma imagem.")}</span>
            ${normalizarArray(resultado?.warnings).length ? `<small>${escapeHTML(`${resultado.warnings.length} referencia(s) usaram a ilustracao local de contingencia.`)}</small>` : ""}
        </div>
    `;
    ativarFallbackImagensGaleria();
    aplicarImagensAoCardapio(window.chefIAGaleriaEstado);
    if (detalhes) detalhes.open = false;
}

function aplicarPreferenciasVisuais(imagens, alternativas) {
    const service = window.visualFeedbackService;
    if (!service?.ordenarCandidatos) return { images: imagens, alternatives: alternativas };

    const selecionadas = [];
    const filas = {};
    imagens.forEach(imagem => {
        const candidatos = service.ordenarCandidatos([imagem, ...normalizarArray(alternativas[imagem.slot])]);
        selecionadas.push(candidatos[0]);
        if (candidatos.length > 1) filas[imagem.slot] = candidatos.slice(1);
    });
    return { images: selecionadas, alternatives: filas };
}

function normalizarAlternativasGaleria(valor) {
    if (!valor || typeof valor !== "object" || Array.isArray(valor)) return {};
    return Object.fromEntries(Object.entries(valor).flatMap(([slot, imagens]) => {
        const normalizadas = normalizarArray(imagens).map(normalizarImagemEvento).filter(Boolean);
        return normalizadas.length ? [[slot, normalizadas]] : [];
    }));
}

function renderizarGaleriaEventoFallback(mensagem = "A fonte externa nao respondeu.") {
    renderizarGaleriaEvento({
        images: imagensLocaisGaleria(),
        warnings: [mensagem],
        attribution_notice: "A fonte externa esta indisponivel; exibimos ilustracoes locais sem afetar o planejamento."
    });
}

function renderizarGaleriaHistorico() {
    renderizarGaleriaEvento({ images: imagensLocaisGaleria() }, { historico: true });
}

function imagensLocaisGaleria() {
    return [
        ["capa", "/images/fallback/event-cover.svg", "Capa conceitual do evento"],
        ["entrada", "/images/fallback/savory-food.svg", "Entradas e preparacoes salgadas"],
        ["principal", "/images/fallback/main-course.svg", "Prato principal"],
        ["sobremesa", "/images/fallback/dessert.svg", "Doces e sobremesas"],
        ["bebida", "/images/fallback/beverages.svg", "Bebidas do evento"]
    ].map(([slot, imageUrl, alt]) => ({
        id: `local-${slot}`,
        slot,
        provider: "local",
        image_url: imageUrl,
        thumbnail_url: imageUrl,
        source_url: null,
        creator: "Chef IA Studio",
        license: "local-fallback",
        attribution: "Ilustracao de contingencia do Chef IA Studio.",
        alt,
        fallback: true
    }));
}

function normalizarImagemEvento(imagem) {
    if (!imagem || typeof imagem !== "object") return null;
    const provider = imagem.provider === "openverse" ? "openverse" : imagem.provider === "local" ? "local" : null;
    if (!provider) return null;
    const imageUrl = urlImagemEventoSegura(imagem.thumbnail_url || imagem.image_url, provider);
    if (!imageUrl) return null;
    const sourceUrl = provider === "openverse" ? urlExternaHttpsSegura(imagem.source_url) : null;
    if (provider === "openverse" && !sourceUrl) return null;

    return {
        id: String(imagem.id || "referencia").slice(0, 100),
        slot: String(imagem.slot || "evento").slice(0, 40),
        provider,
        image_url: imageUrl,
        source_url: sourceUrl,
        creator: String(imagem.creator || (provider === "local" ? "Chef IA Studio" : "Autor nao informado")).slice(0, 160),
        license: String(imagem.license || "licenca nao informada").toUpperCase().slice(0, 40),
        attribution: String(imagem.attribution || "Credito nao informado").slice(0, 500),
        alt: String(imagem.alt || "Referencia visual do evento").slice(0, 220),
        fallback: Boolean(imagem.fallback || provider === "local")
    };
}

function urlImagemEventoSegura(valor, provider) {
    if (typeof valor !== "string") return null;
    if (provider === "local") {
        return /^\/images\/fallback\/[a-z0-9-]+\.svg$/i.test(valor) ? valor : null;
    }
    return urlExternaHttpsSegura(valor);
}

function urlExternaHttpsSegura(valor) {
    if (typeof valor !== "string" || !valor) return null;
    try {
        const url = new URL(valor);
        return url.protocol === "https:" ? url.toString() : null;
    } catch {
        return null;
    }
}

function renderImagemEvento(imagem, possuiAlternativas = false, historico = false) {
    const fallbackUrl = fallbackGaleriaPorSlot(imagem.slot);
    const avaliacao = window.visualFeedbackService?.obterAvaliacao?.(imagem) || null;
    return `
        <figure class="event-gallery-card ${imagem.fallback ? "gallery-card-local" : ""}" data-gallery-slot="${escapeHTML(imagem.slot)}">
            <div class="gallery-image-frame">
                <img src="${escapeHTML(imagem.image_url)}" data-gallery-fallback="${escapeHTML(fallbackUrl)}" alt="${escapeHTML(imagem.alt)}" loading="lazy" decoding="async" referrerpolicy="no-referrer">
                <span>${escapeHTML(rotuloSlotGaleria(imagem.slot))}</span>
            </div>
            <figcaption>
                <strong>${escapeHTML(imagem.alt)}</strong>
                <small>${escapeHTML(imagem.attribution)}</small>
                <div class="gallery-credit-line">
                    <span>${escapeHTML(imagem.creator)} · ${escapeHTML(imagem.license)}</span>
                    ${imagem.source_url ? `<a href="${escapeHTML(imagem.source_url)}" target="_blank" rel="noopener noreferrer">Ver fonte original</a>` : `<span>Recurso local</span>`}
                </div>
                <div class="gallery-card-actions" aria-label="Acoes desta referencia visual">
                    ${possuiAlternativas ? `<button type="button" class="gallery-action-btn gallery-swap-btn" onclick="trocarImagemGaleria('${escapeHTML(imagem.slot)}')">Trocar imagem</button>` : ""}
                    <button type="button" class="gallery-action-btn gallery-hide-btn" onclick="ocultarImagemGaleria('${escapeHTML(imagem.slot)}')">Ocultar</button>
                </div>
                ${historico ? "" : renderControlesFeedbackVisual(imagem.slot, avaliacao)}
            </figcaption>
        </figure>
    `;
}

function renderControlesFeedbackVisual(slot, avaliacao) {
    if (!window.visualFeedbackService) return "";
    const opcoes = [
        ["adequada", "Adequada"],
        ["generica", "Generica"],
        ["inadequada", "Inadequada"]
    ];
    return `
        <div class="gallery-feedback" role="group" aria-label="Avaliar referencia de ${escapeHTML(rotuloSlotGaleria(slot))}">
            <span>Esta imagem combina com o evento?</span>
            <div>
                ${opcoes.map(([valor, rotulo]) => `<button type="button" class="gallery-feedback-btn ${avaliacao === valor ? "active" : ""}" data-gallery-rating="${valor}" aria-pressed="${avaliacao === valor ? "true" : "false"}" onclick="avaliarImagemGaleria('${escapeHTML(slot)}','${valor}')">${rotulo}</button>`).join("")}
            </div>
        </div>
    `;
}

function renderResumoFeedbackVisual(historico = false) {
    if (historico || !window.visualFeedbackService) return "";
    return `<div class="gallery-feedback-summary" id="galleryFeedbackSummary" role="status">${conteudoResumoFeedbackVisual()}</div>`;
}

function conteudoResumoFeedbackVisual() {
    const resumo = window.visualFeedbackService?.resumir?.() || { total: 0 };
    if (!resumo.total) {
        return `<span>Avalie as imagens para melhorar escolhas repetidas neste navegador.</span>`;
    }
    return `
        <span><strong>${escapeHTML(resumo.total)} preferencias locais:</strong> ${escapeHTML(resumo.adequada)} adequadas · ${escapeHTML(resumo.generica)} genericas · ${escapeHTML(resumo.inadequada)} inadequadas.</span>
        <button type="button" class="gallery-feedback-clear" onclick="limparAvaliacoesGaleria()">Limpar preferencias visuais</button>
    `;
}

function avaliarImagemGaleria(slot, rating) {
    const estado = window.chefIAGaleriaEstado;
    const service = window.visualFeedbackService;
    const imagem = estado?.images?.find(item => item.slot === slot);
    if (!imagem || !service?.salvarAvaliacao?.(imagem, rating)) return;

    if (rating === "inadequada" && normalizarArray(estado.alternatives?.[slot]).length) {
        trocarImagemGaleria(slot);
        return;
    }
    const cartao = document.querySelector(`[data-gallery-slot="${slot}"]`);
    cartao?.querySelectorAll("[data-gallery-rating]").forEach(botao => {
        const ativo = botao.dataset.galleryRating === rating;
        botao.classList.toggle("active", ativo);
        botao.setAttribute("aria-pressed", String(ativo));
    });
    if (cartao) cartao.classList.toggle("gallery-card-rejected", rating === "inadequada");
    const resumo = document.getElementById("galleryFeedbackSummary");
    if (resumo) resumo.innerHTML = conteudoResumoFeedbackVisual();
}

function limparAvaliacoesGaleria() {
    if (!window.visualFeedbackService) return;
    if (typeof confirm === "function" && !confirm("Limpar somente as preferencias visuais salvas neste navegador?")) return;
    window.visualFeedbackService.limpar();
    const estado = window.chefIAGaleriaEstado;
    if (estado) renderizarGaleriaEvento(estado, estado.opcoes);
}

function trocarImagemGaleria(slot) {
    const estado = window.chefIAGaleriaEstado;
    if (!estado) return;
    const indice = estado.images.findIndex(imagem => imagem.slot === slot);
    const fila = normalizarArray(estado.alternatives?.[slot]);
    if (indice < 0 || !fila.length) return;

    const chavesAtuais = new Set(estado.images.map(chaveImagemGaleria));
    const indiceAlternativa = fila.findIndex(imagem => !chavesAtuais.has(chaveImagemGaleria(imagem)));
    if (indiceAlternativa < 0) return;
    const [proxima] = fila.splice(indiceAlternativa, 1);
    const atual = estado.images[indice];
    estado.images[indice] = proxima;
    fila.push(atual);
    estado.alternatives[slot] = fila;
    renderizarGaleriaEvento(estado, estado.opcoes);
}

function ocultarImagemGaleria(slot) {
    const estado = window.chefIAGaleriaEstado;
    if (!estado) return;
    estado.images = estado.images.filter(imagem => imagem.slot !== slot);
    delete estado.alternatives[slot];
    renderizarGaleriaEvento(estado, estado.opcoes);
}

function chaveImagemGaleria(imagem) {
    return String(imagem?.source_url || imagem?.id || imagem?.image_url || "");
}

function fallbackGaleriaPorSlot(slot) {
    if (slot === "sobremesa") return "/images/fallback/dessert.svg";
    if (slot === "bebida") return "/images/fallback/beverages.svg";
    if (slot === "principal") return "/images/fallback/main-course.svg";
    if (["entrada", "salada", "acompanhamento"].includes(slot)) return "/images/fallback/savory-food.svg";
    return "/images/fallback/event-cover.svg";
}

function rotuloSlotGaleria(slot) {
    return ({
        capa: "Conceito",
        ambiente: "Ambiente",
        entrada: "Entradas",
        principal: "Principal",
        acompanhamento: "Acompanhamentos",
        salada: "Saladas",
        sobremesa: "Sobremesas",
        bebida: "Bebidas"
    })[slot] || "Evento";
}

function ativarFallbackImagensGaleria() {
    document.querySelectorAll("#eventGalleryVisualizacao img[data-gallery-fallback]").forEach(imagem => {
        imagem.addEventListener("error", () => {
            const fallback = imagem.dataset.galleryFallback;
            if (fallback && imagem.getAttribute("src") !== fallback) imagem.setAttribute("src", fallback);
            imagem.closest(".event-gallery-card")?.classList.add("gallery-card-local");
        }, { once: true });
    });
}

function aplicarImagensAoCardapio(estado) {
    const pools = {};
    normalizarArray(estado?.images).forEach(imagem => {
        if (!pools[imagem.slot]) pools[imagem.slot] = [];
        pools[imagem.slot].push(imagem, ...normalizarArray(estado?.alternatives?.[imagem.slot]));
    });
    const indices = {};
    document.querySelectorAll("[data-dish-slot]").forEach(cartao => {
        const slot = cartao.dataset.dishSlot;
        const candidatos = pools[slot] || [];
        const indice = indices[slot] || 0;
        indices[slot] = indice + 1;
        const imagem = candidatos.length ? candidatos[indice % candidatos.length] : null;
        const elemento = cartao.querySelector("img[data-dish-image]");
        const credito = cartao.querySelector(".dish-image-credit span");
        const fonte = cartao.querySelector(".dish-image-credit a");
        if (!elemento) return;

        const fallback = fallbackGaleriaPorSlot(slot);
        elemento.src = imagem?.image_url || fallback;
        elemento.dataset.dishFallback = fallback;
        elemento.alt = imagem?.alt || `Referência visual para ${cartao.dataset.dishName || "item do cardápio"}`;
        if (credito) credito.textContent = imagem
            ? `${imagem.creator || "Fonte visual"} · ${imagem.license || "licença informada"}`
            : "Ilustração local de referência";
        if (fonte) {
            if (imagem?.source_url) {
                fonte.href = imagem.source_url;
                fonte.hidden = false;
            } else {
                fonte.removeAttribute("href");
                fonte.hidden = true;
            }
        }
    });
    ativarFallbackImagensCardapio();
}

function ativarFallbackImagensCardapio() {
    document.querySelectorAll("img[data-dish-image]").forEach(imagem => {
        if (imagem.dataset.fallbackAtivado === "true") return;
        imagem.dataset.fallbackAtivado = "true";
        imagem.addEventListener("error", () => {
            const fallback = imagem.dataset.dishFallback;
            if (fallback && imagem.getAttribute("src") !== fallback) imagem.setAttribute("src", fallback);
            const credito = imagem.closest(".dish-card-rich")?.querySelector(".dish-image-credit span");
            if (credito) credito.textContent = "Ilustração local de referência";
        });
    });
}

function alternarVisualizacaoGaleria(modo) {
    const galeria = document.getElementById("eventGalleryVisualizacao");
    if (!galeria) return;
    const emLista = modo === "list";
    galeria.classList.toggle("event-gallery-list", emLista);
    document.querySelectorAll("[data-gallery-view]").forEach(botao => {
        const ativo = botao.dataset.galleryView === (emLista ? "list" : "carousel");
        botao.classList.toggle("active", ativo);
        botao.setAttribute("aria-pressed", String(ativo));
    });
    document.querySelectorAll("[data-gallery-nav]").forEach(botao => {
        botao.hidden = emLista;
    });
}

function rolarGaleria(direcao) {
    const galeria = document.getElementById("eventGalleryVisualizacao");
    if (!galeria || galeria.classList.contains("event-gallery-list")) return;
    galeria.scrollBy({
        left: direcao * Math.max(galeria.clientWidth * 0.82, 280),
        behavior: "smooth"
    });
}

function renderQualidadeCulinaria(qualidade) {
    if (!qualidade || qualidade.status === "aprovado") return "";

    const cobertura = qualidade.cobertura || {};
    const mensagens = [
        ...normalizarArray(qualidade.avisos),
        ...normalizarArray(qualidade.ajustes)
    ].slice(0, 4);
    const titulo = qualidade.status === "revisar"
        ? "Planejamento gerado com pontos para revisão"
        : "Cobertura culinária ajustada automaticamente";

    return `
        <section class="quality-panel ${qualidade.status === "revisar" ? "quality-review" : "quality-adjusted"}">
            <div>
                <strong>${escapeHTML(titulo)}</strong>
                <p>${escapeHTML(cobertura.ingredientes_cobertos || 0)} de ${escapeHTML(cobertura.ingredientes_total || 0)} ingredientes ligados às compras · ${escapeHTML(cobertura.receitas_cobertas || 0)} de ${escapeHTML(cobertura.pratos_com_preparo || 0)} preparações com receita${cobertura.receitas_recuperadas ? ` · ${escapeHTML(cobertura.receitas_recuperadas)} ficha(s) recuperada(s)` : ""}.</p>
            </div>
            ${mensagens.length ? `<ul>${mensagens.map(item => `<li>${escapeHTML(item)}</li>`).join("")}</ul>` : ""}
        </section>
    `;
}

function renderAvaliacaoEvento(avaliacao) {
    if (!avaliacao || !Number.isFinite(Number(avaliacao.nota))) return "";
    const comparacao = normalizarArray(avaliacao.comparacao);
    const revisar = normalizarArray(avaliacao.itens_a_revisar);
    return `
        <section class="event-audit-panel event-audit-${escapeHTML(avaliacao.status || "revisar")}">
            <div class="event-audit-score">
                <span>Auditoria do evento</span>
                <strong>${escapeHTML(Number(avaliacao.nota).toLocaleString("pt-BR", { minimumFractionDigits: 1, maximumFractionDigits: 1 }))}<small>/10</small></strong>
                <b>${escapeHTML(avaliacao.status || "revisar")}</b>
            </div>
            <div class="event-audit-content">
                <h3>Os itens combinam com o evento?</h3>
                <p>${escapeHTML(avaliacao.resumo_textual || "Avaliação indisponível.")}</p>
                <div class="event-audit-criteria">
                    ${comparacao.map(item => `
                        <article>
                            <span>${escapeHTML(item.criterio || "Critério")}</span>
                            <strong>${escapeHTML(item.pontos)} / ${escapeHTML(item.maximo)}</strong>
                            <small>${escapeHTML(item.resultado || "")}</small>
                        </article>
                    `).join("")}
                </div>
                ${revisar.length ? `
                    <details class="event-audit-review">
                        <summary>${revisar.length} item(ns) para revisar</summary>
                        <ul>${revisar.map(item => `<li><strong>${escapeHTML(item.nome || "Item")}</strong>: ${escapeHTML(normalizarArray(item.motivos).join("; "))}</li>`).join("")}</ul>
                    </details>
                ` : ""}
                <p class="event-audit-decision">${escapeHTML(avaliacao.decisao || "")}</p>
            </div>
        </section>
    `;
}

function renderReconciliacaoBebidas(reconciliacao) {
    const grupos = normalizarArray(reconciliacao?.grupos).filter(grupo => grupo.status === "ajustado");
    if (!grupos.length) return "";

    return `
        <section class="quality-panel beverage-balance-panel">
            <div>
                <strong>Volumes reconciliados pelo motor</strong>
                <p>As opções escolhidas foram preservadas e os litros foram distribuídos proporcionalmente até o mínimo operacional.</p>
            </div>
            <ul>
                ${grupos.map(grupo => `<li><b>${escapeHTML(grupo.classe)}</b>: ${escapeHTML(formatarNumeroUI(grupo.antes))} L → ${escapeHTML(formatarNumeroUI(grupo.depois))} L em ${escapeHTML(normalizarArray(grupo.itens).length)} item(ns).</li>`).join("")}
            </ul>
        </section>
    `;
}

function formatarNumeroUI(valor) {
    const numero = Number(valor);
    if (!Number.isFinite(numero)) return String(valor || 0);
    return String(Math.round(numero * 10) / 10).replace(".", ",");
}

function renderVariedadeCulinaria(variedade) {
    if (!variedade || variedade.status === "sem_historico" || !variedade.historicos_considerados) return "";

    const justificadas = normalizarArray(variedade.repeticoes_justificadas);
    const revisar = normalizarArray(variedade.repeticoes_a_revisar);
    const titulo = revisar.length
        ? "Variedade aplicada com repetições para revisar"
        : "Variedade aplicada ao histórico recente";
    const mensagens = [
        ...justificadas.map(item => `${item.nome}: mantido por ser elemento essencial do perfil.`),
        ...revisar.map(item => `${item.nome}: repetido apesar de existir memória recente.`)
    ].slice(0, 5);

    return `
        <section class="quality-panel variety-panel ${revisar.length ? "variety-review" : ""}">
            <div>
                <strong>${escapeHTML(titulo)}</strong>
                <p>${escapeHTML(variedade.pratos_novos || 0)} pratos novos · ${escapeHTML(justificadas.length)} repetições essenciais · ${escapeHTML(revisar.length)} repetições para revisar.</p>
                <p>Comparação com ${escapeHTML(variedade.historicos_considerados)} projeto(s) equivalente(s) deste navegador.</p>
            </div>
            ${mensagens.length ? `<ul>${mensagens.map(item => `<li>${escapeHTML(item)}</li>`).join("")}</ul>` : ""}
        </section>
    `;
}

function renderContextoInformado(evento = {}, premissas = {}) {
    const valores = {
        horario: evento?.horarioInicio || premissas.horario_inicio || "",
        formato: evento?.formatoServico || premissas.formato_servico || "",
        faixa: evento?.faixaEtaria || premissas.faixa_etaria || "",
        infraestrutura: evento?.infraestrutura || premissas.infraestrutura || "",
        prioridade: evento?.prioridade || premissas.prioridade || ""
    };
    const itens = [
        valores.horario && valores.horario !== "Nao informado" ? `Inicio: ${valores.horario}` : "",
        valores.formato && valores.formato !== "A definir pelo Chef IA" ? `Servico: ${valores.formato}` : "",
        valores.faixa && valores.faixa !== "Publico misto" ? `Publico: ${valores.faixa}` : "",
        valores.infraestrutura && valores.infraestrutura !== "A confirmar" ? `Infraestrutura: ${valores.infraestrutura}` : "",
        valores.prioridade && valores.prioridade !== "Equilibrio geral" ? `Prioridade: ${valores.prioridade}` : ""
    ].filter(Boolean);

    return itens.length ? renderSecao("Contexto informado", renderListaCards(itens, "note-card")) : "";
}

function renderCoerenciaEvento(contexto) {
    if (!contexto || typeof contexto !== "object") return "";
    const alimentos = normalizarArray(contexto.blocos_alimentares_esperados);
    const bebidas = normalizarArray(contexto.blocos_bebidas_esperados);
    const cores = normalizarArray(contexto.cores_coerentes);
    const decoracao = normalizarArray(contexto.decoracao_coerente);
    const sinaisPremium = normalizarArray(contexto.sinais_premium);
    const evitar = normalizarArray(contexto.evitar);
    const restricoes = normalizarArray(contexto.restricoes_alimentares);
    const orcamento = contexto.orcamento || {};

    return renderDetalhesExpansiveis(
        "Coerencia aplicada ao evento",
        `${contexto.tipologia_reconhecida || "geral"} · estilo ${contexto.estilo || "simples"} · ${alimentos.length + bebidas.length} blocos de referencia`,
        `<section class="coherence-panel">
            <div class="coherence-lead">
                <span>${escapeHTML(contexto.tipo_informado || "Evento")}</span>
                <p>${escapeHTML(contexto.significado_social_cultural || "Contexto geral aplicado.")}</p>
            </div>
            <div class="coherence-grid">
                ${renderCoherenceGroup("Blocos alimentares", alimentos)}
                ${renderCoherenceGroup("Bebidas", bebidas)}
                ${renderCoherenceGroup("Cores", cores)}
                ${renderCoherenceGroup("Decoracao", decoracao)}
                ${renderCoherenceGroup("Sinais Premium", sinaisPremium)}
                ${renderCoherenceGroup("Evitar", evitar)}
                ${renderCoherenceGroup("Restricoes", restricoes.map(item => item.rotulo || item.id || item))}
            </div>
            <div class="coherence-budget">
                <strong>Orcamento</strong>
                <span>${escapeHTML(orcamento.valor_informado || "Nao informado")}</span>
                <small>${escapeHTML(orcamento.regra || "Valores permanecem a cotar.")}</small>
            </div>
        </section>`
    );
}

function renderCoherenceGroup(titulo, itens) {
    if (!itens.length) return "";
    return `<div><strong>${escapeHTML(titulo)}</strong><p>${itens.map(item => escapeHTML(item)).join(" · ")}</p></div>`;
}

function renderDetalhesExpansiveis(titulo, resumo, conteudo) {
    if (!conteudo) return "";
    return `
        <details class="result-detail-group">
            <summary>
                <span>${escapeHTML(titulo)}</span>
                <small>${escapeHTML(resumo)}</small>
            </summary>
            <div class="result-detail-content">${conteudo}</div>
        </details>
    `;
}

function baixarRelatorioPDF() {
    const ultimoPlano = window.chefIAUltimoPlano;
    const jsPDF = window.jspdf?.jsPDF;

    if (!ultimoPlano || !ultimoPlano.dados) {
        alert("Gere ou carregue um planejamento antes de exportar.");
        return;
    }

    if (!jsPDF) {
        window.print();
        return;
    }

    const { dados, pessoas, evento } = ultimoPlano;
    const doc = new jsPDF({ unit: "mm", format: "a4" });
    const margem = 16;
    const larguraTexto = 178;
    const larguraPagina = 210;
    const alturaPagina = 297;
    const limiteTexto = 274;
    const corTexto = [35, 31, 28];
    const corDourado = [180, 137, 62];
    const corFundo = [248, 246, 241];
    let y = 44;

    const novaPagina = () => {
        doc.addPage();
        y = 20;
        doc.setDrawColor(...corDourado);
        doc.setLineWidth(0.4);
        doc.line(margem, 14, larguraPagina - margem, 14);
    };

    const escrever = (texto, opcoes = {}) => {
        const tamanho = opcoes.tamanho || 10;
        const estilo = opcoes.estilo || "normal";
        const espaco = opcoes.espaco || 5;
        const linhas = doc.splitTextToSize(normalizarTextoPDF(texto), larguraTexto);
        const altura = linhas.length * espaco;

        if (y + altura > limiteTexto) novaPagina();

        doc.setFont("helvetica", estilo);
        doc.setFontSize(tamanho);
        doc.setTextColor(...(opcoes.cor || corTexto));
        doc.text(linhas, margem, y);
        y += altura + (opcoes.depois || 1);
    };

    const secao = titulo => {
        if (y > 252) novaPagina();
        y += 4;
        doc.setFillColor(...corFundo);
        doc.setDrawColor(...corDourado);
        doc.roundedRect(margem, y - 5, larguraTexto, 10, 1.5, 1.5, "FD");
        doc.setFont("helvetica", "bold");
        doc.setFontSize(12);
        doc.setTextColor(...corTexto);
        doc.text(normalizarTextoPDF(titulo).toUpperCase(), margem + 3, y + 2);
        y += 12;
    };

    const lista = itens => {
        normalizarArray(itens).forEach(item => escrever(`- ${textoPDFItem(item)}`, { espaco: 5 }));
    };

    const listaOuVazio = (itens, vazio = "Nao informado no plano gerado.") => {
        const listaNormalizada = normalizarArray(itens).filter(item => textoPDFItem(item));
        if (!listaNormalizada.length) {
            escrever(vazio, { cor: [120, 110, 98] });
            return;
        }
        lista(listaNormalizada);
    };

    const cabecalho = () => {
        doc.setFillColor(...corTexto);
        doc.rect(0, 0, larguraPagina, 30, "F");
        doc.setFillColor(...corDourado);
        doc.rect(0, 30, larguraPagina, 2, "F");
        doc.setFont("helvetica", "bold");
        doc.setFontSize(19);
        doc.setTextColor(255, 255, 255);
        doc.text("Chef IA Studio", margem, 14);
        doc.setFont("helvetica", "normal");
        doc.setFontSize(9);
        doc.text("Relatorio de planejamento de evento", margem, 22);
        doc.text(new Date().toLocaleDateString("pt-BR"), larguraPagina - margem, 22, { align: "right" });
        doc.setTextColor(...corTexto);
    };

    const cardResumo = (label, valor, x, yCard) => {
        doc.setFillColor(255, 255, 255);
        doc.setDrawColor(225, 218, 205);
        doc.roundedRect(x, yCard, 55, 18, 2, 2, "FD");
        doc.setFont("helvetica", "normal");
        doc.setFontSize(7);
        doc.setTextColor(92, 83, 72);
        doc.text(normalizarTextoPDF(label).toUpperCase(), x + 3, yCard + 6);
        doc.setFont("helvetica", "bold");
        doc.setFontSize(11);
        doc.setTextColor(...corTexto);
        doc.text(doc.splitTextToSize(normalizarTextoPDF(valor || "A definir"), 48), x + 3, yCard + 13);
    };

    const rodape = () => {
        const paginas = doc.getNumberOfPages();
        for (let pagina = 1; pagina <= paginas; pagina++) {
            doc.setPage(pagina);
            doc.setDrawColor(225, 218, 205);
            doc.line(margem, 286, larguraPagina - margem, 286);
            doc.setFont("helvetica", "normal");
            doc.setFontSize(8);
            doc.setTextColor(120, 110, 98);
            doc.text("Gerado por Chef IA Studio", margem, 291);
            doc.text(`Pagina ${pagina} de ${paginas}`, larguraPagina - margem, 291, { align: "right" });
        }
    };

    const motor = dados.motor_logistica || {};
    const premissas = motor.premissas || {};
    const precificacao = dados.precificacao || motor.precificacao || null;
    const precoConfiavel = precificacaoEhConfiavel(precificacao);
    const cardapio = normalizarArray(dados.cardapio);
    const compras = normalizarArray(dados.lista_compras);
    const receitas = normalizarArray(dados.receitas);
    const utensilios = normalizarArray(dados.utensilios);
    const locais = normalizarArray(dados.local);
    const layout = normalizarArray(dados.layout);
    const cronograma = normalizarArray(dados.cronograma);
    const equipeObs = normalizarArray(dados.equipe_obs);
    const entretenimento = normalizarArray(dados.entretenimento);
    const lembrancinhas = normalizarArray(dados.lembrancinhas);
    const staff = normalizarArray(motor.staff);
    const alimentacao = normalizarArray(motor.alimentacao);
    const bebidas = normalizarArray(motor.bebidas);
    const servico = motor.servico_mesa || dados.servico_mesa;
    const variedade = dados.variedade_culinaria || null;
    const operacao = motor.operacao || null;
    const contextoEvento = dados.contexto_evento || null;
    const reconciliacaoBebidas = dados.reconciliacao_bebidas || null;
    const avaliacaoEvento = dados.avaliacao_evento || null;

    cabecalho();

    secao("Resumo executivo");
    cardResumo("Convidados", pessoas || "Nao informado", margem, y);
    cardResumo("Duracao", motor.duracao || "A definir", margem + 61, y);
    cardResumo("Estimativa", precoConfiavel ? motor.estimativa_total : "A cotar", margem + 122, y);
    y += 24;
    if (motor.perfil) escrever(`Perfil: ${motor.perfil}`, { estilo: "bold" });
    if (motor.espaco) escrever(`Espaco recomendado: ${motor.espaco}`);
    if (precoConfiavel && motor.custo_adulto) escrever(`Custo por adulto: ${motor.custo_adulto}`);
    if (precoConfiavel && premissas.criancas > 0 && motor.custo_crianca) escrever(`Custo por crianca: ${motor.custo_crianca}`);
    if (dados.resumo_chef) escrever(dados.resumo_chef);
    if (avaliacaoEvento) {
        escrever(`Auditoria do evento: ${avaliacaoEvento.nota}/10 (${avaliacaoEvento.status || "revisar"}).`, { estilo: "bold" });
        escrever(avaliacaoEvento.resumo_textual || "");
    }

    secao("Dados do evento");
    lista([
        `Tipo: ${evento?.tipo || premissas.tipo || "Nao informado"}`,
        `Convidados: ${pessoas || evento?.pessoas || premissas.pessoas || "Nao informado"}`,
        premissas.criancas > 0 ? `Publico: ${premissas.adultos} adultos e ${premissas.criancas} criancas` : "",
        `Localidade: ${localidadePrecificacao(precificacao)}`,
        `Data do evento: ${evento?.dataEvento || precificacao?.data_evento || "Nao informada"}`,
        `Horario de inicio: ${evento?.horarioInicio || premissas.horario_inicio || "Nao informado"}`,
        `Duracao: ${evento?.duracao || premissas.duracao_horas || motor.duracao || "Nao informado"}`,
        `Refeicao: ${evento?.refeicao || premissas.refeicao || "Nao informado"}`,
        `Formato do servico: ${evento?.formatoServico || premissas.formato_servico || "A definir pelo Chef IA"}`,
        `Faixa etaria: ${evento?.faixaEtaria || premissas.faixa_etaria || "Publico misto"}`,
        `Infraestrutura: ${evento?.infraestrutura || premissas.infraestrutura || "A confirmar"}`,
        `Prioridade: ${evento?.prioridade || premissas.prioridade || "Equilibrio geral"}`,
        `Estilo: ${evento?.estilo || premissas.estilo || "Nao informado"}`,
        `Tema: ${evento?.tema || premissas.tema || "Nao informado"}`,
        `Bebidas: ${evento?.alcool || premissas.alcool || "Nao informado"}`,
        `Orcamento desejado: ${evento?.orcamentoBase || premissas.orcamento_base || "Nao informado"}`,
        `Restricoes: ${evento?.restricoes || "Nenhuma"}`,
        evento?.obs ? `Observacoes do cliente: ${evento.obs}` : ""
    ].filter(Boolean));

    if (contextoEvento) {
        secao("Coerencia aplicada ao evento");
        escrever(contextoEvento.significado_social_cultural || "Contexto geral aplicado.");
        escrever(`Tipologia: ${contextoEvento.tipologia_reconhecida || "geral"} | Estilo: ${contextoEvento.estilo || "simples"}`);
        escrever("Blocos alimentares esperados", { estilo: "bold" });
        listaOuVazio(contextoEvento.blocos_alimentares_esperados);
        escrever("Blocos de bebidas esperados", { estilo: "bold" });
        listaOuVazio(contextoEvento.blocos_bebidas_esperados);
        escrever("Cores e decoracao", { estilo: "bold" });
        listaOuVazio([
            ...normalizarArray(contextoEvento.cores_coerentes),
            ...normalizarArray(contextoEvento.decoracao_coerente)
        ]);
        if (normalizarArray(contextoEvento.evitar).length) {
            escrever("Evitar", { estilo: "bold" });
            listaOuVazio(contextoEvento.evitar);
        }
        if (normalizarArray(contextoEvento.sinais_premium).length) {
            escrever("Sinais Premium", { estilo: "bold" });
            listaOuVazio(contextoEvento.sinais_premium);
        }
        if (normalizarArray(contextoEvento.restricoes_alimentares).length) {
            escrever("Blocos de restricao", { estilo: "bold" });
            listaOuVazio(contextoEvento.restricoes_alimentares.map(item => item.rotulo || item.id));
        }
        escrever(`Orcamento orientador: ${contextoEvento.orcamento?.valor_informado || "Nao informado"}`);
        escrever(contextoEvento.orcamento?.regra || "Valores permanecem a cotar.");
    }

    secao("Motor logistico");
    escrever("Alimentacao", { estilo: "bold" });
    listaOuVazio(alimentacao);
    escrever("Bebidas", { estilo: "bold" });
    listaOuVazio(bebidas);
    escrever("Equipe", { estilo: "bold" });
    listaOuVazio(staff);

    if (operacao) {
        secao("Operacao deterministica");
        escrever(`Complexidade: ${operacao.complexidade?.nivel || "A definir"} (${operacao.complexidade?.pontuacao ?? "-"} pontos)`, { estilo: "bold" });
        escrever(`Modelo de producao: ${operacao.modelo_producao || "A confirmar"}`);
        escrever(operacao.complexidade?.leitura || "");
        escrever("Fluxo de producao, montagem e reposicao", { estilo: "bold" });
        listaOuVazio(operacao.fluxo_producao);
        escrever("Equipamentos por estacao", { estilo: "bold" });
        listaOuVazio(operacao.estacoes);
        escrever("Cronograma operacional", { estilo: "bold" });
        listaOuVazio(operacao.cronograma_operacional);
        if (normalizarArray(operacao.confirmacoes_pendentes).length) {
            escrever("Confirmacoes pendentes", { estilo: "bold" });
            listaOuVazio(operacao.confirmacoes_pendentes);
        }
    }

    if (variedade?.historicos_considerados > 0) {
        secao("Variedade culinaria");
        escrever(`${variedade.pratos_novos || 0} pratos novos; ${normalizarArray(variedade.repeticoes_justificadas).length} repeticoes essenciais; ${normalizarArray(variedade.repeticoes_a_revisar).length} repeticoes para revisar.`);
        normalizarArray(variedade.repeticoes_justificadas).forEach(item => escrever(`- ${item.nome}: mantido como elemento essencial.`));
        normalizarArray(variedade.repeticoes_a_revisar).forEach(item => escrever(`- ${item.nome}: repeticao a revisar.`));
    }

    secao("Cardapio - itens e quantidades");
    listaOuVazio(cardapio, "Cardapio nao informado pela IA.");

    secao("Receitas e preparo");
    listaOuVazio(receitas, "Receitas ainda nao detalhadas no plano.");

    const gruposBebidasAjustados = normalizarArray(reconciliacaoBebidas?.grupos).filter(grupo => grupo.status === "ajustado");
    if (gruposBebidasAjustados.length) {
        secao("Ajustes de bebidas do motor");
        gruposBebidasAjustados.forEach(grupo => escrever(`${grupo.classe}: ${formatarNumeroUI(grupo.antes)} L para ${formatarNumeroUI(grupo.depois)} L, distribuidos em ${normalizarArray(grupo.itens).length} item(ns).`));
    }

    secao("Lista de compras");
    listaOuVazio(compras, "Lista de compras nao informada pela IA.");

    secao("Servico de mesa e apoio");
    if (servico && typeof servico === "object") {
        ["talheres", "loucas", "copos", "descartaveis", "apoio_cozinha"].forEach(chave => {
            const itens = normalizarArray(servico[chave]);
            escrever(rotuloServico(chave), { estilo: "bold" });
            listaOuVazio(itens);
        });
        if (servico.observacao) escrever(servico.observacao);
    } else {
        escrever("Servico de mesa nao informado no plano.", { cor: [120, 110, 98] });
    }

    secao("Utensilios extras");
    listaOuVazio(utensilios, "Utensilios extras nao informados no plano.");

    secao("Opcoes de local");
    listaOuVazio(locais, "Opcoes de local nao informadas no plano.");

    secao("Layout do evento");
    listaOuVazio(layout, "Layout nao informado no plano.");

    secao("Decoracao e ambientacao");
    const decoracao = dados.decoracao || {};
    const temas = normalizarArray(decoracao.temas);
    const itensDecoracao = normalizarArray(decoracao.itens);
    escrever("Temas", { estilo: "bold" });
    listaOuVazio(temas);
    escrever("Itens", { estilo: "bold" });
    listaOuVazio(itensDecoracao);
    escrever(`Iluminacao: ${decoracao.iluminacao || "Nao informada"}`);

    secao("Roteiro do evento");
    listaOuVazio(cronograma, "Roteiro do evento nao informado no plano.");

    secao("Observacoes de equipe");
    listaOuVazio(equipeObs, "Observacoes de equipe nao informadas no plano.");

    secao("Entretenimento");
    listaOuVazio(entretenimento, "Entretenimento nao informado no plano.");

    secao("Lembrancinhas");
    listaOuVazio(lembrancinhas, "Lembrancinhas nao informadas no plano.");

    secao("Checklist");
    const checklist = dados.checklist || {};
    ["pre", "durante", "pos"].forEach(chave => {
        const itens = normalizarArray(checklist[chave]);
        escrever(rotuloChecklist(chave), { estilo: "bold" });
        listaOuVazio(itens);
    });

    secao("Precificacao");
    if (!precoConfiavel) {
        escrever(precificacao?.mensagem || "Valores financeiros indisponiveis sem catalogo regional rastreavel.", { cor: [120, 110, 98] });
        escrever(`Regiao: ${localidadePrecificacao(precificacao)}`);
    } else {
        const orcamento = dados.orcamento || {};
        ["economico", "medio", "sofisticado"].forEach(chave => {
            const tier = orcamento[chave];
            escrever(rotuloOrcamento(chave), { estilo: "bold" });
            listaOuVazio(tier && typeof tier === "object" ? Object.entries(tier).map(([item, valor]) => `${item}: ${valor}`) : []);
        });
        escrever(`Fonte: ${precificacao.fonte}`);
        escrever(`Data-base: ${precificacao.data_base}`);
    }

    const nomeEvento = motor.premissas?.tipo || "evento";
    const nomeArquivo = `chef-ia-${slugPDF(nomeEvento)}.pdf`;
    rodape();
    doc.save(nomeArquivo);
}

function textoPDFItem(item) {
    if (typeof item === "string") return item;
    if (!item || typeof item !== "object") return "";

    const nome = item.nome || item.item || item.funcao || item.atividade || item.etapa || item.estacao || item.tipo || "Item";
    const quantidade = item.quantidade ? ` - ${item.quantidade}` : "";
    const ingredientes = normalizarArray(item.ingredientes)
        .map(ingrediente => ingrediente && typeof ingrediente === "object"
            ? `${ingrediente.item || "Ingrediente"} ${[ingrediente.quantidade, ingrediente.unidade].filter(Boolean).join(" ")}`.trim()
            : String(ingrediente || ""))
        .filter(Boolean);
    const detalhes = [
        item.categoria,
        item.setor,
        item.natureza,
        item.status ? `status: ${item.status}` : "",
        item.origem ? `origem: ${item.origem}` : "",
        normalizarArray(item.nomes_itens).length ? `itens: ${normalizarArray(item.nomes_itens).join(", ")}` : "",
        item.hora ? `horario: ${item.hora}` : "",
        ingredientes.length ? `ingredientes: ${ingredientes.join(", ")}` : "",
        item.prioridade ? `prioridade ${item.prioridade}` : "",
        item.capacidade,
        item.descricao,
        item.observacao,
        item.preparo,
        normalizarArray(item.preparo_passos).length ? `passos: ${normalizarArray(item.preparo_passos).join("; ")}` : "",
        item.calculo,
        item.uso,
        item.orientacao,
        item.responsavel ? `responsavel: ${item.responsavel}` : "",
        item.pontos ? `pontos: ${item.pontos}` : "",
        normalizarArray(item.equipamentos).length ? `equipamentos: ${normalizarArray(item.equipamentos).join(", ")}` : "",
        item.pros ? `pros: ${item.pros}` : "",
        item.contras ? `contras: ${item.contras}` : "",
        item.custo ? `custo: ${item.custo}` : "",
        item.tempo,
        item.rendimento,
        item.quantidade_total ? `quantidade total: ${item.quantidade_total}` : ""
    ].filter(Boolean).join(" | ");

    return [nome + quantidade, detalhes].filter(Boolean).join(": ");
}

function normalizarTextoPDF(texto) {
    return String(texto || "")
        .normalize("NFKD")
        .replace(/[\u0300-\u036f]/g, "")
        .replace(/[^\x20-\x7E]/g, "")
        .replace(/\s+/g, " ")
        .trim();
}

function slugPDF(texto) {
    return normalizarTextoPDF(texto)
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, "-")
        .replace(/^-|-$/g, "")
        .slice(0, 40) || "planejamento";
}

function rotuloServico(chave) {
    const labels = {
        talheres: "Talheres",
        loucas: "Loucas",
        copos: "Copos",
        descartaveis: "Descartaveis",
        apoio_cozinha: "Apoio de cozinha"
    };
    return labels[chave] || chave;
}

function rotuloChecklist(chave) {
    const labels = {
        pre: "Pre-evento",
        durante: "Durante",
        pos: "Pos-evento"
    };
    return labels[chave] || chave;
}

function rotuloOrcamento(chave) {
    const labels = {
        economico: "Economico",
        medio: "Medio",
        sofisticado: "Sofisticado"
    };
    return labels[chave] || chave;
}

function renderMotorLogistica(motor) {
    if (!motor) return "";
    const alimentacao = normalizarArray(motor.alimentacao);
    const bebidas = normalizarArray(motor.bebidas);
    const staff = normalizarArray(motor.staff);

    return `
        <section class="motor-panel">
            <div class="motor-title">Motor de Logistica - Calculo Preciso</div>
            <div class="motor-pills">
                ${pill(motor.perfil)}
                ${pill(motor.duracao)}
                ${pill(motor.espaco)}
            </div>
            <div class="metric-grid">
                ${renderMetricGroup("Alimentacao", alimentacao)}
                ${renderMetricGroup("Bebidas", bebidas)}
                ${renderMetricGroup("Staff", staff)}
            </div>
            ${renderFinanceStrip(motor)}
        </section>
    `;
}

function renderOperacaoDeterministica(operacao) {
    if (!operacao || typeof operacao !== "object") return "";
    const complexidade = operacao.complexidade || {};
    const fluxo = normalizarArray(operacao.fluxo_producao);
    const estacoes = normalizarArray(operacao.estacoes);
    const cronograma = normalizarArray(operacao.cronograma_operacional);
    const pendencias = normalizarArray(operacao.confirmacoes_pendentes);
    const fatores = normalizarArray(complexidade.fatores);

    return `
        <section class="result-section operation-panel">
            <div class="section-head">
                <h3>Operacao do Evento</h3>
                <span class="complexity-badge complexity-${escapeHTML(normalizarSlug(complexidade.nivel || "media"))}">Complexidade ${escapeHTML(complexidade.nivel || "A definir")}</span>
            </div>
            <div class="operation-summary">
                <article>
                    <small>Nivel calculado</small>
                    <strong>${escapeHTML(complexidade.nivel || "A definir")} · ${escapeHTML(complexidade.pontuacao ?? "-")} pontos</strong>
                    <p>${escapeHTML(complexidade.leitura || "Dimensionamento operacional ainda não disponível.")}</p>
                </article>
                <article>
                    <small>Modelo de producao</small>
                    <strong>${escapeHTML(operacao.modelo_producao || "A confirmar")}</strong>
                    <p>${escapeHTML(operacao.status === "dimensionado" ? "Dimensionado com os dados informados." : "Depende das confirmações destacadas abaixo.")}</p>
                </article>
            </div>
            ${fatores.length ? `<details class="operation-factors"><summary>Como a complexidade foi calculada</summary>${renderListaCards(fatores, "note-card")}</details>` : ""}
            <div class="operation-grid">
                <div>
                    <h4>Producao, montagem e reposicao</h4>
                    <div class="operation-card-list">
                        ${fluxo.map(item => `<article><strong>${escapeHTML(item.etapa || "Etapa")}</strong><p>${escapeHTML(item.orientacao || "")}</p></article>`).join("")}
                    </div>
                </div>
                <div>
                    <h4>Equipamentos por estacao</h4>
                    <div class="operation-card-list">
                        ${estacoes.map(item => `
                            <article>
                                <strong>${escapeHTML(item.estacao || "Estação")} · ${escapeHTML(item.pontos || 1)} ponto(s)</strong>
                                <p>${normalizarArray(item.equipamentos).map(equipamento => escapeHTML(equipamento)).join(" · ")}</p>
                                <small>Responsável: ${escapeHTML(item.responsavel || "A definir")}</small>
                            </article>
                        `).join("")}
                    </div>
                </div>
            </div>
            <div class="operation-timeline">
                <h4>Cronograma operacional</h4>
                <div class="timeline">
                    ${cronograma.map(item => `
                        <div class="timeline-item">
                            <span>${escapeHTML(item.hora || "")}</span>
                            <div>
                                <h4>${escapeHTML(item.atividade || "Atividade")}</h4>
                                <p>${escapeHTML(item.descricao || "")}</p>
                                <small>${escapeHTML(item.responsavel || "")}</small>
                            </div>
                        </div>
                    `).join("")}
                </div>
            </div>
            ${pendencias.length ? `<div class="operation-pending"><strong>Confirmações antes da execução</strong>${renderListaCards(pendencias, "note-card")}</div>` : ""}
        </section>
    `;
}

function normalizarSlug(valor) {
    return String(valor || "")
        .normalize("NFD")
        .replace(/[\u0300-\u036f]/g, "")
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, "-")
        .replace(/^-|-$/g, "");
}

function renderFinanceStrip(motor) {
    const precificacao = motor.precificacao || null;
    if (!precificacaoEhConfiavel(precificacao)) {
        return `
            <div class="finance-strip finance-pending">
                <div>
                    <span>Precificacao</span>
                    <strong>A cotar</strong>
                    <small>${escapeHTML(precificacao?.mensagem || "Catalogo regional ainda nao configurado.")}</small>
                </div>
                <div>
                    <span>Regiao</span>
                    <strong>${escapeHTML(localidadePrecificacao(precificacao))}</strong>
                    <small>Sem fonte e data-base, nenhum valor e exibido.</small>
                </div>
            </div>
        `;
    }

    return `
        <div class="finance-strip">
            <div><span>Custo / Adulto</span><strong>${escapeHTML(motor.custo_adulto || "A cotar")}</strong></div>
            ${motor.premissas?.criancas > 0 ? `<div><span>Custo / Crianca</span><strong>${escapeHTML(motor.custo_crianca || "A cotar")}</strong></div>` : ""}
            <div><span>Estimativa</span><strong>${escapeHTML(motor.estimativa_total || "A cotar")}</strong></div>
        </div>
    `;
}

function precificacaoEhConfiavel(precificacao) {
    return Boolean(
        precificacao &&
        precificacao.status === "disponivel" &&
        precificacao.moeda &&
        Object.values(precificacao.regiao || {}).some(Boolean) &&
        precificacao.fonte &&
        precificacao.data_base
    );
}

function localidadePrecificacao(precificacao) {
    const regiao = precificacao?.regiao || {};
    return [regiao.cidade, regiao.estado, regiao.pais].filter(Boolean).join(" / ") || "Nao informada";
}

function renderResumoExecutivo(dados, pessoas, cardapio, compras) {
    const total = numeroSeguro(pessoas);
    const motor = dados.motor_logistica || {};
    const staff = normalizarArray(motor.staff);
    const totalEquipe = staff.reduce((totalEquipe, item) => totalEquipe + (numeroSeguro(item.quantidade) || 0), 0);
    const precoConfiavel = precificacaoEhConfiavel(dados.precificacao || motor.precificacao);
    const estimativa = precoConfiavel ? (motor.estimativa_total || dados.orcamento?.medio?.total || "A cotar") : "A cotar";

    const cards = [
        ["Convidados", total || pessoas, "base do calculo"],
        ["Pratos", cardapio.length || "-", "itens do cardapio"],
        ["Compras", compras.length || "-", "itens consolidados"],
        ["Equipe", totalEquipe || staff.length || "-", "profissionais recomendados"],
        ["Orcamento", estimativa, precoConfiavel ? "fonte e data-base validadas" : "sem catalogo regional"]
    ];

    return `
        <section class="exec-dashboard">
            ${cards.map(([label, value, hint]) => `
                <article>
                    <span>${escapeHTML(label)}</span>
                    <strong>${escapeHTML(value)}</strong>
                    <small>${escapeHTML(hint)}</small>
                </article>
            `).join("")}
        </section>
    `;
}

function renderServicoMesa(servico) {
    if (!servico || typeof servico !== "object") return "";
    const grupos = [
        ["talheres", "Talheres"],
        ["loucas", "Loucas"],
        ["copos", "Copos"],
        ["descartaveis", "Descartaveis"],
        ["apoio_cozinha", "Apoio de Cozinha"]
    ];

    const conteudo = grupos.map(([key, label]) => {
        const itens = normalizarArray(servico[key]);
        if (!itens.length) return "";
        return `
            <div class="service-group">
                <h4>${label}</h4>
                ${itens.map(item => `
                    <div class="service-line">
                        <span>${escapeHTML(item.item || item.nome || item)}</span>
                        <strong>${escapeHTML(item.quantidade || "")}</strong>
                        ${item.calculo ? `<small>${escapeHTML(item.calculo)}</small>` : ""}
                    </div>
                `).join("")}
            </div>
        `;
    }).join("");

    if (!conteudo.trim()) return "";

    return renderSecao("Servico de Mesa e Utensilios Numerados", `
        <div class="service-grid">${conteudo}</div>
        ${servico.observacao ? `<div class="service-note">${escapeHTML(servico.observacao)}</div>` : ""}
    `);
}

function renderMetricGroup(titulo, itens) {
    if (!itens.length) return "";
    return `
        <div class="metric-card">
            <h4>${escapeHTML(titulo)}</h4>
            ${itens.map(item => `
                <div class="metric-row">
                    <span>${escapeHTML(item.item || item.funcao || item.nome || item)}</span>
                    <strong>${escapeHTML(item.quantidade || "")}</strong>
                </div>
                ${item.observacao ? `<small>${escapeHTML(item.observacao)}</small>` : ""}
            `).join("")}
        </div>
    `;
}

function renderCardapio(cardapio) {
    if (!cardapio.length) return "";
    return `
        <section class="result-section menu-section">
            <div class="section-head menu-head">
                <div>
                    <h3>Selecao de Pratos</h3>
                    <small>Cada preparação e bebida aparece individualmente; os agrupamentos ficam restritos à operação e às compras.</small>
                </div>
                <div class="menu-controls" aria-label="Visualizacao do cardapio">
                    <span>${cardapio.length} itens individuais</span>
                    <button type="button" class="menu-view-btn active" data-menu-view="carousel" aria-pressed="true" onclick="alternarVisualizacaoCardapio('carousel')">Carrossel</button>
                    <button type="button" class="menu-view-btn" data-menu-view="list" aria-pressed="false" onclick="alternarVisualizacaoCardapio('list')">Lista</button>
                    <button type="button" class="menu-nav-btn" data-menu-nav="prev" aria-label="Pratos anteriores" onclick="rolarCardapio(-1)">←</button>
                    <button type="button" class="menu-nav-btn" data-menu-nav="next" aria-label="Proximos pratos" onclick="rolarCardapio(1)">→</button>
                </div>
            </div>
            <div class="dish-grid dish-carousel" id="cardapioVisualizacao">
                ${cardapio.map((item, i) => {
                    const slot = slotGaleriaPrato(item);
                    const fallback = fallbackGaleriaPorSlot(slot);
                    return `
                        <article class="dish-card-rich menu-item-card" data-dish-slot="${escapeHTML(slot)}" data-dish-name="${escapeHTML(item.nome || "Item do cardápio")}">
                            <div class="dish-visual g${i % 6}">
                                <img src="${escapeHTML(fallback)}" data-dish-image data-dish-fallback="${escapeHTML(fallback)}" alt="Referência visual para ${escapeHTML(item.nome || "item do cardápio")}" loading="lazy" decoding="async" referrerpolicy="no-referrer">
                                <span class="dish-image-label">Imagem de referência</span>
                            </div>
                            <div class="dish-body">
                                <span>${escapeHTML(item.categoria || "Cardápio")}</span>
                                <h4>${escapeHTML(item.nome || "Item do cardápio")}</h4>
                                <p>${escapeHTML(item.descricao || "Preparação selecionada para este evento.")}</p>
                                ${item.quantidade ? `<strong>${escapeHTML(item.quantidade)}</strong>` : ""}
                                <small class="dish-image-credit"><span>Ilustração local de referência</span><a target="_blank" rel="noopener noreferrer" hidden>Fonte</a></small>
                            </div>
                        </article>
                    `;
                }).join("")}
            </div>
        </section>
    `;
}

function slotGaleriaPrato(item) {
    const categoria = normalizarSlug(item?.categoria);
    const texto = normalizarSlug([item?.nome, item?.categoria].filter(Boolean).join(" "));
    if (/bebida|refrigerante|suco|agua|cafe|cha|infus|cerveja|vinho|gin|whisky|mocktail/.test(texto)) return "bebida";
    if (/sobremesa|doce|bolo|torta|trufa|biscoito/.test(texto)) return "sobremesa";
    if (/salada/.test(categoria)) return "salada";
    if (/acompanhamento/.test(categoria)) return "acompanhamento";
    if (/prato-principal|principal/.test(categoria)) return "principal";
    return "entrada";
}

function alternarVisualizacaoCardapio(modo) {
    const cardapio = document.getElementById("cardapioVisualizacao");
    if (!cardapio) return;
    const emLista = modo === "list";
    cardapio.classList.toggle("dish-list", emLista);
    document.querySelectorAll("[data-menu-view]").forEach(botao => {
        const ativo = botao.dataset.menuView === (emLista ? "list" : "carousel");
        botao.classList.toggle("active", ativo);
        botao.setAttribute("aria-pressed", String(ativo));
    });
    document.querySelectorAll("[data-menu-nav]").forEach(botao => {
        botao.hidden = emLista;
    });
}

function rolarCardapio(direcao) {
    const cardapio = document.getElementById("cardapioVisualizacao");
    if (!cardapio || cardapio.classList.contains("dish-list")) return;
    cardapio.scrollBy({
        left: direcao * Math.max(cardapio.clientWidth * 0.82, 260),
        behavior: "smooth"
    });
}

function renderCompras(compras) {
    if (!compras.length) return "";
    const porSetor = compras.reduce((acc, item) => {
        const setor = item.setor || "Outros";
        if (!acc[setor]) acc[setor] = [];
        acc[setor].push(item);
        return acc;
    }, {});

    return `
        <section class="shopping-panel">
            <div class="shopping-head">
                <h3>Lista de Compras por Setor</h3>
                <span>${compras.length} itens</span>
            </div>
            <div class="sector-grid">
                ${Object.entries(porSetor).map(([setor, itens]) => `
                    <div class="sector-card">
                        <h4>${escapeHTML(setor)}</h4>
                        ${itens.map(item => `
                            <div class="shopping-item">
                                <span class="shopping-item-name"><span>${escapeHTML(item.item || "Item")}</span>${item.natureza ? `<small>${escapeHTML(item.natureza)}</small>` : ""}</span>
                                <strong>${escapeHTML(item.quantidade || "")}</strong>
                            </div>
                        `).join("")}
                    </div>
                `).join("")}
            </div>
        </section>
    `;
}

function renderLocais(locais) {
    return `
        <section class="result-section">
            <div class="section-head"><h3>Opcoes de Local</h3></div>
            ${locais.length ? `<div class="place-grid">
                ${locais.map(local => `
                    <article class="place-card ${local.recomendado ? "recommended" : ""}">
                        ${local.recomendado ? `<span class="badge">Recomendado</span>` : ""}
                        <h4>${escapeHTML(local.tipo || "Local sugerido")}</h4>
                        <p>${escapeHTML(local.capacidade || "")}</p>
                        <p class="ok">${escapeHTML(local.pros || "")}</p>
                        <p class="warn">${escapeHTML(local.contras || "")}</p>
                    </article>
                `).join("")}
            </div>` : renderConteudoAusente("Opções de local não informadas.")}
        </section>
    `;
}

function renderDecoracao(decoracao) {
    const temas = normalizarArray(decoracao.temas);
    const itens = normalizarArray(decoracao.itens);
    return renderSecao("Decoracao e Tema", `
        ${temas.length ? `<div class="theme-row">${temas.map(t => `<span>${escapeHTML(t)}</span>`).join("")}</div>` : ""}
        ${itens.length ? renderListaCards(itens, "decor-card") : ""}
        ${decoracao.iluminacao ? `<div class="lighting-tip">${escapeHTML(decoracao.iluminacao)}</div>` : ""}
        ${!temas.length && !itens.length && !decoracao.iluminacao ? renderConteudoAusente("Decoração e ambientação não informadas.") : ""}
    `);
}

function renderCronograma(cronograma) {
    return `
        <section class="result-section">
            <div class="section-head"><h3>Roteiro do Evento</h3><span>experiencia dos convidados</span></div>
            ${cronograma.length ? `<div class="timeline">
                ${cronograma.map(item => `
                    <div class="timeline-item">
                        <span>${escapeHTML(item.hora || "")}</span>
                        <div>
                            <h4>${escapeHTML(item.atividade || "Atividade")}</h4>
                            <p>${escapeHTML(item.descricao || "")}</p>
                        </div>
                    </div>
                `).join("")}
            </div>` : renderConteudoAusente("Roteiro do evento não informado.")}
        </section>
    `;
}

function renderReceitas(receitas) {
    return renderSecao("Receitas e Preparo", `
        ${receitas.length ? `<div class="recipe-grid">
            ${receitas.map(r => typeof r === "string" ? `
                <div class="recipe-card"><p>${escapeHTML(r)}</p></div>
            ` : `
                <div class="recipe-card">
                    ${r.status === "ficha_operacional_recuperada" ? `<span class="recipe-recovered-badge">Ficha recuperada</span>` : ""}
                    <h4>${escapeHTML(r.nome || "Receita")}</h4>
                    ${normalizarArray(r.ingredientes).length ? `
                        <h5>Ingredientes</h5>
                        <ul class="recipe-ingredients">
                            ${normalizarArray(r.ingredientes).map(ingrediente => `<li>${escapeHTML(ingrediente.item || "Ingrediente")} — ${escapeHTML([ingrediente.quantidade, ingrediente.unidade].filter(Boolean).join(" "))}</li>`).join("")}
                        </ul>
                    ` : ""}
                    <h5>Modo de preparo</h5>
                    ${normalizarArray(r.preparo_passos).length ? `
                        <ol class="recipe-steps">${normalizarArray(r.preparo_passos).map(passo => `<li>${escapeHTML(passo)}</li>`).join("")}</ol>
                    ` : `<p>${escapeHTML(r.preparo || "Preparo não informado.")}</p>`}
                    <small>${escapeHTML([r.tempo, r.rendimento, r.quantidade_total].filter(Boolean).join(" · "))}</small>
                    ${r.observacao ? `<p class="recipe-operational-note">${escapeHTML(r.observacao)}</p>` : ""}
                </div>
            `).join("")}
        </div>` : renderConteudoAusente("Receitas ainda não detalhadas no plano.")}
    `);
}

function renderReferenciasExternas() {
    if (!window.chefIARecipeReferencesAvailable) return "";
    return renderSecao("Referencias externas de receitas", `
        <div class="reference-search-panel">
            <p>Consulta opcional ao Spoonacular. Exibe somente referências e autoria; não salva ingredientes ou instruções.</p>
            <div class="reference-search-row">
                <input id="recipeReferenceQuery" class="premium-input" maxlength="80" placeholder="Ex: brunch, risotto, barbecue">
                <button id="recipeReferenceButton" class="btn-secondary" type="button" onclick="buscarReferenciasExternas()">Buscar referências</button>
            </div>
            <div id="recipeReferenceResults" aria-live="polite"></div>
        </div>
    `);
}

function renderUtensiliosDetalhados(utensilios, pessoas) {
    const detalhados = utensilios.map(item => {
        if (typeof item === "object" && item !== null) return item;
        return {
            item: textoItem(item),
            quantidade: estimarQuantidadeUtensilio(textoItem(item), pessoas),
            uso: "apoio operacional"
        };
    });

    if (!detalhados.length) {
        return renderSecao("Utensilios e Estrutura", renderConteudoAusente("Utensílios extras não informados."));
    }

    return renderSecao("Utensilios e Estrutura", `
        <div class="utensil-table">
            <div class="utensil-head"><span>Item</span><span>Qtd.</span><span>Uso</span></div>
            ${detalhados.map(item => `
                <div class="utensil-row">
                    <span data-label="Item">${escapeHTML(item.item || item.nome || "Utensilio")}</span>
                    <strong data-label="Qtd.">${escapeHTML(item.quantidade || "Conferir")}</strong>
                    <small data-label="Uso">${escapeHTML(item.uso || item.observacao || "operacao")}</small>
                </div>
            `).join("")}
        </div>
    `);
}

function renderChecklist(checklist) {
    const grupos = [
        ["pre", "Pre-evento"],
        ["durante", "Durante"],
        ["pos", "Pos-evento"]
    ];
    const possuiItens = grupos.some(([key]) => normalizarArray(checklist[key]).length);
    return renderSecao("Checklist", possuiItens ? `
        <div class="check-grid">
            ${grupos.map(([key, label]) => {
                const itens = normalizarArray(checklist[key]);
                if (!itens.length) return "";
                return `
                    <div class="check-col">
                        <h4>${label}</h4>
                        ${itens.map(item => `<label><input type="checkbox"> ${escapeHTML(item)}</label>`).join("")}
                    </div>
                `;
            }).join("")}
        </div>
    ` : renderConteudoAusente("Checklist não informado."));
}

function renderOrcamento(orcamento) {
    const tiers = [
        ["economico", "Economico"],
        ["medio", "Medio"],
        ["sofisticado", "Sofisticado"]
    ];
    return renderSecao("Cenarios de Orcamento", `
        <div class="budget-grid">
            ${tiers.map(([key, label]) => {
                const tier = orcamento[key] || {};
                return `
                    <article class="budget-card ${key}">
                        <header><span>${label}</span><strong>${escapeHTML(tier.total || "A definir")}</strong></header>
                        ${Object.entries(tier).filter(([k]) => k !== "total").map(([k, v]) => `
                            <div><span>${escapeHTML(k)}</span><b>${escapeHTML(v)}</b></div>
                        `).join("")}
                    </article>
                `;
            }).join("")}
        </div>
    `);
}

function renderSecao(titulo, conteudo) {
    return `
        <section class="result-section">
            <div class="section-head"><h3>${escapeHTML(titulo)}</h3></div>
            ${conteudo}
        </section>
    `;
}

function renderConteudoAusente(mensagem) {
    return `<p class="empty-section">${escapeHTML(mensagem)}</p>`;
}

function renderListaCards(lista, classe) {
    return `<div class="info-grid">${normalizarArray(lista).map(item => `<div class="${classe}">${escapeHTML(textoItem(item))}</div>`).join("")}</div>`;
}

function renderListaTags(lista) {
    return `<div class="tag-list">${normalizarArray(lista).map(item => `<span>${escapeHTML(textoItem(item))}</span>`).join("")}</div>`;
}

function pill(valor) {
    return valor ? `<span>${escapeHTML(valor)}</span>` : "";
}
