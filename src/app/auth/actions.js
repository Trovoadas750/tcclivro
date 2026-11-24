'use server';

import { createClient } from '@/lib/supabase/server';

/**
 * Traduz os erros mais comuns do Supabase Auth para mensagens amigáveis
 * em português. Usa `error.code` (estável) com fallback por texto.
 */
function mensagemErro(error) {
  const codigo = error?.code || '';
  const msg = error?.message || '';
  // Registra o erro completo no terminal do servidor (npm run dev) para diagnóstico.
  console.error('[Supabase Auth]', { status: error?.status, code: codigo, message: msg });
  // Código técnico curto exibido no fim das mensagens genéricas.
  const ref = ` (código: ${codigo || error?.status || 'desconhecido'})`;

  if (codigo === 'invalid_credentials' || msg.includes('Invalid login credentials')) {
    return 'E-mail ou senha inválidos.';
  }
  if (codigo === 'email_not_confirmed' || msg.includes('Email not confirmed')) {
    // Contas antigas que ficaram pendentes no Supabase.
    return 'Esta conta está pendente no servidor. Peça ao administrador para liberá-la no Supabase (Authentication → Users).';
  }
  if (
    codigo === 'email_address_not_authorized' ||
    /error sending .*email/i.test(msg)
  ) {
    // O Supabase tentou mandar algum e-mail e o envio falhou (cota do SMTP).
    return 'O Supabase tentou enviar um e-mail e falhou.' + ref;
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

  if (/database error/i.test(msg)) {
    // Falha no trigger que cria o perfil (handle_new_user) ou em outra regra do banco.
    return 'O banco de dados recusou a criação da conta.' + ref;
  }

  return 'Não foi possível concluir. Tente novamente em instantes.' + ref;
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
 * Cadastro único com e-mail e senha (supabase.auth.signUp).
 * Toda conta nasce 'cliente': o trigger `handle_new_user` cria o perfil
 * e ignora qualquer `tipo` enviado, por isso só o `nome` vai nos metadados.
 * O front NUNCA insere em `profiles`. Para vender, o cliente logado migra
 * a conta em /vendedor/cadastro (rpc tornar_vendedor).
 *
 * A conta já entra logada logo após o cadastro.
 */
export async function cadastrar({ nome, email, senha }) {
  const supabase = await createClient();

  const { data, error } = await supabase.auth.signUp({
    email,
    password: senha,
    options: { data: { nome: String(nome || '').trim() } },
  });

  if (error) {
    return { erro: mensagemErro(error) };
  }

  // Sinal do Supabase para "e-mail já cadastrado" quando a proteção contra
  // enumeração de usuários está ativa (retorna sucesso "falso" em vez de erro).
  if (data?.user && data.user.identities?.length === 0) {
    return { erro: 'Este e-mail já está cadastrado. Tente entrar ou recuperar sua senha.' };
  }

  // Normalmente o signUp() já devolve a sessão. Se não devolver, entra
  // direto com e-mail e senha para o usuário sair do cadastro já logado.
  if (!data.session) {
    const { error: erroLogin } = await supabase.auth.signInWithPassword({ email, password: senha });
    if (erroLogin) {
      return { erro: mensagemErro(erroLogin) };
    }
  }

  return { ok: true, tipo: 'cliente' };
}
