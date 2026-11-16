# Casa do Leitor — Contexto do banco de dados

Documento de referência do banco de dados do e-commerce de livros **Casa do Leitor** (repositório `tcclivro`).
Leia este arquivo inteiro antes de escrever qualquer código que acesse o Supabase.
Ele descreve o estado **real** do banco, conferido por diagnóstico e ajustado pelo script `ajuste-banco.sql`.

---

## 1. Stack

- **Front-end:** Next.js com App Router, em **JavaScript** (sem TypeScript)
- **Back-end:** Supabase (Postgres + Auth)
- **Deploy:** Vercel (`tcclivro.vercel.app`)
- **E-mails de autenticação:** SMTP próprio (Resend) configurado no Supabase

> **Não crie migrations nem altere tabelas, policies, funções, triggers ou permissões.**
> Se alguma tarefa exigir mudança no banco, pare e proponha o SQL separadamente para aprovação.

---

## 2. Regras de negócio

1. Toda conta tem um **tipo**: `cliente` ou `vendedor`. O padrão é `cliente`.
2. O tipo é escolhido **no cadastro**, enviado em `options.data.tipo` do `supabase.auth.signUp`. Um trigger cria o perfil com esse valor.
3. **O usuário nunca pode alterar o próprio tipo.** O banco bloqueia isso.
4. O perfil (`profiles`) é **privado**: cada conta só lê e edita o próprio. **Uma conta nunca acessa o perfil de outra.**
5. **O front nunca insere em `profiles`.** O perfil é criado pelo trigger no `signUp`.
6. Os dados **públicos** do vendedor (nome da loja, descrição) ficam em `lojas`, nunca em `profiles`.
7. O vendedor precisa **criar a loja antes de cadastrar livros**. Cada vendedor tem no máximo uma loja.
8. **Só vendedores cadastram livros**, e cada vendedor só edita ou apaga os próprios.
9. A **vitrine é pública**: qualquer pessoa, inclusive deslogada, vê os livros com `ativo = true`.
10. Livros com `ativo = false` não aparecem para o público. Só o vendedor dono continua vendo esses livros.
11. **Livro que já aparece em algum pedido não pode ser excluído** (o banco impede). A alternativa é desativá-lo.
12. **Favoritos:** cada usuário vê, adiciona e remove só os próprios. Cada livro pode ser favoritado uma vez por usuário.
13. **Pedidos:** cada usuário vê e cria só os próprios pedidos e os itens deles. Não há edição nem exclusão de pedidos pelo front.
14. **Toda a segurança está na RLS do banco.** Proteção de rota no front-end é só experiência de uso.

---

## 3. Relações

```
auth.users (Supabase Auth)
   │
   ├─1:1──► profiles ──1:0..1──► lojas ──1:N──► livros
   │        (tipo)               (só vendedor)    │
   │                                              │
   ├─1:N──► favoritos ◄───────────N:1─────────────┤
   │                                              │
   └─1:N──► pedidos ──1:N──► itens_pedido ◄──N:1──┘
```

| De                       | Para                    | Ao apagar o "pai"                          |
|--------------------------|-------------------------|--------------------------------------------|
| `profiles.id`            | `auth.users.id`         | cascade                                    |
| `lojas.vendedor_id`      | `profiles.id`           | cascade                                    |
| `livros.vendedor_id`     | `lojas.vendedor_id`     | cascade                                    |
| `favoritos.user_id`      | `auth.users.id`         | cascade                                    |
| `favoritos.livro_id`     | `livros.id`             | cascade                                    |
| `pedidos.user_id`        | `auth.users.id`         | cascade                                    |
| `itens_pedido.pedido_id` | `pedidos.id`            | cascade                                    |
| `itens_pedido.livro_id`  | `livros.id`             | **bloqueia** (livro com pedido não é apagado) |

**Todos os `id` são `uuid`** (string no JavaScript), inclusive `livros.id`.

---

## 4. Tipos

### Enum `public.tipo_cadastro`

| Valor      | Significado                   |
|------------|-------------------------------|
| `cliente`  | Compra livros (padrão)        |
| `vendedor` | Tem loja e cadastra livros    |

---

## 5. Tabelas

### 5.1 `public.profiles` — privada

