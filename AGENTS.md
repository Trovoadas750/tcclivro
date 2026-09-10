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
- Banco de dados (Supabase/PostgreSQL) está **desativado** de propósito: `DB_ATIVO = false` em `src/lib/supabase.js`. Não "ative" a conexão nem substitua os dados mock por consultas reais sem autorização.
- Consultas de livros ficam em `src/lib/repositories/livroRepository.js` (SQL documentado em comentários).
- Dados de demonstração em `src/lib/mockData.js`.
- Estado de carrinho/favoritos/pedidos/usuário vive no localStorage via `src/lib/clientStore.js`.
- Componentes interativos usam `'use client'`; páginas de catálogo podem ser Server Components.
- Não há linter/ESLint configurado.
