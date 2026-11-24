/**
 * Hook com o usuário logado e o tipo da conta ('cliente' | 'vendedor').
 * Usado para ajustar menus e CTAs ("Tornar-se vendedor" x "Meu painel").
 *
 * Recarrega quando a janela dispara o evento 'usuario-atualizado'
 * (login, logout, cadastro e migração para vendedor) ou quando a
 * sessão muda no Supabase Auth.
 *
 * Proteção de rota/menus no front é só experiência de uso: a
 * segurança real é a RLS do banco.
 */
'use client';

import { useEffect, useState } from 'react';
import { createClient } from '@/lib/supabase/client';

export function useTipoConta() {
  const [supabase] = useState(() => createClient());
  const [estado, setEstado] = useState({ carregando: true, usuario: null, tipo: null });

  useEffect(() => {
    let ativo = true;

    async function carregar() {
      const { data: { user } } = await supabase.auth.getUser();
      if (!ativo) return;
      if (!user) {
        setEstado({ carregando: false, usuario: null, tipo: null });
        return;
      }
      const { data: perfil } = await supabase.from('profiles').select('tipo').eq('id', user.id).maybeSingle();
      if (!ativo) return;
      setEstado({ carregando: false, usuario: user, tipo: perfil?.tipo === 'vendedor' ? 'vendedor' : 'cliente' });
    }

    carregar();
    window.addEventListener('usuario-atualizado', carregar);
    const { data: { subscription } } = supabase.auth.onAuthStateChange((evento) => {
      if (evento === 'SIGNED_IN' || evento === 'SIGNED_OUT') carregar();
    });

    return () => {
      ativo = false;
      subscription.unsubscribe();
      window.removeEventListener('usuario-atualizado', carregar);
    };
  }, [supabase]);

  return { ...estado, supabase };
}
