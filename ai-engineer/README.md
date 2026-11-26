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

## Créditos

Conteúdo e código de Alex Santos. O formato de lição (palco animado, linha do tempo e guia lateral) é inspirado no curso
Designed to Scale, de Dilum Sanjaya. Fonte JetBrains Mono (OFL) e ícones Lucide (ISC).
