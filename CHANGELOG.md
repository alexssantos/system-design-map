# Changelog

Todas as mudanças relevantes deste projeto ficam registradas aqui.

O formato segue o [Keep a Changelog](https://keepachangelog.com/pt-BR/1.1.0/) e o projeto usa [Versionamento Semântico](https://semver.org/lang/pt-BR/):

- **MAJOR** quando a estrutura dos dados ou a navegação mudam de forma incompatível.
- **MINOR** quando entram novos tópicos, casos, visões ou filtros.
- **PATCH** para correções de conteúdo, textos e estilo.

## [Não lançado]

## [0.1.0] - 2026-10-29

### Adicionado

- Mapa macro interativo em React + React Flow com 12 grupos de assuntos e os 15 casos de estudo do board "Roadmap de System Design" no Miro.
- 69 tópicos (conceitos e padrões), cada um com resumo, trade-offs, expectativa para senior e para staff, tópicos relacionados e os casos onde é aplicado, com o motivo.
- Camada de design patterns: padrões de arquitetura (Saga, Outbox, CQRS, Circuit Breaker, Bulkhead, Event Sourcing, Strangler Fig, BFF) e de código (Strategy, Observer, Adapter, Factory, Decorator, Proxy, Chain of Responsibility, State, Command, Repository e Unit of Work), sempre com o ganho real que justifica o uso.
- Painel de detalhes; ao selecionar um caso, lista todos os tópicos que ele exercita agrupados por assunto.
- Filtros de foco senior / staff, de conceitos e padrões, busca sem acentos e opção de mostrar todas as conexões.
- Testes de integridade dos dados (referências, ids únicos, ganho em todo padrão) com Vitest.
- CI de testes e build e workflow de deploy no GitHub Pages.

[Não lançado]: https://github.com/alexssantos/system-design-map/compare/v0.1.0...HEAD
[0.1.0]: https://github.com/alexssantos/system-design-map/releases/tag/v0.1.0
