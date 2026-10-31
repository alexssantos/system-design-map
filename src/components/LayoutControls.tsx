import { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState, type ReactNode } from 'react';
import { useReactFlow, type ReactFlowInstance } from '@xyflow/react';
import { IconButton } from '../ui-kit';

interface LayoutState {
  /** Modo foco: só o mapa na tela, sem menu, cabeçalho nem painel. */
  focus: boolean;
  toggleFocus: () => void;
  /** Menu lateral recolhido: só os ícones. */
  navCollapsed: boolean;
  toggleNav: () => void;
  /** Painel de detalhes escondido. */
  panelHidden: boolean;
  setPanelHidden: (v: boolean) => void;
}

/**
 * Enquadra um item e as conexões dele. No celular a tela é estreita demais para caber o bairro inteiro com texto
 * legível, então centraliza o item num zoom de leitura e o resto se acompanha arrastando pelas linhas.
 */
export function frameItem(flow: ReactFlowInstance, id: string, ids: string[]) {
  const mobile = window.matchMedia('(max-width: 900px)').matches;
  const node = flow.getNode(id);
  if (mobile && node) {
    const w = node.measured?.width ?? node.width ?? 0;
    const h = node.measured?.height ?? node.height ?? 0;
    flow.setCenter(node.position.x + w / 2, node.position.y + h / 2, { zoom: 0.95, duration: 500 });
    return;
  }
  flow.fitView({ nodes: ids.map((n) => ({ id: n })), duration: 500, padding: 0.15, maxZoom: 1.1 });
}

const Ctx = createContext<LayoutState | null>(null);

function stored(key: string) {
  try {
    return localStorage.getItem(key) === '1';
  } catch {
    return false;
  }
}

function store(key: string, v: boolean) {
  try {
    localStorage.setItem(key, v ? '1' : '0');
  } catch {
    /* sem storage: só não lembra */
  }
}

export function LayoutProvider({ children }: { children: ReactNode }) {
  const [focus, setFocus] = useState(false);
  const [navCollapsed, setNavCollapsed] = useState(() => stored('sdm-nav-collapsed'));
  const [panelHidden, setPanelHidden] = useState(false);

  const toggleFocus = useCallback(() => setFocus((f) => !f), []);
  const toggleNav = useCallback(
    () =>
      setNavCollapsed((c) => {
        store('sdm-nav-collapsed', !c);
        return !c;
      }),
    [],
  );

  // Esc sai do modo foco.
  useEffect(() => {
    if (!focus) return;
    const on = (e: KeyboardEvent) => e.key === 'Escape' && setFocus(false);
    window.addEventListener('keydown', on);
    return () => window.removeEventListener('keydown', on);
  }, [focus]);

  const value = useMemo(
    () => ({ focus, toggleFocus, navCollapsed, toggleNav, panelHidden, setPanelHidden }),
    [focus, toggleFocus, navCollapsed, toggleNav, panelHidden],
  );
  return <Ctx.Provider value={value}>{children}</Ctx.Provider>;
}

export function useLayout(): LayoutState {
  const v = useContext(Ctx);
  if (!v) throw new Error('useLayout fora do LayoutProvider');
  return v;
}

/** Botões flutuantes no canto do mapa: modo foco e mostrar/esconder o painel. */
/** `fitIds`: o que enquadrar quando o espaço muda (o item selecionado e as conexões); sem ele, o mapa inteiro. */
export function CanvasControls({ hasPanel = true, fitIds }: { hasPanel?: boolean; fitIds?: string[] }) {
  const { focus, toggleFocus, panelHidden, setPanelHidden, navCollapsed } = useLayout();
  const flow = useReactFlow();
  // Quando o espaço do canvas muda, reenquadra o mapa depois que o layout assenta.
  const fitRef = useRef(fitIds);
  fitRef.current = fitIds;
  const refit = useCallback(() => {
    window.setTimeout(() => {
      const ids = fitRef.current;
      if (ids?.length) frameItem(flow, ids[0], ids);
      else flow.fitView({ duration: 300, padding: 0.08 });
    }, 60);
  }, [flow]);
  const first = useRef(true);
  useEffect(() => {
    if (first.current) {
      first.current = false;
      return;
    }
    refit();
  }, [focus, navCollapsed, refit]);
  return (
    <div className="canvas-controls" role="group" aria-label="Visualização do mapa">
      {hasPanel && !focus && (
        <IconButton
          icon={panelHidden ? 'chevron-left' : 'chevron-right'}
          label={panelHidden ? 'Mostrar painel' : 'Esconder painel'}
          variant="solid"
          size="sm"
          tooltip={false}
          title={panelHidden ? 'Mostrar painel' : 'Esconder painel'}
          onClick={() => {
            setPanelHidden(!panelHidden);
            refit();
          }}
        />
      )}
      <IconButton
        icon={focus ? 'close' : 'recenter'}
        label={focus ? 'Sair do foco (Esc)' : 'Focar no mapa'}
        variant={focus ? 'accent' : 'solid'}
        size="sm"
        tooltip={false}
        title={focus ? 'Sair do foco (Esc)' : 'Focar no mapa: esconde menu, cabeçalho e painel'}
        active={focus}
        onClick={toggleFocus}
      />
    </div>
  );
}
