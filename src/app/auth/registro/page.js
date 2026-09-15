/**
 * Página de cadastro. Cria a conta com Supabase Auth (supabase.auth.signUp,
 * chamado via Server Action em src/app/auth/actions.js). A confirmação de
 * e-mail está ativada no projeto: signUp() não retorna sessão, então em vez
 * de redirecionar mostramos aqui mesmo o aviso para checar a caixa de entrada.
 */
'use client';

import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useState } from 'react';
import Icone from '@/components/Icone';
import { cadastrar } from '@/app/auth/actions';

export default function Registro() {
  const router = useRouter();
  const [email, setEmail] = useState('');
  const [senha, setSenha] = useState('');
  const [erro, setErro] = useState(null);
  const [enviando, setEnviando] = useState(false);
  const [cadastroEnviado, setCadastroEnviado] = useState(false);

  async function handleSubmit(e) {
    e.preventDefault();
    setErro(null);

    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim())) {
      setErro('E-mail inválido.');
      return;
    }
    if (senha.length < 6) {
      setErro('A senha deve ter ao menos 6 caracteres.');
      return;
    }

    setEnviando(true);
    const resultado = await cadastrar({ email: email.trim(), senha });
    setEnviando(false);

    if (resultado?.erro) {
      setErro(resultado.erro);
      return;
    }

    if (resultado.confirmado) {
      // Confirmação de e-mail desativada no projeto: já entra logado.
      window.dispatchEvent(new Event('usuario-atualizado'));
      window.showToast?.('Conta criada com sucesso! Boas leituras.');
      router.push('/');
      router.refresh();
      return;
    }

    setCadastroEnviado(true);
  }

  if (cadastroEnviado) {
    return (
      <div className="auth-wrap">
        <div className="painel auth-card">
          <span style={{ display: 'inline-block' }}><Icone nome="info" alt="Confirme seu e-mail" tam={44} /></span>
          <h1>Confirme seu e-mail</h1>
          <p className="sub">
            Enviamos um link de confirmação para <b>{email.trim()}</b>. Abra sua caixa de
            entrada (ou spam) e clique no link para ativar sua conta.
          </p>
          <div className="auth-alt">
            Já confirmou? <Link href="/auth/login">Entrar</Link>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="auth-wrap">
      <div className="painel auth-card">
        <span style={{ display: 'inline-block' }}><Icone nome="faiscas" alt="Crie sua conta" tam={44} /></span>
        <h1>Crie sua conta</h1>
        <p className="sub">Leve seus favoritos e pedidos para onde for.</p>

        {erro && <div className="toast toast-error">{erro}</div>}

        <form onSubmit={handleSubmit} className="form-grid" style={{ textAlign: 'left' }}>
          <div className="campo">
            <label htmlFor="email">E-mail</label>
            <input type="email" id="email" required autoFocus value={email} onChange={(e) => setEmail(e.target.value)} />
          </div>
          <div className="campo">
            <label htmlFor="senha">Senha</label>
            <input type="password" id="senha" required minLength={6} value={senha} onChange={(e) => setSenha(e.target.value)} />
          </div>
          <button className="btn btn-primary" type="submit" style={{ justifyContent: 'center' }} disabled={enviando}>
            {enviando ? 'Criando conta...' : 'Criar conta'}
          </button>
        </form>

        <div className="auth-alt">
          Já tem conta? <Link href="/auth/login">Entrar</Link>
        </div>
      </div>
    </div>
  );
}
