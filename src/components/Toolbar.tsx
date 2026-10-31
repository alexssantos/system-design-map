import { useEffect, useState, type ReactNode } from 'react';
import { IconButton } from '../ui-kit';

/** true quando a tela é estreita (celular ou janela pequena), no mesmo corte do CSS. */
export function useIsMobile(query = '(max-width: 900px)') {
  const [mobile, setMobile] = useState(() => typeof window !== 'undefined' && window.matchMedia(query).matches);
  useEffect(() => {
    const mq = window.matchMedia(query);
    const on = () => setMobile(mq.matches);
    mq.addEventListener('change', on);
    return () => mq.removeEventListener('change', on);
  }, [query]);
  return mobile;
}

interface Props {
  title: string;
  subtitle: ReactNode;
  /** Busca, filtros e downloads. No celular ficam atrás do botão de filtros. */
  children: ReactNode;
  /** Sempre visível, à direita (ex.: tema). */
  end?: ReactNode;
}

/**
 * Barra do topo dos mapas. No desktop mostra tudo numa linha; no celular mostra só o título,
 * o botão de filtros e o tema, para o mapa ocupar a maior parte da tela.
 */
export function Toolbar({ title, subtitle, children, end }: Props) {
  const [open, setOpen] = useState(false);
  return (
    <header className="toolbar" data-open={open || undefined}>
      <div className="brand">
        <div>
          <strong>{title}</strong>
          <span className="muted">{subtitle}</span>
        </div>
      </div>
      <div className="toolbar__tools" id="toolbar-tools">
        {children}
      </div>
      <div className="toolbar__end">
        <IconButton
          className="toolbar__more"
          icon={open ? 'close' : 'settings'}
          label={open ? 'Fechar filtros' : 'Busca, filtros e downloads'}
          variant="soft"
          active={open}
          tooltip={false}
          onClick={() => setOpen((o) => !o)}
        />
        {end}
      </div>
    </header>
  );
}

/** "Como usar" do painel: aberto no desktop, recolhido no celular para não tampar o mapa. */
export function PanelHelp({ title, children }: { title: string; children: ReactNode }) {
  const mobile = useIsMobile();
  return (
    <details className="panel__help" open={!mobile} key={String(mobile)}>
      <summary>
        <h2>{title}</h2>
      </summary>
      <div className="panel__help-body">{children}</div>
    </details>
  );
}
