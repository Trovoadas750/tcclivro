/**
 * Página do carrinho.
 * Componente CLIENT. Os dados dos livros vêm do banco (src/lib/useCarrinho.js);
 * o navegador guarda só { livro_id, quantidade }.
 *
 *  - Indisponível / Esgotado / "Este livro é seu" ficam fora do total e
 *    precisam ser removidos para finalizar.
 *  - Quantidade de 1 até o estoque.
 *  - "Finalizar compra": deslogado → login e volta ao carrinho;
 *    logado → /checkout (resumo + "Confirmar pedido").
 *  - Subtotal é só para exibir: o banco recalcula ao finalizar.
 */
'use client';

import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useState } from 'react';
import Icone from '@/components/Icone';
import CapaLivro from '@/components/CapaLivro';
import { preco } from '@/lib/format';
import { atualizarQtdCarrinho, removerDoCarrinho } from '@/lib/clientStore';
import { useCarrinho } from '@/lib/useCarrinho';

const ROTULO_PROBLEMA = {
  indisponivel: null, // tem texto próprio
  esgotado: 'Esgotado',
  meu: 'Este livro é seu',
};

export default function Carrinho() {
  const router = useRouter();
  const { supabase, lendo, vazio, linhas, validas, comProblema, subtotal, qtdTotal, erro, avisos } = useCarrinho();
  const [indo, setIndo] = useState(false);

  async function finalizar() {
    setIndo(true);
    const { data: { session } } = await supabase.auth.getSession();
    // Finalizar compra exige login; depois do login, volta ao carrinho.
    router.push(session ? '/checkout' : '/auth/login?proximo=/carrinho');
  }

  if (lendo) {
    return <div style={{ marginTop: 40, textAlign: 'center' }}>Carregando carrinho...</div>;
  }

  if (vazio) {
    return (
      <div className="vazio" style={{ marginTop: 40 }}>
        <span className="icone"><Icone nome="carrinho" alt="Carrinho" tam={54} /></span>
        <h2>Seu carrinho está vazio</h2>
        <p>Explore o catálogo e adicione os livros que quiser.</p>
        <div style={{ display: 'flex', gap: 10, justifyContent: 'center', flexWrap: 'wrap' }}>
          <Link className="btn btn-primary" href="/busca">Explorar catálogo</Link>
          <Link className="btn btn-accent" href="/ia"><Icone nome="faiscas" alt="IA" tam={17} /> Recomendar com IA</Link>
        </div>
      </div>
    );
  }

  return (
    <>
      <h1 style={{ margin: '28px 0 20px' }}><Icone nome="carrinho" alt="Carrinho" tam={22} /> Meu carrinho</h1>

      {erro && <div className="toast toast-error" role="alert">{erro}</div>}
      {avisos.length > 0 && (
        <div className="toast toast-warning" role="status">
          {avisos.map((a) => <div key={a}>{a}</div>)}
        </div>
      )}

      <div className="layout-2col">
        <div className="painel">
          {linhas.map(({ livro_id, quantidade, livro, situacao }) => (
            <div key={livro_id} className={`cart-item ${situacao !== 'ok' ? 'cart-item-indisponivel' : ''}`}>
              <div className="cart-capa">
                {livro ? <CapaLivro livro={livro} largura="100%" /> : <span className="cart-capa-vazia"><Icone nome="livros" alt="" tam={24} /></span>}
              </div>
              <div className="cart-info">
                {livro ? (
                  <>
                    <h3><Link href={`/livro/${livro.id}`}>{livro.titulo}</Link></h3>
                    <div className="autor">{livro.autor}</div>
                    {livro.lojas?.nome_loja && <small className="card-loja">Loja: {livro.lojas.nome_loja}</small>}
                    <div className="preco" style={{ marginTop: 6 }}>{preco(livro.preco)}</div>
                  </>
                ) : (
                  <>
                    <h3>Livro indisponível</h3>
                    <div className="autor">Este livro saiu da vitrine e não pode mais ser comprado.</div>
                  </>
                )}
                {ROTULO_PROBLEMA[situacao] && (
                  <span className="status-pill status-cancelado" style={{ marginTop: 6 }}>{ROTULO_PROBLEMA[situacao]}</span>
                )}
              </div>

              {situacao === 'ok' ? (
                <>
                  <div className="qtd-controle">
                    <button type="button" aria-label="Diminuir" onClick={() => atualizarQtdCarrinho(livro_id, quantidade - 1)}>−</button>
                    <span className="qtd-valor">{quantidade}</span>
                    <button
                      type="button"
                      aria-label="Aumentar"
                      disabled={quantidade >= livro.estoque}
                      title={quantidade >= livro.estoque ? 'Limite do estoque' : undefined}
                      onClick={() => atualizarQtdCarrinho(livro_id, quantidade + 1)}
                    >+</button>
                  </div>
                  <div style={{ fontWeight: 800, minWidth: 90, textAlign: 'right' }}>
                    {preco(Number(livro.preco) * quantidade)}
                  </div>
                </>
              ) : (
                <div style={{ minWidth: 90 }} />
              )}

              <button className="btn btn-ghost btn-sm" type="button" title="Remover" onClick={() => removerDoCarrinho(livro_id)}>
                <Icone nome="lixeira" alt="Remover" tam={16} />
              </button>
            </div>
          ))}
        </div>

        <aside className="painel resumo-carrinho">
          <h3 style={{ marginBottom: 6 }}>Resumo</h3>
          <div className="linha-resumo"><span>Itens</span><span>{qtdTotal}</span></div>
          <div className="linha-resumo total"><span>Subtotal</span><span>{preco(subtotal)}</span></div>
          {comProblema > 0 && (
            <p style={{ color: 'var(--danger)', fontSize: 13.5, marginTop: 10 }}>
              Remova os itens indisponíveis, esgotados ou da sua própria loja para finalizar a compra.
            </p>
          )}
          <button
            className="btn btn-primary"
            type="button"
            style={{ justifyContent: 'center', width: '100%', marginTop: 16 }}
            onClick={finalizar}
            disabled={indo || comProblema > 0 || validas.length === 0}
          >
            {indo ? 'Abrindo...' : 'Finalizar compra →'}
          </button>
          <Link className="btn btn-ghost" style={{ justifyContent: 'center', width: '100%', marginTop: 8 }} href="/busca">
            Continuar comprando
          </Link>
        </aside>
      </div>
    </>
  );
}
