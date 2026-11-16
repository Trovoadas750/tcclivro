/**
 * Página pública de um livro cadastrado por vendedor (/livro/[id]).
 * Componente SERVER: lê `livros` + `lojas` no Supabase (o id é uuid).
 * Livro inexistente ou inativo (para quem não é o dono) → "não encontrado".
 *
 * O catálogo de demonstração continua em /produto/[id] (mockData).
 * Carrinho/checkout ainda não aceitam livros de vendedores (fora do escopo).
 */
import Link from 'next/link';
import Icone from '@/components/Icone';
import GaleriaFotos from './GaleriaFotos';
import { preco } from '@/lib/format';
import { createClient } from '@/lib/supabase/server';
import { ehUuid, fotosDoLivro } from '@/lib/vendedor';

async function buscarLivro(id) {
  if (!ehUuid(id)) return null;
  const supabase = await createClient();
  const { data, error } = await supabase
    .from('livros')
    .select('*, lojas(nome_loja, descricao)')
    .eq('id', id)
    .maybeSingle();
  if (error) {
    console.error('Erro ao buscar livro do vendedor:', error);
    return null;
  }
  return data;
}

export async function generateMetadata({ params }) {
  const { id } = await params;
  const livro = await buscarLivro(id);
  return { title: livro ? livro.titulo : 'Livro não encontrado' };
}

export default async function LivroVendedor({ params }) {
  // Next.js 16: params é Promise — precisa de await
  const { id } = await params;
  const livro = await buscarLivro(id);

  if (!livro) {
    return (
      <div className="vazio" style={{ marginTop: 40 }}>
        <span className="icone"><Icone nome="buscar" alt="Não encontrado" tam={54} /></span>
        <h2>Livro não encontrado</h2>
        <p>Este livro não existe ou não está mais disponível.</p>
        <Link className="btn btn-primary" href="/">Voltar ao início</Link>
      </div>
    );
  }

  const disponivel = livro.estoque > 0;

  return (
    <>
      <nav className="breadcrumb" style={{ margin: '18px 0' }}>
        <Link href="/">Início</Link> › <span>{livro.lojas?.nome_loja || 'Vendedores'}</span> › <span>{livro.titulo}</span>
      </nav>

      <section className="painel produto" style={{ display: 'flex', gap: 34, flexWrap: 'wrap', alignItems: 'flex-start' }}>
        <div style={{ flex: '0 1 340px', maxWidth: 340, width: '100%', margin: '0 auto' }}>
          <GaleriaFotos fotos={fotosDoLivro(livro)} titulo={livro.titulo} />
        </div>

        <div style={{ flex: 1, minWidth: 260 }}>
          {!livro.ativo && (
            <div className="toast toast-error">Este livro está desativado e só você (vendedor) consegue vê-lo.</div>
          )}
          <h1 style={{ fontSize: 30, lineHeight: 1.2, marginBottom: 6 }}>{livro.titulo}</h1>
          <p className="card-autor" style={{ fontSize: 16 }}>por <b>{livro.autor}</b></p>

          <div className="card-preco" style={{ margin: '14px 0' }}>
            <span className="preco" style={{ fontSize: 30 }}>{preco(livro.preco)}</span>
          </div>

          {livro.lojas?.nome_loja && (
            <p className="vendido-por">
              <Icone nome="livros" alt="" tam={16} /> Vendido por <b>{livro.lojas.nome_loja}</b>
            </p>
          )}

          <div className="ficha" style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit,minmax(130px,1fr))', gap: 10, background: 'var(--hover-bg)', border: '1px solid var(--line)', borderRadius: 12, padding: 16, margin: '16px 0 20px' }}>
            <div><small style={{ color: 'var(--muted)' }}>Ano</small><br /><b>{livro.ano_lancamento || '—'}</b></div>
            <div><small style={{ color: 'var(--muted)' }}>Categoria</small><br /><b>{livro.categoria || '—'}</b></div>
            <div>
              <small style={{ color: 'var(--muted)' }}>Estoque</small><br />
              <b style={{ color: disponivel ? 'var(--success)' : 'var(--danger)' }}>
                {disponivel ? `${livro.estoque} disponível(is)` : 'Esgotado'}
              </b>
            </div>
          </div>

          <h3 style={{ marginBottom: 8 }}>Descrição</h3>
          <p style={{ color: 'var(--muted)', fontSize: 15, whiteSpace: 'pre-line' }}>
            {livro.sinopse || 'O vendedor não adicionou uma descrição.'}
          </p>

          {livro.lojas?.descricao && (
            <div className="painel" style={{ marginTop: 20, boxShadow: 'none' }}>
              <b>Sobre a loja {livro.lojas.nome_loja}</b>
              <p style={{ color: 'var(--muted)', fontSize: 14, marginTop: 4 }}>{livro.lojas.descricao}</p>
            </div>
          )}
        </div>
      </section>
    </>
  );
}
