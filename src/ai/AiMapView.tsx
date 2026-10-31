import { Background, Controls, MarkerType, ReactFlow, useReactFlow, type Edge, type Node } from '@xyflow/react';
import { useCallback, useMemo, useRef, useState } from 'react';
import { FormatPicker } from '../components/FormatPicker';
import { TextField } from '../components/kit/TextField';
import { exportFlowImage, runExport, type ImageFormat } from '../export/flowImage';
import { NODE_H, NODE_W } from '../layout';
import type { Theme } from '../theme';
import { Badge, Button, IconButton, SegmentedControl, Switch } from '../ui-kit';
import { AiPanel } from './AiPanel';
import { aiEdges, aiGroupById, aiGroups, aiStages, aiTopicById, aiTopics, focusSets, orderOf } from './graph';
import { aiLayouts, type AiView } from './layout';
import { aiNodeTypes, type AiEmphasis } from './nodes';
import './ai.css';

const size = (width: number, height: number) => ({ width, height, measured: { width, height } });
const isContainer = (id: string) => id.startsWith('group:') || id.startsWith('band:');
const normalize = (s: string) =>
  s
    .normalize('NFD')
    .replace(/\p{Diacritic}/gu, '')
    .toLowerCase();

export function AiMapView({ theme, toggleTheme }: { theme: Theme; toggleTheme: () => void }) {
  const [view, setView] = useState<AiView>('trilha');
  const [selected, setSelected] = useState<string | null>(null);
  const [hovered, setHovered] = useState<string | null>(null);
  const [showAllEdges, setShowAllEdges] = useState(false);
  const [query, setQuery] = useState('');
  const [exporting, setExporting] = useState<'all' | 'selection' | null>(null);
  const [format, setFormat] = useState<ImageFormat>('png');
  const canvasRef = useRef<HTMLDivElement>(null);
  const flow = useReactFlow();
  const layout = aiLayouts[view];

  const focus = hovered ?? selected;
  const sets = useMemo(() => (focus ? focusSets(focus) : null), [focus]);

  const matches = useMemo(() => {
    const q = normalize(query.trim());
    if (!q) return null;
    return new Set(aiTopics.filter((t) => normalize(`${t.title} ${t.summary} ${t.inPractice}`).includes(q)).map((t) => t.id));
  }, [query]);

  const emphasisOf = useCallback(
    (id: string): AiEmphasis => {
      if (focus && sets) {
        if (id === focus) return 'focus';
        if (sets.path.has(id)) return 'path';
        if (sets.next.has(id)) return 'next';
        if (sets.related.has(id)) return 'related';
        return 'dim';
      }
      if (matches) return matches.has(id) ? 'focus' : 'dim';
      return 'normal';
    },
    [focus, sets, matches],
  );

  const nodes: Node[] = useMemo(() => {
    const out: Node[] = [];
    const dim = Boolean(focus || matches);
    for (const c of layout.containers) {
      const base = { id: c.id, position: { x: c.box.x, y: c.box.y }, ...size(c.box.w, c.box.h), selectable: false, draggable: false, zIndex: -1 };
      if (c.id.startsWith('band:stage-')) {
        const n = Number(c.id.slice('band:stage-'.length));
        const stage = aiStages[n - 1];
        out.push({ ...base, type: 'stage', data: { stage, count: aiTopics.filter((t) => t.stage === n).length, total: aiStages.length, dim } });
      } else {
        out.push({ ...base, type: 'aiGroup', data: { group: aiGroupById.get(c.id.slice('group:'.length))!, dim } });
      }
    }
    for (const t of aiTopics) {
      out.push({
        id: t.id,
        type: view === 'trilha' ? 'aiTrail' : 'aiArea',
        position: layout.nodes.get(t.id)!,
        data: {
          topic: t,
          color: aiGroupById.get(t.group)!.color,
          order: orderOf.get(t.id)!,
          emphasis: emphasisOf(t.id),
          stageLabel: view === 'areas' ? `E${t.stage}` : '',
        },
        ...size(NODE_W, NODE_H),
        draggable: false,
      });
    }
    return out;
  }, [layout, view, emphasisOf, focus, matches]);

  const edges: Edge[] = useMemo(() => {
    const stageOf = (id: string) => aiTopicById.get(id)!.stage;
    return aiEdges
      .filter((e) => (sets ? sets.edgeIds.has(e.id) : showAllEdges))
      .map((e) => {
        const color = aiGroupById.get(aiTopicById.get(e.source)!.group)!.color;
        const active = Boolean(sets);
        const prereq = e.kind === 'prereq';
        const sameStage = stageOf(e.source) === stageOf(e.target);
        const handles =
          view === 'trilha'
            ? { sourceHandle: 'r', targetHandle: sameStage ? 'rt' : 'l' }
            : { sourceHandle: 'b', targetHandle: 't' };
        // O que o tópico em foco destrava fica mais discreto que a trilha até ele.
        const isNext = Boolean(focus && e.source === focus && sets?.next.has(e.target));
        return {
          id: e.id,
          source: e.source,
          target: e.target,
          ...handles,
          animated: active && prereq,
          markerEnd: prereq ? { type: MarkerType.ArrowClosed, color, width: 16, height: 16 } : undefined,
          style: {
            stroke: prereq ? color : 'var(--color-text-2)',
            strokeWidth: active ? (isNext ? 1.5 : 2.2) : 1,
            strokeDasharray: prereq ? undefined : '6 4',
            opacity: active ? (isNext ? 0.6 : 0.95) : 0.3,
          },
        };
      });
  }, [sets, focus, showAllEdges, view]);

  const select = useCallback(
    (id: string) => {
      setSelected(id);
      setHovered(null);
      const s = focusSets(id);
      const ids = [id, ...s.path, ...s.next].map((n) => ({ id: n }));
      flow.fitView({ nodes: ids, duration: 500, padding: 0.15, maxZoom: 1.1 });
    },
    [flow],
  );

  const exportMap = (which: 'all' | 'selection') => {
    if (!canvasRef.current || exporting) return;
    const root = canvasRef.current;
    const s = which === 'selection' && selected ? focusSets(selected) : null;
    const keep = s ? new Set([selected!, ...s.path, ...s.next, ...s.related]) : null;
    const name = s ? `trilha ${aiTopicById.get(selected!)?.title}` : `mapa de engenharia de ai ${view === 'trilha' ? 'trilha' : 'areas'}`;
    runExport(
      (busy) => setExporting(busy ? which : null),
      () =>
        exportFlowImage(root, {
          fileName: name,
          format,
          isContainer,
          includeNode: keep ? (id) => keep.has(id) : undefined,
          includeEdge: s ? (id) => s.edgeIds.has(id) : undefined,
        }),
    );
  };

  return (
    <div className="app">
      <header className="toolbar">
        <div className="brand">
          <div>
            <strong>Mapa de Engenharia de AI</strong>
            <span className="muted">
              {aiTopics.length} termos · {aiGroups.length} áreas · {aiStages.length} etapas de estudo
            </span>
          </div>
        </div>
        <TextField className="toolbar__search" value={query} onChange={setQuery} label="Buscar no mapa" placeholder="Buscar termo…" />
        <SegmentedControl
          label="Organizar por"
          value={view}
          onChange={(v) => setView(v as AiView)}
          options={[
            { value: 'trilha', label: 'Trilha', icon: 'arrow-up-right' },
            { value: 'areas', label: 'Por área', icon: 'grid' },
          ]}
        />
        <div className="toolbar__switches">
          <Switch checked={showAllEdges} onChange={setShowAllEdges} label="Todas as conexões" />
        </div>
        <Badge tone="accent" dot>
          Clique num termo para ver a trilha até ele
        </Badge>
        <div className="toolbar__downloads" role="group" aria-label="Baixar imagem">
          <FormatPicker value={format} onChange={setFormat} />
          <Button
            variant="dark"
            size="sm"
            icon="download"
            disabled={!selected || Boolean(exporting)}
            loading={exporting === 'selection'}
            title={selected ? `Baixa o termo selecionado com a trilha até ele em ${format.toUpperCase()}` : 'Selecione um termo no mapa'}
            onClick={() => exportMap('selection')}
          >
            Trilha do termo
          </Button>
          <Button
            variant="dark"
            size="sm"
            icon="download"
            disabled={Boolean(exporting)}
            loading={exporting === 'all'}
            title={`Baixa o mapa inteiro em ${format.toUpperCase()}`}
            onClick={() => exportMap('all')}
          >
            Mapa inteiro
          </Button>
        </div>
        <IconButton
          icon={theme === 'dark' ? 'sun' : 'moon'}
          label={theme === 'dark' ? 'Tema claro' : 'Tema escuro'}
          variant="soft"
          onClick={toggleTheme}
        />
      </header>
      <div className="body">
        <div className="canvas" ref={canvasRef}>
          <ReactFlow
            key={view}
            nodes={nodes}
            edges={edges}
            nodeTypes={aiNodeTypes}
            onNodeClick={(_, n) => n.type?.startsWith('ai') && n.type !== 'aiGroup' && select(n.id)}
            onNodeMouseEnter={(_, n) => (n.type === 'aiTrail' || n.type === 'aiArea') && setHovered(n.id)}
            onNodeMouseLeave={() => setHovered(null)}
            onPaneClick={() => setSelected(null)}
            zoomOnDoubleClick={false}
            nodesConnectable={false}
            fitView
            minZoom={0.12}
            maxZoom={1.5}
            colorMode={theme}
            proOptions={{ hideAttribution: true }}
          >
            <Background gap={24} />
            <Controls showInteractive={false} />
          </ReactFlow>
        </div>
        <AiPanel id={selected} onSelect={select} onClose={() => setSelected(null)} />
      </div>
    </div>
  );
}
