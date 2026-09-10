/**
 * Botões "Adicionar ao carrinho" e "Favoritar" da página do produto.
 * Componente CLIENT (interage com localStorage; com banco ativo
 * passaria a chamar as rotas /api/carrinho e /api/favorito).
 */
'use client';

import { useState } from 'react';
import Icone from '@/components/Icone';
import {
  adicionarAoCarrinho,
  getFavoritos,
  toggleFavorito,
} from '@/lib/clientStore';

export default function BotoesProduto({ livro }) {
  const [ehFav, setEhFav] = useState(() =>
    typeof window !== 'undefined' && getFavoritos().includes(livro.id)
  );
  const [carregando, setCarregando] = useState(false);

  function adicionar() {
    if (livro.estoque <= 0) return;
    setCarregando(true);
    // Simula a chamada ajax (api/carrinho.php no PHP original)
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
    <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap', marginBottom: 20 }}>
      <button
        className="btn btn-primary add-carrinho"
        onClick={adicionar}
        disabled={carregando || livro.estoque <= 0}
      >
        <Icone nome="carrinho" alt="Carrinho" tam={18} />{' '}
        {carregando ? 'Adicionando...' : livro.estoque <= 0 ? 'Esgotado' : 'Adicionar ao carrinho'}
      </button>
      <button
        className={`btn btn-ghost btn-fav ${ehFav ? 'fav' : ''}`}
        onClick={favoritar}
        style={{ flex: '0 0 auto', width: 'auto', padding: '12px 20px' }}
      >
        <Icone nome={ehFav ? 'coracao' : 'coracao-vazio'} alt="Favoritar" tam={18} />
        <span className="btn-fav-rotulo">{ehFav ? 'Favoritado' : 'Favoritar'}</span>
      </button>
    </div>
  );
}