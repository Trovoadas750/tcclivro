/**
 * Página do produto (equivalente ao produto.php do PHP).
 * Componente SERVER: rota dinâmica /produto/[id].
 * ATENÇÃO: no Next.js 16, `params` é uma Promise (await).
 */
import Link from 'next/link';
import Icone from '@/components/Icone';
import CapaLivro from '@/components/CapaLivro';
import LivroCard from '@/components/LivroCard';
import BotoesProduto from './BotoesProduto';
import { estrelas, preco, formatarData } from '@/lib/format';
import {
  buscarLivroPorId,
  buscarRelacionados,
  buscarAvaliacoes,
} from '@/lib/repositories/livroRepository';

export async function generateMetadata({ params }) {
  const { id } = await params;
  const livro = await buscarLivroPorId(id);
  return { title: livro ? livro.titulo : 'Livro não encontrado' };
}

export default async function Produto({ params }) {
  // Next.js 16: params é Promise — precisa de await
  const { id } = await params;
  const livro = await buscarLivroPorId(id);

  if (!livro) {
    return (
      <div className="vazio" style={{ marginTop: 40 }}>
        <span className="icone"><Icone nome="buscar" alt="Não encontrado" tam={54} /></span>
        <h2>Livro não encontrado</h2>
        <p>O título que você procura não existe no acervo.</p>
        <Link className="btn btn-primary" href="/">Voltar ao início</Link>
      </div>
    );
  }

  const [relacionados, avaliacoes] = await Promise.all([
    buscarRelacionados(livro.id, 4),
    buscarAvaliacoes(livro.id, 6),
  ]);

  const disponivel = livro.estoque > 0;

  return (
    <>
      <nav className="breadcrumb" style={{ margin: '18px 0' }}>
        <Link href="/">Início</Link> ›
        <Link href={`/busca?categoria=${livro.categoriaId}`}>{livro.categoria?.nome || 'Livros'}</Link> ›
        <span>{livro.titulo}</span>
      </nav>

      <section className="painel produto" style={{ display: 'flex', gap: 34, flexWrap: 'wrap', alignItems: 'flex-start' }}>
        <div style={{ flex: '0 0 300px', maxWidth: 300, margin: '0 auto' }}>
          <CapaLivro livro={livro} largura="100%" className="capa-grande" />
        </div>

        <div style={{ flex: 1, minWidth: 280 }}>
          <h1 style={{ fontSize: 30, lineHeight: 1.2, marginBottom: 6 }}>{livro.titulo}</h1>
          <p className="card-autor" style={{ fontSize: 16 }}>por <b>{livro.autor}</b></p>

          <div className="card-avaliacao" style={{ fontSize: 15, margin: '10px 0' }}>
            {estrelas(livro.avaliacao)}
            <small> {livro.avaliacao.toFixed(1).replace('.', ',')} · {livro.numAvaliacoes} avaliações</small>
          </div>

          <div className="card-preco" style={{ margin: '14px 0' }}>
            <span className="preco" style={{ fontSize: 30 }}>{preco(livro.preco)}</span>
            {livro.precoOriginal > livro.preco && (
              <span className="preco-original" style={{ fontSize: 16 }}>{preco(livro.precoOriginal)}</span>
            )}
            <span style={{ color: 'var(--success)', fontWeight: 700, fontSize: 13 }}>
              {' '}ou 12x de {preco(livro.preco / 12)}
            </span>
          </div>

          {/* Botões de carrinho e favorito (componente client) */}
          <BotoesProduto livro={livro} />

          <div className="ficha" style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit,minmax(140px,1fr))', gap: 10, background: 'var(--hover-bg)', border: '1px solid var(--line)', borderRadius: 12, padding: 16, marginBottom: 20 }}>
            <div><small style={{ color: 'var(--muted)' }}>Páginas</small><br /><b>{livro.paginas}</b></div>
            <div><small style={{ color: 'var(--muted)' }}>Ano</small><br /><b>{livro.anoPublicacao}</b></div>
            <div><small style={{ color: 'var(--muted)' }}>Editora</small><br /><b>{livro.editora}</b></div>
            <div><small style={{ color: 'var(--muted)' }}>Idioma</small><br /><b>Português</b></div>
            <div>
              <small style={{ color: 'var(--muted)' }}>Estoque</small><br />
              <b style={{ color: disponivel ? 'var(--success)' : 'var(--danger)' }}>
                {disponivel ? 'Disponível' : 'Esgotado'}
              </b>
            </div>
          </div>

          <h3 style={{ marginBottom: 8 }}>Sinopse</h3>
          <p style={{ color: 'var(--muted)', fontSize: 15 }}>{livro.descricao}</p>
        </div>
      </section>

      <section className="secao">
        <div className="secao-titulo"><h2>Você também pode gostar</h2></div>
        <div className="grid-livros">
          {relacionados.map((l) => (
            <LivroCard key={l.id} livro={l} />
          ))}
        </div>
      </section>

      <section className="secao">
        <div className="secao-titulo">
          <h2><Icone nome="caneta" alt="Avaliações" tam={18} /> Avaliações</h2>
        </div>
        {avaliacoes.length > 0 ? (
          <div className="painel">
            {avaliacoes.map((av) => (
              <div key={av.id} style={{ padding: '14px 0', borderBottom: '1px solid var(--line)' }}>
                <b>{av.usuario}</b>
                <span className="card-avaliacao" style={{ marginLeft: 10 }}>{estrelas(av.nota)}</span>
                <p style={{ marginTop: 6, fontSize: 14, color: 'var(--muted)' }}>{av.comentario}</p>
                <small style={{ color: 'var(--muted)' }}>{formatarData(av.criadoEm)}</small>
              </div>
            ))}
          </div>
        ) : (
          <div className="painel vazio">
            <span className="icone"><Icone nome="caneta" alt="Avaliar" tam={54} /></span>
            <p>Seja o primeiro a avaliar este livro!</p>
          </div>
        )}
      </section>
    </>
  );
}