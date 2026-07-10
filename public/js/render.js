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
            ${dados.orcamento && precificacaoEhConfiavel(dados.precificacao) ? renderOrcamento(dados.orcamento) : ""}
            ${dados.resumo_chef ? renderSecao("Resumo do Chef", `<div class="chef-summary">${escapeHTML(dados.resumo_chef)}</div>`) : ""}
        </div>
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

    secao("Dados do evento");
    lista([
        `Tipo: ${evento?.tipo || premissas.tipo || "Nao informado"}`,
        `Convidados: ${pessoas || evento?.pessoas || premissas.pessoas || "Nao informado"}`,
        premissas.criancas > 0 ? `Publico: ${premissas.adultos} adultos e ${premissas.criancas} criancas` : "",
        `Localidade: ${localidadePrecificacao(precificacao)}`,
        `Data do evento: ${evento?.dataEvento || precificacao?.data_evento || "Nao informada"}`,
        `Duracao: ${evento?.duracao || premissas.duracao_horas || motor.duracao || "Nao informado"}`,
        `Refeicao: ${evento?.refeicao || premissas.refeicao || "Nao informado"}`,
        `Estilo: ${evento?.estilo || premissas.estilo || "Nao informado"}`,
        `Tema: ${evento?.tema || premissas.tema || "Nao informado"}`,
        `Bebidas: ${evento?.alcool || premissas.alcool || "Nao informado"}`,
        `Orcamento desejado: ${evento?.orcamentoBase || premissas.orcamento_base || "Nao informado"}`,
        `Restricoes: ${evento?.restricoes || "Nenhuma"}`,
        evento?.obs ? `Observacoes do cliente: ${evento.obs}` : ""
    ].filter(Boolean));

    secao("Motor logistico");
    escrever("Alimentacao", { estilo: "bold" });
    listaOuVazio(alimentacao);
    escrever("Bebidas", { estilo: "bold" });
    listaOuVazio(bebidas);
    escrever("Equipe", { estilo: "bold" });
    listaOuVazio(staff);

    secao("Cardapio");
    listaOuVazio(cardapio, "Cardapio nao informado pela IA.");

    secao("Receitas e preparo");
    listaOuVazio(receitas, "Receitas ainda nao detalhadas no plano.");

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

    secao("Cronograma");
    listaOuVazio(cronograma, "Cronograma nao informado no plano.");

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

    const nome = item.nome || item.item || item.funcao || item.atividade || item.tipo || "Item";
    const quantidade = item.quantidade ? ` - ${item.quantidade}` : "";
    const detalhes = [
        item.categoria,
        item.setor,
        item.prioridade ? `prioridade ${item.prioridade}` : "",
        item.capacidade,
        item.descricao,
        item.observacao,
        item.preparo,
        item.calculo,
        item.uso,
        item.pros ? `pros: ${item.pros}` : "",
        item.contras ? `contras: ${item.contras}` : "",
        item.custo ? `custo: ${item.custo}` : "",
        item.tempo,
        item.rendimento
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
    const garcons = staff.find(s => /gar[cç]om|servi/i.test(s.funcao || s.item || s.nome || ""));
    const precoConfiavel = precificacaoEhConfiavel(dados.precificacao || motor.precificacao);
    const estimativa = precoConfiavel ? (motor.estimativa_total || dados.orcamento?.medio?.total || "A cotar") : "A cotar";

    const cards = [
        ["Convidados", total || pessoas, "base do calculo"],
        ["Pratos", cardapio.length || "-", "itens do cardapio"],
        ["Compras", compras.length || "-", "itens consolidados"],
        ["Equipe", garcons?.quantidade || staff.length || "-", "servico recomendado"],
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
