/**
 * ============================================================
 *  REPOSITÓRIO DE LIVROS — consultas ao catálogo (Supabase)
 * ============================================================
 *  Todas as funções recebem o cliente Supabase já criado, para
 *  servir tanto no servidor (src/lib/supabase/server.js, em Server
 *  Components) quanto no navegador (src/lib/supabase/client.js,
 *  em Client Components como o carrinho).
 *
 *  Regras (BDcontexto.md):
 *   - A vitrine é pública: só livros com `ativo = true`.
 *   - Nunca usar select('*') em `livros`: traria a coluna `busca`
 *     (tsvector, grande e inútil no front). As colunas são listadas.
 *   - `livros.id` é uuid.
 *   - Em caso de erro, as funções registram no console e devolvem
 *     vazio, para a página continuar de pé.
 */

import { LOJA_CATALOGO_ID } from '@/lib/config';
import { ehUuid } from '@/lib/vendedor';

/** Colunas usadas em cards (vitrine, busca, carrinho, favoritos). */
export const COLUNAS_CARD =
  'id, titulo, autor, categoria, preco, estoque, foto_1_url, foto_2_url, vendedor_id, lojas(nome_loja)';

/** Colunas da página de detalhe do livro. */
export const COLUNAS_DETALHE =
  'id, titulo, autor, categoria, sinopse, isbn, ano_lancamento, preco, estoque, ativo, vendedor_id, foto_1_url, foto_2_url, created_at, lojas(nome_loja, descricao)';

/** Livros por página no catálogo (/busca). */
export const POR_PAGINA = 24;

/** Ordenações aceitas no catálogo (valor da URL → rótulo). */
export const ORDENACOES = {
  recentes: 'Mais recentes',
  preco_asc: 'Menor preço',
  preco_desc: 'Maior preço',
  titulo: 'Título (A–Z)',
};

function registrarErro(contexto, error) {
  console.error(`[livroRepository] ${contexto}:`, error?.message || error);
}

function aplicarOrdenacao(consulta, ordenar) {
  switch (ordenar) {
    case 'preco_asc':
      return consulta.order('preco', { ascending: true }).order('id');
    case 'preco_desc':
      return consulta.order('preco', { ascending: false }).order('id');
    case 'titulo':
      return consulta.order('titulo', { ascending: true }).order('id');
    default:
      return consulta.order('created_at', { ascending: false }).order('id');
  }
}

/**
 * Destaques da página inicial: livros ativos mais recentes.
 *   select ... from livros where ativo order by created_at desc limit N
 */
export async function buscarDestaques(supabase, limite = 8) {
  const { data, error } = await aplicarOrdenacao(
    supabase.from('livros').select(COLUNAS_CARD).eq('ativo', true),
    'recentes'
  ).limit(limite);
  if (error) {
    registrarErro('destaques', error);
    return [];
  }
  return data || [];
}

/**
 * Categorias com pelo menos um livro ativo e com estoque, da maior para a menor.
 *   rpc categorias_disponiveis() → [{ categoria, livros }]
 */
export async function buscarCategorias(supabase) {
  const { data, error } = await supabase.rpc('categorias_disponiveis');
  if (error) {
    registrarErro('categorias', error);
    return [];
  }
  return (data || []).filter((c) => c.categoria);
}

/** Livros ativos de uma categoria (faixas da página inicial). */
export async function buscarPorCategoria(supabase, categoria, limite = 8) {
  const { data, error } = await aplicarOrdenacao(
    supabase.from('livros').select(COLUNAS_CARD).eq('ativo', true).eq('categoria', categoria),
    'recentes'
  ).limit(limite);
  if (error) {
    registrarErro(`categoria "${categoria}"`, error);
    return [];
  }
  return data || [];
}

/**
 * "Direto dos vendedores": livros ativos de lojas diferentes da loja do
 * catálogo inicial (NEXT_PUBLIC_LOJA_CATALOGO_ID). Sem a variável, mostra
 * livros de todas as lojas.
 */
export async function buscarDosVendedores(supabase, limite = 8) {
  let consulta = supabase.from('livros').select(COLUNAS_CARD).eq('ativo', true);
  if (LOJA_CATALOGO_ID) consulta = consulta.neq('vendedor_id', LOJA_CATALOGO_ID);
  const { data, error } = await aplicarOrdenacao(consulta, 'recentes').limit(limite);
  if (error) {
    registrarErro('vendedores', error);
    return [];
  }
  return data || [];
}

