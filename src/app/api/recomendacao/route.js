/**
 * API de recomendação (equivalente ao api/recomendacao.php do PHP).
 * Recebe { texto } e devolve livros recomendados com score e razões.
 */
import { recomendarLivrosIA } from '@/lib/iaEngine';

export async function POST(request) {
  let texto = '';
  try {
    const body = await request.json();
    texto = String(body.texto || '').trim();
  } catch {
    // corpo inválido -> texto vazio
  }

  if (texto === '') {
    return Response.json({ ok: false, msg: 'Descreva o que você procura.' }, { status: 400 });
  }

  // Favoritos do usuário seriam lidos da sessão/banco aqui
  const resultado = await recomendarLivrosIA(texto, [], 6);

  const livros = resultado.resultados.map((l) => ({
    id: l.id,
    titulo: l.titulo,
    autor: l.autor,
    preco: l.preco,
    avaliacao: l.avaliacao,
    capaCor: l.capaCor,
    _score: l._score ?? 0,
    _razoes: l._razoes ?? [],
  }));

  return Response.json({
    ok: true,
    metodo: resultado.metodo,
    perfil: resultado.perfil,
    consulta: resultado.consulta,
    livros,
  });
}