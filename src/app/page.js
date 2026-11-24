/**
 * Página inicial.
 * Componente SERVER: lê o catálogo real (tabela `livros`) pelo
 * repositório, com o cliente Supabase do servidor.
 *
 *  - Destaques: livros mais recentes.
 *  - Uma faixa para cada uma das 5 maiores categorias (categorias_disponiveis()).
 *  - "Direto dos vendedores": lojas diferentes da loja do catálogo inicial.
 */
import Link from 'next/link';
import Icone from '@/components/Icone';
import LivroCard from '@/components/LivroCard';
import VitrineVendedores, { FaixaLivros } from '@/components/VitrineVendedores';
import CtaVendedor from '@/components/CtaVendedor';
import { createClient } from '@/lib/supabase/server';
import {
  buscarCategorias,
  buscarDestaques,
  buscarDosVendedores,
  buscarPorCategoria,
} from '@/lib/repositories/livroRepository';

export const metadata = { title: 'Início' };

const QTD_FAIXAS = 5;
const QTD_CATEGORIAS_ATALHO = 10;

export default async function Home() {
  const supabase = await createClient();

  const [destaques, categorias, dosVendedores] = await Promise.all([
    buscarDestaques(supabase, 8),
    buscarCategorias(supabase),
    buscarDosVendedores(supabase, 8),
  ]);

  const principais = categorias.slice(0, QTD_FAIXAS);
  const faixas = await Promise.all(
    principais.map(async (c) => ({ categoria: c.categoria, livros: await buscarPorCategoria(supabase, c.categoria, 10) }))
  );

  return (
    <>
      <section className="hero">
        <h1>Encontre o livro perfeito para você <span>com ajuda de IA</span></h1>
        <p>
          Descreva seu gosto e nossa inteligência artificial faz a curadoria do catálogo:
          recomendamos histórias que realmente combinam com você.
        </p>
        <div className="hero-botoes">
          <Link className="btn btn-primary" href="/ia">
            <Icone nome="faiscas" alt="IA" tam={18} /> Experimentar a IA
          </Link>
          <Link className="btn btn-outline" href="/busca">Explorar catálogo</Link>
        </div>
      </section>

      {/* Atalho para as maiores categorias: uma linha só, com rolagem lateral.
          A lista completa fica no menu "Categorias" do cabeçalho e no catálogo. */}
      {categorias.length > 0 && (
        <section className="secao faixa-categorias" aria-labelledby="titulo-categorias">
          <h2 id="titulo-categorias" className="faixa-categorias-titulo">Explore por categoria</h2>
          <ul className="faixa-categorias-lista">
            {categorias.slice(0, QTD_CATEGORIAS_ATALHO).map((c) => (
              <li key={c.categoria}>
                <Link className="categoria-atalho" href={`/busca?categoria=${encodeURIComponent(c.categoria)}`}>
                  {c.categoria} <span className="categoria-atalho-qtd">{c.livros}</span>
                </Link>
              </li>
            ))}
            <li>
              <Link className="categoria-atalho categoria-atalho-todas" href="/busca">Todas as categorias ›</Link>
            </li>
          </ul>
        </section>
      )}

      <section className="secao">
        <div className="secao-titulo">
          <h2><Icone nome="novo" alt="" tam={20} /> Destaques</h2>
          <Link className="link" href="/busca">Ver catálogo →</Link>
        </div>
        {destaques.length > 0 ? (
          <div className="grid-livros">
            {destaques.map((livro) => (
              <LivroCard key={livro.id} livro={livro} />
            ))}
          </div>
        ) : (
          <div className="painel vazio">
            <h3>Não foi possível carregar o catálogo agora</h3>
            <p>Tente recarregar a página em instantes.</p>
          </div>
        )}
      </section>

      {faixas.slice(0, 2).map((f) => (
        <FaixaLivros key={f.categoria} titulo={f.categoria} href={`/busca?categoria=${encodeURIComponent(f.categoria)}`} livros={f.livros} />
      ))}

      <section className="secao">
        <div className="banner-ia">
          <div style={{ flex: 1, minWidth: 260 }}>
            <h2>Converse com a BibliIA</h2>
            <p>
              Diga &quot;gosto de fantasia com magia&quot; ou &quot;quero um suspense policial&quot;
              e receba indicações na hora — do jeito que uma curadora faria.
            </p>
            <Link className="btn btn-accent" href="/ia">Abrir recomendação inteligente</Link>
          </div>
        </div>
      </section>

      {faixas.slice(2).map((f) => (
        <FaixaLivros key={f.categoria} titulo={f.categoria} href={`/busca?categoria=${encodeURIComponent(f.categoria)}`} livros={f.livros} />
      ))}

      {/* Livros de outras lojas (some quando não houver) */}
      <VitrineVendedores livros={dosVendedores} />

      <section className="secao">
        <div className="banner-vendedor">
          <div style={{ flex: 1, minWidth: 260 }}>
            <h2>Tem livros para vender?</h2>
            <p>
              Abra sua loja na Casa do Leitor, cadastre seus livros com fotos e alcance
              leitores de todo o Brasil. O cadastro é gratuito.
            </p>
          </div>
          <CtaVendedor className="btn btn-accent" icone />
        </div>
      </section>
    </>
  );
}
