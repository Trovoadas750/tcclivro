/**
 * Página de rastreio da entrega (equivalente ao rastreio.php).
 * Componente CLIENT: busca o pedido por código (localStorage;
 * em produção: tabelas `pedidos` e `rastreio` via Supabase).
 */
'use client';

import Link from 'next/link';
import { useSearchParams } from 'next/navigation';
import { Suspense, useEffect, useState } from 'react';
import Icone from '@/components/Icone';
import CapaLivro from '@/components/CapaLivro';
import { preco, formatarData } from '@/lib/format';
import { buscarPedidoPorCodigo, getUsuario } from '@/lib/clientStore';
import { PEDIDO_DEMO, ETAPAS_RASTREIO, LIVROS } from '@/lib/mockData';

function ConteudoRastreio() {
  const searchParams = useSearchParams();
  const codigo = searchParams.get('codigo') || '';
  const [pedido, setPedido] = useState(null);

  useEffect(() => {
    const usuario = getUsuario();
    if (!usuario) return;

    // Pedido real (localStorage) ou o pedido demo
    const pedidoReal = buscarPedidoPorCodigo(codigo);
    if (pedidoReal) {
      setPedido(pedidoReal);
    } else if (codigo === PEDIDO_DEMO.codigo) {
      setPedido(PEDIDO_DEMO);
    }
  }, [codigo]);

  if (!pedido) {
    return (
      <div className="vazio" style={{ marginTop: 40 }}>
        <span className="icone"><Icone nome="buscar" alt="Não encontrado" tam={54} /></span>
        <h2>Pedido não encontrado</h2>
        <p>Verifique o código informado.</p>
        <Link className="btn btn-primary" href="/meus-pedidos">Voltar aos pedidos</Link>
      </div>
    );
  }

  const posicaoAtual = ETAPAS_RASTREIO.findIndex((e) => e.chave === pedido.status);
  const etapaAtual = ETAPAS_RASTREIO[posicaoAtual];

  return (
    <>
      <div style={{ margin: '28px 0' }}>
        <Link className="btn btn-ghost btn-sm" href="/meus-pedidos">← Voltar aos pedidos</Link>
      </div>

      <div className="painel">
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 10 }}>
          <div>
            <h1 style={{ fontSize: 24 }}><Icone nome="pacote" alt="Pedido" tam={20} /> Pedido {pedido.codigo}</h1>
            <p style={{ color: 'var(--muted)', fontSize: 14 }}>
              Realizado em {formatarData(pedido.criadoEm)} · Pagamento: <b>{pedido.formaPagamento}</b>
            </p>
          </div>
          <span className={`status-pill status-${pedido.status}`} style={{ fontSize: 14 }}>
            {etapaAtual?.label || pedido.status}
          </span>
        </div>

        {/* Linha de etapas */}
        <div className="etapas" style={{ marginTop: 30 }}>
          {ETAPAS_RASTREIO.map((etapa, i) => {
            const classe = i < posicaoAtual ? 'feita' : i === posicaoAtual ? 'atual' : '';
            return (
              <div key={etapa.chave} className={`etapa ${classe}`}>
                <div className="bolinha">
                  {i <= posicaoAtual ? <Icone nome={etapa.icone} alt={etapa.label} tam={17} /> : '·'}
                </div>
                <span>{etapa.label}</span>
                {i <= posicaoAtual && <small>{i === posicaoAtual ? 'hoje' : 'concluída'}</small>}
              </div>
            );
          })}
        </div>
      </div>

      <div className="layout-2col" style={{ marginTop: 24 }}>
        {/* Histórico do envio */}
        <div className="painel">
          <h3 style={{ marginBottom: 16 }}><Icone nome="caminhao" alt="Histórico" tam={17} /> Histórico do envio</h3>
          <ul className="timeline">
            {(pedido.rastreio || []).map((ev, i) => (
              <li key={i} className="feito">
                <b>{ev.etapa}</b>
                <div>{ev.descricao}</div>
                <small>{ev.local ? `${ev.local} · ` : ''}{formatarData(ev.dataEvento)}</small>
              </li>
            ))}
          </ul>
          <p style={{ fontSize: 12.5, color: 'var(--muted)', marginTop: 10 }}>
            <Icone nome="info" alt="Informação" tam={14} /> Rastreio simulado para fins de demonstração do sistema.
          </p>
        </div>

        <aside>
          <div className="painel">
            <h3 style={{ marginBottom: 12 }}>Conteúdo do pedido</h3>
            {(pedido.itens || []).map((i) => {
              const livro = LIVROS.find((l) => l.id === i.livroId);
              return (
                <div key={i.livroId} style={{ display: 'flex', gap: 12, alignItems: 'center', padding: '10px 0', borderBottom: '1px solid var(--line)' }}>
                  {livro && <div className="capa-mini"><CapaLivro livro={livro} largura="42px" /></div>}
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <b style={{ fontSize: 13, display: 'block' }}>{livro?.titulo || `Livro #${i.livroId}`}</b>
                    <small style={{ color: 'var(--muted)' }}>{i.quantidade}× {preco(i.preco)}</small>
                  </div>
                </div>
              );
            })}
            <div className="linha-resumo"><span>Subtotal</span><span>{preco(pedido.subtotal)}</span></div>
            <div className="linha-resumo">
              <span>Frete</span>
              <span>{pedido.frete === 0 ? 'Grátis' : preco(pedido.frete)}</span>
            </div>
            <div className="linha-resumo total"><span>Total</span><span>{preco(pedido.total)}</span></div>
          </div>

          <div className="painel margem">
            <h3 style={{ marginBottom: 8 }}><Icone nome="local" alt="Entrega" tam={16} /> Entrega</h3>
            <p style={{ fontSize: 14 }}>
              {pedido.endereco}<br />{pedido.cidade} - {pedido.uf}
            </p>
          </div>
        </aside>
      </div>
    </>
  );
}

export default function Rastreio() {
  return (
    <Suspense fallback={<div style={{ marginTop: 40 }}>Carregando...</div>}>
      <ConteudoRastreio />
    </Suspense>
  );
}