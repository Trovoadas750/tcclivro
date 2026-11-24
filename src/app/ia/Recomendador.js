/**
 * Formulário e resultados da recomendação (/ia).
 * Componente CLIENT: envia o pedido para POST /api/recomendar e mostra a
 * mensagem e os livros indicados (dados sempre do banco). A resposta diz o
 * modo usado ('ia' ou 'local'), que muda só o rodapé discreto.
 * Funciona deslogado.
 */
'use client';

import Link from 'next/link';
import { useRef, useState } from 'react';
import Icone from '@/components/Icone';
import CardRecomendacao from '@/components/CardRecomendacao';
import { PEDIDO_MAX, PEDIDO_MIN, SUGESTOES_IA, pedirRecomendacao, rodapeRecomendacao } from '@/lib/recomendar';

export default function Recomendador() {
  const [pedido, setPedido] = useState('');
  const [carregando, setCarregando] = useState(false);
  const [resultado, setResultado] = useState(null); // { pedido, mensagem, livros }
  const [erro, setErro] = useState(null);
  const resultadoRef = useRef(null);

  const tamanho = pedido.trim().length;
  const valido = tamanho >= PEDIDO_MIN && tamanho <= PEDIDO_MAX;

  async function recomendar(texto) {
    const t = String(texto).trim();
    if (carregando || t.length < PEDIDO_MIN || t.length > PEDIDO_MAX) return;
    setCarregando(true);
    setErro(null);
    const r = await pedirRecomendacao(t);
    setCarregando(false);
    if (!r.ok) {
      setErro(r.erro);
      return;
    }
    setResultado({ pedido: t, modo: r.modo, mensagem: r.mensagem, livros: r.livros });
    // Leva o usuário até os resultados (útil no celular).
    requestAnimationFrame(() => resultadoRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' }));
  }

  function enviar(e) {
    e.preventDefault();
    recomendar(pedido);
  }

  function usarSugestao(s) {
    setPedido(s);
    recomendar(s);
  }

  return (
    <>
      <section className="ia-hero">
        <h1><Icone nome="faiscas" alt="" tam={26} /> Não sabe o que ler?</h1>
        <p>Conte com suas palavras o que você quer ler e a nossa IA indica livros do catálogo, explicando cada escolha.</p>

        <form onSubmit={enviar} className="ia-busca">
          <label htmlFor="ia-pedido" className="sr-only">O que você quer ler?</label>
          <textarea
            id="ia-pedido"
            value={pedido}
            maxLength={PEDIDO_MAX}
            onChange={(e) => setPedido(e.target.value)}
            onKeyDown={(e) => {
              // Enter envia; Shift+Enter quebra a linha.
              if (e.key === 'Enter' && !e.shiftKey) {
                e.preventDefault();
                recomendar(pedido);
              }
            }}
            placeholder='Ex.: "um suspense curto parecido com Agatha Christie" ou "fantasia com dragões para adolescentes"'
            disabled={carregando}
          />
          <div className="ia-campo-rodape">
            <span className="ia-dados-pessoais"><Icone nome="cadeado" alt="" tam={13} /> Não digite dados pessoais.</span>
            <span className="ia-contador" aria-live="polite">{tamanho}/{PEDIDO_MAX}</span>
          </div>

          <div className="chips ia-sugestoes">
            {SUGESTOES_IA.map((s) => (
              <button key={s} type="button" className="chip" onClick={() => usarSugestao(s)} disabled={carregando}>
                {s}
              </button>
            ))}
          </div>

          <button className="btn btn-accent" type="submit" disabled={carregando || !valido} style={{ width: '100%', justifyContent: 'center', marginTop: 14, padding: 14 }}>
            {carregando ? (
              <span className="pensando">Procurando livros<span className="pontinhos"><span>.</span><span>.</span><span>.</span></span></span>
            ) : (
              <><Icone nome="robo" alt="" tam={18} /> Recomendar</>
            )}
          </button>
        </form>
      </section>

      {erro && (
        <div className="toast toast-error" role="alert" style={{ marginTop: 20 }}>{erro}</div>
      )}

      {resultado && (
        <section className="secao" ref={resultadoRef} aria-live="polite">
          <div className="painel ia-mensagem">
            <Icone nome="robo" alt="" tam={22} />
            <div>
              <small>Você pediu: “{resultado.pedido}”</small>
              <p>{resultado.mensagem}</p>
            </div>
          </div>

          {resultado.livros.length > 0 ? (
            <div className="lista-recomendacoes">
              {resultado.livros.map((livro) => (
                <CardRecomendacao key={livro.id} livro={livro} />
              ))}
            </div>
          ) : (
            <div className="vazio">
              <p>Tente descrever de outro jeito ou explore o catálogo.</p>
              <Link className="btn btn-primary" href="/busca">Explorar catálogo</Link>
            </div>
          )}

          <p className="ia-aviso">{rodapeRecomendacao(resultado.modo)}</p>
        </section>
      )}

      {!resultado && !carregando && (
        <section className="secao">
          <div className="secao-titulo">
            <h2><Icone nome="lampada" alt="" tam={20} /> Como funciona</h2>
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit,minmax(240px,1fr))', gap: 18 }}>
            <div className="painel">
              <span style={{ display: 'inline-block' }}><Icone nome="falando" alt="" tam={32} /></span>
              <h3 style={{ margin: '8px 0' }}>1. Descreva seu gosto</h3>
              <p style={{ color: 'var(--muted)', fontSize: 14 }}>Estilo, tema, um autor ou livro de que você gostou, o clima da história.</p>
            </div>
            <div className="painel">
              <span style={{ display: 'inline-block' }}><Icone nome="cerebro" alt="" tam={32} /></span>
              <h3 style={{ margin: '8px 0' }}>2. A IA procura no catálogo</h3>
              <p style={{ color: 'var(--muted)', fontSize: 14 }}>Ela entende o pedido e analisa títulos, autores, categorias e sinopses dos livros disponíveis.</p>
            </div>
            <div className="painel">
              <span style={{ display: 'inline-block' }}><Icone nome="alvo" alt="" tam={32} /></span>
              <h3 style={{ margin: '8px 0' }}>3. Receba até 5 indicações</h3>
              <p style={{ color: 'var(--muted)', fontSize: 14 }}>Cada livro vem com o motivo da escolha. Só livros do nosso catálogo, com estoque.</p>
            </div>
          </div>
        </section>
      )}
    </>
  );
}
