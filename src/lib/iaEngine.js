/**
 * ============================================================
 *  MOTOR DE RECOMENDAÇÃO "IA" (demonstração)
 * ============================================================
 *  Porte do includes/ia_engine.php do projeto PHP original:
 *  motor baseado em análise de texto (keywords + pesos),
 *  simulando uma IA de recomendação.
 *
 *  Diferença: no PHP o motor consultava o banco (db()->query);
 *  aqui ele recebe os livros do repositório (que, em modo demo,
 *  devolve src/lib/mockData.js). Quando o Supabase for ativado,
 *  basta chamar o repositório real — a lógica não muda.
 *
 *  Para trocar por uma IA real (OpenAI/Anthropic etc.), basta
 *  reimplementar `recomendarLivrosIA()` e `responderChatIA()`.
 */

import { normalizar } from '@/lib/format';
import { buscarMaisVendidos, buscarRecomendados, mapaTags } from '@/lib/repositories/livroRepository';

/** Palavras sem significado para a busca (stopwords em português). */
const STOPWORDS_PT = new Set([
  'gosto', 'gostaria', 'quero', 'queria', 'preciso', 'me', 'que', 'um', 'uma', 'de', 'do', 'da', 'dos', 'das',
  'para', 'com', 'em', 'no', 'na', 'nos', 'nas', 'por', 'e', 'ou', 'mas', 'tem', 'ter', 'tipo', 'coisa', 'sobre',
  'meu', 'minha', 'meus', 'minhas', 'sao', 'esta', 'estou', 'ser', 'foi', 'vou', 'algum', 'livro', 'livros',
  'leitura', 'ler', 'indicar', 'indica', 'recomenda', 'recomendacao', 'quando', 'onde', 'a', 'o', 'as', 'os',
  'mais', 'muito', 'pode', 'poderia', 'algo', 'assim', 'ai', 'voce', 'eu', 'prefiro', 'amo', 'adoro', 'achei',
]);

/** Quebra o texto em tokens relevantes (>= 3 caracteres, sem stopwords). */
export function tokensTexto(texto) {
  const t = normalizar(texto).replace(/[^a-z0-9\s\-]/g, ' ');
  const palavras = t.split(/\s+/).map((p) => p.trim()).filter(Boolean);
  const tokens = [];
  for (const p of palavras) {
    if (p.length < 3 || STOPWORDS_PT.has(p)) continue;
    if (!tokens.includes(p)) tokens.push(p);
  }
  return tokens;
}

/**
 * Calcula a pontuação de um livro para o texto do usuário.
 * Retorna { score, razoes }.
 */
function pontuarLivro(livro, tokens, tagsDoLivro, favoritos) {
  let score = 0;
  const razoes = [];

  const alvoTitulo = normalizar(livro.titulo);
  const alvoAutor = normalizar(livro.autor);
  const alvoDesc = normalizar(livro.descricao);
  const categoria = normalizar(livro.categoria?.nome || '');

  for (const tok of tokens) {
    if (alvoTitulo.includes(tok)) {
      score += 6.0;
      razoes.push(`título combina com «${tok}»`);
    }
    if (alvoAutor.includes(tok)) {
      score += 3.0;
      razoes.push(`autor combina com «${tok}»`);
    }
    if (alvoDesc.includes(tok)) score += 2.0;
    if (categoria !== '' && categoria.includes(tok)) {
      score += 3.5;
      razoes.push(`categoria «${livro.categoria?.nome}»`);
    }
    for (const { tag, peso } of tagsDoLivro || []) {
      if (normalizar(tag).includes(tok)) {
        score += 3.0 * peso;
        razoes.push(`tema «${tag}»`);
      }
    }
  }

  // Bônus de qualidade (empurrão quando não há match forte)
  score += Number(livro.avaliacao) * 0.4;
  score += Math.min(Number(livro.vendas) / 1000, 1.5);

  // Personalização: favoritos do usuário ganham bônus
  if (favoritos.includes(livro.id)) score += 2.5;

  // Evita recomendar o que não tem estoque
  if (Number(livro.estoque) <= 0) score -= 5.0;

  return { score, razoes: [...new Set(razoes)] };
}

