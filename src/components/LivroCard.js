/**
 * Card de livro da vitrine (página inicial, catálogo, favoritos...).
 * Recebe um livro com as colunas de COLUNAS_CARD (livroRepository).
 *
 *  - Capa com fallback (foto 1 → foto 2 → capa genérica).
 *  - "Comprar": adiciona ao carrinho do navegador (funciona deslogado).
 *    Sem estoque → "Esgotado", desabilitado. Livro do próprio vendedor
 *    logado → "Este livro é seu", sem botão de compra.
 *  - Coração: tabela `favoritos` (deslogado vai para o login e volta).
 *  - `motivo` (opcional): frase curta mostrada abaixo do preço (IA).
 */
'use client';

import Link from 'next/link';
import { useState } from 'react';
import Icone from '@/components/Icone';
import CapaLivro from '@/components/CapaLivro';
import { preco } from '@/lib/format';
import { adicionarAoCarrinho } from '@/lib/clientStore';
import { useFavoritos } from '@/lib/favoritos';

export default function LivroCard({ livro, motivo }) {
  const { ehFavorito, alternar, usuarioId } = useFavoritos();
  const [favoritando, setFavoritando] = useState(false);
  const fav = ehFavorito(livro.id);
  const esgotado = !(livro.estoque > 0);
  const meuLivro = Boolean(usuarioId && usuarioId === livro.vendedor_id);
  const href = `/livro/${livro.id}`;

  function comprar() {
    adicionarAoCarrinho(livro.id, 1);
    window.showToast?.({
      titulo: 'Adicionado ao carrinho',
      descricao: livro.titulo,
      livro,
      acao: { rotulo: 'Ver carrinho', href: '/carrinho' },
    });
  }

  async function favoritar() {
    if (favoritando) return;
    setFavoritando(true);
    const r = await alternar(livro.id);
    setFavoritando(false);
    if (r.redirecionou) return;
    if (r.erro) {
      window.showToast?.(r.erro, 'error');
      return;
    }
    window.showToast?.({
      titulo: r.favoritado ? 'Adicionado aos favoritos' : 'Removido dos favoritos',
      descricao: livro.titulo,
      livro,
      acao: r.favoritado ? { rotulo: 'Ver favoritos', href: '/favoritos' } : undefined,
    });
  }

  return (
    <article className="card-livro">
      <Link className="capa" href={href} tabIndex={-1} aria-hidden="true">
        <CapaLivro livro={livro} />
      </Link>

      <div className="card-corpo">
        <h3 className="card-titulo"><Link href={href}>{livro.titulo}</Link></h3>
        <div className="card-autor">{livro.autor}</div>
        {livro.lojas?.nome_loja && <small className="card-loja">Loja: {livro.lojas.nome_loja}</small>}
        <div className="card-preco">
          <span className="preco">{preco(livro.preco)}</span>
        </div>
        {motivo && (
          <p className="card-motivo"><Icone nome="faiscas" alt="" tam={13} /> {motivo}</p>
        )}
      </div>

      <div className="card-acoes">
        {meuLivro ? (
          <span className="btn btn-ghost btn-sm" aria-disabled="true" title="Você não pode comprar os próprios livros">Este livro é seu</span>
        ) : (
          <button className="btn btn-primary btn-sm" type="button" onClick={comprar} disabled={esgotado}>
            {esgotado ? 'Esgotado' : <><Icone nome="carrinho" alt="" tam={15} /> Comprar</>}
          </button>
        )}
        <button
          className={`btn btn-ghost btn-sm btn-fav ${fav ? 'fav' : ''}`}
          type="button"
          onClick={favoritar}
          disabled={favoritando}
          title={fav ? 'Remover dos favoritos' : 'Favoritar'}
          aria-pressed={fav}
        >
          <Icone nome={fav ? 'coracao' : 'coracao-vazio'} alt={fav ? 'Remover dos favoritos' : 'Favoritar'} tam={17} />
        </button>
      </div>
    </article>
  );
}
