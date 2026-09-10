/**
 * Alternador de temas (Livro / Claro / Escuro / Sépia).
 * Equivalente ao bloco de temas do main.js do PHP original.
 * O tema é persistido no localStorage (key: casa_leitor_tema).
 * Componente 100% client-side.
 */
'use client';

import { useEffect, useState } from 'react';

const TEMAS = { livro: 'Livro', claro: 'Claro', escuro: 'Escuro', sepia: 'Sépia' };
const STORAGE_KEY = 'casa_leitor_tema';

export default function ThemeToggle() {
  const [aberto, setAberto] = useState(false);
  const [tema, setTema] = useState('livro');

  useEffect(() => {
    // Lê o tema salvo (o layout já aplica antes da hidratação via <script>)
    let salvo = 'livro';
    try {
      salvo = localStorage.getItem(STORAGE_KEY) || 'livro';
    } catch {}
    aplicar(salvo);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  function aplicar(novoTema, salvar = true) {
    document.documentElement.setAttribute('data-theme', novoTema);
    setTema(novoTema);
    if (salvar) {
      try {
        localStorage.setItem(STORAGE_KEY, novoTema);
      } catch {}
    }
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