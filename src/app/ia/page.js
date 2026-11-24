/**
 * Página de recomendação (/ia).
 * A recomendação roda só no servidor (POST /api/recomendar: modo IA com
 * provedor gratuito ou modo local); a interface fica em Recomendador.js
 * (client). Funciona deslogado.
 */
import Recomendador from './Recomendador';

export const metadata = {
  title: 'Recomendação com IA',
  description: 'Descreva o que você quer ler e receba indicações de livros do catálogo da Casa do Leitor.',
};

export default function PaginaIA() {
  return <Recomendador />;
}
