/**
 * Cadastro de VENDEDOR ("Tornar-se vendedor").
 * Formulário próprio, separado do cadastro de cliente: o tipo da conta
 * não é escolhido pelo usuário, ele é fixado como 'vendedor' aqui e
 * enviado em options.data.tipo do signUp (o trigger cria o perfil).
 *
 * O nome e a descrição da loja vão nos metadados e a loja é criada
 * automaticamente no primeiro acesso ao painel (ver src/lib/useVendedor.js).
 */
'use client';

import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';
import Icone from '@/components/Icone';
import CampoSenha from '@/components/CampoSenha';
import { cadastrar } from '@/app/auth/actions';
import { createClient } from '@/lib/supabase/client';
import { limparCachePerfil } from '@/lib/perfilStore';

const VANTAGENS = [
  { icone: 'livros', titulo: 'Sua vitrine', texto: 'Crie sua loja e publique quantos livros quiser.' },
  { icone: 'dinheiro', titulo: 'Sem mensalidade', texto: 'Cadastro gratuito para vender na Casa do Leitor.' },
  { icone: 'alvo', titulo: 'Controle total', texto: 'Edite, pause ou remova seus anúncios quando quiser.' },
];

export default function CadastroVendedor() {
  const router = useRouter();
  const [supabase] = useState(() => createClient());
  const [contaAtual, setContaAtual] = useState({ carregando: true, tipo: null, email: null });

  const [nome, setNome] = useState('');
  const [nomeLoja, setNomeLoja] = useState('');
  const [descricaoLoja, setDescricaoLoja] = useState('');
  const [email, setEmail] = useState('');
  const [senha, setSenha] = useState('');
  const [confirmacao, setConfirmacao] = useState('');
  const [erro, setErro] = useState(null);
  const [enviando, setEnviando] = useState(false);
  const [cadastroEnviado, setCadastroEnviado] = useState(false);

  // Quem já está logado: vendedor vai direto ao painel; cliente recebe aviso.
  useEffect(() => {
    let ativo = true;
    (async () => {
      const { data: { session } } = await supabase.auth.getSession();
      const user = session?.user;
      if (!user) {
        if (ativo) setContaAtual({ carregando: false, tipo: null, email: null });
        return;
      }
      const { data: perfil } = await supabase.from('profiles').select('tipo').eq('id', user.id).maybeSingle();
      if (!ativo) return;
      if (perfil?.tipo === 'vendedor') {
        router.replace('/painel-vendedor');
        return;
      }
      setContaAtual({ carregando: false, tipo: 'cliente', email: user.email });
    })();
    return () => { ativo = false; };
  }, [supabase, router]);

  async function sair() {
    await supabase.auth.signOut();
    limparCachePerfil();
    window.dispatchEvent(new Event('usuario-atualizado'));
    setContaAtual({ carregando: false, tipo: null, email: null });
    router.refresh();
  }

  async function handleSubmit(e) {
    e.preventDefault();
    setErro(null);

    if (nome.trim().length < 2) return setErro('Informe o nome do responsável.');
    if (nomeLoja.trim().length < 2) return setErro('Informe o nome da sua loja.');
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim())) return setErro('E-mail inválido.');
    if (senha.length < 6) return setErro('A senha deve ter ao menos 6 caracteres.');
    if (senha !== confirmacao) return setErro('As senhas não coincidem.');

    setEnviando(true);
    const resultado = await cadastrar({
      nome: nome.trim(),
      email: email.trim(),
      senha,
      tipo: 'vendedor',
      loja: { nome_loja: nomeLoja.trim(), descricao: descricaoLoja.trim() },
    });
    setEnviando(false);

    if (resultado?.erro) {
      setErro(resultado.erro);
      return;
    }

    if (resultado.confirmado) {
      window.dispatchEvent(new Event('usuario-atualizado'));
      window.showToast?.('Conta de vendedor criada! Vamos montar sua loja.');
      router.push('/painel-vendedor');
      router.refresh();
      return;
    }

    setCadastroEnviado(true);
  }

  if (contaAtual.carregando) {
    return <div style={{ marginTop: 40, textAlign: 'center' }}>Carregando...</div>;
  }

  if (cadastroEnviado) {
    return (
      <div className="auth-wrap">
        <div className="painel auth-card">
          <span style={{ display: 'inline-block' }}><Icone nome="info" alt="Confirme seu e-mail" tam={44} /></span>
          <h1>Confirme seu e-mail</h1>
          <p className="sub">
            Enviamos um link de confirmação para <b>{email.trim()}</b>. Depois de confirmar,
            entre com sua conta: sua loja <b>{nomeLoja.trim()}</b> será criada no primeiro acesso ao painel.
          </p>
          <div className="auth-alt">
            Já confirmou? <Link href="/auth/login?proximo=/painel-vendedor">Entrar no painel</Link>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="vendedor-cadastro">
      <section className="vendedor-intro">
        <span className="selo-vendedor">Para vendedores</span>
        <h1>Venda seus livros na Casa do Leitor</h1>
        <p>Abra sua loja em poucos minutos e alcance leitores de todo o Brasil.</p>
        <ul className="vantagens">
          {VANTAGENS.map((v) => (
            <li key={v.titulo}>
              <Icone nome={v.icone} alt="" tam={26} />
              <div><b>{v.titulo}</b><span>{v.texto}</span></div>
            </li>
          ))}
        </ul>
      </section>

      <div className="painel vendedor-form">
        {contaAtual.tipo === 'cliente' ? (
          <div className="auth-card">
            <span style={{ display: 'inline-block' }}><Icone nome="info" alt="" tam={40} /></span>
            <h2 style={{ margin: '8px 0' }}>Você está conectado como cliente</h2>
            <p className="sub">
              A conta <b>{contaAtual.email}</b> é de cliente, e o tipo de uma conta não pode ser alterado.
              Para vender, saia e crie uma conta de vendedor com outro e-mail.
            </p>
            <div style={{ display: 'flex', gap: 10, justifyContent: 'center', flexWrap: 'wrap' }}>
              <button className="btn btn-accent" type="button" onClick={sair}>Sair e criar conta de vendedor</button>
              <Link className="btn btn-ghost" href="/">Voltar ao início</Link>
            </div>
          </div>
        ) : (
          <>
            <h2 style={{ marginBottom: 4 }}>Criar conta de vendedor</h2>
            <p style={{ color: 'var(--muted)', marginBottom: 18, fontSize: 14 }}>Preencha os dados da sua loja e do responsável.</p>

            {erro && <div className="toast toast-error">{erro}</div>}

            <form onSubmit={handleSubmit} className="form-grid">
              <div className="campo">
                <label htmlFor="nome-loja">Nome da loja *</label>
                <input type="text" id="nome-loja" required maxLength={80} autoFocus value={nomeLoja} onChange={(e) => setNomeLoja(e.target.value)} placeholder="Ex.: Sebo da Esquina" />
              </div>
              <div className="campo">
                <label htmlFor="descricao-loja">Descrição da loja (opcional)</label>
                <textarea id="descricao-loja" rows={3} maxLength={500} value={descricaoLoja} onChange={(e) => setDescricaoLoja(e.target.value)} placeholder="Conte o que sua loja vende" />
              </div>
              <div className="campo">
                <label htmlFor="nome">Nome do responsável *</label>
                <input type="text" id="nome" required autoComplete="name" value={nome} onChange={(e) => setNome(e.target.value)} />
              </div>
              <div className="campo">
                <label htmlFor="email">E-mail *</label>
                <input type="email" id="email" required autoComplete="email" value={email} onChange={(e) => setEmail(e.target.value)} />
              </div>
              <div className="dupla">
                <CampoSenha id="senha" label="Senha *" required minLength={6} autoComplete="new-password" value={senha} onChange={(e) => setSenha(e.target.value)} />
                <CampoSenha id="confirmacao" label="Confirmar senha *" required minLength={6} autoComplete="new-password" value={confirmacao} onChange={(e) => setConfirmacao(e.target.value)} />
              </div>
              <button className="btn btn-accent" type="submit" style={{ justifyContent: 'center' }} disabled={enviando}>
                {enviando ? 'Criando conta...' : 'Criar conta de vendedor'}
              </button>
            </form>

            <div className="auth-alt" style={{ textAlign: 'center' }}>
              Já é vendedor? <Link href="/auth/login?proximo=/painel-vendedor">Entrar</Link>
              <br />
              Quer só comprar? <Link href="/auth/registro">Criar conta de cliente</Link>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
