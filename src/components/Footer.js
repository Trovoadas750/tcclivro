/**
 * Rodapé global (equivalente ao includes/footer.php do PHP).
 * Componente SERVER (não precisa de interação).
 */
import Link from 'next/link';
import Icone from '@/components/Icone';
import CtaVendedor from '@/components/CtaVendedor';
import { APP_NAME, CREDITOS_CATALOGO } from '@/lib/config';

export default function Footer() {
  const ano = new Date().getFullYear();
  return (
    <footer className="rodape">
      <div className="container rodape-grid">
        <div>
          <h4><Icone nome="livros" alt="Livraria" tam={17} /> {APP_NAME}</h4>
          <p>Projeto demonstrativo de loja de livros online com recomendação por IA.</p>
        </div>
        <div>
          <h4>Navegação</h4>
          <Link href="/">Início</Link>
          <Link href="/busca">Catálogo</Link>
          <Link href="/ia">Recomendação com IA</Link>
          <Link href="/carrinho">Carrinho</Link>
        </div>
        <div>
          <h4>Minha conta</h4>
          <Link href="/auth/login">Entrar</Link>
          <Link href="/auth/registro">Criar conta</Link>
          <Link href="/meus-pedidos">Meus pedidos</Link>
          <Link href="/favoritos">Favoritos</Link>
        </div>
        <div>
          <h4>Para vendedores</h4>
          {/* "Tornar-se vendedor" (deslogado/cliente) ou "Meu painel" (vendedor) */}
          <CtaVendedor />
        </div>
      </div>
      <div className="container rodape-base">
        <span>© {ano} {APP_NAME} — preços e estoque do catálogo inicial são de demonstração.</span>
        <span className="rodape-creditos">
          {CREDITOS_CATALOGO.texto.replace(/\.$/, '')} —{' '}
          <a href={CREDITOS_CATALOGO.url} target="_blank" rel="noopener noreferrer">ver no GitHub</a>.
        </span>
      </div>
    </footer>
  );
}