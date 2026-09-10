/**
 * Página de login (equivalente ao auth/login.php do PHP).
 * Componente CLIENT: autentica contra o usuário demo (localStorage;
 * em produção: tabela `usuarios` via Supabase + senha com hash).
 */
'use client';

import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import { Suspense, useState } from 'react';
import Icone from '@/components/Icone';
import { setUsuario, getUsuario } from '@/lib/clientStore';
import { USUARIO_DEMO } from '@/lib/mockData';

function ConteudoLogin() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const proximo = searchParams.get('proximo') || '/';

  const [email, setEmail] = useState('');
  const [senha, setSenha] = useState('');
  const [erro, setErro] = useState(null);

  function entrar(e) {
    e.preventDefault();

    if (email.trim() === '' || senha === '') {
      setErro('Preencha e-mail e senha.');
      return;
    }

    // Simula a consulta: SELECT * FROM usuarios WHERE email = ?
    // (no PHP: password_verify($senha, $usuario['senha_hash']))
    if (email.trim().toLowerCase() === USUARIO_DEMO.email && senha === USUARIO_DEMO.senha) {
      setUsuario({
        id: USUARIO_DEMO.id,
        nome: USUARIO_DEMO.nome,
        email: USUARIO_DEMO.email,
        endereco: USUARIO_DEMO.endereco,
        cidade: USUARIO_DEMO.cidade,
        uf: USUARIO_DEMO.uf,
        telefone: USUARIO_DEMO.telefone,
      });
      window.dispatchEvent(new Event('usuario-atualizado'));
      window.showToast?.(`Bem-vindo(a) de volta, ${USUARIO_DEMO.nome}!`);
      router.push(proximo);
    } else {
      setErro('E-mail ou senha inválidos.');
    }
  }

  return (
    <div className="auth-wrap">
      <div className="painel auth-card">
        <span style={{ display: 'inline-block' }}><Icone nome="livros" alt="Livraria" tam={44} /></span>
        <h1>Bem-vindo de volta</h1>
        <p className="sub">Acesse sua conta para salvar favoritos e acompanhar pedidos.</p>

        {erro && <div className="toast toast-error">{erro}</div>}

        <form onSubmit={entrar} className="form-grid" style={{ textAlign: 'left' }}>
          <div className="campo">
            <label htmlFor="email">E-mail</label>
            <input type="email" id="email" required autoFocus value={email} onChange={(e) => setEmail(e.target.value)} />
          </div>
          <div className="campo">
            <label htmlFor="senha">Senha</label>
            <input type="password" id="senha" required value={senha} onChange={(e) => setSenha(e.target.value)} />
          </div>
          <button className="btn btn-primary" type="submit" style={{ justifyContent: 'center' }}>Entrar</button>
        </form>

        <div className="auth-alt">
          Ainda não tem conta? <Link href="/auth/registro">Criar conta grátis</Link>
        </div>
        <div className="auth-alt" style={{ background: 'var(--hover-bg)', borderRadius: 10, padding: 10 }}>
          <small>Demo: <b>demo@casadoleitor.com</b> / senha <b>123456</b></small>
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