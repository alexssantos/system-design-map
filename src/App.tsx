import {
  Background,
  Controls,
  ReactFlow,
  MarkerType,
  ReactFlowProvider,
  useReactFlow,
  type Edge,
  type Node,
} from '@xyflow/react';
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { DetailPanel } from './components/DetailPanel';
import { DiagramModal, DiagramPage } from './components/DiagramModal';
import { TextField } from './components/kit/TextField';
import { nodeTypes } from './components/nodes';
import { diagramByCase } from './diagrams/data';
import { exportFlowImage, runExport, type ImageFormat } from './export/flowImage';
import { FormatPicker } from './components/FormatPicker';
import { Toolbar } from './components/Toolbar';
import { edgeTypes } from './components/HaloEdge';
import { CanvasControls, LayoutProvider, frameItem, useLayout } from './components/LayoutControls';
import { Badge, Button, IconButton, SegmentedControl, Switch } from './ui-kit';
import { AiMapView } from './ai/AiMapView';
import { SideNav, type Page } from './components/SideNav';
import { cases, edges as graphEdges, groupById, groups, neighborsOf, topicById, topics, topicsByCase } from './data/graph';
import type { Level } from './data/types';
import type { Theme } from './theme';
import { CASE_W, NODE_H, NODE_W, computeLayout } from './layout';

const isContainer = (id: string) => id.startsWith('group:') || id.startsWith('band:');

type LevelFocus = Level | 'all';

const layout = computeLayout();

// Tamanho fixo evita que o React Flow remeça (e esconda) os nós a cada re-render de hover,
// o que fazia o clique cair no pane.
const size = (width: number, height: number) => ({ width, height, measured: { width, height } });

function normalize(s: string) {
  return s.normalize('NFD').replace(/\p{Diacritic}/gu, '').toLowerCase();
}

function useTheme(): [Theme, () => void] {
  const [theme, setTheme] = useState<Theme>(() => {
    try {
      const saved = localStorage.getItem('sdm-theme');
      if (saved === 'dark' || saved === 'light') return saved;
    } catch {
      /* sem storage: segue o padrão */
    }
    return 'dark';
  });
  useEffect(() => {
    document.documentElement.dataset.theme = theme;
    try {
      localStorage.setItem('sdm-theme', theme);
    } catch {
      /* ignora */
    }
  }, [theme]);
  return [theme, () => setTheme((t) => (t === 'dark' ? 'light' : 'dark'))];
}

type Route = { page: 'diagram'; caseId: string; version?: number } | { page: Page };

/**
 * Rota por hash: #/diagrama/<caso>[/v<n>] abre o diagrama em página própria (guia nova),
 * #/ai abre o mapa de Engenharia de AI e o resto cai no mapa de System Design.
 */
