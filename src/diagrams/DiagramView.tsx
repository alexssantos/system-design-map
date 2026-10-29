import {
  Background,
  BaseEdge,
  Controls,
  EdgeLabelRenderer,
  Handle,
  Position,
  ReactFlow,
  ReactFlowProvider,
  getBezierPath,
  useNodesState,
  type Edge,
  type EdgeProps,
  type Node,
  type NodeProps,
} from '@xyflow/react';
import { useMemo } from 'react';
import { NoteCard } from '../components/kit/NoteCard';
import { KindIcon, kindColor, kindName } from './icons';
import type { ComponentKind, Diagram, DiagramComponent, FlowKind, NoteKind } from './types';
import './diagram.css';

const COL = 240;
const ROW = 175;
const COMP_W = 150;
const COMP_H = 104;
const NOTE_W = 250;

type Side = 'top' | 'right' | 'bottom' | 'left';

type CompNode = Node<{ comp: DiagramComponent }, 'comp'>;
type NoteNode = Node<{ kind: NoteKind; title: string; text: string; index: number }, 'note'>;
type ZoneNode = Node<{ label: string }, 'zone'>;
type FlowEdgeT = Edge<{ kind: FlowKind | 'note'; label?: string; both?: boolean; delay: number }, 'flow'>;

const sides: Side[] = ['top', 'right', 'bottom', 'left'];
const pos: Record<Side, Position> = { top: Position.Top, right: Position.Right, bottom: Position.Bottom, left: Position.Left };

function AllHandles() {
  return (
    <>
      {sides.map((s) => (
        <Handle key={`s-${s}`} id={`s-${s}`} type="source" position={pos[s]} className="dg-handle" isConnectable={false} />
      ))}
      {sides.map((s) => (
        <Handle key={`t-${s}`} id={`t-${s}`} type="target" position={pos[s]} className="dg-handle" isConnectable={false} />
      ))}
    </>
  );
}

function CompCard({ data }: NodeProps<CompNode>) {
  const { comp } = data;
  return (
    <div
      className={`dg-comp${comp.stack ? ' is-stack' : ''}`}
      style={{ '--kind': kindColor[comp.kind] } as React.CSSProperties}
      title={kindName[comp.kind]}
    >
      <AllHandles />
      <div className="dg-comp__icon">
        <KindIcon kind={comp.kind} size={40} />
      </div>
      <div className="dg-comp__label">{comp.label}</div>
      {comp.tech && <div className="dg-comp__tech">{comp.tech}</div>}
    </div>
  );
}

function NoteBox({ data }: NodeProps<NoteNode>) {
  return (
    <div className="dg-note">
      <AllHandles />
      <NoteCard tone={data.kind} title={data.title} text={data.text} index={data.index} />
    </div>
  );
}

function Zone({ data }: NodeProps<ZoneNode>) {
  return (
    <div className="dg-zone">
      <span className="dg-zone__label tl-caps">{data.label}</span>
    </div>
  );
}

function FlowEdge({ id, sourceX, sourceY, targetX, targetY, sourcePosition, targetPosition, data }: EdgeProps<FlowEdgeT>) {
  const [path, lx, ly] = getBezierPath({ sourceX, sourceY, targetX, targetY, sourcePosition, targetPosition });
  const kind = data?.kind ?? 'sync';
  const dur = `${2.4 + (data?.delay ?? 0) * 0.15}s`;
  const begin = `-${(data?.delay ?? 0) * 0.35}s`; // negativo: o ponto já nasce no meio do caminho, nunca parado em (0,0)
  return (
    <>
      <BaseEdge id={id} path={path} className={`dg-edge dg-edge--${kind}`} />
      {kind !== 'note' && (
        <>
          <circle r={4.5} className={`dg-dot dg-dot--${kind}`}>
            <animateMotion dur={dur} begin={begin} repeatCount="indefinite" path={path} />
          </circle>
          {data?.both && (
            <circle r={4.5} className={`dg-dot dg-dot--${kind}`}>
              <animateMotion dur={dur} begin={begin} repeatCount="indefinite" path={path} keyPoints="1;0" keyTimes="0;1" calcMode="linear" />
            </circle>
          )}
        </>
      )}
      {data?.label && (
        <EdgeLabelRenderer>
          <div className={`dg-edge-label dg-edge-label--${kind}`} style={{ transform: `translate(-50%, -50%) translate(${lx}px, ${ly}px)` }}>
            {data.label}
          </div>
        </EdgeLabelRenderer>
      )}
    </>
  );
}

const nodeTypes = { comp: CompCard, note: NoteBox, zone: Zone };
const edgeTypes = { flow: FlowEdge };

const px = ([c, r]: [number, number]) => ({ x: c * COL, y: r * ROW });

