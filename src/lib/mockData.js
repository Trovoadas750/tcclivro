/**
 * ============================================================
 *  CASA DO LEITOR - Dados de demonstração (mock)
 * ============================================================
 *  Este arquivo contém uma cópia fiel do seed (INSERTs) do banco
 *  original (database/schema.sql), em formato JavaScript.
 *
 *  ENQUANTO A CONEXÃO COM O SUPABASE ESTIVER DESATIVADA
 *  (ver src/lib/supabase.js -> DB_ATIVO = false), os repositórios
 *  (src/lib/repositories/livroRepository.js) devolvem estes dados,
 *  para que a interface funcione 100% como se o banco existisse.
 *
 *  Quando o banco for ativado, estes dados podem ser apagados ou
 *  mantidos apenas como fallback de desenvolvimento.
 * ============================================================
 */

/**
 * Categorias do catálogo.
 * `icone` é o nome do PNG em /public/emoji/ (sem extensão).
 * No banco original o campo era `emoji`; aqui mapeamos para um
 * PNG existente, já que nem todo emoji tem arquivo de imagem.
 */
export const CATEGORIAS = [
  { id: 1, nome: 'Ficção & Fantasia',   slug: 'ficcao-fantasia',   icone: 'espada' },
  { id: 2, nome: 'Romance',             slug: 'romance',           icone: 'coracao' },
  { id: 3, nome: 'Mistério & Suspense', slug: 'misterio-suspense', icone: 'lupa-misterio' },
  { id: 4, nome: 'Ficção Científica',   slug: 'ficcao-cientifica', icone: 'raio' },
  { id: 5, nome: 'Tecnologia & Ciência',slug: 'tecnologia-ciencia',icone: 'cerebro' },
  { id: 6, nome: 'Biografia',           slug: 'biografia',         icone: 'usuario' },
  { id: 7, nome: 'Autoajuda',           slug: 'autoajuda',         icone: 'lampada' },
  { id: 8, nome: 'Infantil',            slug: 'infantil',          icone: 'novo' },
];

/**
 * Tags temáticas usadas pelo motor de recomendação "IA"
 * (tabelas `tags` e `livro_tags` do banco original).
 */
export const TAGS = [
  'aventura', 'amor', 'drama', 'acao', 'misterio', 'suspense',
  'futurista', 'espaco', 'magia', 'espada', 'mundo fantastico',
  'tecnologia', 'programacao', 'inteligencia artificial', 'dados',
  'superacao', 'motivacao', 'reflexao', 'medo', 'terror',
  'fantasia', 'ficcao cientifica', 'historia', 'guerra', 'politica',
  'filosofia', 'empreendedorismo', 'infancia', 'amizade', 'familia',
];

/** Vínculo livro <-> tag com peso (livro_tags). */
export const LIVRO_TAGS = [
  [1, 1, 3], [1, 9, 3], [1, 21, 2], [1, 29, 1], [1, 24, 1],
  [2, 1, 2], [2, 21, 3], [2, 24, 2], [2, 25, 2],
  [3, 2, 3], [3, 3, 1], [3, 23, 1],
  [4, 5, 3], [4, 6, 3], [4, 18, 1],
  [5, 7, 2], [5, 8, 3], [5, 22, 3], [5, 6, 2],
  [6, 14, 3], [6, 13, 2], [6, 12, 2],
  [7, 13, 3], [7, 12, 3], [7, 14, 2],
  [8, 16, 3], [8, 17, 2], [8, 19, 1],
  [9, 17, 3], [9, 16, 2], [9, 26, 2],
  [10, 20, 3], [10, 19, 3], [10, 5, 2],
  [11, 13, 2], [11, 14, 2], [11, 7, 2],
  [12, 2, 3], [12, 3, 2], [12, 24, 2], [12, 23, 3],
  [13, 8, 3], [13, 22, 2],
  [14, 9, 2], [14, 21, 3], [14, 2, 2],
  [15, 5, 3], [15, 6, 2],
  [16, 21, 3], [16, 1, 2], [16, 24, 1],
  [17, 2, 3], [17, 29, 2],
  [18, 14, 2], [18, 13, 1], [18, 26, 2], [18, 16, 2],
  [19, 8, 3], [19, 27, 2], [19, 29, 2],
  [20, 29, 3], [20, 27, 2], [20, 16, 2],
];

