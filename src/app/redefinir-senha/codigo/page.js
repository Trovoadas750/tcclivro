/**
 * Redefinição de senha — passo 2: confirma o código de 6 dígitos.
 * Usa supabase.auth.verifyOtp({ email, token, type: 'recovery' }), que
 * também abre uma sessão temporária para o passo 3.
 */
'use client';

import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';
import Icone from '@/components/Icone';
import { createClient } from '@/lib/supabase/client';
import { erroEnviarCodigo, erroVerificarCodigo } from '@/lib/authErros';
import { STORAGE_KEYS } from '@/lib/config';

const ESPERA_REENVIO_S = 60;

export default function CodigoRecuperacao() {
  const router = useRouter();
  const [email, setEmail] = useState('');
  const [codigo, setCodigo] = useState('');
  const [erro, setErro] = useState(null);
  const [info, setInfo] = useState(null);
  const [enviando, setEnviando] = useState(false);
  const [espera, setEspera] = useState(ESPERA_REENVIO_S);

  useEffect(() => {
    let guardado = null;
    try {
      guardado = sessionStorage.getItem(STORAGE_KEYS.RECUPERACAO_EMAIL);
    } catch {
      // sessionStorage indisponível.
    }
    if (!guardado) {
      router.replace('/esqueci-senha');
      return;
    }
    setEmail(guardado);
  }, [router]);

  // Contagem regressiva para liberar o reenvio do código.
  useEffect(() => {
    if (espera <= 0) return;
    const t = setTimeout(() => setEspera((s) => s - 1), 1000);
    return () => clearTimeout(t);
  }, [espera]);

  async function handleSubmit(e) {
    e.preventDefault();
    setErro(null);
    setInfo(null);

    if (!/^\d{6}$/.test(codigo)) {
      setErro('Digite o código de 6 dígitos enviado ao seu e-mail.');
      return;
    }

    setEnviando(true);
    const supabase = createClient();
    const { error } = await supabase.auth.verifyOtp({ email, token: codigo, type: 'recovery' });
    setEnviando(false);

    if (error) {
      setErro(erroVerificarCodigo(error));
      return;
    }

    router.push('/redefinir-senha/nova');
  }

  async function reenviar() {
    setErro(null);
    setInfo(null);
    const supabase = createClient();
    const { error } = await supabase.auth.resetPasswordForEmail(email);
    if (error) {
      setErro(erroEnviarCodigo(error));
      return;
    }
    setInfo('Enviamos um novo código. Verifique sua caixa de entrada.');
    setEspera(ESPERA_REENVIO_S);
  }

  if (!email) return null;

  return (
    <div className="auth-wrap">
      <div className="painel auth-card">
        <span style={{ display: 'inline-block' }}><Icone nome="cadeado" alt="Código" tam={44} /></span>
        <h1>Digite o código</h1>
        <p className="sub">Enviamos um código de 6 dígitos para <b>{email}</b>.</p>

        {erro && <div className="toast toast-error">{erro}</div>}
        {info && <div className="toast">{info}</div>}

        <form onSubmit={handleSubmit} className="form-grid" style={{ textAlign: 'left' }}>
          <div className="campo">
            <label htmlFor="codigo">Código</label>
            <input
              type="text"
              id="codigo"
              inputMode="numeric"
              autoComplete="one-time-code"
              maxLength={6}
              placeholder="000000"
              required
              autoFocus
              value={codigo}
              onChange={(e) => setCodigo(e.target.value.replace(/\D/g, '').slice(0, 6))}
              style={{ letterSpacing: 6, textAlign: 'center', fontSize: 20 }}
            />
          </div>
          <button className="btn btn-primary" type="submit" style={{ justifyContent: 'center' }} disabled={enviando}>
            {enviando ? 'Verificando...' : 'Verificar código'}
          </button>
        </form>

        <div className="auth-alt">
          <button
            type="button"
            className="btn btn-ghost btn-sm"
            onClick={reenviar}
            disabled={espera > 0}
          >
            {espera > 0 ? `Reenviar código em ${espera}s` : 'Reenviar código'}
          </button>
          <div style={{ marginTop: 10 }}>
            <Link href="/esqueci-senha">Usar outro e-mail</Link>
          </div>
        </div>
      </div>
    </div>
  );
}
