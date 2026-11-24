/**
 * ============================================================
 *  FAVORITOS (tabela `favoritos` no Supabase)
 * ============================================================
 *  Hook usado pelo coração dos cards. Os ids favoritados do usuário
 *  logado são lidos UMA vez e compartilhados por todos os cards da
 *  página (cache em memória, por usuário).
 *
 *  Regras (BDcontexto.md, 5.4 e seção 10):
 *   - insert envia user_id (o banco não preenche sozinho);
 *   - erro 23505 (já favoritado) é tratado como sucesso;
 *   - deslogado → vai para o login e volta para a mesma página;
 *   - a RLS garante que cada um só vê/altera os próprios.
 */
'use client';

import { useRouter } from 'next/navigation';
import { useCallback, useEffect, useState } from 'react';
import { createClient } from '@/lib/supabase/client';
import { invalidarCachePerfil } from '@/lib/perfilStore';
import { comProximo } from '@/lib/redirecionamento';

/** Estado compartilhado entre todos os componentes que usam o hook. */
let cache = { userId: undefined, ids: new Set(), carregando: null };
const ouvintes = new Set();

function notificar() {
  ouvintes.forEach((fn) => fn());
}

async function carregar(supabase) {
  const { data: { session } } = await supabase.auth.getSession();
  const userId = session?.user?.id || null;

  if (cache.userId === userId && cache.carregando) return cache.carregando;

  cache = { userId, ids: new Set(), carregando: null };
  if (!userId) {
    cache.carregando = Promise.resolve();
    notificar();
    return cache.carregando;
  }

  cache.carregando = supabase
    .from('favoritos')
    .select('livro_id')
    .eq('user_id', userId)
    .then(({ data, error }) => {
      if (error) {
        console.error('Erro ao carregar favoritos:', error.message);
        return;
      }
      if (cache.userId === userId) cache.ids = new Set((data || []).map((f) => f.livro_id));
      notificar();
    });
  return cache.carregando;
}

/**
 * Atualiza o cache em memória quando outra tela muda um favorito
 * (ex.: "Remover" em /favoritos).
 */
export function sincronizarFavorito(livroId, favoritado) {
  if (favoritado) cache.ids.add(livroId);
  else cache.ids.delete(livroId);
  notificar();
}

export function useFavoritos() {
  const router = useRouter();
  const [supabase] = useState(() => createClient());
  const [, setVersao] = useState(0);

  useEffect(() => {
    const atualizar = () => setVersao((v) => v + 1);
    ouvintes.add(atualizar);
    carregar(supabase);

    // Login/logout: descarta o cache e lê de novo para o novo usuário.
    const recarregar = () => {
      cache = { userId: undefined, ids: new Set(), carregando: null };
      carregar(supabase);
    };
    window.addEventListener('usuario-atualizado', recarregar);
    return () => {
      ouvintes.delete(atualizar);
      window.removeEventListener('usuario-atualizado', recarregar);
    };
  }, [supabase]);

  const ehFavorito = useCallback((livroId) => cache.ids.has(livroId), []);

  /**
   * Liga/desliga o favorito.
   * @returns {{ favoritado?: boolean, erro?: string, redirecionou?: boolean }}
   */
  const alternar = useCallback(
    async (livroId) => {
      const { data: { session } } = await supabase.auth.getSession();
      const user = session?.user;
      if (!user) {
        const aqui = window.location.pathname + window.location.search;
        router.push(comProximo('/auth/login', aqui));
        return { redirecionou: true };
      }

      if (cache.ids.has(livroId)) {
        const { error } = await supabase.from('favoritos').delete().eq('user_id', user.id).eq('livro_id', livroId);
        if (error) {
          console.error('Erro ao remover favorito:', error.message);
          return { erro: 'Não foi possível remover dos favoritos.' };
        }
        cache.ids.delete(livroId);
      } else {
        const { error } = await supabase.from('favoritos').insert({ user_id: user.id, livro_id: livroId });
        // 23505 = já estava nos favoritos (outra aba, clique duplo): é sucesso.
        if (error && error.code !== '23505') {
          console.error('Erro ao favoritar:', error.message);
          return { erro: 'Não foi possível adicionar aos favoritos.' };
        }
        cache.ids.add(livroId);
      }

      invalidarCachePerfil(); // a tela /favoritos busca a lista nova
      notificar();
      return { favoritado: cache.ids.has(livroId) };
    },
    [supabase, router]
  );

  // usuarioId: id do usuário logado (null deslogado, undefined enquanto carrega).
  // Reaproveitado pelos cards para mostrar "Este livro é seu" sem outra consulta.
  return { ehFavorito, alternar, usuarioId: cache.userId };
}
