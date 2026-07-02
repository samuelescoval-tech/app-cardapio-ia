/* ==========================================================================
   CHEF IA STUDIO | UTILS
   TAG: helpers, seguranca-html, calculos-fallback
   --------------------------------------------------------------------------
   Responsabilidade: helpers pequenos usados por prompt/render/app.
   ========================================================================== */

function normalizarArray(valor) {
    if (Array.isArray(valor)) return valor;
    if (!valor) return [];
    return [valor];
}

function calcularServicoMesa(pessoas) {
    const total = Math.max(1, numeroSeguro(pessoas));
    const reserva = Math.ceil(total * 1.15);
    const copos = Math.ceil(total * 1.5);
    const guardanapos = Math.ceil(total * 4);
    const travessas = Math.max(2, Math.ceil(total / 8));
    const pegadores = Math.max(2, Math.ceil(travessas * 0.8));
    const bandejas = Math.max(2, Math.ceil(total / 10));

    return {
        talheres: [
            { item: "Garfos de mesa", quantidade: `${reserva} un`, calculo: "1 por pessoa + 15% reserva" },
            { item: "Facas de mesa", quantidade: `${reserva} un`, calculo: "1 por pessoa + 15% reserva" },
            { item: "Colheres de sobremesa", quantidade: `${reserva} un`, calculo: "1 por pessoa + 15% reserva" }
        ],
        loucas: [
            { item: "Pratos rasos", quantidade: `${reserva} un`, calculo: "1 por pessoa + 15% reserva" },
            { item: "Pratos de sobremesa", quantidade: `${reserva} un`, calculo: "1 por pessoa + 15% reserva" }
        ],
        copos: [
            { item: "Copos de agua/suco", quantidade: `${copos} un`, calculo: "1,5 por pessoa" },
            { item: "Jarras ou suqueiras", quantidade: `${Math.max(2, Math.ceil(total / 12))} un`, calculo: "1 a cada 12 pessoas" }
        ],
        descartaveis: [
            { item: "Guardanapos", quantidade: `${guardanapos} un`, calculo: "4 por pessoa" },
            { item: "Sacos de lixo reforcados", quantidade: `${Math.max(3, Math.ceil(total / 12))} un`, calculo: "limpeza e descarte" }
        ],
        apoio_cozinha: [
            { item: "Travessas/refratarios", quantidade: `${travessas} un`, calculo: "1 a cada 8 pessoas" },
            { item: "Pegadores/colheres de servir", quantidade: `${pegadores} un`, calculo: "1 por travessa principal" },
            { item: "Bandejas de reposicao", quantidade: `${bandejas} un`, calculo: "1 a cada 10 pessoas" }
        ],
        observacao: "Quantidades com margem operacional para perda, reposicao e troca durante o evento."
    };
}

function estimarQuantidadeUtensilio(nome, pessoas) {
    const total = Math.max(1, numeroSeguro(pessoas));
    const texto = String(nome || "").toLowerCase();
    if (/guardanapo/.test(texto)) return `${Math.ceil(total * 4)} un`;
    if (/garfo|faca|colher|prato/.test(texto)) return `${Math.ceil(total * 1.15)} un`;
    if (/copo|ta[cç]a/.test(texto)) return `${Math.ceil(total * 1.5)} un`;
    if (/travessa|refrat/.test(texto)) return `${Math.max(2, Math.ceil(total / 8))} un`;
    if (/pegador|concha|esp[aá]tula/.test(texto)) return `${Math.max(2, Math.ceil(total / 10))} un`;
    if (/bandeja/.test(texto)) return `${Math.max(2, Math.ceil(total / 10))} un`;
    return "Conferir";
}

function numeroSeguro(valor) {
    const n = parseInt(String(valor || "").replace(/\D/g, ""), 10);
    return Number.isFinite(n) ? n : 0;
}

function textoItem(item) {
    if (typeof item === "string") return item;
    if (!item || typeof item !== "object") return "";
    return item.nome || item.item || item.atividade || item.descricao || JSON.stringify(item);
}

function escapeHTML(value) {
    return String(value ?? "")
        .replace(/&/g, "&amp;")
        .replace(/</g, "&lt;")
        .replace(/>/g, "&gt;")
        .replace(/"/g, "&quot;")
        .replace(/'/g, "&#039;");
}
