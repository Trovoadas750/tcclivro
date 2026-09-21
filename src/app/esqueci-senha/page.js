/**
 * Redefinição de senha — passo 1: informa o e-mail e recebe o código.
 * Usa supabase.auth.resetPasswordForEmail (o e-mail precisa exibir o
 * código {{ .Token }} no template do Supabase — ver README).
 */
'use client';

import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useState } from 'react';
import Icone from '@/components/Icone';
import { createClient } from '@/lib/supabase/client';
import { erroEnviarCodigo } from '@/lib/authErros';
import { STORAGE_KEYS } from '@/lib/config';

export default function EsqueciSenha() {
  const router = useRouter();
  const [email, setEmail] = useState('');
  const [erro, setErro] = useState(null);
  const [enviando, setEnviando] = useState(false);

  async function handleSubmit(e) {
    e.preventDefault();
    setErro(null);

    const emailLimpo = email.trim();
    if (!/^\S+@\S+\.\S+$/.test(emailLimpo)) {
      setErro('E-mail inválido. Confira e tente novamente.');
      return;
    }

    setEnviando(true);
    const supabase = createClient();
    const { error } = await supabase.auth.resetPasswordForEmail(emailLimpo);
    setEnviando(false);

    if (error) {
      setErro(erroEnviarCodigo(error));
      return;
    }

    // O Supabase responde sucesso mesmo se o e-mail não existir (evita
    // revelar quem tem conta), então seguimos sempre para a próxima etapa.
    try {
      sessionStorage.setItem(STORAGE_KEYS.RECUPERACAO_EMAIL, emailLimpo);
    } catch {
      // sessionStorage indisponível — a próxima tela pedirá o e-mail de novo.
    }
    router.push('/redefinir-senha/codigo');
  }

  return (
    <div className="auth-wrap">
      <div className="painel auth-card">
        <span style={{ display: 'inline-block' }}><Icone nome="cadeado" alt="Senha" tam={44} /></span>
        <h1>Esqueceu a senha?</h1>
        <p className="sub">Informe seu e-mail e enviaremos um código de 6 dígitos para você criar uma nova senha.</p>

        {erro && <div className="toast toast-error">{erro}</div>}

        <form onSubmit={handleSubmit} className="form-grid" style={{ textAlign: 'left' }}>
          <div className="campo">
            <label htmlFor="email">E-mail</label>
            <input type="email" id="email" required autoFocus value={email} onChange={(e) => setEmail(e.target.value)} />
          </div>
          <button className="btn btn-primary" type="submit" style={{ justifyContent: 'center' }} disabled={enviando}>
            {enviando ? 'Enviando...' : 'Enviar código'}
          </button>
        </form>

        <div className="auth-alt">
          Lembrou a senha? <Link href="/auth/login">Voltar ao login</Link>
        </div>
      </div>
    </div>
  );
}
