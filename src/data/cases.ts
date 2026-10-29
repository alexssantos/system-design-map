import type { StudyCase } from './types';

// Fonte: board "Roadmap de System Design" no Miro (frames "Caso 01" a "Caso 15").
export const cases: StudyCase[] = [
  {
    id: 'url-shortener',
    number: 1,
    title: 'Encurtador de URL',
    examples: 'TinyURL e bit.ly',
    tier: 1,
    week: 5,
    summary:
      'Transforma URLs longas em links curtos e redireciona em milissegundos. Leitura pesada, com cerca de 100 leituras para cada escrita.',
    deepDive: [
      'Como dois servidores evitam gerar a mesma chave sem consultar um ponto central a cada requisição?',
      'Um link viralizou e recebe 50 mil acessos por segundo. O que quebra primeiro?',
      'Como contar cliques em tempo real sem atrasar o redirect?',
    ],
    project:
      'Encurtador com analytics: códigos base62 a partir de faixas de IDs, redirect 302 e cliques registrados de forma assíncrona em uma fila.',
  },
  {
    id: 'rate-limiter',
    number: 2,
    title: 'Rate limiter distribuído',
    examples: 'Limites de API do GitHub, da Stripe e da Cloudflare',
    tier: 1,
    week: 6,
    summary:
      'Controla quantas requisições cada cliente pode fazer em uma janela de tempo. Decide em cerca de 1 ms, com estado compartilhado entre réplicas.',
    deepDive: [
      'Como manter o limite correto com 20 réplicas da API atrás do load balancer?',
      'O Redis ficou indisponível. A API deve bloquear ou liberar tudo?',
      'Como aplicar limites diferentes para planos gratuito e pago?',
    ],
    project:
      'Middleware plugável com token bucket e janela deslizante sobre Redis (script Lua), regras por rota e métricas de bloqueios.',
  },
  {
    id: 'id-generator',
    number: 3,
    title: 'Gerador de IDs únicos',
    examples: 'Twitter Snowflake, Instagram e Discord',
    tier: 1,
    week: 7,
    summary:
      'Gera IDs únicos e ordenáveis por tempo em milhares de máquinas, sem coordenação a cada ID. Aparece quando o auto-increment deixa de servir.',
    deepDive: [
      'O que acontece se o relógio de uma máquina voltar 2 segundos?',
      'Como garantir que duas máquinas não usem o mesmo ID de worker?',
      'Por que um UUIDv4 como chave primária deixa as escritas mais lentas?',
    ],
    project:
      'Serviço gRPC de IDs de 64 bits estilo Snowflake, com ID de worker por lease no etcd e tratamento de relógio que volta.',
  },
  {
    id: 'leaderboard',
    number: 4,
    title: 'Leaderboard em tempo real',
    examples: 'Rankings de jogos, Duolingo e Strava',
    tier: 1,
    week: 9,
    summary:
      'Mantém o ranking de milhões de jogadores atualizado e responde o top 10 e a posição de qualquer usuário. Escolher a estrutura certa no cache.',
    deepDive: [
      'Como mostrar a posição de um jogador que está no meio de 100 milhões?',
      'Como montar o ranking semanal sem apagar o geral?',
      'O cache caiu. Como reconstruir o ranking sem derrubar o banco?',
    ],
    project:
      'Ranking ao vivo: resultados por fila, Sorted Sets no Redis e top 10 enviado por WebSocket ou SSE para um painel.',
  },
  {
    id: 'news-feed',
    number: 5,
    title: 'Feed de notícias',
    examples: 'X, Instagram e LinkedIn',
    tier: 2,
    week: 10,
    summary:
      'Monta a timeline de cada usuário com os posts de quem ele segue. A decisão central é montar o feed na escrita (push) ou na leitura (pull).',
    deepDive: [
      'Uma conta com 50 milhões de seguidores publica. O que acontece no seu design?',
      'Como paginar o feed sem repetir nem pular posts?',
      'Como o feed reflete um post apagado ou um unfollow?',
    ],
    project:
      'Mini rede social com fan-out via Kafka para listas no Redis e um flag para alternar entre push, pull e híbrido.',
  },
  {
    id: 'notifications',
    number: 6,
    title: 'Sistema de notificações',
    examples: 'Push, SMS e email de qualquer app',
    tier: 2,
    week: 11,
    summary:
      'Envia push, SMS e email para milhões de usuários a partir de eventos. Treina filas, retries e idempotência com provedores externos que falham.',
    deepDive: [
      'Como evitar enviar a mesma notificação duas vezes após um retry?',
      'O provedor de SMS ficou fora por 1 hora. O que acontece com a fila?',
      'Como enviar 10 milhões de mensagens de uma campanha sem atrasar as transacionais?',
    ],
    project:
      'Serviço multicanal que consome eventos, aplica preferências e templates e envia com retries, DLQ e chave de idempotência.',
  },
  {
    id: 'chat',
    number: 7,
    title: 'Chat em tempo real',
    examples: 'WhatsApp, Slack e Discord',
    tier: 2,
    week: 13,
    summary:
      'Entrega mensagens individuais e em grupo em tempo real, com histórico, presença e confirmação de leitura.',
    deepDive: [
      'Como uma mensagem chega ao destinatário conectado em outro servidor?',
      'Como garantir a ordem das mensagens em um grupo com 500 pessoas?',
      'O que acontece quando o celular fica offline por 3 dias?',
    ],
    project:
      'Servidores WebSocket atrás de um load balancer, Redis Pub/Sub ou NATS para rotear entre nós, histórico persistido e recibos de leitura.',
  },
  {
    id: 'autocomplete',
    number: 8,
    title: 'Autocomplete de busca',
    examples: 'Google, Amazon e barras de busca de apps',
    tier: 2,
    week: 14,
    summary:
      'Sugere as buscas mais populares enquanto a pessoa digita, abaixo de 100 ms. Treina estruturas de dados, pré-computação e cache em camadas.',
    deepDive: [
      'Como atualizar as sugestões quando um assunto vira tendência em minutos?',
      'A trie não cabe em uma máquina. Como dividir?',
      'Como reduzir as requisições enquanto a pessoa digita?',
    ],
    project:
      'Pipeline que agrega frequências de busca, gera uma trie serializada e um serviço em memória que responde o top 5 por prefixo.',
  },
  {
    id: 'web-crawler',
    number: 9,
    title: 'Web crawler',
    examples: 'Googlebot e Common Crawl',
    tier: 2,
    week: 15,
    summary:
      'Baixa bilhões de páginas de forma contínua, educada e sem repetição. Treina filas em larga escala, deduplicação e tolerância a falhas.',
    deepDive: [
      'Como evitar sobrecarregar um site pequeno com milhares de workers?',
      'Como detectar páginas duplicadas com URLs diferentes?',
      'Um worker morreu no meio do trabalho. Como retomar sem perder URLs?',
    ],
    project:
      'Crawler com frontier particionada por host, robots.txt, deduplicação com Bloom filter e páginas salvas em object storage.',
  },
  {
    id: 'kv-store',
    number: 10,
    title: 'Key-value store distribuído',
    examples: 'Amazon Dynamo, Cassandra e Riak',
    tier: 3,
    week: 16,
    summary:
      'Guarda pares chave-valor em dezenas de nós e continua aceitando leituras e escritas quando alguns falham. Junta particionamento, replicação, quóruns e consistência.',
    deepDive: [
      'O que acontece com uma escrita quando uma das 3 réplicas está fora?',
      'Duas escritas concorrentes na mesma chave: qual valor vence?',
      'Como adicionar um nó novo sem mover todos os dados?',
    ],
    project:
      'Cluster com consistent hashing, replicação N=3, quórum configurável e WAL, com testes que derrubam nós e simulam partições.',
  },
  {
    id: 'proximity',
    number: 11,
    title: 'Serviço de proximidade',
    examples: 'Uber, 99, iFood e Yelp',
    tier: 3,
    week: 17,
    summary:
      'Encontra motoristas ou lugares perto de uma coordenada, com milhões de atualizações de posição por minuto. Treina índices geoespaciais e escrita intensa.',
    deepDive: [
      'Como achar o motorista mais próximo de alguém na fronteira entre duas células?',
      'Como lidar com 1 milhão de atualizações de posição por minuto?',
      'Como garantir que um motorista não aceite duas corridas ao mesmo tempo?',
    ],
    project:
      'Simulador de 10 mil motoristas, busca por raio com Redis GEOSEARCH ou H3 e matching com lease para evitar dupla atribuição.',
  },
  {
    id: 'video-streaming',
    number: 12,
    title: 'Streaming de vídeo',
    examples: 'YouTube, Netflix e Globoplay',
    tier: 3,
    week: 18,
    summary:
      'Recebe uploads e entrega vídeo para milhões de pessoas com qualidade ajustada à rede. Treina pipelines assíncronos, object storage e CDN.',
    deepDive: [
      'Como retomar o upload de um arquivo de 10 GB que caiu no meio?',
      'Como reduzir o tempo entre o upload e o vídeo ficar disponível?',
      'Como servir um lançamento que todos vão assistir na mesma hora?',
    ],
    project:
      'Upload com URL pré-assinada para o MinIO, fila que dispara workers FFmpeg gerando HLS em 360p e 720p e player com hls.js.',
  },
  {
    id: 'file-sync',
    number: 13,
    title: 'Armazenamento e sync de arquivos',
    examples: 'Google Drive, Dropbox e OneDrive',
    tier: 3,
    week: 19,
    summary:
      'Guarda arquivos na nuvem e os mantém sincronizados entre dispositivos, inclusive offline. Treina chunking, deduplicação e resolução de conflitos.',
    deepDive: [
      'Como sincronizar só a parte alterada de um arquivo de 2 GB?',
      'Duas pessoas editaram o mesmo arquivo offline. O que acontece?',
      'Como o cliente descobre mudanças sem consultar o servidor o tempo todo?',
    ],
    project:
      'Cliente que monitora uma pasta, divide arquivos em blocos SHA-256, envia só blocos novos e sincroniza um segundo cliente.',
  },
  {
    id: 'payments',
    number: 14,
    title: 'Sistema de pagamentos',
    examples: 'Stripe, Mercado Pago e checkouts de e-commerce',
    tier: 3,
    week: 20,
    summary:
      'Processa cobranças com provedores externos sem cobrar duas vezes e sem perder dinheiro. Treina idempotência, consistência entre serviços e auditoria.',
    deepDive: [
      'A chamada ao provedor deu timeout. A cobrança aconteceu ou não?',
      'Como garantir que pedido e pagamento terminem consistentes sem 2PC?',
      'Como descobrir que o seu saldo não bate com o do provedor?',
    ],
    project:
      'API de pagamentos com idempotency keys, Stripe em modo de teste, webhooks idempotentes, ledger de dupla entrada e reconciliação.',
  },
  {
    id: 'ticketing',
    number: 15,
    title: 'Reserva de ingressos',
    examples: 'Ticketmaster, Sympla e Eventim',
    tier: 3,
    week: 21,
    summary:
      'Vende assentos disputados sem vender o mesmo lugar duas vezes, com milhões de pessoas tentando ao mesmo tempo. Treina concorrência, locks e controle de picos.',
    deepDive: [
      'Duas pessoas clicam no mesmo assento no mesmo milissegundo. Quem leva?',
      'Como segurar 2 milhões de pessoas para um show com 50 mil lugares?',
      'A pessoa reservou mas não pagou. Quando e como o assento volta?',
    ],
    project:
      'API com hold de 10 minutos no Redis (SET NX PX), confirmação transacional no Postgres e fila de espera virtual.',
  },
];
