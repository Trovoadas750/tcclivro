/**
 * Hook das telas do vendedor (/painel-vendedor/...).
 *
 *  - Deslogado → /auth/login (com ?proximo=).
 *  - Cliente   → / (com aviso).
 *  - Vendedor  → carrega perfil e loja.
 *
 * Se o vendedor ainda não tem loja mas informou o nome dela no cadastro
 * (metadados nome_loja/descricao_loja), a loja é criada automaticamente.
 *
 * Proteção de rota aqui é só experiência de uso: a segurança real é a
 * RLS do banco (BDcontexto.md, regra 14).
 */
'use client';

import { usePathname, useRouter } from 'next/navigation';
import { useCallback, useEffect, useState } from 'react';
import { createClient } from '@/lib/supabase/client';
import { mensagemErroVendedor } from '@/lib/vendedor';

export function useVendedor() {
  const router = useRouter();
  const pathname = usePathname();
  const [supabase] = useState(() => createClient());
  const [estado, setEstado] = useState({
    carregando: true,
    usuario: null,
    perfil: null,
    loja: null,
    erro: null,
  });

  const buscarLoja = useCallback(
    async (userId) => {
      const { data, error } = await supabase
        .from('lojas')
        .select('vendedor_id, nome_loja, descricao, created_at')
        .eq('vendedor_id', userId)
        .maybeSingle();
      if (error) throw error;
      return data;
    },
    [supabase]
  );

  const carregar = useCallback(async () => {
    const { data: { session } } = await supabase.auth.getSession();
    const user = session?.user;

    if (!user) {
      router.replace(`/auth/login?proximo=${encodeURIComponent(pathname)}`);
      return;
    }

    try {
      const { data: perfil, error } = await supabase
        .from('profiles')
        .select('nome, avatar_url, tipo')
        .eq('id', user.id)
        .maybeSingle();
      if (error) throw error;

      if (perfil?.tipo !== 'vendedor') {
        window.showToast?.('A área do vendedor é exclusiva para contas de vendedor.', 'warning');
        router.replace('/');
        return;
      }

      let loja = await buscarLoja(user.id);

      // Primeiro acesso: cria a loja com os dados informados no cadastro.
      const meta = user.user_metadata || {};
      if (!loja && meta.nome_loja) {
        const { error: erroLoja } = await supabase
          .from('lojas')
          .insert({ nome_loja: String(meta.nome_loja).trim(), descricao: meta.descricao_loja?.trim() || null });
        // 23505 = já existe (ex.: duas abas abertas); qualquer outro erro
        // apenas deixa o formulário "Criar minha loja" visível.
        if (!erroLoja || erroLoja.code === '23505') {
          loja = await buscarLoja(user.id);
          if (loja && !erroLoja) window.showToast?.(`Sua loja "${loja.nome_loja}" foi criada!`);
        }
      }

      setEstado({ carregando: false, usuario: user, perfil, loja, erro: null });
    } catch (e) {
      console.error('Erro ao carregar área do vendedor:', e);
      setEstado((s) => ({
        ...s,
        carregando: false,
        usuario: user,
        erro: 'Não foi possível carregar seus dados agora. Tente recarregar a página.',
      }));
    }
  }, [supabase, router, pathname, buscarLoja]);

  useEffect(() => {
    carregar();
  }, [carregar]);

  /** Cria (se não existir) ou edita a loja. Retorna { ok } ou { erro }. */
  const salvarLoja = useCallback(
    async ({ nome_loja, descricao }) => {
      const usuario = estado.usuario;
      if (!usuario) return { erro: 'Sessão não carregada.' };

      const valores = { nome_loja: nome_loja.trim(), descricao: descricao?.trim() || null };
      // Não enviar vendedor_id: o banco preenche com auth.uid().
      const consulta = estado.loja
        ? supabase.from('lojas').update(valores).eq('vendedor_id', usuario.id).select().maybeSingle()
        : supabase.from('lojas').insert(valores).select().single();

      const { data, error } = await consulta;
      if (error) return { erro: mensagemErroVendedor(error) };
      if (!data) return { erro: 'Você não pode alterar esta loja.' };

      setEstado((s) => ({ ...s, loja: data }));
      return { ok: true };
    },
    [supabase, estado.usuario, estado.loja]
  );

  return { ...estado, supabase, salvarLoja, recarregar: carregar };
}
