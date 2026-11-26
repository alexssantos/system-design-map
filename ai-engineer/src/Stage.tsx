import { useEffect, useMemo, useRef, useState } from 'react';
import type { Ent, Flow, Lesson, PktKind, StaticLink } from './types';
import { Icon } from './icons';

const W = 900;
const H = 600;
const FLOW_MS = 1050;
const HOLD_MS = 650;

const dims = (e: Ent) =>
  e.kind === 'plate' ? { a: 62, b: 31, h: 12 } : e.kind === 'cyl' ? { a: 40, b: 17, h: 48 } : { a: 54, b: 27, h: 46 };

/** ponto de ancoragem das ligações: centro do corpo */
const anchor = (e: Ent) => ({ x: e.x, y: e.y - dims(e).h / 2 });

function trimmed(a: Ent, b: Ent) {
  const p = anchor(a);
  const q = anchor(b);
  const dx = q.x - p.x;
  const dy = q.y - p.y;
  const len = Math.hypot(dx, dy) || 1;
  const ux = dx / len;
  const uy = dy / len;
  // o bloco é mais largo que alto na projeção, então o recuo depende do ângulo
  const pad = (e: Ent) => {
    const d = dims(e);
    return 14 + Math.hypot(ux * (d.a + 6), uy * (d.b + d.h / 2 + 4));
  };
  const pa = Math.min(pad(a), len / 2 - 6);
  const pb = Math.min(pad(b), len / 2 - 6);
  return { x1: p.x + ux * pa, y1: p.y + uy * pa, x2: q.x - ux * pb, y2: q.y - uy * pb };
}

const ease = (t: number) => (t < 0.5 ? 2 * t * t : 1 - Math.pow(-2 * t + 2, 2) / 2);

function Body({ e }: { e: Ent }) {
  const { a, b, h } = dims(e);
  if (e.kind === 'cyl') {
    return (
      <g className={`blk blk--${e.color}`}>
        <ellipse className="blk__shadow" cx={0} cy={8} rx={a + 6} ry={b + 4} />
        <path className="blk__side" d={`M${-a},${-h} V0 A${a},${b} 0 0 0 ${a},0 V${-h} Z`} />
        <path className="blk__shade" d={`M0,${-h} V${b} A${a},${b} 0 0 0 ${a},0 V${-h} Z`} />
        <ellipse className="blk__top" cx={0} cy={-h} rx={a} ry={b} />
        <path className="blk__ring" d={`M${-a},${-h / 2} A${a},${b} 0 0 0 ${a},${-h / 2}`} />
        <g className="blk__icon" transform={`translate(-10 ${-h - 10})`}>
          <Icon name={e.icon} size={20} />
        </g>
      </g>
    );
  }
  const top = `M0,${-h - b} L${a},${-h} L0,${-h + b} L${-a},${-h} Z`;
  const left = `M${-a},${-h} L0,${-h + b} L0,${b} L${-a},0 Z`;
  const right = `M${a},${-h} L0,${-h + b} L0,${b} L${a},0 Z`;
  const hull = `M0,${-h - b} L${a},${-h} L${a},0 L0,${b} L${-a},0 L${-a},${-h} Z`;
  return (
    <g className={`blk blk--${e.color}`}>
      <path className="blk__shadow" d={hull} transform="translate(0 9)" />
      <path className="blk__side" d={left} />
      <path className="blk__side" d={right} />
      <path className="blk__shade" d={right} />
      <path className="blk__top" d={top} />
      <path className="blk__edge" d={`M${-a},${-h} L0,${-h + b} L${a},${-h} M0,${-h + b} V${b}`} />
      <path className="blk__hull" d={hull} />
      <g className="blk__icon" transform={`translate(-11 ${-h - 11})`}>
        <Icon name={e.icon} size={22} />
      </g>
    </g>
  );
}

function Pill({ x, y, text, tone, k = 1 }: { x: number; y: number; text: string; tone?: string; k?: number }) {
  const w = text.length * 7.3 + 22;
  return (
    <g className={`pill ${tone ? `pill--${tone}` : ''}`} transform={`translate(${x} ${y}) scale(${k})`}>
      <rect className="pill__drop" x={-w / 2 + 1.5} y={-10} width={w} height={23} rx={11.5} />
      <rect className="pill__box" x={-w / 2} y={-12} width={w} height={23} rx={11.5} />
      <text x={0} y={3.6} textAnchor="middle">
        {text}
      </text>
    </g>
  );
}

