/**
 * Alternador de temas (Sépia / Escuro).
 * Equivalente ao bloco de temas do main.js do PHP original.
 * O tema é persistido no localStorage (key: casa_leitor_tema).
 * Componente 100% client-side.
 */
'use client';

import { useEffect, useState } from 'react';
import { STORAGE_KEYS, TEMAS, TEMA_PADRAO } from '@/lib/config';

export default function ThemeToggle() {
  const [aberto, setAberto] = useState(false);
  const [tema, setTema] = useState(TEMA_PADRAO);

  useEffect(() => {
    // O ThemeScript já aplicou o tema válido no <html> antes da hidratação;
    // aqui só sincronizamos o estado do botão com ele.
    const atual = document.documentElement.getAttribute('data-theme');
    if (TEMAS[atual]) setTema(atual);
  }, []);

  function aplicar(novoTema) {
    document.documentElement.setAttribute('data-theme', novoTema);
    setTema(novoTema);
    try {
      localStorage.setItem(STORAGE_KEYS.TEMA, novoTema);
    } catch {}
  }

  return (
    <div className="dropdown dropdown-tema" onClick={(e) => e.stopPropagation()}>
      <button className="btn-tema" type="button" onClick={() => setAberto(!aberto)} aria-label="Escolher tema">
        <span className={`swatch swatch-${tema}`} />
        <span>{TEMAS[tema]}</span>
        <span className="seta">▾</span>
      </button>
      {aberto && (
        <div className="dropdown-menu">
          {Object.entries(TEMAS).map(([chave, rotulo]) => (
            <button
              key={chave}
              className={`tema-opcao ${tema === chave ? 'ativo' : ''}`}
              data-tema={chave}
              type="button"
              onClick={() => {
                aplicar(chave);
                setAberto(false);
              }}
            >
              <span className={`swatch swatch-${chave}`} />{rotulo}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
