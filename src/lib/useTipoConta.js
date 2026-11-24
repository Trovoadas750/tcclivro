/**
 * Hook com o usuário logado, o tipo da conta ('cliente' | 'vendedor') e o
 * nome do perfil. Usado para ajustar menus e CTAs ("Tornar-se vendedor" x
 * "Meu painel", "Olá, {nome}").
 *
 * O estado é COMPARTILHADO entre todos os componentes da página (cabeçalho,
 * menu do celular, barra inferior, rodapé...): a sessão e o perfil são lidos
 * uma vez só, e não uma vez por componente.
 *
 * Recarrega quando a janela dispara 'usuario-atualizado' (login, logout,
 * cadastro, migração para vendedor) ou quando a sessão muda no Supabase.
 * Proteção de menus no front é só experiência de uso: a segurança é a RLS.
 */
'use client';

import { useEffect, useState } from 'react';
import { createClient } from '@/lib/supabase/client';

let estado = { carregando: true, usuario: null, tipo: null, nome: null };
let carregamento = null;
let iniciado = false;
const ouvintes = new Set();

function publicar(novo) {
  estado = novo;
  ouvintes.forEach((fn) => fn(estado));
}

function carregar(supabase) {
  carregamento = (async () => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      publicar({ carregando: false, usuario: null, tipo: null, nome: null });
      return;
    }
    const { data: perfil } = await supabase.from('profiles').select('tipo, nome').eq('id', user.id).maybeSingle();
    publicar({
      carregando: false,
      usuario: user,
      tipo: perfil?.tipo === 'vendedor' ? 'vendedor' : 'cliente',
      nome: perfil?.nome?.trim() || null,
    });
  })();
  return carregamento;
}

/** Inicia (uma vez por aba) a leitura da sessão e os ouvintes globais. */
function iniciar(supabase) {
  if (iniciado) return;
  iniciado = true;
  carregar(supabase);
  window.addEventListener('usuario-atualizado', () => carregar(supabase));
  supabase.auth.onAuthStateChange((evento) => {
    if (evento === 'SIGNED_IN' || evento === 'SIGNED_OUT') carregar(supabase);
  });
}

export function useTipoConta() {
  const [supabase] = useState(() => createClient());
  const [atual, setAtual] = useState(estado);

  useEffect(() => {
    ouvintes.add(setAtual);
    setAtual(estado);
    iniciar(supabase);
    return () => ouvintes.delete(setAtual);
  }, [supabase]);

  return { ...atual, supabase };
}

/** Primeiro nome para "Olá, {nome}" (cai no começo do e-mail). */
export function primeiroNome(nome, usuario) {
  const base = String(nome || '').trim() || String(usuario?.email || '').split('@')[0];
  return base.split(/\s+/)[0] || 'leitor';
}
