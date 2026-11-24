/**
 * Finalizar compra (/checkout): resumo + "Confirmar pedido".
 * Componente CLIENT. Sem formulário de cartão nem de endereço (pagamento e
 * entrega ainda não existem nesta versão).
 *
 *  - Rota protegida pelo proxy (deslogado vai para o login).
 *  - Confirmar → rpc('finalizar_pedido', { p_itens }) com só livro_id e
 *    quantidade. O banco calcula preço e total, valida estoque e baixa o
 *    estoque. Erro P0001 → a mensagem do banco (já em português).
 *  - Sucesso → limpa o carrinho e abre a confirmação (/meus-pedidos/[id]).
 */
'use client';

import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useState } from 'react';
import Icone from '@/components/Icone';
import CapaLivro from '@/components/CapaLivro';
import { preco } from '@/lib/format';
import { limparCarrinho } from '@/lib/clientStore';
import { finalizarPedido } from '@/lib/pedidos';
import { invalidarCachePerfil } from '@/lib/perfilStore';
import { useCarrinho } from '@/lib/useCarrinho';

export default function Checkout() {
  const router = useRouter();
  const { supabase, lendo, vazio, linhas, validas, comProblema, subtotal, qtdTotal, erro: erroCarrinho, avisos } = useCarrinho();
  const [enviando, setEnviando] = useState(false);
  const [concluido, setConcluido] = useState(false);
  const [erro, setErro] = useState(null);

  async function confirmar() {
    if (enviando) return;
    setEnviando(true);
    setErro(null);

    const r = await finalizarPedido(supabase, validas);
    if (r.erro) {
      setErro(r.erro);
      setEnviando(false);
      return;
    }

    // Pedido criado: o carrinho esvazia e o histórico precisa ser relido.
    setConcluido(true);
    limparCarrinho();
    invalidarCachePerfil();
    router.replace(`/meus-pedidos/${r.pedidoId}?novo=1`);
  }

  if (concluido) {
    return <div style={{ marginTop: 40, textAlign: 'center' }}>Pedido confirmado! Abrindo os detalhes...</div>;
  }
  if (lendo) {
    return <div style={{ marginTop: 40, textAlign: 'center' }}>Carregando...</div>;
  }
  if (vazio) {
    return (
      <div className="vazio" style={{ marginTop: 40 }}>
        <span className="icone"><Icone nome="carrinho" alt="" tam={54} /></span>
        <h2>Seu carrinho está vazio</h2>
        <p>Adicione livros antes de finalizar a compra.</p>
        <Link className="btn btn-primary" href="/busca">Explorar catálogo</Link>
      </div>
    );
  }
  if (comProblema > 0) {
    return (
      <div className="vazio" style={{ marginTop: 40 }}>
        <span className="icone"><Icone nome="info" alt="" tam={54} /></span>
        <h2>Alguns itens precisam de atenção</h2>
        <p>Há livros indisponíveis, esgotados ou da sua própria loja no carrinho. Remova-os para continuar.</p>
        <Link className="btn btn-primary" href="/carrinho">Voltar ao carrinho</Link>
      </div>
    );
  }

  return (
    <>
      <h1 style={{ margin: '28px 0 20px' }}><Icone nome="pacote" alt="" tam={22} /> Finalizar compra</h1>

      {(erro || erroCarrinho) && <div className="toast toast-error" role="alert">{erro || erroCarrinho}</div>}
      {avisos.length > 0 && (
        <div className="toast toast-warning" role="status">
          {avisos.map((a) => <div key={a}>{a}</div>)}
        </div>
      )}

      <div className="layout-2col">
        <section className="painel">
          <h3 style={{ marginBottom: 6 }}>Itens do pedido</h3>
          {linhas.map(({ livro_id, quantidade, livro }) => (
            <div key={livro_id} className="cart-item">
              <div className="cart-capa"><CapaLivro livro={livro} /></div>
              <div className="cart-info">
                <h3>{livro.titulo}</h3>
                <div className="autor">{livro.autor}</div>
                {livro.lojas?.nome_loja && <small className="card-loja">Loja: {livro.lojas.nome_loja}</small>}
              </div>
              <div style={{ textAlign: 'right', minWidth: 110 }}>
                <small style={{ color: 'var(--muted)' }}>{quantidade} × {preco(livro.preco)}</small>
                <div style={{ fontWeight: 800 }}>{preco(Number(livro.preco) * quantidade)}</div>
              </div>
            </div>
          ))}
          <Link className="btn btn-ghost btn-sm" href="/carrinho" style={{ marginTop: 10 }}>← Alterar itens no carrinho</Link>
        </section>

        <aside className="painel resumo-carrinho">
          <h3 style={{ marginBottom: 6 }}>Resumo</h3>
          <div className="linha-resumo"><span>Itens</span><span>{qtdTotal}</span></div>
          <div className="linha-resumo total"><span>Total</span><span>{preco(subtotal)}</span></div>
          <p style={{ color: 'var(--muted)', fontSize: 12.5, marginTop: 8 }}>
            O total final é calculado pela loja no momento da confirmação, com os preços atuais.
          </p>
          <button
            className="btn btn-success"
            type="button"
            onClick={confirmar}
            disabled={enviando || validas.length === 0}
            style={{ justifyContent: 'center', width: '100%', marginTop: 16, padding: 14 }}
          >
            {enviando ? 'Confirmando pedido...' : 'Confirmar pedido'}
          </button>
          <p className="nota-demo">
            <Icone nome="info" alt="" tam={14} /> Pagamento e entrega ainda não estão disponíveis nesta versão.
          </p>
        </aside>
      </div>
    </>
  );
}
