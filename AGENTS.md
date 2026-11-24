# AGENTS.md — Casa do Leitor

## Comandos

```bash
npm install   # instalar dependências
npm run dev   # servidor de desenvolvimento (http://localhost:3000)
npm run build # build de produção (verifica erros de compilação)
npm start     # servir a build de produção
```

## Regras do projeto

- Next.js 16 (App Router) com JavaScript — **NÃO use TypeScript**.
- `params` e `searchParams` em páginas são **Promise** (precisam de `await`).
- **Leia `BDcontexto.md` antes de mexer em qualquer coisa que acesse o banco.** Ele descreve o banco real do Supabase (tabelas, RLS, funções RPC, erros esperados).
- **Não altere o banco** (tabelas, policies, funções, triggers, buckets, permissões). Se precisar de mudança, pare e proponha o SQL para aprovação.
- Clientes Supabase (`@supabase/ssr`): `src/lib/supabase/client.js` (navegador) e `src/lib/supabase/server.js` (Server Components / Route Handlers). Reutilize-os; nunca use a `service_role` key.
- Consultas do catálogo ficam em `src/lib/repositories/livroRepository.js` (cada função recebe o cliente Supabase). Nunca use `select('*')` em `livros` (traz a coluna `busca`): liste as colunas.
- Não existem mais dados mockados: a vitrine lê só a tabela `livros`.
- Toda capa de livro usa `src/components/CapaLivro.js` (fallback foto 1 → foto 2 → capa genérica).
- Carrinho no `localStorage` via `src/lib/clientStore.js`, só `{ livro_id, quantidade }`. Favoritos na tabela `favoritos` (`src/lib/favoritos.js`).
- Conta: cadastro único (toda conta nasce cliente); virar vendedor é `rpc('tornar_vendedor', ...)` em `/vendedor/cadastro`.
- Variáveis de ambiente: `NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_ANON_KEY`, `NEXT_PUBLIC_APP_URL`, `NEXT_PUBLIC_LOJA_CATALOGO_ID` e, só no servidor, `IA_API_URL`, `IA_API_KEY`, `IA_MODELO` (opcional: `IA_DEBUG=1` mostra termos e candidatos da recomendação no log).
- IA de recomendação (`POST /api/recomendar`, página `/ia` e chatbot): provedor **gratuito** no formato OpenAI via `fetch` (`src/lib/ia.js`), sem SDK e sem APIs pagas, com **modo local** automático (`src/lib/dicionario-categorias.js`) quando não há chave, a cota acaba ou o provedor falha. Etapas em `src/lib/motorRecomendacao.js`.
- Estilos em CSS global (sem Tailwind/CSS Modules): **tokens** (cores dos temas Sépia e Escuro, espaçamentos, raios, sombras, fontes) só em `src/app/tokens.css`; cabeçalho, menu do celular, barra inferior e rodapé em `src/app/estrutura.css`; o resto em `globals.css`. Use as variáveis `--cor-*`, `--esp-*`, `--raio-*` em vez de cores fixas. Fontes via `next/font` (Fraunces nos títulos, Inter no texto). Breakpoints: 360, 768, 1024 e 1280 px.
- Logo: `public/logo.png` (componente `LogoMarca`). Ícones de interface: SVG próprios em `src/components/IconeSvg.js`.
- Componentes interativos usam `'use client'`; páginas de catálogo são Server Components.
- Interface toda em português.
- Não há linter/ESLint configurado.
