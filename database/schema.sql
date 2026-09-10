-- ============================================================
--  CASA DO LEITOR - Banco de Dados (PostgreSQL / Supabase)
-- ============================================================
--  Conversão do banco original (MariaDB) para PostgreSQL.
--  USO: no painel do Supabase -> SQL Editor, cole e execute.
--  Este script cria as tabelas E insere os dados de exemplo
--  (os mesmos dados estão em src/lib/mockData.js para o modo demo).
-- ============================================================

-- ------------------------------------------------------------
-- USUÁRIOS
-- ------------------------------------------------------------
CREATE TABLE IF NOT EXISTS usuarios (
  id          BIGSERIAL PRIMARY KEY,
  nome        VARCHAR(120)  NOT NULL,
  email       VARCHAR(160)  NOT NULL UNIQUE,
  senha_hash  VARCHAR(255)  NOT NULL,
  endereco    VARCHAR(255),
  cidade      VARCHAR(120),
  uf          CHAR(2),
  telefone    VARCHAR(30),
  criado_em   TIMESTAMPTZ   NOT NULL DEFAULT NOW()
);

-- ------------------------------------------------------------
-- CATEGORIAS
-- ------------------------------------------------------------
CREATE TABLE IF NOT EXISTS categorias (
  id    BIGSERIAL PRIMARY KEY,
  nome  VARCHAR(80)  NOT NULL,
  slug  VARCHAR(80)  NOT NULL UNIQUE,
  emoji VARCHAR(10)  DEFAULT 'book'
);

-- ------------------------------------------------------------
-- LIVROS
-- ------------------------------------------------------------
CREATE TABLE IF NOT EXISTS livros (
  id              BIGSERIAL PRIMARY KEY,
  titulo          VARCHAR(180)  NOT NULL,
  autor           VARCHAR(120)  NOT NULL,
  descricao       TEXT          NOT NULL,
  categoria_id    BIGINT REFERENCES categorias(id) ON DELETE SET NULL,
  preco           NUMERIC(10,2) NOT NULL,
  preco_original  NUMERIC(10,2),
  estoque         INTEGER       NOT NULL DEFAULT 0,
  paginas         INTEGER,
  ano_publicacao  SMALLINT,
  editora         VARCHAR(120),
  idioma          VARCHAR(40)   DEFAULT 'Português',
  capa_cor        VARCHAR(7)    DEFAULT '#4f46e5',
  avaliacao       NUMERIC(2,1)  NOT NULL DEFAULT 0,
  num_avaliacoes  INTEGER       NOT NULL DEFAULT 0,
  vendas          INTEGER       NOT NULL DEFAULT 0,
  destaque        BOOLEAN       NOT NULL DEFAULT FALSE,
  criado_em       TIMESTAMPTZ   NOT NULL DEFAULT NOW()
);

-- Índice de busca de texto (substitui o FULLTEXT do MySQL)
CREATE INDEX IF NOT EXISTS idx_livros_busca ON livros
  USING GIN (to_tsvector('portuguese', titulo || ' ' || autor || ' ' || descricao));

-- ------------------------------------------------------------
-- TAGS (usadas pelo motor de recomendação "IA")
-- ------------------------------------------------------------
CREATE TABLE IF NOT EXISTS tags (
  id   BIGSERIAL PRIMARY KEY,
  nome VARCHAR(60) NOT NULL UNIQUE
);

CREATE TABLE IF NOT EXISTS livro_tags (
  livro_id BIGINT NOT NULL REFERENCES livros(id) ON DELETE CASCADE,
  tag_id   BIGINT NOT NULL REFERENCES tags(id)   ON DELETE CASCADE,
  peso     SMALLINT NOT NULL DEFAULT 1,
  PRIMARY KEY (livro_id, tag_id)
);

-- ------------------------------------------------------------
-- FAVORITOS
-- ------------------------------------------------------------
CREATE TABLE IF NOT EXISTS favoritos (
  usuario_id BIGINT NOT NULL REFERENCES usuarios(id) ON DELETE CASCADE,
  livro_id   BIGINT NOT NULL REFERENCES livros(id)   ON DELETE CASCADE,
  criado_em  TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  PRIMARY KEY (usuario_id, livro_id)
);

