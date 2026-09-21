/**
 * Hook compartilhado pelas telas Minha conta, Favoritos e Meus pedidos.
 * Carrega perfil + favoritos + pedidos do usuário logado usando o cache
 * do localStorage (src/lib/perfilStore.js) e só consulta o Supabase
 * quando não há cache, ele está velho, ou `recarregar()` é chamado.
 */
'use client';

import { usePathname, useRouter } from 'next/navigation';
import { useCallback, useEffect, useRef, useState } from 'react';
import { createClient } from '@/lib/supabase/client';
import {
  lerCachePerfil,
  gravarCachePerfil,
  limparCachePerfil,
  buscarPerfil,
  buscarFavoritos,
  buscarPedidos,
} from '@/lib/perfilStore';

export function usePerfil() {
  const router = useRouter();
  const pathname = usePathname();
  const [supabase] = useState(() => createClient());
  const [estado, setEstado] = useState({
    carregando: true,
    usuario: null,
    perfil: null,
    favoritos: [],
    pedidos: [],
    erro: null,
  });
  // Última versão dos dados, para gravar no cache após uma escrita.
  const dadosRef = useRef(null);

  const aplicar = useCallback((usuario, dados, extra = {}) => {
    dadosRef.current = { usuario, ...dados };
    setEstado({ carregando: false, usuario, erro: null, ...dados, ...extra });
  }, []);

  const carregar = useCallback(
    async ({ forcar = false } = {}) => {
      // getSession lê a sessão local (sem ida ao servidor); a segurança
      // real dos dados é garantida pelo RLS do banco.
      const { data: { session } } = await supabase.auth.getSession();
      const user = session?.user;

      if (!user) {
        limparCachePerfil();
        router.replace(`/auth/login?proximo=${encodeURIComponent(pathname)}`);
        return;
      }

      // lerCachePerfil apaga o cache automaticamente se for de outro usuário.
      const cache = lerCachePerfil(user.id);
      if (cache) {
        aplicar(user, { perfil: cache.perfil, favoritos: cache.favoritos, pedidos: cache.pedidos });
        if (cache.fresco && !forcar) return;
      }

      try {
        const [perfil, favoritos, pedidos] = await Promise.all([
          buscarPerfil(supabase, user.id),
          buscarFavoritos(supabase, user.id),
          buscarPedidos(supabase, user.id),
        ]);
        const dados = { perfil, favoritos, pedidos };
        gravarCachePerfil(user.id, dados);
        aplicar(user, dados);
      } catch (e) {
        // Mantém o que já estava na tela (cache antigo) e avisa do erro.
        setEstado((s) => ({
          ...s,
          carregando: false,
          usuario: user,
          erro: 'Não foi possível atualizar seus dados agora.',
        }));
        console.error('Erro ao carregar perfil:', e);
      }
    },
    [supabase, router, pathname, aplicar]
  );

  useEffect(() => {
    carregar();
  }, [carregar]);

  /** Atualiza nome/avatar no banco e no cache. Retorna { ok } ou { erro }. */
  const salvarPerfil = useCallback(
    async ({ nome, avatar_url }) => {
      const atual = dadosRef.current;
      if (!atual) return { erro: 'Sessão não carregada.' };

      const { data, error } = await supabase
        .from('profiles')
        .upsert(
          { id: atual.usuario.id, nome, avatar_url: avatar_url || null, updated_at: new Date().toISOString() },
          { onConflict: 'id' }
        )
        .select()
        .single();
      if (error) return { erro: 'Não foi possível salvar. Tente novamente.' };

      const dados = { perfil: data, favoritos: atual.favoritos, pedidos: atual.pedidos };
      gravarCachePerfil(atual.usuario.id, dados);
      aplicar(atual.usuario, dados);
      return { ok: true };
    },
    [supabase, aplicar]
  );

  /** Remove um favorito no banco e no cache. */
  const removerFavorito = useCallback(
    async (livroId) => {
      const atual = dadosRef.current;
      if (!atual) return { erro: 'Sessão não carregada.' };

      const { error } = await supabase
        .from('favoritos')
        .delete()
        .eq('user_id', atual.usuario.id)
        .eq('livro_id', livroId);
      if (error) return { erro: 'Não foi possível remover o favorito.' };

      const dados = {
        perfil: atual.perfil,
        favoritos: atual.favoritos.filter((f) => f.livro_id !== livroId),
        pedidos: atual.pedidos,
      };
      gravarCachePerfil(atual.usuario.id, dados);
      aplicar(atual.usuario, dados);
      return { ok: true };
    },
    [supabase, aplicar]
  );

  return { ...estado, recarregar: () => carregar({ forcar: true }), salvarPerfil, removerFavorito };
}
