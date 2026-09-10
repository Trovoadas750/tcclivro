/**
 * Notificação flutuante (toast) no estilo cartão: avatar + título +
 * descrição + ação opcional. Inspirado no protótipo GerarToast.jsx
 * (sonner + shadcn/ui) que foi adaptado para o CSS puro do projeto,
 * já que não há Tailwind/shadcn instalados aqui.
 *
 * Uso simples (compatível com o formato antigo):
 *   window.showToast('Mensagem', 'success' | 'warning' | 'error')
 *
 * Uso avançado (avatar com a capa do livro, descrição e botão de ação):
 *   window.showToast({
 *     titulo: 'Adicionado ao carrinho!',
 *     descricao: livro.titulo,
 *     livro,                          // usa a capa do livro como avatar
 *     tipo: 'success',
 *     acao: { rotulo: 'Ver carrinho', href: '/carrinho' },
 *   })
 */
'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Icone from '@/components/Icone';
import { capaDataURL } from '@/lib/capa';

export default function Toasts() {
  const [mensagens, setMensagens] = useState([]);
  const router = useRouter();

  useEffect(() => {
    window.showToast = (entrada, tipo = 'success') => {
      const dados = typeof entrada === 'string' ? { titulo: entrada, tipo } : { tipo, ...entrada };
      const id = Date.now() + Math.random();
      setMensagens((atual) => [...atual, { id, ...dados }]);
      setTimeout(() => {
        setMensagens((atual) => atual.filter((m) => m.id !== id));
      }, 4500);
    };
    return () => {
      delete window.showToast;
    };
  }, []);

  function fechar(id) {
    setMensagens((atual) => atual.filter((m) => m.id !== id));
  }

  function executarAcao(m) {
    if (m.acao?.href) router.push(m.acao.href);
    fechar(m.id);
  }

  return (
    <div className="toast-container">
      {mensagens.map((m) => (
        <div key={m.id} className="toast-card" role="status">
          <span className={`toast-avatar tipo-${m.tipo || 'success'}`}>
            {m.livro ? (
              <img src={capaDataURL(m.livro)} alt={m.livro.titulo} />
            ) : (
              <Icone nome="livros" alt="Casa do Leitor" tam={19} />
            )}
          </span>

          <div className="toast-corpo">
            <div className="toast-titulo">{m.titulo}</div>
            {m.descricao && <p className="toast-descricao">{m.descricao}</p>}
            {m.acao && (
              <div className="toast-acoes">
                <button type="button" className="btn btn-ghost btn-sm" onClick={() => executarAcao(m)}>
                  {m.acao.rotulo}
                </button>
              </div>
            )}
          </div>

          <button type="button" className="toast-fechar" aria-label="Fechar" title="Fechar" onClick={() => fechar(m.id)}>
            ✕
          </button>
        </div>
      ))}
    </div>
  );
}
