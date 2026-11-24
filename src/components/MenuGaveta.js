/**
 * Gaveta lateral do celular/tablet (aberta pelo botão de menu do cabeçalho).
 * Conta, links principais, categorias e seletor de tema.
 *
 * Acessibilidade: role="dialog" + aria-modal; o foco vai para o botão de
 * fechar ao abrir e fica preso dentro da gaveta (Tab/Shift+Tab); Esc ou
 * toque fora fecha; a rolagem da página trava enquanto está aberta.
 */
'use client';

import Link from 'next/link';
import { useEffect, useRef } from 'react';
import IconeSvg from '@/components/IconeSvg';
import LogoMarca from '@/components/LogoMarca';
import ThemeToggle from '@/components/ThemeToggle';

export default function MenuGaveta({ aberta, onFechar, usuario, nome, vendedor, categorias, sair }) {
  const painelRef = useRef(null);
  const fecharRef = useRef(null);

  useEffect(() => {
    if (!aberta) return;
    const rolagemAntes = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    fecharRef.current?.focus();

    function tecla(e) {
      if (e.key === 'Escape') {
        onFechar();
        return;
      }
      if (e.key !== 'Tab' || !painelRef.current) return;
      // Mantém o foco dentro da gaveta.
      const focaveis = painelRef.current.querySelectorAll('a[href], button:not([disabled])');
      if (focaveis.length === 0) return;
      const primeiro = focaveis[0];
      const ultimo = focaveis[focaveis.length - 1];
      if (e.shiftKey && document.activeElement === primeiro) {
        e.preventDefault();
        ultimo.focus();
      } else if (!e.shiftKey && document.activeElement === ultimo) {
        e.preventDefault();
        primeiro.focus();
      }
    }
    document.addEventListener('keydown', tecla);
    return () => {
      document.body.style.overflow = rolagemAntes;
      document.removeEventListener('keydown', tecla);
    };
  }, [aberta, onFechar]);

  if (!aberta) return null;

  return (
    <div className="gaveta-fundo" onClick={onFechar}>
      <div
        ref={painelRef}
        id="menu-gaveta"
        className="gaveta"
        role="dialog"
        aria-modal="true"
        aria-label="Menu"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="gaveta-topo">
          <LogoMarca tam={44} nome />
          <button ref={fecharRef} type="button" className="gaveta-fechar" aria-label="Fechar menu" onClick={onFechar}>
            <IconeSvg nome="fechar" tam={22} />
          </button>
        </div>

        <div className="gaveta-conta">
          {usuario ? (
            <>
              <p className="gaveta-ola">Olá, {nome}!</p>
              <div className="gaveta-links">
                <Link href="/minha-conta"><IconeSvg nome="usuario" tam={20} /> Minha conta</Link>
                <Link href="/meus-pedidos"><IconeSvg nome="pacote" tam={20} /> Meus pedidos</Link>
                <Link href="/favoritos"><IconeSvg nome="coracao" tam={20} /> Favoritos</Link>
              </div>
            </>
          ) : (
            <>
              <p className="gaveta-ola">Entre para ver pedidos e favoritos.</p>
              <div className="gaveta-botoes">
                <Link className="btn btn-primary btn-sm" href="/auth/login">Entrar</Link>
                <Link className="btn btn-ghost btn-sm" href="/auth/registro">Criar conta</Link>
              </div>
            </>
          )}
        </div>

        <nav className="gaveta-links" aria-label="Navegação principal">
          <Link href="/"><IconeSvg nome="inicio" tam={20} /> Início</Link>
          <Link href="/busca"><IconeSvg nome="livro" tam={20} /> Catálogo</Link>
          <Link href="/busca?ordenar=recentes"><IconeSvg nome="livro" tam={20} /> Lançamentos</Link>
          <Link href="/ia"><IconeSvg nome="faiscas" tam={20} /> Recomendação com IA <span className="selo-novo">Novo</span></Link>
          <Link href={vendedor ? '/painel-vendedor' : '/vendedor/cadastro'}>
            <IconeSvg nome="loja" tam={20} /> {vendedor ? 'Meu painel' : 'Tornar-se vendedor'}
          </Link>
        </nav>

        {categorias.length > 0 && (
          <div className="gaveta-secao">
            <h2 className="gaveta-titulo">Categorias</h2>
            <ul className="gaveta-categorias">
              {categorias.map((c) => (
                <li key={c.categoria}>
                  <Link href={`/busca?categoria=${encodeURIComponent(c.categoria)}`}>{c.categoria}</Link>
                </li>
              ))}
            </ul>
          </div>
        )}

        <div className="gaveta-secao">
          <h2 className="gaveta-titulo">Aparência</h2>
          <ThemeToggle lista />
        </div>

        {usuario && (
          <button type="button" className="gaveta-sair" onClick={() => { onFechar(); sair(); }}>
            <IconeSvg nome="sair" tam={20} /> Sair
          </button>
        )}
      </div>
    </div>
  );
}
