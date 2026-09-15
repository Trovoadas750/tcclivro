/**
 * Página "Meus pedidos" (equivalente ao meus-pedidos.php).
 * Componente CLIENT: mostra os pedidos do usuário (localStorage;
 * em produção: tabela `pedidos` via Supabase). Inclui o pedido
 * demo (CDL-2026-001) para demonstrar a tela antes de comprar.
 */
'use client';

import Link from 'next/link';
import { useEffect, useState } from 'react';
import Icone from '@/components/Icone';
import { preco, formatarData } from '@/lib/format';
import { getPedidos } from '@/lib/clientStore';
import { PEDIDO_DEMO, ROTULOS_STATUS, LIVROS } from '@/lib/mockData';
import { createClient } from '@/lib/supabase/client';

export default function MeusPedidos() {
  const [pedidos, setPedidos] = useState([]);

  useEffect(() => {
    const supabase = createClient();

    async function carregar() {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;
      const meus = getPedidos().filter((p) => p.usuarioId === user.id);
      // Adiciona o pedido demo (dados de exemplo do banco original)
      const demo = { ...PEDIDO_DEMO, usuarioId: user.id, _demo: true };
      setPedidos([demo, ...meus]);
    }

    carregar();
  }, []);

  if (pedidos.length === 0) {
    return (
      <div className="vazio" style={{ marginTop: 40 }}>
        <span className="icone"><Icone nome="caixa-vazia" alt="Nenhum pedido" tam={54} /></span>
        <h2>Nenhum pedido ainda</h2>
        <p>Quando você finalizar uma compra, ela aparecerá aqui com o rastreio da entrega.</p>
        <Link className="btn btn-primary" href="/busca">Começar a comprar</Link>
      </div>
    );
  }

  return (
    <>
      <h1 style={{ margin: '28px 0 20px' }}><Icone nome="pacote" alt="Pedidos" tam={22} /> Meus pedidos</h1>

      <div className="painel" style={{ overflowX: 'auto' }}>
        <table className="tabela">
          <thead>
            <tr>
              <th>Código</th>
              <th>Data</th>
              <th>Itens</th>
              <th>Total</th>
              <th>Status</th>
              <th></th>
            </tr>
          </thead>
          <tbody>
            {pedidos.map((p) => {
              const resumo = p.itens
                .map((i) => {
                  const livro = LIVROS.find((l) => l.id === i.livroId);
                  return `${i.quantidade}x ${livro?.titulo || 'Livro'}`;
                })
                .join(', ');
              return (
                <tr key={p.codigo}>
                  <td><b>{p.codigo}</b>{p._demo && <span className="selo" style={{ marginLeft: 8 }}>DEMO</span>}</td>
                  <td style={{ whiteSpace: 'nowrap' }}>{formatarData(p.criadoEm)}</td>
                  <td style={{ maxWidth: 260 }}>{resumo}</td>
                  <td><b>{preco(p.total)}</b></td>
                  <td>
                    <span className={`status-pill status-${p.status}`}>
                      {ROTULOS_STATUS[p.status] || p.status}
                    </span>
                  </td>
                  <td>
                    <Link className="btn btn-ghost btn-sm" href={`/rastreio?codigo=${encodeURIComponent(p.codigo)}`}>
                      <Icone nome="caminhao" alt="Rastrear" tam={15} /> Rastrear
                    </Link>
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