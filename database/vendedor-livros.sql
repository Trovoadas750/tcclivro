-- ============================================================
--  CASA DO LEITOR - Ajuste para o cadastro de livros do vendedor
-- ============================================================
--  PROPOSTA (ainda NÃO executada). Rode no Supabase -> SQL Editor.
--
--  Por que é necessário:
--   O formulário de livro do vendedor exige 2 fotos e o ano de
--   lançamento. A tabela `livros` só tem `capa_url` (uma URL em
--   texto) e não tem coluna de ano, e não existe bucket de fotos.
--
--  O que este script faz (não mexe em nada que já existe):
--   1. Adiciona `ano_lancamento` e `fotos` em `public.livros`.
--      `capa_url` continua sendo usada (recebe a 1ª foto), então
--      favoritos/pedidos que já leem `capa_url` seguem funcionando.
--   2. Cria o bucket público `livros-fotos` no Storage.
--   3. Cria policies: só vendedor envia fotos, e só na própria
--      pasta (`<auth.uid()>/arquivo.jpg`); cada um apaga só as suas.
--
--  Pode ser executado mais de uma vez sem erro.
-- ============================================================

-- 1) Novas colunas em livros -----------------------------------
alter table public.livros
  add column if not exists ano_lancamento smallint,
  add column if not exists fotos text[] not null default '{}';

do $$
begin
  if not exists (
    select 1 from pg_constraint where conname = 'livros_ano_lancamento_check'
  ) then
    alter table public.livros
      add constraint livros_ano_lancamento_check
      check (ano_lancamento is null or ano_lancamento between 1000 and 2100);
  end if;
end $$;

-- Garante a permissão de gravar as colunas novas (sem efeito se a
-- tabela já tiver grant geral de insert/update para authenticated).
grant insert (ano_lancamento, fotos), update (ano_lancamento, fotos)
  on public.livros to authenticated;

-- Atualiza o cache do PostgREST para a API enxergar as colunas novas.
notify pgrst, 'reload schema';

-- 2) Bucket de fotos ---------------------------------------------
insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values ('livros-fotos', 'livros-fotos', true, 5242880, array['image/jpeg', 'image/png', 'image/webp'])
on conflict (id) do nothing;

-- 3) Policies do bucket --------------------------------------------
drop policy if exists "Vendedor envia fotos dos livros" on storage.objects;
create policy "Vendedor envia fotos dos livros"
  on storage.objects for insert to authenticated
  with check (
    bucket_id = 'livros-fotos'
    and (storage.foldername(name))[1] = (select auth.uid())::text
    and public.is_vendedor()
  );

-- O Storage exige SELECT além de DELETE para remover arquivos.
-- (A leitura pública das imagens funciona pela URL pública do bucket.)
drop policy if exists "Vendedor vê as próprias fotos" on storage.objects;
create policy "Vendedor vê as próprias fotos"
  on storage.objects for select to authenticated
  using (
    bucket_id = 'livros-fotos'
    and (storage.foldername(name))[1] = (select auth.uid())::text
  );

drop policy if exists "Vendedor apaga as próprias fotos" on storage.objects;
create policy "Vendedor apaga as próprias fotos"
  on storage.objects for delete to authenticated
  using (
    bucket_id = 'livros-fotos'
    and (storage.foldername(name))[1] = (select auth.uid())::text
  );
