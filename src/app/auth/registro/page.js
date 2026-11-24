/**
 * Página de cadastro. Cria a conta com Supabase Auth (supabase.auth.signUp,
 * chamado via Server Action em src/app/auth/actions.js). Cadastro único: toda
 * conta nasce cliente (para vender, use /vendedor/cadastro). Não há verificação
 * por e-mail: após o cadastro o usuário já entra logado.
 */
'use client';

import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import { Suspense, useState } from 'react';
import Icone from '@/components/Icone';
import CampoSenha from '@/components/CampoSenha';
import { cadastrar } from '@/app/auth/actions';
import { comProximo, destinoSeguro } from '@/lib/redirecionamento';

function ConteudoRegistro() {
  const router = useRouter();
  const searchParams = useSearchParams();
  // Destino de volta depois do cadastro (ex.: /vendedor/cadastro).
  const proximo = destinoSeguro(searchParams.get('proximo'));
  const [nome, setNome] = useState('');
  const [email, setEmail] = useState('');
  const [senha, setSenha] = useState('');
  const [confirmacao, setConfirmacao] = useState('');
  const [erro, setErro] = useState(null);
  const [enviando, setEnviando] = useState(false);

  async function handleSubmit(e) {
    e.preventDefault();
    setErro(null);

    if (nome.trim().length < 2) {
      setErro('Informe seu nome.');
      return;
    }
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim())) {
      setErro('E-mail inválido.');
      return;
    }
    if (senha.length < 6) {
      setErro('A senha deve ter ao menos 6 caracteres.');
      return;
    }
    if (senha !== confirmacao) {
      setErro('As senhas não coincidem.');
      return;
    }

    setEnviando(true);
    const resultado = await cadastrar({ nome: nome.trim(), email: email.trim(), senha });
    setEnviando(false);

    if (resultado?.erro) {
      setErro(resultado.erro);
      return;
    }

    // Sem verificação por e-mail: a conta já entra logada.
    window.dispatchEvent(new Event('usuario-atualizado'));
    window.showToast?.('Conta criada com sucesso! Boas leituras.');
    router.push(proximo || '/');
    router.refresh();
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
            <label htmlFor="nome">Nome</label>
            <input type="text" id="nome" required autoFocus autoComplete="name" value={nome} onChange={(e) => setNome(e.target.value)} />
          </div>
          <div className="campo">
            <label htmlFor="email">E-mail</label>
            <input type="email" id="email" required autoComplete="email" value={email} onChange={(e) => setEmail(e.target.value)} />
          </div>
          <CampoSenha id="senha" label="Senha" required minLength={6} autoComplete="new-password" value={senha} onChange={(e) => setSenha(e.target.value)} />
          <CampoSenha id="confirmacao" label="Confirmar senha" required minLength={6} autoComplete="new-password" value={confirmacao} onChange={(e) => setConfirmacao(e.target.value)} />
          <button className="btn btn-primary" type="submit" style={{ justifyContent: 'center' }} disabled={enviando}>
            {enviando ? 'Criando conta...' : 'Criar conta'}
          </button>
        </form>

        <div className="auth-alt">
          Já tem conta? <Link href={comProximo('/auth/login', proximo)}>Entrar</Link>
        </div>

        <div className="cta-vendedor-mini">
          <span><Icone nome="livros" alt="" tam={18} /> Quer vender seus livros?</span>
          <Link className="btn btn-accent btn-sm" href="/vendedor/cadastro">Tornar-se vendedor</Link>
        </div>
      </div>
    </div>
  );
}

export default function Registro() {
  // useSearchParams exige um limite de Suspense na renderização estática.
  return (
    <Suspense fallback={null}>
      <ConteudoRegistro />
    </Suspense>
  );
}
