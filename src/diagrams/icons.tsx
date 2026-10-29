import type { ComponentKind } from './types';

/** Cor de cada tipo de componente; os ícones usam currentColor. */
export const kindColor: Record<ComponentKind, string> = {
  client: '#4f7cff',
  mobile: '#4f7cff',
  lb: '#e0a100',
  gateway: '#d1477a',
  service: '#2e9e5b',
  worker: '#0f8fb8',
  db: '#8b5cf6',
  replica: '#a78bfa',
  cache: '#e0662d',
  queue: '#00a3a3',
  stream: '#00a3a3',
  storage: '#b08400',
  cdn: '#4f7cff',
  external: '#6b7280',
  coordinator: '#5b6b8c',
  websocket: '#2e9e5b',
  scheduler: '#d64545',
  lock: '#d64545',
  filter: '#0f8fb8',
  search: '#e0662d',
  geo: '#d1477a',
  ledger: '#8b5cf6',
  metrics: '#6b7280',
};

export const kindName: Record<ComponentKind, string> = {
  client: 'Cliente web',
  mobile: 'App mobile',
  lb: 'Load balancer',
  gateway: 'Gateway / borda',
  service: 'Serviço stateless',
  worker: 'Worker assíncrono',
  db: 'Banco de dados',
  replica: 'Réplica',
  cache: 'Cache',
  queue: 'Fila',
  stream: 'Log de eventos',
  storage: 'Object storage',
  cdn: 'CDN',
  external: 'Provedor externo',
  coordinator: 'Coordenação',
  websocket: 'Conexão persistente',
  scheduler: 'Job agendado',
  lock: 'Lock / lease',
  filter: 'Filtro / dedup',
  search: 'Índice em memória',
  geo: 'Índice geoespacial',
  ledger: 'Ledger',
  metrics: 'Observabilidade',
};

const S = { fill: 'none', stroke: 'currentColor', strokeWidth: 2, strokeLinecap: 'round', strokeLinejoin: 'round' } as const;

