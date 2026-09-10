/**
 * Rodapé global (equivalente ao includes/footer.php do PHP).
 * Componente SERVER (não precisa de interação).
 */
import Link from 'next/link';
import Icone from '@/components/Icone';
import { APP_NAME } from '@/lib/config';

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
          <h4>Pagamento &amp; Entrega</h4>
          <p><Icone nome="cartao" alt="Pagamento" tam={16} /> Pagamento fictício (demonstração)</p>
          <p><Icone nome="caminhao" alt="Entrega" tam={16} /> Rastreio de entrega simulado</p>
        </div>
      </div>
      <div className="container rodape-base">
        <span>© {ano} {APP_NAME} — todos os dados são fictícios.</span>
      </div>
    </footer>
  );
}