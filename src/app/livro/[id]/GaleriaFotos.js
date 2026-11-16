/**
 * Galeria das fotos do livro (foto grande + miniaturas clicáveis).
 */
'use client';

import { useState } from 'react';
import Icone from '@/components/Icone';

export default function GaleriaFotos({ fotos = [], titulo = '' }) {
  const [atual, setAtual] = useState(0);

  if (fotos.length === 0) {
    return (
      <div className="galeria-principal galeria-vazia">
        <Icone nome="livros" alt="Sem foto" tam={60} />
      </div>
    );
  }

  return (
    <div className="galeria">
      <div className="galeria-principal">
        <img src={fotos[atual]} alt={`${titulo} — foto ${atual + 1}`} />
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
              <img src={url} alt="" />
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
