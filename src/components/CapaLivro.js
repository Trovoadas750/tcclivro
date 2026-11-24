/**
 * Capa de livro com fallback (BDcontexto.md, seção 11).
 *
 * Ordem: foto_1_url → foto_2_url → capa genérica em SVG (título e autor
 * sobre fundo neutro). Nunca mostra ícone de imagem quebrada.
 *
 * As fotos do catálogo inicial vêm de sites externos (Goodreads e Open
 * Library) e podem falhar de três jeitos, todos tratados aqui:
 *   - erro de carregamento (onError);
 *   - imagem "vazia" (a Open Library devolve um GIF de 1x1 quando não tem
 *     a capa; o Goodreads usa URLs com "nophoto");
 *   - falha antes de o React hidratar a página (o onError se perde): o
 *     efeito confere `complete`/`naturalWidth` depois de montar.
 *
 * Props:
 *   livro  — { id, titulo, autor, foto_1_url, foto_2_url }
 *   fotos  — lista própria de URLs (ex.: [itens_pedido.foto_url]); se
 *            omitida, usa foto_1_url e foto_2_url do livro.
 */
'use client';

import { useEffect, useRef, useState } from 'react';
import { capaDataURL } from '@/lib/capa';

/** Abaixo disso a imagem é considerada um "pixel" de placeholder. */
const LARGURA_MINIMA = 10;

export default function CapaLivro({ livro, fotos, largura = '100%', className = '', alt = '' }) {
  const lista = (fotos ?? [livro?.foto_1_url, livro?.foto_2_url]).filter(
    (url) => typeof url === 'string' && url.trim() !== '' && !/\/nophoto\//i.test(url)
  );
  const chave = lista.join('|');

  // Quantas URLs já falharam para esta lista (reinicia se a lista mudar).
  const [falhas, setFalhas] = useState({ chave, n: 0 });
  const n = falhas.chave === chave ? falhas.n : 0;
  const usandoFoto = n < lista.length;
  const src = usandoFoto ? lista[n] : capaDataURL(livro || {});

  const imgRef = useRef(null);

  function avancar() {
    setFalhas((f) => ({ chave, n: (f.chave === chave ? f.n : 0) + 1 }));
  }

  // A imagem pode ter falhado/carregado antes da hidratação.
  useEffect(() => {
    const img = imgRef.current;
    if (usandoFoto && img?.complete && img.naturalWidth < LARGURA_MINIMA) avancar();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [src]);

  return (
    <img
      ref={imgRef}
      className={className}
      src={src}
      alt={alt || livro?.titulo || 'Capa do livro'}
      style={{ width: largura }}
      loading="lazy"
      decoding="async"
      referrerPolicy="no-referrer"
      onError={usandoFoto ? avancar : undefined}
      onLoad={usandoFoto ? (e) => e.currentTarget.naturalWidth < LARGURA_MINIMA && avancar() : undefined}
    />
  );
}
