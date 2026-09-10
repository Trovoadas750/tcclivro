/**
 * ============================================================
 *  CASA DO LEITOR - Configurações gerais da aplicação
 * ============================================================
 *  Equivalente ao `config/database.php` do projeto PHP original,
 *  porém sem credenciais de banco — a conexão fica em
 *  src/lib/supabase.js e está DESATIVADA por padrão.
 *
 *  Aqui ficam apenas constantes públicas da aplicação.
 */

export const APP_NAME = 'Casa do Leitor';
export const APP_URL = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000';

/** Nome das chaves usadas no localStorage (evita colisões). */
export const STORAGE_KEYS = {
  TEMA: 'casa_leitor_tema',
  USUARIO: 'casa_leitor_usuario',
  CARRINHO: 'casa_leitor_carrinho',
  FAVORITOS: 'casa_leitor_favoritos',
  PEDIDOS: 'casa_leitor_pedidos',
};

/** Categorias "oficiais" de status de pagamento no checkout. */
export const FORMAS_PAGAMENTO = {
  cartao: 'Cartão de crédito',
  pix: 'Pix',
  boleto: 'Boleto bancário',
};

/** Valor mínimo para frete grátis (replicado do checkout PHP). */
export const FRETE_GRATIS_ACIMA = 150;
export const FRETE_PADRAO = 19.9;