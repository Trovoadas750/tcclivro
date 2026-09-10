/**
 * Card de livro (equivalente ao includes/livro_card.php do PHP).
 * Recebe o objeto livro e opções de exibição.
 * Botões "Comprar" e "Favoritar" funcionam via localStorage
 * (o armazenamento real no banco fica para quando o Supabase
 * for ativado — ver src/lib/clientStore.js).
 */
'use client';

import Link from 'next/link';
import { useState } from 'react';
import Icone from '@/components/Icone';
import CapaLivro from '@/components/CapaLivro';
import { estrelas, preco } from '@/lib/format';
import { getFavoritos, toggleFavorito, adicionarAoCarrinho } from '@/lib/clientStore';

export default function LivroCard({ livro, destaqueFixo = false }) {
  const [ehFav, setEhFav] = useState(() =>
    typeof window !== 'undefined' && getFavoritos().includes(livro.id)
  );
  const [carregando, setCarregando] = useState(false);

  function adicionar() {
    setCarregando(true);
    // Simula a chamada ajax do main.js -> api/carrinho.php.
    // Com banco ativo, seria: fetch('/api/carrinho', {...}).
    setTimeout(() => {
      adicionarAoCarrinho(livro.id, 1);
      window.dispatchEvent(new Event('carrinho-atualizado'));
      window.showToast?.({
        titulo: 'Adicionado ao carrinho!',
        descricao: livro.titulo,
        livro,
        acao: { rotulo: 'Ver carrinho', href: '/carrinho' },
      });
      setCarregando(false);
    }, 300);
  }

  function favoritar() {
    const { adicionado } = toggleFavorito(livro.id);
    setEhFav(adicionado);
    window.showToast?.({
      titulo: adicionado ? 'Adicionado aos favoritos' : 'Removido dos favoritos',
      descricao: livro.titulo,
      livro,
      acao: adicionado ? { rotulo: 'Ver favoritos', href: '/favoritos' } : undefined,
    });
  }

  return (
    <article className="card-livro">
      {livro._score ? (
        <span className="selo selo-ia"><Icone nome="robo" alt="IA" tam={13} /> IA</span>
      ) : destaqueFixo || livro.destaque ? (
        <span className="selo">DESTAQUE</span>
      ) : null}

      <Link className="capa" href={`/produto/${livro.id}`}>
        <CapaLivro livro={livro} />
      </Link>

      <div className="card-corpo">
        <h3 className="card-titulo"><Link href={`/produto/${livro.id}`}>{livro.titulo}</Link></h3>
        <div className="card-autor">{livro.autor}</div>
        <div className="card-avaliacao">
          {estrelas(livro.avaliacao)} <small>({livro.numAvaliacoes})</small>
        </div>
        <div className="card-preco">
          <span className="preco">{preco(livro.preco)}</span>
          {livro.precoOriginal > livro.preco && (
            <span className="preco-original">{preco(livro.precoOriginal)}</span>
          )}
        </div>
      </div>

      {livro._razoes && livro._razoes.length > 0 && (
        <ul className="razoes">
          {livro._razoes.slice(0, 3).map((r) => (
            <li key={r}><Icone nome="faiscas" alt="Razão" tam={12} /> {r}</li>
          ))}
        </ul>
      )}

      <div className="card-acoes">
        <button className="btn btn-primary btn-sm add-carrinho" data-id={livro.id} onClick={adicionar} disabled={carregando || livro.estoque <= 0}>
          <Icone nome="carrinho" alt="Comprar" tam={15} /> {carregando ? '...' : 'Comprar'}
        </button>
        <button
          className={`btn btn-ghost btn-sm btn-fav ${ehFav ? 'fav' : ''}`}
          onClick={favoritar}
          title="Favoritar"
        >
          <Icone nome={ehFav ? 'coracao' : 'coracao-vazio'} alt="Favoritar" tam={17} />
        </button>
      </div>
    </article>
  );
}