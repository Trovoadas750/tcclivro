/**
 * Seção "Direto dos vendedores" da página inicial.
 * Recebe os livros já buscados no servidor (buscarDosVendedores: lojas
 * diferentes da loja do catálogo inicial). Some quando não há livros.
 */
import Link from 'next/link';
import Icone from '@/components/Icone';
import LivroCard from '@/components/LivroCard';
import CtaVendedor from '@/components/CtaVendedor';

export default function VitrineVendedores({ livros = [] }) {
  if (livros.length === 0) return null;

  return (
    <section className="secao">
      <div className="secao-titulo">
        <h2><Icone nome="novo" alt="" tam={20} /> Direto dos vendedores</h2>
        <CtaVendedor className="link" />
      </div>
      <div className="grid-livros">
        {livros.map((livro) => (
          <LivroCard key={livro.id} livro={livro} />
        ))}
      </div>
    </section>
  );
}

/** Faixa horizontal de livros (usada nas categorias da página inicial). */
export function FaixaLivros({ titulo, href, livros = [] }) {
  if (livros.length === 0) return null;
  return (
    <section className="secao">
      <div className="secao-titulo">
        <h2><Icone nome="livros" alt="" tam={20} /> {titulo}</h2>
        {href && <Link className="link" href={href}>Ver todos →</Link>}
      </div>
      <div className="faixa-livros">
        {livros.map((livro) => (
          <LivroCard key={livro.id} livro={livro} />
        ))}
      </div>
    </section>
  );
}
