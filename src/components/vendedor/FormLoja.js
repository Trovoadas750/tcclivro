/**
 * Formulário "Criar minha loja" / "Editar loja".
 * nome_loja é obrigatório; descricao é opcional.
 */
'use client';

import { useState } from 'react';

export default function FormLoja({ loja, onSalvar, onCancelar }) {
  const [nome, setNome] = useState(loja?.nome_loja || '');
  const [descricao, setDescricao] = useState(loja?.descricao || '');
  const [erro, setErro] = useState(null);
  const [salvando, setSalvando] = useState(false);

  async function enviar(e) {
    e.preventDefault();
    setErro(null);
    if (nome.trim().length < 2) {
      setErro('Informe o nome da loja.');
      return;
    }
    setSalvando(true);
    const r = await onSalvar({ nome_loja: nome, descricao });
    setSalvando(false);
    if (r?.erro) setErro(r.erro);
  }

  return (
    <form onSubmit={enviar} className="form-grid">
      {erro && <div className="toast toast-error">{erro}</div>}
      <div className="campo">
        <label htmlFor="loja-nome">Nome da loja *</label>
        <input id="loja-nome" type="text" required maxLength={80} value={nome} onChange={(e) => setNome(e.target.value)} />
      </div>
      <div className="campo">
        <label htmlFor="loja-descricao">Descrição (opcional)</label>
        <textarea id="loja-descricao" rows={3} maxLength={500} value={descricao} onChange={(e) => setDescricao(e.target.value)} />
      </div>
      <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap' }}>
        <button className="btn btn-accent" type="submit" disabled={salvando}>
          {salvando ? 'Salvando...' : loja ? 'Salvar loja' : 'Criar minha loja'}
        </button>
        {onCancelar && (
          <button className="btn btn-ghost" type="button" onClick={onCancelar} disabled={salvando}>Cancelar</button>
        )}
      </div>
    </form>
  );
}
