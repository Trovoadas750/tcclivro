/**
 * Traduz erros do Supabase Auth (fluxo de redefinição de senha) para
 * mensagens amigáveis em português. Usa `error.code` (estável) com
 * fallback por texto, como em src/app/auth/actions.js.
 */

const LIMITE_TENTATIVAS =
  'Muitas tentativas em pouco tempo. Aguarde alguns minutos e tente novamente.';
const GENERICO = 'Não foi possível concluir. Tente novamente em instantes.';

function extrair(error) {
  return { codigo: error?.code || '', msg: error?.message || '' };
}

export function erroEnviarCodigo(error) {
  const { codigo, msg } = extrair(error);
  if (codigo === 'validation_failed' || codigo === 'email_address_invalid' || msg.includes('Unable to validate email')) {
    return 'E-mail inválido. Confira e tente novamente.';
  }
  if (
    codigo === 'over_email_send_rate_limit' ||
    codigo === 'over_request_rate_limit' ||
    msg.toLowerCase().includes('rate limit')
  ) {
    return LIMITE_TENTATIVAS;
  }
  return GENERICO;
}

export function erroVerificarCodigo(error) {
  const { codigo, msg } = extrair(error);
  if (codigo === 'otp_expired' || msg.includes('expired') || msg.includes('invalid')) {
    return 'Código inválido ou expirado. Confira os 6 dígitos ou peça um novo código.';
  }
  if (codigo === 'over_request_rate_limit' || msg.toLowerCase().includes('rate limit')) {
    return LIMITE_TENTATIVAS;
  }
  return GENERICO;
}

export function erroNovaSenha(error) {
  const { codigo, msg } = extrair(error);
  if (codigo === 'same_password' || msg.includes('different from the old password')) {
    return 'A nova senha deve ser diferente da senha atual.';
  }
  if (codigo === 'weak_password' || msg.includes('Password should be')) {
    return 'A senha deve ter pelo menos 6 caracteres.';
  }
  if (codigo === 'session_not_found' || codigo === 'session_expired' || msg.includes('session missing')) {
    return 'Sua verificação expirou. Peça um novo código para continuar.';
  }
  return GENERICO;
}
