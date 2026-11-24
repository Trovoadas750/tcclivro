# 📚 Casa do Leitor — Livraria Virtual

Projeto de livraria virtual (e-commerce de livros com recomendação por IA), **reescrito em Next.js (App Router) com JavaScript** — sem TypeScript — a partir do projeto original em PHP (`/var/www/html/livraria`).

> ⚠️ **Importante:** a conexão com o banco de dados está **deliberadamente desativada**. Todos os arquivos relacionados à conexão **PostgreSQL/Supabase** já existem, estão bem estruturados e comentados, e as funções de busca de livros no banco foram criadas — mas **não executam consultas reais**: enquanto o banco estiver desligado, o site funciona 100% com dados de demonstração (`src/lib/mockData.js`), que são uma cópia fiel do seed original.

---

## 🚀 Como rodar

```bash
# 1. Instalar dependências (já feita, mas pode repetir)
npm install

# 2. Ambiente de desenvolvimento (http://localhost:3000)
npm run dev

# 3. Build de produção
npm run build
npm start
```

### Credenciais demo (login)
- **E-mail:** `demo@casadoleitor.com`
- **Senha:** `123456`

---

## 🗂️ Mapa do projeto

```
Casa_do_Leitor/
├── package.json              # Dependências e scripts (dev/build/start)
├── next.config.mjs           # Configuração do Next.js
├── jsconfig.json             # Alias de import @/* -> src/*
├── .env.local.example        # Modelo das variáveis do Supabase (copiar p/ .env.local)
├── database/
│   └── schema.sql            # Schema PostgreSQL do banco (tabelas + seed)
├── public/
│   ├── emoji/                # PNGs de ícones (substituem emojis)
│   └── favicon.ico
└── src/
    ├── app/                  # Rotas e páginas (App Router)
    │   ├── layout.js         # Layout raiz (Header, Footer, Chatbot, Toasts)
    │   ├── globals.css       # Estilos globais (4 temas)
    │   ├── page.js           # 🏠 Página inicial
    │   ├── busca/page.js     # 🔍 Catálogo / busca com filtros
    │   ├── produto/[id]/     # 📖 Página do produto
    │   │   ├── page.js       #    (rota dinâmica)
    │   │   └── BotoesProduto.js
    │   ├── ia/page.js        # 🤖 Página de recomendação com IA
    │   ├── carrinho/page.js  # 🛒 Carrinho de compras
    │   ├── checkout/page.js  # 💳 Finalizar compra (fictício)
    │   ├── favoritos/page.js # ❤️ Meus favoritos
    │   ├── meus-pedidos/page.js # 📦 Meus pedidos
    │   ├── minha-conta/page.js  # 👤 Minha conta
    │   ├── rastreio/page.js  # 🚚 Rastreio da entrega
    │   ├── auth/
    │   │   ├── login/page.js     # Entrar
    │   │   └── registro/page.js  # Criar conta
    │   └── api/
    │       ├── chat/route.js        # API do chatbot BibliIA
    │       ├── recomendacao/route.js# API de recomendação
    │       ├── carrinho/route.js    # API do carrinho (esqueleto)
    │       └── favorito/route.js    # API de favoritos (esqueleto)
    ├── components/           # Componentes reutilizáveis
    │   ├── Header.js         # Cabeçalho (busca, nav, tema, usuário, badge)
    │   ├── Footer.js         # Rodapé
    │   ├── LivroCard.js      # Card de livro (catálogo)
    │   ├── Chatbot.js        # Widget BibliIA (assistente flutuante)
    │   ├── Icone.js          # Ícone via PNG (substitui emoji)
    │   ├── CapaLivro.js      # Capa de livro SVG (100% offline)
    │   ├── ThemeToggle.js    # Seletor de temas
    │   ├── ThemeScript.js    # Aplica tema antes da hidratação
    │   └── Toasts.js         # Mensagens flutuantes (sucesso/erro)
    └── lib/                  # Lógica de negócio e dados
        ├── config.js             # Constantes da aplicação
        ├── supabase.js           # 🔌 CONEXÃO SUPABASE (desativada!)
        ├── mockData.js           # Dados de demonstração (seed)
        ├── repositories/
        │   └── livroRepository.js# 📖 Consultas de livros (comentadas)
        ├── iaEngine.js           # Motor de recomendação "IA"
        ├── format.js             # Formatação (preço, estrelas, datas)
        ├── capa.js               # Gerador de capas SVG
        └── clientStore.js        # Carrinho/favoritos/pedidos (localStorage)
```

