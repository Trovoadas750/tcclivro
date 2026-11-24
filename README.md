# 📚 Casa do Leitor — Livraria Virtual

E-commerce de livros com **recomendação por IA**, feito em **Next.js 16 (App Router) com JavaScript** e **Supabase** (PostgreSQL + Auth + Storage). Projeto de TCC.

- Catálogo inicial com ~600 livros reais, vitrine pública, busca e filtros por categoria.
- Cadastro único: toda conta nasce **cliente** e pode virar **vendedor** (abre uma loja e cadastra livros com 2 fotos).
- Carrinho (funciona deslogado), favoritos, finalização de compra e histórico de pedidos.
- **IA de recomendação gratuita**: o leitor descreve o que quer ler e recebe até 5 livros do catálogo, cada um com o motivo da escolha. Se a IA externa falhar, o site usa um **modo local** sem IA.

> A referência completa do banco (tabelas, regras de acesso, funções e erros) está em **[`BDcontexto.md`](BDcontexto.md)**. Leia antes de mexer em qualquer coisa que acesse o Supabase.

---

## 🚀 Como rodar

Requer **Node.js 20.9 ou mais novo**.

```bash
npm install     # instalar dependências
npm run dev     # desenvolvimento: http://localhost:3000
npm run build   # build de produção (também verifica erros)
npm start       # servir a build de produção
```

### Variáveis de ambiente (`.env.local` e painel da Vercel)

| Variável | Onde é usada | Obrigatória? |
|---|---|---|
| `NEXT_PUBLIC_SUPABASE_URL` | URL do projeto Supabase | Sim |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Chave pública (anon) do Supabase | Sim |
| `NEXT_PUBLIC_APP_URL` | URL base do site | Não (padrão `http://localhost:3000`) |
| `NEXT_PUBLIC_LOJA_CATALOGO_ID` | Id do vendedor dono do catálogo inicial (Authentication → Users). Separa a seção "Direto dos vendedores" | Não (sem ela, a seção mostra todas as lojas) |
| `IA_API_URL` | Provedor de IA no formato OpenAI. **Só servidor** | Não (padrão Groq: `https://api.groq.com/openai/v1`) |
| `IA_API_KEY` | Chave do provedor de IA. **Só servidor, nunca `NEXT_PUBLIC_`** | Não (sem ela, a recomendação usa só o modo local) |
| `IA_MODELO` | Modelo do provedor | Não (padrão `openai/gpt-oss-20b`) |
| `IA_DEBUG` | `1` mostra no log do servidor os termos e candidatos de cada recomendação | Não |

Exemplo:

```env
NEXT_PUBLIC_SUPABASE_URL=https://xxxx.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJhbGciOi...
NEXT_PUBLIC_LOJA_CATALOGO_ID=00000000-0000-0000-0000-000000000000
IA_API_URL=https://api.groq.com/openai/v1
IA_API_KEY=gsk_...
IA_MODELO=openai/gpt-oss-20b
```

O Google AI Studio (Gemini) também funciona sem mudar código: troque `IA_API_URL` para `https://generativelanguage.googleapis.com/v1beta/openai` e use a chave e um modelo gratuito de lá.

---

## 🗺️ Páginas

| Rota | O que faz |
|---|---|
| `/` | Destaques, faixas das maiores categorias, "Direto dos vendedores" |
| `/busca` | Catálogo: busca de texto, filtro por categoria, ordenação e páginas de 24 livros |
| `/livro/[id]` | Detalhe do livro: galeria de fotos, quantidade, "Adicionar ao carrinho", "Comprar agora", favoritar |
| `/ia` | Recomendação: o leitor descreve o que quer ler (também disponível no chatbot flutuante) |
| `/carrinho` | Carrinho com preços e estoque atuais do banco |
| `/checkout` | Resumo + "Confirmar pedido" (exige login) |
| `/meus-pedidos`, `/meus-pedidos/[id]` | Histórico e detalhe/confirmação do pedido |
| `/favoritos`, `/minha-conta` | Área do cliente |
| `/vendedor/cadastro` | "Tornar-se vendedor": o cliente logado abre a loja |
| `/painel-vendedor` | Loja e livros do vendedor (cadastrar, editar, ativar/desativar, excluir) |
| `/auth/login`, `/auth/registro`, `/esqueci-senha` | Conta |

---

## 🧠 Recomendação com IA (gratuita)

O projeto não tem orçamento para APIs pagas, então a rota `POST /api/recomendar` tem **dois modos**:

