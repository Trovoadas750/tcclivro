/**
 * Caixa de compra da página do livro (/livro/[id]).
 * Componente CLIENT (carrinho no localStorage + sessão do Supabase).
 *
 *  - Quantidade de 1 até o estoque (somando o que já está no carrinho).
 *  - "Adicionar ao carrinho": guarda { livro_id, quantidade } e mostra o toast.
 *  - "Comprar agora": adiciona e vai direto para o carrinho.
 *  - Estoque 0 → "Esgotado" (desabilitado).
 *  - Livro do próprio vendedor logado → "Este livro é seu", sem botões.
 *  - Funciona deslogado. O preço exibido é só informativo: o banco recalcula
 *    tudo ao finalizar a compra.
 */
'use client';

import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';
import Icone from '@/components/Icone';
import { adicionarAoCarrinho, qtdNoCarrinho } from '@/lib/clientStore';
import { useFavoritos } from '@/lib/favoritos';
import { useTipoConta } from '@/lib/useTipoConta';

export default function CaixaCompra({ livro }) {
  const router = useRouter();
  const { carregando, usuario } = useTipoConta();
  const { ehFavorito, alternar } = useFavoritos();
  const [quantidade, setQuantidade] = useState(1);
  const [noCarrinho, setNoCarrinho] = useState(0);
  const [favoritando, setFavoritando] = useState(false);

  const estoque = Math.max(0, Number(livro.estoque) || 0);
  const esgotado = estoque === 0;
  const meuLivro = Boolean(usuario && usuario.id === livro.vendedor_id);
  const disponivelParaAdicionar = Math.max(0, estoque - noCarrinho);
  const fav = ehFavorito(livro.id);

  // Quanto deste livro já está no carrinho (para não passar do estoque).
  useEffect(() => {
    const atualizar = () => setNoCarrinho(qtdNoCarrinho(livro.id));
    atualizar();
    window.addEventListener('carrinho-atualizado', atualizar);
    window.addEventListener('storage', atualizar);
    return () => {
      window.removeEventListener('carrinho-atualizado', atualizar);
      window.removeEventListener('storage', atualizar);
    };
  }, [livro.id]);

  // Mantém a quantidade escolhida dentro do que ainda pode ser adicionado.
  useEffect(() => {
    setQuantidade((q) => Math.min(Math.max(1, q), Math.max(1, disponivelParaAdicionar)));
  }, [disponivelParaAdicionar]);

  /** Adiciona ao carrinho respeitando o estoque. Devolve true se adicionou. */
  function adicionar() {
    if (disponivelParaAdicionar <= 0) {
      window.showToast?.(
        { titulo: 'Limite do estoque', descricao: `Você já tem ${noCarrinho} no carrinho, todo o estoque disponível.`, livro, acao: { rotulo: 'Ver carrinho', href: '/carrinho' } },
        'warning'
      );
      return false;
    }
    const qtd = Math.min(quantidade, disponivelParaAdicionar);
    adicionarAoCarrinho(livro.id, qtd);
    return qtd;
  }

  function adicionarAoCarrinhoClick() {
    const qtd = adicionar();
    if (!qtd) return;
    window.showToast?.({
      titulo: 'Adicionado ao carrinho',
      descricao: `${qtd}× ${livro.titulo}`,
      livro,
      acao: { rotulo: 'Ver carrinho', href: '/carrinho' },
    });
  }

  function comprarAgora() {
    // Se já está tudo no carrinho, só segue para ele.
    if (disponivelParaAdicionar > 0) adicionar();
    router.push('/carrinho');
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
    window.showToast?.({ titulo: r.favoritado ? 'Adicionado aos favoritos' : 'Removido dos favoritos', descricao: livro.titulo, livro });
  }

  const botaoFavorito = (
    <button
      type="button"
      className={`btn btn-ghost btn-fav-texto ${fav ? 'fav' : ''}`}
      onClick={favoritar}
      disabled={favoritando}
      aria-pressed={fav}
    >
      <Icone nome={fav ? 'coracao' : 'coracao-vazio'} alt="" tam={17} /> {fav ? 'Nos favoritos' : 'Favoritar'}
    </button>
  );

  // ---------- Livro do próprio vendedor ----------
  if (meuLivro) {
    return (
      <div className="caixa-compra">
        <p className="caixa-compra-aviso"><Icone nome="livros" alt="" tam={18} /> <b>Este livro é seu.</b> Você não pode comprar os próprios livros.</p>
        <Link className="btn btn-ghost" href={`/painel-vendedor/livros/${livro.id}/editar`}>
          <Icone nome="caneta" alt="" tam={15} /> Editar no painel
        </Link>
      </div>
    );
  }

  return (
    <div className="caixa-compra">
      {esgotado ? (
        <>
          <p className="caixa-compra-estoque esgotado">Esgotado</p>
          <button type="button" className="btn btn-primary" disabled>Esgotado</button>
        </>
      ) : (
        <>
          <p className="caixa-compra-estoque">
            Em estoque{estoque <= 5 ? `: só ${estoque} unidade(s)` : ''}
          </p>

          <div className="caixa-compra-qtd">
            <span id="rotulo-qtd">Quantidade:</span>
            <div className="qtd-controle" role="group" aria-labelledby="rotulo-qtd">
              <button type="button" aria-label="Diminuir" disabled={quantidade <= 1} onClick={() => setQuantidade((q) => Math.max(1, q - 1))}>−</button>
              <span className="qtd-valor" aria-live="polite">{quantidade}</span>
              <button
                type="button"
                aria-label="Aumentar"
                disabled={quantidade >= disponivelParaAdicionar}
                onClick={() => setQuantidade((q) => Math.min(disponivelParaAdicionar, q + 1))}
              >+</button>
            </div>
          </div>

          <button type="button" className="btn btn-primary" onClick={adicionarAoCarrinhoClick} disabled={carregando || disponivelParaAdicionar <= 0}>
            <Icone nome="carrinho" alt="" tam={16} /> Adicionar ao carrinho
          </button>
          <button type="button" className="btn btn-accent" onClick={comprarAgora} disabled={carregando}>
            Comprar agora
          </button>

          {noCarrinho > 0 && (
            <p className="caixa-compra-nota">
              Você já tem {noCarrinho} no <Link href="/carrinho">carrinho</Link>
              {disponivelParaAdicionar <= 0 ? ', todo o estoque disponível.' : '.'}
            </p>
          )}
        </>
      )}

      {botaoFavorito}
    </div>
  );
}
