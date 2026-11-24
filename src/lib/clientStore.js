/**
 * ============================================================
 *  CARRINHO NO NAVEGADOR (localStorage)
 * ============================================================
 *  Regras (BDcontexto.md, regra 16):
 *   - Guarda SÓ { livro_id, quantidade }. Preço, estoque, título e
 *     foto são sempre lidos do banco na hora de exibir.
 *   - Qualquer pessoa, mesmo deslogada, pode adicionar ao carrinho.
 *   - Itens cujo livro_id não é uuid (sobras do catálogo de
 *     demonstração antigo) são descartados ao ler.
 *
 *  Favoritos e pedidos NÃO ficam aqui: vivem no banco
 *  (src/lib/favoritos.js e a função finalizar_pedido()).
 *
 *  Todas as funções são client-side e toleram localStorage
 *  indisponível (modo privado etc.).
 */

import { STORAGE_KEYS } from '@/lib/config';
import { ehUuid } from '@/lib/vendedor';

/** Avisa cabeçalho e carrinho (nesta aba) que o carrinho mudou. */
function avisarMudanca() {
  if (typeof window !== 'undefined') window.dispatchEvent(new Event('carrinho-atualizado'));
}

function salvar(itens) {
  if (typeof window === 'undefined') return;
  try {
    localStorage.setItem(STORAGE_KEYS.CARRINHO, JSON.stringify(itens));
  } catch {
    // localStorage indisponível — ignora.
  }
  avisarMudanca();
}

/** Lê o carrinho já limpo: [{ livro_id: uuid, quantidade: inteiro > 0 }]. */
export function getCarrinho() {
  if (typeof window === 'undefined') return [];
  let bruto;
  try {
    bruto = JSON.parse(localStorage.getItem(STORAGE_KEYS.CARRINHO) || '[]');
  } catch {
    return [];
  }
  if (!Array.isArray(bruto)) return [];

  const itens = [];
  for (const item of bruto) {
    const quantidade = Math.floor(Number(item?.quantidade));
    if (!ehUuid(item?.livro_id) || !(quantidade > 0)) continue;
    const existente = itens.find((i) => i.livro_id === item.livro_id);
    if (existente) existente.quantidade += quantidade;
    else itens.push({ livro_id: item.livro_id, quantidade });
  }

  // Regrava se havia lixo (ex.: { livroId: 3 } do catálogo antigo).
  if (itens.length !== bruto.length) {
    try {
      localStorage.setItem(STORAGE_KEYS.CARRINHO, JSON.stringify(itens));
    } catch {}
  }
  return itens;
}

/** Total de unidades no carrinho (badge do cabeçalho). */
export function qtdCarrinho() {
  return getCarrinho().reduce((soma, i) => soma + i.quantidade, 0);
}

/** Quantidade atual de um livro no carrinho (0 se não estiver). */
export function qtdNoCarrinho(livroId) {
  return getCarrinho().find((i) => i.livro_id === livroId)?.quantidade || 0;
}

export function adicionarAoCarrinho(livroId, quantidade = 1) {
  if (!ehUuid(livroId) || !(quantidade > 0)) return getCarrinho();
  const itens = getCarrinho();
  const existente = itens.find((i) => i.livro_id === livroId);
  if (existente) existente.quantidade += quantidade;
  else itens.push({ livro_id: livroId, quantidade });
  salvar(itens);
  return itens;
}

/** Define a quantidade de um item (0 ou menos remove). */
export function atualizarQtdCarrinho(livroId, quantidade) {
  const itens = getCarrinho()
    .map((i) => (i.livro_id === livroId ? { ...i, quantidade: Math.floor(quantidade) } : i))
    .filter((i) => i.quantidade > 0);
  salvar(itens);
  return itens;
}

export function removerDoCarrinho(livroId) {
  const itens = getCarrinho().filter((i) => i.livro_id !== livroId);
  salvar(itens);
  return itens;
}

export function limparCarrinho() {
  salvar([]);
}
