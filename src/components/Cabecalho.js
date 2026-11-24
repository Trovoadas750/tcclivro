/**
 * Cabeçalho global (todas as páginas), fixo no topo.
 *
 * Desktop (≥ 1024 px), duas linhas na cor primária:
 *   1) logo · busca larga · chamada "Recomendação com IA"
 *   2) Categorias ▾ · links rápidos · tema · conta · carrinho
 * Celular/tablet (< 1024 px):
 *   1) menu (gaveta) · logo · carrinho
 *   2) busca na largura toda
 * A barra inferior do celular fica em NavInferiorMobile.js.
 *
 * Componente CLIENT (sessão, categorias e carrinho vêm do navegador).
 */
'use client';

import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { useCallback, useEffect, useRef, useState } from 'react';
import IconeSvg from '@/components/IconeSvg';
import LogoMarca from '@/components/LogoMarca';
import MenuGaveta from '@/components/MenuGaveta';
import ThemeToggle from '@/components/ThemeToggle';
import { limparCachePerfil } from '@/lib/perfilStore';
import { useCategorias } from '@/lib/useCategorias';
import { useQtdCarrinho } from '@/lib/useQtdCarrinho';
import { primeiroNome, useTipoConta } from '@/lib/useTipoConta';

/** Fecha um menu suspenso ao clicar fora dele ou apertar Esc. */
function useFecharAoSair(ref, aberto, fechar) {
  useEffect(() => {
    if (!aberto) return;
    const clique = (e) => ref.current && !ref.current.contains(e.target) && fechar();
    const tecla = (e) => e.key === 'Escape' && fechar();
    document.addEventListener('mousedown', clique);
    document.addEventListener('keydown', tecla);
    return () => {
      document.removeEventListener('mousedown', clique);
      document.removeEventListener('keydown', tecla);
    };
  }, [ref, aberto, fechar]);
}

/** Campo de busca do cabeçalho → /busca?q= */
function Busca({ id }) {
  const router = useRouter();
  const [termo, setTermo] = useState('');
  return (
    <form
      className="cab-busca"
      role="search"
      onSubmit={(e) => {
        e.preventDefault();
        const q = termo.trim();
        router.push(q ? `/busca?q=${encodeURIComponent(q)}` : '/busca');
      }}
    >
      <label htmlFor={id} className="sr-only">Buscar livros</label>
      <input
        id={id}
        type="search"
        name="q"
        placeholder="Buscar livros, autores e categorias…"
        autoComplete="off"
        value={termo}
        onChange={(e) => setTermo(e.target.value)}
      />
      <button type="submit" aria-label="Buscar"><IconeSvg nome="buscar" tam={20} /></button>
    </form>
  );
}

/** Ícone do carrinho com contador. */
export function LinkCarrinho({ className = '' }) {
  const qtd = useQtdCarrinho();
  return (
    <Link href="/carrinho" className={`cab-carrinho ${className}`} aria-label={`Carrinho, ${qtd} ${qtd === 1 ? 'item' : 'itens'}`}>
      <IconeSvg nome="carrinho" tam={24} />
      {qtd > 0 && <span className="cab-contador" aria-hidden="true">{qtd > 99 ? '99+' : qtd}</span>}
    </Link>
  );
}

/** "Categorias ▾" com as categorias reais do catálogo. */
function MenuCategorias({ categorias }) {
  const [aberto, setAberto] = useState(false);
  const ref = useRef(null);
  useFecharAoSair(ref, aberto, () => setAberto(false));

  return (
    <div className="cab-menu" ref={ref}>
      <button type="button" className="cab-link cab-link-botao" aria-expanded={aberto} aria-controls="menu-categorias" onClick={() => setAberto(!aberto)}>
        <IconeSvg nome="categorias" tam={18} /> Categorias <IconeSvg nome="seta-baixo" tam={16} />
      </button>
      {aberto && (
        <div className="cab-painel cab-painel-categorias" id="menu-categorias">
          {categorias.length === 0 ? (
            <p className="cab-painel-vazio">Carregando categorias…</p>
          ) : (
            <ul>
              {categorias.map((c) => (
                <li key={c.categoria}>
                  <Link href={`/busca?categoria=${encodeURIComponent(c.categoria)}`} onClick={() => setAberto(false)}>
                    {c.categoria} <small>{c.livros}</small>
                  </Link>
                </li>
              ))}
            </ul>
          )}
          <Link className="cab-painel-rodape" href="/busca" onClick={() => setAberto(false)}>Ver todo o catálogo ›</Link>
        </div>
      )}
    </div>
  );
}