/**
 * Catálogo com busca, filtro por categoria e paginação.
 * @param {{ termo?: string, categoria?: string, ordenar?: string, pagina?: number }} filtros
 *        pagina começa em 1.
 * @returns {{ livros: object[], total: number, erro: boolean }}
 */
export async function buscarCatalogo(supabase, { termo = '', categoria = '', ordenar = 'recentes', pagina = 1 } = {}) {
  const inicio = (Math.max(1, pagina) - 1) * POR_PAGINA;

  const filtrar = (consulta) => {
    let c = consulta.eq('ativo', true);
    if (categoria) c = c.eq('categoria', categoria);
    if (termo) c = c.textSearch('busca', termo, { type: 'websearch', config: 'simple' });
    return c;
  };

  const consulta = filtrar(supabase.from('livros').select(COLUNAS_CARD, { count: 'exact' }));
  const { data, count, error } = await aplicarOrdenacao(consulta, ordenar).range(inicio, inicio + POR_PAGINA - 1);

  // Página além do fim (PGRST103 "Requested range not satisfiable"):
  // devolve só o total, para a página redirecionar para a última.
  if (error?.code === 'PGRST103') {
    const { count: total, error: erroTotal } = await filtrar(
      supabase.from('livros').select('id', { count: 'exact', head: true })
    );
    if (!erroTotal) return { livros: [], total: total || 0, erro: false };
  }
  if (error) {
    registrarErro('catálogo', error);
    return { livros: [], total: 0, erro: true };
  }
  return { livros: data || [], total: count || 0, erro: false };
}

/**
 * Um livro pelo id (página de detalhe). Livro inexistente, id inválido ou
 * inativo para quem não é o dono (a RLS esconde) → null.
 */
export async function buscarLivro(supabase, id) {
  if (!ehUuid(id)) return null;
  const { data, error } = await supabase.from('livros').select(COLUNAS_DETALHE).eq('id', id).maybeSingle();
  if (error) {
    registrarErro(`livro ${id}`, error);
    return null;
  }
  return data;
}

/**
 * Dados atuais de vários livros (carrinho). Livros desativados ou
 * excluídos simplesmente não voltam na consulta.
 * @returns {object[] | null} null quando a consulta falha.
 */
export async function buscarLivrosPorIds(supabase, ids) {
  const validos = [...new Set(ids)].filter(ehUuid);
  if (validos.length === 0) return [];
  const { data, error } = await supabase.from('livros').select(COLUNAS_CARD).eq('ativo', true).in('id', validos);
  if (error) {
    registrarErro('livros por id', error);
    return null;
  }
  return data || [];
}

/* ------------------------------------------------------------------ *
 *  IA de recomendação (usado só no servidor, em /api/recomendar)
 * ------------------------------------------------------------------ */

/** Tamanho máximo da sinopse enviada à IA (igual ao sinopse_resumo do banco). */
const TAMANHO_RESUMO = 400;

/**
 * Candidatos para a IA: busca de texto em `livros.busca` (termos unidos por OU)
 * + bônus para as categorias pedidas. Só livros ativos e com estoque.
 *   rpc buscar_livros_para_ia(p_termos, p_categorias, p_limite)
 *   → [{ id, titulo, autor, categoria, ano_lancamento, preco, sinopse_resumo, relevancia }]
 */
export async function buscarCandidatosIA(supabase, { termos = [], categorias = [], limite = 40 }) {
  if (termos.length === 0 && categorias.length === 0) return [];
  const { data, error } = await supabase.rpc('buscar_livros_para_ia', {
    p_termos: termos,
    p_categorias: categorias,
    p_limite: limite,
  });
  if (error) {
    registrarErro('candidatos da IA', error);
    return [];
  }
  return data || [];
}

/**
 * Livros ativos e com estoque mais recentes, no mesmo formato dos candidatos
 * da IA (completa a lista quando a busca devolve poucos livros).
 */
export async function buscarRecentesParaIA(supabase, limite = 40) {
  const { data, error } = await supabase
    .from('livros')
    .select('id, titulo, autor, categoria, ano_lancamento, preco, sinopse')
    .eq('ativo', true)
    .gt('estoque', 0)
    .order('created_at', { ascending: false })
    .order('id')
    .limit(limite);
  if (error) {
    registrarErro('recentes para a IA', error);
    return [];
  }
  return (data || []).map(({ sinopse, ...livro }) => ({
    ...livro,
    sinopse_resumo: sinopse ? String(sinopse).slice(0, TAMANHO_RESUMO) : null,
  }));
}
