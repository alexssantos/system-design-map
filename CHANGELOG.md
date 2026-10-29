# Changelog

Todas as mudanças relevantes deste projeto ficam registradas aqui.

O formato segue o [Keep a Changelog](https://keepachangelog.com/pt-BR/1.1.0/) e o projeto usa [Versionamento Semântico](https://semver.org/lang/pt-BR/):

- **MAJOR** quando a estrutura dos dados ou a navegação mudam de forma incompatível.
- **MINOR** quando entram novos tópicos, casos, visões ou filtros.
- **PATCH** para correções de conteúdo, textos e estilo.

## [Não lançado]

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

[Não lançado]: https://github.com/alexssantos/system-design-map/compare/v0.2.0...HEAD
[0.2.0]: https://github.com/alexssantos/system-design-map/compare/v0.1.0...v0.2.0
[0.1.0]: https://github.com/alexssantos/system-design-map/releases/tag/v0.1.0
