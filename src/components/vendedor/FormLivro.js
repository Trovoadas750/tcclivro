/**
 * Formulário de cadastro/edição de livro do vendedor (mesma tela para os dois).
 *
 * Obrigatórios: 2 fotos (capa e contracapa), título, autor, ano de
 * lançamento, categoria, preço e estoque. Opcional: sinopse (descrição).
 *
 * Fluxo de gravação:
 *   1. Envia as fotos novas para o Storage (bucket livros-fotos).
 *   2. Insere/atualiza o livro com fotos[] e capa_url = 1ª foto.
 *   3. Se o passo 2 falhar, apaga as fotos recém-enviadas.
 *   4. Na edição, apaga do Storage as fotos que foram substituídas.
 * Nunca envia id nem vendedor_id (o banco preenche).
 */
'use client';

import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useEffect, useRef, useState } from 'react';
import Icone from '@/components/Icone';
import { CATEGORIAS } from '@/lib/mockData';
import {
  ANO_ATUAL,
  TAMANHO_MAX_FOTO,
  apagarFotos,
  enviarFoto,
  fotosDoLivro,
  mensagemErroVendedor,
  numeroParaPreco,
  precoParaNumero,
} from '@/lib/vendedor';

const SLOTS = [
  { rotulo: 'Foto 1 — Capa (frente)', dica: 'Aparece na vitrine' },
  { rotulo: 'Foto 2 — Contracapa ou miolo', dica: 'Mostra o estado do livro' },
];
const TIPOS_ACEITOS = ['image/jpeg', 'image/png', 'image/webp'];

/** Um slot de foto: { url } (já salva) ou { arquivo, preview } (nova). */
function SlotFoto({ indice, foto, onEscolher, onRemover, desabilitado }) {
  const inputRef = useRef(null);
  const slot = SLOTS[indice];
  const src = foto?.preview || foto?.url;

  return (
    <div className={`foto-slot ${src ? 'preenchido' : ''}`}>
      <span className="foto-rotulo">{slot.rotulo} *</span>
      <button
        type="button"
        className="foto-area"
        onClick={() => inputRef.current?.click()}
        disabled={desabilitado}
        aria-label={src ? `Trocar ${slot.rotulo}` : `Escolher ${slot.rotulo}`}
      >
        {src ? (
          <img src={src} alt={slot.rotulo} />
        ) : (
          <span className="foto-vazia">
            <Icone nome="novo" alt="" tam={30} />
            <b>Adicionar foto</b>
            <small>{slot.dica}</small>
          </span>
        )}
      </button>
      <input
        ref={inputRef}
        type="file"
        accept={TIPOS_ACEITOS.join(',')}
        hidden
        onChange={(e) => {
          const arquivo = e.target.files?.[0];
          e.target.value = ''; // permite escolher o mesmo arquivo de novo
          if (arquivo) onEscolher(indice, arquivo);
        }}
      />
      {src && (
        <div className="foto-acoes">
          <button type="button" className="btn btn-ghost btn-sm" onClick={() => inputRef.current?.click()} disabled={desabilitado}>Trocar</button>
          <button type="button" className="btn btn-ghost btn-sm" onClick={() => onRemover(indice)} disabled={desabilitado}>Remover</button>
        </div>
      )}
    </div>
  );
}

