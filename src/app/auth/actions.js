'use server';

import { createClient } from '@/lib/supabase/server';

/**
 * Traduz os erros mais comuns do Supabase Auth para mensagens amigáveis
 * em português. Usa `error.code` (estável) com fallback por texto.
 */
function mensagemErro(error) {
  const codigo = error?.code || '';
  const msg = error?.message || '';

  if (codigo === 'invalid_credentials' || msg.includes('Invalid login credentials')) {
    return 'E-mail ou senha inválidos.';
  }
  if (codigo === 'email_not_confirmed' || msg.includes('Email not confirmed')) {
    return 'Confirme seu e-mail antes de entrar. Verifique sua caixa de entrada.';
  }
  if (codigo === 'user_already_exists' || msg.includes('User already registered')) {
    return 'Este e-mail já está cadastrado. Tente entrar ou recuperar sua senha.';
  }
  if (codigo === 'weak_password' || msg.includes('Password should be')) {
    return 'A senha deve ter pelo menos 6 caracteres.';
  }
  if (codigo === 'validation_failed' || msg.includes('Unable to validate email')) {
    return 'E-mail inválido.';
  }
  if (
    codigo === 'over_email_send_rate_limit' ||
    codigo === 'over_request_rate_limit' ||
    msg.includes('rate limit')
  ) {
    return 'Muitas tentativas em pouco tempo. Aguarde alguns minutos e tente novamente.';
  }

  return 'Não foi possível concluir. Tente novamente em instantes.';
}

/**
 * Login com e-mail e senha (supabase.auth.signInWithPassword).
 * Devolve também o `tipo` da conta (lido de `profiles`) para a tela
 * decidir o destino: vendedor → /painel-vendedor, cliente → /.
 */
export async function entrar({ email, senha }) {
  const supabase = await createClient();
  const { data, error } = await supabase.auth.signInWithPassword({ email, password: senha });

  if (error) {
    return { erro: mensagemErro(error) };
  }

  let tipo = 'cliente';
  const { data: perfil } = await supabase
    .from('profiles')
    .select('tipo')
    .eq('id', data.user.id)
    .maybeSingle();
  if (perfil?.tipo === 'vendedor') tipo = 'vendedor';

  return { ok: true, tipo };
}

/**
 * Cadastro com e-mail e senha (supabase.auth.signUp).
 * `tipo` vai em options.data: o trigger `handle_new_user` cria o perfil
 * com esse valor (qualquer coisa diferente de 'vendedor' vira 'cliente').
 * O front NUNCA insere em `profiles`.
 *
 * Para vendedor, o nome/descrição da loja também vão nos metadados; a
 * loja é criada no primeiro acesso ao painel (exige sessão ativa, que só
 * existe depois da confirmação do e-mail).
 */
export async function cadastrar({ nome, email, senha, tipo = 'cliente', loja = null }) {
  const supabase = await createClient();
  const tipoConta = tipo === 'vendedor' ? 'vendedor' : 'cliente';

  const metadados = { nome: String(nome || '').trim(), tipo: tipoConta };
  if (tipoConta === 'vendedor' && loja?.nome_loja) {
    metadados.nome_loja = String(loja.nome_loja).trim();
    if (loja.descricao) metadados.descricao_loja = String(loja.descricao).trim();
  }

  const { data, error } = await supabase.auth.signUp({
    email,
    password: senha,
    options: { data: metadados },
  });

  if (error) {
    return { erro: mensagemErro(error) };
  }

  // Sinal do Supabase para "e-mail já cadastrado" quando a proteção contra
  // enumeração de usuários está ativa (retorna sucesso "falso" em vez de erro).
  if (data?.user && data.user.identities?.length === 0) {
    return { erro: 'Este e-mail já está cadastrado. Tente entrar ou recuperar sua senha.' };
  }

  // Confirmação de e-mail desativada: signUp() já retorna sessão ativa.
  if (data.session) {
    return { ok: true, confirmado: true, tipo: tipoConta };
  }

  // Confirmação de e-mail ativada: sem sessão até o clique no link enviado.
  return { ok: true, confirmado: false, tipo: tipoConta };
}