| Coluna       | Tipo                   | Nulo? | Padrão      | Observação |
|--------------|------------------------|-------|-------------|------------|
| `id`         | `uuid` (PK)            | não   | —           | FK `auth.users(id)` |
| `nome`       | `text`                 | sim   | —           | Vem de `options.data.nome` no cadastro. **Editável** |
| `avatar_url` | `text`                 | sim   | —           | **Editável** |
| `tipo`       | `public.tipo_cadastro` | não   | `'cliente'` | **Não editável pelo usuário** |
| `created_at` | `timestamptz`          | sim   | `now()`     | Não editável |
| `updated_at` | `timestamptz`          | sim   | `now()`     | Atualizado sozinho pelo trigger `profiles_set_updated_at`. Não enviar |

**Policies:**
- `Usuário vê o próprio perfil` — SELECT, authenticated: `auth.uid() = id`
- `Usuário edita o próprio perfil` — UPDATE, authenticated: `auth.uid() = id`

**Permissões de coluna:** `authenticated` só pode dar UPDATE em `nome` e `avatar_url`.
**Sem INSERT e sem DELETE** pelo front.

### 5.2 `public.lojas` — pública para leitura

| Coluna        | Tipo          | Nulo? | Padrão       | Observação |
|---------------|---------------|-------|--------------|------------|
| `vendedor_id` | `uuid` (PK)   | não   | `auth.uid()` | FK `profiles(id)`. **Não enviar no insert** |
| `nome_loja`   | `text`        | não   | —            | Exibido na vitrine e na página do livro |
| `descricao`   | `text`        | sim   | —            | |
| `created_at`  | `timestamptz` | não   | `now()`      | |

**Policies:**
- `Lojas são públicas` — SELECT, anon + authenticated: `true`
- `Vendedor cria a própria loja` — INSERT, authenticated: `vendedor_id = auth.uid()` e `is_vendedor()`
- `Vendedor edita a própria loja` — UPDATE, authenticated: `vendedor_id = auth.uid()`

**Sem DELETE** pelo front.

### 5.3 `public.livros`

| Coluna        | Tipo            | Nulo? | Padrão              | Observação |
|---------------|-----------------|-------|---------------------|------------|
| `id`          | `uuid` (PK)     | não   | `gen_random_uuid()` | **Não enviar no insert** |
| `vendedor_id` | `uuid`          | não   | `auth.uid()`        | FK `lojas(vendedor_id)`. **Não enviar no insert** |
| `titulo`      | `text`          | não   | —                   | |
| `autor`       | `text`          | não   | —                   | |
| `categoria`   | `text`          | sim   | —                   | Texto livre (ex.: "Romance", "Fantasia") |
| `sinopse`     | `text`          | sim   | —                   | **É a descrição do livro.** Não existe coluna `descricao` em `livros` |
| `isbn`        | `text`          | sim   | —                   | Sem restrição de unicidade |
| `preco`       | `numeric(10,2)` | não   | —                   | `check (preco >= 0)`. Obrigatório |
| `estoque`     | `integer`       | não   | `0`                 | `check (estoque >= 0)` |
| `capa_url`    | `text`          | sim   | —                   | Por enquanto é só uma URL em texto (sem upload) |
| `ativo`       | `boolean`       | não   | `true`              | `false` tira o livro da vitrine sem apagar |
| `created_at`  | `timestamptz`   | sim   | `now()`             | |

Índice: `livros_vendedor_id_idx` em `vendedor_id`.

**Policies:**
- `Vitrine de livros` — SELECT, anon + authenticated: `ativo or vendedor_id = auth.uid()`
- `Vendedor cadastra livros` — INSERT, authenticated: `vendedor_id = auth.uid()` e `is_vendedor()`
- `Vendedor edita os próprios livros` — UPDATE, authenticated: `vendedor_id = auth.uid()` (using e check)
- `Vendedor apaga os próprios livros` — DELETE, authenticated: `vendedor_id = auth.uid()`

### 5.4 `public.favoritos`

| Coluna       | Tipo          | Nulo? | Padrão              | Observação |
|--------------|---------------|-------|---------------------|------------|
| `id`         | `uuid` (PK)   | não   | `gen_random_uuid()` | |
| `user_id`    | `uuid`        | não   | —                   | FK `auth.users(id)`. **Precisa ser enviado** (`user.id`) |
| `livro_id`   | `uuid`        | não   | —                   | FK `livros(id)` |
| `created_at` | `timestamptz` | sim   | `now()`             | |

Restrição: `unique (user_id, livro_id)`.

**Policies:** SELECT, INSERT e DELETE apenas quando `auth.uid() = user_id`. Sem UPDATE.

