/**
 * Hook do carrinho com os dados ATUAIS do banco (carrinho e checkout).
 *
 * O localStorage guarda só { livro_id, quantidade } (src/lib/clientStore.js);
 * título, foto, loja, preço e estoque são buscados no banco. Cada linha
 * recebe uma situação:
 *   'ok'           pode ser comprado
 *   'indisponivel' o livro não voltou da consulta (desativado/excluído)
 *   'esgotado'     estoque 0
 *   'meu'          livro do próprio vendedor logado (o banco recusaria)
 * Quantidade acima do estoque é ajustada para o estoque, com aviso.
 */
'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import { getCarrinho, atualizarQtdCarrinho } from '@/lib/clientStore';
import { useFavoritos } from '@/lib/favoritos';
import { buscarLivrosPorIds } from '@/lib/repositories/livroRepository';
import { createClient } from '@/lib/supabase/client';

export function useCarrinho() {
  const [supabase] = useState(() => createClient());
  const { usuarioId } = useFavoritos(); // id do usuário logado (sessão já carregada lá)
  const [itens, setItens] = useState(null); // null = ainda lendo o localStorage
  const [livros, setLivros] = useState({}); // id → livro
  const [carregando, setCarregando] = useState(true);
  const [erro, setErro] = useState(null);
  const [avisos, setAvisos] = useState([]);
  const buscadosRef = useRef(''); // ids já consultados (evita consultar a cada +/-)

  const sincronizar = useCallback(async () => {
    const atuais = getCarrinho();
    setItens(atuais);

    const chave = atuais.map((i) => i.livro_id).sort().join(',');
    if (chave === buscadosRef.current) return;
    buscadosRef.current = chave;

    if (atuais.length === 0) {
      setLivros({});
      setCarregando(false);
      return;
    }

    setCarregando(true);
    const dados = await buscarLivrosPorIds(supabase, atuais.map((i) => i.livro_id));
    if (dados === null) {
      buscadosRef.current = ''; // tenta de novo na próxima mudança
      setErro('Não foi possível carregar os dados dos livros agora. Tente recarregar a página.');
      setCarregando(false);
      return;
    }
    setErro(null);
    const mapa = Object.fromEntries(dados.map((l) => [l.id, l]));
    setLivros(mapa);

    // Quantidade acima do estoque: limita e avisa.
    const ajustes = [];
    for (const item of atuais) {
      const livro = mapa[item.livro_id];
      if (livro && livro.estoque > 0 && item.quantidade > livro.estoque) {
        ajustes.push(`"${livro.titulo}" tem só ${livro.estoque} unidade(s) em estoque. Ajustamos a quantidade.`);
        atualizarQtdCarrinho(item.livro_id, livro.estoque);
      }
    }
    if (ajustes.length) setAvisos(ajustes);
    setCarregando(false);
  }, [supabase]);

  useEffect(() => {
    sincronizar();
    window.addEventListener('carrinho-atualizado', sincronizar);
    window.addEventListener('storage', sincronizar);
    return () => {
      window.removeEventListener('carrinho-atualizado', sincronizar);
      window.removeEventListener('storage', sincronizar);
    };
  }, [sincronizar]);

  const linhas = (itens || []).map((item) => {
    const livro = livros[item.livro_id] || null;
    let situacao = 'ok';
    if (!livro) situacao = 'indisponivel';
    else if (usuarioId && livro.vendedor_id === usuarioId) situacao = 'meu';
    else if (!(livro.estoque > 0)) situacao = 'esgotado';
    return { ...item, livro, situacao };
  });
  const validas = linhas.filter((l) => l.situacao === 'ok');

  return {
    supabase,
    lendo: itens === null || (carregando && (itens?.length || 0) > 0 && Object.keys(livros).length === 0 && !erro),
    vazio: itens !== null && itens.length === 0,
    linhas,
    validas,
    comProblema: linhas.length - validas.length,
    subtotal: validas.reduce((s, l) => s + Number(l.livro.preco) * l.quantidade, 0),
    qtdTotal: validas.reduce((s, l) => s + l.quantidade, 0),
    erro,
    avisos,
  };
}
