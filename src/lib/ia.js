/**
 * ============================================================
 *  PROVEDOR DE IA (gratuito, formato OpenAI) — SÓ NO SERVIDOR
 * ============================================================
 *  O projeto não tem orçamento: a IA usa um provedor gratuito
 *  compatível com a API da OpenAI, chamado com `fetch` (sem SDK).
 *  Trocar de provedor é só trocar as variáveis de ambiente:
 *
 *    IA_API_URL=https://api.groq.com/openai/v1   (padrão)
 *    IA_API_KEY=gsk_...                           (sem NEXT_PUBLIC_!)
 *    IA_MODELO=openai/gpt-oss-20b                 (padrão)
 *
 *  Qualquer falha (sem chave, 429/4xx/5xx, tempo esgotado, JSON
 *  inválido) lança ErroIA; a rota trata caindo no MODO LOCAL.
 *  Nunca importe este arquivo em componentes 'use client'.
 */

export const IA_API_URL = (process.env.IA_API_URL || 'https://api.groq.com/openai/v1').replace(/\/+$/, '');
export const IA_MODELO = process.env.IA_MODELO || 'openai/gpt-oss-20b';
const TEMPO_MAXIMO_MS = 12_000;
const MAX_TOKENS = 700;

/** Erro interno da IA: a rota cai no modo local, nunca mostra isto ao usuário. */
export class ErroIA extends Error {
  constructor(motivo, detalhe) {
    super(`${motivo}${detalhe ? `: ${detalhe}` : ''}`);
    this.name = 'ErroIA';
    this.motivo = motivo; // sem_chave | cota | http | tempo | rede | formato
  }
}

/** Há chave configurada? Sem ela, a recomendação funciona só no modo local. */
export function iaConfigurada() {
  return Boolean(process.env.IA_API_KEY);
}

/** Corpo da requisição, com os ajustes de cada provedor. */
function montarCorpo(sistema, usuario) {
  const corpo = {
    model: IA_MODELO,
    messages: [
      { role: 'system', content: sistema },
      { role: 'user', content: usuario },
    ],
    temperature: 0.3,
  };

  if (IA_API_URL.includes('groq.com')) {
    corpo.max_completion_tokens = MAX_TOKENS;
    corpo.response_format = { type: 'json_object' }; // o prompt também pede "somente JSON"
    if (IA_MODELO.startsWith('openai/gpt-oss')) {
      // Raciocínio curto e não devolvido: economiza a cota gratuita.
      corpo.reasoning_effort = 'low';
      corpo.include_reasoning = false;
    }
  } else {
    corpo.max_tokens = MAX_TOKENS;
  }
  return corpo;
}

/** Remove cercas ```json e faz o parse. Lança ErroIA se não for um objeto JSON. */
function lerJson(texto) {
  const limpo = String(texto || '')
    .trim()
    .replace(/^```(?:json)?\s*/i, '')
    .replace(/\s*```$/, '')
    .trim();
  try {
    const json = JSON.parse(limpo);
    if (json && typeof json === 'object' && !Array.isArray(json)) return json;
  } catch {
    // cai no erro abaixo
  }
  throw new ErroIA('formato', 'a resposta não é um objeto JSON');
}

/**
 * Faz UMA chamada ao provedor e devolve o objeto JSON da resposta.
 * @param {string} sistema prompt de sistema (deve pedir "somente JSON")
 * @param {string} usuario mensagem do usuário
 * @returns {Promise<object>}
 * @throws {ErroIA}
 */
export async function chamarIA(sistema, usuario) {
  const chave = process.env.IA_API_KEY;
  if (!chave) throw new ErroIA('sem_chave');

  const controle = new AbortController();
  const timer = setTimeout(() => controle.abort(), TEMPO_MAXIMO_MS);

  let resposta;
  try {
    resposta = await fetch(`${IA_API_URL}/chat/completions`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${chave}`,
      },
      body: JSON.stringify(montarCorpo(sistema, usuario)),
      signal: controle.signal,
      cache: 'no-store',
    });
  } catch (e) {
    throw new ErroIA(e?.name === 'AbortError' ? 'tempo' : 'rede', e?.message);
  } finally {
    clearTimeout(timer);
  }

  if (!resposta.ok) {
    // 429 = cota gratuita esgotada (por minuto ou por dia).
    throw new ErroIA(resposta.status === 429 ? 'cota' : 'http', `status ${resposta.status}`);
  }

  let dados;
  try {
    dados = await resposta.json();
  } catch {
    throw new ErroIA('formato', 'corpo da resposta não é JSON');
  }
  const conteudo = dados?.choices?.[0]?.message?.content;
  if (typeof conteudo !== 'string' || !conteudo.trim()) {
    throw new ErroIA('formato', 'resposta sem conteúdo');
  }
  return lerJson(conteudo);
}
