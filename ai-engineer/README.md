# AI Engineer

Curso visual de AI Engineering em pt-BR, com lições animadas passo a passo, para preparação de entrevistas (sênior e staff).

- 9 módulos, 13 lições prontas (94 passos) e as demais marcadas como "em breve".
- Cada lição tem um diagrama isométrico animado, métricas que mudam a cada passo, linha do tempo e o texto guia.
- Layout para desktop (três colunas), tablet (menu em gaveta) e celular (uma coluna, navegação fixa embaixo).
- Tema claro e escuro, busca (Ctrl K), atalhos de teclado e progresso salvo no navegador.

## Rodar

```bash
npm install
npm run dev
npm run build   # gera dist/
```

Na Vercel: framework Vite, diretório raiz `ai-engineer`.

## Onde fica cada coisa

- `src/course.ts`: módulos e ordem das lições.
- `src/lessons/*.ts`: conteúdo das lições (entidades do diagrama, passos, fluxos).
- `src/Stage.tsx`: desenho e animação do diagrama.
- `src/App.tsx` e `src/styles.css`: interface.

## O diagrama

- Malha isométrica de 28x14. Cada entidade se encaixa num vértice da malha e as ligações correm só nos dois eixos, em L com o canto arredondado, tocando a borda dos objetos.
- Troca de passo com os tempos medidos no curso de referência: o que sai some (420 ms); a câmera se reenquadra e o que mudou desliza (820 ms), com as setas acompanhando e nomes em cross-fade; o que é novo cai, um a cada 130 ms (680 ms); cada ligação nova se desenha quando as pontas chegam (560 ms); no fim, pulso verde na base e tráfego. O pacote para antes da ponta da seta e pulsa ao chegar (num vai e volta, só no fim da volta).
- Câmera por passo: zoom de 0,3 a 1,25 em passos de 0,05, margem de 16 px; o quadro só se mexe quando o conteúdo novo não cabe. O leitor aproxima com Ctrl+roda, pinça ou dois cliques; Ajustar (tecla 0) volta ao quadro. Repetir refaz a troca a partir do passo anterior.
- Tipos de objeto: `block`, `plate`, `cyl`, `crowd` (muitos usuários), `zone` (área no chão), `queue` (fila com itens). Opções: `scale`, `ghost`, `down` (fora do ar), `gauge`, `note`.
- `set` num passo muda propriedades de entidades (posição, escala, medidor, aviso, cor) com transição suave.
- No desktop a janela é desenhada para 1672x920 e escalada para caber na tela, como no curso de referência.

## Créditos

Conteúdo e código de Alex Santos. O formato de lição (palco animado, linha do tempo e guia lateral) é inspirado no curso
Designed to Scale, de Dilum Sanjaya. Fonte JetBrains Mono (OFL) e ícones Lucide (ISC).

## Regras do diagrama e verificador

`npm run build` roda antes `npm run check` (`scripts/check-lessons.ts`), que falha se alguma lição quebrar uma regra: tudo o que um passo cita está na tela, e nenhum objeto visível fica sem seta (salvo desligado, `ghost`, ou fora de uso no passo, `idle`). Quando o passo não cita a ligação de um objeto, ela continua tracejada a partir do último passo em que ele estava ligado (`src/wiring.ts`).

`npm run roteiros` gera `docs/ROTEIROS.md`, o roteiro visual de cada lição passo a passo (o que entra, sai, muda, o tráfego e as ligações), para revisar a história sem abrir o site.

Os nomes ficam em cima dos objetos; só vão para o lado quando em cima cobririam outro objeto.
