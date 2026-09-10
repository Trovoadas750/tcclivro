/**
 * ============================================================
 *  Formatação e utilitários de exibição
 * ============================================================
 *  Equivalente ao includes/functions.php do projeto PHP original
 *  (funções e(), preco(), estrelas(), icone(), capa()).
 *  No PHP o `e()` escapava HTML; no React isso é automático,
 *  então mantivemos apenas o que faz sentido em JS.
 */

/**
 * Formata um número como moeda brasileira.
 * Ex.: 49.9 -> "R$ 49,90"
 */
export function preco(valor) {
  return 'R$ ' + Number(valor).toLocaleString('pt-BR', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });
}

/**
 * Converte uma nota (0 a 5) em estrelas preenchidas/vazias.
 * Ex.: 4.6 -> "★★★★☆"
 */
export function estrelas(nota) {
  const cheias = Math.round(Number(nota) || 0);
  let saida = '';
  for (let i = 1; i <= 5; i++) {
    saida += i <= cheias ? '★' : '☆';
  }
  return saida;
}

/** Formata data ISO para "dd/mm/aaaa hh:mm". */
export function formatarData(iso) {
  if (!iso) return '';
  const d = new Date(iso);
  const p = (n) => String(n).padStart(2, '0');
  return `${p(d.getDate())}/${p(d.getMonth() + 1)}/${d.getFullYear()} ${p(d.getHours())}:${p(d.getMinutes())}`;
}

/** Remove acentos e normaliza para minúsculas (usado pelo motor de IA). */
export function normalizar(texto) {
  return String(texto || '')
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/ç/g, 'c')
    .replace(/ñ/g, 'n');
}

/** Converte "R$ 1.234,56" (ou "1.234,56") em número. */
export function moedaParaNumero(valor) {
  if (typeof valor === 'number') return valor;
  return Number(
    String(valor)
      .replace(/[R$\s]/g, '')
      .replace(/\./g, '')
      .replace(',', '.')
  ) || 0;
}