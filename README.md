# Mapa de System Design

Mapa visual e interativo para estudar system design e design patterns para entrevistas de nível **senior** e **staff**.

Os assuntos ficam agrupados pela relação entre eles (dados, comunicação, consistência, resiliência...) e cada um aponta para os casos de estudo onde é aplicado, com o motivo. A ideia é ver cada padrão pelo ganho real que ele traz num sistema concreto, não pelo uso em si.

A base de conteúdo é o board **Roadmap de System Design** no Miro (12 temas e 15 casos clássicos).

## Como usar o mapa

- Clique num conceito (●) ou padrão (◆) para ver resumo, ganho real, trade-offs, o que se espera de senior e de staff e onde ele aparece.
- Clique num caso para ver as perguntas de deep dive, o projeto sugerido e todos os tópicos que ele exercita.
- **Foco senior** apaga o que só costuma ser cobrado de staff. **Foco staff** destaca a expectativa de staff no painel.
- A busca ignora acentos e procura em títulos e resumos.

## Diagramas de arquitetura

Cada caso tem um diagrama animado: abra pelo botão **Ver diagrama de arquitetura** no painel, com clique duplo no card do caso ou direto em `#/diagrama/<caso>` (o ícone no canto do modal abre em guia nova).

- Cada componente tem ícone e cor do seu tipo (banco, cache, fila, worker...).
- As linhas mostram o tipo do fluxo: azul é requisição síncrona, verde tracejado é evento/fila, laranja pontilhado é leitura de cache ou índice e cinza é replicação.
- Notas azuis são de implementação, vermelhas são alertas e as verdes-limão são o que vale citar na entrevista.
- Um caso pode ter mais de uma versão do diagrama. A mais nova é a padrão; as anteriores ficam no painel do caso e no seletor de versão do modal (ou em `#/diagrama/<caso>/v<n>`). Para criar uma versão, adicione outro diagrama do mesmo caso em `src/diagrams/data.ts` com `version` e `changes` (o que mudou).
- Quando os fluxos têm `path` (`read`, `write` ou `both`), a legenda ganha um filtro que acende só o caminho de leitura ou só o de escrita.

## Podcast dos casos

O caso 01 (Encurtador de URL) tem um episódio de 14 minutos, em conversa entre Juliana e Jerri, que abre ao lado do diagrama. Enquanto toca, o diagrama acende as peças de que eles estão falando e a transcrição acompanha. Clicar numa peça ou numa fala leva o áudio até o trecho dela.

Cada roteiro pertence a uma versão do diagrama (`version` no roteiro). Um roteiro sem `.timing.json` aparece sem player: dá para percorrer as falas com os botões, e um aviso aponta a versão que tem áudio. Hoje o caso 01 tem áudio na v1 e só roteiro na v2. Com `reveal: true`, o diagrama vai sendo montado conforme as peças aparecem na conversa.

Para fazer o episódio de outro caso:

1. Escreva o roteiro em `src/podcasts/<caso>.ts` (capítulos, falas e o foco de cada uma no diagrama).
2. Gere o áudio de cada fala na ElevenLabs, salvando como `00.mp3`, `01.mp3`... numa pasta.
3. Rode `node scripts/podcast/build.mjs <pasta> <caso> <falas por capítulo, separadas por vírgula>`. Ele gera `public/podcasts/<caso>.mp3` e `src/podcasts/<caso>.timing.json` (precisa de ffmpeg).
4. Registre o episódio em `src/podcasts/index.ts` (sem o timing, ele entra só como roteiro). Os testes conferem se o foco existe no diagrama e se os tempos batem com as falas.

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
  diagrams/
    types.ts      # componentes, fluxos, notas e zonas de um diagrama
    data.ts       # os 15 diagramas
    icons.tsx     # ícone animado por tipo de componente
    DiagramView.tsx # canvas do diagrama (React Flow)
  podcasts/       # roteiros e tempos dos episódios (o mp3 fica em public/podcasts)
  components/     # cards do grafo, painel de detalhes, modal do diagrama, painel do podcast
    kit/          # componentes novos no estilo do Transly UI Kit
  ui-kit/         # cópia do Transly UI Kit (ver src/ui-kit/README.md)
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
