/**
 * Página "Meus pedidos".
 * Componente CLIENT: lista os pedidos do usuário (tabela `pedidos` com
 * `itens_pedido` e `livros`), lidos do cache do localStorage quando
 * possível (ver src/lib/usePerfil.js).
 */
'use client';

import Link from 'next/link';
import Icone from '@/components/Icone';
import { preco, formatarData } from '@/lib/format';
import { usePerfil } from '@/lib/usePerfil';

const ROTULOS_STATUS_PEDIDO = {
  pendente: 'Pendente',
  pago: 'Pago',
  enviado: 'Enviado',
  entregue: 'Entregue',
  cancelado: 'Cancelado',
};

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

      <div className="painel" style={{ overflowX: 'auto' }}>
        <table className="tabela">
          <thead>
            <tr>
              <th>Pedido</th>
              <th>Data</th>
              <th>Itens</th>
              <th>Total</th>
              <th>Status</th>
            </tr>
          </thead>
          <tbody>
            {pedidos.map((p) => {
              const resumo = (p.itens_pedido || [])
                .map((i) => `${i.quantidade}x ${i.livros?.titulo || 'Livro'} (${preco(i.preco_unitario)})`)
                .join(', ');
              return (
                <tr key={p.id}>
                  <td><b>#{p.id.slice(0, 8).toUpperCase()}</b></td>
                  <td style={{ whiteSpace: 'nowrap' }}>{formatarData(p.created_at)}</td>
                  <td style={{ maxWidth: 320 }}>{resumo}</td>
                  <td><b>{preco(p.total)}</b></td>
                  <td>
                    <span className={`status-pill status-${p.status}`}>
                      {ROTULOS_STATUS_PEDIDO[p.status] || p.status}
                    </span>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </>
  );
}
