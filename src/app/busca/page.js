/**
 * Página de busca/catálogo (equivalente ao busca.php do PHP).
 * Componente SERVER: lê searchParams (q, categoria, ordenar) e
 * chama buscarLivros() do repositório.
 * ATENÇÃO: no Next.js 16, searchParams é uma Promise (await).
 */
import Link from 'next/link';
import Icone from '@/components/Icone';
import LivroCard from '@/components/LivroCard';
import { buscarLivros, buscarCategorias } from '@/lib/repositories/livroRepository';

export const metadata = { title: 'Busca de livros' };

export default async function Busca({ searchParams }) {
  // No Next.js 16 os parâmetros de busca chegam como Promise
  const { q = '', categoria = 0, ordenar = 'relevancia' } = await searchParams;
  const termo = String(q || '').trim();
  const categoriaId = Number(categoria || 0);

  const [livros, categorias] = await Promise.all([
    buscarLivros({ q: termo, categoriaId, ordenar: String(ordenar) }),
    buscarCategorias(),
  ]);

  const titulo = termo !== '' ? `Busca: ${termo}` : 'Catálogo de livros';

  return (
    <div style={{ display: 'flex', gap: 24, flexWrap: 'wrap', marginTop: 28 }}>
      {/* Filtros laterais */}
      <aside style={{ flex: '0 0 230px', minWidth: 200 }}>
        <div className="painel" style={{ position: 'sticky', top: 100 }}>
          <h3 style={{ marginBottom: 12 }}>Filtrar</h3>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 8, fontSize: 14 }}>
            <Link href={`/busca?q=${encodeURIComponent(termo)}&categoria=${categoriaId}&ordenar=relevancia`}>
              <Icone nome="fogo" alt="Mais vendidos" tam={15} /> Mais vendidos
            </Link>
            <Link href={`/busca?q=${encodeURIComponent(termo)}&categoria=${categoriaId}&ordenar=avaliacao`}>
              <Icone nome="estrela" alt="Avaliação" tam={15} /> Melhor avaliados
            </Link>
            <Link href={`/busca?q=${encodeURIComponent(termo)}&categoria=${categoriaId}&ordenar=novidades`}>
              <Icone nome="novo" alt="Novidades" tam={15} /> Novidades
            </Link>
            <Link href={`/busca?q=${encodeURIComponent(termo)}&categoria=${categoriaId}&ordenar=preco_asc`}>
              <Icone nome="dinheiro" alt="Menor preço" tam={15} /> Menor preço
            </Link>
            <Link href={`/busca?q=${encodeURIComponent(termo)}&categoria=${categoriaId}&ordenar=preco_desc`}>
              <Icone nome="diamante" alt="Maior preço" tam={15} /> Maior preço
            </Link>
          </div>
          <hr style={{ margin: '16px 0', border: 'none', borderTop: '1px solid var(--line)' }} />
          <h3 style={{ marginBottom: 10 }}>Categorias</h3>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 6, fontSize: 14 }}>
            {categorias.map((cat) => (
              <Link
                key={cat.id}
                href={`/busca?q=${encodeURIComponent(termo)}&categoria=${cat.id}`}
                style={categoriaId === cat.id ? { color: 'var(--primary)', fontWeight: 700 } : {}}
              >
                {cat.nome}
              </Link>
            ))}
          </div>
        </div>
      </aside>

      {/* Resultados */}
      <div style={{ flex: 1, minWidth: 280 }}>
        <div className="secao-titulo" style={{ marginTop: 0 }}>
          <h2>{termo !== '' ? `Resultados para "${termo}"` : 'Todos os livros'}</h2>
          <span style={{ color: 'var(--muted)', fontSize: 14 }}>
            {livros.length} título{livros.length === 1 ? '' : 's'}
          </span>
        </div>

        {termo !== '' && livros.length > 0 && (
          <div className="painel" style={{ marginBottom: 22, background: 'var(--primary-soft)', borderColor: 'var(--line)' }}>
            <b><Icone nome="robo" alt="IA" tam={17} /> Dica da IA:</b> quer uma curadoria melhor?
            Conte para a <Link href="/ia">BibliIA</Link> o que você está procurando com suas
            palavras e ela encontra os livros ideais.
          </div>
        )}

        {livros.length > 0 ? (
          <div className="grid-livros">
            {livros.map((livro) => (
              <LivroCard key={livro.id} livro={livro} />
            ))}
          </div>
        ) : (
          <div className="vazio">
            <span className="icone"><Icone nome="triste" alt="Nenhum resultado" tam={54} /></span>
            <h3>Nenhum livro encontrado</h3>
            <p>Tente outros termos ou peça ajuda para a nossa IA.</p>
            <Link className="btn btn-primary" href="/ia">
              <Icone nome="faiscas" alt="IA" tam={17} /> Pedir recomendação à IA
            </Link>
          </div>
        )}
      </div>
    </div>
  );
}