### 5.5 `public.pedidos`

| Coluna       | Tipo            | Nulo? | Padrão              | Observação |
|--------------|-----------------|-------|---------------------|------------|
| `id`         | `uuid` (PK)     | não   | `gen_random_uuid()` | |
| `user_id`    | `uuid`          | não   | —                   | FK `auth.users(id)`. **Precisa ser enviado** (`user.id`) |
| `status`     | `text`          | não   | `'pendente'`        | |
| `total`      | `numeric(10,2)` | não   | `0`                 | `check (total >= 0)` |
| `created_at` | `timestamptz`   | sim   | `now()`             | |

**Policies:** SELECT e INSERT apenas quando `auth.uid() = user_id`. Sem UPDATE e sem DELETE.

### 5.6 `public.itens_pedido`

| Coluna           | Tipo            | Nulo? | Padrão              | Observação |
|------------------|-----------------|-------|---------------------|------------|
| `id`             | `uuid` (PK)     | não   | `gen_random_uuid()` | |
| `pedido_id`      | `uuid`          | não   | —                   | FK `pedidos(id)`, cascade |
| `livro_id`       | `uuid`          | não   | —                   | FK `livros(id)`, **bloqueia** exclusão do livro |
| `quantidade`     | `integer`       | não   | `1`                 | `check (quantidade > 0)` |
| `preco_unitario` | `numeric(10,2)` | não   | —                   | `check (preco_unitario >= 0)` |

**Policies:** SELECT e INSERT apenas quando o pedido (`pedido_id`) pertence ao usuário logado. Sem UPDATE e sem DELETE.

---

## 6. Funções e triggers

| Nome | Tipo | O que faz |
|------|------|-----------|
| `public.handle_new_user()` + trigger `on_auth_user_created` (after insert em `auth.users`) | trigger | Cria a linha em `profiles` com `nome` = `raw_user_meta_data ->> 'nome'` e `tipo` = `'vendedor'` se `raw_user_meta_data ->> 'tipo' = 'vendedor'`; **qualquer outro valor vira `'cliente'`**. O perfil existe logo no `signUp` |
| `public.is_vendedor()` | função `boolean` (security definer, stable) | `true` se o usuário logado tem `tipo = 'vendedor'`. Usada nas policies de `lojas` e `livros`. **O front não precisa chamar** |
| `public.set_updated_at()` + trigger `profiles_set_updated_at` (before update em `profiles`) | trigger | Preenche `updated_at = now()` em toda edição de perfil |

---

## 7. Matriz de permissões

| Ação                                   | Deslogado | Cliente | Vendedor |
|----------------------------------------|:---------:|:-------:|:--------:|
| Ver / editar o próprio perfil (nome, avatar) | —   | ✅      | ✅       |
| Ver o perfil de outra pessoa           | ❌        | ❌      | ❌       |
| Alterar o próprio `tipo`               | —         | ❌      | ❌       |
| Ver lojas                              | ✅        | ✅      | ✅       |
| Criar loja (uma só, a própria)         | ❌        | ❌      | ✅       |
| Editar loja                            | ❌        | ❌      | só a própria |
| Ver livros ativos                      | ✅        | ✅      | ✅       |
| Ver livros inativos                    | ❌        | ❌      | só os próprios |
| Cadastrar livro                        | ❌        | ❌      | ✅ (precisa de loja) |
| Editar / apagar livro                  | ❌        | ❌      | só os próprios (apagar só se não tiver pedidos) |
| Favoritos (ver, adicionar, remover)    | ❌        | os próprios | os próprios |
| Pedidos e itens (ver, criar)           | ❌        | os próprios | os próprios |

---

## 8. Consultas prontas (supabase-js)

> Antes de usar estes exemplos, **verifique como o cliente Supabase já está configurado no projeto** (`@supabase/ssr` ou `@supabase/supabase-js`, cliente de browser e/ou de servidor) e **reutilize-o**. Não crie um cliente novo se já existir um.
> **Nunca use a `service_role` key** no código do navegador nem para contornar a RLS.

### Cadastro com tipo
```js
const { data, error } = await supabase.auth.signUp({
  email,
  password,
  options: {
    data: { nome, tipo }, // tipo: 'cliente' | 'vendedor'
  },
});
// Não há confirmação por e-mail no projeto: a conta já entra logada.
// NÃO inserir nada em profiles depois do signUp: o trigger já cria o perfil.
```

