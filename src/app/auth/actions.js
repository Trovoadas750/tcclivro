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

/** Login com e-mail e senha (item 5: supabase.auth.signInWithPassword). */
export async function entrar({ email, senha }) {
  const supabase = await createClient();
  const { error } = await supabase.auth.signInWithPassword({ email, password: senha });

  if (error) {
    return { erro: mensagemErro(error) };
  }
  return { ok: true };
}

/** Cadastro com e-mail e senha (item 4: supabase.auth.signUp). */
export async function cadastrar({ email, senha }) {
  const supabase = await createClient();
  const { data, error } = await supabase.auth.signUp({ email, password: senha });

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
    return { ok: true, confirmado: true };
  }

  // Confirmação de e-mail ativada: sem sessão até o clique no link enviado.
  return { ok: true, confirmado: false };
}