function Packet({ kind, x, y }: { kind: PktKind; x: number; y: number }) {
  return (
    <g className={`pkt pkt--${kind}`} transform={`translate(${x} ${y})`}>
      {kind === 'data' || kind === 'tok' ? (
        <rect x={-7} y={-7} width={14} height={14} rx={3.5} />
      ) : (
        <circle r={7} />
      )}
    </g>
  );
}

export interface StageProps {
  lesson: Lesson;
  visible: string[];
  fresh: string[];
  hot: string[];
  flows: Flow[];
  links: StaticLink[];
  pills: Record<string, string>;
  paused: boolean;
  runKey: string;
}

export function Stage({ lesson, visible, fresh, hot, flows, links, pills, paused, runKey }: StageProps) {
  const [t, setT] = useState(0);
  const tRef = useRef(0);
  // no celular o diagrama encolhe, então os rótulos crescem para continuar legíveis
  const [k, setK] = useState(() => (matchMedia('(max-width: 820px)').matches ? 1.45 : 1));
  useEffect(() => {
    const mq = matchMedia('(max-width: 820px)');
    const on = () => setK(mq.matches ? 1.45 : 1);
    mq.addEventListener('change', on);
    return () => mq.removeEventListener('change', on);
  }, []);

  useEffect(() => {
    tRef.current = 0;
    setT(0);
  }, [runKey]);

  useEffect(() => {
    if (paused || flows.length === 0) return;
    if (matchMedia('(prefers-reduced-motion: reduce)').matches) {
      tRef.current = FLOW_MS * flows.length;
      setT(tRef.current);
      return;
    }
    let raf = 0;
    let last = performance.now();
    const tick = (now: number) => {
      tRef.current += Math.min(64, now - last);
      last = now;
      setT(tRef.current);
      raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, [paused, flows.length, runKey]);

  const ents = lesson.ents;
  // enquadra a cena nas entidades da lição inteira, para o quadro não pular entre passos
  const box = useMemo(() => {
    const all = Object.values(ents);
    const x0 = Math.min(...all.map((e) => e.x)) - 105 * k;
    const x1 = Math.max(...all.map((e) => e.x)) + 105 * k;
    const y0 = Math.min(...all.map((e) => e.y)) - 125 - 12 * k;
    const y1 = Math.max(...all.map((e) => e.y)) + 60 + 28 * k;
    return `${x0} ${y0} ${x1 - x0} ${y1 - y0}`;
  }, [ents, k]);
  const shown = useMemo(
    () => visible.filter((id) => ents[id]).sort((p, q) => ents[p].y - ents[q].y),
    [visible, ents],
  );

  // ligações: as estáticas mais um traço por par usado em algum fluxo
  const lines = useMemo(() => {
    const out: { key: string; a: string; b: string; style: string; arrow: boolean }[] = [];
    const seen = new Set<string>();
    for (const [a, b, style] of links) {
      const key = [a, b].sort().join('~');
      if (seen.has(key) || !ents[a] || !ents[b]) continue;
      seen.add(key);
      out.push({ key, a, b, style: style ?? 'solid', arrow: false });
    }
    for (const [a, b] of flows) {
      const key = [a, b].sort().join('~');
      if (seen.has(key) || !ents[a] || !ents[b]) continue;
      seen.add(key);
      out.push({ key, a, b, style: 'solid', arrow: true });
    }
    return out;
  }, [links, flows, ents]);

  const cycle = flows.length * FLOW_MS + HOLD_MS;
  const local = flows.length ? t % cycle : 0;
  const idx = Math.min(flows.length - 1, Math.floor(local / FLOW_MS));
  const active = flows.length && local < flows.length * FLOW_MS ? flows[idx] : undefined;
  const prog = active ? ease(Math.min(1, (local - idx * FLOW_MS) / (FLOW_MS * 0.82))) : 0;

  let pkt: { x: number; y: number; kind: PktKind } | undefined;
  let label: { x: number; y: number; text: string; kind: PktKind } | undefined;
  if (active && ents[active[0]] && ents[active[1]]) {
    const s = trimmed(ents[active[0]], ents[active[1]]);
    const kind = active[2] ?? 'req';
    pkt = { x: s.x1 + (s.x2 - s.x1) * prog, y: s.y1 + (s.y2 - s.y1) * prog, kind };
    if (active[3]) {
      // o rótulo fica acima ou abaixo da ligação, do lado mais longe das outras etiquetas
      const mx = (s.x1 + s.x2) / 2;
      const my = (s.y1 + s.y2) / 2;
      const half = (active[3].length * 7.3 + 22) * 0.5 * k;
      const clash = (y: number) =>
        visible.reduce((worst, id) => {
          const e = ents[id];
          if (!e) return worst;
          const d = dims(e);
          const spots = [e.y + d.b + 24 * k, e.y - d.h / 2];
          const near = Math.abs(e.x - mx) < half + 60 ? Math.min(...spots.map((sy) => Math.abs(sy - y))) : 999;
          return Math.min(worst, near);
        }, 999);
      const off = 26 * k;
      const y = clash(my + off) >= clash(my - off) ? my + off : my - off;
      label = { x: mx, y, text: active[3], kind };
    }
  }

  return (
    <svg className="stage-svg" viewBox={box} preserveAspectRatio="xMidYMid meet" role="img" aria-label={`Diagrama animado: ${lesson.title}`}>
      <defs>
        <pattern id="iso" width="80" height="40" patternUnits="userSpaceOnUse">
          <path d="M0 20 L40 0 L80 20 L40 40 Z" fill="none" className="stage-grid" />
        </pattern>
        <radialGradient id="fade" cx="50%" cy="50%" r="55%">
          <stop offset="0%" stopColor="#fff" stopOpacity="1" />
          <stop offset="70%" stopColor="#fff" stopOpacity=".55" />
          <stop offset="100%" stopColor="#fff" stopOpacity="0" />
        </radialGradient>
        <mask id="fade-mask">
          <rect x="-200" y="-100" width={W + 400} height={H + 200} fill="url(#fade)" />
        </mask>
        <filter id="soft" x="-30%" y="-30%" width="160%" height="160%">
          <feGaussianBlur stdDeviation="6" />
        </filter>
        <marker id="arrow" viewBox="0 0 10 10" refX="8" refY="5" markerWidth="7" markerHeight="7" orient="auto-start-reverse">
          <path d="M1 1 L9 5 L1 9 Z" className="arrow-head" />
        </marker>
      </defs>

      <rect x="-200" y="-100" width={W + 400} height={H + 200} fill="url(#iso)" mask="url(#fade-mask)" />

      <g>
        {hot
          .filter((id) => ents[id] && visible.includes(id))
          .map((id) => {
            const e = ents[id];
            return (
              <path
                key={id}
                className="pad"
                d={`M${e.x},${e.y - 52} L${e.x + 104},${e.y} L${e.x},${e.y + 52} L${e.x - 104},${e.y} Z`}
              />
            );
          })}
      </g>

      <g>
        {lines.map((l) => {
          if (!visible.includes(l.a) || !visible.includes(l.b)) return null;
          const s = trimmed(ents[l.a], ents[l.b]);
          const on = active && [active[0], active[1]].sort().join('~') === l.key;
          return (
            <line
              key={l.key + runKey}
              className={`link link--${l.style} ${on ? 'is-on' : ''}`}
              x1={s.x1}
              y1={s.y1}
              x2={s.x2}
              y2={s.y2}
              pathLength={l.style === 'solid' ? 1 : undefined}
              markerEnd={l.arrow && l.style === 'solid' ? 'url(#arrow)' : undefined}
              markerStart={l.arrow && flows.some((f) => f[0] === l.b && f[1] === l.a) && flows.some((f) => f[0] === l.a && f[1] === l.b) ? 'url(#arrow)' : undefined}
            />
          );
        })}
      </g>

      <g>
        {shown.map((id) => {
          const e = ents[id];
          const isNew = fresh.includes(id);
          const d = dims(e);
          return (
            <g key={id + (isNew ? runKey : '')} transform={`translate(${e.x} ${e.y})`}>
              <g className={`ent ${isNew ? 'is-new' : ''}`}>
                <Body e={e} />
                <Pill x={0} y={d.b + 24 * k} text={e.label} k={k} />
                {e.sub && (
                  <text className="ent__sub" x={0} y={d.b + 24 * k + 26 * k} textAnchor="middle" style={{ fontSize: 10.5 * k }}>
                    {e.sub}
                  </text>
                )}
              </g>
            </g>
          );
        })}
      </g>

      <g>
        {Object.entries(pills).map(([id, text]) => {
          const e = ents[id];
          if (!e || !visible.includes(id)) return null;
          const d = dims(e);
          return (
            <g key={id + text + runKey} className="pill-in">
              <Pill x={e.x} y={e.y - d.h - d.b - 22 * k} text={text} tone="note" k={k} />
            </g>
          );
        })}
      </g>

      {label && (
        <g key={`${idx}-${label.text}`} className="pill-in">
          <Pill x={label.x} y={label.y} text={label.text} tone={label.kind} k={k} />
        </g>
      )}
      {pkt && <Packet {...pkt} />}
    </svg>
  );
}
