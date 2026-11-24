/**
 * Barra de navegação inferior fixa (só no celular, < 768 px).
 * Início · Buscar · IA · Carrinho (com contador) · Conta.
 * Área de toque de pelo menos 44 px; o item da página atual fica marcado.
 */
'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import IconeSvg from '@/components/IconeSvg';
import { useQtdCarrinho } from '@/lib/useQtdCarrinho';
import { useTipoConta } from '@/lib/useTipoConta';

export default function NavInferiorMobile() {
  const pathname = usePathname();
  const qtd = useQtdCarrinho();
  const { usuario } = useTipoConta();

  const contaHref = usuario ? '/minha-conta' : '/auth/login';
  const itens = [
    { href: '/', rotulo: 'Início', icone: 'inicio', ativo: pathname === '/' },
    { href: '/busca', rotulo: 'Buscar', icone: 'buscar', ativo: pathname.startsWith('/busca') },
    { href: '/ia', rotulo: 'IA', icone: 'faiscas', ativo: pathname.startsWith('/ia') },
    { href: '/carrinho', rotulo: 'Carrinho', icone: 'carrinho', ativo: pathname.startsWith('/carrinho') || pathname.startsWith('/checkout'), contador: qtd },
    {
      href: contaHref,
      rotulo: 'Conta',
      icone: 'usuario',
      ativo: ['/minha-conta', '/meus-pedidos', '/favoritos', '/auth', '/painel-vendedor'].some((p) => pathname.startsWith(p)),
    },
  ];

  return (
    <nav className="nav-inferior" aria-label="Navegação rápida">
      {itens.map((item) => (
        <Link key={item.rotulo} href={item.href} className="nav-inferior-item" aria-current={item.ativo ? 'page' : undefined}>
          <span className="nav-inferior-icone">
            <IconeSvg nome={item.icone} tam={23} />
            {item.contador > 0 && <span className="cab-contador" aria-hidden="true">{item.contador > 99 ? '99+' : item.contador}</span>}
          </span>
          <span className="nav-inferior-rotulo">
            {item.rotulo}
            {item.contador > 0 && <span className="sr-only"> ({item.contador} {item.contador === 1 ? 'item' : 'itens'})</span>}
          </span>
        </Link>
      ))}
    </nav>
  );
}
