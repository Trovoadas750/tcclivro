/**
 * ============================================================
 *  REPOSITÓRIO DE LIVROS — camada de acesso a dados
 * ============================================================
 *  Equivalente às consultas SQL espalhadas pelo projeto PHP
 *  (index.php, busca.php, produto.php), concentradas aqui.
 *
 *  ⚠️  ATENÇÃO: as funções deste arquivo são as responsáveis por
 *      PUXAR OS DADOS DOS LIVROS DO BANCO. Porém, como a conexão
 *      com o Supabase está DESATIVADA (DB_ATIVO = false em
 *      src/lib/supabase.js), nenhuma consulta é realmente
 *      executada: cada função contém o SQL equivalente em
 *      comentário e devolve os dados de demonstração de
 *      src/lib/mockData.js.
 *
 *  ------------------------------------------------------------
 *  COMO FUNCIONA O DESLIGAMENTO:
 *  ------------------------------------------------------------
 *  Cada função tem o seguinte formato:
 *
 *    export async function exemplo() {
 *      const supabase = getSupabase();        // null em modo demo
 *
 *      if (supabase) {
 *        // ── BLOCO REAL (só roda com banco ativado) ──
 *        // const { data, error } = await supabase
 *        //   .from('livros')...
 *        // ...
 *      }
 *
 *      // ── FALLBACK DEMO (roda enquanto não há banco) ──
 *      return mockData...
 *    }
 *
 *  Para ativar: basta seguir o passo a passo de src/lib/supabase.js.
 * ============================================================
 */

import { DB_ATIVO, getSupabase } from '@/lib/supabase';
import {
  LIVROS,
  CATEGORIAS,
  TAGS,
  LIVRO_TAGS,
  AVALIACOES,
} from '@/lib/mockData';

/* ------------------------------------------------------------------ *
 *  Helpers internos (não são consultas — apenas transformações)
 * ------------------------------------------------------------------ */

/** Junta categoria no livro (equivalente ao LEFT JOIN do PHP). */
function comCategoria(livro) {
  const cat = CATEGORIAS.find((c) => c.id === livro.categoriaId);
  return { ...livro, categoria: cat || null };
}

/** Monta o mapa livroId -> { tag, peso } usado pelo motor de IA. */
export function mapaTags() {
  const mapa = {};
  for (const [livroId, tagIndex, peso] of LIVRO_TAGS) {
    const tag = TAGS[tagIndex - 1]; // índice 1-based no seed
    if (!mapa[livroId]) mapa[livroId] = [];
    mapa[livroId].push({ tag, peso });
  }
  return mapa;
}

/* ------------------------------------------------------------------ *
 *  Consultas de livros
 * ------------------------------------------------------------------ */

/**
 * Livros recomendados pela "IA" na home (destaques por avaliação).
 *
 * SQL original (PHP index.php):
 *   SELECT l.*, cat.nome AS categoria_nome, cat.emoji AS categoria_emoji
 *     FROM livros l
 *     LEFT JOIN categorias cat ON cat.id = l.categoria_id
 *    ORDER BY l.avaliacao DESC, l.vendas DESC
 *    LIMIT 8
 */
export async function buscarRecomendados(limite = 8) {
  const supabase = getSupabase();

  if (supabase) {
    // ── BLOCO REAL (executado apenas com DB_ATIVO = true) ──
    // const { data, error } = await supabase
    //   .from('livros')
    //   .select('*, categorias(nome, emoji)')
    //   .order('avaliacao', { ascending: false })
    //   .order('vendas', { ascending: false })
    //   .limit(limite);
    // if (error) throw new Error(`Falha ao buscar recomendados: ${error.message}`);
    // return data;
    void DB_ATIVO; // referência mantida de propósito (documentação)
  }

  return [...LIVROS]
    .sort((a, b) => b.avaliacao - a.avaliacao || b.vendas - a.vendas)
    .slice(0, limite)
    .map(comCategoria);
}

/**
 * Mais vendidos (seção da home e ordenação "relevancia").
 *
 * SQL original (PHP index.php):
 *   SELECT l.*, cat.nome AS categoria_nome, cat.emoji AS categoria_emoji
 *     FROM livros l
 *     LEFT JOIN categorias cat ON cat.id = l.categoria_id
 *    ORDER BY l.vendas DESC
 *    LIMIT 8
 */
