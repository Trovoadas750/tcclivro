/**
 * Quantidade de unidades no carrinho (badge do cabeçalho e da barra inferior).
 * Atualiza quando o carrinho muda nesta aba ('carrinho-atualizado') ou em
 * outra aba ('storage'). Começa em 0 para o HTML do servidor bater com o
 * do navegador (o carrinho só existe no localStorage).
 */
'use client';

import { useEffect, useState } from 'react';
import { qtdCarrinho } from '@/lib/clientStore';

export function useQtdCarrinho() {
  const [qtd, setQtd] = useState(0);
  useEffect(() => {
    const atualizar = () => setQtd(qtdCarrinho());
    atualizar();
    window.addEventListener('carrinho-atualizado', atualizar);
    window.addEventListener('storage', atualizar);
    return () => {
      window.removeEventListener('carrinho-atualizado', atualizar);
      window.removeEventListener('storage', atualizar);
    };
  }, []);
  return qtd;
}
