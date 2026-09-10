/**
 * API de favoritos (equivalente ao api/favorito.php do PHP).
 *
 * ⚠️  ESQUELETO DOCUMENTADO — NÃO PERSISTE NADA.
 *     Na demo, favoritos vivem no localStorage (src/lib/clientStore.js).
 *     Com Supabase ativo, use a tabela `favoritos`:
 *
 *     const { data, error } = await supabase.from('favoritos').delete()
 *       .eq('usuario_id', usuarioId).eq('livro_id', livroId);
 *     if (data.length === 0) {
 *       await supabase.from('favoritos').insert({ usuario_id, livro_id });
 *     }
 */
import { getSupabase } from '@/lib/supabase';

export async function POST(request) {
  const supabase = getSupabase(); // null em modo demo

  if (!supabase) {
    return Response.json({
      ok: false,
      msg: 'Banco desativado (modo demo) — favoritos são gerenciados no navegador.',
      demo: true,
    });
  }

  let params;
  try {
    params = await request.json();
  } catch {
    return Response.json({ ok: false, msg: 'Corpo inválido.' }, { status: 400 });
  }

  const livroId = Number(params.livro_id || 0);
  if (livroId <= 0) {
    return Response.json({ ok: false, msg: 'Livro inválido.' }, { status: 400 });
  }

  try {
    // const { error } = await supabase.from('favoritos').delete()
    //   .eq('usuario_id', usuarioId).eq('livro_id', livroId);
    // if (data.length === 0) {
    //   await supabase.from('favoritos').insert({ usuario_id: usuarioId, livro_id: livroId });
    //   return Response.json({ ok: true, fav: true, msg: 'Adicionado aos favoritos.' });
    // }
    // return Response.json({ ok: true, fav: false, msg: 'Removido dos favoritos.' });
    return Response.json({ ok: true, fav: false, msg: 'OK (implementar com Supabase).' });
  } catch (erro) {
    return Response.json({ ok: false, msg: 'Erro no servidor.' }, { status: 500 });
  }
}