---

## 📄 O que cada arquivo faz

### Configuração raiz

| Arquivo | Função |
|---|---|
| `package.json` | Declara as dependências (`next`, `react`, `react-dom`, `@supabase/supabase-js`) e os scripts `dev`, `build` e `start`. |
| `next.config.mjs` | Configurações do Next.js (em branco por padrão). |
| `jsconfig.json` | Define o alias `@/*` para `src/*`, deixando os imports curtos (`@/lib/...`). |
| `.env.local.example` | Modelo das variáveis de ambiente do Supabase. Copie para `.env.local` e preencha para ativar o banco. |

### Banco de dados (⚠️ desativado de propósito)

| Arquivo | Função |
|---|---|
| `database/schema.sql` | Script **PostgreSQL** que cria todas as tabelas (usuarios, categorias, livros, tags, livro_tags, favoritos, carrinho, pedidos, pedido_itens, rastreio, avaliacoes) e insere o seed. É a versão PostgreSQL do `database/livraria.sql` original (MariaDB). Execute no painel do Supabase → SQL Editor. |
| `src/lib/supabase.js` | **Arquivo central da conexão.** Cria o cliente `@supabase/supabase-js` com a flag `DB_ATIVO = false`. Contém o passo a passo comentado de como ativar: criar o projeto no Supabase, rodar o schema, preencher `.env.local` e trocar a flag para `true`. Enquanto desativado, `getSupabase()` retorna `null` e ninguém consulta o banco. |
| `src/lib/repositories/livroRepository.js` | **As funções que puxam os dados dos livros do banco** (`buscarRecomendados`, `buscarMaisVendidos`, `buscarCategorias`, `buscarLivros`, `buscarLivroPorId`, `buscarRelacionados`, `buscarAvaliacoes`). Cada função contém o **SQL equivalente comentado** (o que seria executado no Supabase) e, como o banco está desligado, devolve os dados de `mockData.js`. Quando `DB_ATIVO` virar `true`, o bloco real é executado automaticamente. |

### Páginas (src/app)

| Rota | Arquivo | Equivalente PHP | Função |
|---|---|---|---|
| `/` | `page.js` | `index.php` | Home: hero, chips de categorias, recomendados pela IA e mais vendidos. É um **Server Component**: chama os repositórios (que hoje devolvem mock, amanhã devolvem banco). |
| `/busca` | `busca/page.js` | `busca.php` | Catálogo com busca por texto, filtro por categoria e 5 ordenações. Lê `searchParams` (que no Next 16 é Promise → usa `await`). |
| `/produto/[id]` | `produto/[id]/page.js` | `produto.php` | Ficha do livro: capa, preço, avaliação, estoque, sinopse, relacionados e avaliações. Rota dinâmica (`params` é Promise). |
| `/produto/[id]` | `produto/[id]/BotoesProduto.js` | `main.js` + `api/*` | Botões "Adicionar ao carrinho" e "Favoritar" (client). Hoje salvam no localStorage. |
| `/ia` | `ia/page.js` | `ia.php` | Página de recomendação: usuário descreve o gosto, a página chama `/api/recomendacao` e mostra os livros com as razões da escolha. |
| `/carrinho` | `carrinho/page.js` | `carrinho.php` | Carrinho com controle de quantidade e resumo (localStorage). |
| `/checkout` | `checkout/page.js` | `checkout.php` | Finalizar compra: exige login, valida endereço e pagamento fictício (cartão/Pix/boleto), cria o pedido e redireciona para o rastreio. |
| `/favoritos` | `favoritos/page.js` | `favoritos.php` | Lista os livros favoritos. |
| `/meus-pedidos` | `meus-pedidos/page.js` | `meus-pedidos.php` | Tabela de pedidos do usuário (inclui 1 pedido demo). |
| `/minha-conta` | `minha-conta/page.js` | `minha-conta.php` | Dados do usuário com contadores e edição de perfil. |
| `/rastreio` | `rastreio/page.js` | `rastreio.php` | Linha do tempo de etapas da entrega + histórico + conteúdo do pedido. |
| `/auth/login` | `auth/login/page.js` | `auth/login.php` | Login (valida contra o usuário demo). |
| `/auth/registro` | `auth/registro/page.js` | `auth/registro.php` | Criação de conta com validações. |