/**
 * Livros do acervo (tabela `livros`).
 * Campos espelhados do banco: id, titulo, autor, descricao,
 * categoriaId, preco, precoOriginal, estoque, paginas,
 * anoPublicacao, editora, capaCor, avaliacao, numAvaliacoes,
 * vendas, destaque.
 */
export const LIVROS = [
  { id: 1, titulo: 'A Jornada do Guardião', autor: 'Mariana Alves', descricao: 'Um jovem aprendiz descobre um portal magico escondido na biblioteca da vila e parte em uma aventura epica para salvar o reino das sombras. Uma historia de coragem, magia e amizade.', categoriaId: 1, preco: 49.90, precoOriginal: 64.90, estoque: 12, paginas: 384, anoPublicacao: 2023, editora: 'Editora Horizonte', capaCor: '#4f46e5', avaliacao: 4.8, numAvaliacoes: 214, vendas: 1850, destaque: 1 },
  { id: 2, titulo: 'O Reino das Cinzas', autor: 'Rafael Castro', descricao: 'Apos a queda de um imperio, uma princesa exilada precisa reunir aliados improvaveis para retomar o trono. Fantasia politica com reviravoltas de tirar o folego.', categoriaId: 1, preco: 44.50, precoOriginal: 59.90, estoque: 8, paginas: 452, anoPublicacao: 2022, editora: 'Editora Horizonte', capaCor: '#7c3aed', avaliacao: 4.6, numAvaliacoes: 158, vendas: 1240, destaque: 1 },
  { id: 3, titulo: 'Amores de Verão', autor: 'Camila Duarte', descricao: 'Uma fotógrafa carioca e um chef de cozinha se reencontram em uma cidadezinha litorânea depois de dez anos. Romance leve, emocionante e cheio de esperança.', categoriaId: 2, preco: 39.90, precoOriginal: 49.90, estoque: 20, paginas: 288, anoPublicacao: 2024, editora: 'Editora Primavera', capaCor: '#ec4899', avaliacao: 4.7, numAvaliacoes: 342, vendas: 2100, destaque: 1 },
  { id: 4, titulo: 'O Segredo do Lago', autor: 'Henrique Fontes', descricao: 'Quando um corpo é encontrado em um lago congelado, a detetive Clara precisa desvendar os segredos de uma pequena cidade que prefere esquecer o passado.', categoriaId: 3, preco: 54.90, precoOriginal: 69.90, estoque: 6, paginas: 412, anoPublicacao: 2021, editora: 'Editora Noite', capaCor: '#0f766e', avaliacao: 4.5, numAvaliacoes: 97, vendas: 980, destaque: 1 },
  { id: 5, titulo: 'Marte: O Despertar', autor: 'Pedro Silveira', descricao: 'A primeira colonia humana em Marte descobre algo enterrado nas profundezas do planeta. Ficção científica que mistura exploração espacial e suspense.', categoriaId: 4, preco: 59.90, precoOriginal: 74.90, estoque: 4, paginas: 498, anoPublicacao: 2023, editora: 'Editora Órbita', capaCor: '#0891b2', avaliacao: 4.4, numAvaliacoes: 121, vendas: 760, destaque: 1 },
  { id: 6, titulo: 'IA na Prática', autor: 'Helena Ramos', descricao: 'Um guia acessível para entender e aplicar inteligência artificial em projetos reais: machine learning, redes neurais e ética algorítmica com exemplos práticos.', categoriaId: 5, preco: 89.90, precoOriginal: 119.90, estoque: 25, paginas: 360, anoPublicacao: 2024, editora: 'Editora Byte', capaCor: '#059669', avaliacao: 4.9, numAvaliacoes: 289, vendas: 3200, destaque: 1 },
  { id: 7, titulo: 'A Arte da Programação Limpa', autor: 'Vicente Nogueira', descricao: 'Princípios e boas práticas para escrever código legível, sustentável e elegante, com exemplos em PHP, Python e JavaScript.', categoriaId: 5, preco: 79.90, precoOriginal: 99.90, estoque: 18, paginas: 328, anoPublicacao: 2022, editora: 'Editora Byte', capaCor: '#10b981', avaliacao: 4.8, numAvaliacoes: 176, vendas: 1900, destaque: 1 },
  { id: 8, titulo: 'Uma Vida em Movimento', autor: 'Beatriz Linhares', descricao: 'A biografia de uma atleta brasileira que superou todas as adversidades para conquistar o mundo.', categoriaId: 6, preco: 49.90, precoOriginal: 59.90, estoque: 10, paginas: 340, anoPublicacao: 2021, editora: 'Editora Gente', capaCor: '#f59e0b', avaliacao: 4.6, numAvaliacoes: 88, vendas: 620, destaque: 0 },
  { id: 9, titulo: 'O Poder do Hábito Diário', autor: 'Jorge Tavares', descricao: 'Como pequenas mudanças diárias podem transformar completamente sua produtividade e bem-estar. Método simples, baseado em neurociência.', categoriaId: 7, preco: 42.90, precoOriginal: 54.90, estoque: 30, paginas: 256, anoPublicacao: 2023, editora: 'Editora Mente', capaCor: '#84cc16', avaliacao: 4.7, numAvaliacoes: 401, vendas: 2800, destaque: 1 },
  { id: 10, titulo: 'Noites de Medo', autor: 'Letícia Moura', descricao: 'Cinco histórias de terror psicológico que exploram os medos mais profundos do ser humano em cenários cotidianos e perturbadores.', categoriaId: 3, preco: 47.90, precoOriginal: 59.90, estoque: 7, paginas: 312, anoPublicacao: 2020, editora: 'Editora Noite', capaCor: '#334155', avaliacao: 4.2, numAvaliacoes: 64, vendas: 540, destaque: 0 },
  { id: 11, titulo: 'O Código do Futuro', autor: 'Douglas Farias', descricao: 'Uma visão prática do que vem pela frente: computação quântica, biotecnologia e as profissões que serão criadas na próxima década.', categoriaId: 5, preco: 69.90, precoOriginal: 89.90, estoque: 14, paginas: 296, anoPublicacao: 2024, editora: 'Editora Byte', capaCor: '#0d9488', avaliacao: 4.5, numAvaliacoes: 73, vendas: 480, destaque: 0 },
  { id: 12, titulo: 'Corações em Guerra', autor: 'Renata Prado', descricao: 'Em meio à Segunda Guerra Mundial, dois médicos de lados opostos se apaixonam em um hospital improvisado. Drama histórico arrebatador.', categoriaId: 2, preco: 52.90, precoOriginal: 64.90, estoque: 9, paginas: 420, anoPublicacao: 2019, editora: 'Editora Horizonte', capaCor: '#b91c1c', avaliacao: 4.9, numAvaliacoes: 523, vendas: 4100, destaque: 1 },
  { id: 13, titulo: 'As Fronteiras do Universo', autor: 'Otávio Mendes', descricao: 'Uma jornada visual e científica pelo cosmos: buracos negros, exoplanetas e o que há além da nossa galáxia, explicado para todos.', categoriaId: 4, preco: 74.90, precoOriginal: 99.90, estoque: 11, paginas: 240, anoPublicacao: 2023, editora: 'Editora Órbita', capaCor: '#6366f1', avaliacao: 4.7, numAvaliacoes: 145, vendas: 890, destaque: 0 },
  { id: 14, titulo: 'A Biblioteca dos Sonhos', autor: 'Sofia Avelar', descricao: 'Uma bibliotecária descobre que pode entrar nos livros e alterar finais. Encantadora mistura de fantasia e romance para todas as idades.', categoriaId: 1, preco: 46.90, precoOriginal: 58.90, estoque: 16, paginas: 352, anoPublicacao: 2022, editora: 'Editora Primavera', capaCor: '#9333ea', avaliacao: 4.8, numAvaliacoes: 267, vendas: 1750, destaque: 1 },
  { id: 15, titulo: 'O Mistério do Expresso Noturno', autor: 'Cláudio Mendes', descricao: 'Um assassinato a bordo de um trem de luxo e dez passageiros com motivos para terem cometido o crime. Um clássico whodunit moderno.', categoriaId: 3, preco: 55.90, precoOriginal: 69.90, estoque: 5, paginas: 380, anoPublicacao: 2023, editora: 'Editora Noite', capaCor: '#1e293b', avaliacao: 4.6, numAvaliacoes: 134, vendas: 1100, destaque: 0 },
  { id: 16, titulo: 'Herdeira do Trovão', autor: 'Gustavo Braga', descricao: 'Numa terra onde o clima responde à vontade dos deuses, uma jovem com poder sobre as tempestades tenta impedir uma guerra profetizada.', categoriaId: 1, preco: 48.90, precoOriginal: 62.90, estoque: 13, paginas: 470, anoPublicacao: 2023, editora: 'Editora Horizonte', capaCor: '#2563eb', avaliacao: 4.7, numAvaliacoes: 189, vendas: 1350, destaque: 0 },
  { id: 17, titulo: 'Somos Nós', autor: 'Larissa Menezes', descricao: 'Duas amigas de infância, separadas pelo destino, se reencontram e descobrem que o amor nunca foi só amizade. Romance contemporâneo sensível.', categoriaId: 2, preco: 36.90, precoOriginal: 45.90, estoque: 22, paginas: 264, anoPublicacao: 2021, editora: 'Editora Primavera', capaCor: '#f43f5e', avaliacao: 4.5, numAvaliacoes: 211, vendas: 1600, destaque: 0 },
  { id: 18, titulo: 'O Algoritmo da Felicidade', autor: 'Carlos Amaro', descricao: 'Neurocientista mostra como a ciência de dados e a psicologia podem se combinar para criar rotinas mais felizes e produtivas.', categoriaId: 5, preco: 64.90, precoOriginal: 79.90, estoque: 17, paginas: 304, anoPublicacao: 2022, editora: 'Editora Byte', capaCor: '#14b8a6', avaliacao: 4.6, numAvaliacoes: 92, vendas: 720, destaque: 0 },
  { id: 19, titulo: 'O Menino que Falava com Estrelas', autor: 'Ana Vitória Sales', descricao: 'História infantil sobre um menino que constrói um telescópio caseiro e viaja pelo universo com sua imaginação. Para ler em família.', categoriaId: 8, preco: 29.90, precoOriginal: 39.90, estoque: 28, paginas: 48, anoPublicacao: 2023, editora: 'Editora Primavera', capaCor: '#facc15', avaliacao: 5.0, numAvaliacoes: 178, vendas: 2300, destaque: 1 },
  { id: 20, titulo: 'O Grande Rei da Floresta', autor: 'Thiago Morais', descricao: 'Um leãozinho medroso precisa encontrar coragem para liderar a floresta. Livro ilustrado sobre autoestima e amizade para crianças.', categoriaId: 8, preco: 32.90, precoOriginal: 39.90, estoque: 24, paginas: 56, anoPublicacao: 2024, editora: 'Editora Mente', capaCor: '#fb923c', avaliacao: 4.9, numAvaliacoes: 141, vendas: 1750, destaque: 0 },
];

