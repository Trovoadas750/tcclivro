/**
 * Painel do vendedor (/painel-vendedor).
 *  - Só para vendedores (ver src/lib/useVendedor.js).
 *  - Sem loja: formulário "Criar minha loja".
 *  - Com loja: dados da loja (editáveis), lista dos próprios livros
 *    (inclusive inativos) e ações Editar / Ativar-Desativar / Excluir.
 */
'use client';

import Link from 'next/link';
import { useCallback, useEffect, useState } from 'react';
import Icone from '@/components/Icone';
import FormLoja from '@/components/vendedor/FormLoja';
import { preco } from '@/lib/format';
import { useVendedor } from '@/lib/useVendedor';
import { apagarFotos, fotosDoLivro, mensagemErroVendedor } from '@/lib/vendedor';

export default function PainelVendedor() {
  const { carregando, usuario, perfil, loja, erro, supabase, salvarLoja } = useVendedor();
  const [editandoLoja, setEditandoLoja] = useState(false);
  const [livros, setLivros] = useState([]);
  const [carregandoLivros, setCarregandoLivros] = useState(true);
  const [erroLivros, setErroLivros] = useState(null);
  const [ocupado, setOcupado] = useState(null); // id do livro em ação
  const [confirmarExclusao, setConfirmarExclusao] = useState(null); // id

  const carregarLivros = useCallback(async () => {
    if (!usuario) return;
    setCarregandoLivros(true);
    const { data, error } = await supabase
      .from('livros')
      .select('*')
      .eq('vendedor_id', usuario.id)
      .order('created_at', { ascending: false });
    if (error) {
      console.error('Erro ao listar livros:', error);
      setErroLivros('Não foi possível carregar seus livros.');
    } else {
      setErroLivros(null);
      setLivros(data || []);
    }
    setCarregandoLivros(false);
  }, [supabase, usuario]);

  useEffect(() => {
    if (loja) carregarLivros();
  }, [loja, carregarLivros]);

  async function alternarAtivo(livro) {
    setOcupado(livro.id);
    const { data, error } = await supabase
      .from('livros')
      .update({ ativo: !livro.ativo })
      .eq('id', livro.id)
      .select();
    setOcupado(null);
    if (error || !data?.length) {
      window.showToast?.(error ? mensagemErroVendedor(error) : 'Você não pode alterar este livro.', 'error');
      return;
    }
    setLivros((lista) => lista.map((l) => (l.id === livro.id ? data[0] : l)));
    window.showToast?.(data[0].ativo ? 'Livro ativado: já aparece na vitrine.' : 'Livro desativado: saiu da vitrine.');
  }

  async function excluir(livro) {
    setOcupado(livro.id);
    const { data, error } = await supabase.from('livros').delete().eq('id', livro.id).select('id');
    setOcupado(null);
    setConfirmarExclusao(null);
    if (error || !data?.length) {
      window.showToast?.(error ? mensagemErroVendedor(error) : 'Você não pode alterar este livro.', 'error');
      return;
    }
    await apagarFotos(supabase, fotosDoLivro(livro));
    setLivros((lista) => lista.filter((l) => l.id !== livro.id));
    window.showToast?.({ titulo: 'Livro excluído', descricao: livro.titulo });
  }

  async function salvarDadosLoja(valores) {
    const r = await salvarLoja(valores);
    if (r.ok) {
      setEditandoLoja(false);
      window.showToast?.(loja ? 'Loja atualizada!' : 'Loja criada! Agora cadastre seus livros.');
    }
    return r;
  }

  if (carregando || !usuario) {
    return <div style={{ marginTop: 40, textAlign: 'center' }}>Carregando...</div>;
  }

  if (erro) {
    return <div className="toast toast-error" style={{ marginTop: 28 }}>{erro}</div>;
  }

  // ---------- Sem loja: criar ----------
  if (!loja) {
    return (
      <div className="auth-wrap" style={{ maxWidth: 560 }}>
        <div className="painel">
          <span style={{ display: 'inline-block' }}><Icone nome="livros" alt="" tam={40} /></span>
          <h1 style={{ fontSize: 26, margin: '8px 0 4px' }}>Criar minha loja</h1>
          <p style={{ color: 'var(--muted)', marginBottom: 18 }}>
            Olá{perfil?.nome ? `, ${perfil.nome}` : ''}! Antes de cadastrar livros, dê um nome para sua loja.
            Ele aparece para os leitores na vitrine.
          </p>
          <FormLoja onSalvar={salvarDadosLoja} />
        </div>
      </div>
    );
  }

  const ativos = livros.filter((l) => l.ativo).length;

  return (
    <>
      <div className="painel-topo">
        <div>
          <span className="selo-vendedor">Painel do vendedor</span>
          <h1>{loja.nome_loja}</h1>
          {loja.descricao && <p className="painel-descricao">{loja.descricao}</p>}
        </div>
        <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap' }}>
          <button className="btn btn-ghost" type="button" onClick={() => setEditandoLoja((v) => !v)}>
            <Icone nome="caneta" alt="" tam={16} /> {editandoLoja ? 'Fechar edição' : 'Editar loja'}
          </button>
          <Link className="btn btn-accent" href="/painel-vendedor/livros/novo">
            <Icone nome="novo" alt="" tam={16} /> Cadastrar livro
          </Link>
        </div>
      </div>

      {editandoLoja && (
        <div className="painel" style={{ marginBottom: 24 }}>
          <h3 style={{ marginBottom: 14 }}>Dados da loja</h3>
          <FormLoja loja={loja} onSalvar={salvarDadosLoja} onCancelar={() => setEditandoLoja(false)} />
        </div>
      )}

      <div className="painel-resumo">
        <div className="painel"><b>{livros.length}</b><span>livros cadastrados</span></div>
        <div className="painel"><b>{ativos}</b><span>na vitrine</span></div>
        <div className="painel"><b>{livros.length - ativos}</b><span>desativados</span></div>
      </div>

      <section className="secao" style={{ marginTop: 24 }}>
        <div className="secao-titulo"><h2><Icone nome="livros" alt="" tam={20} /> Meus livros</h2></div>

        {erroLivros && <div className="toast toast-error">{erroLivros}</div>}

        {carregandoLivros ? (
          <p style={{ color: 'var(--muted)' }}>Carregando livros...</p>
        ) : livros.length === 0 ? (
          <div className="painel vazio">
            <span className="icone"><Icone nome="caixa-vazia" alt="" tam={54} /></span>
            <h2>Nenhum livro cadastrado</h2>
            <p>Cadastre seu primeiro livro para ele aparecer na vitrine.</p>
            <Link className="btn btn-accent" href="/painel-vendedor/livros/novo">Cadastrar livro</Link>
          </div>
        ) : (
          <div className="lista-vendedor">
            {livros.map((livro) => {
              const [capa] = fotosDoLivro(livro);
              const emAcao = ocupado === livro.id;
              return (
                <article key={livro.id} className={`item-vendedor painel ${livro.ativo ? '' : 'inativo'}`}>
                  <div className="item-capa">
                    {capa ? <img src={capa} alt={livro.titulo} loading="lazy" /> : <Icone nome="livros" alt="" tam={30} />}
                  </div>
                  <div className="item-info">
                    <div style={{ display: 'flex', gap: 8, alignItems: 'center', flexWrap: 'wrap' }}>
                      <h3>{livro.titulo}</h3>
                      <span className={`status-pill ${livro.ativo ? 'status-pago' : 'status-cancelado'}`}>
                        {livro.ativo ? 'Ativo' : 'Inativo'}
                      </span>
                    </div>
                    <p className="card-autor">
                      {livro.autor}
                      {livro.ano_lancamento ? ` · ${livro.ano_lancamento}` : ''}
                      {livro.categoria ? ` · ${livro.categoria}` : ''}
                    </p>
                    <p className="item-meta">
                      <b>{preco(livro.preco)}</b> · estoque: {livro.estoque}
                    </p>
                  </div>
                  <div className="item-acoes">
                    {confirmarExclusao === livro.id ? (
                      <div className="confirmar-exclusao">
                        <span>Excluir este livro?</span>
                        <button className="btn btn-danger btn-sm" type="button" onClick={() => excluir(livro)} disabled={emAcao}>
                          {emAcao ? 'Excluindo...' : 'Sim, excluir'}
                        </button>
                        <button className="btn btn-ghost btn-sm" type="button" onClick={() => setConfirmarExclusao(null)} disabled={emAcao}>
                          Cancelar
                        </button>
                      </div>
                    ) : (
                      <>
                        {livro.ativo && (
                          <Link className="btn btn-ghost btn-sm" href={`/livro/${livro.id}`}>Ver</Link>
                        )}
                        <Link className="btn btn-ghost btn-sm" href={`/painel-vendedor/livros/${livro.id}/editar`}>Editar</Link>
                        <button className="btn btn-ghost btn-sm" type="button" onClick={() => alternarAtivo(livro)} disabled={emAcao}>
                          {emAcao ? '...' : livro.ativo ? 'Desativar' : 'Ativar'}
                        </button>
                        <button className="btn btn-ghost btn-sm btn-excluir" type="button" onClick={() => setConfirmarExclusao(livro.id)} disabled={emAcao}>
                          <Icone nome="lixeira" alt="" tam={14} /> Excluir
                        </button>
                      </>
                    )}
                  </div>
                </article>
              );
            })}
          </div>
        )}
      </section>
    </>
  );
}
