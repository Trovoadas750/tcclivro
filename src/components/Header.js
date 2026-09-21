/**
 * Cabeçalho global (equivalente ao includes/header.php do PHP).
 * É um componente CLIENT porque lê o carrinho do localStorage e o
 * usuário logado via Supabase Auth (cliente de navegador).
 * Contém: logo, busca, navegação, temas, usuário e carrinho.
 */
'use client';

import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';
import Icone from '@/components/Icone';
import ThemeToggle from '@/components/ThemeToggle';
import { APP_NAME } from '@/lib/config';
import { qtdCarrinho } from '@/lib/clientStore';
import { limparCachePerfil } from '@/lib/perfilStore';
import { createClient } from '@/lib/supabase/client';

export default function Header() {
  const pathname = usePathname();
  const router = useRouter();
  const [supabase] = useState(() => createClient());
  const [qtdCart, setQtdCart] = useState(0);
  const [usuario, setUsuario] = useState(null);
  const [menuAberto, setMenuAberto] = useState(false);
  const [busca, setBusca] = useState('');

  useEffect(() => {
    async function carregarUsuario() {
      const { data: { user } } = await supabase.auth.getUser();
      setUsuario(user);
    }

    carregarUsuario();
    setQtdCart(qtdCarrinho());

    // Atualiza o badge do carrinho quando itens mudam em outra aba
    const atualizar = () => setQtdCart(qtdCarrinho());
    window.addEventListener('storage', atualizar);
    window.addEventListener('carrinho-atualizado', atualizar);
    window.addEventListener('usuario-atualizado', carregarUsuario);

    // Logout (inclusive em outra aba ou sessão expirada): apaga o cache do perfil.
    const { data: { subscription } } = supabase.auth.onAuthStateChange((evento) => {
      if (evento === 'SIGNED_OUT') limparCachePerfil();
    });

    return () => {
      subscription.unsubscribe();
      window.removeEventListener('storage', atualizar);
      window.removeEventListener('carrinho-atualizado', atualizar);
      window.removeEventListener('usuario-atualizado', carregarUsuario);
    };
  }, [supabase]);

  async function sair() {
    await supabase.auth.signOut();
    limparCachePerfil();
    window.dispatchEvent(new Event('usuario-atualizado'));
    setUsuario(null);
    router.push('/');
    router.refresh();
  }

  function enviarBusca(e) {
    e.preventDefault();
    router.push(`/busca?q=${encodeURIComponent(busca)}`);
  }

  const link = (href, rotulo, ativo) => (
    <Link href={href} className={ativo ? 'ativo' : ''}>{rotulo}</Link>
  );

  return (
    <header className="topo">
      <div className="container topo-inner">
        <Link href="/" className="logo">
          <span className="logo-icon"><Icone nome="livros" alt="Casa do Leitor" tam={22} /></span>
          <span><b>Casa</b><em>do Leitor</em></span>
        </Link>

        <form className="busca" onSubmit={enviarBusca}>
          <input
            type="text"
            name="q"
            placeholder="Buscar livros, autores, temas..."
            value={busca}
            onChange={(e) => setBusca(e.target.value)}
          />
          <button type="submit" aria-label="Buscar"><Icone nome="buscar" alt="Buscar" tam={18} /></button>
        </form>

        <nav className="nav">
          {link('/', 'Início', pathname === '/')}
          {link('/busca', 'Livros', pathname === '/busca')}
          <Link href="/ia" className="nav-ia"><Icone nome="faiscas" alt="IA" tam={16} /> Recomendar com IA</Link>
        </nav>

        <div className="acoes">
          <ThemeToggle />

          {usuario ? (
            <div className="dropdown" onClick={(e) => e.stopPropagation()}>
              <button className="btn-usuario" type="button" onClick={() => setMenuAberto(!menuAberto)}>
                <Icone nome="usuario" alt="Usuário" tam={17} /> {usuario.email} ▾
              </button>
              {menuAberto && (
                <div className="dropdown-menu">
                  <Link href="/minha-conta" onClick={() => setMenuAberto(false)}>Minha conta</Link>
                  <Link href="/favoritos" onClick={() => setMenuAberto(false)}><Icone nome="coracao" alt="Favoritos" tam={15} /> Favoritos</Link>
                  <Link href="/meus-pedidos" onClick={() => setMenuAberto(false)}><Icone nome="pacote" alt="Pedidos" tam={15} /> Meus pedidos</Link>
                  <button type="button" onClick={sair} style={{ border: 'none', background: 'none', cursor: 'pointer', padding: '8px 12px', textAlign: 'left', width: '100%' }}>Sair</button>
                </div>
              )}
            </div>
          ) : (
            <>
              <Link className="btn-login" href="/auth/login">Entrar</Link>
              <Link className="btn-registro" href="/auth/registro">Criar conta</Link>
            </>
          )}

          <Link className="badge-link btn-carrinho" href="/carrinho" title="Ver carrinho">
            <span className="badge-link-icone">
              <Icone nome="carrinho" alt="Carrinho" tam={18} />
              <span className={`badge ${qtdCart === 0 ? 'badge-vazio' : ''}`}>{qtdCart}</span>
            </span>
            <span>Carrinho</span>
          </Link>
        </div>
      </div>
    </header>
  );
}