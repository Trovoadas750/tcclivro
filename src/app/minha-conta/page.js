/**
 * Página "Minha conta".
 * Componente CLIENT: mostra o perfil (tabela `profiles`), contadores de
 * pedidos/favoritos e o formulário de edição. Os dados vêm do cache do
 * localStorage quando possível (ver src/lib/usePerfil.js).
 */
'use client';

import Link from 'next/link';
import { useEffect, useState } from 'react';
import Icone from '@/components/Icone';
import { usePerfil } from '@/lib/usePerfil';

export default function MinhaConta() {
  const { carregando, usuario, perfil, favoritos, pedidos, erro, salvarPerfil } = usePerfil();
  const [nome, setNome] = useState('');
  const [avatarUrl, setAvatarUrl] = useState('');
  const [salvando, setSalvando] = useState(false);

  // Preenche o formulário quando o perfil chega (cache ou banco). Depende dos
  // valores (não do objeto) para que uma atualização em segundo plano com os
  // mesmos dados não apague o que o usuário está digitando.
  const nomeSalvo = perfil?.nome || '';
  const avatarSalvo = perfil?.avatar_url || '';
  useEffect(() => {
    setNome(nomeSalvo);
    setAvatarUrl(avatarSalvo);
  }, [nomeSalvo, avatarSalvo]);

  async function salvar(e) {
    e.preventDefault();
    setSalvando(true);
    const r = await salvarPerfil({ nome: nome.trim(), avatar_url: avatarUrl.trim() });
    setSalvando(false);
    window.showToast?.(r.ok ? 'Dados atualizados com sucesso!' : r.erro);
  }

  if (carregando || !usuario) {
    return <div style={{ marginTop: 40, textAlign: 'center' }}>Carregando...</div>;
  }

  return (
    <>
      <h1 style={{ margin: '28px 0 20px', display: 'flex', alignItems: 'center', gap: 10 }}>
        {perfil?.avatar_url ? (
          <img src={perfil.avatar_url} alt="Foto de perfil" width={44} height={44} style={{ borderRadius: '50%', objectFit: 'cover' }} />
        ) : (
          <Icone nome="usuario" alt="Usuário" tam={22} />
        )}
        Olá, {perfil?.nome || usuario.email}!
      </h1>

      {erro && <div className="toast toast-error" style={{ marginBottom: 16 }}>{erro}</div>}

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit,minmax(180px,1fr))', gap: 16, marginBottom: 24 }}>
        <div className="painel" style={{ textAlign: 'center' }}>
          <span style={{ display: 'inline-block' }}><Icone nome="pacote" alt="Pedidos" tam={30} /></span>
          <h2 style={{ fontSize: 26 }}>{pedidos.length}</h2>
          <p style={{ color: 'var(--muted)' }}>pedidos</p>
          <Link className="btn btn-ghost btn-sm" href="/meus-pedidos">Ver pedidos</Link>
        </div>
        <div className="painel" style={{ textAlign: 'center' }}>
          <span style={{ display: 'inline-block' }}><Icone nome="coracao" alt="Favoritos" tam={30} /></span>
          <h2 style={{ fontSize: 26 }}>{favoritos.length}</h2>
          <p style={{ color: 'var(--muted)' }}>favoritos</p>
          <Link className="btn btn-ghost btn-sm" href="/favoritos">Ver favoritos</Link>
        </div>
        <div className="painel" style={{ textAlign: 'center' }}>
          <span style={{ display: 'inline-block' }}><Icone nome="robo" alt="IA" tam={30} /></span>
          <h2 style={{ fontSize: 26 }}>IA</h2>
          <p style={{ color: 'var(--muted)' }}>recomendações</p>
          <Link className="btn btn-ghost btn-sm" href="/ia">Pedir indicação</Link>
        </div>
      </div>

      <div className="painel">
        <h3 style={{ marginBottom: 16 }}>Dados pessoais</h3>
        <form onSubmit={salvar} className="form-grid">
          <div className="campo">
            <label>Nome completo</label>
            <input type="text" required value={nome} onChange={(e) => setNome(e.target.value)} />
          </div>
          <div className="campo">
            <label>E-mail</label>
            <input type="email" value={usuario.email} disabled />
            <small style={{ color: 'var(--muted)' }}>O e-mail não pode ser alterado nesta demo.</small>
          </div>
          <div className="campo">
            <label>URL da foto de perfil (opcional)</label>
            <input type="url" value={avatarUrl} onChange={(e) => setAvatarUrl(e.target.value)} placeholder="https://..." />
          </div>
          <button className="btn btn-primary" type="submit" style={{ justifySelf: 'start' }} disabled={salvando}>
            {salvando ? 'Salvando...' : 'Salvar alterações'}
          </button>
        </form>
      </div>
    </>
  );
}