### Rotas de API (src/app/api)

| Rota | Equivalente PHP | Função |
|---|---|---|
| `api/chat` | `api/chat.php` | Recebe a mensagem do chatbot e devolve a resposta da BibliIA (usa `iaEngine.js`). **Funcional hoje** com dados demo. |
| `api/recomendacao` | `api/recomendacao.php` | Recebe o texto e devolve livros recomendados com `score` e `razoes`. **Funcional hoje** com dados demo. |
| `api/carrinho` | `api/carrinho.php` | Esqueleto documentado: ações add/update/remove/limpar. Sem banco, o carrinho vive no navegador; com Supabase ativo, implementar aqui os inserts/updates na tabela `carrinho`. |
| `api/favorito` | `api/favorito.php` | Esqueleto documentado: alternar favorito na tabela `favoritos`. |

### Componentes (src/components)

| Componente | Função |
|---|---|
| `Header.js` | Cabeçalho fixo: logo, barra de busca, navegação, seletor de tema, login/usuário e badge do carrinho. Client (lê localStorage). |
| `Footer.js` | Rodapé com 4 colunas (sobre, navegação, conta, pagamento). |
| `LivroCard.js` | Card de livro usado em todas as grades: capa, título, autor, estrelas, preço, selo IA/DESTAQUE, botões comprar/favoritar. |
| `Chatbot.js` | Assistente flutuante "BibliIA" no canto da tela: conversa, sugere chips e mostra cards de livros recomendados. |
| `Icone.js` | Renderiza os PNGs de `/public/emoji/` (substitui a função `icone()` do PHP). |
| `CapaLivro.js` | Gera a capa do livro como SVG inline (substitui o `capa.php` do PHP) — 100% offline, sem imagens externas. |
| `ThemeToggle.js` | Alterna entre os temas Sépia (padrão) e Escuro e salva no localStorage. |
| `ThemeScript.js` | Script injetado no `<head>` que aplica o tema salvo antes da hidratação (evita "flash" de tema errado). |
| `Toasts.js` | Mensagens flutuantes de sucesso/aviso/erro via `window.showToast(msg, tipo)`. |

### Lógica (src/lib)

| Arquivo | Função |
|---|---|
| `config.js` | Constantes: nome do app, chaves do localStorage, formas de pagamento, regra de frete grátis. |
| `supabase.js` | ✅ Ver seção "Banco de dados" acima — **arquivo da conexão PostgreSQL/Supabase**. |
| `mockData.js` | Cópia fiel do seed do banco em JS: 20 livros, 8 categorias, 30 tags, vínculos livro-tag, avaliações, usuário demo e pedido demo. É o que mantém o site funcionando sem banco. |
| `repositories/livroRepository.js` | ✅ Ver seção "Banco de dados" acima — **funções de puxar livros do banco** (com SQL documentado, sem executar). |
| `iaEngine.js` | Motor de recomendação por texto (tokens, stopwords em PT, pesos por título/autor/descrição/categoria/tag, bônus de favoritos). Porte do `ia_engine.php`. |
| `format.js` | `preco()` (R$), `estrelas()` (★), `formatarData()`, `normalizar()` (remove acentos), `moedaParaNumero()`. |
| `capa.js` | Gera o SVG da capa do livro (gradiente pela cor + id). Usado por `CapaLivro.js`. |
| `clientStore.js` | Camada de estado do navegador: usuário, carrinho, favoritos e pedidos via localStorage. Comentado mostrando onde entrariam as chamadas ao banco. |

---

## 🔌 Como ativar o banco (PostgreSQL/Supabase) — passo a passo

Tudo já está pronto para funcionar; falta apenas:

