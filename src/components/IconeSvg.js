/**
 * Ícones em SVG desenhados para a Casa do Leitor (traço simples, 24x24).
 * Herdam a cor do texto (currentColor), então funcionam nos dois temas.
 * Decorativos por padrão (aria-hidden); passe `titulo` quando o ícone
 * for o único conteúdo de um link/botão sem texto visível.
 */

const TRACOS = {
  buscar: (
    <>
      <circle cx="11" cy="11" r="6.5" />
      <path d="M16 16l4.5 4.5" />
    </>
  ),
  carrinho: (
    <>
      <path d="M3 4.5h2.3l2.2 10.1a1.6 1.6 0 0 0 1.6 1.3h8.3a1.6 1.6 0 0 0 1.5-1.2L20.6 8.5H6.2" />
      <circle cx="9.6" cy="19.6" r="1.3" />
      <circle cx="17" cy="19.6" r="1.3" />
    </>
  ),
  menu: <path d="M4 7h16M4 12h16M4 17h16" />,
  fechar: <path d="M6 6l12 12M18 6L6 18" />,
  inicio: (
    <>
      <path d="M3.5 11.2L12 4.5l8.5 6.7" />
      <path d="M6 9.5v10h12v-10" />
      <path d="M10 19.5v-5h4v5" />
    </>
  ),
  faiscas: (
    <>
      <path d="M11 3.5l1.7 4.6 4.6 1.7-4.6 1.7L11 16.1l-1.7-4.6-4.6-1.7 4.6-1.7z" />
      <path d="M18.3 14.5l.8 2 2 .8-2 .8-.8 2-.8-2-2-.8 2-.8z" />
    </>
  ),
  usuario: (
    <>
      <circle cx="12" cy="8.5" r="3.7" />
      <path d="M4.8 20c1.3-3.6 4-5.4 7.2-5.4s5.9 1.8 7.2 5.4" />
    </>
  ),
  coracao: <path d="M12 19.5s-7.2-4.4-7.2-9.9A4 4 0 0 1 12 7.2a4 4 0 0 1 7.2 2.4c0 5.5-7.2 9.9-7.2 9.9z" />,
  pacote: (
    <>
      <path d="M4 7.8L12 4l8 3.8v8.4L12 20l-8-3.8z" />
      <path d="M4 7.8l8 3.9 8-3.9M12 11.7V20" />
    </>
  ),
  loja: (
    <>
      <path d="M4.5 9.5L6 4.5h12l1.5 5" />
      <path d="M4.5 9.5h15c0 1.6-1.2 2.6-2.6 2.6s-2.5-1-2.5-2.6c0 1.6-1.1 2.6-2.4 2.6s-2.4-1-2.4-2.6c0 1.6-1.1 2.6-2.5 2.6S4.5 11.1 4.5 9.5z" />
      <path d="M6 12v7.5h12V12M10 19.5v-4h4v4" />
    </>
  ),
  livro: (
    <>
      <path d="M5.5 5.2A1.7 1.7 0 0 1 7.2 3.5h11.3v14H7.2a1.7 1.7 0 0 0-1.7 1.7z" />
      <path d="M5.5 19.2a1.7 1.7 0 0 0 1.7 1.3h11.3v-3" />
      <path d="M9 7.5h6" />
    </>
  ),
  categorias: (
    <>
      <rect x="4" y="4" width="6.5" height="6.5" rx="1.4" />
      <rect x="13.5" y="4" width="6.5" height="6.5" rx="1.4" />
      <rect x="4" y="13.5" width="6.5" height="6.5" rx="1.4" />
      <rect x="13.5" y="13.5" width="6.5" height="6.5" rx="1.4" />
    </>
  ),
  sair: (
    <>
      <path d="M14.5 4.5h3.7a1.3 1.3 0 0 1 1.3 1.3v12.4a1.3 1.3 0 0 1-1.3 1.3h-3.7" />
      <path d="M10 8l-4 4 4 4M6 12h9" />
    </>
  ),
  'seta-baixo': <path d="M6.5 9.5l5.5 5.5 5.5-5.5" />,
  'seta-esquerda': <path d="M14.5 6l-6 6 6 6" />,
  'seta-direita': <path d="M9.5 6l6 6-6 6" />,
  paleta: (
    <>
      <path d="M12 4a8 8 0 1 0 0 16c1.1 0 1.6-.8 1.6-1.6 0-.5-.2-.8-.5-1.2-.3-.3-.4-.7-.4-1.1 0-.9.7-1.6 1.6-1.6h1.9A3.8 3.8 0 0 0 20 10.7C20 6.9 16.4 4 12 4z" />
      <circle cx="7.8" cy="11.3" r="1" />
      <circle cx="10.5" cy="7.8" r="1" />
      <circle cx="14.7" cy="8" r="1" />
    </>
  ),
};

export default function IconeSvg({ nome, tam = 22, titulo, className = '' }) {
  const traco = TRACOS[nome];
  if (!traco) return null;
  return (
    <svg
      className={`icone-svg ${className}`}
      width={tam}
      height={tam}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.8"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden={titulo ? undefined : true}
      role={titulo ? 'img' : undefined}
      focusable="false"
    >
      {titulo && <title>{titulo}</title>}
      {traco}
    </svg>
  );
}
