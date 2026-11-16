/**
 * Página de login. Autentica com Supabase Auth (supabase.auth.signInWithPassword,
 * chamado via Server Action em src/app/auth/actions.js).
 */
'use client';

import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import { Suspense, useState } from 'react';
import Icone from '@/components/Icone';
import CampoSenha from '@/components/CampoSenha';
import { entrar } from '@/app/auth/actions';

function ConteudoLogin() {
  const router = useRouter();
  const searchParams = useSearchParams();
  // Destino pedido explicitamente (ex.: veio de uma rota protegida).
  // Só aceita caminhos internos (evita redirecionar para outro site).
  const proximoBruto = searchParams.get('proximo') || '';
  const proximo = proximoBruto.startsWith('/') && !proximoBruto.startsWith('//') ? proximoBruto : null;

  const [email, setEmail] = useState('');
  const [senha, setSenha] = useState('');
  const [erro, setErro] = useState(null);
  const [enviando, setEnviando] = useState(false);

  async function handleSubmit(e) {
    e.preventDefault();
    setErro(null);

    if (email.trim() === '' || senha === '') {
      setErro('Preencha e-mail e senha.');
      return;
    }

    setEnviando(true);
    const resultado = await entrar({ email: email.trim(), senha });
    setEnviando(false);

    if (resultado?.erro) {
      setErro(resultado.erro);
      return;
    }

    window.dispatchEvent(new Event('usuario-atualizado'));
    // Sem destino explícito: vendedor vai para o painel, cliente para o início.
    const destino = proximo || (resultado.tipo === 'vendedor' ? '/painel-vendedor' : '/');
    router.push(destino);
    router.refresh();
  }

  return (
    <div className="auth-wrap">
      <div className="painel auth-card">
        <span style={{ display: 'inline-block' }}><Icone nome="livros" alt="Livraria" tam={44} /></span>
        <h1>Bem-vindo de volta</h1>
        <p className="sub">Acesse sua conta para salvar favoritos e acompanhar pedidos.</p>

        {erro && <div className="toast toast-error">{erro}</div>}

        <form onSubmit={handleSubmit} className="form-grid" style={{ textAlign: 'left' }}>
          <div className="campo">
            <label htmlFor="email">E-mail</label>
            <input type="email" id="email" required autoFocus value={email} onChange={(e) => setEmail(e.target.value)} />
          </div>
          <CampoSenha id="senha" label="Senha" required value={senha} onChange={(e) => setSenha(e.target.value)} />
          <button className="btn btn-primary" type="submit" style={{ justifyContent: 'center' }} disabled={enviando}>
            {enviando ? 'Entrando...' : 'Entrar'}
          </button>
          <Link className="btn btn-ghost" href="/esqueci-senha" style={{ justifyContent: 'center' }}>
            <Icone nome="cadeado" alt="" tam={16} /> Esqueci minha senha / Redefinir senha
          </Link>
        </form>

        <div className="auth-alt">
          Ainda não tem conta? <Link href="/auth/registro">Criar conta grátis</Link>
          <br />
          Quer vender livros? <Link href="/vendedor/cadastro">Tornar-se vendedor</Link>
        </div>
      </div>
    </div>
  );
}

export default function Login() {
  return (
    <Suspense fallback={null}>
      <ConteudoLogin />
    </Suspense>
  );
}
