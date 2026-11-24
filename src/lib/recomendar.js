/**
 * Chamada à rota POST /api/recomendar a partir do navegador
 * (página /ia e chatbot BibliIA). A IA roda só no servidor; aqui só
 * enviamos o pedido e tratamos a resposta.
 */

export const PEDIDO_MIN = 3;
export const PEDIDO_MAX = 300;

/** Sugestões clicáveis (página e chatbot). */
export const SUGESTOES_IA = [
  'Fantasia para começar',
  'Um clássico curto',
  'Suspense que prende do início ao fim',
  'Romance leve para as férias',
];

/** Rodapé discreto conforme o modo usado na resposta. */
export function rodapeRecomendacao(modo) {
  return modo === 'ia'
    ? 'Recomendações geradas por IA a partir do nosso catálogo.'
    : 'Recomendações a partir do nosso catálogo.';
}

/**
 * @returns {Promise<{ ok: true, modo: 'ia' | 'local', mensagem: string, livros: object[] } | { ok: false, erro: string }>}
 */
export async function pedirRecomendacao(pedido) {
  const texto = String(pedido || '').trim();
  if (texto.length < PEDIDO_MIN) return { ok: false, erro: `Escreva pelo menos ${PEDIDO_MIN} caracteres.` };
  if (texto.length > PEDIDO_MAX) return { ok: false, erro: `Use no máximo ${PEDIDO_MAX} caracteres.` };

  try {
    const res = await fetch('/api/recomendar', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ pedido: texto }),
    });
    const dados = await res.json().catch(() => null);
    if (!res.ok || !dados) {
      return { ok: false, erro: dados?.erro || 'A recomendação está indisponível no momento.' };
    }
    return {
      ok: true,
      modo: dados.modo === 'ia' ? 'ia' : 'local',
      mensagem: dados.mensagem || '',
      livros: Array.isArray(dados.livros) ? dados.livros : [],
    };
  } catch {
    return { ok: false, erro: 'Não foi possível buscar recomendações agora. Verifique sua conexão e tente de novo.' };
  }
}
