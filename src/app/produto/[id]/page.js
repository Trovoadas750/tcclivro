/**
 * Rota antiga do catálogo de demonstração (/produto/[id]).
 * Todos os livros agora ficam em /livro/[id]: links antigos com uuid
 * são redirecionados; ids numéricos (do catálogo antigo) vão para o catálogo.
 */
import { permanentRedirect, redirect } from 'next/navigation';
import { ehUuid } from '@/lib/vendedor';

export default async function ProdutoAntigo({ params }) {
  const { id } = await params;
  if (ehUuid(id)) permanentRedirect(`/livro/${id}`);
  redirect('/busca');
}