/** Avaliações de exemplo (tabela `avaliacoes`). */
export const AVALIACOES = [
  { id: 1, livroId: 1, usuario: 'Cliente Demo', nota: 5, comentario: 'Simplesmente incrível! Não consegui parar de ler até o final.', criadoEm: '2026-07-10T14:00:00' },
  { id: 2, livroId: 1, usuario: 'Marina P.', nota: 5, comentario: 'A mistura de magia e amizade é encantadora.', criadoEm: '2026-06-22T10:30:00' },
  { id: 3, livroId: 3, usuario: 'João C.', nota: 4, comentario: 'Romance leve e gostoso de ler, ótimo para o fim de semana.', criadoEm: '2026-07-02T18:00:00' },
  { id: 4, livroId: 6, usuario: 'Cliente Demo', nota: 5, comentario: 'O guia mais acessível de IA que já li. Recomendo!', criadoEm: '2026-05-18T09:15:00' },
  { id: 5, livroId: 12, usuario: 'Renata L.', nota: 5, comentario: 'Arrebatador do começo ao fim.', criadoEm: '2026-04-09T21:40:00' },
  { id: 6, livroId: 15, usuario: 'Carlos M.', nota: 4, comentario: 'Um whodunit moderno muito bem construído.', criadoEm: '2026-03-30T16:20:00' },
];

