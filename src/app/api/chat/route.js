/**
 * API do chatbot (equivalente ao api/chat.php do PHP).
 * Recebe { mensagem } e devolve a resposta da BibliIA
 * (motor em src/lib/iaEngine.js).
 */
import { responderChatIA } from '@/lib/iaEngine';
import { preco } from '@/lib/format';

export async function POST(request) {
  let mensagem = '';
  try {
    const body = await request.json();
    mensagem = String(body.mensagem || '').trim();
  } catch {
    // corpo inválido -> mensagem vazia
  }

  if (mensagem === '') {
    return Response.json({ ok: false, msg: 'Mensagem vazia.' }, { status: 400 });
  }

  // Favoritos do usuário seriam lidos da sessão/banco aqui
  const resposta = await responderChatIA(mensagem, []);

  // Formata os livros como o api/chat.php fazia
  const livros = resposta.livros.map((l) => ({
    id: l.id,
    titulo: l.titulo,
    autor: l.autor,
    preco: l.preco, // mantém número; o front usa preco()
    avaliacao: l.avaliacao,
    _score: l._score ?? 0,
    _razoes: l._razoes ?? [],
  }));

  return Response.json({
    ok: true,
    texto: resposta.texto,
    metodo: resposta.metodo,
    livros,
  });
}