/**
 * Página de finalização de compra (equivalente ao checkout.php).
 * Componente CLIENT: exige usuário logado, valida endereço e
 * pagamento fictício, cria o pedido no localStorage (simula os
 * INSERTs em pedidos/pedido_itens/rastreio) e vai para o rastreio.
 */
'use client';

import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';
import Icone from '@/components/Icone';
import { preco } from '@/lib/format';
import { getUsuario, getCarrinho, criarPedido, resumoCarrinho } from '@/lib/clientStore';
import { FRETE_GRATIS_ACIMA, FRETE_PADRAO } from '@/lib/config';
import { LIVROS } from '@/lib/mockData';

const FORMAS = [
  { chave: 'cartao', rotulo: 'Cartão', icone: 'cartao' },
  { chave: 'pix', rotulo: 'Pix', icone: 'raio' },
  { chave: 'boleto', rotulo: 'Boleto', icone: 'boleto' },
];

export default function Checkout() {
  const router = useRouter();
  const [usuario, setUsuario] = useState(null);
  const [resumo, setResumo] = useState({ itens: [], subtotal: 0, frete: 0, total: 0 });
  const [erros, setErros] = useState([]);
  const [enviando, setEnviando] = useState(false);

  const [form, setForm] = useState({
    endereco: '',
    cidade: '',
    uf: '',
    forma: 'cartao',
    cartao: '',
    validade: '',
    cvv: '',
    cpf: '',
  });

  useEffect(() => {
    const u = getUsuario();
    if (!u) {
      router.replace('/auth/login?proximo=/checkout');
      return;
    }
    setUsuario(u);
    setForm((f) => ({
      ...f,
      endereco: u.endereco || '',
      cidade: u.cidade || '',
      uf: u.uf || '',
    }));
    setResumo(resumoCarrinho(LIVROS));
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  function setCampo(nome, valor) {
    setForm((f) => ({ ...f, [nome]: valor }));
  }

  function finalizar(e) {
    e.preventDefault();

    const problemas = [];
    if (!form.endereco.trim()) problemas.push('Informe o endereço de entrega.');
    if (!form.cidade.trim()) problemas.push('Informe a cidade.');
    if (!/^[A-Za-z]{2}$/.test(form.uf)) problemas.push('Informe a UF (ex.: SP).');
    if (form.forma === 'cartao') {
      if (!/^\d{4}\s?\d{4}\s?\d{4}\s?\d{4}$/.test(form.cartao.trim())) problemas.push('Número do cartão inválido.');
      if (!/^(0[1-9]|1[0-2])\/\d{2}$/.test(form.validade.trim())) problemas.push('Validade inválida (MM/AA).');
    }
    if (form.forma === 'boleto') {
      if (form.cpf.replace(/\D/g, '').length !== 11) problemas.push('CPF inválido para boleto.');
    }
    if (problemas.length) {
      setErros(problemas);
      return;
    }

    setEnviando(true);
    // Simula o processamento do pedido (no PHP: INSERT no banco)
    setTimeout(() => {
      const pedido = criarPedido({
        usuario,
        itens: resumo.itens,
        subtotal: resumo.subtotal,
        frete: resumo.frete,
        total: resumo.total,
        endereco: form.endereco.trim(),
        cidade: form.cidade.trim(),
        uf: form.uf.trim().toUpperCase(),
        forma: form.forma,
      });
      window.dispatchEvent(new Event('carrinho-atualizado'));
      window.showToast?.('Pagamento aprovado! Pedido ' + pedido.codigo + ' confirmado.');
      router.push(`/rastreio?codigo=${encodeURIComponent(pedido.codigo)}`);
    }, 900);
  }

  if (!usuario) {
    return <div style={{ marginTop: 40, textAlign: 'center' }}>Redirecionando para o login...</div>;
  }

  if (resumo.itens.length === 0) {
    return (
      <div className="vazio" style={{ marginTop: 40 }}>
        <span className="icone"><Icone nome="carrinho" alt="Carrinho" tam={54} /></span>
        <h2>Seu carrinho está vazio</h2>
        <p>Adicione livros antes de finalizar a compra.</p>
        <Link className="btn btn-primary" href="/busca">Explorar catálogo</Link>
      </div>
    );
  }

  return (
    <>
      <h1 style={{ margin: '28px 0 20px' }}><Icone nome="cartao" alt="Pagamento" tam={22} /> Finalizar compra</h1>

      {erros.length > 0 && (
        <div className="toast toast-error">
          {erros.join(' / ')}
        </div>
      )}

      <div className="layout-2col">
        <form onSubmit={finalizar} id="formCheckout">
          {/* Endereço de entrega */}
          <div className="painel margem" style={{ marginTop: 0 }}>
            <h3 style={{ marginBottom: 16 }}><Icone nome="caminhao" alt="Entrega" tam={18} /> Endereço de entrega</h3>
            <div className="form-grid">
              <div className="campo">
                <label>Endereço (rua, número, complemento)</label>
                <input type="text" required value={form.endereco} onChange={(e) => setCampo('endereco', e.target.value)} placeholder="Rua das Letras, 123 - Apto 45" />
              </div>
              <div className="dupla">
                <div className="campo">
                  <label>Cidade</label>
                  <input type="text" required value={form.cidade} onChange={(e) => setCampo('cidade', e.target.value)} />
                </div>
                <div className="campo">
                  <label>UF</label>
                  <input type="text" required maxLength={2} value={form.uf} onChange={(e) => setCampo('uf', e.target.value.toUpperCase())} placeholder="SP" />
                </div>
              </div>
            </div>
          </div>

          {/* Pagamento */}
          <div className="painel margem">
            <h3 style={{ marginBottom: 16 }}>
              <Icone nome="cartao" alt="Pagamento" tam={18} /> Pagamento <small style={{ color: 'var(--muted)', fontWeight: 400 }}>(fictício)</small>
            </h3>
            <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap', marginBottom: 16 }}>
              {FORMAS.map((f) => (
                <label key={f.chave} className={`chip ${form.forma === f.chave ? 'ativo' : ''}`} style={{ cursor: 'pointer' }}>
                  <input
                    type="radio"
                    name="forma_pagamento"
                    value={f.chave}
                    checked={form.forma === f.chave}
                    onChange={() => setCampo('forma', f.chave)}
                    style={{ display: 'none' }}
                  />
                  <Icone nome={f.icone} alt={f.rotulo} tam={15} /> {f.rotulo}
                </label>
              ))}
            </div>

            {form.forma === 'cartao' && (
              <div className="form-grid" id="campoCartao">
                <div className="campo">
                  <label>Número do cartão</label>
                  <input
                    type="text"
                    placeholder="0000 0000 0000 0000"
                    maxLength={19}
                    value={form.cartao}
                    onChange={(e) =>
                      setCampo('cartao', e.target.value.replace(/\D/g, '').replace(/(\d{4})(?=\d)/g, '$1 ').slice(0, 19))
                    }
                  />
                </div>
                <div className="dupla" style={{ gap: 10 }}>
                  <div className="campo">
                    <label>Validade</label>
                    <input
                      type="text"
                      placeholder="MM/AA"
                      maxLength={5}
                      value={form.validade}
                      onChange={(e) =>
                        setCampo('validade', e.target.value.replace(/\D/g, '').replace(/(\d{2})(?=\d)/, '$1/').slice(0, 5))
                      }
                    />
                  </div>
                  <div className="campo">
                    <label>CVV</label>
                    <input type="text" placeholder="123" maxLength={4} value={form.cvv} onChange={(e) => setCampo('cvv', e.target.value.replace(/\D/g, '').slice(0, 4))} />
                  </div>
                </div>
              </div>
            )}

            {form.forma === 'boleto' && (
              <div className="form-grid" id="campoBoleto">
                <div className="campo">
                  <label>CPF do titular</label>
                  <input
                    type="text"
                    placeholder="000.000.000-00"
                    maxLength={14}
                    value={form.cpf}
                    onChange={(e) =>
                      setCampo('cpf', e.target.value.replace(/\D/g, '').replace(/(\d{3})(\d{3})(\d{3})(\d{2})/, '$1.$2.$3-$4').slice(0, 14))
                    }
                  />
                </div>
              </div>
            )}

            {form.forma === 'pix' && (
              <div className="form-grid" id="campoPix">
                <div className="painel" style={{ background: 'var(--success-soft)', borderColor: 'var(--success)', textAlign: 'center' }}>
                  <b style={{ color: 'var(--success)' }}>Pix gerado (fictício)</b>
                  <p style={{ fontSize: 13, marginTop: 4 }}>
                    Código: <b>PIX-{Math.random().toString(36).slice(2, 10).toUpperCase()}</b>
                  </p>
                </div>
              </div>
            )}

            <p style={{ fontSize: 12.5, color: 'var(--muted)', marginTop: 14 }}>
              <Icone nome="cadeado" alt="Seguro" tam={14} /> Ambiente de demonstração — nenhum pagamento real é processado.
            </p>
          </div>

          <button className="btn btn-success" type="submit" style={{ width: '100%', justifyContent: 'center', marginTop: 18, padding: 14 }} disabled={enviando}>
            {enviando ? 'Processando pagamento...' : `Confirmar pagamento de ${preco(resumo.total)} → Acompanhar entrega`}
          </button>
        </form>

        {/* Resumo do pedido */}
        <aside className="painel resumo-carrinho">
          <h3 style={{ marginBottom: 12 }}><Icone nome="pacote" alt="Pedido" tam={17} /> Resumo do pedido</h3>
          {resumo.itens.map((i) => (
            <div key={i.livro.id} style={{ display: 'flex', justifyContent: 'space-between', gap: 10, fontSize: 13.5, padding: '6px 0', borderBottom: '1px dashed var(--line)' }}>
              <span>{i.quantidade}× {i.livro.titulo}</span>
              <b>{preco(i.livro.preco * i.quantidade)}</b>
            </div>
          ))}
          <div className="linha-resumo"><span>Subtotal</span><span>{preco(resumo.subtotal)}</span></div>
          <div className="linha-resumo">
            <span>Frete</span>
            <span>{resumo.frete === 0 ? <>Grátis <Icone nome="confete" alt="Festa" tam={15} /></> : preco(resumo.frete)}</span>
          </div>
          <div className="linha-resumo total"><span>Total</span><span>{preco(resumo.total)}</span></div>
          <p style={{ fontSize: 12, color: 'var(--muted)', marginTop: 10 }}>
            Frete grátis para compras acima de {preco(FRETE_GRATIS_ACIMA)} (padrão: {preco(FRETE_PADRAO)}).
          </p>
        </aside>
      </div>
    </>
  );
}