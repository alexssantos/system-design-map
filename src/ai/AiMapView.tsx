import { Background, Controls, MarkerType, ReactFlow, useReactFlow, type Edge, type Node } from '@xyflow/react';
import { useCallback, useMemo, useRef, useState } from 'react';
import { DiagramModal } from '../components/DiagramModal';
import { FormatPicker } from '../components/FormatPicker';
import { Band } from '../components/nodes';
import { TextField } from '../components/kit/TextField';
import { Toolbar } from '../components/Toolbar';
import { edgeTypes } from '../components/HaloEdge';
import { CanvasControls, frameItem, useLayout } from '../components/LayoutControls';
import { exportFlowImage, runExport, type ImageFormat } from '../export/flowImage';
import { NODE_H, NODE_W } from '../layout';
import type { Theme } from '../theme';
import { Badge, Button, IconButton, SegmentedControl, Switch } from '../ui-kit';
import { AiPanel } from './AiPanel';
import {
  aiCaseById,
  aiCaseEdges,
  aiCases,
  aiEdges,
  aiGroupById,
  aiGroups,
  aiStages,
  aiTopicById,
  aiTopics,
  casesOfTopic,
  focusSets,
  orderOf,
} from './graph';
import { AI_CASE_H, aiLayouts, type AiView } from './layout';
import { aiNodeTypes, type AiEmphasis } from './nodes';
import './ai.css';

const nodeTypes = { ...aiNodeTypes, band: Band };

/** O que acende quando um caso está em foco: ele e os termos que exercita. */
function caseSets(id: string) {
  const topics = new Set(aiCaseById.get(id)?.uses.map((u) => u.topic));
  return { topics, edgeIds: new Set(aiCaseEdges.filter((e) => e.target === id).map((e) => e.id)) };
}