/**
 * Usuário demo (tabela `usuarios`).
 * Senha: 123456 — usada na tela de login para entrar na demo.
 */
export const USUARIO_DEMO = {
  id: 1,
  nome: 'Cliente Demo',
  email: 'demo@casadoleitor.com',
  senha: '12345a6',
  endereco: 'Ru das Letras, 123',
  cidade: 'São Paulo',
  uf: 'SP',
  telefone: '(11) 99999-0000',
};

/**
 * Pedido de exemplo com rastreio (tabelas `pedidos`,
 * `pedido_itens` e `rastreio`) — usado para demonstrar as telas
 * de "Meus pedidos" e "Rastreio" antes de existir banco.
 */
export const PEDIDO_DEMO = {
  id: 1,
  codigo: 'CDL-2026-001',
  usuarioId: 1,
  total: 162.7,
  subtotal: 142.7,
  frete: 20.0,
  formaPagamento: 'Cartão de crédito',
  status: 'em_transito',
  endereco: 'Rua das Letras, 123',
  cidade: 'São Paulo',
  uf: 'SP',
  criadoEm: '2026-08-14T09:00:00',
  itens: [
    { livroId: 6, preco: 89.9, quantidade: 1 },
    { livroId: 19, preco: 29.9, quantidade: 1 },
    { livroId: 3, preco: 39.9, quantidade: 1 },
  ],
  rastreio: [
    { etapa: 'Pedido recebido', local: 'São Paulo - SP', descricao: 'Pedido confirmado e aguardando pagamento.', dataEvento: '2026-08-14T09:00:00' },
    { etapa: 'Pagamento aprovado', local: 'São Paulo - SP', descricao: 'Pagamento aprovado com sucesso.', dataEvento: '2026-08-14T09:02:00' },
    { etapa: 'Em separação', local: 'Centro de Distribuição', descricao: 'Pedido separado e embalado.', dataEvento: '2026-08-15T10:00:00' },
    { etapa: 'Despachado', local: 'Centro de Distribuição', descricao: 'Pedido entregue à transportadora.', dataEvento: '2026-08-16T08:00:00' },
    { etapa: 'Em trânsito', local: 'Curitiba - PR', descricao: 'Pedido a caminho do destino.', dataEvento: '2026-08-17T03:00:00' },
  ],
};

/** Etapas canônicas do rastreio (ordem do fluxo de entrega). */
export const ETAPAS_RASTREIO = [
  { chave: 'pagamento_aprovado', label: 'Pagamento aprovado', icone: 'cartao' },
  { chave: 'em_separacao', label: 'Em separação', icone: 'pacote' },
  { chave: 'despachado', label: 'Despachado', icone: 'caminhao' },
  { chave: 'em_transito', label: 'Em trânsito', icone: 'caminhao' },
  { chave: 'entregue', label: 'Entregue', icone: 'local' },
];

/** Rótulos dos status de pedido. */
export const ROTULOS_STATUS = {
  pagamento_aprovado: 'Pagamento aprovado',
  em_separacao: 'Em separação',
  despachado: 'Despachado',
  em_transito: 'Em trânsito',
  entregue: 'Entregue',
};