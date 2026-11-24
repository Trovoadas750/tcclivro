/**
 * ============================================================
 *  CAPA GENÉRICA DE LIVRO (SVG)
 * ============================================================
 *  Último recurso do fallback de imagem (BDcontexto.md, seção 11):
 *  quando foto_1_url e foto_2_url falham, mostramos título e autor
 *  sobre um fundo neutro, gerado em SVG 100% offline.
 *
 *  O tom do fundo vem de uma paleta neutra, escolhido pelo hash do
 *  id (o mesmo livro sempre tem a mesma cor).
 */

const PALETA = ['#5b4a3f', '#4a5160', '#566150', '#6b4f4f', '#4d4a63', '#5f5a45', '#3f5658'];

/** Escapa texto para dentro do XML do SVG ("Pride & Prejudice" quebrava a imagem). */
function escaparXml(texto) {
  return String(texto ?? '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&apos;');
}

/** Quebra o texto em até `max` linhas de ~`largura` caracteres (corta com …). */
function quebrarLinhas(texto, largura, max) {
  const palavras = String(texto || '').split(/\s+/).filter(Boolean);
  const linhas = [];
  let atual = '';
  for (const p of palavras) {
    if (atual && (atual + ' ' + p).length > largura) {
      linhas.push(atual);
      atual = p;
    } else {
      atual = atual ? `${atual} ${p}` : p;
    }
  }
  if (atual) linhas.push(atual);
  if (linhas.length > max) {
    linhas.length = max;
    linhas[max - 1] = linhas[max - 1].slice(0, largura - 1) + '…';
  }
  return linhas.map((l) => (l.length > largura ? l.slice(0, largura - 1) + '…' : l));
}

/**
 * Gera a string SVG da capa genérica.
 * @param {{ id?: string, titulo?: string, autor?: string }} livro
 */
export function gerarCapaSVG({ id = '', titulo = 'Livro', autor = '' } = {}) {
  let hash = 0;
  for (const ch of String(id || titulo)) hash = (hash * 31 + ch.charCodeAt(0)) >>> 0;
  const fundo = PALETA[hash % PALETA.length];

  const linhasTitulo = quebrarLinhas(titulo, 16, 4);
  const fs = linhasTitulo.length > 2 ? 24 : 28;
  const topo = 200 - ((linhasTitulo.length - 1) * (fs + 8)) / 2;
  const tituloSVG = linhasTitulo
    .map((lin, i) => `<text x="150" y="${topo + i * (fs + 8)}" font-family="Georgia,serif" font-size="${fs}" fill="#fff" font-weight="bold" text-anchor="middle">${escaparXml(lin)}</text>`)
    .join('');

  const linhasAutor = quebrarLinhas(autor, 24, 2);
  const autorSVG = linhasAutor
    .map((lin, i) => `<text x="150" y="${362 + i * 24}" font-family="Georgia,serif" font-size="18" fill="#fff" fill-opacity=".9" text-anchor="middle">${escaparXml(lin)}</text>`)
    .join('');

  return `<svg xmlns="http://www.w3.org/2000/svg" width="300" height="450" viewBox="0 0 300 450">
  <rect width="300" height="450" fill="${fundo}"/>
  <rect width="300" height="450" fill="url(#luz)"/>
  <defs><linearGradient id="luz" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="#fff" stop-opacity=".10"/><stop offset="1" stop-color="#000" stop-opacity=".18"/></linearGradient></defs>
  <rect x="14" y="14" width="272" height="422" fill="none" stroke="#fff" stroke-opacity=".35" stroke-width="2" rx="4"/>
  <text x="150" y="62" font-family="Georgia,serif" font-size="13" fill="#fff" fill-opacity=".75" text-anchor="middle" letter-spacing="3">CASA DO LEITOR</text>
  ${tituloSVG}
  <line x1="70" y1="330" x2="230" y2="330" stroke="#fff" stroke-opacity=".5" stroke-width="1.5"/>
  ${autorSVG}
</svg>`;
}

/** SVG da capa genérica como URL de dados, para usar direto em <img src>. */
export function capaDataURL(livro) {
  return 'data:image/svg+xml;utf8,' + encodeURIComponent(gerarCapaSVG(livro));
}
