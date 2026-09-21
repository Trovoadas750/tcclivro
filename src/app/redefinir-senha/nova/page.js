/**
 * Redefinição de senha — passo 3: define a nova senha.
 * Exige a sessão temporária criada pelo verifyOtp do passo 2 e chama
 * supabase.auth.updateUser({ password }).
 */
'use client';

import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';
import Icone from '@/components/Icone';
import CampoSenha from '@/components/CampoSenha';
import { createClient } from '@/lib/supabase/client';
import { erroNovaSenha } from '@/lib/authErros';
import { STORAGE_KEYS } from '@/lib/config';

export default function NovaSenha() {
  const router = useRouter();
  const [pronto, setPronto] = useState(false);
  const [senha, setSenha] = useState('');
  const [confirmacao, setConfirmacao] = useState('');
  const [erro, setErro] = useState(null);
  const [enviando, setEnviando] = useState(false);

  // Sem sessão de recuperação (código não verificado) volta ao início.
  useEffect(() => {
    const supabase = createClient();
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (!session) {
        router.replace('/esqueci-senha');
        return;
      }
      setPronto(true);
    });
  }, [router]);

  async function handleSubmit(e) {
    e.preventDefault();
    setErro(null);

    if (senha.length < 6) {
      setErro('A senha deve ter pelo menos 6 caracteres.');
      return;
    }
    if (senha !== confirmacao) {
      setErro('As senhas não coincidem.');
      return;
    }

    setEnviando(true);
    const supabase = createClient();
    const { error } = await supabase.auth.updateUser({ password: senha });
    setEnviando(false);

    if (error) {
      setErro(erroNovaSenha(error));
      return;
    }

    try {
      sessionStorage.removeItem(STORAGE_KEYS.RECUPERACAO_EMAIL);
    } catch {
      // sem problema.
    }
    window.showToast?.('Senha alterada com sucesso!');
    window.dispatchEvent(new Event('usuario-atualizado'));
    router.push('/');
    router.refresh();
  }

  if (!pronto) return null;

  return (
    <div className="auth-wrap">
      <div className="painel auth-card">
        <span style={{ display: 'inline-block' }}><Icone nome="cadeado" alt="Nova senha" tam={44} /></span>
        <h1>Crie uma nova senha</h1>
        <p className="sub">Escolha uma senha com pelo menos 6 caracteres.</p>

        {erro && <div className="toast toast-error">{erro}</div>}

        <form onSubmit={handleSubmit} className="form-grid" style={{ textAlign: 'left' }}>
          <CampoSenha id="senha" label="Nova senha" required autoFocus autoComplete="new-password" value={senha} onChange={(e) => setSenha(e.target.value)} />
          <CampoSenha id="confirmacao" label="Confirmar nova senha" required autoComplete="new-password" value={confirmacao} onChange={(e) => setConfirmacao(e.target.value)} />
          <button className="btn btn-primary" type="submit" style={{ justifyContent: 'center' }} disabled={enviando}>
            {enviando ? 'Salvando...' : 'Salvar nova senha'}
          </button>
        </form>

        <div className="auth-alt">
          <Link href="/auth/login">Cancelar</Link>
        </div>
      </div>
    </div>
  );
}
