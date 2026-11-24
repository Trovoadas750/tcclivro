/**
 * ============================================================
 *  CASA DO LEITOR - Configurações gerais da aplicação
 * ============================================================
 *  Só constantes públicas. A conexão com o banco (Supabase) fica em
 *  src/lib/supabase/client.js (navegador) e src/lib/supabase/server.js
 *  (servidor).
 */

export const APP_NAME = 'Casa do Leitor';
export const APP_URL = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000';

const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

/**
 * Id do vendedor dono do catálogo inicial (loja "Casa do Leitor", ~600 livros
 * do seed). Usado para separar a seção "Direto dos vendedores" na página
 * inicial. Sem a variável (ou com valor inválido), vale null e a seção
 * mostra livros de todas as lojas.
 */
const lojaCatalogo = String(process.env.NEXT_PUBLIC_LOJA_CATALOGO_ID || '').trim();
export const LOJA_CATALOGO_ID = UUID.test(lojaCatalogo) ? lojaCatalogo : null;

/** Nome das chaves usadas no localStorage (evita colisões). */
export const STORAGE_KEYS = {
  TEMA: 'casa_leitor_tema',
  /** Carrinho: só [{ livro_id, quantidade }] — preço e estoque vêm do banco. */
  CARRINHO: 'casa_leitor_carrinho',
  /** Cache do perfil/favoritos/pedidos vindos do Supabase (um usuário por vez). */
  PERFIL: 'casa_leitor_perfil_cache',
  /** E-mail em recuperação de senha (sessionStorage, some ao fechar a aba). */
  RECUPERACAO_EMAIL: 'casa_leitor_recuperacao_email',
};

/** Temas disponíveis (chave = valor de data-theme no <html>). */
export const TEMAS = { sepia: 'Sépia', escuro: 'Escuro' };
export const TEMA_PADRAO = 'sepia';

/** Créditos dos dados do catálogo inicial (licença CC BY-SA 4.0). */
export const CREDITOS_CATALOGO = {
  texto: 'Dados do catálogo inicial: goodbooks-10k-extended (Zygmunt Zając e Malcolm Osh), licença CC BY-SA 4.0.',
  url: 'https://github.com/malcolmosh/goodbooks-10k-extended',
};
