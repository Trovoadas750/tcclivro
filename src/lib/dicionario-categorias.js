/**
 * ============================================================
 *  DICIONÁRIO DE CATEGORIAS — modo local da recomendação
 * ============================================================
 *  Usado quando a IA externa não está disponível (sem chave, cota
 *  esgotada, erro ou demora). Transforma o pedido em termos de busca
 *  e categorias SEM IA:
 *    - palavras do próprio pedido (3+ letras, sem palavras comuns);
 *    - palavra do dicionário → categoria + termos em inglês (o
 *      catálogo inicial está em inglês).
 *  Tudo é comparado sem acentos e em minúsculas.
 */

/** Minúsculas, sem acentos e sem pontuação (espaços simples). */
export function normalizarTexto(texto) {
  return String(texto || '')
    .toLowerCase()
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .replace(/[^a-z0-9\s-]/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

/**
 * Palavra(s) no pedido → categorias + termos em inglês
 * (BDcontexto.md, Parte C — "Dicionário de categorias do modo local").
 */
export const DICIONARIO_CATEGORIAS = [
  { palavras: ['fantasia', 'magia', 'mágico', 'dragão', 'bruxo', 'elfo', 'reino'], categorias: ['Fantasia'], ingles: ['fantasy', 'magic', 'dragon', 'wizard'] },
  { palavras: ['mistério', 'detetive', 'investigação', 'assassinato', 'enigma'], categorias: ['Mistério'], ingles: ['mystery', 'detective', 'murder'] },
  { palavras: ['suspense', 'thriller', 'tensão', 'perseguição'], categorias: ['Suspense'], ingles: ['thriller', 'suspense'] },
  { palavras: ['crime', 'policial'], categorias: ['Mistério', 'Suspense'], ingles: ['crime', 'police'] },
  { palavras: ['terror', 'horror', 'medo', 'assustador', 'sobrenatural', 'fantasma'], categorias: ['Terror', 'Sobrenatural'], ingles: ['horror', 'ghost'] },
  { palavras: ['romance', 'amor', 'paixão', 'romântico'], categorias: ['Romance'], ingles: ['love', 'romance'] },
  { palavras: ['ficção científica', 'futuro', 'espaço', 'robô', 'alienígena', 'distopia'], categorias: ['Ficção científica'], ingles: ['science fiction', 'space', 'future', 'dystopia'] },
  { palavras: ['clássico', 'clássicos', 'literatura'], categorias: ['Clássicos'], ingles: ['classic'] },
  { palavras: ['guerra', 'histórico', 'época', 'século'], categorias: ['Ficção histórica', 'História'], ingles: ['war', 'history', 'historical'] },
  { palavras: ['história', 'real'], categorias: ['História'], ingles: ['history'] },
  { palavras: ['biografia', 'memórias', 'vida de'], categorias: ['Biografias e memórias'], ingles: ['biography', 'memoir'] },
  { palavras: ['poesia', 'poema', 'poemas'], categorias: ['Poesia'], ingles: ['poetry', 'poems'] },
  { palavras: ['autoajuda', 'motivação', 'produtividade', 'hábitos'], categorias: ['Autoajuda'], ingles: ['self-help', 'habits'] },
  { palavras: ['negócios', 'empreender', 'dinheiro', 'finanças'], categorias: ['Negócios'], ingles: ['business'] },
  { palavras: ['psicologia', 'mente', 'comportamento'], categorias: ['Psicologia'], ingles: ['psychology', 'mind'] },
  { palavras: ['filosofia', 'filosófico'], categorias: ['Filosofia'], ingles: ['philosophy'] },
  { palavras: ['ciência', 'científico', 'física', 'biologia'], categorias: ['Ciência'], ingles: ['science'] },
  { palavras: ['arte', 'pintura', 'música'], categorias: ['Arte', 'Música'], ingles: ['art', 'music'] },
  { palavras: ['religião', 'fé', 'espiritualidade', 'deus'], categorias: ['Religião e espiritualidade'], ingles: ['faith', 'god', 'spiritual'] },
  { palavras: ['viagem', 'viajar', 'aventura'], categorias: ['Viagem'], ingles: ['travel', 'adventure'] },
  { palavras: ['esporte', 'futebol'], categorias: ['Esportes'], ingles: ['sports'] },
  { palavras: ['mangá', 'anime'], categorias: ['Mangá'], ingles: ['manga'] },
  { palavras: ['quadrinhos', 'hq', 'graphic novel'], categorias: ['HQs e graphic novels'], ingles: ['comics', 'graphic novel'] },
  { palavras: ['jovem', 'adolescente', 'juvenil'], categorias: ['Jovem adulto'], ingles: ['young adult'] },
];

/** Palavras comuns que não ajudam a busca. */
const PALAVRAS_COMUNS = new Set(
  [
    'quero', 'queria', 'gostaria', 'livro', 'livros', 'um', 'uma', 'uns', 'umas', 'que', 'para', 'pra', 'com', 'sem',
    'sobre', 'gosto', 'gostei', 'algo', 'alguma', 'algum', 'parecido', 'parecida', 'tipo', 'ler', 'leitura', 'me',
    'indica', 'indique', 'recomenda', 'recomende', 'sugere', 'sugira', 'dos', 'das', 'nos', 'nas', 'por', 'mais',
    'menos', 'muito', 'muita', 'bem', 'bom', 'boa', 'tem', 'ter', 'seja', 'ser', 'como', 'qual', 'quais', 'onde',
    'mas', 'nao', 'sim', 'meu', 'minha', 'seu', 'sua', 'ele', 'ela', 'eles', 'elas', 'isso', 'esse', 'essa',
    'este', 'esta', 'aquele', 'aquela', 'the', 'and', 'for', 'with', 'book', 'books',
  ].map(normalizarTexto)
);

// Versão normalizada do dicionário (calculada uma vez).
const ENTRADAS = DICIONARIO_CATEGORIAS.map((e) => ({
  ...e,
  chaves: e.palavras.map(normalizarTexto),
}));

/** A chave (uma ou mais palavras) aparece no texto como palavra inteira? */
function contem(textoNormalizado, chave) {
  return ` ${textoNormalizado} `.includes(` ${chave} `);
}

/**
 * Analisa o pedido sem IA.
 * @param {string} pedido
 * @param {string[]} categoriasDisponiveis nomes exatos de categorias_disponiveis()
 * @returns {{ termos: string[], categorias: string[] }}
 */
export function analisarPedidoLocal(pedido, categoriasDisponiveis = []) {
  const texto = normalizarTexto(pedido);

  // Mapa "nome normalizado" → nome exato no banco (só categorias que existem).
  const existentes = new Map(categoriasDisponiveis.map((c) => [normalizarTexto(c), c]));

  const termos = [];
  const categorias = [];
  const adicionar = (lista, valor) => {
    if (valor && !lista.includes(valor)) lista.push(valor);
  };

  // 1) Palavras do próprio pedido (até 8, para sobrar espaço para o inglês)
  for (const palavra of texto.split(' ')) {
    if (termos.length >= 8) break;
    if (palavra.length >= 3 && !PALAVRAS_COMUNS.has(palavra)) adicionar(termos, palavra);
  }

  // 2) Dicionário: categorias + termos em inglês
  for (const entrada of ENTRADAS) {
    if (!entrada.chaves.some((chave) => contem(texto, chave))) continue;
    entrada.ingles.forEach((t) => adicionar(termos, t));
    for (const c of entrada.categorias) {
      const real = existentes.get(normalizarTexto(c));
      if (real) adicionar(categorias, real);
    }
  }

  // 3) Nome de categoria escrito direto no pedido (ex.: "algo de Biografias")
  for (const [normalizada, real] of existentes) {
    if (contem(texto, normalizada)) adicionar(categorias, real);
  }

  return { termos: termos.slice(0, 16), categorias: categorias.slice(0, 3) };
}
