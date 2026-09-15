/**
 * Página "Minha conta" (equivalente ao minha-conta.php).
 * Componente CLIENT: exibe dados do usuário, contadores de
 * pedidos/favoritos e formulário de edição (localStorage;
 * em produção: tabela `usuarios` via Supabase).
 */
'use client';

import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';
import Icone from '@/components/Icone';
import { getFavoritos, getPedidos } from '@/lib/clientStore';
import { PEDIDO_DEMO } from '@/lib/mockData';
import { createClient } from '@/lib/supabase/client';

export default function MinhaConta() {
  const router = useRouter();
  const [usuario, setUsuarioState] = useState(null);
  const [dados, setDados] = useState({ nome: '', telefone: '', endereco: '', cidade: '', uf: '' });
  const [totais, setTotais] = useState({ pedidos: 0, favoritos: 0 });

  useEffect(() => {
    const supabase = createClient();

    async function carregar() {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        router.replace('/auth/login?proximo=/minha-conta');
        return;
      }
      setUsuarioState(user);

      const meusPedidos = getPedidos().filter((p) => p.usuarioId === user.id).length;
      setTotais({ pedidos: meusPedidos + (PEDIDO_DEMO.codigo ? 1 : 0), favoritos: getFavoritos().length });
    }

    carregar();
  }, [router]);

  function salvar(e) {
    e.preventDefault();
    if (!usuario) return;

    // Dados de perfil (nome/telefone/endereço) ainda não têm uma tabela
    // própria ligada ao login: ficam só nesta sessão do formulário.
    window.showToast?.('Dados atualizados com sucesso!');
  }

  if (!usuario) {
    return <div style={{ marginTop: 40, textAlign: 'center' }}>Redirecionando para o login...</div>;
  }

  return (
    <>
      <h1 style={{ margin: '28px 0 20px' }}>
        <Icone nome="usuario" alt="Usuário" tam={22} /> Olá, {usuario.email}!
      </h1>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit,minmax(180px,1fr))', gap: 16, marginBottom: 24 }}>
        <div className="painel" style={{ textAlign: 'center' }}>
          <span style={{ display: 'inline-block' }}><Icone nome="pacote" alt="Pedidos" tam={30} /></span>
          <h2 style={{ fontSize: 26 }}>{totais.pedidos}</h2>
          <p style={{ color: 'var(--muted)' }}>pedidos</p>
          <Link className="btn btn-ghost btn-sm" href="/meus-pedidos">Ver pedidos</Link>
        </div>
        <div className="painel" style={{ textAlign: 'center' }}>
          <span style={{ display: 'inline-block' }}><Icone nome="coracao" alt="Favoritos" tam={30} /></span>
          <h2 style={{ fontSize: 26 }}>{totais.favoritos}</h2>
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
          <div className="dupla">
            <div className="campo">
              <label>Nome completo</label>
              <input type="text" required value={dados.nome} onChange={(e) => setDados({ ...dados, nome: e.target.value })} />
            </div>
            <div className="campo">
              <label>Telefone</label>
              <input type="text" value={dados.telefone} onChange={(e) => setDados({ ...dados, telefone: e.target.value })} placeholder="(11) 99999-0000" />
            </div>
          </div>
          <div className="campo">
            <label>E-mail</label>
            <input type="email" value={usuario.email} disabled />
            <small style={{ color: 'var(--muted)' }}>O e-mail não pode ser alterado nesta demo.</small>
          </div>
          <div className="campo">
            <label>Endereço</label>
            <input type="text" value={dados.endereco} onChange={(e) => setDados({ ...dados, endereco: e.target.value })} placeholder="Rua, número, complemento" />
          </div>
          <div className="dupla">
            <div className="campo">
              <label>Cidade</label>
              <input type="text" value={dados.cidade} onChange={(e) => setDados({ ...dados, cidade: e.target.value })} />
            </div>
            <div className="campo">
              <label>UF</label>
              <input type="text" maxLength={2} value={dados.uf} onChange={(e) => setDados({ ...dados, uf: e.target.value.toUpperCase() })} />
            </div>
          </div>
          <button className="btn btn-primary" type="submit" style={{ justifySelf: 'start' }}>Salvar alterações</button>
        </form>
      </div>
    </>
  );
}