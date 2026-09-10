/**
 * Widget do chatbot "BibliIA" (flutuante, canto inferior direito).
 * Equivalente ao footer.php + chatbot.js do PHP original.
 * Envia mensagens para /api/chat (que usa o motor de IA em
 * src/lib/iaEngine.js). Componente CLIENT.
 */
'use client';

import Link from 'next/link';
import { useEffect, useRef, useState } from 'react';
import Icone from '@/components/Icone';
import CapaLivro from '@/components/CapaLivro';
import { preco } from '@/lib/format';

const SUGESTOES = [
  { texto: 'gosto de fantasia e aventura', icone: 'espada', rotulo: 'Fantasia e aventura' },
  { texto: 'quero algo de romance e amor', icone: 'coracao-romance', rotulo: 'Romance' },
  { texto: 'me indica livros de tecnologia e programação', icone: 'robo', rotulo: 'Tecnologia' },
  { texto: 'quero um suspense e mistério', icone: 'lupa-misterio', rotulo: 'Mistério' },
];

export default function Chatbot() {
  const [aberto, setAberto] = useState(false);
  const [mensagens, setMensagens] = useState([]);
  const [input, setInput] = useState('');
  const [pensando, setPensando] = useState(false);
  const corpoRef = useRef(null);

  useEffect(() => {
    // Mensagem inicial do assistente
    setMensagens([{
      tipo: 'ia',
      html: (
        <>
          Olá! <Icone nome="sorriso" alt="Sorriso" tam={16} /> Sou a <b>BibliIA</b>, sua
          assistente de leitura. Me conte o que você gosta de ler e eu indico os
          livros perfeitos para você!
        </>
      ),
    }]);
  }, []);

  useEffect(() => {
    if (corpoRef.current) corpoRef.current.scrollTop = corpoRef.current.scrollHeight;
  }, [mensagens, pensando]);

  function sugerir(texto) {
    enviar(texto);
  }

  async function enviar(mensagem) {
    const texto = mensagem.trim();
    if (!texto || pensando) return;

    setMensagens((atual) => [...atual, { tipo: 'user', html: <b>Você:</b>, texto: texto.replace(/</g, '&lt;') }]);
    setInput('');
    setPensando(true);

    try {
      const res = await fetch('/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ mensagem: texto }),
      });
      const r = await res.json();

      setMensagens((atual) => [
        ...atual,
        { tipo: 'ia', html: <span dangerouslySetInnerHTML={{ __html: r.texto }} />, livros: r.livros || [] },
      ]);
    } catch {
      setMensagens((atual) => [
        ...atual,
        { tipo: 'ia', html: <>Ops, tive um problema na conexão. Tente novamente!</> },
      ]);
    } finally {
      setPensando(false);
    }
  }

  function Cartoes({ livros }) {
    if (!livros.length) return null;
    return (
      <div className="chat-resultados">
        {livros.slice(0, 3).map((l) => (
          <div key={l.id} className="chat-resultado">
            <div className="capa-mini">
              <CapaLivro livro={l} largura="42px" />
            </div>
            <div style={{ flex: 1, minWidth: 0 }}>
              <b>{l.titulo}</b>
              <small>{l.autor} · {preco(l.preco)}</small>
            </div>
            <Link className="btn btn-primary" href={`/produto/${l.id}`}>Ver</Link>
          </div>
        ))}
        {livros.length > 3 && (
          <div style={{ textAlign: 'center', marginTop: 8 }}>
            <Link className="btn btn-ghost btn-sm" href="/ia">Ver todas as {livros.length} indicações →</Link>
          </div>
        )}
      </div>
    );
  }

  return (
    <>
      <button className="fab-chat" id="fabChat" onClick={() => setAberto(!aberto)} title="Fale com a IA">
        <Icone nome="chat" alt="Falar com a IA" tam={26} />
      </button>

      {aberto && (
        <div className="chat-widget" id="chatWidget" style={{ display: 'flex' }}>
          <div className="chat-header">
            <div>
              <strong>BibliIA</strong>
              <small>Assistente de recomendação</small>
            </div>
            <button onClick={() => setAberto(false)} aria-label="Fechar" title="Fechar">✕</button>
          </div>

          <div className="chat-body" ref={corpoRef}>
            {mensagens.map((m, i) => (
              <div key={i} className={`msg ${m.tipo}`}>
                {m.html}
                {m.texto && <span className="texto-usuario">{m.texto}</span>}
                <Cartoes livros={m.livros} />
              </div>
            ))}
            {pensando && (
              <div className="msg ia">
                <span className="pensando">BibliIA está pensando <span className="pontinhos"><span>.</span><span>.</span><span>.</span></span></span>
              </div>
            )}
          </div>

          <form
            className="chat-input"
            onSubmit={(e) => {
              e.preventDefault();
              enviar(input);
            }}
          >
            <input
              type="text"
              id="chatMsg"
              placeholder="Ex.: gosto de ficção científica..."
              autoComplete="off"
              value={input}
              onChange={(e) => setInput(e.target.value)}
            />
            <button type="submit" aria-label="Enviar">➤</button>
          </form>

          {mensagens.length <= 1 && (
            <div className="sugestoes-chat">
              {SUGESTOES.map((s) => (
                <button key={s.rotulo} className="chip" type="button" onClick={() => sugerir(s.texto)}>
                  <Icone nome={s.icone} alt={s.rotulo} tam={14} /> {s.rotulo}
                </button>
              ))}
            </div>
          )}
        </div>
      )}
    </>
  );
}