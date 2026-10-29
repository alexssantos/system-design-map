import type { PodcastScript } from './types';

// Roteiro do episódio 1, versão 2 (diagrama v2). Ainda sem áudio: o player mostra só o roteiro.
// A ordem agora segue a de uma entrevista: requisitos e números, contrato, desenho mínimo, o que quebra
// e o que entra, e só então os aprofundamentos. O diagrama é montado aos poucos (reveal).
// Números de estimativa são cenários de entrevista, não dados de um produto real.
export const urlShortenerScriptV2: PodcastScript = {
  caseId: 'url-shortener',
  version: 2,
  title: 'Encurtador de URL: da conta ao desenho, na ordem da entrevista',
  reveal: true,
  chapters: [
    {
      id: 'abertura',
      title: 'O problema, as perguntas e os números',
      focus: ['creator', 'web', 'app'],
      turns: [
        {
          host: 'ju',
          text: '[warmly] Olá, bem-vindo ao Mapa de System Design. Eu sou a Juliana, e comigo está o Jerri. Hoje a gente volta ao caso número um, o encurtador de URL, numa versão nova: dessa vez a gente vai montar o desenho na ordem em que você faria numa entrevista, peça por peça.',
        },
        {
          host: 'jerri',
          text: 'Oi, Ju! Oi, pessoal. E repara que o diagrama começa quase vazio. Só tem quem usa o sistema: quem cria o link, num painel ou numa API pública, e quem clica nele, no navegador ou no app. Todo o resto vai aparecer conforme um requisito pedir.',
        },
        {
          host: 'ju',
          text: 'Então, primeiro passo da entrevista?',
        },
        {
          host: 'jerri',
          text: 'Perguntar. Antes de qualquer caixa, você pergunta ao entrevistador quantos links novos por dia, qual a razão entre leitura e escrita, por quanto tempo o link vive, e se o código pode ter letras maiúsculas. Sem esses números, qualquer desenho é chute. No nosso cenário: 100 milhões de links novos por mês, umas 40 escritas por segundo, e uma razão de leitura para escrita de 100 para 1. Ou seja, uns 4 mil redirects por segundo em média, com pico de dez vezes isso.',
        },
        {
          host: 'ju',
          text: 'Eu vi um cenário bem maior no livro do Alex Xu, né? Cem milhões por dia.',
        },
        {
          host: 'jerri',
          text: '[laughs softly] Esse aparece muito. Cem milhões por dia, 10 leituras por escrita, guardando por 10 anos: dá 365 bilhões de registros. O nosso, guardando por 5 anos, dá 6 bilhões de links, uns 3 terabytes com 500 bytes por registro. O legal é que o desenho final é o mesmo nos dois. O que muda é o tamanho de cada peça. [short pause] Guarda o 100 para 1, porque ele vai justificar quase tudo.',
        },
      ],
    },
    {
      id: 'contrato',
      title: 'O contrato: API e esquema',
      focus: ['creator', 'web', 'note-6'],
      turns: [
        {
          host: 'ju',
          text: 'Antes de desenhar, você define a API?',
          focus: ['creator', 'web'],
        },
        {
          host: 'jerri',
          text: 'Sim, e é rápido. São duas rotas. Um POST em barra api barra v1 barra urls, com a URL longa no corpo, que responde 201 com o código curto. E um GET no código, que responde com um redirecionamento e o cabeçalho Location apontando para a URL longa. Opcionalmente, apelido personalizado e data de expiração no POST.',
          focus: ['creator', 'web'],
        },
        {
          host: 'ju',
          text: 'E a tabela?',
          focus: ['note-6'],
        },
        {
          host: 'jerri',
          text: 'Uma tabela só, links: o código como chave primária, a URL longa, o dono, a data de criação e a de expiração. Repara que não tem uma coluna de id separada. O código é a identidade do link. Escrever o esquema em voz alta já antecipa a pergunta que vem depois: se o código é a chave, de onde ele vem sem colidir?',
          focus: ['note-6'],
        },
      ],
    },
    {
      id: 'minimo',
      title: 'Do desenho mínimo ao load balancer',
      focus: ['lb1', 'api'],
      turns: [
        {
          host: 'ju',
          text: 'Qual o desenho mais simples que funciona?',
          focus: ['api'],
        },
        {
          host: 'jerri',
          text: 'Um servidor de aplicação e um banco. Ele valida a URL, gera o código, grava, e no clique busca e redireciona. Funciona no primeiro dia. A pergunta da entrevista é: o que quebra primeiro? Com pico de 40 mil requisições por segundo, uma máquina só não aguenta, e ela vira um ponto único de falha.',
          focus: ['api'],
        },
        {
          host: 'ju',
          text: 'Aí entra o load balancer.',
          focus: ['lb1'],
        },
        {
          host: 'jerri',
          text: 'Exatamente. O load balancer distribui o tráfego entre vários servidores de API, tira de rotação quem falha no health check e termina o TLS. E isso só funciona porque os servidores são sem estado: nada que importe fica na memória entre uma requisição e outra. Qualquer instância atende qualquer pedido, e você sobe ou derruba instâncias sem migrar nada.',
          focus: ['lb1', 'api'],
        },
      ],
    },
    {
      id: 'banco',
      title: 'Onde o link mora: KV, réplicas e ler a própria escrita',
      focus: ['db', 'r1', 'r2'],
      turns: [
        {
          host: 'ju',
          text: 'E o banco, continua sendo um só?',
          focus: ['db'],
        },
        {
          host: 'jerri',
          text: 'Olha o padrão de acesso: dado um código, me dá a URL. Sem join, sem relatório. Isso é chave-valor. Por isso o desenho usa um banco chave-valor particionado, como DynamoDB ou Cassandra. A partição é pelo hash do código, a leitura toca um nó só, e somar nós aumenta a capacidade quase linearmente. Postgres serve muito bem no começo. A frase de entrevista é: o padrão de acesso justifica o KV, não a moda.',
          focus: ['db'],
        },
        {
          host: 'ju',
          text: 'E as réplicas?',
          focus: ['r1', 'r2'],
        },
        {
          host: 'jerri',
          text: 'Servem para disponibilidade e para leitura. Se o nó principal de uma partição cai, uma réplica assume, e link quebrado é o pior bug desse produto, porque ele já foi impresso num cartaz ou num QR code. E com 100 leituras por escrita, faz sentido ter várias cópias lendo. O risco é o atraso de replicação: a pessoa cria o link, clica na hora e recebe um 404. A defesa é ler a própria escrita: gravar o link também no cache na criação, ou ler do primário por alguns segundos.',
          focus: ['r1', 'r2', 'db'],
        },
      ],
    },
    {
      id: 'redirect',
      title: '301 ou 302, com nuance',
      focus: ['web', 'app', 'note-1'],
      turns: [
        {
          host: 'ju',
          text: 'E o status do redirect? Tem gente que diz que, com 301, nem precisa de cache no servidor.',
          focus: ['note-1'],
        },
        {
          host: 'jerri',
          text: 'Essa é uma meia verdade boa de corrigir. O 301 é permanente: o navegador guarda e, da próxima vez, nem passa pelo seu servidor. Mas ele guarda no cache de cada navegador. Todo usuário novo, toda aba anônima, todo celular diferente ainda chega até você. Então o 301 só poupa visitas repetidas do mesmo usuário, e o cache do servidor continua útil.',
          focus: ['note-1', 'web', 'app'],
        },
        {
          host: 'ju',
          text: 'E o que você perde com o 301?',
        },
        {
          host: 'jerri',
          text: 'A contagem. Se o navegador não volta, você não vê o clique. Se o produto vende estatística, como o bit.ly, você usa o 302, que é temporário e faz o navegador perguntar toda vez. É trocar custo de infraestrutura por informação, e vale dizer isso em voz alta.',
          focus: ['note-1'],
        },
      ],
    },
    {
      id: 'caminhos-errados',
      title: 'Os caminhos que não funcionam',
      focus: ['note-7'],
      turns: [
        {
          host: 'ju',
          text: 'Agora a pergunta que mais cai: de onde vem o código? E por que sete caracteres?',
        },
        {
          host: 'jerri',
          text: 'Começa pela conta. Base 62 são dígitos, letras minúsculas e maiúsculas. Com seis caracteres, 62 elevado a 6 dá uns 56,8 bilhões. Não cobre os 365 bilhões do cenário maior. Com sete, dá 3,5 trilhões, e cobre os dois cenários com folga. Por isso sete.',
          focus: ['note-7'],
        },
        {
          host: 'ju',
          text: 'E a primeira ideia de todo mundo, fazer um hash da URL?',
        },
        {
          host: 'jerri',
          text: 'MD5 ou SHA-1 saem em hexadecimal, base 16, e são longos demais. Você corta para sete caracteres e aí aparecem colisões: duas URLs com o mesmo começo de hash. Então você precisa checar no banco e tentar de novo. A segunda ideia é sortear sete caracteres aleatórios e checar se já existe.',
        },
        {
          host: 'ju',
          text: '[curious] Eu ouvi que isso vira um loop infinito, por causa do paradoxo do aniversário. É verdade?',
        },
        {
          host: 'jerri',
          text: '[laughs softly] É aí que você ganha pontos corrigindo. O paradoxo do aniversário diz que, com uns 2,2 milhões de códigos sorteados num espaço de 3,5 trilhões, já é provável existir alguma colisão. Isso é verdade. Mas o custo de cada nova criação depende de quanto do espaço já está ocupado. No fim dos dez anos do cenário grande, isso dá uns 10 por cento. Ou seja, em média 1,1 tentativa por link. Não é loop infinito. O custo real é uma leitura extra, ou um insert condicional, em toda escrita. É uma troca legítima. Só que dá para não pagar nada disso.',
          focus: ['note-7'],
        },
        {
          host: 'ju',
          text: 'E um contador central, que só incrementa?',
        },
        {
          host: 'jerri',
          text: 'Esse resolve a colisão: cada número é único, e você converte para base 62. Mas se toda criação precisa falar com o mesmo contador, ele vira gargalo e ponto único de falha. Um Redis com INCR funciona, porque o Redis executa um comando por vez, mas é uma ida de rede por link, e o failover dele tem uma pegadinha que a gente já vai ver.',
        },
      ],
    },
    {
      id: 'chaves',
      title: 'Faixas de IDs, códigos embaralhados e o failover',
      focus: ['kgs', 'keydb', 'standby', 'note-0'],
      turns: [
        {
          host: 'ju',
          text: 'Então qual é a saída do diagrama?',
          focus: ['kgs', 'note-0'],
        },
        {
          host: 'jerri',
          text: 'O Key Generation Service entregando faixas do contador. Cada servidor de API pede, digamos, mil IDs de uma vez, de um milhão até um milhão e mil, e gasta essa faixa localmente, sem falar com ninguém. Só volta ao KGS quando a faixa acaba. Se o servidor cair, perde o resto da faixa, e tudo bem, o espaço é enorme. O Flickr fez algo parecido em 2010 com os ticket servers, e o Twitter foi pelo outro lado com o Snowflake, que é o nosso caso três.',
          focus: ['kgs', 'note-0', 'api'],
        },
        {
          host: 'ju',
          text: 'E como o número vira código?',
          focus: ['api'],
        },
        {
          host: 'jerri',
          text: 'Divisões sucessivas por 62, como na escola. O número 11157 dividido por 62 dá 179, resto 59. 179 por 62 dá 2, resto 55. E sobra o 2. Lendo de trás para frente: 2, 55, 59. Com o alfabeto na ordem dígitos, minúsculas e maiúsculas, o 55 é o T maiúsculo e o 59 é o X maiúsculo. Dois-T-X. Sem colisão, porque cada número tem uma representação só.',
          focus: ['api'],
        },
        {
          host: 'ju',
          text: 'Mas aí o próximo link é 2TY, e o seguinte 2TZ. Dá para adivinhar, não dá?',
          focus: ['note-4'],
        },
        {
          host: 'jerri',
          text: 'Dá, e esse é um problema real, porque muita gente encurta link de documento privado. A versão anterior desse diagrama nem falava disso. A defesa é embaralhar o número antes de converter: uma permutação com chave secreta, como uma pequena cifra de Feistel. Cada ID vira outro número único, sem padrão aparente, e continua sem colisão. Tem quem use a biblioteca Hashids, mas ela só ofusca, a própria documentação avisa que não é segurança. E link realmente privado precisa de autorização, não de um código difícil.',
          focus: ['note-4', 'api'],
        },
        {
          host: 'ju',
          text: 'E o Key DB com o Standby, o que guardam agora?',
          focus: ['keydb', 'standby'],
        },
        {
          host: 'jerri',
          text: 'Só um número: a próxima faixa livre. O KGS lê, avança e entrega. A pegadinha é o failover. Se o standby recebe a replicação com atraso e assume, ele pode reentregar uma faixa que já foi usada. E num banco chave-valor, insert costuma ser upsert: o link novo sobrescreve o antigo em silêncio. É o mesmo risco do Redis com Sentinel. As defesas: replicação síncrona no Key DB, pular algumas faixas ao promover o standby, e gravar o link com insert condicional, o IF NOT EXISTS, como última barreira.',
          focus: ['keydb', 'standby', 'note-5'],
        },
      ],
    },
    {
      id: 'cache',
      title: 'Cache de links e o link que viraliza',
      focus: ['cache', 'note-3'],
      turns: [
        {
          host: 'ju',
          text: 'Voltando à leitura: a API olha o cache antes do banco.',
          focus: ['cache', 'api'],
        },
        {
          host: 'jerri',
          text: 'É o cache-aside, e quem justifica é o 100 para 1. Poucos links recebem a maioria dos cliques, então guardar os mais acessados em Redis tira a maior parte dos redirects do banco. Uns 20 por cento do tráfego do dia cabem em algumas dezenas de gigabytes. A remoção é LRU, e ela mesma decide quem fica: você não precisa saber de antemão quais são os mais acessados. E na criação, a API já grava o link no cache, o que resolve aquele 404 do primeiro clique.',
          focus: ['cache', 'api', 'db'],
        },
        {
          host: 'ju',
          text: '[curious] E quando um link viraliza?',
          focus: ['note-3'],
        },
        {
          host: 'jerri',
          text: 'Hot key. Cinquenta mil acessos por segundo numa chave que mora num único nó do Redis. E se ela expira, milhares de requisições correm juntas para o banco: é o stampede. As defesas são um cache local de poucos segundos em cada servidor de API e o request coalescing, em que só uma requisição vai buscar e as outras esperam a resposta dela. Em Go, a biblioteca singleflight faz exatamente isso.',
          focus: ['note-3', 'cache'],
        },
      ],
    },
    {
      id: 'cliques',
      title: 'Cliques fora do caminho crítico',
      focus: ['clicks', 'agg', 'note-2'],
      turns: [
        {
          host: 'ju',
          text: 'E a estatística de cliques?',
          focus: ['clicks'],
        },
        {
          host: 'jerri',
          text: 'O redirect não espera o analytics. A API publica um evento de clique numa fila, como Kafka, e devolve o 302 na hora. O serviço de Analytics consome no próprio ritmo e agrega, por exemplo, cliques por link por minuto. Se ele cair por uma hora, os eventos esperam na fila e ninguém que clicou percebe nada. Curiosidade: o NSQ nasceu dentro do bit.ly para mover esse tipo de evento.',
          focus: ['clicks', 'agg'],
        },
        {
          host: 'ju',
          text: 'Então a fila separa o urgente do importante.',
          focus: ['note-2'],
        },
        {
          host: 'jerri',
          text: '[warmly] Isso. O preço é a estatística chegar alguns segundos atrasada, e para um painel de cliques isso é aceitável. É a dica de entrevista do diagrama: o 100 para 1 justifica cache e réplicas, e a fila existe para o redirect não esperar o analytics.',
          focus: ['note-2'],
        },
      ],
    },
    {
      id: 'limpeza',
      title: 'Expiração e limpeza',
      focus: ['cleanup'],
      turns: [
        {
          host: 'ju',
          text: 'Falta o Cleanup service. Ele ainda devolve chaves para o estoque?',
        },
        {
          host: 'jerri',
          text: 'Não mais, e essa foi uma correção da versão nova. Com faixas de contador não existe estoque de chaves livres, então não há o que devolver. E é melhor assim: se um código expirado voltasse a ser usado, quem guardou o link antigo cairia num destino diferente. O Cleanup só faz duas coisas. Na leitura, um link vencido responde que não existe mais, mesmo que ainda esteja no banco. E em segundo plano, um job agendado apaga os expirados aos poucos, em horário de pouco tráfego.',
          focus: ['cleanup', 'db'],
        },
      ],
    },
    {
      id: 'fechamento',
      title: 'Juntando tudo: os dois caminhos',
      focus: [],
      turns: [
        {
          host: 'ju',
          text: 'Vamos refazer os dois caminhos para fixar? No diagrama dá até para filtrar leitura e escrita.',
        },
        {
          host: 'jerri',
          text: 'Leitura: clique no navegador, load balancer, servidor de API sem estado, cache local, Redis. Quase sempre acha e devolve um 302 em poucos milissegundos. Se não acha, lê do banco chave-valor e preenche o cache. Em paralelo, solta o evento de clique na fila. Escrita: POST na API, que pega o próximo ID da faixa local, embaralha, converte para base 62, grava no banco com IF NOT EXISTS e já põe no cache. Só quando a faixa acaba ela fala com o KGS.',
        },
        {
          host: 'ju',
          text: 'E numa frase, para o entrevistador?',
        },
        {
          host: 'jerri',
          text: 'Os números escolhem as peças: o 100 para 1 pede cache e réplicas, os bilhões de links pedem sete caracteres e um banco particionado, e tudo que não precisa estar no caminho do clique, gerar chave, contar clique e limpar, foi tirado dele. Se você mostrar também os caminhos que descartou e por quê, o desenho deixa de ser decoreba.',
        },
        {
          host: 'ju',
          text: '[warmly] Perfeito. No próximo episódio, o rate limiter distribuído. Até lá!',
        },
        {
          host: 'jerri',
          text: 'Até a próxima, pessoal!',
        },
      ],
    },
  ],
};
