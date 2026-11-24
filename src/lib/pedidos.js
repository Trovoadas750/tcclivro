/**
 * ============================================================
 *  PEDIDOS — finalizar compra e histórico (Supabase)
 * ============================================================
 *  Regras (BDcontexto.md, regras 17 a 22):
 *   - Finalizar compra exige login e é feito SÓ pela função
 *     finalizar_pedido() (RPC). O front nunca insere em `pedidos`
 *     nem em `itens_pedido` e nunca envia preço ou total.
 *   - O banco calcula preço e total, valida estoque, livro ativo e
 *     "livro do próprio comprador", baixa o estoque e cria o pedido
 *     com status 'pendente'. Tudo ou nada.
 *   - No histórico, usar itens_pedido.titulo_livro e foto_url (dados do
 *     momento da compra), nunca o embed de `livros`.
 */

/** Colunas do pedido + itens para o histórico (sem livros(...)). */
export const COLUNAS_PEDIDO =
  'id, status, total, created_at, itens_pedido(id, quantidade, preco_unitario, titulo_livro, foto_url, livro_id)';

export const ROTULOS_STATUS = {
  pendente: 'Pendente',
  pago: 'Pago',
  enviado: 'Enviado',
  entregue: 'Entregue',
  cancelado: 'Cancelado',
};

/** Número curto e legível do pedido (8 primeiros caracteres do uuid). */
export function numeroPedido(id) {
  return `#${String(id || '').slice(0, 8).toUpperCase()}`;
}

/**
 * Finaliza a compra com os itens do carrinho.
 * @param {{ livro_id: string, quantidade: number }[]} itens
 * @returns {Promise<{ pedidoId: string } | { erro: string }>}
 */
export async function finalizarPedido(supabase, itens) {
  // Só livro_id e quantidade: o banco busca o preço.
  const pItens = itens.map(({ livro_id, quantidade }) => ({ livro_id, quantidade }));
  const { data, error } = await supabase.rpc('finalizar_pedido', { p_itens: pItens });

  if (error) {
    console.error('Erro em finalizar_pedido:', error.code, error.message);
    // Regras de negócio (estoque, livro inativo, próprio livro...) vêm com
    // code P0001 e mensagem pronta em português.
    if (error.code === 'P0001') return { erro: error.message };
    return { erro: 'Não foi possível finalizar a compra. Tente de novo.' };
  }
  if (!data) return { erro: 'Não foi possível finalizar a compra. Tente de novo.' };
  return { pedidoId: data };
}

/** Um pedido do usuário logado (a RLS só devolve os próprios). null se não achar. */
export async function buscarPedido(supabase, id) {
  const { data, error } = await supabase.from('pedidos').select(COLUNAS_PEDIDO).eq('id', id).maybeSingle();
  if (error) {
    console.error('Erro ao buscar pedido:', error.message);
    return null;
  }
  return data;
}