/**
 * API principal: recebe texto livre e retorna livros recomendados.
 * @param {string} texto - descrição do usuário
 * @param {number[]} favoritos - ids favoritos do usuário (opcional)
 * @param {number} limite
 * @returns {Promise<{consulta: string[], resultados: object[], metodo: string, perfil: boolean}>}
 */
export async function recomendarLivrosIA(texto, favoritos = [], limite = 6) {
  const tokens = tokensTexto(texto);

  // Sem termos relevantes: cai para "editorial" (mais vendidos/destaques)
  if (tokens.length === 0) {
    const destaques = await buscarRecomendados(limite);
    return { consulta: [], resultados: destaques, metodo: 'editorial', perfil: false };
  }

  const tags = mapaTags();
  const livros = await buscarRecomendados(999); // acervo completo (demo: 20 livros)

  const classificados = livros.map((livro) => {
    const { score, razoes } = pontuarLivro(livro, tokens, tags[livro.id], favoritos);
    return { livro, score, razoes };
  });

  classificados.sort((a, b) => b.score - a.score);

  const resultados = classificados.slice(0, limite).map((c) => ({
    ...c.livro,
    _score: Math.round(c.score * 100) / 100,
    _razoes: c.razoes,
  }));

  return {
    consulta: tokens,
    resultados,
    metodo: 'semantico',
    perfil: favoritos.length > 0,
  };
}

/**
 * Gera a resposta em linguagem natural do chatbot (BibliIA).
 * @returns {Promise<{texto: string, livros: object[], metodo: string}>}
 */
export async function responderChatIA(mensagem, favoritos = [], nomeUsuario = null) {
  const m = normalizar(mensagem);

  // Saudação
  if (/\b(ola|oi|bom dia|boa tarde|boa noite|hey|eai)\b/.test(m)) {
    return {
      texto: `Olá, ${nomeUsuario || 'leitor(a)'}! 👋 Eu sou a <b>BibliIA</b>. Me conta o que você gosta de ler (fantasia, romance, tecnologia, mistério...) que eu encontro os melhores títulos para você!`,
      livros: [],
      metodo: 'saudacao',
    };
  }

  // Ajuda
  if (/\b(ajuda|help|o que voce faz|como funciona)\b/.test(m)) {
    return {
      texto: 'Eu analiso o que você descreve e procuro no nosso acervo os livros que mais combinam com o seu gosto, usando um motor de recomendação semântico. ✨ É só descrever o estilo, tema ou até o título que você procura!',
      livros: [],
      metodo: 'ajuda',
    };
  }

  // Agradecimento
  if (/\b(obrigad|valeu|thank)\b/.test(m)) {
    return {
      texto: 'Por nada! 😊 Boa leitura! Se quiser mais indicações, é só pedir.',
      livros: [],
      metodo: 'agradecimento',
    };
  }

  const resp = await recomendarLivrosIA(mensagem, favoritos, 4);

  if (resp.metodo === 'editorial') {
    return {
      texto: 'Não entendi exatamente o estilo que você busca, então trouxe os <b>destaques do momento</b>! 📚 Tenta descrever um pouco mais: ex. "gosto de fantasia e magia", "quero um suspense policial", "me indica um livro de tecnologia"...',
      livros: resp.resultados,
      metodo: resp.metodo,
    };
  }

  const top = resp.resultados[0];
  if (!top) {
    return {
      texto: 'Hmm, não achei nada muito parecido no acervo. 😔 Tenta descrever com outras palavras!',
      livros: [],
      metodo: 'vazio',
    };
  }

  const frases = [
    'Analisei seu gosto e separei estas indicações para você! 🎯',
    'Com base no que você descreveu, estas leituras combinam muito! ✨',
    'Achei ótimos títulos para o seu perfil. Confere: 👇',
  ];
  const intro = frases[Math.floor(Math.random() * frases.length)];
  const detalhe = resp.perfil
    ? ' Aproveitei seu perfil e favoritos para refinar ainda mais a busca. 💜'
    : '';

  return { texto: intro + detalhe, livros: resp.resultados, metodo: resp.metodo };
}