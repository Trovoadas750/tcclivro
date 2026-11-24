/**
 * Rodapé global: logo, frase da loja, colunas de links (Comprar, Vender,
 * Conta, Sobre), crédito do catálogo (CC BY-SA 4.0) e o aviso de versão
 * acadêmica (TCC). Componente SERVER; o link de vendedor (CtaVendedor) é client.
 */
import Link from 'next/link';
import CtaVendedor from '@/components/CtaVendedor';
import LogoMarca from '@/components/LogoMarca';
import { APP_NAME, CREDITOS_CATALOGO } from '@/lib/config';

export default function Rodape() {
  const ano = new Date().getFullYear();
  return (
    <footer className="rodape">
      <div className="container rodape-grade">
        <div className="rodape-marca">
          <LogoMarca tam={72} />
          <p>
            Uma livraria online feita para quem ama ler: catálogo com centenas de títulos,
            lojas de leitores e recomendações com IA.
          </p>
        </div>

        <nav className="rodape-coluna" aria-label="Comprar">
          <h2>Comprar</h2>
          <Link href="/busca">Catálogo</Link>
          <Link href="/busca?ordenar=recentes">Lançamentos</Link>
          <Link href="/ia">Recomendação com IA</Link>
          <Link href="/carrinho">Carrinho</Link>
        </nav>

        <nav className="rodape-coluna" aria-label="Vender">
          <h2>Vender</h2>
          {/* "Tornar-se vendedor" (deslogado/cliente) ou "Meu painel" (vendedor) */}
          <CtaVendedor />
          <Link href="/vendedor/cadastro">Como vender</Link>
        </nav>

        <nav className="rodape-coluna" aria-label="Conta">
          <h2>Conta</h2>
          <Link href="/auth/login">Entrar</Link>
          <Link href="/auth/registro">Criar conta</Link>
          <Link href="/meus-pedidos">Meus pedidos</Link>
          <Link href="/favoritos">Favoritos</Link>
        </nav>

        <div className="rodape-coluna">
          <h2>Sobre</h2>
          <p>Projeto acadêmico desenvolvido como Trabalho de Conclusão de Curso (TCC).</p>
          <a href={CREDITOS_CATALOGO.url} target="_blank" rel="noopener noreferrer">Origem do catálogo ↗</a>
        </div>
      </div>

      <div className="container rodape-base">
        <p>
          <strong>Versão acadêmica (TCC):</strong> pagamento e entrega ainda não estão disponíveis.
          Preços e estoque do catálogo inicial são de demonstração.
        </p>
        <p>
          {CREDITOS_CATALOGO.texto.replace(/\.$/, '')} —{' '}
          <a href={CREDITOS_CATALOGO.url} target="_blank" rel="noopener noreferrer">ver no GitHub</a>.
        </p>
        <p>© {ano} {APP_NAME}</p>
      </div>
    </footer>
  );
}