### Descobrir o tipo do usuário logado
```js
const { data: { user } } = await supabase.auth.getUser();

const { data: perfil, error } = await supabase
  .from('profiles')
  .select('nome, avatar_url, tipo')
  .eq('id', user.id)
  .single();
// perfil.tipo === 'vendedor' | 'cliente'
```

### Editar o próprio perfil
```js
await supabase
  .from('profiles')
  .update({ nome, avatar_url }) // só estas duas colunas
  .eq('id', user.id);
```

### Verificar se o vendedor já tem loja
```js
const { data: loja } = await supabase
  .from('lojas')
  .select('vendedor_id, nome_loja, descricao')
  .eq('vendedor_id', user.id)
  .maybeSingle(); // null = ainda não criou a loja
```

### Criar e editar a loja
```js
// criar (não enviar vendedor_id: o banco preenche com auth.uid())
await supabase.from('lojas').insert({ nome_loja, descricao });

// editar
await supabase
  .from('lojas')
  .update({ nome_loja, descricao })
  .eq('vendedor_id', user.id);
```

### Cadastrar livro
```js
const { data: livro, error } = await supabase
  .from('livros')
  .insert({
    titulo,
    autor,
    categoria,
    sinopse,
    isbn,
    preco: Number(preco),     // "29,90" do input → converter para 29.9 antes
    estoque: Number(estoque),
    capa_url,
  })
  .select()
  .single();
// Não enviar id nem vendedor_id.
```

### Vitrine pública (página inicial)
```js
const { data: livros } = await supabase
  .from('livros')
  .select('id, titulo, autor, categoria, preco, capa_url, lojas(nome_loja)')
  .eq('ativo', true)
  .order('created_at', { ascending: false });

// lojas vem como objeto: livro.lojas?.nome_loja
```

### Página de detalhe do livro (`id` é uuid)
```js
const { data: livro, error } = await supabase
  .from('livros')
  .select('*, lojas(nome_loja, descricao)')
  .eq('id', id)
  .single();
// Livro inexistente ou inativo (para quem não é o dono) → erro PGRST116 → mostrar 404.
```

### Painel do vendedor: os próprios livros (inclui inativos)
```js
const { data: meusLivros } = await supabase
  .from('livros')
  .select('*')
  .eq('vendedor_id', user.id)
  .order('created_at', { ascending: false });
```

### Editar, ativar/desativar e excluir livro
```js
// editar (usar .select() para confirmar que alguma linha mudou)
const { data } = await supabase
  .from('livros')
  .update({ titulo, autor, categoria, sinopse, isbn, preco: Number(preco), estoque: Number(estoque), capa_url })
  .eq('id', id)
  .select();
// data vazio e sem erro = o livro não é deste vendedor (a RLS filtrou)

// ativar/desativar
await supabase.from('livros').update({ ativo: !livro.ativo }).eq('id', livro.id);

// excluir (pedir confirmação antes; pode falhar se o livro já tiver pedidos — ver seção 9)
await supabase.from('livros').delete().eq('id', livro.id);
```

### Formatação de preço
```js
const formatarPreco = (valor) =>
  new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(Number(valor));
```

---

## 9. Erros esperados e o que mostrar ao usuário

| Erro (código)                                                              | Causa provável | Mensagem sugerida |
|----------------------------------------------------------------------------|----------------|-------------------|
| `new row violates row-level security policy` (`42501`)                     | Quem tentou não é vendedor, ou tentou gravar em nome de outro | "Apenas vendedores podem fazer isso." |
| `violates foreign key constraint "livros_vendedor_id_fkey"` (`23503`)      | Vendedor ainda sem loja | "Crie sua loja antes de cadastrar livros." |
| `violates foreign key constraint "itens_pedido_livro_id_fkey"` (`23503`) ao excluir livro | O livro já aparece em pedidos | "Este livro já foi vendido e não pode ser excluído. Desative-o para tirá-lo da vitrine." |
| `duplicate key value violates unique constraint "lojas_pkey"` (`23505`)    | Vendedor já tem loja | "Você já possui uma loja." |
| `duplicate key ... "favoritos_user_id_livro_id_key"` (`23505`)             | Livro já favoritado | Tratar como sucesso (já está nos favoritos) |
| `livros_preco_check` / `livros_estoque_check` (`23514`)                    | Valor negativo | "Preço e estoque não podem ser negativos." |
| `permission denied for table profiles` (`42501`)                           | Update em coluna travada (`tipo`, `created_at`, `updated_at`) ou insert em `profiles` | Não deve acontecer: o front só atualiza `nome` e `avatar_url` |
| `PGRST116` em `.single()`                                                  | Nenhuma linha encontrada (ou bloqueada pela RLS) | 404 / "Livro não encontrado." |
| `update`/`delete` sem erro, com `data` vazio                               | A RLS filtrou: a linha não pertence ao usuário | "Você não pode alterar este livro." |

