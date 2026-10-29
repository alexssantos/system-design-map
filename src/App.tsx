import {
  Background,
  Controls,
  ReactFlow,
  ReactFlowProvider,
  useReactFlow,
  type Edge,
  type Node,
} from '@xyflow/react';
import { useCallback, useMemo, useState } from 'react';
import { DetailPanel } from './components/DetailPanel';
import { nodeTypes } from './components/nodes';
import { cases, edges as graphEdges, groupById, groups, neighborsOf, topicById, topics, topicsByCase } from './data/graph';
import type { Level } from './data/types';
import { CASE_W, NODE_H, NODE_W, computeLayout } from './layout';

type LevelFocus = Level | 'all';

const layout = computeLayout();

// Tamanho fixo evita que o React Flow remeça (e esconda) os nós a cada re-render de hover,
// o que fazia o clique cair no pane.
const size = (width: number, height: number) => ({ width, height, measured: { width, height } });

function normalize(s: string) {
  return s.normalize('NFD').replace(/\p{Diacritic}/gu, '').toLowerCase();
}

function MapView() {
  const [selected, setSelected] = useState<string | null>(null);
  const [hovered, setHovered] = useState<string | null>(null);
  const [levelFocus, setLevelFocus] = useState<LevelFocus>('senior');
  const [showConcepts, setShowConcepts] = useState(true);
  const [showPatterns, setShowPatterns] = useState(true);
  const [showAllEdges, setShowAllEdges] = useState(false);
  const [query, setQuery] = useState('');
  const flow = useReactFlow();

  const focus = hovered ?? selected;
  const neighbors = useMemo(() => (focus ? neighborsOf(focus) : null), [focus]);

  const matches = useMemo(() => {
    const q = normalize(query.trim());
    if (!q) return null;
    const hit = new Set<string>();
    for (const t of topics) if (normalize(`${t.title} ${t.summary} ${t.gain ?? ''}`).includes(q)) hit.add(t.id);
    for (const c of cases) if (normalize(`${c.title} ${c.examples} ${c.summary}`).includes(q)) hit.add(c.id);
    return hit;
  }, [query]);

  const emphasisOf = useCallback(
    (id: string) => {
      if (focus) return id === focus ? 'focus' : neighbors?.has(id) ? 'neighbor' : 'dim';
      if (matches) return matches.has(id) ? 'focus' : 'dim';
      return 'normal';
    },
    [focus, neighbors, matches],
  );

  const nodes: Node[] = useMemo(() => {
    const out: Node[] = [];
    for (const g of groups) {
      const box = layout.groups.get(g.id)!;
      out.push({
        id: `group:${g.id}`,
        type: 'area',
        position: { x: box.x, y: box.y },
        data: { group: g, dim: Boolean(focus || matches) },
        ...size(box.w, box.h),
        selectable: false,
        draggable: false,
        zIndex: -1,
      });
    }
    const band = layout.casesBand;
    out.push({
      id: 'band:cases',
      type: 'band',
      position: { x: band.x, y: band.y },
      data: { title: 'Casos de estudo do board', subtitle: 'Nível 1 (semanas 5 a 9), nível 2 (10 a 15) e nível 3 (16 a 21)' },
      ...size(band.w, band.h),
      selectable: false,
      draggable: false,
      zIndex: -1,
    });
    for (const t of topics) {
      const hidden = (t.kind === 'concept' && !showConcepts) || (t.kind === 'pattern' && !showPatterns);
      out.push({
        id: t.id,
        type: 'topic',
        position: layout.nodes.get(t.id)!,
        data: {
          topic: t,
          color: groupById.get(t.group)!.color,
          emphasis: emphasisOf(t.id),
          faded: levelFocus === 'senior' && t.level === 'staff',
        },
        ...size(NODE_W, NODE_H),
        hidden,
        draggable: false,
      });
    }
    for (const c of cases) {
      out.push({
        id: c.id,
        type: 'case',
        position: layout.nodes.get(c.id)!,
        data: { studyCase: c, emphasis: emphasisOf(c.id), count: topicsByCase.get(c.id)!.length },
        ...size(CASE_W, NODE_H + 18),
        draggable: false,
      });
    }
    return out;
  }, [emphasisOf, focus, matches, levelFocus, showConcepts, showPatterns]);

  const edges: Edge[] = useMemo(() => {
    const visibleKind = (id: string) => {
      const t = topicById.get(id);
      if (!t) return true;
      return t.kind === 'concept' ? showConcepts : showPatterns;
    };
    return graphEdges
      .filter((e) => visibleKind(e.source) && visibleKind(e.target))
      .filter((e) => showAllEdges || (focus && (e.source === focus || e.target === focus)))
      .map((e) => {
        const color = groupById.get(topicById.get(e.source)!.group)!.color;
        const active = Boolean(focus);
        return {
          id: e.id,
          source: e.source,
          target: e.target,
          animated: active && e.kind === 'applied',
          style: {
            stroke: e.kind === 'applied' ? color : 'var(--muted)',
            strokeWidth: active ? 2 : 1,
            strokeDasharray: e.kind === 'related' ? '6 4' : undefined,
            opacity: active ? 0.9 : 0.25,
          },
        };
      });
  }, [focus, showAllEdges, showConcepts, showPatterns]);

  const select = useCallback(
    (id: string) => {
      setSelected(id);
      setHovered(null);
      // Enquadra o item e todas as conexões dele, para ver o "bairro" inteiro de uma vez.
      const ids = [id, ...neighborsOf(id)].map((n) => ({ id: n }));
      flow.fitView({ nodes: ids, duration: 500, padding: 0.15, maxZoom: 1.1 });
    },
    [flow],
  );

  return (
    <div className="app">
      <header className="toolbar">
        <div className="brand">
          <strong>Mapa de System Design</strong>
          <span className="muted">
            {topics.length} tópicos · {cases.length} casos
          </span>
        </div>
        <input
          className="search"
          type="search"
          placeholder="Buscar conceito, padrão ou caso…"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
        />
        <div className="segmented" role="radiogroup" aria-label="Nível">
          {(
            [
              ['senior', 'Foco senior'],
              ['staff', 'Foco staff'],
              ['all', 'Tudo'],
            ] as const
          ).map(([v, label]) => (
            <button key={v} role="radio" aria-checked={levelFocus === v} onClick={() => setLevelFocus(v)}>
              {label}
            </button>
          ))}
        </div>
        <label className="toggle">
          <input type="checkbox" checked={showConcepts} onChange={(e) => setShowConcepts(e.target.checked)} />● Conceitos
        </label>
        <label className="toggle">
          <input type="checkbox" checked={showPatterns} onChange={(e) => setShowPatterns(e.target.checked)} />◆ Padrões
        </label>
        <label className="toggle">
          <input type="checkbox" checked={showAllEdges} onChange={(e) => setShowAllEdges(e.target.checked)} />
          Todas as conexões
        </label>
      </header>
      <div className="body">
        <div className="canvas">
          <ReactFlow
            nodes={nodes}
            edges={edges}
            nodeTypes={nodeTypes}
            onNodeClick={(_, n) => (n.type === 'topic' || n.type === 'case') && select(n.id)}
            onNodeMouseEnter={(_, n) => (n.type === 'topic' || n.type === 'case') && setHovered(n.id)}
            onNodeMouseLeave={() => setHovered(null)}
            onPaneClick={() => setSelected(null)}
            nodesConnectable={false}
            fitView
            minZoom={0.15}
            maxZoom={1.5}
            colorMode="system"
            proOptions={{ hideAttribution: true }}
          >
            <Background gap={24} />
            <Controls showInteractive={false} />
          </ReactFlow>
        </div>
        <DetailPanel id={selected} levelFocus={levelFocus} onSelect={select} onClose={() => setSelected(null)} />
      </div>
    </div>
  );
}

export default function App() {
  return (
    <ReactFlowProvider>
      <MapView />
    </ReactFlowProvider>
  );
}
