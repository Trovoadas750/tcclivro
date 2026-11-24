/**
 * ============================================================
 *  Formatação para exibição
 * ============================================================
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

/** Formata data ISO para "dd/mm/aaaa hh:mm". */
export function formatarData(iso) {
  if (!iso) return '';
  const d = new Date(iso);
  const p = (n) => String(n).padStart(2, '0');
  return `${p(d.getDate())}/${p(d.getMonth() + 1)}/${d.getFullYear()} ${p(d.getHours())}:${p(d.getMinutes())}`;
}
