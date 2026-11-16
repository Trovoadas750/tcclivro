/**
 * Seção "Direto dos vendedores" da página inicial.
 * Lista os livros ATIVOS cadastrados pelos vendedores (tabela `livros`
 * no Supabase), mais recentes primeiro. Funciona deslogado (vitrine
 * pública pela RLS). Se não houver livros ou der erro, a seção some —
 * o catálogo de demonstração continua igual.
 */
'use client';

import Link from 'next/link';
import { useEffect, useState } from 'react';
import Icone from '@/components/Icone';
import { preco } from '@/lib/format';
import { createClient } from '@/lib/supabase/client';
import { fotosDoLivro } from '@/lib/vendedor';

export default function VitrineVendedores({ limite = 8 }) {
  const [livros, setLivros] = useState([]);

  useEffect(() => {
    let ativo = true;
    const supabase = createClient();
    supabase
      .from('livros')
      .select('*, lojas(nome_loja)')
      .eq('ativo', true)
      .order('created_at', { ascending: false })
      .limit(limite)
      .then(({ data, error }) => {
        if (!ativo) return;
        if (error) {
          console.error('Erro ao carregar vitrine dos vendedores:', error);
          return;
        }
        setLivros(data || []);
      });
    return () => { ativo = false; };
  }, [limite]);

  if (livros.length === 0) return null;

  return (
    <section className="secao">
      <div className="secao-titulo">
        <h2><Icone nome="novo" alt="" tam={20} /> Direto dos vendedores</h2>
        <Link className="link" href="/vendedor/cadastro">Quero vender também →</Link>
      </div>
      <div className="grid-livros">
        {livros.map((livro) => {
          const [capa] = fotosDoLivro(livro);
          return (
            <article key={livro.id} className="card-livro">
              <Link className="capa" href={`/livro/${livro.id}`}>
                {capa ? (
                  <img src={capa} alt={livro.titulo} loading="lazy" />
                ) : (
                  <span className="galeria-vazia" style={{ height: '100%' }}><Icone nome="livros" alt="" tam={44} /></span>
                )}
              </Link>
              <div className="card-corpo">
                <h3 className="card-titulo"><Link href={`/livro/${livro.id}`}>{livro.titulo}</Link></h3>
                <div className="card-autor">{livro.autor}</div>
                {livro.lojas?.nome_loja && <small className="card-loja">Loja: {livro.lojas.nome_loja}</small>}
                <div className="card-preco">
                  <span className="preco">{preco(livro.preco)}</span>
                </div>
              </div>
              <div className="card-acoes">
                <Link className="btn btn-primary btn-sm" href={`/livro/${livro.id}`}>Ver detalhes</Link>
              </div>
            </article>
          );
        })}
      </div>
    </section>
  );
}
