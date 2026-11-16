/**
 * ============================================================
 *  ÁREA DO VENDEDOR — utilitários (client-side)
 * ============================================================
 *  - Tradução dos erros do Supabase (BDcontexto.md, seção 9).
 *  - Conversão de preço digitado ("29,90") para número.
 *  - Compressão e upload das fotos dos livros (Storage).
 *
 *  As fotos ficam no bucket `livros-fotos`, na pasta do vendedor:
 *  `<user.id>/<uuid>.jpg`. Bucket e colunas `fotos`/`ano_lancamento`
 *  são criados por database/vendedor-livros.sql.
 */

export const BUCKET_FOTOS = 'livros-fotos';
export const TAMANHO_MAX_FOTO = 10 * 1024 * 1024; // 10 MB antes da compressão
export const ANO_ATUAL = new Date().getFullYear();

const AVISO_BANCO =
  'O banco ainda não está preparado para fotos e ano de lançamento. ' +
  'Peça ao administrador para executar o script database/vendedor-livros.sql no Supabase.';

/**
 * Converte um erro do Supabase (banco ou Storage) em mensagem amigável.
 * Nunca devolve o erro bruto para a tela.
 */
export function mensagemErroVendedor(error, padrao = 'Não foi possível concluir. Tente novamente em instantes.') {
  if (!error) return padrao;
  const codigo = error.code || '';
  const msg = String(error.message || '');

  if (codigo === '23514' || /_check"?/.test(msg)) {
    if (msg.includes('ano_lancamento')) return 'Ano de lançamento inválido.';
    return 'Preço e estoque não podem ser negativos.';
  }
  // Colunas novas ainda não criadas (script não executado).
  if (codigo === 'PGRST204' || codigo === '42703') return AVISO_BANCO;
  // Bucket inexistente.
  if (/bucket not found/i.test(msg)) return AVISO_BANCO;

  if (msg.includes('itens_pedido_livro_id_fkey')) {
    return 'Este livro já foi vendido e não pode ser excluído. Desative-o para tirá-lo da vitrine.';
  }
  if (msg.includes('livros_vendedor_id_fkey')) return 'Crie sua loja antes de cadastrar livros.';
  if (codigo === '23505' && msg.includes('lojas_pkey')) return 'Você já possui uma loja.';
  if (codigo === '42501' || /row-level security/i.test(msg)) return 'Apenas vendedores podem fazer isso.';
  if (codigo === 'PGRST116') return 'Livro não encontrado.';
  if (/payload too large|maximum allowed size/i.test(msg)) return 'A foto é grande demais. Use uma imagem menor.';
  if (/mime type|invalid_mime/i.test(msg)) return 'Formato de imagem não aceito. Use JPG, PNG ou WEBP.';

  return padrao;
}

/** "29,90" | "1.234,56" | "29.9" → número (NaN se inválido). */
export function precoParaNumero(valor) {
  const texto = String(valor ?? '').replace(/[R$\s]/g, '');
  if (texto === '') return NaN;
  const normalizado = texto.includes(',') ? texto.replace(/\./g, '').replace(',', '.') : texto;
  return /^\d+(\.\d{1,2})?$/.test(normalizado) ? Number(normalizado) : NaN;
}

/** 29.9 → "29,90" (para preencher o campo de edição). */
export function numeroParaPreco(valor) {
  if (valor === null || valor === undefined || valor === '') return '';
  return Number(valor).toFixed(2).replace('.', ',');
}

/** Erro com mensagem que pode ir direto para a tela. */
function erroAmigavel(mensagem) {
  return Object.assign(new Error(mensagem), { amigavel: mensagem });
}

/**
 * Reduz a foto (máx. 1200px no maior lado) e converte para JPEG,
 * deixando o upload leve. Se o navegador não conseguir ler a imagem,
 * lança um erro com `amigavel` (mensagem pronta para a tela).
 */
export async function comprimirImagem(arquivo, ladoMax = 1200, qualidade = 0.85) {
  let imagem;
  try {
    imagem = await createImageBitmap(arquivo);
  } catch {
    throw erroAmigavel('Não foi possível ler esta imagem. Use uma foto JPG, PNG ou WEBP.');
  }

  const escala = Math.min(1, ladoMax / Math.max(imagem.width, imagem.height));
  const largura = Math.round(imagem.width * escala);
  const altura = Math.round(imagem.height * escala);

  const canvas = document.createElement('canvas');
  canvas.width = largura;
  canvas.height = altura;
  const ctx = canvas.getContext('2d');
  ctx.fillStyle = '#ffffff'; // fundo branco para PNG transparente
  ctx.fillRect(0, 0, largura, altura);
  ctx.drawImage(imagem, 0, 0, largura, altura);
  imagem.close?.();

  const blob = await new Promise((resolve) => canvas.toBlob(resolve, 'image/jpeg', qualidade));
  if (!blob) throw erroAmigavel('Não foi possível processar a imagem.');
  return blob;
}

/** Envia uma foto para a pasta do vendedor e devolve { url, caminho }. */
export async function enviarFoto(supabase, userId, arquivo) {
  const blob = await comprimirImagem(arquivo);
  const caminho = `${userId}/${crypto.randomUUID()}.jpg`;

  const { error } = await supabase.storage
    .from(BUCKET_FOTOS)
    .upload(caminho, blob, { contentType: 'image/jpeg', cacheControl: '31536000', upsert: false });
  if (error) throw error;

  const { data } = supabase.storage.from(BUCKET_FOTOS).getPublicUrl(caminho);
  return { url: data.publicUrl, caminho };
}

/** Extrai o caminho no bucket a partir da URL pública (ou null se for de fora). */
export function caminhoDaUrl(url) {
  const marcador = `/storage/v1/object/public/${BUCKET_FOTOS}/`;
  const i = String(url || '').indexOf(marcador);
  return i === -1 ? null : decodeURIComponent(url.slice(i + marcador.length).split('?')[0]);
}

/** Apaga fotos do bucket (melhor esforço: falhas são ignoradas). */
export async function apagarFotos(supabase, urlsOuCaminhos) {
  const caminhos = urlsOuCaminhos
    .map((u) => (String(u).startsWith('http') ? caminhoDaUrl(u) : u))
    .filter(Boolean);
  if (caminhos.length === 0) return;
  try {
    await supabase.storage.from(BUCKET_FOTOS).remove(caminhos);
  } catch {
    // Arquivo órfão no Storage não quebra nada para o usuário.
  }
}

/** Lista de fotos de um livro (usa `fotos`; cai para `capa_url` em livros antigos). */
export function fotosDoLivro(livro) {
  if (Array.isArray(livro?.fotos) && livro.fotos.length > 0) return livro.fotos;
  return livro?.capa_url ? [livro.capa_url] : [];
}

/** Valida um uuid (ids de `livros` no Supabase). */
export function ehUuid(valor) {
  return /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(String(valor || ''));
}
