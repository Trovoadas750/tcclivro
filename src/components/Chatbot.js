/**
 * Widget do chatbot "BibliIA" (flutuante, canto inferior direito).
 * Cada mensagem do leitor vira um pedido para POST /api/recomendar (o mesmo
 * da página /ia): modo IA com provedor gratuito ou modo local. As respostas
 * aparecem como texto puro (nada de HTML vindo do servidor) e os livros em
 * cards compactos, com dados do banco. Componente CLIENT. Funciona deslogado.
 */
'use client';

import Link from 'next/link';
import { useEffect, useRef, useState } from 'react';
import Icone from '@/components/Icone';
import CardRecomendacao from '@/components/CardRecomendacao';
import { PEDIDO_MAX, PEDIDO_MIN, SUGESTOES_IA, pedirRecomendacao, rodapeRecomendacao } from '@/lib/recomendar';

const BOAS_VINDAS = {
  de: 'bibliia',
  texto: 'Olá! Sou a BibliIA, sua assistente de leitura. Conte o que você gosta de ler e eu indico livros do nosso catálogo.',
};

export default function Chatbot() {
  const [aberto, setAberto] = useState(false);
  const [mensagens, setMensagens] = useState([BOAS_VINDAS]);
  const [entrada, setEntrada] = useState('');
  const [pensando, setPensando] = useState(false);
  const corpoRef = useRef(null);

  // Rola até a última mensagem.
  useEffect(() => {
    if (corpoRef.current) corpoRef.current.scrollTop = corpoRef.current.scrollHeight;
  }, [mensagens, pensando, aberto]);

  async function enviar(texto) {
    const t = String(texto).trim();
    if (pensando) return;
    if (t.length < PEDIDO_MIN) return;
    setEntrada('');
    setMensagens((m) => [...m, { de: 'voce', texto: t }]);
    setPensando(true);

    const r = await pedirRecomendacao(t);
    setPensando(false);
    setMensagens((m) => [
      ...m,
      r.ok
        ? { de: 'bibliia', texto: r.mensagem || 'Veja o que encontrei no catálogo:', livros: r.livros, modo: r.modo }
        : { de: 'bibliia', texto: r.erro, erro: true },
    ]);
  }

  return (
    <>
      <button className="fab-chat" type="button" onClick={() => setAberto(!aberto)} title="Fale com a BibliIA" aria-expanded={aberto}>
        <Icone nome="chat" alt="Falar com a BibliIA" tam={26} />
      </button>

      {aberto && (
        <div className="chat-widget" style={{ display: 'flex' }} role="dialog" aria-label="BibliIA, assistente de leitura">
          <div className="chat-header">
            <div>
              <strong>BibliIA</strong>
              <small>Assistente de recomendação</small>
            </div>
            <button type="button" onClick={() => setAberto(false)} aria-label="Fechar" title="Fechar">✕</button>
          </div>

          <div className="chat-body" ref={corpoRef} aria-live="polite">
            {mensagens.map((m, i) => (
              <div key={i} className={`msg ${m.de === 'voce' ? 'user' : 'ia'}`}>
                {m.de === 'voce' && <b>Você: </b>}
                <span className={m.erro ? 'msg-erro' : undefined}>{m.texto}</span>
                {m.livros?.length > 0 && (
                  <div className="chat-resultados">
                    {m.livros.map((livro) => (
                      <CardRecomendacao key={livro.id} livro={livro} compacto />
                    ))}
                  </div>
                )}
                {m.modo && <small className="chat-rodape">{rodapeRecomendacao(m.modo)}</small>}
              </div>
            ))}
            {pensando && (
              <div className="msg ia">
                <span className="pensando">Procurando livros<span className="pontinhos"><span>.</span><span>.</span><span>.</span></span></span>
              </div>
            )}
          </div>

          {mensagens.length <= 1 && (
            <div className="sugestoes-chat">
              {SUGESTOES_IA.map((s) => (
                <button key={s} className="chip" type="button" onClick={() => enviar(s)} disabled={pensando}>{s}</button>
              ))}
            </div>
          )}

          <form
            className="chat-input"
            onSubmit={(e) => {
              e.preventDefault();
              enviar(entrada);
            }}
          >
            <input
              type="text"
              placeholder="Ex.: um suspense curto..."
              autoComplete="off"
              maxLength={PEDIDO_MAX}
              value={entrada}
              onChange={(e) => setEntrada(e.target.value)}
              disabled={pensando}
              aria-label="O que você quer ler?"
            />
            <button type="submit" aria-label="Recomendar" disabled={pensando || entrada.trim().length < PEDIDO_MIN}>➤</button>
          </form>
          <div className="chat-aviso">
            Não digite dados pessoais. · <Link href="/ia" onClick={() => setAberto(false)}>Abrir página de recomendação</Link>
          </div>
        </div>
      )}
    </>
  );
}
