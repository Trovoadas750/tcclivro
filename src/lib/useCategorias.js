/**
 * Categorias do catálogo para menus (cabeçalho e menu do celular).
 *   rpc categorias_disponiveis() → [{ categoria, livros }]
 * Lidas uma vez por aba e compartilhadas entre os componentes.
 */
'use client';

import { useEffect, useState } from 'react';
import { createClient } from '@/lib/supabase/client';

let cache = null; // Promise<[{ categoria, livros }]>

function carregarCategorias() {
  if (!cache) {
    cache = createClient()
      .rpc('categorias_disponiveis')
      .then(({ data, error }) => {
        if (error) {
          console.error('Erro ao carregar categorias:', error.message);
          cache = null; // tenta de novo numa próxima montagem
          return [];
        }
        return (data || []).filter((c) => c.categoria);
      });
  }
  return cache;
}

export function useCategorias() {
  const [categorias, setCategorias] = useState([]);
  useEffect(() => {
    let ativo = true;
    carregarCategorias().then((lista) => ativo && setCategorias(lista));
    return () => { ativo = false; };
  }, []);
  return categorias;
}
