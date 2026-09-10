/**
 * Página do carrinho (equivalente ao carrinho.php do PHP).
 * Componente CLIENT: lê o carrinho do localStorage e monta os
 * itens a partir do catálogo (em modo demo, de src/lib/mockData.js;
 * com banco ativo, os itens viriam de /api/carrinho + repositório).
 */
'use client';

import Link from 'next/link';
import { useEffect, useState } from 'react';
import Icone from '@/components/Icone';
import CapaLivro from '@/components/CapaLivro';
import { preco } from '@/lib/format';
import {
  getCarrinho,
  atualizarQtdCarrinho,
  removerDoCarrinho,
} from '@/lib/clientStore';
import { LIVROS } from '@/lib/mockData';

export default function Carrinho() {
  const [itens, setItens] = useState([]);

  useEffect(() => {
    carregar();
    const atualizar = () => carregar();
    window.addEventListener('carrinho-atualizado', atualizar);
    window.addEventListener('storage', atualizar);
    return () => {
      window.removeEventListener('carrinho-atualizado', atualizar);
      window.removeEventListener('storage', atualizar);
    };
  }, []);

  function carregar() {
    // Junta itens do carrinho com os dados do catálogo
    const carrinho = getCarrinho()
      .map((i) => {
        const livro = LIVROS.find((l) => l.id === i.livroId);
        return livro ? { ...i, livro } : null;
      })
      .filter(Boolean);
    setItens(carrinho);
  }

  const subtotal = itens.reduce((s, i) => s + i.livro.preco * i.quantidade, 0);
  const qtdTotal = itens.reduce((s, i) => s + i.quantidade, 0);

  if (itens.length === 0) {
    return (
      <div className="vazio" style={{ marginTop: 40 }}>
        <span className="icone"><Icone nome="carrinho" alt="Carrinho" tam={54} /></span>
        <h2>Seu carrinho está vazio</h2>
        <p>Explore o catálogo ou peça uma recomendação para a nossa IA.</p>
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

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 320px', gap: 24, alignItems: 'start', flexWrap: 'wrap' }}>
        <div className="painel">
          {itens.map((i) => (
            <div key={i.livro.id} className="cart-item">
              <div className="cart-capa">
                <CapaLivro livro={i.livro} largura="100%" />
              </div>
              <div className="cart-info">
                <h3><Link href={`/produto/${i.livro.id}`}>{i.livro.titulo}</Link></h3>
                <div className="autor">{i.livro.autor}</div>
                <div className="preco" style={{ marginTop: 6 }}>{preco(i.livro.preco)}</div>
              </div>
              <div className="qtd-controle" data-item={i.livro.id}>
                <button
                  className="qtd-menos"
                  onClick={() => {
                    atualizarQtdCarrinho(i.livro.id, i.quantidade - 1);
                    carregar();
                  }}
                >−</button>
                <span className="qtd-valor">{i.quantidade}</span>
                <button
                  className="qtd-mais"
                  onClick={() => {
                    atualizarQtdCarrinho(i.livro.id, i.quantidade + 1);
                    carregar();
                  }}
                >+</button>
              </div>
              <div style={{ fontWeight: 800, minWidth: 90, textAlign: 'right' }}>
                {preco(i.livro.preco * i.quantidade)}
              </div>
              <button
                className="btn btn-ghost btn-sm remover-item"
                title="Remover"
                onClick={() => {
                  removerDoCarrinho(i.livro.id);
                  carregar();
                }}
              >
                <Icone nome="lixeira" alt="Remover" tam={16} />
              </button>
            </div>
          ))}
        </div>

        <aside className="painel resumo-carrinho">
          <h3 style={{ marginBottom: 6 }}>Resumo</h3>
          <div className="linha-resumo"><span>Itens</span><span>{qtdTotal}</span></div>
          <div className="linha-resumo"><span>Subtotal</span><span>{preco(subtotal)}</span></div>
          <div className="linha-resumo"><span>Frete</span><span>Calculado no checkout</span></div>
          <div className="linha-resumo"><span>Desconto</span><span style={{ color: 'var(--success)' }}>—</span></div>
          <div className="linha-resumo total"><span>Total</span><span>{preco(subtotal)}</span></div>
          <Link className="btn btn-primary" style={{ justifyContent: 'center', width: '100%', marginTop: 16 }} href="/checkout">
            Finalizar compra →
          </Link>
          <Link className="btn btn-ghost" style={{ justifyContent: 'center', width: '100%', marginTop: 8 }} href="/busca">
            Continuar comprando
          </Link>
        </aside>
      </div>
    </>
  );
}