/**
 * POST /api/recomendar — recomendação de livros (roda só no servidor).
 *
 * Corpo: { pedido: string } com 3 a 300 caracteres.
 * Resposta 200: { modo: 'ia' | 'local', mensagem, livros: [{ id, titulo, autor,
 *   preco, estoque, foto_1_url, foto_2_url, vendedor_id, lojas: { nome_loja }, motivo }] }
 * Erros (sempre { erro } amigável, nunca o erro bruto):
 *   400 pedido inválido · 429 muitos pedidos · 503 banco indisponível
 *
 * MODO IA: provedor gratuito (src/lib/ia.js). MODO LOCAL: busca do banco +
 * dicionário de categorias, usado sozinho quando não há chave, a cota acaba,
 * o provedor demora/falha ou a resposta vem num formato inválido.
 * Fluxo e regras: src/lib/motorRecomendacao.js e BDcontexto.md (Parte C).
 */
import { createClient } from '@/lib/supabase/server';
import {
  buscarCandidatosIA,
  buscarCategorias,
  buscarLivrosPorIds,
  buscarRecentesParaIA,
} from '@/lib/repositories/livroRepository';
import { iaConfigurada } from '@/lib/ia';
import { analisarPedidoLocal, normalizarTexto } from '@/lib/dicionario-categorias';
import {
  MAX_CANDIDATOS,
  MAX_RECOMENDACOES,
  entenderComIA,
  escolherComIA,
  escolherLocal,
  priorizarCitados,
} from '@/lib/motorRecomendacao';

// Até duas chamadas de 12 s ao provedor + consultas ao banco.
export const maxDuration = 45;

const MIN_PEDIDO = 3;
const MAX_PEDIDO = 300;
const DEZ_MINUTOS = 10 * 60 * 1000;

/* ------------------------------------------------------------------ *
 *  Limite por IP (10 pedidos a cada 10 minutos) e cache das respostas
 *  da IA (10 minutos). Os dois em memória: servem para o beta, reiniciam
 *  a cada deploy e não são compartilhados entre instâncias da Vercel.
 * ------------------------------------------------------------------ */
const LIMITE_PEDIDOS = 10;
const pedidosPorIp = new Map(); // ip → [timestamps]
const cacheRespostas = new Map(); // pedido normalizado → { em, modo, mensagem, escolhas }

function ipDaRequisicao(request) {
  const encaminhado = request.headers.get('x-forwarded-for');
  if (encaminhado) return encaminhado.split(',')[0].trim();
  return request.headers.get('x-real-ip') || 'desconhecido';
}

/** Registra o pedido e diz se o IP passou do limite. */
function passouDoLimite(ip) {
  const agora = Date.now();
  const recentes = (pedidosPorIp.get(ip) || []).filter((t) => agora - t < DEZ_MINUTOS);
  const passou = recentes.length >= LIMITE_PEDIDOS;
  if (!passou) recentes.push(agora);
  pedidosPorIp.set(ip, recentes);

  // Limpeza ocasional para os mapas não crescerem sem fim.
  if (pedidosPorIp.size > 5000) {
    for (const [chave, tempos] of pedidosPorIp) if (!tempos.some((t) => agora - t < DEZ_MINUTOS)) pedidosPorIp.delete(chave);
  }
  if (cacheRespostas.size > 500) {
    for (const [chave, item] of cacheRespostas) if (agora - item.em >= DEZ_MINUTOS) cacheRespostas.delete(chave);
  }
  return passou;
}

function erro(status, mensagem) {
  return Response.json({ erro: mensagem }, { status });
}

function avisoModoLocal(etapa, e) {
  // Só no log do servidor: o usuário nunca vê o erro bruto.
  console.warn(`[IA] ${etapa}: usando o modo local (${e?.message || e})`);
}

/**
 * Monta a resposta com os dados ATUAIS do banco (preço, estoque, foto, loja),
 * na ordem escolhida. Também é usada para respostas do cache, que guardam
 * só a escolha (ids e motivos), nunca preço ou estoque.
 */
async function montarResposta(supabase, { modo, mensagem, escolhas }) {
  if (escolhas.length === 0) return Response.json({ modo, mensagem, livros: [] });
  const livrosBanco = await buscarLivrosPorIds(supabase, escolhas.map((s) => s.id));
  if (livrosBanco === null) return erro(503, 'A recomendação está indisponível no momento.');
  const porId = new Map(livrosBanco.map((l) => [l.id, l]));
  const livros = escolhas.filter((s) => porId.has(s.id)).map((s) => ({ ...porId.get(s.id), motivo: s.motivo }));
  return Response.json({ modo, mensagem, livros });
}

