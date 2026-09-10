/**
 * API do carrinho (equivalente ao api/carrinho.php do PHP).
 *
 * ⚠️  ESQUELETO DOCUMENTADO — NÃO PERSISTE NADA.
 *     O carrinho da demo vive no localStorage (src/lib/clientStore.js).
 *     Quando o Supabase for ativado, implemente aqui as ações
 *     usando a tabela `carrinho` (ver database/schema.sql):
 *
 *     const supabase = getSupabase();
 *     // add:
 *     const { data, error } = await supabase.from('carrinho').insert({
 *       usuario_id, livro_id, quantidade
 *     });
 *     // update:
 *     await supabase.from('carrinho').update({ quantidade }).eq('id', item);
 *     // remove:
 *     await supabase.from('carrinho').delete().eq('id', item);
 */
import { getSupabase } from '@/lib/supabase';

export async function POST(request) {
  const supabase = getSupabase(); // null em modo demo

  if (!supabase) {
    // Sem banco: a interface usa localStorage; respondemos informativo.
    return Response.json({
      ok: false,
      msg: 'Banco desativado (modo demo) — o carrinho é gerenciado no navegador.',
      demo: true,
    }, { status: 200 });
  }

  let params;
  try {
    params = await request.json();
  } catch {
    return Response.json({ ok: false, msg: 'Corpo inválido.' }, { status: 400 });
  }

  const acao = String(params.acao || '');
  const livroId = Number(params.livro_id || 0);
  const item = Number(params.item || 0);
  const quantidade = Math.max(1, Number(params.quantidade || 1));

  try {
    switch (acao) {
      case 'add': {
        // const { error } = await supabase.from('carrinho').upsert({...});
        break;
      }
      case 'update': {
        // await supabase.from('carrinho').update({ quantidade }).eq('id', item);
        break;
      }
      case 'remove': {
        // await supabase.from('carrinho').delete().eq('id', item);
        break;
      }
      case 'limpar': {
        // await supabase.from('carrinho').delete().eq('usuario_id', usuarioId);
        break;
      }
      default:
        return Response.json({ ok: false, msg: 'Ação inválida.' }, { status: 400 });
    }
    return Response.json({ ok: true, msg: 'OK (implementar com Supabase).' });
  } catch (erro) {
    return Response.json({ ok: false, msg: 'Erro no servidor.' }, { status: 500 });
  }
}