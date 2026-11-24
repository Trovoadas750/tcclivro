/**
 * ============================================================
 *  CACHE DO PERFIL (localStorage)
 * ============================================================
 *  Guarda perfil, favoritos e pedidos do usuário logado para que
 *  entrar e sair das telas de perfil não dispare consultas ao
 *  Supabase toda vez.
 *
 *  Regras:
 *   - O cache pertence a UM usuário (campo `userId`). Se o usuário
 *     logado for outro, o cache é apagado e nada é reaproveitado.
 *   - Ao sair (logout) ou sem sessão, o cache é apagado.
 *   - Passado o TTL o cache é considerado velho: a tela mostra o
 *     que tem e busca de novo (o status de um pedido, por exemplo,
 *     muda no servidor).
 *   - Escritas (editar perfil, remover favorito) atualizam banco
 *     e cache juntos.
 */

import { STORAGE_KEYS } from '@/lib/config';
import { COLUNAS_CARD } from '@/lib/repositories/livroRepository';
import { COLUNAS_PEDIDO } from '@/lib/pedidos';

/** Tempo em que o cache é considerado fresco (10 minutos). */
export const CACHE_TTL_MS = 10 * 60 * 1000;

function lerBruto() {
  if (typeof window === 'undefined') return null;
  try {
    const raw = localStorage.getItem(STORAGE_KEYS.PERFIL);
    return raw ? JSON.parse(raw) : null;
  } catch {
    return null;
  }
}

/** Apaga o cache do perfil (logout, troca de usuário, sessão expirada). */
export function limparCachePerfil() {
  if (typeof window === 'undefined') return;
  try {
    localStorage.removeItem(STORAGE_KEYS.PERFIL);
  } catch {
    // localStorage indisponível — ignora.
  }
}

/**
 * Marca o cache como velho sem apagá-lo: a próxima tela de perfil mostra
 * o que tem e busca de novo (usado quando um favorito muda fora dela).
 */
export function invalidarCachePerfil() {
  const cache = lerBruto();
  if (!cache) return;
  try {
    localStorage.setItem(STORAGE_KEYS.PERFIL, JSON.stringify({ ...cache, atualizadoEm: 0 }));
  } catch {
    // localStorage indisponível — ignora.
  }
}

/**
 * Lê o cache do usuário informado.
 * Se o cache for de outro usuário, ele é APAGADO e retorna null.
 * @returns {{ userId, atualizadoEm, perfil, favoritos, pedidos, fresco } | null}
 */
export function lerCachePerfil(userId) {
  const cache = lerBruto();
  if (!cache) return null;

  if (!userId || cache.userId !== userId) {
    limparCachePerfil();
    return null;
  }

  const idade = Date.now() - (cache.atualizadoEm || 0);
  return { ...cache, fresco: idade < CACHE_TTL_MS };
}

/** Grava o cache do usuário (sobrescreve tudo). */
export function gravarCachePerfil(userId, { perfil, favoritos, pedidos }) {
  if (typeof window === 'undefined') return;
  try {
    localStorage.setItem(
      STORAGE_KEYS.PERFIL,
      JSON.stringify({ userId, atualizadoEm: Date.now(), perfil, favoritos, pedidos })
    );
  } catch {
    // localStorage cheio/indisponível — a tela funciona só com o banco.
  }
}

/* ------------------------------------------------------------------ *
 *  Consultas (uma por tabela; RLS já restringe ao próprio usuário)
 * ------------------------------------------------------------------ */

/** select * from profiles where id = auth.uid() */
export async function buscarPerfil(supabase, userId) {
  const { data, error } = await supabase
    .from('profiles')
    .select('*')
    .eq('id', userId)
    .maybeSingle();
  if (error) throw error;
  return data;
}

/**
 * Favoritos com os dados do livro (colunas listadas: nunca livros(*),
 * que traria a coluna `busca`). Livro desativado volta com livros = null.
 */
export async function buscarFavoritos(supabase, userId) {
  const { data, error } = await supabase
    .from('favoritos')
    .select(`id, livro_id, created_at, livros(${COLUNAS_CARD})`)
    .eq('user_id', userId)
    .order('created_at', { ascending: false });
  if (error) throw error;
  return data || [];
}

/**
 * Pedidos do usuário com os itens. Usa titulo_livro e foto_url gravados no
 * momento da compra (sem embed de `livros`: livro desativado voltaria null).
 */
export async function buscarPedidos(supabase, userId) {
  const { data, error } = await supabase
    .from('pedidos')
    .select(COLUNAS_PEDIDO)
    .eq('user_id', userId)
    .order('created_at', { ascending: false });
  if (error) throw error;
  return data || [];
}
