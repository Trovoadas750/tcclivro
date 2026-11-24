/**
 * Layout raiz da aplicação.
 * Define: fontes (next/font), tema inicial, cabeçalho, conteúdo, barra
 * inferior do celular, chatbot, toasts e rodapé.
 *
 * Ícones do site e imagem de compartilhamento seguem a convenção de arquivos
 * do App Router: src/app/icon.png, apple-icon.png e opengraph-image.png
 * (gerados a partir da logo, public/logo.png).
 */
import { Fraunces, Inter } from 'next/font/google';
import './tokens.css';
import './globals.css';
import './estrutura.css';
import ThemeScript from '@/components/ThemeScript';
import Cabecalho from '@/components/Cabecalho';
import NavInferiorMobile from '@/components/NavInferiorMobile';
import Rodape from '@/components/Rodape';
import Chatbot from '@/components/Chatbot';
import Toasts from '@/components/Toasts';
import { APP_NAME, APP_URL, TEMA_PADRAO } from '@/lib/config';

// Títulos: serifada (Fraunces). Texto: sem serifa legível (Inter).
const fonteTitulo = Fraunces({ subsets: ['latin'], variable: '--fonte-fraunces', display: 'swap' });
const fonteTexto = Inter({ subsets: ['latin'], variable: '--fonte-inter', display: 'swap' });

const DESCRICAO =
  'Livraria online com centenas de títulos, lojas de leitores e recomendações de livros com inteligência artificial.';

export const metadata = {
  metadataBase: new URL(APP_URL),
  title: {
    default: APP_NAME,
    template: `%s · ${APP_NAME}`,
  },
  description: DESCRICAO,
  applicationName: APP_NAME,
  openGraph: {
    type: 'website',
    locale: 'pt_BR',
    siteName: APP_NAME,
    title: APP_NAME,
    description: DESCRICAO,
  },
  twitter: { card: 'summary_large_image', title: APP_NAME, description: DESCRICAO },
};

export const viewport = {
  themeColor: [
    { media: '(prefers-color-scheme: light)', color: '#3E4A2C' },
    { media: '(prefers-color-scheme: dark)', color: '#2B3220' },
  ],
};

export default function RootLayout({ children }) {
  return (
    // data-theme sai do servidor com o tema padrão; o ThemeScript pode
    // trocá-lo pelo tema salvo antes da hidratação, por isso o
    // suppressHydrationWarning (vale só para os atributos do <html>).
    <html
      lang="pt-BR"
      data-theme={TEMA_PADRAO}
      className={`${fonteTitulo.variable} ${fonteTexto.variable}`}
      suppressHydrationWarning
    >
      <head>
        <ThemeScript />
      </head>
      <body>
        <Cabecalho />
        <main id="conteudo" className="container" tabIndex={-1}>{children}</main>
        <Chatbot />
        <Toasts />
        <Rodape />
        <NavInferiorMobile />
      </body>
    </html>
  );
}
