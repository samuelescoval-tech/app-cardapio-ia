/* ==========================================================================
   CHEF IA STUDIO | RENDER
   TAG: ui-render, resultado, componentes-visuais
   --------------------------------------------------------------------------
   Responsabilidade: transformar o JSON normalizado da IA em HTML.
   ========================================================================== */

function exibirResultadoLuxo(dados, pessoas) {
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

    area.innerHTML = `
        <div class="resultado-premium" style="animation: fadeInUp 0.8s ease;">
            <div class="result-header">
                <div>
                    <h2>Planejamento para ${escapeHTML(pessoas)} pessoas</h2>
                    <p>Cardapio, logistica, compras, equipe, roteiro e orcamento em um unico plano.</p>
                </div>
                <button class="btn-print" onclick="window.print()">Imprimir PDF</button>
            </div>

            ${renderResumoExecutivo(dados, pessoas, cardapio, compras)}
            ${renderMotorLogistica(dados.motor_logistica)}
            ${renderServicoMesa(servicoMesa)}
            ${renderCardapio(cardapio)}
            ${renderCompras(compras)}
            ${locais.length ? renderLocais(locais) : ""}
            ${layout.length ? renderSecao("Layout", renderListaCards(layout, "layout-card")) : ""}
            ${dados.decoracao ? renderDecoracao(dados.decoracao) : ""}
            ${cronograma.length ? renderCronograma(cronograma) : ""}
            ${equipeObs.length ? renderSecao("Observacoes de Equipe", renderListaCards(equipeObs, "note-card")) : ""}
            ${receitas.length ? renderReceitas(receitas) : ""}
            ${utensilios.length ? renderUtensiliosDetalhados(utensilios, pessoas) : ""}
            ${entretenimento.length ? renderSecao("Entretenimento", renderListaCards(entretenimento, "note-card")) : ""}
            ${lembrancinhas.length ? renderSecao("Lembrancinhas", renderListaCards(lembrancinhas, "note-card")) : ""}
            ${dados.checklist ? renderChecklist(dados.checklist) : ""}
            ${dados.orcamento ? renderOrcamento(dados.orcamento) : ""}
            ${dados.resumo_chef ? renderSecao("Resumo do Chef", `<div class="chef-summary">${escapeHTML(dados.resumo_chef)}</div>`) : ""}
        </div>
    `;
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
            <div class="finance-strip">
                <div><span>Custo / Pessoa</span><strong>${escapeHTML(motor.custo_adulto || "A definir")}</strong></div>
                <div><span>Estimativa</span><strong>${escapeHTML(motor.estimativa_total || "A definir")}</strong></div>
            </div>
        </section>
    `;
}

function renderResumoExecutivo(dados, pessoas, cardapio, compras) {
    const total = numeroSeguro(pessoas);
    const motor = dados.motor_logistica || {};
    const staff = normalizarArray(motor.staff);
    const garcons = staff.find(s => /gar[cç]om|servi/i.test(s.funcao || s.item || s.nome || ""));
    const estimativa = motor.estimativa_total || dados.orcamento?.medio?.total || "A definir";

    const cards = [
        ["Convidados", total || pessoas, "base do calculo"],
        ["Pratos", cardapio.length || "-", "itens do cardapio"],
        ["Compras", compras.length || "-", "itens consolidados"],
        ["Equipe", garcons?.quantidade || staff.length || "-", "servico recomendado"],
        ["Orcamento", estimativa, "estimativa com margem"]
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
        <section class="result-section">
            <div class="section-head"><h3>Selecao de Pratos</h3><span>${cardapio.length} itens</span></div>
            <div class="dish-grid">
                ${cardapio.map((p, i) => {
                    const nome = typeof p === "string" ? p : p.nome;
                    const categoria = typeof p === "string" ? "Cardapio" : p.categoria;
                    const desc = typeof p === "string" ? "" : p.descricao;
                    const emoji = typeof p === "string" ? "🍽️" : (p.emoji || "🍽️");
                    const qtd = typeof p === "string" ? "" : p.quantidade;
                    return `
                        <article class="dish-card-rich">
                            <div class="dish-visual g${i % 6}">${escapeHTML(emoji)}</div>
                            <div class="dish-body">
                                <span>${escapeHTML(categoria || "Cardapio")}</span>
                                <h4>${escapeHTML(nome || "Prato sugerido")}</h4>
                                ${desc ? `<p>${escapeHTML(desc)}</p>` : ""}
                                ${qtd ? `<strong>${escapeHTML(qtd)}</strong>` : ""}
                            </div>
                        </article>
                    `;
                }).join("")}
            </div>
        </section>
    `;
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
                                <span>${escapeHTML(item.item || "Item")}</span>
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
            <div class="place-grid">
                ${locais.map(local => `
                    <article class="place-card ${local.recomendado ? "recommended" : ""}">
                        ${local.recomendado ? `<span class="badge">Recomendado</span>` : ""}
                        <h4>${escapeHTML(local.tipo || "Local sugerido")}</h4>
                        <p>${escapeHTML(local.capacidade || "")}</p>
                        <p class="ok">${escapeHTML(local.pros || "")}</p>
                        <p class="warn">${escapeHTML(local.contras || "")}</p>
                        <strong>${escapeHTML(local.custo || "")}</strong>
                    </article>
                `).join("")}
            </div>
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
    `);
}

function renderCronograma(cronograma) {
    return `
        <section class="result-section">
            <div class="section-head"><h3>Cronograma</h3></div>
            <div class="timeline">
                ${cronograma.map(item => `
                    <div class="timeline-item">
                        <span>${escapeHTML(item.hora || "")}</span>
                        <div>
                            <h4>${escapeHTML(item.atividade || "Atividade")}</h4>
                            <p>${escapeHTML(item.descricao || "")}</p>
                        </div>
                    </div>
                `).join("")}
            </div>
        </section>
    `;
}

function renderReceitas(receitas) {
    return renderSecao("Receitas e Preparo", `
        <div class="recipe-grid">
            ${receitas.map(r => typeof r === "string" ? `
                <div class="recipe-card"><p>${escapeHTML(r)}</p></div>
            ` : `
                <div class="recipe-card">
                    <h4>${escapeHTML(r.nome || "Receita")}</h4>
                    <p>${escapeHTML(r.preparo || "")}</p>
                    <small>${escapeHTML([r.tempo, r.rendimento].filter(Boolean).join(" · "))}</small>
                </div>
            `).join("")}
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

    return renderSecao("Utensilios e Estrutura", `
        <div class="utensil-table">
            <div class="utensil-head"><span>Item</span><span>Qtd.</span><span>Uso</span></div>
            ${detalhados.map(item => `
                <div class="utensil-row">
                    <span>${escapeHTML(item.item || item.nome || "Utensilio")}</span>
                    <strong>${escapeHTML(item.quantidade || "Conferir")}</strong>
                    <small>${escapeHTML(item.uso || item.observacao || "operacao")}</small>
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
    return renderSecao("Checklist", `
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
    `);
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

function renderListaCards(lista, classe) {
    return `<div class="info-grid">${normalizarArray(lista).map(item => `<div class="${classe}">${escapeHTML(textoItem(item))}</div>`).join("")}</div>`;
}

function renderListaTags(lista) {
    return `<div class="tag-list">${normalizarArray(lista).map(item => `<span>${escapeHTML(textoItem(item))}</span>`).join("")}</div>`;
}

function pill(valor) {
    return valor ? `<span>${escapeHTML(valor)}</span>` : "";
}
