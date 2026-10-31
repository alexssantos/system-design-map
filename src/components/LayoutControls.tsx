import { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState, type ReactNode } from 'react';
import { useReactFlow } from '@xyflow/react';
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
export function CanvasControls({ hasPanel = true }: { hasPanel?: boolean }) {
  const { focus, toggleFocus, panelHidden, setPanelHidden, navCollapsed } = useLayout();
  const flow = useReactFlow();
  // Quando o espaço do canvas muda, reenquadra o mapa depois que o layout assenta.
  const refit = useCallback(() => {
    window.setTimeout(() => flow.fitView({ duration: 300, padding: 0.08 }), 60);
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