function readRoute(): Route {
  const hash = window.location.hash;
  const m = /^#\/diagrama\/([\w-]+)(?:\/v(\d+))?/.exec(hash);
  if (m) return { page: 'diagram', caseId: m[1], version: m[2] ? Number(m[2]) : undefined };
  if (/^#\/ai\b/.test(hash)) return { page: 'ai' };
  return { page: 'system-design' };
}

function useHashRoute() {
  const [route, setRoute] = useState(readRoute);
  useEffect(() => {
    const on = () => setRoute(readRoute());
    window.addEventListener('hashchange', on);
    return () => window.removeEventListener('hashchange', on);
  }, []);
  return route;
}

function MapView({ theme, toggleTheme }: { theme: Theme; toggleTheme: () => void }) {
  const [diagramFor, setDiagramFor] = useState<{ caseId: string; version?: number } | null>(null);
  const [selected, setSelected] = useState<string | null>(null);
  const [hovered, setHovered] = useState<string | null>(null);
  const [levelFocus, setLevelFocus] = useState<LevelFocus>('senior');
  const [showConcepts, setShowConcepts] = useState(true);
  const [showPatterns, setShowPatterns] = useState(true);
  const [showAllEdges, setShowAllEdges] = useState(false);
  const [query, setQuery] = useState('');
  const [exporting, setExporting] = useState<'all' | 'selection' | null>(null);
  const [format, setFormat] = useState<ImageFormat>('png');
  const canvasRef = useRef<HTMLDivElement>(null);
  const flow = useReactFlow();
  const { focus: focusMode, panelHidden, setPanelHidden } = useLayout();
  const showPanel = !focusMode && !panelHidden;

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
          type: 'halo',
          data: { color, dot: active && e.kind === 'applied' },
          animated: active && e.kind === 'applied',
          markerEnd: e.kind === 'applied' && active ? { type: MarkerType.ArrowClosed, color, width: 16, height: 16 } : undefined,
          style: {
            stroke: e.kind === 'applied' ? color : 'var(--color-text-2)',
            strokeWidth: active ? 2.4 : 1,
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
      setPanelHidden(false);
      // Enquadra o item e todas as conexões dele, para ver o "bairro" inteiro de uma vez.
      frameItem(flow, id, [id, ...neighborsOf(id)]);
    },
    [flow, setPanelHidden],
  );

  const exportMap = (which: 'all' | 'selection') => {
    if (!canvasRef.current || exporting) return;
    const root = canvasRef.current;
    const around = which === 'selection' && selected ? new Set([selected, ...neighborsOf(selected)]) : null;
    const name = which === 'selection' && selected ? `conexoes ${topicById.get(selected)?.title ?? cases.find((c) => c.id === selected)?.title ?? selected}` : 'mapa de system design';
    runExport(
      (busy) => setExporting(busy ? which : null),
      () =>
        exportFlowImage(root, {
          fileName: name,
          format,
          isContainer,
          includeNode: around ? (id) => around.has(id) : undefined,
          includeEdge: around ? (id) => graphEdges.some((e) => e.id === id && (e.source === selected || e.target === selected)) : undefined,
        }),
    );
  };

  return (
    <div className="app">
      <Toolbar
        title="Mapa de System Design"
        subtitle={<>{topics.length} tópicos · {cases.length} casos · {diagramByCase.size} diagramas</>}
        end={
          <IconButton
            icon={theme === 'dark' ? 'sun' : 'moon'}
            label={theme === 'dark' ? 'Tema claro' : 'Tema escuro'}
            variant="soft"
            onClick={toggleTheme}
          />
        }
      >
        <TextField
          className="toolbar__search"
          value={query}
          onChange={setQuery}
          label="Buscar no mapa"
          placeholder="Buscar conceito, padrão ou caso…"
        />
        <SegmentedControl
          label="Nível"
          value={levelFocus}
          onChange={(v) => setLevelFocus(v as LevelFocus)}
          options={[
            { value: 'senior', label: 'Senior', icon: 'user' },
            { value: 'staff', label: 'Staff', icon: 'crown' },
            { value: 'all', label: 'Tudo', icon: 'grid' },
          ]}
        />
        <div className="toolbar__switches">
          <Switch checked={showConcepts} onChange={setShowConcepts} label="Conceitos" />
          <Switch checked={showPatterns} onChange={setShowPatterns} label="Padrões" />
          <Switch checked={showAllEdges} onChange={setShowAllEdges} label="Todas as conexões" />
        </div>
        <Badge tone="accent" dot className="toolbar__hint">
          Clique duplo num caso abre o diagrama
        </Badge>
        <div className="toolbar__downloads" role="group" aria-label="Baixar imagem">
          <FormatPicker value={format} onChange={setFormat} />
          <Button
            variant="dark"
            size="sm"
            icon="download"
            disabled={!selected || Boolean(exporting)}
            loading={exporting === 'selection'}
            title={selected ? `Baixa o item selecionado e as conexões dele em ${format.toUpperCase()}` : 'Selecione um tópico ou caso no mapa'}
            onClick={() => exportMap('selection')}
          >
            Conexões
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
          <CanvasControls fitIds={selected ? [selected, ...neighborsOf(selected)] : undefined} />
          <ReactFlow
            nodes={nodes}
            edges={edges}
            nodeTypes={nodeTypes}
            edgeTypes={edgeTypes}
            onNodeClick={(_, n) => (n.type === 'topic' || n.type === 'case') && select(n.id)}
            onNodeDoubleClick={(_, n) => n.type === 'case' && setDiagramFor({ caseId: n.id })}
            zoomOnDoubleClick={false}
            onNodeMouseEnter={(_, n) => (n.type === 'topic' || n.type === 'case') && setHovered(n.id)}
            onNodeMouseLeave={() => setHovered(null)}
            onPaneClick={() => setSelected(null)}
            nodesConnectable={false}
            fitView
            minZoom={0.15}
            maxZoom={1.5}
            colorMode={theme}
            proOptions={{ hideAttribution: true }}
          >
            <Background gap={24} />
            <Controls showInteractive={false} />
          </ReactFlow>
        </div>
        {showPanel && (
        <DetailPanel
          id={selected}
          levelFocus={levelFocus}
          onSelect={select}
          onClose={() => setSelected(null)}
          onOpenDiagram={(caseId, version) => setDiagramFor({ caseId, version })}
        />
        )}
      </div>
      <DiagramModal caseId={diagramFor?.caseId ?? null} version={diagramFor?.version} theme={theme} onClose={() => setDiagramFor(null)} />
    </div>
  );
}

export default function App() {
  const [theme, toggleTheme] = useTheme();
  const route = useHashRoute();
  if (route.page === 'diagram')
    return <DiagramPage key={`${route.caseId}@${route.version ?? ''}`} caseId={route.caseId} version={route.version} theme={theme} toggleTheme={toggleTheme} />;
  return (
    <LayoutProvider>
      <Shell page={route.page} theme={theme} toggleTheme={toggleTheme} />
    </LayoutProvider>
  );
}

function Shell({ page, theme, toggleTheme }: { page: Page; theme: Theme; toggleTheme: () => void }) {
  const { focus, navCollapsed } = useLayout();
  return (
    <div className={`shell${focus ? ' is-focus' : ''}${navCollapsed ? ' is-nav-collapsed' : ''}`}>
      <SideNav page={page} />
      <main className="shell__main">
        {/* Cada página tem o próprio provider: zoom e seleção não vazam de um mapa para o outro. */}
        <ReactFlowProvider key={page}>
          {page === 'ai' ? <AiMapView theme={theme} toggleTheme={toggleTheme} /> : <MapView theme={theme} toggleTheme={toggleTheme} />}
        </ReactFlowProvider>
      </main>
    </div>
  );
}
