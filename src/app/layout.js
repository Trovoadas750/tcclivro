/**
 * Layout raiz da aplicação (equivalente à junção de
 * includes/header.php + includes/footer.php do PHP original).
 * Define: tema inicial, cabeçalho, rodapé, chatbot e toasts.
 */
import './globals.css';
import ThemeScript from '@/components/ThemeScript';
import Header from '@/components/Header';
import Footer from '@/components/Footer';
import Chatbot from '@/components/Chatbot';
import Toasts from '@/components/Toasts';
import { APP_NAME } from '@/lib/config';

export const metadata = {
  title: {
    default: `${APP_NAME} — Livraria Virtual`,
    template: `%s · ${APP_NAME}`,
  },
  description: 'Livraria virtual com recomendação por IA. Projeto demonstrativo em Next.js (JavaScript).',
};

export default function RootLayout({ children }) {
  return (
    <html lang="pt-BR">
      <head>
        <ThemeScript />
      </head>
      <body>
        <Header />
        <main className="container">{children}</main>
        <Chatbot />
        <Toasts />
        <Footer />
      </body>
    </html>
  );
}