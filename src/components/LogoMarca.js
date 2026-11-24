/**
 * Logo da Casa do Leitor (public/logo.png), sempre com link para o início.
 * A imagem tem fundo transparente e contorno escuro, então fica num selo
 * creme (--cor-fundo-logo) para aparecer bem sobre o cabeçalho escuro e no
 * tema escuro.
 *
 * Props:
 *   tam     — altura do selo em px
 *   nome    — mostra "Casa do Leitor" em texto ao lado (no cabeçalho, a
 *             logo fica pequena e o texto dela não seria legível)
 *   prioridade — carrega já (logo do cabeçalho, acima da dobra)
 */
import Link from 'next/link';

// Proporção da logo recortada (386 x 438).
const PROPORCAO = 386 / 438;

export default function LogoMarca({ tam = 52, nome = false, prioridade = false, className = '' }) {
  const alturaImg = Math.round(tam * 0.86);
  const larguraImg = Math.round(alturaImg * PROPORCAO);

  return (
    <Link href="/" className={`logo-marca ${className}`} aria-label={nome ? undefined : 'Casa do Leitor — página inicial'}>
      <span className="logo-marca-selo" style={{ width: tam, height: tam }}>
        <img
          src="/logo.png"
          alt="Casa do Leitor"
          width={larguraImg}
          height={alturaImg}
          loading={prioridade ? 'eager' : 'lazy'}
          fetchPriority={prioridade ? 'high' : undefined}
          decoding="async"
        />
      </span>
      {nome && (
        <span className="logo-marca-nome" aria-hidden="true">
          <span>Casa do</span> Leitor
        </span>
      )}
    </Link>
  );
}
