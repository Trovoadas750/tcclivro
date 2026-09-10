/**
 * Capa de livro renderizada como SVG inline (100% offline).
 * Substitui o assets/img/capa.php do PHP — ver src/lib/capa.js.
 */
import { gerarCapaSVG } from '@/lib/capa';

export default function CapaLivro({ livro, largura = '100%', className = '', alt = '' }) {
  const svg = gerarCapaSVG(livro);
  return (
    <img
      className={className}
      src={`data:image/svg+xml;utf8,${encodeURIComponent(svg)}`}
      alt={alt || livro.titulo || 'Capa do livro'}
      style={{ width: largura }}
      loading="lazy"
    />
  );
}