---

## 10. Regras para quem for escrever o código

- **JavaScript**, não TypeScript. Interface toda em **português**.
- **Não alterar o banco** (ver seção 1).
- **Nunca consultar `profiles` de outro usuário.** Para mostrar quem vende um livro, use `lojas`.
- **Nunca inserir em `profiles`** e nunca enviar `tipo`, `created_at` ou `updated_at` em update.
- **Não enviar `id` nem `vendedor_id`** nos inserts de `livros` e `lojas`.
- Em `livros`, a descrição se chama **`sinopse`**, e a data se chama **`created_at`** (não `criado_em`).
- Proteger as rotas do vendedor no front (redirecionar quem não é vendedor), lembrando que isso é só UX: a RLS é a proteção real.
- Converter o preço digitado com vírgula para número antes de enviar.
- Tratar os erros da seção 9 com mensagens amigáveis, sem expor o erro bruto ao usuário.
- Antes de começar, inspecionar a estrutura atual do projeto (rotas, componentes, cliente Supabase, páginas de login, cadastro, vitrine, favoritos e pedidos) e **adaptar-se ao que já existe**, em vez de recriar.

---

## 11. Tarefas a implementar

0. **Revisar o código existente**
   - Procurar qualquer `insert` ou `upsert` em `profiles` (por exemplo, logo após o `signUp`) e **remover**. Esse insert agora falha, porque o perfil é criado pelo trigger.
   - Procurar usos de `livros` que dependam de colunas antigas ou que esperem `descricao`/`criado_em`, e ajustar para `sinopse`/`created_at`.
   - Listar o que encontrou antes de alterar.

1. **Cadastro com tipo de conta**
   No formulário de cadastro, adicionar a escolha entre **Cliente** e **Vendedor** (radio, padrão Cliente). Enviar `nome` e `tipo` em `options.data`. Não há confirmação por e-mail: após o cadastro a conta já entra logada.

2. **Redirecionamento pós-login**
   Após o login, buscar o `tipo` em `profiles`. Vendedor vai para `/painel-vendedor` e cliente vai para `/`. Se o projeto já tiver rotas equivalentes, usar as existentes.

3. **Painel do vendedor (`/painel-vendedor`)**
   - Acesso só para vendedores (deslogado → login; cliente → `/`).
   - Sem loja: mostrar o formulário **Criar minha loja** (`nome_loja` obrigatório, `descricao` opcional).
   - Com loja: mostrar nome e descrição da loja (editáveis), a lista dos próprios livros (inclusive inativos, com indicação visual) e o botão **Cadastrar livro**.

4. **Cadastro e edição de livro**
   Formulário com `titulo`*, `autor`*, `categoria`, `sinopse`, `isbn`, `preco`*, `estoque`* e `capa_url` (URL opcional). Mesma tela para criar e editar. Na lista do painel: ações **Editar**, **Ativar/Desativar** e **Excluir** (com confirmação e tratamento do erro de livro com pedidos).

5. **Vitrine pública**
   Na página inicial, listar os livros ativos (capa, título, autor, preço formatado em R$ e nome da loja), mais recentes primeiro. Deve funcionar para usuários deslogados. Se já existir uma vitrine, adaptar em vez de recriar.

**Fora do escopo agora** (não implementar nem alterar): upload de capas (Supabase Storage), carrinho e checkout, alterações em pedidos e favoritos, aprovação de vendedores, recomendação de livros com IA.

---

## 12. Pendências conhecidas (para etapas futuras)

- `pedidos.total`, `pedidos.status` e `itens_pedido.preco_unitario` são enviados pelo front e **o banco não confere esses valores**. Na etapa de checkout, isso deve passar a ser feito por uma função no banco que calcula preço e total a partir de `livros`, valida estoque e só aceita livros ativos.
- O vendedor ainda **não vê os pedidos** que contêm os livros dele.
- Os livros ainda não têm upload de capa.