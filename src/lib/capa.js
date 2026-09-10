/**
 * ============================================================
 *  GERADOR DE CAPAS DE LIVROS (SVG)
 * ============================================================
 *  Substitui o assets/img/capa.php do projeto PHP original:
 *  em vez de gerar uma imagem via PHP, geramos uma string SVG
 *  em JavaScript, 100% offline, sem dependências de imagem.
 *
 *  A cor principal vem do livro (capaCor) e uma segunda cor é
 *  derivada do id, criando gradientes variados.
 */

/**
 * Gera a string SVG da capa de um livro.
 * @param {object} livro - { id, titulo, autor, capaCor }
 * @returns {string} SVG pronto para renderização
 */
export function gerarCapaSVG({ id = 1, titulo = 'Livro', autor = 'Autor', capaCor = '#4f46e5' }) {
  const corBase = /^#[0-9a-fA-F]{6}$/.test(capaCor) ? capaCor : '#4f46e5';

  // Derivar uma segunda cor a partir do hash do id (gradiente variado)
  let hash = 0;
  for (const ch of String(id)) hash = (hash * 31 + ch.charCodeAt(0)) & 0xffffff;
  const cor2 = '#' + String(hash).padStart(6, '0').slice(0, 6);

  // Quebra o título em linhas (até 4)
  const palavras = String(titulo).split(' ');
  const linhas = [];
  let atual = '';
  for (const p of palavras) {
    if ((atual + ' ' + p).length > 18 && atual !== '') {
      linhas.push(atual);
      atual = p;
    } else {
      atual = (atual + ' ' + p).trim();
    }
  }
  if (atual !== '') linhas.push(atual);

  const linhasSVG = linhas.slice(0, 4).map((lin, i) => {
    const fs = 26 - Math.min(linhas.length - 1, 2) * 3;
    return `<text x="90" y="${150 + i * (fs + 10)}" font-family="Georgia,serif" font-size="${fs}" fill="#fff" font-weight="bold" text-anchor="middle">${lin}</text>`;
  }).join('');

  return `<svg xmlns="http://www.w3.org/2000/svg" width="300" height="450" viewBox="0 0 300 450">
  <defs>
    <linearGradient id="g" x1="0" y1="0" x2="1" y2="1">
      <stop offset="0%" stop-color="${corBase}"/>
      <stop offset="100%" stop-color="${cor2}"/>
    </linearGradient>
  </defs>
  <rect width="300" height="450" fill="url(#g)"/>
  <rect x="12" y="12" width="276" height="426" fill="none" stroke="#ffffff" stroke-opacity=".35" stroke-width="2" rx="4"/>
  <circle cx="60" cy="380" r="90" fill="#fff" fill-opacity=".06"/>
  <circle cx="255" cy="70" r="70" fill="#fff" fill-opacity=".07"/>
  <text x="90" y="58" font-family="Georgia,serif" font-size="15" fill="#fff" fill-opacity=".85" text-anchor="middle" letter-spacing="3">CASA DO LEITOR</text>
  ${linhasSVG}
  <line x1="50" y1="330" x2="250" y2="330" stroke="#fff" stroke-opacity=".5" stroke-width="1.5"/>
  <text x="90" y="365" font-family="Georgia,serif" font-size="19" fill="#fff" text-anchor="middle">${String(autor).slice(0, 34)}</text>
</svg>`;
}

/**
 * Converte o SVG em URL de dados para uso direto em <img src>.
 * Evita precisar de um endpoint/rota de imagem.
 */
export function capaDataURL(livro) {
  const svg = gerarCapaSVG(livro);
  return 'data:image/svg+xml;utf8,' + encodeURIComponent(svg);
}