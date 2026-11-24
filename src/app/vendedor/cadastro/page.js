/**
 * "Tornar-se vendedor" (/vendedor/cadastro) — migração de conta.
 *
 * Existe um único cadastro e toda conta nasce cliente. Aqui o cliente
 * logado abre a loja: rpc('tornar_vendedor', { p_nome_loja, p_descricao })
 * muda a conta para vendedor E cria a loja numa etapa só (tudo ou nada).
 *
 *   - Deslogado → vantagens + "Criar conta" / "Entrar" (voltam para cá).
 *   - Cliente   → formulário "Abrir minha loja".
 *   - Vendedor  → redireciona para /painel-vendedor.
 */
'use client';

import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useEffect } from 'react';
import Icone from '@/components/Icone';
import FormLoja from '@/components/vendedor/FormLoja';
import { limparCachePerfil } from '@/lib/perfilStore';
import { comProximo } from '@/lib/redirecionamento';
import { useTipoConta } from '@/lib/useTipoConta';

const ESTA_PAGINA = '/vendedor/cadastro';

const VANTAGENS = [
  { icone: 'livros', titulo: 'Sua vitrine', texto: 'Abra sua loja e publique quantos livros quiser, com fotos.' },
  { icone: 'dinheiro', titulo: 'Sem mensalidade', texto: 'Vender na Casa do Leitor é gratuito.' },
  { icone: 'alvo', titulo: 'Controle total', texto: 'Edite, pause ou remova seus anúncios quando quiser.' },
  { icone: 'faiscas', titulo: 'Indicados pela IA', texto: 'Seus livros entram nas recomendações da nossa IA.' },
];

export default function TornarSeVendedor() {
  const router = useRouter();
  const { carregando, usuario, tipo, supabase } = useTipoConta();

  // Quem já é vendedor não tem o que fazer aqui.
  useEffect(() => {
    if (tipo === 'vendedor') router.replace('/painel-vendedor');
  }, [tipo, router]);

  async function abrirLoja({ nome_loja, descricao }) {
    const { error } = await supabase.rpc('tornar_vendedor', {
      p_nome_loja: nome_loja,
      p_descricao: descricao || null,
    });

    if (error) {
      console.error('Erro em tornar_vendedor:', error);
      // Erros de regra vêm com code P0001 e mensagem pronta em português.
      return { erro: error.code === 'P0001' ? error.message : 'Não foi possível abrir sua loja. Tente de novo.' };
    }

    // O tipo da conta mudou: atualiza cabeçalho/menus e descarta o cache do perfil.
    limparCachePerfil();
    window.dispatchEvent(new Event('usuario-atualizado'));
    window.showToast?.('Sua loja está aberta! Cadastre seu primeiro livro.');
    router.push('/painel-vendedor');
    router.refresh();
    return { ok: true, manterBloqueado: true };
  }

  if (carregando || tipo === 'vendedor') {
    return <div style={{ marginTop: 40, textAlign: 'center' }}>Carregando...</div>;
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
        {usuario ? (
          <>
            <h2 style={{ marginBottom: 4 }}>Abrir minha loja</h2>
            <p style={{ color: 'var(--muted)', marginBottom: 18, fontSize: 14 }}>
              Sua conta <b>{usuario.email}</b> passa a ser de vendedor e a loja é criada na hora.
              O nome da loja aparece para os leitores na vitrine.
            </p>
            <FormLoja onSalvar={abrirLoja} rotuloBotao="Abrir minha loja" rotuloEnviando="Abrindo sua loja..." />
          </>
        ) : (
          <div className="auth-card">
            <span style={{ display: 'inline-block' }}><Icone nome="usuario" alt="" tam={40} /></span>
            <h2 style={{ margin: '8px 0' }}>Entre para abrir sua loja</h2>
            <p className="sub">
              Para vender, use sua conta da Casa do Leitor. Ainda não tem uma? Crie grátis em menos de um minuto
              e volte para esta página para abrir a loja.
            </p>
            <div style={{ display: 'flex', gap: 10, justifyContent: 'center', flexWrap: 'wrap' }}>
              <Link className="btn btn-accent" href={comProximo('/auth/registro', ESTA_PAGINA)}>Criar conta</Link>
              <Link className="btn btn-ghost" href={comProximo('/auth/login', ESTA_PAGINA)}>Entrar</Link>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
