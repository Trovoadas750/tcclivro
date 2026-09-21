/**
 * Página de favoritos.
 * Componente CLIENT: lista os favoritos do usuário (tabela `favoritos`
 * com join em `livros`), lidos do cache do localStorage quando possível
 * (ver src/lib/usePerfil.js).
 */
'use client';

import Link from 'next/link';
import Icone from '@/components/Icone';
import CapaLivro from '@/components/CapaLivro';
import { preco } from '@/lib/format';
import { usePerfil } from '@/lib/usePerfil';

export default function Favoritos() {
  const { carregando, usuario, favoritos, erro, removerFavorito } = usePerfil();

  async function remover(livro) {
    const r = await removerFavorito(livro.id);
    window.showToast?.(r.ok ? { titulo: 'Removido dos favoritos', descricao: livro.titulo } : r.erro);
  }

  if (carregando || !usuario) {
    return <div style={{ marginTop: 40, textAlign: 'center' }}>Carregando...</div>;
  }

  // Ignora favoritos cujo livro foi removido do catálogo.
  const livros = favoritos.map((f) => f.livros).filter(Boolean);

  return (
    <>
      <h1 style={{ margin: '28px 0 20px' }}><Icone nome="coracao" alt="Favoritos" tam={22} /> Meus favoritos</h1>

      {erro && <div className="toast toast-error" style={{ marginBottom: 16 }}>{erro}</div>}

      {livros.length === 0 ? (
        <div className="vazio" style={{ marginTop: 20 }}>
          <span className="icone"><Icone nome="coracao-branco" alt="Sem favoritos" tam={54} /></span>
          <h2>Você ainda não tem favoritos</h2>
          <p>Toque no coração de qualquer livro para guardá-lo aqui.</p>
          <Link className="btn btn-primary" href="/busca">Descobrir livros</Link>
        </div>
      ) : (
        <div className="grid-livros">
          {livros.map((livro) => (
            <article key={livro.id} className="card-livro">
              <div className="capa">
                {livro.capa_url ? (
                  <img src={livro.capa_url} alt={livro.titulo} style={{ width: '100%' }} loading="lazy" />
                ) : (
                  <CapaLivro livro={livro} />
                )}
              </div>

              <div className="card-corpo">
                <h3 className="card-titulo">{livro.titulo}</h3>
                <div className="card-autor">{livro.autor}</div>
                {livro.categoria && <small style={{ color: 'var(--muted)' }}>{livro.categoria}</small>}
                <div className="card-preco">
                  <span className="preco">{preco(livro.preco)}</span>
                </div>
              </div>

              <div className="card-acoes">
                <button className="btn btn-ghost btn-sm btn-fav fav" onClick={() => remover(livro)} title="Remover dos favoritos">
                  <Icone nome="coracao" alt="Remover dos favoritos" tam={17} /> Remover
                </button>
              </div>
            </article>
          ))}
        </div>
      )}
    </>
  );
}
