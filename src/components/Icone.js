/**
 * Ícone de imagem que substitui um emoji (PNGs em /public/emoji).
 * Equivalente à função icone() do PHP original.
 */
export default function Icone({ nome, alt = '', tam = 18, className = '' }) {
  return (
    <img
      className={`emojiz ${className}`}
      src={`/emoji/${encodeURIComponent(nome)}.png`}
      alt={alt}
      width={tam}
      height={tam}
      loading="lazy"
    />
  );
}