/** "Olá, {nome}" com o menu da conta. */
function MenuConta({ nome, tipo, sair }) {
  const [aberto, setAberto] = useState(false);
  const ref = useRef(null);
  useFecharAoSair(ref, aberto, () => setAberto(false));
  const fechar = () => setAberto(false);

  return (
    <div className="cab-menu" ref={ref}>
      <button type="button" className="cab-link cab-link-botao cab-conta" aria-expanded={aberto} aria-controls="menu-conta" onClick={() => setAberto(!aberto)}>
        <IconeSvg nome="usuario" tam={20} /> <span className="cab-conta-nome">Olá, {nome}</span> <IconeSvg nome="seta-baixo" tam={16} />
      </button>
      {aberto && (
        <div className="cab-painel cab-painel-conta" id="menu-conta">
          <Link href="/minha-conta" onClick={fechar}><IconeSvg nome="usuario" tam={18} /> Minha conta</Link>
          <Link href="/meus-pedidos" onClick={fechar}><IconeSvg nome="pacote" tam={18} /> Meus pedidos</Link>
          <Link href="/favoritos" onClick={fechar}><IconeSvg nome="coracao" tam={18} /> Favoritos</Link>
          {tipo === 'vendedor' && <Link href="/painel-vendedor" onClick={fechar}><IconeSvg nome="loja" tam={18} /> Meu painel</Link>}
          <button type="button" onClick={() => { fechar(); sair(); }}><IconeSvg nome="sair" tam={18} /> Sair</button>
        </div>
      )}
    </div>
  );
}

export default function Cabecalho() {
  const router = useRouter();
  const pathname = usePathname();
  const { usuario, tipo, nome, supabase } = useTipoConta();
  const categorias = useCategorias();
  const [gavetaAberta, setGavetaAberta] = useState(false);
  const botaoMenuRef = useRef(null);

  // Logout em outra aba ou sessão expirada: apaga o cache do perfil.
  useEffect(() => {
    const { data: { subscription } } = supabase.auth.onAuthStateChange((evento) => {
      if (evento === 'SIGNED_OUT') limparCachePerfil();
    });
    return () => subscription.unsubscribe();
  }, [supabase]);

  // Fecha a gaveta ao trocar de página.
  useEffect(() => setGavetaAberta(false), [pathname]);

  // Função estável: a gaveta usa como dependência do efeito de foco.
  const fecharGaveta = useCallback(() => {
    setGavetaAberta(false);
    botaoMenuRef.current?.focus();
  }, []);

  async function sair() {
    await supabase.auth.signOut();
    limparCachePerfil();
    window.dispatchEvent(new Event('usuario-atualizado'));
    router.push('/');
    router.refresh();
  }

  const vendedor = tipo === 'vendedor';
  const ativo = (href) => (pathname === href ? 'page' : undefined);

  return (
    <header className="cabecalho">
      <a href="#conteudo" className="pular-conteudo">Pular para o conteúdo</a>

      {/* Linha 1 */}
      <div className="container cab-linha1">
        <button
          ref={botaoMenuRef}
          type="button"
          className="cab-icone so-compacto"
          aria-label="Abrir menu"
          aria-expanded={gavetaAberta}
          aria-controls="menu-gaveta"
          onClick={() => setGavetaAberta(true)}
        >
          <IconeSvg nome="menu" tam={24} />
        </button>

        <LogoMarca tam={50} nome prioridade className="cab-logo" />

        <div className="cab-busca-area">
          <Busca id="busca-cabecalho" />
        </div>

        <Link href="/ia" className="cab-selo-ia so-desktop">
          <IconeSvg nome="faiscas" tam={18} /> Recomendação com IA
        </Link>

        <LinkCarrinho className="cab-icone so-compacto" />
      </div>

      {/* Linha 2 (desktop) */}
      <nav className="cab-linha2 so-desktop" aria-label="Navegação principal">
        <div className="container cab-linha2-interna">
          <MenuCategorias categorias={categorias} />
          <Link className="cab-link" href="/busca?ordenar=recentes">Lançamentos</Link>
          <Link className="cab-link so-largo" href={`/busca?categoria=${encodeURIComponent('Clássicos')}`}>Clássicos</Link>
          <Link className="cab-link so-largo" href="/busca?categoria=Fantasia">Fantasia</Link>
          <Link className="cab-link" href="/ia" aria-current={ativo('/ia')}>
            Recomendação com IA <span className="selo-novo">Novo</span>
          </Link>
          <Link className="cab-link" href={vendedor ? '/painel-vendedor' : '/vendedor/cadastro'}>
            {vendedor ? 'Meu painel' : 'Tornar-se vendedor'}
          </Link>

          <div className="cab-direita">
            <ThemeToggle />
            {usuario ? (
              <MenuConta nome={primeiroNome(nome, usuario)} tipo={tipo} sair={sair} />
            ) : (
              <>
                <Link className="cab-link" href="/auth/login">Entrar</Link>
                <Link className="cab-botao-claro" href="/auth/registro">Criar conta</Link>
              </>
            )}
            <LinkCarrinho />
          </div>
        </div>
      </nav>

      <MenuGaveta
        aberta={gavetaAberta}
        onFechar={fecharGaveta}
        usuario={usuario}
        nome={primeiroNome(nome, usuario)}
        vendedor={vendedor}
        categorias={categorias}
        sair={sair}
      />
    </header>
  );
}