/** Itens a enquadrar quando algo é selecionado. */
function frameIds(id: string) {
  if (aiCaseById.has(id)) return [id, ...caseSets(id).topics];
  const s = focusSets(id);
  return [id, ...s.path, ...s.next];
}

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
  const [diagramFor, setDiagramFor] = useState<string | null>(null);
  const canvasRef = useRef<HTMLDivElement>(null);
  const flow = useReactFlow();
  const { focus: focusMode, panelHidden, setPanelHidden } = useLayout();
  const showPanel = !focusMode && !panelHidden;
  const layout = aiLayouts[view];

  const focus = hovered ?? selected;
  const selectedFit = useMemo(() => (selected ? frameIds(selected) : undefined), [selected]);
  const focusIsCase = Boolean(focus && aiCaseById.has(focus));
  const sets = useMemo(() => (focus && !focusIsCase ? focusSets(focus) : null), [focus, focusIsCase]);
  const cSets = useMemo(() => (focus && focusIsCase ? caseSets(focus) : null), [focus, focusIsCase]);
  /** Casos que usam o termo em foco. */
  const topicCases = useMemo(() => new Set(focus && !focusIsCase ? (casesOfTopic.get(focus) ?? []).map((u) => u.case.id) : []), [focus, focusIsCase]);

  const matches = useMemo(() => {
    const q = normalize(query.trim());
    if (!q) return null;
    return new Set([
      ...aiTopics.filter((t) => normalize(`${t.title} ${t.summary} ${t.inPractice}`).includes(q)).map((t) => t.id),
      ...aiCases.filter((c) => normalize(`${c.title} ${c.examples} ${c.summary}`).includes(q)).map((c) => c.id),
    ]);
  }, [query]);

  const emphasisOf = useCallback(
    (id: string): AiEmphasis => {
      if (focus && cSets) {
        if (id === focus) return 'focus';
        return cSets.topics.has(id) ? 'path' : 'dim';
      }
      if (focus && sets) {
        if (id === focus) return 'focus';
        if (topicCases.has(id)) return 'related';
        if (sets.path.has(id)) return 'path';
        if (sets.next.has(id)) return 'next';
        if (sets.related.has(id)) return 'related';
        return 'dim';
      }
      if (matches) return matches.has(id) ? 'focus' : 'dim';
      return 'normal';
    },
    [focus, sets, cSets, topicCases, matches],
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
    const band = layout.casesBand;
    out.push({
      id: 'band:cases',
      type: 'band',
      position: { x: band.x, y: band.y },
      data: { title: 'Casos de estudo', subtitle: 'Sistemas reais em que esses termos resolvem um problema. Clique duplo abre o diagrama animado.' },
      ...size(band.w, band.h),
      selectable: false,
      draggable: false,
      zIndex: -1,
    });
    for (const c of aiCases) {
      out.push({
        id: c.id,
        type: 'aiCase',
        position: layout.nodes.get(c.id)!,
        data: { aiCase: c, emphasis: emphasisOf(c.id), count: c.uses.length },
        ...size(layout.caseW, AI_CASE_H),
        draggable: false,
      });
    }
    return out;
  }, [layout, view, emphasisOf, focus, matches]);

  const edges: Edge[] = useMemo(() => {
    const stageOf = (id: string) => aiTopicById.get(id)!.stage;
    const useEdges: Edge[] = aiCaseEdges
      .filter((e) => (cSets ? cSets.edgeIds.has(e.id) : Boolean(sets) && e.source === focus))
      .map((e) => {
        const color = aiGroupById.get(aiTopicById.get(e.source)!.group)!.color;
        return {
          id: e.id,
          source: e.source,
          target: e.target,
          sourceHandle: 'b',
          targetHandle: 't',
          type: 'halo',
          data: { color, dot: true },
          animated: true,
          markerEnd: { type: MarkerType.ArrowClosed, color, width: 16, height: 16 },
          style: { stroke: color, strokeWidth: cSets ? 2.2 : 1.6, opacity: cSets ? 0.9 : 0.55 },
        };
      });
    if (cSets) return useEdges;
    const topicEdges: Edge[] = aiEdges
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
          type: 'halo',
          data: { color, dot: prereq && active },
          animated: active && prereq,
          markerEnd: prereq ? { type: MarkerType.ArrowClosed, color, width: 18, height: 18 } : undefined,
          style: {
            stroke: prereq ? color : 'var(--color-text-2)',
            strokeWidth: active ? (isNext ? 1.8 : 2.6) : 1.2,
            strokeDasharray: prereq ? undefined : '6 4',
            opacity: active ? (isNext ? 0.6 : 0.95) : 0.3,
          },
        };
      });
    return [...topicEdges, ...useEdges];
  }, [sets, cSets, focus, showAllEdges, view]);

  const select = useCallback(
    (id: string) => {
      setSelected(id);
      setHovered(null);
      setPanelHidden(false);
      frameItem(flow, id, frameIds(id));
    },
    [flow, setPanelHidden],
  );

  const exportMap = (which: 'all' | 'selection') => {
    if (!canvasRef.current || exporting) return;
    const root = canvasRef.current;
    const sel = which === 'selection' ? selected : null;
    const asCase = sel && aiCaseById.has(sel) ? caseSets(sel) : null;
    const s = sel && !asCase ? focusSets(sel) : null;
    const keep = asCase ? new Set([sel!, ...asCase.topics]) : s ? new Set([sel!, ...s.path, ...s.next, ...s.related]) : null;
    const edgeIds = asCase ? asCase.edgeIds : s?.edgeIds;
    const name = asCase
      ? `caso ${aiCaseById.get(sel!)?.title}`
      : s
        ? `trilha ${aiTopicById.get(sel!)?.title}`
        : `mapa de engenharia de ai ${view === 'trilha' ? 'trilha' : 'areas'}`;
    runExport(
      (busy) => setExporting(busy ? which : null),
      () =>
        exportFlowImage(root, {
          fileName: name,
          format,
          isContainer,
          includeNode: keep ? (id) => keep.has(id) : undefined,
          includeEdge: edgeIds ? (id) => edgeIds.has(id) : undefined,
        }),
    );
  };

  return (
    <div className="app">
      <Toolbar
        title="Mapa de Engenharia de AI"
        subtitle={<>{aiTopics.length} termos · {aiGroups.length} áreas · {aiStages.length} etapas · {aiCases.length} casos</>}
        end={
          <IconButton
            icon={theme === 'dark' ? 'sun' : 'moon'}
            label={theme === 'dark' ? 'Tema claro' : 'Tema escuro'}
            variant="soft"
            onClick={toggleTheme}
          />
        }
      >
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
        <Badge tone="accent" dot className="toolbar__hint">
          Clique num termo para ver a trilha; clique duplo num caso abre o diagrama
        </Badge>
        <div className="toolbar__downloads" role="group" aria-label="Baixar imagem">
          <FormatPicker value={format} onChange={setFormat} />
          <Button
            variant="dark"
            size="sm"
            icon="download"
            disabled={!selected || Boolean(exporting)}
            loading={exporting === 'selection'}
            title={selected ? `Baixa o item selecionado com as conexões dele em ${format.toUpperCase()}` : 'Selecione um termo ou caso no mapa'}
            onClick={() => exportMap('selection')}
          >
            {selected && aiCaseById.has(selected) ? 'Termos do caso' : 'Trilha do termo'}
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
      </Toolbar>
      <div className="body">
        <div className="canvas" ref={canvasRef}>
          <CanvasControls fitIds={selectedFit} />
          <ReactFlow
            key={view}
            nodes={nodes}
            edges={edges}
            nodeTypes={nodeTypes}
            edgeTypes={edgeTypes}
            onNodeClick={(_, n) => n.type?.startsWith('ai') && n.type !== 'aiGroup' && select(n.id)}
            onNodeDoubleClick={(_, n) => n.type === 'aiCase' && setDiagramFor(n.id)}
            onNodeMouseEnter={(_, n) => (n.type === 'aiTrail' || n.type === 'aiArea' || n.type === 'aiCase') && setHovered(n.id)}
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
        {showPanel && <AiPanel id={selected} onSelect={select} onClose={() => setSelected(null)} onOpenDiagram={setDiagramFor} />}
      </div>
      <DiagramModal caseId={diagramFor} theme={theme} onClose={() => setDiagramFor(null)} />
    </div>
  );
}