export async function buscarMaisVendidos(limite = 8) {
  const supabase = getSupabase();

  if (supabase) {
    // const { data, error } = await supabase
    //   .from('livros')
    //   .select('*, categorias(nome, emoji)')
    //   .order('vendas', { ascending: false })
    //   .limit(limite);
    // if (error) throw new Error(`Falha ao buscar mais vendidos: ${error.message}`);
    // return data;
    void DB_ATIVO;
  }

  return [...LIVROS]
    .sort((a, b) => b.vendas - a.vendas)
    .slice(0, limite)
    .map(comCategoria);
}

/**
 * Categorias com contagem de livros (chips da home e filtro lateral).
 *
 * SQL original (PHP index.php):
 *   SELECT c.*, COUNT(l.id) AS total
 *     FROM categorias c
 *     LEFT JOIN livros l ON l.categoria_id = c.id
 *    GROUP BY c.id ORDER BY c.nome
 */
export async function buscarCategorias() {
  const supabase = getSupabase();

  if (supabase) {
    // const { data, error } = await supabase
    //   .from('categorias')
    //   .select('*, livros(id)')
    //   .order('nome');
    // if (error) throw new Error(`Falha ao buscar categorias: ${error.message}`);
    // return data.map((c) => ({ ...c, total: c.livros.length }));
    void DB_ATIVO;
  }

  return CATEGORIAS.map((c) => ({
    ...c,
    total: LIVROS.filter((l) => l.categoriaId === c.id).length,
  }));
}

/**
 * Busca de livros com filtros (texto + categoria) e ordenação.
 *
 * SQL original (PHP busca.php):
 *   SELECT l.*, cat.nome AS categoria_nome, cat.emoji AS categoria_emoji
 *     FROM livros l
 *     LEFT JOIN categorias cat ON cat.id = l.categoria_id
 *    WHERE (l.titulo LIKE ? OR l.autor LIKE ? OR l.descricao LIKE ?)
 *      AND l.categoria_id = ?
 *    ORDER BY {relevancia|preco_asc|preco_desc|avaliacao|novidades}
 *    LIMIT 24
 */
export async function buscarLivros({ q = '', categoriaId = 0, ordenar = 'relevancia' } = {}) {
  const supabase = getSupabase();

  if (supabase) {
    // let query = supabase
    //   .from('livros')
    //   .select('*, categorias(nome, emoji)');
    //
    // if (q) {
    //   // ilike = LIKE do SQL; `%termo%` busca em qualquer parte.
    //   query = query.or(`titulo.ilike.%${q}%,autor.ilike.%${q}%,descricao.ilike.%${q}%`);
    // }
    // if (categoriaId) {
    //   query = query.eq('categoria_id', categoriaId);
    // }
    //
    // const ordenacoes = {
    //   relevancia: ['vendas', { ascending: false }],
    //   preco_asc: ['preco', { ascending: true }],
    //   preco_desc: ['preco', { ascending: false }],
    //   avaliacao: ['avaliacao', { ascending: false }],
    //   novidades: ['ano_publicacao', { ascending: false }],
    // };
    // const [coluna, opcoes] = ordenacoes[ordenar] || ordenacoes.relevancia;
    // const { data, error } = await query.order(coluna, opcoes).limit(24);
    // if (error) throw new Error(`Falha na busca de livros: ${error.message}`);
    // return data;
    void DB_ATIVO;
  }

  const termo = q.trim().toLowerCase();
  const ordenacoes = {
    relevancia: (a, b) => b.vendas - a.vendas,
    preco_asc: (a, b) => a.preco - b.preco,
    preco_desc: (a, b) => b.preco - a.preco,
    avaliacao: (a, b) => b.avaliacao - a.avaliacao || b.numAvaliacoes - a.numAvaliacoes,
    novidades: (a, b) => b.anoPublicacao - a.anoPublicacao,
  };

  return LIVROS
    .filter((l) => {
      const bateTermo =
        !termo ||
        l.titulo.toLowerCase().includes(termo) ||
        l.autor.toLowerCase().includes(termo) ||
        l.descricao.toLowerCase().includes(termo);
      const bateCategoria = !categoriaId || l.categoriaId === Number(categoriaId);
      return bateTermo && bateCategoria;
    })
    .sort(ordenacoes[ordenar] || ordenacoes.relevancia)
    .slice(0, 24)
    .map(comCategoria);
}

