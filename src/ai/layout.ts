import { NODE_H, NODE_W } from '../layout';
import { aiGroups, aiStages, aiTopics } from './graph';

export type AiView = 'trilha' | 'areas';

export interface Box {
  x: number;
  y: number;
  w: number;
  h: number;
}

export interface AiLayout {
  /** Fundos: colunas das etapas (trilha) ou caixas das áreas. */
  containers: { id: string; box: Box }[];
  nodes: Map<string, { x: number; y: number }>;
}

const PAD = 18;
const GAP_X = 16;
const GAP_Y = 12;
const STAGE_HEADER = 92;
const STAGE_GAP = 104;
const GROUP_HEADER = 64;
const GROUP_COLS = 2;
const GRID_COLS = 3;
const GRID_GAP = 48;

export const STAGE_W = NODE_W + PAD * 2;
const GROUP_W = PAD * 2 + GROUP_COLS * NODE_W + (GROUP_COLS - 1) * GAP_X;

/**
 * Trilha: uma coluna por etapa, da esquerda (primeiro a estudar) para a direita (último).
 * Dentro da coluna, os tópicos ficam na ordem de estudo, de cima para baixo.
 */
function trail(): AiLayout {
  const containers: AiLayout['containers'] = [];
  const nodes = new Map<string, { x: number; y: number }>();
  const tallest = Math.max(...aiStages.map((s) => aiTopics.filter((t) => t.stage === s.n).length));
  const h = STAGE_HEADER + tallest * (NODE_H + GAP_Y) - GAP_Y + PAD;
  aiStages.forEach((s, col) => {
    const x = col * (STAGE_W + STAGE_GAP);
    containers.push({ id: `band:stage-${s.n}`, box: { x, y: 0, w: STAGE_W, h } });
    aiTopics
      .filter((t) => t.stage === s.n)
      .forEach((t, i) => nodes.set(t.id, { x: x + PAD, y: STAGE_HEADER + i * (NODE_H + GAP_Y) }));
  });
  return { containers, nodes };
}

/** Por área: grade de 3 colunas, como o mapa de System Design, com os tópicos na ordem de estudo. */
function areas(): AiLayout {
  const containers: AiLayout['containers'] = [];
  const nodes = new Map<string, { x: number; y: number }>();
  const heightOf = (count: number) => {
    const rows = Math.ceil(count / GROUP_COLS);
    return GROUP_HEADER + rows * NODE_H + (rows - 1) * GAP_Y + PAD;
  };
  let y = 0;
  for (let row = 0; row * GRID_COLS < aiGroups.length; row++) {
    const rowGroups = aiGroups.slice(row * GRID_COLS, (row + 1) * GRID_COLS);
    const rowH = Math.max(...rowGroups.map((g) => heightOf(aiTopics.filter((t) => t.group === g.id).length)));
    rowGroups.forEach((g, col) => {
      const box = { x: col * (GROUP_W + GRID_GAP), y, w: GROUP_W, h: rowH };
      containers.push({ id: `group:${g.id}`, box });
      aiTopics
        .filter((t) => t.group === g.id)
        .forEach((t, i) =>
          nodes.set(t.id, {
            x: box.x + PAD + (i % GROUP_COLS) * (NODE_W + GAP_X),
            y: box.y + GROUP_HEADER + Math.floor(i / GROUP_COLS) * (NODE_H + GAP_Y),
          }),
        );
    });
    y += rowH + GRID_GAP;
  }
  return { containers, nodes };
}

export const aiLayouts: Record<AiView, AiLayout> = { trilha: trail(), areas: areas() };