1. **Modo IA** — provedor gratuito compatível com a API da OpenAI, chamado com `fetch` só no servidor (`src/lib/ia.js`):
   - **Chamada 1:** a IA transforma o pedido em termos de busca (em português **e** inglês, porque o catálogo inicial está em inglês) e escolhe categorias da lista real do banco.
   - O banco devolve até 20 candidatos (`buscar_livros_para_ia`).
   - **Chamada 2:** a IA escolhe até 5 candidatos e escreve o motivo de cada um. Ids fora da lista são descartados: a IA **nunca inventa livros**.
2. **Modo local** — sem IA externa (`src/lib/dicionario-categorias.js`): palavras do pedido + um dicionário de categorias, e os livros mais relevantes da busca com um motivo montado por modelo de texto.

O modo local entra **sozinho** quando não há chave, a cota grátis acaba (HTTP 429), o provedor demora mais de 12 s, dá erro ou responde num formato inválido. Preço, título, foto e estoque mostrados vêm **sempre do banco**.

Proteções: limite de 10 pedidos a cada 10 minutos por IP e cache de 10 minutos para pedidos repetidos (os dois em memória). O plano gratuito do Groq tem limite por minuto: em demonstrações, espace os pedidos novos (pedidos repetidos saem do cache).

---

## 🗂️ Estrutura

```
BDcontexto.md                  Referência do banco real (leia primeiro)
AGENTS.md                      Regras do projeto para quem for programar
src/
├── proxy.js                   Renova a sessão do Supabase e protege rotas que exigem login
├── app/                       Páginas (App Router) e a rota api/recomendar
├── components/                Header, Footer, LivroCard, CapaLivro, Chatbot, CardRecomendacao...
└── lib/
    ├── supabase/client.js     Cliente Supabase do navegador (@supabase/ssr)
    ├── supabase/server.js     Cliente Supabase do servidor
    ├── repositories/livroRepository.js   Consultas do catálogo
    ├── clientStore.js         Carrinho no localStorage (só livro_id e quantidade)
    ├── useCarrinho.js         Carrinho + dados atuais do banco
    ├── favoritos.js           Coração dos cards (tabela favoritos)
    ├── pedidos.js             finalizar_pedido() e histórico
    ├── ia.js                  Provedor de IA (fetch, formato OpenAI)
    ├── motorRecomendacao.js   Etapas da recomendação (modo IA e modo local)
    ├── dicionario-categorias.js  Dicionário do modo local
    ├── vendedor.js            Fotos (Storage), preço e erros da área do vendedor
    └── capa.js                Capa genérica em SVG (fallback de imagem)
public/emoji/                  Ícones em PNG
database/                      Scripts antigos (não refletem o banco atual; veja BDcontexto.md)
```

---

## 🔒 Regras importantes

- **Toda a segurança está na RLS do Supabase.** Proteger rotas no front é só experiência de uso.
- O front **nunca** insere em `profiles`, `pedidos` ou `itens_pedido`. Virar vendedor é `rpc('tornar_vendedor')`; comprar é `rpc('finalizar_pedido')`, que calcula preço e total e baixa o estoque.
- Nunca usar `select('*')` em `livros` (traz a coluna `busca`): listar as colunas.
- Toda capa usa `CapaLivro`: foto 1 → foto 2 → capa genérica. Nunca aparece imagem quebrada.
- A chave da IA fica só no servidor.

---

## ⚠️ Limitações conhecidas

- **Pagamento e entrega ainda não existem:** todo pedido nasce e fica com status "Pendente".
- Não há cancelamento de pedido nem painel de vendas para o vendedor.
- O catálogo inicial está em inglês (título e sinopse); preço e estoque são de demonstração.
- As capas do catálogo inicial vêm do Goodreads e da Open Library e podem falhar (por isso o fallback).
- O limite por IP e o cache da IA ficam em memória: reiniciam a cada deploy e não são compartilhados entre instâncias da Vercel.

---

## 🧰 Tecnologias

Next.js 16 · React 19 · JavaScript (sem TypeScript) · Supabase (`@supabase/ssr`) · CSS puro com temas Sépia e Escuro · provedor de IA gratuito (Groq ou Gemini) via `fetch`.

**Créditos:** dados do catálogo inicial: [goodbooks-10k-extended](https://github.com/malcolmosh/goodbooks-10k-extended) (Zygmunt Zając e Malcolm Osh), licença CC BY-SA 4.0.
