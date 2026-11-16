/**
 * Cadastro de livro do vendedor (/painel-vendedor/livros/novo).
 */
'use client';

import Link from 'next/link';
import FormLivro from '@/components/vendedor/FormLivro';
import { useVendedor } from '@/lib/useVendedor';

export default function NovoLivro() {
  const { carregando, usuario, loja, erro, supabase } = useVendedor();

  if (carregando || !usuario) {
    return <div style={{ marginTop: 40, textAlign: 'center' }}>Carregando...</div>;
  }
  if (erro) {
    return <div className="toast toast-error" style={{ marginTop: 28 }}>{erro}</div>;
  }
  if (!loja) {
    return (
      <div className="painel vazio" style={{ marginTop: 28 }}>
        <h2>Crie sua loja antes de cadastrar livros</h2>
        <Link className="btn btn-accent" href="/painel-vendedor">Criar minha loja</Link>
      </div>
    );
  }

  return (
    <div className="pagina-form-livro">
      <nav className="breadcrumb" style={{ margin: '18px 0' }}>
        <Link href="/painel-vendedor">Painel do vendedor</Link> › <span>Cadastrar livro</span>
      </nav>
      <h1 style={{ marginBottom: 16 }}>Cadastrar livro</h1>
      <FormLivro supabase={supabase} usuario={usuario} />
    </div>
  );
}
