/* ==========================================================================
   KARAMU | ESTIMATIVA DE CUSTO
   TAG: precificacao-usuario, catalogo-regional
   --------------------------------------------------------------------------
   Responsabilidade: cruzar a lista_compras gerada pela IA com os precos
   proprios que o usuario cadastrou (fornecedores.service / precos.service)
   para estimar um custo local, sem depender de catalogo externo.
   ========================================================================== */

const { normalizarTexto } = require("../../utils/text-normalize");

const FAMILIAS_UNIDADE = {
  g: { familia: "peso", fator: 1 },
  gr: { familia: "peso", fator: 1 },
  grama: { familia: "peso", fator: 1 },
  gramas: { familia: "peso", fator: 1 },
  kg: { familia: "peso", fator: 1000 },
  kilo: { familia: "peso", fator: 1000 },
  kilos: { familia: "peso", fator: 1000 },
  mg: { familia: "peso", fator: 0.001 },
  ml: { familia: "volume", fator: 1 },
  l: { familia: "volume", fator: 1000 },
  lt: { familia: "volume", fator: 1000 },
  litro: { familia: "volume", fator: 1000 },
  litros: { familia: "volume", fator: 1000 },
  un: { familia: "unidade", fator: 1 },
  und: { familia: "unidade", fator: 1 },
  unid: { familia: "unidade", fator: 1 },
  unidade: { familia: "unidade", fator: 1 },
  unidades: { familia: "unidade", fator: 1 },
  pc: { familia: "unidade", fator: 1 },
  peca: { familia: "unidade", fator: 1 },
  pecas: { familia: "unidade", fator: 1 },
  maco: { familia: "maco", fator: 1 },
  macos: { familia: "maco", fator: 1 },
  pacote: { familia: "pacote", fator: 1 },
  pacotes: { familia: "pacote", fator: 1 },
  pct: { familia: "pacote", fator: 1 },
  cx: { familia: "caixa", fator: 1 },
  caixa: { familia: "caixa", fator: 1 },
  caixas: { familia: "caixa", fator: 1 }
};

function normalizarUnidade(texto) {
  const chave = normalizarTexto(texto).replace(/[^a-z]/g, "");
  return FAMILIAS_UNIDADE[chave] || null;
}

function extrairQuantidade(texto) {
  const bruto = String(texto || "");
  const match = bruto.match(/(-?\d+(?:[.,]\d+)?)\s*([a-zçãõáéíóúâêôA-ZÇÃÕÁÉÍÓÚÂÊÔ%]*)/);
  if (!match) return null;
  const valor = Number.parseFloat(match[1].replace(",", "."));
  if (!Number.isFinite(valor) || valor <= 0) return null;
  const unidade = normalizarUnidade(match[2]);
  return { valor, unidade };
}

function construirIndiceCatalogo(catalogoUsuario) {
  const indice = [];
  for (const entrada of catalogoUsuario || []) {
    const nomeNormalizado = normalizarTexto(entrada.item);
    if (!nomeNormalizado) continue;
    indice.push({ ...entrada, nomeNormalizado });
  }
  return indice;
}

// Substring so aproxima nome de produtos diferentes que compartilham uma
// palavra (ex.: catalogo "Frango" casaria por substring com a compra "Frango
// a Passarinho", que e um produto/preco bem diferente). Por isso, a
// correspondencia por substring nunca e tratada como confiavel quanto a
// exata: entra no total separado "aproximado" em vez do total principal.
// Entre varios candidatos aproximados, fica com o termo mais longo (mais
// especifico) em vez do primeiro encontrado, para reduzir falso-positivo
// tipo "Frango" ganhando de "Frango a Passarinho" so por ordem alfabetica.
function encontrarCorrespondencia(nomeCompraNormalizado, indiceCatalogo) {
  let aproximada = null;
  for (const entrada of indiceCatalogo) {
    if (entrada.nomeNormalizado === nomeCompraNormalizado) return { entrada, exata: true };
    if (
      entrada.nomeNormalizado.length > 2 &&
      (nomeCompraNormalizado.includes(entrada.nomeNormalizado) || entrada.nomeNormalizado.includes(nomeCompraNormalizado)) &&
      (!aproximada || entrada.nomeNormalizado.length > aproximada.nomeNormalizado.length)
    ) {
      aproximada = entrada;
    }
  }
  return aproximada ? { entrada: aproximada, exata: false } : null;
}

// Sempre produz exatamente um item de saida por entrada de listaCompras, na
// mesma ordem — quem consome o resultado (render.js) pode parear por indice
// em vez de por nome, evitando colisao quando dois itens da lista de
// compras tem o mesmo nome (ex.: "Tomate" usado em dois pratos).
function calcularEstimativaCusto(listaCompras, catalogoUsuario) {
  const indiceCatalogo = construirIndiceCatalogo(catalogoUsuario);
  const itens = [];
  let totalEstimado = 0;
  let totalAproximado = 0;
  let itensComPreco = 0;
  let itensAproximados = 0;

  for (const compra of listaCompras || []) {
    const nomeCompra = typeof compra === "string" ? compra : compra?.item;
    const nomeNormalizado = normalizarTexto(nomeCompra);
    if (!nomeNormalizado) {
      itens.push({ item: nomeCompra || "", correspondido: false });
      continue;
    }

    const correspondencia = encontrarCorrespondencia(nomeNormalizado, indiceCatalogo);
    if (!correspondencia) {
      itens.push({ item: nomeCompra, correspondido: false });
      continue;
    }

    const { entrada, exata } = correspondencia;
    const unidadePreco = normalizarUnidade(entrada.unidade);
    const quantidade = typeof compra === "string" ? null : extrairQuantidade(compra.quantidade);

    if (!unidadePreco || !quantidade || !quantidade.unidade || quantidade.unidade.familia !== unidadePreco.familia) {
      itens.push({
        item: nomeCompra,
        correspondido: true,
        correspondencia_exata: exata,
        preco_unitario: entrada.preco,
        unidade_preco: entrada.unidade,
        fornecedor: entrada.fornecedor || null,
        subtotal: null,
        motivo_sem_subtotal: "unidade nao compativel para conversao automatica"
      });
      continue;
    }

    const quantidadeConvertida = (quantidade.valor * quantidade.unidade.fator) / unidadePreco.fator;
    const subtotal = Number((quantidadeConvertida * entrada.preco).toFixed(2));
    if (exata) {
      totalEstimado += subtotal;
      itensComPreco += 1;
    } else {
      totalAproximado += subtotal;
      itensAproximados += 1;
    }
    itens.push({
      item: nomeCompra,
      correspondido: true,
      correspondencia_exata: exata,
      preco_unitario: entrada.preco,
      unidade_preco: entrada.unidade,
      fornecedor: entrada.fornecedor || null,
      subtotal
    });
  }

  return {
    itens,
    total_estimado: Number(totalEstimado.toFixed(2)),
    total_aproximado: Number(totalAproximado.toFixed(2)),
    itens_com_preco: itensComPreco,
    itens_aproximados: itensAproximados,
    total_itens: itens.length
  };
}

module.exports = { calcularEstimativaCusto, extrairQuantidade, normalizarUnidade };
