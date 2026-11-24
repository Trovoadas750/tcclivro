/**
 * Galeria das fotos do livro (foto grande + miniaturas clicáveis).
 * Toda imagem usa o fallback de CapaLivro: se a foto escolhida falhar,
 * tenta a outra e, por fim, a capa genérica.
 */
'use client';

import { useState } from 'react';
import CapaLivro from '@/components/CapaLivro';
import { fotosDoLivro } from '@/lib/vendedor';

export default function GaleriaFotos({ livro }) {
  const fotos = fotosDoLivro(livro);
  const [atual, setAtual] = useState(0);

  // Foto escolhida primeiro; as outras ficam como fallback.
  const ordem = fotos.length ? [fotos[atual], ...fotos.filter((_, i) => i !== atual)] : [];

  return (
    <div className="galeria">
      <div className="galeria-principal">
        <CapaLivro livro={livro} fotos={ordem} alt={`${livro.titulo} — foto ${atual + 1}`} />
      </div>
      {fotos.length > 1 && (
        <div className="galeria-miniaturas">
          {fotos.map((url, i) => (
            <button
              key={url}
              type="button"
              className={i === atual ? 'ativa' : ''}
              onClick={() => setAtual(i)}
              aria-label={`Ver foto ${i + 1}`}
            >
              <CapaLivro livro={livro} fotos={[url]} alt="" />
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
