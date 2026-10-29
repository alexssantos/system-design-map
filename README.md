# Mapa de System Design

Mapa visual e interativo para estudar system design e design patterns para entrevistas de nível **senior** e **staff**.

Os assuntos ficam agrupados pela relação entre eles (dados, comunicação, consistência, resiliência...) e cada um aponta para os casos de estudo onde é aplicado, com o motivo. A ideia é ver cada padrão pelo ganho real que ele traz num sistema concreto, não pelo uso em si.

A base de conteúdo é o board **Roadmap de System Design** no Miro (12 temas e 15 casos clássicos).

## Como usar o mapa

- Clique num conceito (●) ou padrão (◆) para ver resumo, ganho real, trade-offs, o que se espera de senior e de staff e onde ele aparece.
- Clique num caso para ver as perguntas de deep dive, o projeto sugerido e todos os tópicos que ele exercita.
- **Foco senior** apaga o que só costuma ser cobrado de staff. **Foco staff** destaca a expectativa de staff no painel.
- A busca ignora acentos e procura em títulos e resumos.

## Rodando localmente

```bash
npm install
npm run dev      # http://localhost:5173
npm test         # testes de integridade dos dados
npm run build    # gera dist/
```

## Estrutura

```
src/
  data/
    types.ts      # modelo: Group, Topic (conceito ou padrão) e StudyCase
    groups.ts     # 12 grupos, ligados aos temas do board
    topics.ts     # conceitos e padrões com relações e aplicações
    cases.ts      # 15 casos do board
    graph.ts      # índices derivados (vizinhos, tópicos por caso, arestas)
  layout.ts       # posições fixas dos grupos, tópicos e casos
  components/     # cards do grafo e painel de detalhes
  App.tsx
```

### Adicionando um tópico

1. Inclua o objeto em `src/data/topics.ts` no grupo certo.
2. Preencha `related` com ids de outros tópicos e `appliedIn` com os casos e o motivo.
3. Padrões (`kind: 'pattern'`) precisam do campo `gain`.
4. Rode `npm test`: os testes falham se algum id não existir.
5. Registre a mudança em `CHANGELOG.md` na seção **Não lançado**.

## Deploy

O workflow `.github/workflows/pages.yml` publica o `main` no GitHub Pages. Para ativar, em **Settings → Pages**, escolha **GitHub Actions** como fonte.

## Versionamento

O projeto segue [Versionamento Semântico](https://semver.org/lang/pt-BR/) e o histórico fica em [CHANGELOG.md](CHANGELOG.md). Cada versão ganha uma tag `vX.Y.Z`.