/**
 * Busca UM livro pelo id (página do produto).
 * Retorna `null` quando não encontrado.
 *
 * SQL original (PHP produto.php):
 *   SELECT l.*, cat.nome AS categoria_nome, cat.emoji AS categoria_emoji
 *     FROM livros l
 *     LEFT JOIN categorias cat ON cat.id = l.categoria_id
 *    WHERE l.id = ?
 */
export async function buscarLivroPorId(id) {
  const supabase = getSupabase();

  if (supabase) {
    // const { data, error } = await supabase
    //   .from('livros')
    //   .select('*, categorias(nome, emoji)')
    //   .eq('id', id)
    //   .maybeSingle(); // null quando não existe
    // if (error) throw new Error(`Falha ao buscar livro ${id}: ${error.message}`);
    // return data;
    void DB_ATIVO;
  }

  const livro = LIVROS.find((l) => l.id === Number(id));
  return livro ? comCategoria(livro) : null;
}

/**
 * Livros relacionados ao livro atual: mesma categoria ou tags em comum.
 *
 * SQL original (PHP produto.php):
 *   SELECT l.*, cat.nome AS categoria_nome, cat.emoji AS categoria_emoji
 *     FROM livros l
 *     LEFT JOIN categorias cat ON cat.id = l.categoria_id
 *     JOIN livro_tags lt ON lt.livro_id = l.id
 *     JOIN tags t ON t.id = lt.tag_id
 *    WHERE l.id != ? AND t.nome IN (...)
 *    GROUP BY l.id ORDER BY l.avaliacao DESC LIMIT 4
 *   + complemento por categoria (quando houver menos de 4).
 */
export async function buscarRelacionados(id, limite = 4) {
  const supabase = getSupabase();

  if (supabase) {
    // const { data: tagsDoLivro } = await supabase
    //   .from('livro_tags')
    //   .select('tags(nome)')
    //   .eq('livro_id', id);
    // const nomes = tagsDoLivro.map((r) => r.tags.nome);
    //
    // let query = supabase
    //   .from('livros')
    //   .select('*, categorias(nome, emoji)')
    //   .neq('id', id)
    //   .order('avaliacao', { ascending: false })
    //   .limit(limite);
    // if (nomes.length) {
    //   query = query.in('livro_tags.tag', nomes);
    // }
    // const { data, error } = await query;
    // if (error) throw new Error(`Falha ao buscar relacionados: ${error.message}`);
    // return data;
    void DB_ATIVO;
  }

  const alvo = LIVROS.find((l) => l.id === Number(id));
  if (!alvo) return [];

  const tagsDoAlvo = (mapaTags()[alvo.id] || []).map((t) => t.tag);
  const porTags = LIVROS
    .filter((l) => l.id !== alvo.id)
    .filter((l) => (mapaTags()[l.id] || []).some((t) => tagsDoAlvo.includes(t.tag)))
    .sort((a, b) => b.avaliacao - a.avaliacao);

  const porCategoria = LIVROS
    .filter((l) => l.id !== alvo.id && l.categoriaId === alvo.categoriaId)
    .sort((a, b) => b.vendas - a.vendas);

  const unidos = [];
  for (const l of [...porTags, ...porCategoria]) {
    if (unidos.length >= limite) break;
    if (!unidos.some((u) => u.id === l.id)) unidos.push(l);
  }
  return unidos.map(comCategoria);
}

/**
 * Avaliações de um livro (com nome do usuário).
 *
 * SQL original (PHP produto.php):
 *   SELECT av.nota, av.comentario, av.criado_em, u.nome
 *     FROM avaliacoes av JOIN usuarios u ON u.id = av.usuario_id
 *    WHERE av.livro_id = ? ORDER BY av.criado_em DESC LIMIT 6
 */
export async function buscarAvaliacoes(livroId, limite = 6) {
  const supabase = getSupabase();

  if (supabase) {
    // const { data, error } = await supabase
    //   .from('avaliacoes')
    //   .select('nota, comentario, criado_em, usuarios(nome)')
    //   .eq('livro_id', livroId)
    //   .order('criado_em', { ascending: false })
    //   .limit(limite);
    // if (error) throw new Error(`Falha ao buscar avaliações: ${error.message}`);
    // return data.map((a) => ({ ...a, nome: a.usuarios.nome }));
    void DB_ATIVO;
  }

  return AVALIACOES
    .filter((a) => a.livroId === Number(livroId))
    .sort((a, b) => new Date(b.criadoEm) - new Date(a.criadoEm))
    .slice(0, limite);
}