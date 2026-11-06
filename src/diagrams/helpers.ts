/** Atalhos para escrever diagramas de forma compacta (componente, fluxo, caminho e nota). */
import type {
  ComponentKind,
  DiagramComponent,
  DiagramFlow,
  DiagramNote,
  FlowKind,
  FlowPath,
  FlowSide,
  NoteKind,
} from './types';

export const c = (
  id: string,
  kind: ComponentKind,
  label: string,
  col: number,
  row: number,
  tech?: string,
  stack?: boolean,
): DiagramComponent => ({ id, kind, label, at: [col, row], tech, stack });

export const f = (from: string, to: string, kind: FlowKind, label?: string, both?: boolean): DiagramFlow => ({
  from,
  to,
  kind,
  label,
  both,
});

/** Fluxo marcado com o caminho (leitura, escrita ou os dois) para o filtro do diagrama. */
export const on = (path: FlowPath, flow: DiagramFlow): DiagramFlow => ({ ...flow, path });

export const n = (kind: NoteKind, title: string, text: string, col: number, row: number, target?: string): DiagramNote => ({
  kind,
  title,
  text,
  at: [col, row],
  target,
});


/** Fluxo com lados fixos de saída e chegada (ex.: arcos de um ciclo). */
export const via = (from: FlowSide, to: FlowSide, flow: DiagramFlow): DiagramFlow => ({ ...flow, sides: [from, to] });
