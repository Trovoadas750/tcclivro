/**
 * Catálogo de livros (/busca).
 * Componente SERVER: lê searchParams e consulta a tabela `livros`.
 *
 *   ?q=        busca de texto (textSearch na coluna `busca`, modo websearch)
 *   ?categoria filtro por categoria (nome exato, de categorias_disponiveis())
 *   ?ordenar=  recentes | preco_asc | preco_desc | titulo
 *   ?pagina=   1, 2, 3... (24 livros por página)
 *
 * ATENÇÃO: no Next.js 16, searchParams é uma Promise (await).
 */
import Link from 'next/link';
import { redirect } from 'next/navigation';
import Icone from '@/components/Icone';
import LivroCard from '@/components/LivroCard';
import { createClient } from '@/lib/supabase/server';
import { buscarCatalogo, buscarCategorias, ORDENACOES, POR_PAGINA } from '@/lib/repositories/livroRepository';

export const metadata = { title: 'Catálogo de livros' };

/** Primeiro valor de um parâmetro (?a=1&a=2 chega como array). */
function primeiro(valor) {
  return String(Array.isArray(valor) ? valor[0] : valor ?? '').trim();
}

/** Monta a URL do catálogo mantendo os filtros atuais. */
function urlCatalogo(atual, mudancas = {}) {
  const p = { ...atual, ...mudancas };
  const qs = new URLSearchParams();
  if (p.q) qs.set('q', p.q);
  if (p.categoria) qs.set('categoria', p.categoria);
  if (p.ordenar && p.ordenar !== 'recentes') qs.set('ordenar', p.ordenar);
  if (p.pagina > 1) qs.set('pagina', String(p.pagina));
  const s = qs.toString();
  return s ? `/busca?${s}` : '/busca';
}

/** Números de página a mostrar: 1 … 4 5 [6] 7 8 … 20 */
function paginasVisiveis(atual, total) {
  const set = new Set([1, total, atual - 2, atual - 1, atual, atual + 1, atual + 2]);
  const lista = [...set].filter((n) => n >= 1 && n <= total).sort((a, b) => a - b);
  const saida = [];
  lista.forEach((n, i) => {
    if (i > 0 && n - lista[i - 1] > 1) saida.push('…' + n);
    saida.push(n);
  });
  return saida;
}

