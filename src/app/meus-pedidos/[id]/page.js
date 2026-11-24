/**
 * Detalhe de um pedido (/meus-pedidos/[id]) — também é a confirmação
 * mostrada logo depois de finalizar a compra (?novo=1).
 * Componente CLIENT: a RLS só devolve pedidos do próprio usuário.
 * Itens com titulo_livro e foto_url gravados no momento da compra.
 */
'use client';

import Link from 'next/link';
import { useParams, useSearchParams } from 'next/navigation';
import { Suspense, useEffect, useState } from 'react';
import Icone from '@/components/Icone';
import CapaLivro from '@/components/CapaLivro';
import { formatarData, preco } from '@/lib/format';
import { ROTULOS_STATUS, buscarPedido, numeroPedido } from '@/lib/pedidos';
import { createClient } from '@/lib/supabase/client';
import { ehUuid } from '@/lib/vendedor';

function DetalhePedido() {
  const { id } = useParams();
  const novo = useSearchParams().get('novo') === '1';
  const [pedido, setPedido] = useState(undefined); // undefined = carregando, null = não achou

  useEffect(() => {
    if (!ehUuid(id)) {
      setPedido(null);
      return;
    }
    let ativo = true;
    buscarPedido(createClient(), id).then((p) => ativo && setPedido(p));
    return () => { ativo = false; };
  }, [id]);

  if (pedido === undefined) {
    return <div style={{ marginTop: 40, textAlign: 'center' }}>Carregando pedido...</div>;
  }
  if (!pedido) {
    return (
      <div className="vazio" style={{ marginTop: 40 }}>
        <span className="icone"><Icone nome="buscar" alt="" tam={54} /></span>
        <h2>Pedido não encontrado</h2>
        <p>Ele não existe ou não pertence à sua conta.</p>
        <Link className="btn btn-primary" href="/meus-pedidos">Ver meus pedidos</Link>
      </div>
    );
  }

  const itens = pedido.itens_pedido || [];
  const qtd = itens.reduce((s, i) => s + i.quantidade, 0);

  return (
    <div style={{ maxWidth: 820, margin: '0 auto' }}>
      {novo && (
        <div className="painel pedido-confirmado">
          <Icone nome="confete" alt="" tam={40} />
          <div>
            <h1>Pedido confirmado!</h1>
            <p>Recebemos seu pedido {numeroPedido(pedido.id)}. Os livros já foram reservados no estoque.</p>
          </div>
        </div>
      )}

      <nav className="breadcrumb" style={{ margin: '18px 0' }}>
        <Link href="/meus-pedidos">Meus pedidos</Link> › <span>Pedido {numeroPedido(pedido.id)}</span>
      </nav>

      <section className="painel">
        <div className="pedido-cabecalho">
          <div>
            <h2>Pedido {numeroPedido(pedido.id)}</h2>
            <small>Feito em {formatarData(pedido.created_at)}</small>
          </div>
          <span className={`status-pill status-${pedido.status}`}>{ROTULOS_STATUS[pedido.status] || pedido.status}</span>
        </div>

        {itens.map((item) => (
          <div key={item.id} className="cart-item">
            <div className="cart-capa">
              <CapaLivro livro={{ id: item.livro_id, titulo: item.titulo_livro || 'Livro', autor: '' }} fotos={[item.foto_url]} />
            </div>
            <div className="cart-info">
              <h3>{item.titulo_livro || 'Livro'}</h3>
              <div className="autor">{item.quantidade} × {preco(item.preco_unitario)}</div>
            </div>
            <div style={{ fontWeight: 800, minWidth: 90, textAlign: 'right' }}>
              {preco(Number(item.preco_unitario) * item.quantidade)}
            </div>
          </div>
        ))}

        <div className="linha-resumo"><span>Itens</span><span>{qtd}</span></div>
        <div className="linha-resumo total"><span>Total</span><span>{preco(pedido.total)}</span></div>

        <p className="nota-demo">
          <Icone nome="info" alt="" tam={14} /> Pagamento e entrega ainda não estão disponíveis nesta versão.
        </p>
      </section>

      <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap', margin: '20px 0' }}>
        <Link className="btn btn-primary" href="/meus-pedidos">Ver meus pedidos</Link>
        <Link className="btn btn-ghost" href="/busca">Continuar comprando</Link>
      </div>
    </div>
  );
}

export default function PaginaPedido() {
  // useSearchParams exige um limite de Suspense.
  return (
    <Suspense fallback={<div style={{ marginTop: 40, textAlign: 'center' }}>Carregando pedido...</div>}>
      <DetalhePedido />
    </Suspense>
  );
}
