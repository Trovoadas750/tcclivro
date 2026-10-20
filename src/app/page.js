/**
 * Página inicial (equivalente ao index.php do PHP).
 * Componente SERVER: chama os repositórios, que em modo demo
 * devolvem os dados de src/lib/mockData.js.
 * Quando o Supabase for ativado, nada muda aqui — a troca de
 * fonte de dados acontece dentro do repositório.
 */
import Link from 'next/link';
import Icone from '@/components/Icone';
import LivroCard from '@/components/LivroCard';
import VitrineVendedores from '@/components/VitrineVendedores';
import { buscarRecomendados, buscarMaisVendidos, buscarCategorias } from '@/lib/repositories/livroRepository';

export const metadata = { title: 'Início' };

export default async function Home() {
  // "Consulta ao banco" — sem banco ativo, devolve mock
  const [recomendados, maisVendidos, categorias] = await Promise.all([
    buscarRecomendados(8),
    buscarMaisVendidos(8),
    buscarCategorias(),
  ]);

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

      <section className="secao">
        <div className="chips">
          {categorias.map((cat) => (
            <Link key={cat.id} className="chip" href={`/busca?categoria=${cat.id}`}>
              <Icone nome={cat.icone} alt={cat.nome} tam={15} /> {cat.nome}
            </Link>
          ))}
        </div>
      </section>

      <section className="secao">
        <div className="secao-titulo">
          <h2><Icone nome="robo" alt="IA" tam={20} /> Recomendados por nossa IA</h2>
          <Link className="link" href="/ia">Personalizar indicações →</Link>
        </div>
        <div className="grid-livros">
          {recomendados.map((livro) => (
            <LivroCard key={livro.id} livro={livro} />
          ))}
        </div>
      </section>

      {/* Livros cadastrados pelos vendedores (Supabase). Some se não houver. */}
      <VitrineVendedores />

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

      <section className="secao">
        <div className="secao-titulo">
          <h2><Icone nome="fogo" alt="Mais vendidos" tam={19} /> Mais vendidos</h2>
          <Link className="link" href="/busca?ordenar=vendas">Ver todos →</Link>
        </div>
        <div className="grid-livros">
          {maisVendidos.map((livro) => (
            <LivroCard key={livro.id} livro={livro} />
          ))}
        </div>
      </section>

      <section className="secao">
        <div className="banner-vendedor">
          <div style={{ flex: 1, minWidth: 260 }}>
            <h2>Tem livros para vender?</h2>
            <p>
              Abra sua loja na Casa do Leitor, cadastre seus livros com fotos e alcance
              leitores de todo o Brasil. O cadastro é gratuito.
            </p>
          </div>
          <Link className="btn btn-accent" href="/vendedor/cadastro">
            <Icone nome="livros" alt="" tam={18} /> Tornar-se vendedor
          </Link>
        </div>
      </section>
    </>
  );
}