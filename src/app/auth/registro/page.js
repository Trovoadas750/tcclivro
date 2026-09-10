/**
 * Página de registro (equivalente ao auth/registro.php do PHP).
 * Componente CLIENT: cria a conta no localStorage (em produção:
 * INSERT na tabela `usuarios` via Supabase, com senha com hash).
 */
'use client';

import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useState } from 'react';
import Icone from '@/components/Icone';
import { setUsuario, getUsuario } from '@/lib/clientStore';
import { USUARIO_DEMO } from '@/lib/mockData';

export default function Registro() {
  const router = useRouter();
  const [form, setForm] = useState({ nome: '', email: '', senha: '', confirmar: '' });
  const [erros, setErros] = useState([]);

  function setCampo(nome, valor) {
    setForm((f) => ({ ...f, [nome]: valor }));
  }

  function criar(e) {
    e.preventDefault();

    const problemas = [];
    if (form.nome.trim().length < 3) problemas.push('Informe seu nome completo.');
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email.trim())) problemas.push('E-mail inválido.');
    if (form.senha.length < 6) problemas.push('A senha deve ter ao menos 6 caracteres.');
    if (form.senha !== form.confirmar) problemas.push('A confirmação de senha não confere.');

    // Simula: SELECT id FROM usuarios WHERE email = ? (e-mail duplicado)
    if (form.email.trim().toLowerCase() === USUARIO_DEMO.email) {
      problemas.push('Este e-mail já está cadastrado.');
    }

    if (problemas.length) {
      setErros(problemas);
      return;
    }

    // Simula: INSERT INTO usuarios (nome, email, senha_hash) VALUES (...)
    setUsuario({
      id: Date.now(),
      nome: form.nome.trim(),
      email: form.email.trim().toLowerCase(),
    });
    window.dispatchEvent(new Event('usuario-atualizado'));
    window.showToast?.('Conta criada com sucesso! Boas leituras.');
    router.push('/');
  }

  return (
    <div className="auth-wrap">
      <div className="painel auth-card">
        <span style={{ display: 'inline-block' }}><Icone nome="faiscas" alt="Crie sua conta" tam={44} /></span>
        <h1>Crie sua conta</h1>
        <p className="sub">Leve seus favoritos e pedidos para onde for.</p>

        {erros.length > 0 && (
          <div className="toast toast-error">{erros.join(' / ')}</div>
        )}

        <form onSubmit={criar} className="form-grid" style={{ textAlign: 'left' }}>
          <div className="campo">
            <label htmlFor="nome">Nome completo</label>
            <input type="text" id="nome" required autoFocus value={form.nome} onChange={(e) => setCampo('nome', e.target.value)} />
          </div>
          <div className="campo">
            <label htmlFor="email">E-mail</label>
            <input type="email" id="email" required value={form.email} onChange={(e) => setCampo('email', e.target.value)} />
          </div>
          <div className="dupla">
            <div className="campo">
              <label htmlFor="senha">Senha</label>
              <input type="password" id="senha" required minLength={6} value={form.senha} onChange={(e) => setCampo('senha', e.target.value)} />
            </div>
            <div className="campo">
              <label htmlFor="confirmar">Confirmar senha</label>
              <input type="password" id="confirmar" required minLength={6} value={form.confirmar} onChange={(e) => setCampo('confirmar', e.target.value)} />
            </div>
          </div>
          <button className="btn btn-primary" type="submit" style={{ justifyContent: 'center' }}>Criar conta</button>
        </form>

        <div className="auth-alt">
          Já tem conta? <Link href="/auth/login">Entrar</Link>
        </div>
      </div>
    </div>
  );
}