-- ------------------------------------------------------------
-- CARRINHO
-- ------------------------------------------------------------
CREATE TABLE IF NOT EXISTS carrinho (
  id         BIGSERIAL PRIMARY KEY,
  usuario_id BIGINT REFERENCES usuarios(id) ON DELETE CASCADE,
  sessao_id  VARCHAR(64),
  livro_id   BIGINT NOT NULL REFERENCES livros(id) ON DELETE CASCADE,
  quantidade INTEGER NOT NULL DEFAULT 1,
  criado_em  TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS idx_carrinho_owner ON carrinho (usuario_id, sessao_id);

-- ------------------------------------------------------------
-- PEDIDOS
-- ------------------------------------------------------------
CREATE TABLE IF NOT EXISTS pedidos (
  id              BIGSERIAL PRIMARY KEY,
  codigo          VARCHAR(20)   NOT NULL UNIQUE,
  usuario_id      BIGINT NOT NULL REFERENCES usuarios(id) ON DELETE CASCADE,
  total           NUMERIC(10,2) NOT NULL,
  subtotal        NUMERIC(10,2) NOT NULL,
  frete           NUMERIC(10,2) NOT NULL DEFAULT 0,
  forma_pagamento VARCHAR(40)   NOT NULL DEFAULT 'Cartão de crédito',
  status          VARCHAR(30)   NOT NULL DEFAULT 'pagamento_aprovado',
  endereco        VARCHAR(255)  NOT NULL,
  cidade          VARCHAR(120)  NOT NULL,
  uf              CHAR(2)       NOT NULL,
  criado_em       TIMESTAMPTZ   NOT NULL DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS idx_pedidos_usuario ON pedidos (usuario_id);

CREATE TABLE IF NOT EXISTS pedido_itens (
  id         BIGSERIAL PRIMARY KEY,
  pedido_id  BIGINT NOT NULL REFERENCES pedidos(id) ON DELETE CASCADE,
  livro_id   BIGINT NOT NULL REFERENCES livros(id)  ON DELETE RESTRICT,
  preco      NUMERIC(10,2) NOT NULL,
  quantidade INTEGER NOT NULL DEFAULT 1
);

-- ------------------------------------------------------------
-- RASTREIO DA ENTREGA (fictício)
-- ------------------------------------------------------------
CREATE TABLE IF NOT EXISTS rastreio (
  id          BIGSERIAL PRIMARY KEY,
  pedido_id   BIGINT NOT NULL REFERENCES pedidos(id) ON DELETE CASCADE,
  etapa       VARCHAR(60)  NOT NULL,
  local       VARCHAR(120),
  descricao   VARCHAR(255),
  data_evento TIMESTAMPTZ  NOT NULL
);
CREATE INDEX IF NOT EXISTS idx_rastreio_pedido ON rastreio (pedido_id);

-- ------------------------------------------------------------
-- AVALIAÇÕES
-- ------------------------------------------------------------
CREATE TABLE IF NOT EXISTS avaliacoes (
  id         BIGSERIAL PRIMARY KEY,
  livro_id   BIGINT NOT NULL REFERENCES livros(id)   ON DELETE CASCADE,
  usuario_id BIGINT NOT NULL REFERENCES usuarios(id) ON DELETE CASCADE,
  nota       SMALLINT NOT NULL DEFAULT 5,
  comentario VARCHAR(500),
  criado_em  TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ============================================================
--  SEED - CATEGORIAS
-- ============================================================
INSERT INTO categorias (id, nome, slug, emoji) VALUES
  (1, 'Ficção & Fantasia',   'ficcao-fantasia',   'dragon'),
  (2, 'Romance',             'romance',           'heart'),
  (3, 'Mistério & Suspense', 'misterio-suspense', 'detective'),
  (4, 'Ficção Científica',   'ficcao-cientifica', 'rocket'),
  (5, 'Tecnologia & Ciência','tecnologia-ciencia','cpu'),
  (6, 'Biografia',           'biografia',         'user'),
  (7, 'Autoajuda',           'autoajuda',         'sprout'),
  (8, 'Infantil',            'infantil',          'toy')
ON CONFLICT (id) DO NOTHING;

-- ============================================================
--  SEED - TAGS
-- ============================================================
INSERT INTO tags (nome) VALUES
  ('aventura'),('amor'),('drama'),('acao'),('misterio'),('suspense'),
  ('futurista'),('espaco'),('magia'),('espada'),('mundo fantastico'),
  ('tecnologia'),('programacao'),('inteligencia artificial'),('dados'),
  ('superacao'),('motivacao'),('reflexao'),('medo'),('terror'),
  ('fantasia'),('ficcao cientifica'),('historia'),('guerra'),('politica'),
  ('filosofia'),('empreendedorismo'),('infancia'),('amizade'),('familia')
ON CONFLICT (nome) DO NOTHING;

-- ============================================================
--  SEED - LIVROS (mesmos dados de src/lib/mockData.js)
-- ============================================================
INSERT INTO livros (id, titulo, autor, descricao, categoria_id, preco, preco_original, estoque, paginas, ano_publicacao, editora, capa_cor, avaliacao, num_avaliacoes, vendas, destaque) VALUES
(1, 'A Jornada do Guardião', 'Mariana Alves', 'Um jovem aprendiz descobre um portal magico escondido na biblioteca da vila e parte em uma aventura epica para salvar o reino das sombras. Uma historia de coragem, magia e amizade.', 1, 49.90, 64.90, 12, 384, 2023, 'Editora Horizonte', '#4f46e5', 4.8, 214, 1850, TRUE),
(2, 'O Reino das Cinzas', 'Rafael Castro', 'Apos a queda de um imperio, uma princesa exilada precisa reunir aliados improvaveis para retomar o trono. Fantasia politica com reviravoltas de tirar o folego.', 1, 44.50, 59.90, 8, 452, 2022, 'Editora Horizonte', '#7c3aed', 4.6, 158, 1240, TRUE),
(3, 'Amores de Verão', 'Camila Duarte', 'Uma fotógrafa carioca e um chef de cozinha se reencontram em uma cidadezinha litorânea depois de dez anos. Romance leve, emocionante e cheio de esperança.', 2, 39.90, 49.90, 20, 288, 2024, 'Editora Primavera', '#ec4899', 4.7, 342, 2100, TRUE),
(4, 'O Segredo do Lago', 'Henrique Fontes', 'Quando um corpo é encontrado em um lago congelado, a detetive Clara precisa desvendar os segredos de uma pequena cidade que prefere esquecer o passado.', 3, 54.90, 69.90, 6, 412, 2021, 'Editora Noite', '#0f766e', 4.5, 97, 980, TRUE),
(5, 'Marte: O Despertar', 'Pedro Silveira', 'A primeira colonia humana em Marte descobre algo enterrado nas profundezas do planeta. Ficção científica que mistura exploração espacial e suspense.', 4, 59.90, 74.90, 4, 498, 2023, 'Editora Órbita', '#0891b2', 4.4, 121, 760, TRUE),
(6, 'IA na Prática', 'Helena Ramos', 'Um guia acessível para entender e aplicar inteligência artificial em projetos reais: machine learning, redes neurais e ética algorítmica com exemplos práticos.', 5, 89.90, 119.90, 25, 360, 2024, 'Editora Byte', '#059669', 4.9, 289, 3200, TRUE),
(7, 'A Arte da Programação Limpa', 'Vicente Nogueira', 'Princípios e boas práticas para escrever código legível, sustentável e elegante, com exemplos em PHP, Python e JavaScript.', 5, 79.90, 99.90, 18, 328, 2022, 'Editora Byte', '#10b981', 4.8, 176, 1900, TRUE),
(8, 'Uma Vida em Movimento', 'Beatriz Linhares', 'A biografia de uma atleta brasileira que superou todas as adversidades para conquistar o mundo.', 6, 49.90, 59.90, 10, 340, 2021, 'Editora Gente', '#f59e0b', 4.6, 88, 620, FALSE),
(9, 'O Poder do Hábito Diário', 'Jorge Tavares', 'Como pequenas mudanças diárias podem transformar completamente sua produtividade e bem-estar. Método simples, baseado em neurociência.', 7, 42.90, 54.90, 30, 256, 2023, 'Editora Mente', '#84cc16', 4.7, 401, 2800, TRUE),
(10, 'Noites de Medo', 'Letícia Moura', 'Cinco histórias de terror psicológico que exploram os medos mais profundos do ser humano em cenários cotidianos e perturbadores.', 3, 47.90, 59.90, 7, 312, 2020, 'Editora Noite', '#334155', 4.2, 64, 540, FALSE),
(11, 'O Código do Futuro', 'Douglas Farias', 'Uma visão prática do que vem pela frente: computação quântica, biotecnologia e as profissões que serão criadas na próxima década.', 5, 69.90, 89.90, 14, 296, 2024, 'Editora Byte', '#0d9488', 4.5, 73, 480, FALSE),
(12, 'Corações em Guerra', 'Renata Prado', 'Em meio à Segunda Guerra Mundial, dois médicos de lados opostos se apaixonam em um hospital improvisado. Drama histórico arrebatador.', 2, 52.90, 64.90, 9, 420, 2019, 'Editora Horizonte', '#b91c1c', 4.9, 523, 4100, TRUE),
(13, 'As Fronteiras do Universo', 'Otávio Mendes', 'Uma jornada visual e científica pelo cosmos: buracos negros, exoplanetas e o que há além da nossa galáxia, explicado para todos.', 4, 74.90, 99.90, 11, 240, 2023, 'Editora Órbita', '#6366f1', 4.7, 145, 890, FALSE),
(14, 'A Biblioteca dos Sonhos', 'Sofia Avelar', 'Uma bibliotecária descobre que pode entrar nos livros e alterar finais. Encantadora mistura de fantasia e romance para todas as idades.', 1, 46.90, 58.90, 16, 352, 2022, 'Editora Primavera', '#9333ea', 4.8, 267, 1750, TRUE),
(15, 'O Mistério do Expresso Noturno', 'Cláudio Mendes', 'Um assassinato a bordo de um trem de luxo e dez passageiros com motivos para terem cometido o crime. Um clássico whodunit moderno.', 3, 55.90, 69.90, 5, 380, 2023, 'Editora Noite', '#1e293b', 4.6, 134, 1100, FALSE),
(16, 'Herdeira do Trovão', 'Gustavo Braga', 'Numa terra onde o clima responde à vontade dos deuses, uma jovem com poder sobre as tempestades tenta impedir uma guerra profetizada.', 1, 48.90, 62.90, 13, 470, 2023, 'Editora Horizonte', '#2563eb', 4.7, 189, 1350, FALSE),
(17, 'Somos Nós', 'Larissa Menezes', 'Duas amigas de infância, separadas pelo destino, se reencontram e descobrem que o amor nunca foi só amizade. Romance contemporâneo sensível.', 2, 36.90, 45.90, 22, 264, 2021, 'Editora Primavera', '#f43f5e', 4.5, 211, 1600, FALSE),
(18, 'O Algoritmo da Felicidade', 'Carlos Amaro', 'Neurocientista mostra como a ciência de dados e a psicologia podem se combinar para criar rotinas mais felizes e produtivas.', 5, 64.90, 79.90, 17, 304, 2022, 'Editora Byte', '#14b8a6', 4.6, 92, 720, FALSE),
(19, 'O Menino que Falava com Estrelas', 'Ana Vitória Sales', 'História infantil sobre um menino que constrói um telescópio caseiro e viaja pelo universo com sua imaginação. Para ler em família.', 8, 29.90, 39.90, 28, 48, 2023, 'Editora Primavera', '#facc15', 5.0, 178, 2300, TRUE),
(20, 'O Grande Rei da Floresta', 'Thiago Morais', 'Um leãozinho medroso precisa encontrar coragem para liderar a floresta. Livro ilustrado sobre autoestima e amizade para crianças.', 8, 32.90, 39.90, 24, 56, 2024, 'Editora Mente', '#fb923c', 4.9, 141, 1750, FALSE)
ON CONFLICT (id) DO NOTHING;

-- ============================================================
--  SEED - LIVRO_TAGS (vínculo livro <-> tags para o motor de IA)
-- ============================================================
INSERT INTO livro_tags (livro_id, tag_id, peso) VALUES
  (1, 1, 3),(1, 9, 3),(1, 21, 2),(1, 29, 1),(1, 24, 1),
  (2, 1, 2),(2, 21, 3),(2, 24, 2),(2, 25, 2),
  (3, 2, 3),(3, 3, 1),(3, 23, 1),
  (4, 5, 3),(4, 6, 3),(4, 18, 1),
  (5, 7, 2),(5, 8, 3),(5, 22, 3),(5, 6, 2),
  (6, 14, 3),(6, 13, 2),(6, 12, 2),
  (7, 13, 3),(7, 12, 3),(7, 14, 2),
  (8, 16, 3),(8, 17, 2),(8, 19, 1),
  (9, 17, 3),(9, 16, 2),(9, 26, 2),
  (10, 20, 3),(10, 19, 3),(10, 5, 2),
  (11, 13, 2),(11, 14, 2),(11, 7, 2),
  (12, 2, 3),(12, 3, 2),(12, 24, 2),(12, 23, 3),
  (13, 8, 3),(13, 22, 2),
  (14, 9, 2),(14, 21, 3),(14, 2, 2),
  (15, 5, 3),(15, 6, 2),
  (16, 21, 3),(16, 1, 2),(16, 24, 1),
  (17, 2, 3),(17, 29, 2),
  (18, 14, 2),(18, 13, 1),(18, 26, 2),(18, 16, 2),
  (19, 8, 3),(19, 27, 2),(19, 29, 2),
  (20, 29, 3),(20, 27, 2),(20, 16, 2)
ON CONFLICT DO NOTHING;

-- ============================================================
--  SEED - USUÁRIO DEMO (senha: 123456)
-- ============================================================
INSERT INTO usuarios (id, nome, email, senha_hash, endereco, cidade, uf, telefone) VALUES
(1, 'Cliente Demo', 'demo@casadoleitor.com', '$2y$12$PrhEpZRj/JqRhLeNdY3HNuTgRn4hHiBYaT5xfGUc/iyDrYKkrV1yS', 'Rua das Letras, 123', 'São Paulo', 'SP', '(11) 99999-0000')
ON CONFLICT (id) DO NOTHING;

-- ============================================================
--  SEED - PEDIDO EXEMPLO com rastreio (tela de acompanhamento)
-- ============================================================
INSERT INTO pedidos (id, codigo, usuario_id, total, subtotal, frete, forma_pagamento, status, endereco, cidade, uf, criado_em) VALUES
(1, 'CDL-2026-001', 1, 162.70, 142.70, 20.00, 'Cartão de crédito', 'em_transito', 'Rua das Letras, 123', 'São Paulo', 'SP', NOW() - INTERVAL '3 days')
ON CONFLICT (id) DO NOTHING;

INSERT INTO pedido_itens (pedido_id, livro_id, preco, quantidade) VALUES
  (1, 6, 89.90, 1),
  (1, 19, 29.90, 1),
  (1, 3, 39.90, 1);

INSERT INTO rastreio (pedido_id, etapa, local, descricao, data_evento) VALUES
  (1, 'Pedido recebido',        'São Paulo - SP',         'Pedido confirmado e aguardando pagamento.',        NOW() - INTERVAL '3 days'),
  (1, 'Pagamento aprovado',     'São Paulo - SP',         'Pagamento aprovado com sucesso.',                   NOW() - INTERVAL '3 days'),
  (1, 'Em separação',           'Centro de Distribuição', 'Pedido separado e embalado.',                       NOW() - INTERVAL '2 days'),
  (1, 'Despachado',             'Centro de Distribuição', 'Pedido entregue à transportadora.',                 NOW() - INTERVAL '1 day'),
  (1, 'Em trânsito',            'Curitiba - PR',          'Pedido a caminho do destino.',                      NOW() - INTERVAL '6 hours');