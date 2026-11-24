/**
 * Formulário da loja, usado em três lugares:
 *   - "Abrir minha loja" (/vendedor/cadastro → rpc tornar_vendedor)
 *   - "Criar minha loja" (painel, vendedor antigo sem loja)
 *   - "Editar loja" (painel)
 * nome_loja é obrigatório (2 a 80 caracteres, sem contar espaços nas
 * pontas, igual ao check do banco); descricao é opcional.
 * `onSalvar({ nome_loja, descricao })` deve devolver { ok } ou { erro }.
 */
'use client';

import { useState } from 'react';

export const NOME_LOJA_MIN = 2;
export const NOME_LOJA_MAX = 80;

export default function FormLoja({ loja, onSalvar, onCancelar, rotuloBotao, rotuloEnviando = 'Salvando...' }) {
  const [nome, setNome] = useState(loja?.nome_loja || '');
  const [descricao, setDescricao] = useState(loja?.descricao || '');
  const [erro, setErro] = useState(null);
  const [salvando, setSalvando] = useState(false);

  const tamanho = nome.trim().length;
  const nomeValido = tamanho >= NOME_LOJA_MIN && tamanho <= NOME_LOJA_MAX;

  async function enviar(e) {
    e.preventDefault();
    if (salvando) return;
    setErro(null);
    if (!nomeValido) {
      setErro(`O nome da loja precisa ter entre ${NOME_LOJA_MIN} e ${NOME_LOJA_MAX} caracteres.`);
      return;
    }
    setSalvando(true);
    const r = await onSalvar({ nome_loja: nome.trim(), descricao: descricao.trim() });
    // Em caso de sucesso a tela costuma mudar (redireciona/fecha); só
    // reabilita o botão se ainda houver algo a corrigir.
    if (r?.erro) {
      setErro(r.erro);
      setSalvando(false);
    } else if (!r?.manterBloqueado) {
      setSalvando(false);
    }
  }

  return (
    <form onSubmit={enviar} className="form-grid">
      {erro && <div className="toast toast-error" role="alert">{erro}</div>}
      <div className="campo">
        <label htmlFor="loja-nome">Nome da loja *</label>
        <input
          id="loja-nome"
          type="text"
          required
          maxLength={NOME_LOJA_MAX}
          value={nome}
          onChange={(e) => setNome(e.target.value)}
          placeholder="Ex.: Sebo da Esquina"
          aria-describedby="loja-nome-contador"
          disabled={salvando}
        />
        <small
          id="loja-nome-contador"
          className="ajuda"
          style={{ textAlign: 'right', color: tamanho > 0 && !nomeValido ? 'var(--danger)' : undefined }}
        >
          {tamanho}/{NOME_LOJA_MAX}{tamanho > 0 && tamanho < NOME_LOJA_MIN ? ` (mínimo ${NOME_LOJA_MIN})` : ''}
        </small>
      </div>
      <div className="campo">
        <label htmlFor="loja-descricao">Descrição (opcional)</label>
        <textarea
          id="loja-descricao"
          rows={3}
          maxLength={500}
          value={descricao}
          onChange={(e) => setDescricao(e.target.value)}
          placeholder="Conte o que sua loja vende"
          disabled={salvando}
        />
      </div>
      <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap' }}>
        <button className="btn btn-accent" type="submit" disabled={salvando || !nomeValido}>
          {salvando ? rotuloEnviando : rotuloBotao || (loja ? 'Salvar loja' : 'Criar minha loja')}
        </button>
        {onCancelar && (
          <button className="btn btn-ghost" type="button" onClick={onCancelar} disabled={salvando}>Cancelar</button>
        )}
      </div>
    </form>
  );
}