1. **Criar o projeto** em https://supabase.com (plano free).
2. **Criar as tabelas:** no painel do Supabase → *SQL Editor*, cole e execute `database/schema.sql`.
3. **Preencher as variáveis:** copie `.env.local.example` para `.env.local` e cole a `URL` e a `anon key` do projeto (Supabase → Settings → API).
4. **Ligar o banco:** em `src/lib/supabase.js`, troque `DB_ATIVO = false` por `true`.
5. **Reinicie:** `npm run dev` (ou `npm run build && npm start`).

A partir daí, as funções de `src/lib/repositories/livroRepository.js` passam a executar as consultas reais (os blocos SQL já estão escritos e comentados em cada função), e as rotas `api/carrinho` e `api/favorito` podem ser implementadas para persistir no banco (as instruções também estão nos comentários).

---

## 🧠 Como funciona a "IA" de recomendação

O motor (`src/lib/iaEngine.js`) simula uma IA de curadoria:

1. O texto do usuário é **normalizado** (minúsculas, sem acentos) e quebrado em **tokens**, removendo *stopwords* em português ("gosto", "quero", "livro"...).
2. Cada livro do acervo recebe uma **pontuação**: match no título (+6), categoria (+3,5), autor (+3), descrição (+2) e tags temáticas (+3 × peso), mais bônus de avaliação/vendas e de favoritos do usuário.
3. Os livros são ordenados pelo score e cada um vem com as **razões** ("título combina com «magia»") exibidas no card.
4. Para trocar por uma IA real (OpenAI etc.), basta reimplementar `recomendarLivrosIA()` e `responderChatIA()`.

---

## 🔄 Equivalência com o projeto PHP original

| Projeto PHP (`/var/www/html/livraria`) | Projeto Next.js (`Casa_do_Leitor`) |
|---|---|
| `index.php`, `busca.php`, `produto.php`, etc. | `src/app/*/page.js` |
| `includes/header.php` + `footer.php` | `src/components/Header.js` + `Footer.js` |
| `includes/functions.php` | `src/lib/format.js` + `config.js` |
| `includes/ia_engine.php` | `src/lib/iaEngine.js` |
| `config/database.php` (MySQL) | `src/lib/supabase.js` (PostgreSQL/Supabase) |
| `database/livraria.sql` (MariaDB) | `database/schema.sql` (PostgreSQL) |
| `api/carrinho.php`, `api/favorito.php`, `api/chat.php`, `api/recomendacao.php` | `src/app/api/*/route.js` |
| `assets/js/main.js` + `chatbot.js` | Componentes client (`Header`, `Chatbot`, `LivroCard`...) |
| `assets/img/capa.php` | `src/lib/capa.js` + `CapaLivro.js` |
| `assets/img/emoji/*.png` | `public/emoji/*.png` |
| `includes/livro_card.php` | `src/components/LivroCard.js` |
| Sessão PHP + tabelas (carrinho/favoritos/pedidos) | `src/lib/clientStore.js` (localStorage, provisório) |

---

## 🧰 Tecnologias

- **Next.js 16** (App Router, Server/Client Components)
- **React 19**
- **JavaScript puro** (sem TypeScript)
- **@supabase/supabase-js** (pacote instalado; conexão desativada)
- CSS puro com 4 temas via variáveis (`data-theme`)

---

## ⚠️ Observações / detalhes adicionais

- **Sem banco de dados:** nada é persistido entre navegadores ou dispositivos (apenas localStorage). Ao ativar o Supabase, os dados passam a ser compartilhados de verdade.
- **Pagamento fictício:** o checkout não processa pagamento real (assim como no PHP).
- **Carrinho anônimo:** no PHP, um `sessao_id` guardava o carrinho de visitantes; aqui o localStorage cumpre esse papel automaticamente.
- **Pedido demo:** a tela "Meus pedidos" sempre mostra 1 pedido de exemplo (`CDL-2026-001`) para você ver o fluxo de rastreio antes de comprar.
- **Capas de livros:** são geradas como SVG inline (sem depender de internet ou de imagens).
- **Next.js 16:** `params` e `searchParams` chegam como Promise e precisam de `await` (feito em `produto/[id]` e `busca`).
