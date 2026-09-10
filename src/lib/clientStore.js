/**
 * ============================================================
 *  ARMAZENAMENTO DO CLIENTE (localStorage)
 * ============================================================
 *  No projeto PHP, carrinho, favoritos, usuário logado e pedidos
 *  ficavam em sessão PHP + tabelas do banco (carrinho, favoritos,
 *  pedidos, usuarios). Sem banco ativo, estes dados passam a
 *  viver no navegador via localStorage.
 *
 *  ⚠️  IMPORTANTE: isto é uma solução PROVISÓRIA para a demo.
 *      Quando o Supabase for ativado (src/lib/supabase.js), estas
 *      funções devem ser substituídas por chamadas reais ao banco
 *      (a estrutura das tabelas está em database/schema.sql).
 *
 *  TODAS as funções são client-side ("use client" nos componentes).
 */

import { STORAGE_KEYS, FORMAS_PAGAMENTO, FRETE_GRATIS_ACIMA, FRETE_PADRAO } from '@/lib/config';

/* ------------------------------------------------------------------ *
 *  Helpers de leitura/escrita
 * ------------------------------------------------------------------ */

function ler(chave, padrao) {
  if (typeof window === 'undefined') return padrao;
  try {
    const raw = localStorage.getItem(chave);
    return raw ? JSON.parse(raw) : padrao;
  } catch {
    return padrao;
  }
}

function gravar(chave, valor) {
  if (typeof window === 'undefined') return;
  try {
    localStorage.setItem(chave, JSON.stringify(valor));
  } catch {
    // localStorage indisponível (modo privado etc.) — ignora.
  }
}

/* ------------------------------------------------------------------ *
 *  Usuário (simula auth/login e auth/registro do PHP)
 * ------------------------------------------------------------------ */

export function getUsuario() {
  return ler(STORAGE_KEYS.USUARIO, null);
}

export function setUsuario(usuario) {
  gravar(STORAGE_KEYS.USUARIO, usuario);
}

export function logout() {
  if (typeof window === 'undefined') return;
  localStorage.removeItem(STORAGE_KEYS.USUARIO);
}

/* ------------------------------------------------------------------ *
 *  Carrinho
 *  Formato: [{ livroId, quantidade }]
 * ------------------------------------------------------------------ */

export function getCarrinho() {
  return ler(STORAGE_KEYS.CARRINHO, []);
}

export function qtdCarrinho() {
  return getCarrinho().reduce((soma, i) => soma + i.quantidade, 0);
}

export function adicionarAoCarrinho(livroId, quantidade = 1) {
  const itens = getCarrinho();
  const existente = itens.find((i) => i.livroId === Number(livroId));
  if (existente) {
    existente.quantidade += quantidade;
  } else {
    itens.push({ livroId: Number(livroId), quantidade });
  }
  gravar(STORAGE_KEYS.CARRINHO, itens);
  return itens;
}

export function atualizarQtdCarrinho(livroId, quantidade) {
  const itens = getCarrinho();
  const item = itens.find((i) => i.livroId === Number(livroId));
  if (item) {
    if (quantidade <= 0) {
      return removerDoCarrinho(livroId);
    }
    item.quantidade = quantidade;
    gravar(STORAGE_KEYS.CARRINHO, itens);
  }
  return itens;
}

export function removerDoCarrinho(livroId) {
  const itens = getCarrinho().filter((i) => i.livroId !== Number(livroId));
  gravar(STORAGE_KEYS.CARRINHO, itens);
  return itens;
}

export function limparCarrinho() {
  gravar(STORAGE_KEYS.CARRINHO, []);
}

/**
 * Resumo financeiro do carrinho (subtotal, frete, total).
 * Replica a regra do checkout.php:
 *   frete = 0 quando subtotal >= FRETE_GRATIS_ACIMA, senão FRETE_PADRAO.
 */
export function resumoCarrinho(livros) {
  const itens = getCarrinho()
    .map((i) => {
      const livro = livros.find((l) => l.id === i.livroId);
      return livro ? { ...i, livro } : null;
    })
    .filter(Boolean);

  const subtotal = itens.reduce((s, i) => s + i.livro.preco * i.quantidade, 0);
  const frete = subtotal >= FRETE_GRATIS_ACIMA ? 0 : FRETE_PADRAO;
  return { itens, subtotal, frete, total: subtotal + frete };
}

/* ------------------------------------------------------------------ *
 *  Favoritos
 *  Formato: [livroId, ...]
 * ------------------------------------------------------------------ */

export function getFavoritos() {
  return ler(STORAGE_KEYS.FAVORITOS, []);
}

export function toggleFavorito(livroId) {
  const ids = getFavoritos();
  const id = Number(livroId);
  const indice = ids.indexOf(id);
  let adicionado;
  if (indice >= 0) {
    ids.splice(indice, 1);
    adicionado = false;
  } else {
    ids.push(id);
    adicionado = true;
  }
  gravar(STORAGE_KEYS.FAVORITOS, ids);
  return { ids, adicionado };
}

/* ------------------------------------------------------------------ *
 *  Pedidos (checkout + meus pedidos + rastreio)
 * ------------------------------------------------------------------ */

export function getPedidos() {
  return ler(STORAGE_KEYS.PEDIDOS, []);
}

/**
 * Cria um pedido (simula INSERT em pedidos/pedido_itens/rastreio).
 * @returns o pedido criado
 */
export function criarPedido({ usuario, itens, subtotal, frete, total, endereco, cidade, uf, forma }) {
  const codigo = 'CDL-' + new Date().getFullYear() + '-' +
    String(Math.floor(Math.random() * 9999) + 1).padStart(4, '0');

  const pedido = {
    id: Date.now(),
    codigo,
    usuarioId: usuario?.id || 0,
    usuarioNome: usuario?.nome || 'Convidado',
    total: Math.round(total * 100) / 100,
    subtotal: Math.round(subtotal * 100) / 100,
    frete: Math.round(frete * 100) / 100,
    formaPagamento: FORMAS_PAGAMENTO[forma] || forma,
    status: 'em_transito',
    endereco,
    cidade,
    uf,
    criadoEm: new Date().toISOString(),
    itens: itens.map((i) => ({ livroId: i.livro.id, preco: i.livro.preco, quantidade: i.quantidade })),
    rastreio: [
      { etapa: 'Pedido recebido', local: `${cidade} - ${uf}`, descricao: 'Pedido confirmado.', dataEvento: new Date().toISOString() },
      { etapa: 'Pagamento aprovado', local: `${cidade} - ${uf}`, descricao: 'Pagamento aprovado com sucesso.', dataEvento: new Date(Date.now() + 120000).toISOString() },
      { etapa: 'Em separação', local: 'Centro de Distribuição', descricao: 'Pedido separado e embalado.', dataEvento: new Date(Date.now() + 3600000).toISOString() },
    ],
  };

  const pedidos = getPedidos();
  pedidos.unshift(pedido);
  gravar(STORAGE_KEYS.PEDIDOS, pedidos);
  limparCarrinho();
  return pedido;
}

export function buscarPedidoPorCodigo(codigo) {
  return getPedidos().find((p) => p.codigo === codigo) || null;
}