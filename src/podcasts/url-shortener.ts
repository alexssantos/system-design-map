import type { PodcastScript } from './types';

// Roteiro do episódio 1. A ordem segue a dependência entre as peças: primeiro o que o usuário vê,
// depois onde o dado mora, como a chave nasce e, por fim, o que sai do caminho crítico.
// Números de estimativa são um cenário de entrevista, não dados de um produto real.
export const urlShortenerScript: PodcastScript = {
  caseId: 'url-shortener',
  title: 'Encurtador de URL: cada peça e o porquê dela',
  chapters: [
    {
      id: 'abertura',
      title: 'O problema e os números',
      focus: [],
      turns: [
        {
          host: 'ju',
          text: '[warmly] Olá, bem-vindo ao Mapa de System Design, o podcast em que a gente desmonta um sistema peça por peça e pergunta, para cada uma: por que isso está aqui? Eu sou a Juliana, e comigo está o Jerri.',
        },
        {
          host: 'jerri',
          text: 'Oi, Ju! Oi, pessoal. Hoje é o caso número um, o clássico encurtador de URL. Pensa no bit.ly, no TinyURL, ou no t.co, que o Twitter usa para embrulhar todo link publicado na rede. Parece simples, mas é o caso perfeito para começar, porque ele cabe na cabeça inteiro e mesmo assim tem as perguntas difíceis: como gerar chaves únicas sem gargalo, como aguentar um link que viraliza, e como contar cliques sem deixar o redirect lento.',
        },
        {
          host: 'ju',
          text: 'Antes de desenhar qualquer caixa, o que você faria primeiro numa entrevista?',
        },
        {
          host: 'jerri',
          text: 'Requisitos e números. Funcionalmente são duas coisas: receber uma URL longa e devolver um código curto, e receber o código e redirecionar para a URL original. Opcionalmente, apelido personalizado, expiração e estatística de cliques. Agora, os números. Vamos supor 100 milhões de links novos por mês. Isso dá umas 40 escritas por segundo. E aqui vem o dado mais importante do caso inteiro: a razão de leitura para escrita é de mais ou menos 100 para 1. Um link é criado uma vez e clicado muitas vezes. Então são uns 4 mil redirects por segundo em média, e o pico pode ser dez vezes isso.',
        },
        {
          host: 'ju',
          text: 'E armazenamento?',
        },
        {
          host: 'jerri',
          text: 'Guardando por cinco anos, são 6 bilhões de links. Com uns 500 bytes por registro, URL, código, datas, dono, dá cerca de 3 terabytes. Não é absurdo, mas já não é um banco que você trata com carinho numa máquina só. [short pause] Guarda esse 100 para 1, porque quase toda decisão de hoje sai dele.',
        },
      ],
    },
    {
      id: 'redirect',
      title: 'O clique: navegadores, apps e o redirect',
      focus: ['web', 'app', 'note-1'],
      turns: [
        {
          host: 'ju',
          text: 'Então vamos começar pela ponta: o usuário clica no link curto. O que acontece?',
          focus: ['web', 'app'],
        },
        {
          host: 'jerri',
          text: 'O navegador, ou o app, faz um GET no código, tipo barra a-b-c-1-2-3-4. O servidor não devolve página nenhuma: ele responde com um status de redirecionamento e o cabeçalho Location apontando para a URL longa. O navegador então vai sozinho para o destino. Ou seja, o nosso sistema participa só de um salto, e esse salto precisa ser muito rápido, porque ele é puro atraso para o usuário.',
          focus: ['web', 'app'],
        },
        {
          host: 'ju',
          text: 'E tem aquela pegadinha do 301 contra o 302, né?',
          focus: ['note-1'],
        },
        {
          host: 'jerri',
          text: '[laughs softly] Tem, e ela aparece muito. O 301 é redirecionamento permanente: o navegador guarda em cache e, da próxima vez, nem passa pelo seu servidor. Ótimo para carga, péssimo para analytics, porque você deixa de ver os cliques repetidos. O 302 é temporário: toda vez o navegador volta para perguntar. Se o produto vende estatística de cliques, como o bit.ly vende, você quer o 302. É uma troca de custo de infraestrutura por informação, e na entrevista vale dizer isso em voz alta.',
          focus: ['note-1'],
        },
      ],
    },
    {
      id: 'entrada',
      title: 'A porta de entrada: load balancer e API sem estado',
      focus: ['lb1', 'api'],
      turns: [
        {
          host: 'ju',
          text: 'A requisição sai do navegador e bate primeiro no load balancer. Por que ele é a primeira peça?',
          focus: ['lb1'],
        },
        {
          host: 'jerri',
          text: 'Porque 4 mil requisições por segundo, com pico de 40 mil, não cabem com folga numa máquina só, e porque uma máquina só é um ponto único de falha. O load balancer distribui o tráfego entre vários servidores de API, tira de rotação quem falha no health check e é onde normalmente termina o TLS. É o primeiro passo de escala horizontal.',
          focus: ['lb1'],
        },
        {
          host: 'ju',
          text: 'E no diagrama os API servers aparecem empilhados, com a etiqueta stateless.',
          focus: ['api'],
        },
        {
          host: 'jerri',
          text: 'Isso é o que deixa o load balancer funcionar de verdade. Se o servidor não guarda nada na memória que importe entre uma requisição e outra, qualquer instância atende qualquer pedido. Você sobe mais dez instâncias na Black Friday e derruba depois, sem migrar estado. Todo o estado mora fora: no banco, no cache, na fila. O servidor de API vira só lógica: valida a URL, consulta o cache, consulta o banco, devolve o redirect.',
          focus: ['api'],
        },
      ],
    },
    {
      id: 'banco',
      title: 'Onde o link mora: banco chave-valor particionado',
      focus: ['db'],
      turns: [
        {
          host: 'ju',
          text: 'Agora o coração: onde esses 6 bilhões de links ficam guardados?',
        },
        {
          host: 'jerri',
          text: 'Olha o padrão de acesso. Quase cem por cento das leituras são: dado este código, me dá a URL. Não tem join, não tem relatório, não tem consulta por intervalo. Isso é a definição de um acesso chave-valor. Por isso o desenho usa um banco chave-valor particionado, algo como DynamoDB ou Cassandra. A chave é o código curto, o valor é a URL e alguns metadados.',
        },
        {
          host: 'ju',
          text: 'Daria para fazer com Postgres?',
        },
        {
          host: 'jerri',
          text: 'Daria, e para um começo é até uma ótima escolha. O ponto é o que acontece quando cresce. Com 3 terabytes e dezenas de milhares de leituras por segundo, você vai precisar particionar. Num banco chave-valor, o particionamento por hash da chave já vem pronto: o código vai para uma partição, a leitura toca um nó só, e somar nós aumenta a capacidade de forma quase linear. Como o código é aleatório, a carga se espalha bem entre as partições. Na entrevista, a frase é: o padrão de acesso por chave justifica o KV, e não a moda.',
        },
      ],
    },
    {
      id: 'replicas',
      title: 'Réplicas: mais leitura e sobrevivência',
      focus: ['db', 'r1', 'r2'],
      turns: [
        {
          host: 'ju',
          text: 'Ao lado do Links DB tem duas réplicas. Elas servem para quê, exatamente?',
        },
        {
          host: 'jerri',
          text: 'Para duas coisas. Primeira, disponibilidade: se o nó principal de uma partição cai, uma réplica assume e o link continua funcionando. Um link quebrado é o pior bug possível desse produto, porque o link já foi impresso num cartaz, num e-mail, num QR code. Segunda, capacidade de leitura: com 100 leituras para cada escrita, faz todo sentido ter várias cópias respondendo leitura enquanto só uma recebe escrita.',
        },
        {
          host: 'ju',
          text: 'E qual é o risco?',
        },
        {
          host: 'jerri',
          text: 'Atraso de replicação. A réplica recebe a cópia alguns milissegundos depois. Imagina o usuário que acabou de criar o link e clica nele na hora para testar: se a leitura cai numa réplica atrasada, ele recebe um 404 do link que acabou de criar. A solução clássica é garantir o que a gente chama de ler a própria escrita: logo após a criação, ou você grava o link também no cache, ou lê do primário por alguns segundos. Para um encurtador, consistência eventual nas leituras é aceitável, desde que você trate esse caso.',
        },
      ],
    },
    {
      id: 'chaves',
      title: 'Gerar a chave sem colisão e sem gargalo',
      focus: ['kgs', 'keydb', 'standby', 'note-0'],
      turns: [
        {
          host: 'ju',
          text: 'Agora a parte que mais cai em entrevista: como gerar o código curto? A primeira ideia de todo mundo é fazer um hash da URL.',
        },
        {
          host: 'jerri',
          text: 'E é uma ideia que quebra rápido. Você pega um MD5, que tem 128 bits, e corta para sete caracteres. Ao cortar, aparecem colisões: duas URLs diferentes com o mesmo código. Aí você precisa checar no banco se já existe e tentar de novo, e isso vira uma leitura extra em toda escrita. A segunda ideia é um contador: o banco incrementa um número e você converte para base 62, que são dígitos, letras minúsculas e maiúsculas. Sem colisão, mas agora todo mundo depende de um contador central, que é gargalo e ponto único de falha.',
        },
        {
          host: 'ju',
          text: 'E qual é a saída do diagrama?',
          focus: ['kgs', 'note-0'],
        },
        {
          host: 'jerri',
          text: 'O Key Generation Service, o KGS, trabalhando com faixas. Em vez de pedir uma chave por vez, cada servidor de API reserva um bloco, digamos mil chaves, e gasta esse bloco localmente, sem falar com ninguém. O KGS só é consultado quando o bloco acaba. Se o servidor cair, ele perde as chaves que não usou, e tudo bem, porque o espaço é enorme: sete caracteres em base 62 dão cerca de 3,5 trilhões de combinações. Lembra que a gente precisa de 6 bilhões? Sobra muito.',
          focus: ['kgs', 'note-0'],
        },
        {
          host: 'ju',
          text: 'Tem algum sistema real que faz isso?',
        },
        {
          host: 'jerri',
          text: 'O Flickr publicou em 2010 os seus ticket servers: servidores MySQL dedicados só a distribuir IDs com auto-incremento, dois deles, um gerando números pares e o outro ímpares, para não ter ponto único de falha. É a mesma ideia de tirar a geração de ID do caminho de cada requisição. E o Twitter, com o Snowflake, foi pelo outro lado: cada máquina gera IDs sozinha a partir do relógio. Esse é o nosso caso três, aliás.',
        },
        {
          host: 'ju',
          text: 'E o Key DB com o Standby, à direita?',
          focus: ['keydb', 'standby'],
        },
        {
          host: 'jerri',
          text: 'O Key DB guarda quais faixas já foram entregues e quais chaves estão livres. Ele precisa ser durável, porque se o KGS esquecer o que já entregou, ele entrega a mesma faixa duas vezes, e aí você tem dois links com o mesmo código, que é o bug mais grave possível. Por isso tem um standby recebendo replicação: se o principal cair, ele assume com o histórico de faixas intacto. Repara que o KGS fica numa zona separada no desenho, fora do caminho do redirect. Leitura nunca toca nessa parte.',
          focus: ['keydb', 'standby'],
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
          text: 'Voltando para a leitura: no diagrama, a API consulta o cache primeiro, e só no miss vai ao banco.',
          focus: ['cache', 'api'],
        },
        {
          host: 'jerri',
          text: 'É o padrão cache-aside, e de novo quem justifica é o 100 para 1. Acesso a link segue uma distribuição bem concentrada: uma fração pequena dos links recebe a maior parte dos cliques. Se você guardar em Redis os links mais acessados do dia, a maioria dos redirects nem chega ao banco. A conta de entrevista: uns 20 por cento das requisições diárias, a 500 bytes cada, cabem em algumas dezenas de gigabytes. É memória de uma ou poucas máquinas. A política de remoção é LRU, sai quem não é usado há mais tempo, e como um link quase nunca muda, o cache quase nunca fica desatualizado.',
          focus: ['cache', 'api'],
        },
        {
          host: 'ju',
          text: '[curious] E quando um link viraliza? Cinquenta mil acessos por segundo no mesmo código?',
          focus: ['note-3'],
        },
        {
          host: 'jerri',
          text: 'Aí aparece a hot key. Todo esse tráfego cai numa chave só, que mora num único nó do Redis, e aquele nó vira o gargalo, por mais que o cluster seja grande. E pior: se essa chave expirar, milhares de requisições dão miss ao mesmo tempo e correm para o banco. É o stampede, ou thundering herd. As defesas são duas. Um cache local, na memória de cada servidor de API, com vida de poucos segundos, para que o link quente nem saia da máquina. E request coalescing: se cem requisições pedem a mesma chave que deu miss, só uma vai ao banco e as outras esperam a resposta dela. Em Go, por exemplo, existe a biblioteca singleflight só para isso. E o Facebook descreveu, no artigo sobre escalar o memcache, de 2013, um mecanismo chamado lease, que resolve exatamente esse estouro de manada.',
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
          text: 'E a contagem de cliques? O produto quer saber quantas vezes, de onde, de qual dispositivo.',
        },
        {
          host: 'jerri',
          text: 'Aqui está uma das decisões mais bonitas do caso. O redirect não pode esperar o analytics. Se, para redirecionar, você precisasse gravar uma linha num banco de estatísticas, cada clique ficaria mais lento e um problema no analytics derrubaria o redirect. Então a API só publica um evento de clique numa fila, como Kafka, e devolve o redirect na hora. Publicar é rápido e não bloqueia.',
          focus: ['clicks'],
        },
        {
          host: 'ju',
          text: 'E quem consome essa fila?',
          focus: ['agg'],
        },
        {
          host: 'jerri',
          text: 'O serviço de Analytics, no seu próprio ritmo. Ele agrega, por exemplo, cliques por link por minuto, e grava os totais num banco analítico. Se o Analytics cair por uma hora, os eventos esperam na fila e são processados depois. O usuário que clicou nunca percebeu nada. Um caso real e curioso: o NSQ, uma plataforma de mensageria bem conhecida, nasceu dentro do próprio bit.ly, justamente para mover esse tipo de evento entre os serviços.',
          focus: ['agg'],
        },
        {
          host: 'ju',
          text: 'Então a fila desacopla o que é urgente do que é importante, mas pode esperar.',
          focus: ['note-2'],
        },
        {
          host: 'jerri',
          text: '[warmly] Exatamente. E o preço é que a estatística fica alguns segundos atrasada, ou seja, é eventualmente consistente. Para um painel de cliques isso é perfeitamente aceitável. Essa é a dica de entrevista do diagrama: diga que o 100 para 1 justifica cache e réplicas, e que a fila existe para o redirect não esperar o analytics.',
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
          text: 'Falta a última caixa: o Cleanup service.',
        },
        {
          host: 'jerri',
          text: 'Links podem ter data de expiração. A forma ingênua seria um job que varre os 6 bilhões de registros procurando expirados, o que é caro. O jeito usado é combinar duas estratégias. Na leitura, se o link encontrado já expirou, a API responde que ele não existe mais, então o usuário nunca vê um link vencido, mesmo que ele ainda esteja no banco. E em segundo plano, um job agendado remove os expirados aos poucos, em horário de pouco tráfego. O Redis faz igualzinho com as chaves que têm TTL: remove quando alguém tenta ler e também, de tempos em tempos, por amostragem.',
          focus: ['cleanup'],
        },
        {
          host: 'ju',
          text: 'E no desenho ele também devolve chaves para o Key DB.',
          focus: ['cleanup', 'keydb'],
        },
        {
          host: 'jerri',
          text: 'Isso fecha o ciclo: o código de um link expirado pode voltar para o estoque de chaves livres. Na prática, muita empresa prefere nunca reaproveitar um código, porque alguém pode ter o link antigo guardado e cair num destino diferente. É mais uma decisão de produto do que de tecnologia, e mostrar que você percebe isso conta pontos.',
          focus: ['cleanup', 'keydb'],
        },
      ],
    },
    {
      id: 'fechamento',
      title: 'Juntando tudo: o caminho de um clique',
      focus: [],
      turns: [
        {
          host: 'ju',
          text: 'Vamos refazer o caminho inteiro para fixar?',
        },
        {
          host: 'jerri',
          text: 'Vamos. Clique no navegador. O load balancer escolhe um servidor de API sem estado. A API olha o cache local, depois o Redis. Na grande maioria das vezes acha ali e devolve um 302 em poucos milissegundos. Se não acha, lê do banco chave-valor, ou de uma réplica, e preenche o cache. Em paralelo, solta um evento de clique na fila, e o Analytics agrega depois. Na criação, a API usa uma chave do bloco que já reservou no KGS, grava no banco e no cache. E o Cleanup cuida do que expira.',
          focus: ['web', 'lb1', 'api', 'cache', 'db', 'clicks'],
        },
        {
          host: 'ju',
          text: 'E se tivesse que resumir o caso numa frase para o entrevistador?',
        },
        {
          host: 'jerri',
          text: 'O caminho de leitura passa só por cache e banco chave-valor; tudo que não precisa estar ali, geração de chave, contagem de cliques e limpeza, foi tirado do caminho crítico. Se você explicar cada caixa com o porquê dela, o desenho deixa de ser decoreba.',
        },
        {
          host: 'ju',
          text: '[warmly] Perfeito. Clique em qualquer parte do diagrama para voltar ao trecho em que ela aparece. No próximo episódio, o rate limiter distribuído. Até lá!',
        },
        {
          host: 'jerri',
          text: 'Até a próxima, pessoal!',
        },
      ],
    },
  ],
};
