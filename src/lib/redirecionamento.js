/**
 * Valida o destino de volta (?proximo=) depois do login/cadastro.
 * Só aceita caminhos internos ("/algo"), para não redirecionar o
 * usuário para outro site. Devolve null se o valor for inválido.
 */
export function destinoSeguro(valor) {
  const texto = String(valor || '');
  return texto.startsWith('/') && !texto.startsWith('//') && !texto.startsWith('/\\') ? texto : null;
}

/** Monta "/rota?proximo=/destino" (ou só "/rota" se não houver destino válido). */
export function comProximo(rota, destino) {
  const seguro = destinoSeguro(destino);
  return seguro ? `${rota}?proximo=${encodeURIComponent(seguro)}` : rota;
}
