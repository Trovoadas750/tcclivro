/**
 * Formulário de cadastro/edição de livro do vendedor (mesma tela para os dois).
 *
 * Obrigatórios: 2 fotos (capa e contracapa), título, autor, ano de
 * lançamento, categoria, preço e estoque. Opcionais: ISBN e sinopse (descrição).
 * A categoria é texto livre, com sugestões de categorias_disponiveis().
 *
 * Fluxo de gravação:
 *   1. Envia as fotos novas para o Storage (bucket livros, pasta do vendedor).
 *   2. Insere/atualiza o livro com foto_1_url e foto_2_url.
 *   3. Se o passo 2 falhar, apaga as fotos recém-enviadas.
 *   4. Na edição, apaga do Storage as fotos que foram substituídas.
 * Nunca envia id, vendedor_id nem busca (o banco preenche).
 */
'use client';

import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useEffect, useRef, useState } from 'react';
import Icone from '@/components/Icone';
import {
  ANO_ATUAL,
  ANO_MINIMO,
  TAMANHO_MAX_FOTO,
  apagarFotos,
  enviarFoto,
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
  // Posição fixa: [0] = foto_1_url (principal), [1] = foto_2_url.
  const fotosIniciais = [livro?.foto_1_url || null, livro?.foto_2_url || null];

  const [fotos, setFotos] = useState(() => fotosIniciais.map((url) => (url ? { url } : null)));
  const [titulo, setTitulo] = useState(livro?.titulo || '');
  const [autor, setAutor] = useState(livro?.autor || '');
  const [ano, setAno] = useState(livro?.ano_lancamento ? String(livro.ano_lancamento) : '');
  const [categoria, setCategoria] = useState(livro?.categoria || '');
  const [precoTexto, setPrecoTexto] = useState(numeroParaPreco(livro?.preco));
  const [estoque, setEstoque] = useState(livro ? String(livro.estoque ?? 0) : '1');
  const [sinopse, setSinopse] = useState(livro?.sinopse || '');
  const [isbn, setIsbn] = useState(livro?.isbn || '');
  const [sugestoesCategoria, setSugestoesCategoria] = useState([]);
  const [erro, setErro] = useState(null);
  const [salvando, setSalvando] = useState(false);
  const [etapa, setEtapa] = useState('');

  // Libera da memória as pré-visualizações (blob:) ao sair da tela.
  const fotosRef = useRef(fotos);
  fotosRef.current = fotos;
  useEffect(() => () => fotosRef.current.forEach((f) => f?.preview && URL.revokeObjectURL(f.preview)), []);

  // Sugestões de categoria: as que já têm livros no catálogo. A categoria é
  // texto livre, então o vendedor pode digitar outra.
  useEffect(() => {
    let ativo = true;
    supabase.rpc('categorias_disponiveis').then(({ data, error }) => {
      if (!ativo) return;
      if (error) {
        console.error('Erro ao carregar categorias:', error);
        return;
      }
      setSugestoesCategoria((data || []).map((c) => c.categoria).filter(Boolean));
    });
    return () => { ativo = false; };
  }, [supabase]);

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
    if (!/^\d{4}$/.test(ano.trim()) || anoNum < ANO_MINIMO || anoNum > ANO_ATUAL) {
      return `Informe um ano de lançamento válido (entre ${ANO_MINIMO} e ${ANO_ATUAL}).`;
    }
    if (!categoria.trim()) return 'Informe a categoria.';
    if (isbn.trim() && !/^[0-9Xx-]{10,17}$/.test(isbn.trim())) return 'ISBN inválido. Use só números (10 ou 13 dígitos).';
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
        categoria: categoria.trim(),
        isbn: isbn.trim() || null,
        sinopse: sinopse.trim() || null,
        preco: precoParaNumero(precoTexto),
        estoque: Number(estoque),
        foto_1_url: urls[0],
        foto_2_url: urls[1],
      };

      const { data, error } = editando
        ? await supabase.from('livros').update(dados).eq('id', livro.id).select('id')
        : await supabase.from('livros').insert(dados).select('id');

      if (error) throw error;
      if (!data || data.length === 0) {
        throw Object.assign(new Error('rls'), { amigavel: 'Você não pode alterar este livro.' });
      }

      // 3) Edição: remove do Storage as fotos substituídas
      if (editando) {
        const substituidas = fotosIniciais.filter((u) => u && !urls.includes(u));
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
              <input id="livro-ano" type="number" required inputMode="numeric" min={ANO_MINIMO} max={ANO_ATUAL} step={1} placeholder={String(ANO_ATUAL)} value={ano} onChange={(e) => setAno(e.target.value)} />
            </div>
          </div>
          <div className="dupla">
            <div className="campo">
              <label htmlFor="livro-categoria">Categoria *</label>
              <input
                id="livro-categoria"
                type="text"
                required
                maxLength={60}
                list="livro-categorias-sugeridas"
                placeholder="Escolha ou digite (ex.: Fantasia)"
                value={categoria}
                onChange={(e) => setCategoria(e.target.value)}
              />
              <datalist id="livro-categorias-sugeridas">
                {sugestoesCategoria.map((nome) => (
                  <option key={nome} value={nome} />
                ))}
              </datalist>
            </div>
            <div className="campo">
              <label htmlFor="livro-isbn">ISBN (opcional)</label>
              <input id="livro-isbn" type="text" inputMode="numeric" maxLength={17} placeholder="978..." value={isbn} onChange={(e) => setIsbn(e.target.value)} />
            </div>
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
