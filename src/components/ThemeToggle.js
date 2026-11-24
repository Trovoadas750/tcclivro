/**
 * Seletor de tema: Sépia (claro, papel — padrão) e Escuro.
 * O tema fica no localStorage (key: casa_leitor_tema) e é aplicado no
 * <html data-theme="..."> antes da hidratação pelo ThemeScript.
 *
 *  - padrão (cabeçalho): um botão que alterna entre os dois temas;
 *  - `lista` (menu do celular): as duas opções lado a lado.
 * Componente 100% client-side.
 */
'use client';

import { useEffect, useState } from 'react';
import { STORAGE_KEYS, TEMAS, TEMA_PADRAO } from '@/lib/config';

export default function ThemeToggle({ lista = false }) {
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

  if (lista) {
    return (
      <div className="tema-lista" role="radiogroup" aria-label="Tema do site">
        {Object.entries(TEMAS).map(([chave, rotulo]) => (
          <button
            key={chave}
            type="button"
            role="radio"
            aria-checked={tema === chave}
            className={`tema-opcao ${tema === chave ? 'ativo' : ''}`}
            onClick={() => aplicar(chave)}
          >
            <span className={`swatch swatch-${chave}`} aria-hidden="true" /> {rotulo}
          </button>
        ))}
      </div>
    );
  }

  const chaves = Object.keys(TEMAS);
  const proximo = chaves[(chaves.indexOf(tema) + 1) % chaves.length];
  return (
    <button
      type="button"
      className="btn-tema"
      onClick={() => aplicar(proximo)}
      title={`Tema atual: ${TEMAS[tema]}. Trocar para ${TEMAS[proximo]}`}
      aria-label={`Tema ${TEMAS[tema]}. Trocar para tema ${TEMAS[proximo]}`}
    >
      <span className={`swatch swatch-${tema}`} aria-hidden="true" />
      <span className="btn-tema-rotulo so-largo">{TEMAS[tema]}</span>
    </button>
  );
}