const icons: Record<ComponentKind, React.ReactNode> = {
  client: (
    <>
      <rect x="6" y="9" width="32" height="22" rx="3" {...S} />
      <path d="M2 35h40" {...S} />
      <circle cx="22" cy="20" r="6" {...S} className="ic-spin" />
      <path d="M16 20h12M22 14c3 3 3 9 0 12M22 14c-3 3-3 9 0 12" {...S} strokeWidth={1.2} className="ic-spin" />
    </>
  ),
  mobile: (
    <>
      <rect x="13" y="4" width="18" height="36" rx="4" {...S} />
      <path d="M19 35h6" {...S} />
      <rect x="17" y="10" width="10" height="6" rx="1" fill="currentColor" className="ic-blink" />
      <rect x="17" y="19" width="10" height="6" rx="1" fill="currentColor" opacity=".45" className="ic-blink ic-delay" />
    </>
  ),
  lb: (
    <>
      <circle cx="22" cy="22" r="17" {...S} opacity=".35" />
      <circle cx="12" cy="22" r="3" fill="currentColor" />
      <path d="M15 22h6M21 22l9-9M21 22h9M21 22l9 9" {...S} />
      <circle cx="31" cy="13" r="2.5" fill="currentColor" className="ic-blink" />
      <circle cx="31" cy="22" r="2.5" fill="currentColor" className="ic-blink ic-delay" />
      <circle cx="31" cy="31" r="2.5" fill="currentColor" className="ic-blink ic-delay2" />
    </>
  ),
  gateway: (
    <>
      <path d="M22 4l15 6v10c0 10-7 16-15 20C14 36 7 30 7 20V10z" {...S} />
      <path d="M15 21l5 5 9-10" {...S} className="ic-draw" />
    </>
  ),
  service: (
    <>
      <rect x="7" y="6" width="30" height="9" rx="2" {...S} />
      <rect x="7" y="18" width="30" height="9" rx="2" {...S} />
      <rect x="7" y="30" width="30" height="9" rx="2" {...S} />
      <circle cx="12" cy="10.5" r="1.6" fill="currentColor" className="ic-blink" />
      <circle cx="12" cy="22.5" r="1.6" fill="currentColor" className="ic-blink ic-delay" />
      <circle cx="12" cy="34.5" r="1.6" fill="currentColor" className="ic-blink ic-delay2" />
      <path d="M18 10.5h14M18 22.5h14M18 34.5h14" {...S} strokeWidth={1.2} opacity=".5" />
    </>
  ),
  worker: (
    <g className="ic-spin">
      <circle cx="22" cy="22" r="6" {...S} />
      <path
        d="M22 5v6M22 33v6M5 22h6M33 22h6M10 10l4 4M30 30l4 4M10 34l4-4M30 14l4-4"
        {...S}
        strokeWidth={3}
      />
      <circle cx="22" cy="22" r="12" {...S} />
    </g>
  ),
  db: (
    <>
      <ellipse cx="22" cy="10" rx="14" ry="5" {...S} />
      <path d="M8 10v24c0 3 6 5 14 5s14-2 14-5V10" {...S} />
      <path d="M8 18c0 3 6 5 14 5s14-2 14-5M8 26c0 3 6 5 14 5s14-2 14-5" {...S} className="ic-pulse" />
    </>
  ),
  replica: (
    <>
      <ellipse cx="22" cy="10" rx="14" ry="5" {...S} strokeDasharray="3 3" />
      <path d="M8 10v24c0 3 6 5 14 5s14-2 14-5V10" {...S} strokeDasharray="3 3" />
      <path d="M16 24l4 4 8-8" {...S} className="ic-draw" />
    </>
  ),
  cache: (
    <>
      <path d="M6 14l16-8 16 8-16 8z" {...S} />
      <path d="M6 22l16 8 16-8M6 30l16 8 16-8" {...S} opacity=".55" />
      <path d="M24 9l-5 7h5l-3 6" {...S} strokeWidth={2.4} className="ic-flash" />
    </>
  ),
  queue: (
    <>
      <path d="M4 14h36M4 30h36" {...S} />
      <g className="ic-slide">
        <rect x="6" y="17" width="8" height="10" rx="1.5" fill="currentColor" />
        <rect x="18" y="17" width="8" height="10" rx="1.5" fill="currentColor" opacity=".7" />
        <rect x="30" y="17" width="8" height="10" rx="1.5" fill="currentColor" opacity=".45" />
      </g>
    </>
  ),
  stream: (
    <>
      <rect x="4" y="8" width="36" height="8" rx="2" {...S} />
      <rect x="4" y="19" width="36" height="8" rx="2" {...S} />
      <rect x="4" y="30" width="36" height="8" rx="2" {...S} />
      <g className="ic-slide">
        <path d="M9 12h4M17 12h4M25 12h4M9 23h4M17 23h4M9 34h4M17 34h4M25 34h4M33 34h2" {...S} strokeWidth={3} />
      </g>
    </>
  ),
  storage: (
    <>
      <path d="M7 12h30l-3 26H10z" {...S} />
      <ellipse cx="22" cy="12" rx="15" ry="4" {...S} />
      <path d="M17 24l5-5 5 5M22 19v12" {...S} className="ic-bob" />
    </>
  ),
  cdn: (
    <>
      <circle cx="22" cy="22" r="16" {...S} />
      <g className="ic-spin-slow">
        <ellipse cx="22" cy="22" rx="7" ry="16" {...S} />
        <path d="M6 22h32M9 13h26M9 31h26" {...S} strokeWidth={1.2} />
      </g>
      <circle cx="35" cy="9" r="3" fill="currentColor" className="ic-blink" />
    </>
  ),
  external: (
    <>
      <path d="M13 33h19a8 8 0 0 0 0-16 11 11 0 0 0-21 3 6.5 6.5 0 0 0 2 13z" {...S} />
      <path d="M18 26h10M24 22l4 4-4 4" {...S} className="ic-nudge" />
    </>
  ),
  coordinator: (
    <>
      <circle cx="22" cy="10" r="5" {...S} />
      <circle cx="10" cy="32" r="5" {...S} />
      <circle cx="34" cy="32" r="5" {...S} />
      <path d="M19 14l-6 13M25 14l6 13M15 32h14" {...S} className="ic-dash" />
      <path d="M19 6l3-3 3 3" {...S} className="ic-bob" />
    </>
  ),
  websocket: (
    <>
      <path d="M6 16h22M22 10l6 6-6 6" {...S} className="ic-nudge" />
      <path d="M38 28H16M22 22l-6 6 6 6" {...S} className="ic-nudge-rev" />
    </>
  ),
  scheduler: (
    <>
      <circle cx="22" cy="23" r="15" {...S} />
      <path d="M22 23V14" {...S} className="ic-spin-hand" />
      <path d="M22 23l6 4" {...S} />
      <path d="M14 5l-5 4M30 5l5 4" {...S} />
    </>
  ),
  lock: (
    <>
      <rect x="9" y="19" width="26" height="19" rx="3" {...S} />
      <path d="M15 19v-6a7 7 0 0 1 14 0v6" {...S} className="ic-bob" />
      <circle cx="22" cy="28" r="2.5" fill="currentColor" />
    </>
  ),
  filter: (
    <>
      <path d="M5 7h34L26 22v13l-8 4V22z" {...S} />
      <circle cx="14" cy="3" r="2" fill="currentColor" className="ic-drop" />
      <circle cx="26" cy="3" r="2" fill="currentColor" className="ic-drop ic-delay" />
    </>
  ),
  search: (
    <>
      <circle cx="22" cy="7" r="4" {...S} />
      <circle cx="11" cy="22" r="4" {...S} />
      <circle cx="33" cy="22" r="4" {...S} />
      <circle cx="6" cy="37" r="3" {...S} />
      <circle cx="17" cy="37" r="3" {...S} className="ic-blink" />
      <path d="M20 10l-7 9M24 10l7 9M10 26l-3 8M12 26l4 8" {...S} />
    </>
  ),
  geo: (
    <>
      <path d="M5 34l11-5 12 5 11-5V9l-11 5-12-5L5 14z" {...S} opacity=".5" />
      <path d="M22 28s-8-8-8-14a8 8 0 0 1 16 0c0 6-8 14-8 14z" {...S} className="ic-bob" />
      <circle cx="22" cy="14" r="3" fill="currentColor" className="ic-bob" />
    </>
  ),
  ledger: (
    <>
      <path d="M8 6h22a6 6 0 0 1 6 6v26H14a6 6 0 0 1-6-6z" {...S} />
      <path d="M14 14h16M14 21h16M14 28h10" {...S} className="ic-write" />
      <path d="M22 6v32" {...S} strokeWidth={1.2} opacity=".5" />
    </>
  ),
  metrics: (
    <>
      <path d="M5 38h34M5 6v32" {...S} />
      <path d="M9 30l8-9 7 5 12-14" {...S} className="ic-draw" />
    </>
  ),
};

export function KindIcon({ kind, size = 44 }: { kind: ComponentKind; size?: number }) {
  return (
    <svg viewBox="0 0 44 44" width={size} height={size} aria-hidden style={{ color: kindColor[kind], overflow: 'visible' }}>
      {icons[kind]}
    </svg>
  );
}
