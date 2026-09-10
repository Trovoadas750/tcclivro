/**
 * Página de favoritos (equivalente ao favoritos.php do PHP).
 * Componente CLIENT: lista os livros favoritos salvos no
 * localStorage (em produção: tabela `favoritos` via Supabase).
 */
'use client';

import Link from 'next/link';
import { useEffect, useState } from 'react';
import Icone from '@/components/Icone';
import LivroCard from '@/components/LivroCard';
import { getFavoritos } from '@/lib/clientStore';
import { LIVROS } from '@/lib/mockData';

export default function Favoritos() {
  const [livros, setLivros] = useState([]);

  useEffect(() => {
    const ids = getFavoritos();
    setLivros(LIVROS.filter((l) => ids.includes(l.id)));
  }, []);

  return (
    <>
      <h1 style={{ margin: '28px 0 20px' }}><Icone nome="coracao" alt="Favoritos" tam={22} /> Meus favoritos</h1>

      {livros.length === 0 ? (
        <div className="vazio" style={{ marginTop: 20 }}>
          <span className="icone"><Icone nome="coracao-branco" alt="Sem favoritos" tam={54} /></span>
          <h2>Você ainda não tem favoritos</h2>
          <p>Toque no coração de qualquer livro para guardá-lo aqui.</p>
          <Link className="btn btn-primary" href="/busca">Descobrir livros</Link>
        </div>
      ) : (
        <div className="grid-livros">
          {livros.map((livro) => (
            <LivroCard key={livro.id} livro={livro} />
          ))}
        </div>
      )}
    </>
  );
}