export async function POST(request) {
  // 1) Validar a entrada + limite por IP
  let pedido = '';
  try {
    const corpo = await request.json();
    pedido = String(corpo?.pedido ?? '').replace(/\s+/g, ' ').trim();
  } catch {
    return erro(400, 'Envie o pedido no formato { "pedido": "..." }.');
  }
  if (pedido.length < MIN_PEDIDO || pedido.length > MAX_PEDIDO) {
    return erro(400, `Descreva o que você quer ler em ${MIN_PEDIDO} a ${MAX_PEDIDO} caracteres.`);
  }
  if (passouDoLimite(ipDaRequisicao(request))) {
    return erro(429, 'Muitos pedidos seguidos. Tente de novo em alguns minutos.');
  }

  try {
    const supabase = await createClient();

    // 2) Cache: mesmo pedido respondido pela IA há menos de 10 minutos
    const chaveCache = normalizarTexto(pedido);
    const emCache = cacheRespostas.get(chaveCache);
    if (emCache && Date.now() - emCache.em < DEZ_MINUTOS) {
      return montarResposta(supabase, emCache);
    }

    // 3) Categorias reais do catálogo
    const categorias = (await buscarCategorias(supabase)).map((c) => c.categoria);

    // 4) Entender o pedido: modo IA (chamada 1) ou modo local (dicionário)
    let usarIA = iaConfigurada();
    let analise;
    if (usarIA) {
      try {
        analise = await entenderComIA(pedido, categorias);
      } catch (e) {
        avisoModoLocal('chamada 1', e);
        usarIA = false; // cota/erro: o resto do pedido também fica no modo local
      }
    }
    if (!analise) analise = analisarPedidoLocal(pedido, categorias);

    // 5) Candidatos do banco (até 20); se vierem menos de 5, completa com os recentes
    let candidatos = await buscarCandidatosIA(supabase, {
      termos: analise.termos,
      categorias: analise.categorias,
      limite: MAX_CANDIDATOS,
    });
    if (candidatos.length < MAX_RECOMENDACOES) {
      const ids = new Set(candidatos.map((c) => c.id));
      const recentes = await buscarRecentesParaIA(supabase, MAX_CANDIDATOS);
      const complemento = recentes.filter((r) => !ids.has(r.id)).map((r) => ({ ...r, _complemento: true }));
      candidatos = [...candidatos, ...complemento].slice(0, MAX_CANDIDATOS);
    }
    // Autor/título citado no pedido vai para o topo (os dois modos usam a ordem).
    candidatos = priorizarCitados(pedido, candidatos);
    if (process.env.IA_DEBUG === '1') {
      // Diagnóstico opcional (só no log do servidor): IA_DEBUG=1 no .env.local
      console.info('[IA debug]', JSON.stringify({
        pedido,
        modoEntender: usarIA ? 'ia' : 'local',
        termos: analise.termos,
        categorias: analise.categorias,
        candidatos: candidatos.map((c) => `${c.titulo} — ${c.autor} [${c.categoria}]${c._complemento ? ' (recente)' : ''}`),
      }, null, 1));
    }
    if (candidatos.length === 0) {
      return Response.json({
        modo: usarIA ? 'ia' : 'local',
        mensagem: 'Não encontrei livros disponíveis no catálogo agora. Tente de novo mais tarde.',
        livros: [],
      });
    }

    // 6 e 7) Escolher: modo IA (chamada 2, ids validados) ou modo local
    let escolha = null;
    let modo = 'local';
    if (usarIA) {
      try {
        escolha = await escolherComIA(pedido, candidatos);
        modo = 'ia';
      } catch (e) {
        avisoModoLocal('chamada 2', e);
      }
    }
    if (!escolha) escolha = escolherLocal(pedido, candidatos);

    // Só respostas da IA vão para o cache (o modo local não gasta cota).
    if (modo === 'ia') cacheRespostas.set(chaveCache, { em: Date.now(), modo, ...escolha });

    // 8) Dados atuais do banco, na ordem escolhida
    return montarResposta(supabase, { modo, ...escolha });
  } catch (e) {
    console.error('[IA] erro inesperado em /api/recomendar:', e?.message || e);
    return erro(503, 'A recomendação está indisponível no momento.');
  }
}
