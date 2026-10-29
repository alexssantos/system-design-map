import { cases, groups, topics } from './data/graph';

export const NODE_W = 210;
export const NODE_H = 54;
const GAP_X = 16;
const GAP_Y = 12;
const GROUP_PAD = 20;
const GROUP_HEADER = 64;
const GROUP_COLS = 2;
const GRID_COLS = 4;
const GRID_GAP = 48;
const CASE_COLS = 5;

export const GROUP_W = GROUP_PAD * 2 + GROUP_COLS * NODE_W + (GROUP_COLS - 1) * GAP_X;

export interface Box {
  x: number;
  y: number;
  w: number;
  h: number;
}

export interface Layout {
  groups: Map<string, Box>;
  nodes: Map<string, { x: number; y: number }>;
  casesBand: Box;
}

/**
 * Layout determinístico: grupos em grade de 4 colunas, tópicos em 2 colunas dentro de cada
 * grupo e os 15 casos numa faixa abaixo, ordenados por nível do board. Posições fixas
 * mantêm o mapa estável entre visitas, o que ajuda a memorizar onde cada assunto mora.
 */
export function computeLayout(): Layout {
  const groupBoxes = new Map<string, Box>();
  const nodes = new Map<string, { x: number; y: number }>();

  const heightOf = (count: number) => {
    const rows = Math.ceil(count / GROUP_COLS);
    return GROUP_HEADER + rows * NODE_H + (rows - 1) * GAP_Y + GROUP_PAD;
  };

  let y = 0;
  for (let row = 0; row * GRID_COLS < groups.length; row++) {
    const rowGroups = groups.slice(row * GRID_COLS, (row + 1) * GRID_COLS);
    const rowH = Math.max(...rowGroups.map((g) => heightOf(topics.filter((t) => t.group === g.id).length)));
    rowGroups.forEach((g, col) => {
      const box = { x: col * (GROUP_W + GRID_GAP), y, w: GROUP_W, h: rowH };
      groupBoxes.set(g.id, box);
      topics
        .filter((t) => t.group === g.id)
        .forEach((t, i) => {
          nodes.set(t.id, {
            x: box.x + GROUP_PAD + (i % GROUP_COLS) * (NODE_W + GAP_X),
            y: box.y + GROUP_HEADER + Math.floor(i / GROUP_COLS) * (NODE_H + GAP_Y),
          });
        });
    });
    y += rowH + GRID_GAP;
  }

  const totalW = GRID_COLS * GROUP_W + (GRID_COLS - 1) * GRID_GAP;
  const caseW = (totalW - GROUP_PAD * 2 - (CASE_COLS - 1) * GAP_X) / CASE_COLS;
  const caseRows = Math.ceil(cases.length / CASE_COLS);
  const bandY = y + 40;
  cases.forEach((c, i) => {
    nodes.set(c.id, {
      x: GROUP_PAD + (i % CASE_COLS) * (caseW + GAP_X),
      y: bandY + GROUP_HEADER + Math.floor(i / CASE_COLS) * (NODE_H + 18 + GAP_Y),
    });
  });

  return {
    groups: groupBoxes,
    nodes,
    casesBand: {
      x: 0,
      y: bandY,
      w: totalW,
      h: GROUP_HEADER + caseRows * (NODE_H + 18) + (caseRows - 1) * GAP_Y + GROUP_PAD,
    },
  };
}

export const CASE_W =
  (GRID_COLS * GROUP_W + (GRID_COLS - 1) * GRID_GAP - GROUP_PAD * 2 - (CASE_COLS - 1) * GAP_X) / CASE_COLS;
