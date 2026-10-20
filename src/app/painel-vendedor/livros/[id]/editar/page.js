/**
 * Edição de livro do vendedor (/painel-vendedor/livros/[id]/editar).
 * Componente client: o id vem de useParams(). Só encontra livros do
 * próprio vendedor (filtro por vendedor_id + RLS).
 */
'use client';

import Link from 'next/link';
import { useParams } from 'next/navigation';
import { useEffect, useState } from 'react';
import FormLivro from '@/components/vendedor/FormLivro';
import { useVendedor } from '@/lib/useVendedor';
import { ehUuid } from '@/lib/vendedor';

export default function EditarLivro() {
  const { id } = useParams();
  const { carregando, usuario, erro, supabase } = useVendedor();
  const [livro, setLivro] = useState(undefined); // undefined = carregando, null = não encontrado

  useEffect(() => {
    if (!usuario) return;
    if (!ehUuid(id)) {
      setLivro(null);
      return;
    }
    let ativo = true;
    supabase
      .from('livros')
      .select('*')
      .eq('id', id)
      .eq('vendedor_id', usuario.id)
      .maybeSingle()
      .then(({ data, error }) => {
        if (!ativo) return;
        if (error) console.error('Erro ao buscar livro:', error);
        setLivro(data || null);
      });
    return () => { ativo = false; };
  }, [supabase, usuario, id]);

  if (carregando || !usuario || livro === undefined) {
    if (erro) return <div className="toast toast-error" style={{ marginTop: 28 }}>{erro}</div>;
    return <div style={{ marginTop: 40, textAlign: 'center' }}>Carregando...</div>;
  }

  if (!livro) {
    return (
      <div className="painel vazio" style={{ marginTop: 28 }}>
        <h2>Livro não encontrado</h2>
        <p>Ele pode ter sido excluído ou não pertence à sua loja.</p>
        <Link className="btn btn-primary" href="/painel-vendedor">Voltar ao painel</Link>
      </div>
    );
  }

  return (
    <div className="pagina-form-livro">
      <nav className="breadcrumb" style={{ margin: '18px 0' }}>
        <Link href="/painel-vendedor">Painel do vendedor</Link> › <span>Editar livro</span>
      </nav>
      <h1 style={{ marginBottom: 16 }}>Editar livro</h1>
      <FormLivro supabase={supabase} usuario={usuario} livro={livro} />
    </div>
  );
}
