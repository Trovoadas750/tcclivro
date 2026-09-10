/**
 * ============================================================
 *  CONEXÃO COM O BANCO DE DADOS — PostgreSQL / Supabase
 * ============================================================
 *  ⚠️  ESTE ARQUIVO É UM ESQUELETO (SCAFFOLD) BEM DOCUMENTADO.
 *      A conexão está DELIBERADAMENTE DESATIVADA neste projeto:
 *      o objetivo é deixar pronto e comentado o caminho que seria
 *      usado para conectar ao Supabase (que usa PostgreSQL),
 *      para que basta preencher as variáveis de ambiente e
 *      alternar a flag `DB_ATIVO` para `true`.
 *
 *  ------------------------------------------------------------
 *  COMO ATIVAR A CONEXÃO (passo a passo)
 *  ------------------------------------------------------------
 *  1. Crie um projeto gratuito em https://supabase.com
 *  2. No painel do Supabase -> SQL Editor, execute o script
 *     `database/schema.sql` (cópia do schema da livraria em PHP,
 *     convertido para PostgreSQL) para criar as tabelas e seeds.
 *  3. Copie `.env.local.example` para `.env.local` e preencha:
 *        NEXT_PUBLIC_SUPABASE_URL=https://xxxx.supabase.co
 *        NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJhbGciOi...
 *     (Em produção, crie as variáveis no painel do Vercel/
 *      Netlify/hospedagem usada, sem prefixo NEXT_PUBLIC_ se a
 *      consulta for feita só no servidor.)
 *  4. Altere `DB_ATIVO` abaixo para `true`.
 *  5. Pronto: as funções de src/lib/repositories/* passam a
 *     executar as consultas SQL reais (já documentadas nos
 *     comentários de cada função).
 *  ------------------------------------------------------------
 *
 *  Enquanto DB_ATIVO = false, `getSupabase()` retorna `null` e
 *  os repositórios devolvem os dados de demonstração de
 *  src/lib/mockData.js (mesmos dados do seed original).
 */

import { createClient } from '@supabase/supabase-js';

/** Flag mestre: `true` ativa a conexão real; `false` = modo demo. */
export const DB_ATIVO = false;

/**
 * Variáveis de ambiente que seriam lidas do `.env.local`.
 * `NEXT_PUBLIC_` expõe o valor ao navegador; para chamadas
 * apenas no servidor, remova o prefixo (ex.: SUPABASE_SERVICE_KEY).
 */
const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL;
const SUPABASE_ANON_KEY = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

/** Instância única do cliente (singleton, como o PDO no PHP). */
let supabase = null;

if (DB_ATIVO) {
  if (!SUPABASE_URL || !SUPABASE_ANON_KEY) {
    // Em desenvolvimento o erro é claro; em produção, lança também
    // para não rodar com o banco "quebrado" silenciosamente.
    throw new Error(
      'Casa do Leitor: DB_ATIVO está true, mas faltam as variáveis ' +
      'NEXT_PUBLIC_SUPABASE_URL e NEXT_PUBLIC_SUPABASE_ANON_KEY no .env.local.'
    );
  }

  supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
    auth: {
      // No projeto original o login era por sessão PHP; aqui o
      // Supabase também pode gerenciar auth. Persistência local
      // fica desligada para as chamadas do servidor.
      persistSession: false,
      autoRefreshToken: false,
    },
  });
}

/**
 * Retorna o cliente Supabase pronto para uso (ou `null` em modo demo).
 *
 * Uso previsto (quando DB_ATIVO = true):
 *
 *   const { data, error } = await supabase
 *     .from('livros')
 *     .select('*')
 *     .order('vendas', { ascending: false })
 *     .limit(8);
 *
 *   if (error) throw new Error(`Erro ao consultar livros: ${error.message}`);
 *   return data;
 */
export function getSupabase() {
  if (!DB_ATIVO) {
    // Em modo demo as consultas NÃO devem ser executadas.
    return null;
  }
  if (!supabase) {
    throw new Error('Supabase não inicializado. Verifique DB_ATIVO e as variáveis de ambiente.');
  }
  return supabase;
}