export default async function Busca({ searchParams }) {
  const params = await searchParams;
  const q = primeiro(params.q).slice(0, 100);
  const categoria = primeiro(params.categoria).slice(0, 80);
  const ordenarBruto = primeiro(params.ordenar);
  const ordenar = ORDENACOES[ordenarBruto] ? ordenarBruto : 'recentes';
  const paginaPedida = Math.max(1, Math.floor(Number(primeiro(params.pagina)) || 1));
  const atual = { q, categoria, ordenar, pagina: paginaPedida };

  const supabase = await createClient();
  const [{ livros, total, erro }, categorias] = await Promise.all([
    buscarCatalogo(supabase, { termo: q, categoria, ordenar, pagina: paginaPedida }),
    buscarCategorias(supabase),
  ]);

  const totalPaginas = Math.max(1, Math.ceil(total / POR_PAGINA));
  // ?pagina=99 além do fim: vai para a última página existente.
  if (!erro && total > 0 && paginaPedida > totalPaginas) redirect(urlCatalogo(atual, { pagina: totalPaginas }));
  const pagina = paginaPedida;

  let titulo = 'Todos os livros';
  if (q && categoria) titulo = `"${q}" em ${categoria}`;
  else if (q) titulo = `Resultados para "${q}"`;
  else if (categoria) titulo = categoria;

  return (
    <div className="catalogo">
      {/* Filtros laterais */}
      <aside className="catalogo-filtros">
        <div className="painel">
          <form action="/busca" className="form-grid" style={{ gap: 8, marginBottom: 16 }}>
            <label htmlFor="busca-q"><b>Buscar</b></label>
            <input id="busca-q" type="search" name="q" defaultValue={q} maxLength={100} placeholder="Título, autor, tema..." />
            {categoria && <input type="hidden" name="categoria" value={categoria} />}
            {ordenar !== 'recentes' && <input type="hidden" name="ordenar" value={ordenar} />}
            <button className="btn btn-primary btn-sm" type="submit" style={{ justifyContent: 'center' }}>
              <Icone nome="buscar" alt="" tam={15} /> Buscar
            </button>
          </form>

          <h3 style={{ marginBottom: 10 }}>Ordenar</h3>
          <div className="filtro-lista">
            {Object.entries(ORDENACOES).map(([chave, rotulo]) => (
              <Link key={chave} href={urlCatalogo(atual, { ordenar: chave, pagina: 1 })} className={ordenar === chave ? 'ativo' : ''}>
                {rotulo}
              </Link>
            ))}
          </div>

          <hr style={{ margin: '16px 0', border: 'none', borderTop: '1px solid var(--line)' }} />
          <h3 style={{ marginBottom: 10 }}>Categorias</h3>
          <div className="filtro-lista">
            <Link href={urlCatalogo(atual, { categoria: '', pagina: 1 })} className={!categoria ? 'ativo' : ''}>
              Todas
            </Link>
            {categorias.map((c) => (
              <Link
                key={c.categoria}
                href={urlCatalogo(atual, { categoria: c.categoria, pagina: 1 })}
                className={categoria === c.categoria ? 'ativo' : ''}
              >
                {c.categoria} <small>({c.livros})</small>
              </Link>
            ))}
          </div>
        </div>
      </aside>

      {/* Resultados */}
      <div className="catalogo-resultados">
        <div className="secao-titulo" style={{ marginTop: 0 }}>
          <h2>{titulo}</h2>
          <span style={{ color: 'var(--muted)', fontSize: 14 }}>
            {total} título{total === 1 ? '' : 's'}
            {totalPaginas > 1 && ` · página ${pagina} de ${totalPaginas}`}
          </span>
        </div>

        {(q || categoria) && (
          <div className="chips" style={{ marginBottom: 18 }}>
            {q && <Link className="chip ativo" href={urlCatalogo(atual, { q: '', pagina: 1 })}>Busca: {q} ✕</Link>}
            {categoria && <Link className="chip ativo" href={urlCatalogo(atual, { categoria: '', pagina: 1 })}>{categoria} ✕</Link>}
          </div>
        )}

        {erro ? (
          <div className="painel vazio">
            <h3>Não foi possível carregar o catálogo agora</h3>
            <p>Tente de novo em instantes.</p>
          </div>
        ) : livros.length > 0 ? (
          <>
            <div className="grid-livros">
              {livros.map((livro) => (
                <LivroCard key={livro.id} livro={livro} />
              ))}
            </div>

            {totalPaginas > 1 && (
              <nav className="paginacao" aria-label="Páginas do catálogo">
                {pagina > 1 ? (
                  <Link className="btn btn-ghost btn-sm" href={urlCatalogo(atual, { pagina: pagina - 1 })}>← Anterior</Link>
                ) : (
                  <span className="btn btn-ghost btn-sm" aria-disabled="true">← Anterior</span>
                )}
                {paginasVisiveis(pagina, totalPaginas).map((n) =>
                  typeof n === 'string' ? (
                    <span key={n} className="paginacao-reticencias">…</span>
                  ) : (
                    <Link
                      key={n}
                      className={`btn btn-sm ${n === pagina ? 'btn-primary' : 'btn-ghost'}`}
                      href={urlCatalogo(atual, { pagina: n })}
                      aria-current={n === pagina ? 'page' : undefined}
                    >
                      {n}
                    </Link>
                  )
                )}
                {pagina < totalPaginas ? (
                  <Link className="btn btn-ghost btn-sm" href={urlCatalogo(atual, { pagina: pagina + 1 })}>Próxima →</Link>
                ) : (
                  <span className="btn btn-ghost btn-sm" aria-disabled="true">Próxima →</span>
                )}
              </nav>
            )}
          </>
        ) : (
          <div className="vazio">
            <span className="icone"><Icone nome="triste" alt="Nenhum resultado" tam={54} /></span>
            <h3>Nenhum livro encontrado</h3>
            <p>
              Tente outros termos. O catálogo inicial está em inglês: buscar também em inglês
              (ex.: &quot;dragon&quot;, &quot;mystery&quot;) ajuda.
            </p>
            <Link className="btn btn-primary" href="/busca">Ver todos os livros</Link>
          </div>
        )}
      </div>
    </div>
  );
}