export default function FormLivro({ supabase, usuario, livro = null }) {
  const router = useRouter();
  const editando = Boolean(livro);
  const fotosIniciais = fotosDoLivro(livro);

  const [fotos, setFotos] = useState(() => [0, 1].map((i) => (fotosIniciais[i] ? { url: fotosIniciais[i] } : null)));
  const [titulo, setTitulo] = useState(livro?.titulo || '');
  const [autor, setAutor] = useState(livro?.autor || '');
  const [ano, setAno] = useState(livro?.ano_lancamento ? String(livro.ano_lancamento) : '');
  const [categoria, setCategoria] = useState(livro?.categoria || '');
  const [precoTexto, setPrecoTexto] = useState(numeroParaPreco(livro?.preco));
  const [estoque, setEstoque] = useState(livro ? String(livro.estoque ?? 0) : '1');
  const [sinopse, setSinopse] = useState(livro?.sinopse || '');
  const [erro, setErro] = useState(null);
  const [salvando, setSalvando] = useState(false);
  const [etapa, setEtapa] = useState('');

  // Libera da memória as pré-visualizações (blob:) ao sair da tela.
  const fotosRef = useRef(fotos);
  fotosRef.current = fotos;
  useEffect(() => () => fotosRef.current.forEach((f) => f?.preview && URL.revokeObjectURL(f.preview)), []);

  // Categoria salva que não está na lista padrão continua selecionável.
  const opcoesCategoria = CATEGORIAS.map((c) => c.nome);
  if (categoria && !opcoesCategoria.includes(categoria)) opcoesCategoria.push(categoria);

  function escolherFoto(indice, arquivo) {
    setErro(null);
    if (!TIPOS_ACEITOS.includes(arquivo.type)) {
      setErro('Formato de imagem não aceito. Use JPG, PNG ou WEBP.');
      return;
    }
    if (arquivo.size > TAMANHO_MAX_FOTO) {
      setErro('Cada foto pode ter no máximo 10 MB.');
      return;
    }
    setFotos((atual) => {
      const novo = [...atual];
      if (novo[indice]?.preview) URL.revokeObjectURL(novo[indice].preview);
      novo[indice] = { arquivo, preview: URL.createObjectURL(arquivo) };
      return novo;
    });
  }

  function removerFoto(indice) {
    setFotos((atual) => {
      const novo = [...atual];
      if (novo[indice]?.preview) URL.revokeObjectURL(novo[indice].preview);
      novo[indice] = null;
      return novo;
    });
  }

  function validar() {
    if (fotos.some((f) => !f)) return 'Adicione as 2 fotos do livro (capa e contracapa).';
    if (titulo.trim().length < 1) return 'Informe o nome do livro.';
    if (autor.trim().length < 1) return 'Informe o autor.';
    const anoNum = Number(ano);
    if (!/^\d{4}$/.test(ano.trim()) || anoNum < 1000 || anoNum > ANO_ATUAL) {
      return `Informe um ano de lançamento válido (até ${ANO_ATUAL}).`;
    }
    if (!categoria) return 'Escolha a categoria.';
    const valor = precoParaNumero(precoTexto);
    if (Number.isNaN(valor)) return 'Preço inválido. Use o formato 29,90.';
    if (valor <= 0) return 'O preço deve ser maior que zero.';
    if (valor > 99999999) return 'Preço muito alto.';
    if (!/^\d+$/.test(estoque.trim())) return 'O estoque deve ser um número inteiro (0 ou mais).';
    return null;
  }

  async function salvar(e) {
    e.preventDefault();
    setErro(null);
    const problema = validar();
    if (problema) {
      setErro(problema);
      return;
    }

    setSalvando(true);
    const enviadasAgora = [];
    try {
      // 1) Upload das fotos novas
      setEtapa('Enviando fotos...');
      const urls = [];
      for (const foto of fotos) {
        if (foto.arquivo) {
          const { url, caminho } = await enviarFoto(supabase, usuario.id, foto.arquivo);
          enviadasAgora.push(caminho);
          urls.push(url);
        } else {
          urls.push(foto.url);
        }
      }

      // 2) Grava o livro
      setEtapa('Salvando livro...');
      const dados = {
        titulo: titulo.trim(),
        autor: autor.trim(),
        ano_lancamento: Number(ano),
        categoria,
        sinopse: sinopse.trim() || null,
        preco: precoParaNumero(precoTexto),
        estoque: Number(estoque),
        fotos: urls,
        capa_url: urls[0],
      };

      const { data, error } = editando
        ? await supabase.from('livros').update(dados).eq('id', livro.id).select()
        : await supabase.from('livros').insert(dados).select();

      if (error) throw error;
      if (!data || data.length === 0) {
        throw Object.assign(new Error('rls'), { amigavel: 'Você não pode alterar este livro.' });
      }

      // 3) Edição: remove do Storage as fotos substituídas
      if (editando) {
        const substituidas = fotosIniciais.filter((u) => !urls.includes(u));
        await apagarFotos(supabase, substituidas);
      }

      window.showToast?.(editando ? 'Livro atualizado com sucesso!' : 'Livro cadastrado com sucesso!');
      router.push('/painel-vendedor');
      router.refresh();
    } catch (err) {
      await apagarFotos(supabase, enviadasAgora);
      console.error('Erro ao salvar livro:', err);
      setErro(err?.amigavel || mensagemErroVendedor(err, 'Não foi possível salvar o livro. Tente novamente.'));
      setSalvando(false);
      setEtapa('');
    }
  }

  return (
    <form onSubmit={salvar} className="form-grid painel" noValidate>
      {erro && <div className="toast toast-error" role="alert">{erro}</div>}

      <fieldset className="grupo-form">
        <legend>Fotos do livro <small>(2 obrigatórias)</small></legend>
        <div className="fotos-grid">
          {[0, 1].map((i) => (
            <SlotFoto key={i} indice={i} foto={fotos[i]} onEscolher={escolherFoto} onRemover={removerFoto} desabilitado={salvando} />
          ))}
        </div>
        <small className="ajuda">JPG, PNG ou WEBP, até 10 MB cada. As fotos são reduzidas automaticamente.</small>
      </fieldset>

      <fieldset className="grupo-form" disabled={salvando}>
        <legend>Informações</legend>
        <div className="form-grid">
          <div className="campo">
            <label htmlFor="livro-titulo">Nome do livro *</label>
            <input id="livro-titulo" type="text" required maxLength={180} value={titulo} onChange={(e) => setTitulo(e.target.value)} />
          </div>
          <div className="dupla">
            <div className="campo">
              <label htmlFor="livro-autor">Autor *</label>
              <input id="livro-autor" type="text" required maxLength={120} value={autor} onChange={(e) => setAutor(e.target.value)} />
            </div>
            <div className="campo">
              <label htmlFor="livro-ano">Ano de lançamento *</label>
              <input id="livro-ano" type="number" required inputMode="numeric" min={1000} max={ANO_ATUAL} step={1} placeholder={String(ANO_ATUAL)} value={ano} onChange={(e) => setAno(e.target.value)} />
            </div>
          </div>
          <div className="campo">
            <label htmlFor="livro-categoria">Categoria *</label>
            <select id="livro-categoria" required value={categoria} onChange={(e) => setCategoria(e.target.value)}>
              <option value="">Selecione...</option>
              {opcoesCategoria.map((nome) => (
                <option key={nome} value={nome}>{nome}</option>
              ))}
            </select>
          </div>
          <div className="dupla">
            <div className="campo">
              <label htmlFor="livro-preco">Preço (R$) *</label>
              <input id="livro-preco" type="text" required inputMode="decimal" placeholder="29,90" value={precoTexto} onChange={(e) => setPrecoTexto(e.target.value)} />
            </div>
            <div className="campo">
              <label htmlFor="livro-estoque">Estoque *</label>
              <input id="livro-estoque" type="number" required inputMode="numeric" min={0} step={1} value={estoque} onChange={(e) => setEstoque(e.target.value)} />
            </div>
          </div>
          <div className="campo">
            <label htmlFor="livro-sinopse">Descrição / sinopse (opcional)</label>
            <textarea id="livro-sinopse" rows={5} maxLength={3000} value={sinopse} onChange={(e) => setSinopse(e.target.value)} placeholder="Fale sobre o livro, edição e estado de conservação" />
          </div>
        </div>
      </fieldset>

      <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap', alignItems: 'center' }}>
        <button className="btn btn-accent" type="submit" disabled={salvando}>
          {salvando ? etapa || 'Salvando...' : editando ? 'Salvar alterações' : 'Cadastrar livro'}
        </button>
        <Link className="btn btn-ghost" href="/painel-vendedor" aria-disabled={salvando}>Cancelar</Link>
      </div>
    </form>
  );
}
