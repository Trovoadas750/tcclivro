/**
 * Página de recomendação com IA (equivalente ao ia.php do PHP).
 * Componente CLIENT: envia o texto digitado para /api/recomendacao
 * (que usa o motor em src/lib/iaEngine.js) e exibe os resultados
 * com as razões de cada escolha.
 */
'use client';

import { useState } from 'react';
import Icone from '@/components/Icone';
import LivroCard from '@/components/LivroCard';

export default function IA() {
  const [texto, setTexto] = useState('');
  const [resultado, setResultado] = useState(null);
  const [carregando, setCarregando] = useState(false);

  async function gerar(e) {
    e.preventDefault();
    if (!texto.trim()) return;
    setCarregando(true);
    setResultado(null);

    try {
      // O PHP fazia POST em ia.php; aqui chamamos a rota de API.
      const res = await fetch('/api/recomendacao', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ texto }),
      });
      const r = await res.json();
      if (r.ok) setResultado(r);
      else window.showToast?.(r.msg || 'Erro ao gerar recomendações.', 'warning');
    } catch {
      window.showToast?.('Erro ao gerar recomendações.', 'error');
    } finally {
      setCarregando(false);
    }
  }

  return (
    <>
      <section className="ia-hero">
        <h1><Icone nome="faiscas" alt="IA" tam={26} /> Recomendação com Inteligência Artificial</h1>
        <p>
          Nossa IA lê a sua descrição, cruza com títulos, autores, categorias e temas do catálogo
          — e ainda usa o seu perfil e favoritos — para indicar as leituras mais alinhadas com você.
        </p>
        <form onSubmit={gerar} className="ia-busca">
          <textarea
            name="texto"
            required
            placeholder='Descreva o que você gosta de ler… ex.: "gosto de fantasia com magia e aventura" ou "quero um suspense policial cheio de mistério"'
            value={texto}
            onChange={(e) => setTexto(e.target.value)}
          />
          <button className="btn btn-accent" type="submit" style={{ width: '100%', justifyContent: 'center', marginTop: 14, padding: 14 }}>
            <Icone nome="robo" alt="IA" tam={18} /> {carregando ? 'Analisando...' : 'Gerar recomendações'}
          </button>
          <div className="ia-dica">
            <Icone nome="lampada" alt="Dica" tam={14} /> Experimente: &quot;romance emocionante&quot;,
            &quot;livro de programação para iniciantes&quot;, &quot;ficção científica sobre espaço&quot;...
          </div>
        </form>
      </section>

      {resultado && (
        <>
          {resultado.metodo === 'editorial' ? (
            <section className="secao">
              <div className="painel" style={{ background: 'var(--warning-soft)', borderColor: 'var(--accent)' }}>
                <b><Icone nome="robo" alt="IA" tam={18} /> Não reconheci o estilo.</b> Descreva melhor
                (ex.: &quot;fantasia e aventura&quot;, &quot;romance de época&quot;) — enquanto isso,
                veja os <b>destaques do catálogo</b>:
              </div>
            </section>
          ) : (
            <div className="secao-titulo">
              <h2><Icone nome="alvo" alt="Recomendação" tam={20} /> Recomendações para você</h2>
              <span style={{ color: 'var(--muted)', fontSize: 13.5 }}>
                {resultado.perfil && (
                  <><Icone nome="coracao-roxo" alt="Personalizado" tam={14} /> Personalizado com seu perfil · </> 
                )}
                termos analisados: {resultado.consulta.map((t) => <b key={t}> {t}</b>)}
              </span>
            </div>
          )}

          <div className="grid-livros" style={{ marginBottom: 40 }}>
            {resultado.livros.map((livro) => (
              <LivroCard key={livro.id} livro={livro} />
            ))}
          </div>
        </>
      )}

      {!resultado && !carregando && (
        <section className="secao">
          <div className="secao-titulo">
            <h2><Icone nome="lampada" alt="Como funciona" tam={20} /> Como funciona</h2>
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit,minmax(240px,1fr))', gap: 18 }}>
            <div className="painel">
              <span style={{ display: 'inline-block' }}><Icone nome="falando" alt="Descreva seu gosto" tam={32} /></span>
              <h3 style={{ margin: '8px 0' }}>1. Descreva seu gosto</h3>
              <p style={{ color: 'var(--muted)', fontSize: 14 }}>Escreva com suas palavras: estilos, temas, autores, clima.</p>
            </div>
            <div className="painel">
              <span style={{ display: 'inline-block' }}><Icone nome="cerebro" alt="IA analisa" tam={32} /></span>
              <h3 style={{ margin: '8px 0' }}>2. A IA analisa o acervo</h3>
              <p style={{ color: 'var(--muted)', fontSize: 14 }}>Cruza seu texto com títulos, sinopses, categorias e tags temáticas de todos os livros.</p>
            </div>
            <div className="painel">
              <span style={{ display: 'inline-block' }}><Icone nome="alvo" alt="Receba indicações" tam={32} /></span>
              <h3 style={{ margin: '8px 0' }}>3. Receba as melhores indicações</h3>
              <p style={{ color: 'var(--muted)', fontSize: 14 }}>Cada livro vem com a explicação do porquê ele foi escolhido para você.</p>
            </div>
          </div>
        </section>
      )}
    </>
  );
}