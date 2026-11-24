/**
 * Página "Meus pedidos" (histórico do cliente).
 * Componente CLIENT: lê `pedidos` + `itens_pedido` do próprio usuário (RLS),
 * com cache no localStorage (src/lib/usePerfil.js).
 * Mostra data, status, total e itens com titulo_livro, foto_url, quantidade
 * e preco_unitario — os dados do momento da compra.
 */
'use client';

import Link from 'next/link';
import Icone from '@/components/Icone';
import CapaLivro from '@/components/CapaLivro';
import { preco, formatarData } from '@/lib/format';
import { ROTULOS_STATUS, numeroPedido } from '@/lib/pedidos';
import { usePerfil } from '@/lib/usePerfil';

export default function MeusPedidos() {
  const { carregando, usuario, pedidos, erro } = usePerfil();

  if (carregando || !usuario) {
    return <div style={{ marginTop: 40, textAlign: 'center' }}>Carregando...</div>;
  }

  if (pedidos.length === 0) {
    return (
      <div className="vazio" style={{ marginTop: 40 }}>
        <span className="icone"><Icone nome="caixa-vazia" alt="Nenhum pedido" tam={54} /></span>
        <h2>Nenhum pedido ainda</h2>
        <p>Quando você finalizar uma compra, ela aparecerá aqui.</p>
        <Link className="btn btn-primary" href="/busca">Começar a comprar</Link>
      </div>
    );
  }

  return (
    <>
      <h1 style={{ margin: '28px 0 20px' }}><Icone nome="pacote" alt="Pedidos" tam={22} /> Meus pedidos</h1>

      {erro && <div className="toast toast-error" style={{ marginBottom: 16 }}>{erro}</div>}

      <div className="lista-pedidos">
        {pedidos.map((p) => {
          const itens = p.itens_pedido || [];
          return (
            <article key={p.id} className="painel pedido-card">
              <div className="pedido-cabecalho">
                <div>
                  <h3>Pedido {numeroPedido(p.id)}</h3>
                  <small>{formatarData(p.created_at)}</small>
                </div>
                <span className={`status-pill status-${p.status}`}>{ROTULOS_STATUS[p.status] || p.status}</span>
              </div>

              <ul className="pedido-itens">
                {itens.map((i) => (
                  <li key={i.id}>
                    <span className="pedido-item-capa">
                      <CapaLivro livro={{ id: i.livro_id, titulo: i.titulo_livro || 'Livro', autor: '' }} fotos={[i.foto_url]} />
                    </span>
                    <span className="pedido-item-titulo">{i.titulo_livro || 'Livro'}</span>
                    <span className="pedido-item-qtd">{i.quantidade} × {preco(i.preco_unitario)}</span>
                  </li>
                ))}
              </ul>

              <div className="pedido-rodape">
                <span>Total: <b>{preco(p.total)}</b></span>
                <Link className="btn btn-ghost btn-sm" href={`/meus-pedidos/${p.id}`}>Ver detalhes</Link>
              </div>
            </article>
          );
        })}
      </div>
    </>
  );
}