/** Escolhe os lados de saída e chegada pela posição relativa dos centros. */
function pickSides(a: { x: number; y: number; w: number; h: number }, b: { x: number; y: number; w: number; h: number }) {
  const dx = b.x + b.w / 2 - (a.x + a.w / 2);
  const dy = b.y + b.h / 2 - (a.y + a.h / 2);
  if (Math.abs(dx) >= Math.abs(dy) * 0.9) {
    return dx >= 0 ? (['right', 'left'] as const) : (['left', 'right'] as const);
  }
  return dy >= 0 ? (['bottom', 'top'] as const) : (['top', 'bottom'] as const);
}

function build(d: Diagram) {
  const nodes: Node[] = [];
  const boxes = new Map<string, { x: number; y: number; w: number; h: number }>();

  d.zones?.forEach((z, i) => {
    const a = px(z.from);
    const b = px(z.to);
    nodes.push({
      id: `zone-${i}`,
      type: 'zone',
      position: a,
      data: { label: z.label },
      width: b.x - a.x + COMP_W,
      height: b.y - a.y,
      measured: { width: b.x - a.x + COMP_W, height: b.y - a.y },
      draggable: false,
      selectable: false,
      zIndex: -1,
    });
  });

  for (const c of d.components) {
    const p = px(c.at);
    boxes.set(c.id, { ...p, w: COMP_W, h: COMP_H });
    nodes.push({ id: c.id, type: 'comp', position: p, data: { comp: c }, width: COMP_W, height: COMP_H });
  }

  d.notes.forEach((n, i) => {
    const p = px(n.at);
    const id = `note-${i}`;
    boxes.set(id, { ...p, w: NOTE_W, h: 130 });
    nodes.push({ id, type: 'note', position: p, data: { ...n, index: i }, width: NOTE_W, zIndex: 2 });
  });

  const edges: FlowEdgeT[] = d.flows.map((f, i) => {
    const [s, t] = pickSides(boxes.get(f.from)!, boxes.get(f.to)!);
    return {
      id: `f-${i}`,
      type: 'flow',
      source: f.from,
      target: f.to,
      sourceHandle: `s-${s}`,
      targetHandle: `t-${t}`,
      data: { kind: f.kind, label: f.label, both: f.both, delay: i },
    };
  });

  d.notes.forEach((n, i) => {
    if (!n.target) return;
    const [s, t] = pickSides(boxes.get(`note-${i}`)!, boxes.get(n.target)!);
    edges.push({
      id: `n-${i}`,
      type: 'flow',
      source: `note-${i}`,
      target: n.target,
      sourceHandle: `s-${s}`,
      targetHandle: `t-${t}`,
      data: { kind: 'note', delay: 0 },
    });
  });

  return { nodes, edges };
}

const FLOW_LEGEND: { kind: FlowKind; label: string }[] = [
  { kind: 'sync', label: 'Requisição síncrona' },
  { kind: 'async', label: 'Evento / fila' },
  { kind: 'read', label: 'Leitura de cache ou índice' },
  { kind: 'replication', label: 'Replicação' },
];

export function DiagramLegend({ diagram }: { diagram: Diagram }) {
  const kinds = [...new Set(diagram.components.map((c) => c.kind))] as ComponentKind[];
  return (
    <div className="dg-legend">
      <div className="dg-legend__group">
        {FLOW_LEGEND.map((l) => (
          <span key={l.kind} className="dg-legend__item">
            <svg width="34" height="10" aria-hidden>
              <line x1="2" y1="5" x2="32" y2="5" className={`dg-edge dg-edge--${l.kind}`} />
              <circle cx="17" cy="5" r="3.5" className={`dg-dot dg-dot--${l.kind}`} />
            </svg>
            {l.label}
          </span>
        ))}
      </div>
      <div className="dg-legend__group">
        {kinds.map((k) => (
          <span key={k} className="dg-legend__item">
            <KindIcon kind={k} size={18} />
            {kindName[k]}
          </span>
        ))}
      </div>
    </div>
  );
}

function Canvas({ diagram, colorMode }: { diagram: Diagram; colorMode: 'dark' | 'light' }) {
  const initial = useMemo(() => build(diagram), [diagram]);
  const [nodes, , onNodesChange] = useNodesState(initial.nodes);
  return (
    <ReactFlow
      nodes={nodes}
      edges={initial.edges}
      onNodesChange={onNodesChange}
      nodeTypes={nodeTypes}
      edgeTypes={edgeTypes}
      nodesConnectable={false}
      fitView
      fitViewOptions={{ padding: 0.08 }}
      minZoom={0.2}
      maxZoom={1.8}
      colorMode={colorMode}
      proOptions={{ hideAttribution: true }}
    >
      <Background gap={22} size={1.2} />
      <Controls showInteractive={false} />
    </ReactFlow>
  );
}

/** Canvas do diagrama de um caso. Componentes podem ser arrastados para estudar o desenho. */
export function DiagramView({ diagram, colorMode }: { diagram: Diagram; colorMode: 'dark' | 'light' }) {
  return (
    <div className="dg">
      <div className="dg__canvas">
        <ReactFlowProvider>
          <Canvas key={diagram.caseId} diagram={diagram} colorMode={colorMode} />
        </ReactFlowProvider>
      </div>
      <DiagramLegend diagram={diagram} />
    </div>
  );
}
