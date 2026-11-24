/**
 * Card de um livro indicado pela IA (página /recomendar e chatbot).
 * Os dados (título, preço, estoque, foto, loja) vêm do banco; só o
 * `motivo` foi escrito pela IA.
 *
 *  - "Ver livro" → /livro/[id]
 *  - "Adicionar ao carrinho" (funciona deslogado); estoque 0 → "Esgotado";
 *    livro do próprio vendedor logado → "Este livro é seu".
 *  - compacto: versão menor para o chatbot.
 */
'use client';

import Link from 'next/link';
import Icone from '@/components/Icone';
import CapaLivro from '@/components/CapaLivro';
import { preco } from '@/lib/format';
import { adicionarAoCarrinho } from '@/lib/clientStore';
import { useFavoritos } from '@/lib/favoritos';

export default function CardRecomendacao({ livro, compacto = false }) {
  const { usuarioId } = useFavoritos();
  const esgotado = !(livro.estoque > 0);
  const meuLivro = Boolean(usuarioId && usuarioId === livro.vendedor_id);
  const href = `/livro/${livro.id}`;

  function adicionar() {
    adicionarAoCarrinho(livro.id, 1);
    window.showToast?.({
      titulo: 'Adicionado ao carrinho',
      descricao: livro.titulo,
      livro,
      acao: { rotulo: 'Ver carrinho', href: '/carrinho' },
    });
  }

  let botaoCompra;
  if (meuLivro) {
    botaoCompra = <span className="btn btn-ghost btn-sm" aria-disabled="true">Este livro é seu</span>;
  } else if (esgotado) {
    botaoCompra = <button className="btn btn-primary btn-sm" type="button" disabled>Esgotado</button>;
  } else {
    botaoCompra = (
      <button className="btn btn-primary btn-sm" type="button" onClick={adicionar}>
        <Icone nome="carrinho" alt="" tam={14} /> {compacto ? 'Adicionar' : 'Adicionar ao carrinho'}
      </button>
    );
  }

  return (
    <article className={`card-recomendacao ${compacto ? 'compacto' : ''}`}>
      <Link className="card-recomendacao-capa" href={href} tabIndex={-1} aria-hidden="true">
        <CapaLivro livro={livro} />
      </Link>
      <div className="card-recomendacao-corpo">
        <h3 className="card-titulo"><Link href={href}>{livro.titulo}</Link></h3>
        <div className="card-autor">{livro.autor}</div>
        {!compacto && livro.lojas?.nome_loja && <small className="card-loja">Loja: {livro.lojas.nome_loja}</small>}
        <div className="preco">{preco(livro.preco)}</div>
        {livro.motivo && (
          <p className="card-motivo"><Icone nome="faiscas" alt="" tam={13} /> {livro.motivo}</p>
        )}
        <div className="card-recomendacao-acoes">
          <Link className="btn btn-ghost btn-sm" href={href}>Ver livro</Link>
          {botaoCompra}
        </div>
      </div>
    </article>
  );
}
