# Changelog

Todas as mudanças relevantes deste projeto ficam registradas aqui.

O formato segue o [Keep a Changelog](https://keepachangelog.com/pt-BR/1.1.0/) e o projeto usa [Versionamento Semântico](https://semver.org/lang/pt-BR/):

- **MAJOR** quando a estrutura dos dados ou a navegação mudam de forma incompatível.
- **MINOR** quando entram novos tópicos, casos, visões ou filtros.
- **PATCH** para correções de conteúdo, textos e estilo.

## [Não lançado]

## [0.6.0] - 2026-10-31

### Adicionado

- Menu lateral que separa as páginas **System Design** (`#/`) e **Engenharia de AI** (`#/ai`), no padrão de sidebar: ícone à esquerda do nome e item ativo com barra de destaque. A página de AI usa um ícone de robô (agente), com olhos que piscam no hover. A foto do GitHub com o pulse foi para o topo do menu. No celular o menu vira uma barra no topo.
- Mapa de Engenharia de AI com 68 termos do livro *AI Engineering* (Chip Huyen), em 9 áreas (fundamentos de modelos, avaliação, prompting e contexto, RAG, agentes, ajuste fino, dados, inferência, arquitetura e produção), cada um com a definição de uma linha, o capítulo e uma linha "Na prática".
- Trilha de estudo em 7 etapas, da primeira aplicação até a escala: tokens e contexto, prompting, RAG e embeddings, evals, agentes e ferramentas, ajuste fino e dados e, por fim, inferência e produção. Cada termo tem um número de 1 (primeiro a aprender) a 68 (último).
- Pré-requisitos entre os termos, desenhados como setas. Ao clicar num termo, acendem todos os pré-requisitos (diretos e indiretos) e o que ele destrava; o painel lista a trilha completa até ele, na ordem.
- Duas vistas: **Trilha** (uma coluna por etapa) e **Por área** (agrupado pelos capítulos).
- Termos que surgiram depois do livro (engenharia de contexto, harness, MCP, multiagente, computer use, modelos de raciocínio) aparecem marcados como **novo**.
- Busca, **Todas as conexões** e downloads em PNG ou SVG animado (mapa inteiro ou trilha do termo selecionado) também na página de AI.
- Testes do mapa de AI: pré-requisitos sempre antes na trilha e nunca numa etapa posterior (sem ciclos), sem pré-requisito redundante e os 68 termos presentes.

## [0.5.0] - 2026-10-29

### Adicionado

- Versões de diagrama. A versão mais nova de cada caso é a padrão; as anteriores continuam acessíveis no painel do caso (**Ver v1**), no seletor de versão do modal e da guia nova e em `#/diagrama/<caso>/v<n>`. O painel mostra o que mudou na versão atual.
- Diagrama v2 do caso 01 (Encurtador de URL), revisado depois da comparação com o capítulo 8 do *System Design Interview* (Alex Xu) e o vídeo do Renato Augusto:
  - caminho de escrita desenhado (`POST /api/v1/urls`, gravação com `INSERT IF NOT EXISTS` e no cache);
  - KGS só entrega faixas de um contador: o Key DB guarda a próxima faixa livre e o Cleanup não devolve mais chaves;
  - códigos embaralhados por uma permutação com chave secreta antes do base 62;
  - standby do Key DB com replicação síncrona;
  - notas novas: links adivinháveis, failover que não pode voltar o contador, esquema e API, por que 7 caracteres; nota do 301 com nuance.
- Filtro **Tudo / Leitura (clique) / Escrita (criar link)** na legenda dos diagramas que marcam o caminho de cada fluxo.
- Roteiro v2 do podcast do caso 01, na ordem de uma entrevista (requisitos, contrato, desenho mínimo, o que quebra, aprofundamentos), com o capítulo novo "Os caminhos que não funcionam" e o diagrama sendo montado aos poucos. Ainda sem áudio: o painel mostra o roteiro, percorrido fala a fala, e avisa que o áudio está disponível na v1.
- Estimativas no painel do caso 01, com troca entre o cenário do caso (100 mi por mês) e o do livro do Alex Xu (100 mi por dia), e duas perguntas novas de deep dive.

### Corrigido

- Rótulos das linhas apagadas agora também ficam apagados quando o diagrama destaca outra parte.

## [0.4.0] - 2026-10-29

### Adicionado

- Botões de download em PNG no cabeçalho do mapa: **Conexões** baixa o tópico ou caso selecionado junto com tudo o que se liga a ele (fica desligado até você selecionar algo) e **Mapa inteiro** baixa o mapa completo com todas as áreas.
- Botão de download do diagrama do caso, no modal e na guia nova, no tema atual.
- Escolha de formato em todos os downloads: **PNG** (foto do momento, sem os pontos animados) ou **SVG animado**, que abre no navegador com os pontos andando pelas linhas e as linhas tracejadas em movimento.
- O ícone do mapa agora é a foto do perfil do GitHub de alexssantos, com um pulse suave em volta, e abre o perfil numa guia nova. A foto fica colorida ao passar o mouse. Quem prefere menos movimento (prefers-reduced-motion) não vê a animação.

## [0.3.0] - 2026-10-29

### Adicionado

- Podcast do caso 01 (Encurtador de URL): 14 minutos de conversa entre Juliana e Jerri, em 10 capítulos, explicando o porquê de cada peça na ordem em que uma depende da outra, com exemplos reais (bit.ly, t.co, ticket servers do Flickr, Snowflake do Twitter, leases do memcache do Facebook, NSQ). Áudio gerado na ElevenLabs.
- Painel do podcast ao lado do diagrama, no modal e na guia nova: play/pausa, forma de onda real do áudio com clique para avançar, velocidade de 0,75× a 2×, troca de capítulo e transcrição que acompanha a fala.
- O diagrama acende as peças de que a conversa está falando e apaga o resto; a câmera acompanha (dá para desligar). Clicar numa peça ou nota leva o áudio ao primeiro trecho em que ela aparece; clicar numa fala da transcrição também.
- Componentes Waveform, Slider, Avatar e Transcript copiados do Transly UI Kit; novo `PodcastTranscript` no estilo do kit.
- `scripts/podcast/build.mjs`: junta os áudios de cada fala, mede os tempos e gera a forma de onda.
- Testes que conferem se todo foco do roteiro existe no diagrama e se os tempos cobrem todas as falas.

### Alterado

- No celular, o cabeçalho do diagrama quebra em duas linhas em vez de espremer o título.

## [0.2.1] - 2026-10-29

### Corrigido

- As linhas tracejadas entre tópicos relacionados (por exemplo, Escala horizontal com Load balancer e Autoscaling) voltaram a aparecer. Elas usavam uma cor do estilo antigo que deixou de existir com o Transly UI Kit.

### Adicionado

- Teste que falha quando o app usa uma variável CSS que não está definida.

## [0.2.0] - 2026-10-29

### Adicionado

- Diagrama de arquitetura para cada um dos 15 casos de estudo, em modal sobre o mapa ou em guia nova (`#/diagrama/<caso>`).
- 23 tipos de componente (cliente, load balancer, gateway, serviço, worker, banco, réplica, cache, fila, log de eventos, storage, CDN, coordenação, WebSocket, job agendado, lock, filtro, busca, índice geoespacial, ledger, métricas...) com ícone animado próprio.
- Linhas de fluxo animadas por tipo: requisição síncrona, evento/fila, leitura de cache ou índice e replicação, com rótulos e ponto em movimento.
- Notas de implementação, alertas e dicas "na entrevista" ligadas ao componente a que se referem, e zonas agrupando partes do sistema.
- Componentes arrastáveis, zoom e legenda gerada a partir do que o diagrama usa.
- Transly UI Kit (v1.3.0) em `src/ui-kit`: tokens, tema escuro e claro e os componentes Button, IconButton, Badge, Card, Chip, SegmentedControl, Switch e outros.
- Novos componentes no estilo do kit: Modal, NoteCard e TextField.
- Botão para alternar entre tema escuro e claro, salvo no navegador.
- Testes de integridade dos diagramas (todo caso tem diagrama, ids únicos, fluxos e notas apontam para componentes existentes, toda nota de tipo obrigatório presente).

### Alterado

- Barra superior, mapa e painel de detalhes refeitos com o visual do Transly UI Kit.
- Clique duplo num caso do mapa abre o diagrama.

## [0.1.0] - 2026-10-29

### Adicionado

- Mapa macro interativo em React + React Flow com 12 grupos de assuntos e os 15 casos de estudo do board "Roadmap de System Design" no Miro.
- 69 tópicos (conceitos e padrões), cada um com resumo, trade-offs, expectativa para senior e para staff, tópicos relacionados e os casos onde é aplicado, com o motivo.
- Camada de design patterns: padrões de arquitetura (Saga, Outbox, CQRS, Circuit Breaker, Bulkhead, Event Sourcing, Strangler Fig, BFF) e de código (Strategy, Observer, Adapter, Factory, Decorator, Proxy, Chain of Responsibility, State, Command, Repository e Unit of Work), sempre com o ganho real que justifica o uso.
- Painel de detalhes; ao selecionar um caso, lista todos os tópicos que ele exercita agrupados por assunto.
- Filtros de foco senior / staff, de conceitos e padrões, busca sem acentos e opção de mostrar todas as conexões.
- Testes de integridade dos dados (referências, ids únicos, ganho em todo padrão) com Vitest.
- CI de testes e build e workflow de deploy no GitHub Pages.

[Não lançado]: https://github.com/alexssantos/system-design-map/compare/v0.6.0...HEAD
[0.6.0]: https://github.com/alexssantos/system-design-map/compare/v0.5.0...v0.6.0
[0.5.0]: https://github.com/alexssantos/system-design-map/compare/v0.4.0...v0.5.0
[0.4.0]: https://github.com/alexssantos/system-design-map/compare/v0.3.0...v0.4.0
[0.3.0]: https://github.com/alexssantos/system-design-map/compare/v0.2.1...v0.3.0
[0.2.1]: https://github.com/alexssantos/system-design-map/compare/v0.2.0...v0.2.1
[0.2.0]: https://github.com/alexssantos/system-design-map/compare/v0.1.0...v0.2.0
[0.1.0]: https://github.com/alexssantos/system-design-map/releases/tag/v0.1.0
