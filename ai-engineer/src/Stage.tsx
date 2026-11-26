import { useEffect, useMemo, useRef, useState } from 'react';
import type { Ent, Flow, Lesson, PktKind, StaticLink } from './types';
import { Icon } from './icons';

/*
 * Palco isométrico.
 *
 * Geometria: malha de losangos 28x14. Toda entidade tem a base centrada num vértice da malha
 * (pontos 14m, 7n com m+n par) e as ligações correm só nos dois eixos da malha, em L com o canto
 * arredondado, saindo e chegando na borda da base de cada objeto.
 *
 * Sequência de cada passo: 1) entidades novas caem uma depois da outra; 2) as ligações novas se
 * desenham; 3) um pulso verde abre na base das entidades novas e das destacadas; 4) o tráfego começa.
 */

const W = 900;
const H = 600;

// tempos da sequência de entrada (ms)
const ENT_MS = 720; // queda de cada entidade
const ENT_GAP = 160; // intervalo entre uma entidade e a próxima
const DRAW_MS = 560; // desenho de cada ligação
const SPOT_MS = 1500; // pulso na base
const TRAFFIC_AFTER_SPOT = 480; // espera entre o pulso e o primeiro pacote

// tráfego
const TRAVEL_MS = 950; // viagem de um pacote
const FLOW_MS = 1320; // janela de cada fluxo (viagem + pulso de chegada)
const HOLD_MS = 700; // pausa antes de repetir
const INSET = 20; // o pacote para antes da ponta da seta
const ARRIVE_MS = 460;

const GAP = 2; // folga entre a ponta da seta e a borda do objeto
const R = 9; // raio do canto das ligações
const U = { x: 2 / Math.sqrt(5), y: 1 / Math.sqrt(5) }; // eixo que desce para a direita
const V = { x: 2 / Math.sqrt(5), y: -1 / Math.sqrt(5) }; // eixo que sobe para a direita

type P = { x: number; y: number };

const S5 = Math.sqrt(5);

/** meias-medidas do objeto: a (largura), b (profundidade), h (altura); L e M para áreas retangulares nos eixos */
function dims(e: Ent): { a: number; b: number; h: number; L?: number; M?: number } {
  const s = e.scale ?? 1;
  switch (e.kind) {
    case 'plate':
      return { a: 56 * s, b: 28 * s, h: 10 * s };
    case 'cyl':
      return { a: 42 * s, b: 21 * s, h: 48 * s };
    case 'crowd':
      return { a: 84 * s, b: 42 * s, h: 10 };
    case 'zone':
    case 'queue': {
      const L = (e.w ?? (e.kind === 'queue' ? 210 : 280)) / 2;
      const M = (e.d ?? (e.kind === 'queue' ? 56 : 168)) / 2;
      return { a: (2 * (L + M)) / S5, b: (L + M) / S5, h: e.kind === 'queue' ? 8 : 0, L, M };
    }
    default:
      return { a: 56 * s, b: 28 * s, h: 46 * s };
  }
}

/** decompõe um vetor nos eixos da malha: v = p·U + q·V */
const uv = (x: number, y: number) => ({ p: ((x * S5) / 2 + y * S5) / 2, q: ((x * S5) / 2 - y * S5) / 2 });

/** encaixa no vértice mais próximo da malha */
function snap(x: number, y: number): P {
  const m = Math.round(x / 14);
  let n = Math.round(y / 7);
  if ((m + n) % 2 !== 0) n += y / 7 > n ? 1 : -1;
  return { x: m * 14, y: n * 7 };
}

/** distância do centro da base até a borda, numa direção unitária */
function edge(e: Ent, d: P) {
  const { a, b, L, M } = dims(e);
  if (e.kind === 'cyl') return 1 / Math.hypot(d.x / a, d.y / b);
  if (L !== undefined && M !== undefined) {
    const { p, q } = uv(d.x, d.y);
    return 1 / Math.max(Math.abs(p) / L, Math.abs(q) / M);
  }
  return 1 / (Math.abs(d.x) / a + Math.abs(d.y) / b);
}

/** o ponto cai sobre o objeto como ele aparece na tela (base, corpo ou etiqueta)? */
function inside(e: Ent, p: P, pad = 8) {
  if (e.kind === 'zone') return 0;
  const { a, b, h, L, M } = dims(e);
  let dy = p.y - e.y;
  if (dy < 0) dy = dy > -h ? 0 : dy + h; // o corpo sobe a partir da base
  if (L !== undefined && M !== undefined) {
    const k = uv(p.x - e.x, dy);
    return Math.abs(k.p) < L + pad && Math.abs(k.q) < M + pad ? 2 : 0;
  }
  if (Math.abs(p.x - e.x) / (a + pad) + Math.abs(dy) / (b + pad / 2) < 1) return 2;
  const half = e.label.length * 3.7 + 14;
  if (Math.abs(p.x - e.x) < half && p.y > e.y + b + 10 && p.y < e.y + b + 38) return 1;
  return 0;
}

interface Route {
  d: string;
  pts: P[]; // polilinha para o pacote
  len: number;
  cum: number[];
  start: P;
  end: P;
  endDir: P;
  mid: P;
}

function polyline(pts: P[]): Pick<Route, 'pts' | 'len' | 'cum'> {
  const cum = [0];
  for (let i = 1; i < pts.length; i++) cum.push(cum[i - 1] + Math.hypot(pts[i].x - pts[i - 1].x, pts[i].y - pts[i - 1].y));
  return { pts, len: cum[cum.length - 1], cum };
}

function at(r: Route, dist: number): P {
  const s = Math.max(0, Math.min(r.len, dist));
  let i = 1;
  while (i < r.cum.length - 1 && r.cum[i] < s) i++;
  const seg = r.cum[i] - r.cum[i - 1] || 1;
  const k = (s - r.cum[i - 1]) / seg;
  return { x: r.pts[i - 1].x + (r.pts[i].x - r.pts[i - 1].x) * k, y: r.pts[i - 1].y + (r.pts[i].y - r.pts[i - 1].y) * k };
}

const add = (p: P, d: P, k: number): P => ({ x: p.x + d.x * k, y: p.y + d.y * k });
const neg = (d: P): P => ({ x: -d.x, y: -d.y });
const f = (n: number) => Math.round(n * 100) / 100;

/** traça a ligação de A até B nos eixos da malha */
function route(A: Ent, B: Ent, others: Ent[], arrow: boolean): Route {
  const dx = B.x - A.x;
  const dy = B.y - A.y;
  // B = A + s·(2,1) + t·(2,−1)
  const s = (dx / 2 + dy) / 2;
  const t = (dx / 2 - dy) / 2;
  const tail = arrow ? 4 : 0; // a linha termina um pouco antes da ponta, que é desenhada à parte

  const straight = (dir: P): Route => {
    const start = add(A, dir, edge(A, dir) + GAP);
    const tip = add(B, neg(dir), edge(B, dir) + GAP);
    const end = add(tip, dir, -tail);
    const pl = polyline([start, tip]);
    return {
      d: `M${f(start.x)},${f(start.y)} L${f(end.x)},${f(end.y)}`,
      ...pl,
      start,
      end: tip,
      endDir: dir,
      mid: { x: (start.x + tip.x) / 2, y: (start.y + tip.y) / 2 },
    };
  };

  const len1 = Math.hypot(dx, dy) || 1;
  // praticamente alinhados num eixo: linha reta
  if (Math.abs(s) * Math.sqrt(5) < 6) return straight({ x: Math.sign(t || 1) * V.x, y: Math.sign(t || 1) * V.y });
  if (Math.abs(t) * Math.sqrt(5) < 6) return straight({ x: Math.sign(s || 1) * U.x, y: Math.sign(s || 1) * U.y });

  const su = { x: Math.sign(s) * U.x, y: Math.sign(s) * U.y };
  const tv = { x: Math.sign(t) * V.x, y: Math.sign(t) * V.y };
  const ls = Math.abs(s) * Math.sqrt(5);
  const lt = Math.abs(t) * Math.sqrt(5);

  // duas opções de L: primeiro no eixo U e depois no V, ou o contrário
  const options = [
    { d1: su, l1: ls, d2: tv, l2: lt },
    { d1: tv, l1: lt, d2: su, l2: ls },
  ].map((o) => {
    const corner = add(A, o.d1, o.l1);
    const e1 = edge(A, o.d1) + GAP;
    const e2 = edge(B, o.d2) + GAP;
    let pen = 0;
    if (o.l1 < e1 + R + 6 || o.l2 < e2 + R + 6) pen += 100; // o canto cairia dentro de um dos objetos
    for (const other of others) {
      for (let k = e1; k < o.l1; k += 8) pen += 5 * inside(other, add(A, o.d1, k));
      for (let k = 0; k < o.l2 - e2; k += 8) pen += 5 * inside(other, add(corner, o.d2, k));
    }
    return { ...o, corner, e1, e2, pen };
  });
  // prefere o L com menos colisões; empate: o canto mais à frente (mais embaixo na tela)
  options.sort((p, q) => p.pen - q.pen || q.corner.y - p.corner.y);
  const o = options[0];
  if (o.pen >= 100) {
    // nenhum L cabe: liga borda a borda em linha reta (caso raro, objetos muito próximos)
    const dir = { x: dx / len1, y: dy / len1 };
    const start = add(A, dir, edge(A, dir) + GAP);
    const tip = add(B, neg(dir), edge(B, dir) + GAP);
    const end = add(tip, dir, -tail);
    return { d: `M${f(start.x)},${f(start.y)} L${f(end.x)},${f(end.y)}`, ...polyline([start, tip]), start, end: tip, endDir: dir, mid: { x: (start.x + tip.x) / 2, y: (start.y + tip.y) / 2 } };
  }
  const start = add(A, o.d1, o.e1);
  const c1 = add(o.corner, o.d1, -R);
  const c2 = add(o.corner, o.d2, R);
  const tip = add(B, neg(o.d2), o.e2);
  const end = add(tip, o.d2, -tail);
  // pontos da curva para o pacote seguir o canto
  const curve: P[] = [];
  for (let i = 1; i < 6; i++) {
    const k = i / 6;
    curve.push({
      x: (1 - k) * (1 - k) * c1.x + 2 * (1 - k) * k * o.corner.x + k * k * c2.x,
      y: (1 - k) * (1 - k) * c1.y + 2 * (1 - k) * k * o.corner.y + k * k * c2.y,
    });
  }
  const longFirst = o.l1 - o.e1 >= o.l2 - o.e2;
  return {
    d: `M${f(start.x)},${f(start.y)} L${f(c1.x)},${f(c1.y)} Q${f(o.corner.x)},${f(o.corner.y)} ${f(c2.x)},${f(c2.y)} L${f(end.x)},${f(end.y)}`,
    ...polyline([start, c1, ...curve, c2, tip]),
    start,
    end: tip,
    endDir: o.d2,
    mid: longFirst ? { x: (start.x + c1.x) / 2, y: (start.y + c1.y) / 2 } : { x: (c2.x + tip.x) / 2, y: (c2.y + tip.y) / 2 },
  };
}

function reverse(r: Route, startDir: P): Route {
  const pts = [...r.pts].reverse();
  const pl = polyline(pts);
  return { ...r, ...pl, start: pts[0], end: pts[pts.length - 1], endDir: startDir };
}

/** polígono com cantos arredondados */
function rounded(pts: P[], r: number) {
  let d = '';
  pts.forEach((p, i) => {
    const prev = pts[(i - 1 + pts.length) % pts.length];
    const next = pts[(i + 1) % pts.length];
    const l1 = Math.hypot(p.x - prev.x, p.y - prev.y);
    const l2 = Math.hypot(next.x - p.x, next.y - p.y);
    const k1 = Math.min(r, l1 / 2) / l1;
    const k2 = Math.min(r, l2 / 2) / l2;
    const a = { x: p.x + (prev.x - p.x) * k1, y: p.y + (prev.y - p.y) * k1 };
    const b = { x: p.x + (next.x - p.x) * k2, y: p.y + (next.y - p.y) * k2 };
    d += `${i ? 'L' : 'M'}${f(a.x)},${f(a.y)} Q${f(p.x)},${f(p.y)} ${f(b.x)},${f(b.y)} `;
  });
  return d + 'Z';
}

const ease = (t: number) => (t < 0.5 ? 2 * t * t : 1 - Math.pow(-2 * t + 2, 2) / 2);

/* pessoas da multidão */
const PEOPLE = ['#cbbae6', '#a9c5e8', '#a9d99a', '#fcd4ad', '#f2c868', '#eda6bd'];

/** retângulo no chão, alinhado aos eixos da malha */
function floorRect(L: number, M: number, y = 0) {
  const c = (p: number, q: number) => ({ x: (2 * (p + q)) / S5, y: (p - q) / S5 + y });
  return [c(-L, -M), c(L, -M), c(L, M), c(-L, M)];
}

/** texto deitado no chão, correndo ao longo do eixo U */
const FLOOR_TEXT = `matrix(${2 / S5} ${1 / S5} ${-2 / S5} ${1 / S5} 0 0)`;

function Body({ e, id }: { e: Ent; id: string }) {
  const { a, b, h } = dims({ ...e, scale: 1 });
  if (e.kind === 'zone' || e.kind === 'queue') {
    const { L = 0, M = 0 } = dims(e);
    const base = floorRect(L, M);
    const isQ = e.kind === 'queue';
    const top = floorRect(L, M, -h);
    const n = e.count ?? 0;
    // itens da fila em fila indiana ao longo do eixo U, do fim para o começo
    const items = Array.from({ length: n }, (_, i) => {
      const pp = L - 24 - i * 26;
      return { x: (2 * pp) / S5, y: pp / S5 - h };
    }).reverse();
    const textAt = { x: (2 * (L - 18 - (M - 10))) / S5, y: (L - 18 + (M - 10)) / S5 - h };
    return (
      <g className={`zone ${isQ ? 'zone--queue' : ''} ${e.color ? `zone--${e.color}` : ''}`}>
        {isQ && <path className="zone__side" d={rounded([base[0], base[1], base[2], top[2], top[1], top[0]], 5)} />}
        <path className="zone__floor" d={rounded(top, 10)} />
        <g transform={`translate(${f(textAt.x)} ${f(textAt.y)})`}>
          <text className="zone__text" transform={FLOOR_TEXT} textAnchor="end">
            {e.label.toUpperCase()}
          </text>
        </g>
        {items.map((it, i) => (
          <g key={i} className="pkt pkt--data" transform={`translate(${f(it.x)} ${f(it.y - 6)})`}>
            <rect x={-6} y={-6} width={12} height={12} rx={3} />
          </g>
        ))}
      </g>
    );
  }
  if (e.kind === 'crowd') {
    const n = Math.min(12, e.count ?? 9);
    const cols = n > 9 ? 4 : 3;
    const rows = Math.ceil(n / cols);
    const spots: P[] = [];
    for (let i = 0; i < n; i++) {
      const r = Math.floor(i / cols);
      const c = i % cols;
      // grade nos eixos da malha, centrada no tampo
      const pU = (c - (cols - 1) / 2) * (cols > 3 ? 27 : 34);
      const pV = (r - (rows - 1) / 2) * -32;
      spots.push({ x: (2 * (pU + pV)) / S5, y: (pU - pV) / S5 - h });
    }
    spots.sort((p, q) => p.y - q.y);
    const plate = rounded(
      [
        { x: 0, y: -h - b },
        { x: a, y: -h },
        { x: a, y: 0 },
        { x: 0, y: b },
        { x: -a, y: 0 },
        { x: -a, y: -h },
      ],
      10,
    );
    return (
      <g className="crowd">
        <path className="blk__shadow" d={plate} transform="translate(0 8)" />
        <path className="crowd__plate" d={plate} />
        <path className="crowd__top" d={rounded([{ x: 0, y: -h - b }, { x: a, y: -h }, { x: 0, y: -h + b }, { x: -a, y: -h }], 9)} />
        {spots.map((p, i) => (
          <g key={i} transform={`translate(${f(p.x)} ${f(p.y)})`} className="person">
            <rect x={-6.5} y={-20} width={13} height={20} rx={6.5} style={{ fill: PEOPLE[(i * 5) % PEOPLE.length] }} />
            <circle cy={-24.5} r={5.8} />
          </g>
        ))}
      </g>
    );
  }
  if (e.kind === 'cyl') {
    return (
      <g className={`blk blk--${e.color} ${e.ghost ? 'blk--ghost' : ''}`}>
        <ellipse className="blk__shadow" cx={0} cy={8} rx={a + 4} ry={b + 3} />
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
  const hullPts = [
    { x: 0, y: -h - b },
    { x: a, y: -h },
    { x: a, y: 0 },
    { x: 0, y: b },
    { x: -a, y: 0 },
    { x: -a, y: -h },
  ];
  const hull = rounded(hullPts, 9);
  const top = rounded(
    [
      { x: 0, y: -h - b },
      { x: a, y: -h },
      { x: 0, y: -h + b },
      { x: -a, y: -h },
    ],
    6,
  );
  const right = `M${a + 2},${-h} L0,${-h + b} L0,${b + 2} L${a + 2},2 Z`;
  const clip = `clip-${id}`;
  const iconSize = e.kind === 'plate' ? 18 : 22;
  return (
    <g className={`blk blk--${e.color} ${e.kind === 'plate' ? 'blk--plate' : ''} ${e.ghost ? 'blk--ghost' : ''}`}>
      <clipPath id={clip}>
        <path d={hull} />
      </clipPath>
      <path className="blk__shadow" d={hull} transform="translate(0 9)" />
      <path className="blk__side" d={hull} />
      <path className="blk__shade" d={right} clipPath={`url(#${clip})`} />
      <path className="blk__top" d={top} />
      <path className="blk__edge" d={`M${-a + 6},${-h + 3} L0,${-h + b} L${a - 6},${-h + 3} M0,${-h + b} V${b - 5}`} />
      <path className="blk__hull" d={hull} />
      <g className="blk__icon" transform={`translate(${-iconSize / 2} ${-h - iconSize / 2})`}>
        <Icon name={e.icon} size={iconSize} />
      </g>
    </g>
  );
}

function Pill({ x, y, text, tone, k = 1, icon }: { x: number; y: number; text: string; tone?: string; k?: number; icon?: string }) {
  const iw = icon ? 17 : 0;
  const w = text.length * 7.3 + 22 + iw;
  return (
    <g className={`pill ${tone ? `pill--${tone}` : ''}`} transform={`translate(${f(x)} ${f(y)}) scale(${k})`}>
      <rect className="pill__drop" x={-w / 2 + 1.5} y={-10} width={w} height={23} rx={11.5} />
      <rect className="pill__box" x={-w / 2} y={-12} width={w} height={23} rx={11.5} />
      {icon && (
        <g className="pill__icon" transform={`translate(${-w / 2 + 9} -7.5)`}>
          <Icon name={icon} size={14} />
        </g>
      )}
      <text x={iw / 2} y={3.6} textAnchor="middle">
        {text}
      </text>
    </g>
  );
}

/** medidor acima do objeto: ícone, barra e porcentagem */
function Gauge({ y, v, level, k }: { y: number; v: number; level?: string; k: number }) {
  const pct = Math.round(v * 100);
  return (
    <g className={`gauge gauge--${level ?? 'good'}`} transform={`translate(0 ${f(y)}) scale(${k})`}>
      <rect className="pill__drop" x={-45.5} y={-10} width={94} height={23} rx={11.5} />
      <rect className="pill__box" x={-47} y={-12} width={94} height={23} rx={11.5} />
      <g className="gauge__icon" transform="translate(-40 -7)">
        <Icon name="gauge" size={14} />
      </g>
      <rect className="gauge__track" x={-21} y={-3.5} width={36} height={7} rx={3.5} />
      <rect className="gauge__bar" x={-21} y={-3.5} width={36} height={7} rx={3.5} style={{ transform: `scaleX(${Math.max(0.04, Math.min(1, v))})` }} />
      <text className="gauge__pct" x={40} y={3.8} textAnchor="end">
        {pct}%
      </text>
    </g>
  );
}

function Packet({ kind, x, y, back }: { kind: PktKind; x: number; y: number; back?: boolean }) {
  return (
    <g className={`pkt pkt--${kind} ${back ? 'pkt--back' : ''}`} transform={`translate(${f(x)} ${f(y)})`}>
      {kind === 'data' || kind === 'tok' ? <rect x={-6} y={-6} width={12} height={12} rx={3} /> : <circle r={6.2} />}
    </g>
  );
}

/** ponta de seta desenhada à parte, para poder entrar depois do traço */
function Arrow({ p, dir, delay, cls }: { p: P; dir: P; delay: number; cls?: string }) {
  const ang = (Math.atan2(dir.y, dir.x) * 180) / Math.PI;
  return (
    <g transform={`translate(${f(p.x)} ${f(p.y)}) rotate(${f(ang)})`}>
      <path className={`arrow-head ${cls ?? ''}`} d="M-8,-3.9 L0.4,0 L-8,3.9 Z" style={{ animationDelay: `${delay}ms` }} />
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
  /** propriedades trocadas pelos passos até aqui */
  over?: Record<string, Partial<Ent>>;
}

const MOVE_MS = 700;

export function Stage({ lesson, visible, fresh, hot, flows, links, pills, paused, runKey, over = {} }: StageProps) {
  const [t, setT] = useState(0);
  const tRef = useRef(0);
  const reduce = useMemo(() => matchMedia('(prefers-reduced-motion: reduce)').matches, []);
  // no celular o diagrama encolhe, então os rótulos crescem para continuar legíveis
  const [k, setK] = useState(() => (matchMedia('(max-width: 820px)').matches ? 1.45 : 1));
  useEffect(() => {
    const mq = matchMedia('(max-width: 820px)');
    const on = () => setK(mq.matches ? 1.45 : 1);
    mq.addEventListener('change', on);
    return () => mq.removeEventListener('change', on);
  }, []);

  // entidades encaixadas na malha
  const ents = useMemo(() => {
    const out: Record<string, Ent> = {};
    for (const [id, e] of Object.entries(lesson.ents)) {
      const m = { ...e, ...over[id] };
      out[id] = { ...m, ...snap(m.x, m.y) };
    }
    return out;
  }, [lesson, over]);

  // enquadra a cena em todas as posições da lição inteira, para o quadro não pular entre passos
  const box = useMemo(() => {
    const all: P[] = Object.values(lesson.ents).map((e) => ({ x: e.x, y: e.y }));
    for (const st of lesson.steps)
      for (const [id, v] of Object.entries(st.set ?? {})) if (lesson.ents[id] && (v.x !== undefined || v.y !== undefined)) all.push({ x: v.x ?? lesson.ents[id].x, y: v.y ?? lesson.ents[id].y });
    const x0 = Math.min(...all.map((e) => e.x)) - 105 * k;
    const x1 = Math.max(...all.map((e) => e.x)) + 105 * k;
    const y0 = Math.min(...all.map((e) => e.y)) - 125 - 12 * k;
    const y1 = Math.max(...all.map((e) => e.y)) + 60 + 28 * k;
    return `${x0} ${y0} ${x1 - x0} ${y1 - y0}`;
  }, [lesson, k]);

  const shown = useMemo(
    () => visible.filter((id) => ents[id] && ents[id].kind !== 'zone').sort((p, q) => ents[p].y - ents[q].y),
    [visible, ents],
  );
  const zones = useMemo(() => visible.filter((id) => ents[id]?.kind === 'zone'), [visible, ents]);

  // entidades que mudaram de lugar ou de tamanho neste passo: deslizam, e as ligações delas se redesenham depois
  const placed = useRef<Record<string, string>>({});
  const sig = (e: Ent) => `${e.x},${e.y},${e.scale ?? 1}`;
  const moved = useMemo(() => {
    const prev = placed.current;
    return new Set(visible.filter((id) => ents[id] && prev[id] !== undefined && prev[id] !== sig(ents[id])));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [runKey]);
  useEffect(() => {
    const next: Record<string, string> = {};
    for (const id of visible) if (ents[id]) next[id] = sig(ents[id]);
    placed.current = next;
  }, [runKey, visible, ents]);

  // ligações: as estáticas mais um traço por par usado em algum fluxo
  const lines = useMemo(() => {
    const out: { key: string; a: string; b: string; style: string; arrow: boolean; both: boolean; r: Route; startDir: P }[] = [];
    const seen = new Set<string>();
    const push = (a: string, b: string, style: string, arrow: boolean) => {
      const key = [a, b].sort().join('~');
      if (seen.has(key) || !ents[a] || !ents[b] || !visible.includes(a) || !visible.includes(b)) return;
      seen.add(key);
      const others = visible.filter((id) => id !== a && id !== b && ents[id]).map((id) => ents[id]);
      const both = arrow && flows.some((x) => x[0] === b && x[1] === a) && flows.some((x) => x[0] === a && x[1] === b);
      const r = route(ents[a], ents[b], others, arrow);
      // direção de saída de A (para a seta de volta)
      const p0 = r.pts[0];
      const p1 = r.pts[1];
      const l = Math.hypot(p1.x - p0.x, p1.y - p0.y) || 1;
      out.push({ key, a, b, style, arrow, both, r, startDir: { x: -(p1.x - p0.x) / l, y: -(p1.y - p0.y) / l } });
    };
    for (const [a, b, style] of links) push(a, b, style ?? 'solid', false);
    for (const [a, b] of flows) push(a, b, 'solid', true);
    return out;
  }, [links, flows, ents, visible]);

  // quais ligações são novas neste passo (comparando com o que estava desenhado antes)
  const drawn = useRef<Set<string>>(new Set());
  const freshLinks = useMemo(() => {
    const prev = drawn.current;
    return new Set(
      lines.filter((l) => !prev.has(l.key) || fresh.includes(l.a) || fresh.includes(l.b) || moved.has(l.a) || moved.has(l.b)).map((l) => l.key),
    );
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [runKey]);
  useEffect(() => {
    drawn.current = new Set(lines.map((l) => l.key));
  }, [runKey, lines]);

  // linha do tempo da entrada
  const order = useMemo(() => fresh.filter((id) => ents[id] && visible.includes(id)), [fresh, ents, visible]);
  const entEnd = order.length ? (order.length - 1) * ENT_GAP + ENT_MS : 0;
  const drawStart = Math.max(order.length ? entEnd - 60 : 120, moved.size ? MOVE_MS : 0);
  const drawEnd = freshLinks.size ? drawStart + DRAW_MS : drawStart;
  const spotTargets = useMemo(
    () => [...new Set([...order, ...moved, ...hot])].filter((id) => ents[id] && visible.includes(id) && ents[id].kind !== 'zone'),
    [order, moved, hot, ents, visible],
  );
  const spotAt = drawEnd + 40;
  const trafficAt = reduce ? 0 : spotAt + (spotTargets.length ? TRAFFIC_AFTER_SPOT : 120);
  const dl = (ms: number) => (reduce ? 0 : ms);

  useEffect(() => {
    tRef.current = 0;
    setT(0);
  }, [runKey]);

  useEffect(() => {
    if (paused || flows.length === 0) return;
    if (reduce) {
      tRef.current = trafficAt + FLOW_MS * flows.length;
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
  }, [paused, flows.length, runKey, reduce, trafficAt]);

  // ───── tráfego ─────
  const lineOf = (a: string, b: string) => lines.find((l) => l.key === [a, b].sort().join('~'));
  const pathOf = (a: string, b: string): Route | undefined => {
    const l = lineOf(a, b);
    if (!l) return undefined;
    return l.a === a ? l.r : reverse(l.r, l.startDir);
  };
  const cycle = flows.length * FLOW_MS + HOLD_MS;
  const tt = t - trafficAt;
  const round = tt >= 0 && flows.length ? Math.floor(tt / cycle) : -1;
  const local = tt >= 0 && flows.length ? tt % cycle : -1;
  const idx = local >= 0 ? Math.min(flows.length - 1, Math.floor(local / FLOW_MS)) : -1;
  const active = idx >= 0 && local < flows.length * FLOW_MS ? flows[idx] : undefined;
  const inFlow = active ? local - idx * FLOW_MS : 0;

  let pkt: { x: number; y: number; kind: PktKind; back: boolean } | undefined;
  let label: { x: number; y: number; text: string; kind: PktKind } | undefined;
  let arrive: { x: number; y: number; kind: PktKind; key: string } | undefined;

  if (active) {
    const path = pathOf(active[0], active[1]);
    const kind = active[2] ?? 'req';
    // pacote de volta: o mesmo par já foi percorrido no sentido oposto logo antes
    const prevFlow = idx > 0 ? flows[idx - 1] : undefined;
    const back = !!prevFlow && prevFlow[0] === active[1] && prevFlow[1] === active[0];
    if (path && inFlow < TRAVEL_MS) {
      const p = at(path, INSET + (path.len - 2 * INSET) * ease(inFlow / TRAVEL_MS));
      pkt = { ...p, kind, back };
    }
    if (path && active[3]) {
      // o rótulo fica acima ou abaixo da ligação, do lado mais longe das outras etiquetas
      const { x: mx, y: my } = path.mid;
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
      const off = 24 * k;
      const y = clash(my + off) >= clash(my - off) ? my + off : my - off;
      label = { x: mx, y, text: active[3], kind };
    }
  }
  // pulso de chegada: no fim de cada viagem, menos na ida de um vai-e-volta (aí só no fim da volta)
  if (idx >= 0 && local < flows.length * FLOW_MS + ARRIVE_MS) {
    for (let i = Math.max(0, idx - 1); i <= idx; i++) {
      const fl = flows[i];
      const since = local - i * FLOW_MS - TRAVEL_MS;
      if (since < 0 || since > ARRIVE_MS) continue;
      const next = flows[i + 1];
      if (next && next[0] === fl[1] && next[1] === fl[0]) continue;
      const path = pathOf(fl[0], fl[1]);
      if (!path) continue;
      const p = at(path, path.len - INSET);
      arrive = { ...p, kind: fl[2] ?? 'req', key: `${round}-${i}` };
    }
  }

  return (
    <svg
      className={`stage-svg ${paused ? 'is-paused' : ''}`}
      viewBox={box}
      preserveAspectRatio="xMidYMid meet"
      role="img"
      aria-label={`Diagrama animado: ${lesson.title}`}
    >
      <defs>
        <pattern id="iso" width="28" height="14" y="-7" patternUnits="userSpaceOnUse">
          <path d="M0 7 L14 0 L28 7 L14 14 Z" fill="none" className="stage-grid" />
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
      </defs>

      <rect x="-200" y="-100" width={W + 400} height={H + 200} fill="url(#iso)" mask="url(#fade-mask)" />

      {/* áreas no chão ficam por baixo de tudo */}
      <g>
        {zones.map((id) => {
          const e = ents[id];
          const isNew = order.includes(id);
          return (
            <g key={id + (isNew ? runKey : '')} className="ent-pos" style={{ transform: `translate(${e.x}px, ${e.y}px)`, transitionDuration: `${dl(MOVE_MS)}ms` }}>
              <g className={isNew ? 'zone-in' : ''} style={isNew ? { animationDelay: `${dl(order.indexOf(id) * ENT_GAP)}ms` } : undefined}>
                <Body e={e} id={id} />
              </g>
            </g>
          );
        })}
      </g>

      {/* losango de destaque, depois das ligações */}
      <g>
        {hot
          .filter((id) => ents[id] && visible.includes(id))
          .map((id) => {
            const e = ents[id];
            const { a, b } = dims(e);
            return (
              <path
                key={id + runKey}
                className="pad"
                style={{ animationDelay: `${dl(spotAt)}ms` }}
                d={rounded(
                  [
                    { x: e.x, y: e.y - b - 14 },
                    { x: e.x + a + 28, y: e.y },
                    { x: e.x, y: e.y + b + 14 },
                    { x: e.x - a - 28, y: e.y },
                  ],
                  8,
                )}
              />
            );
          })}
      </g>

      {/* ligações no chão: ficam atrás dos objetos e tocam a borda da base */}
      <g>
        {lines.map((l) => {
          const isNew = freshLinks.has(l.key);
          const on = !!active && [active[0], active[1]].sort().join('~') === l.key;
          const delay = dl(isNew ? drawStart : 0);
          return (
            <g key={l.key + (isNew ? runKey : '')} className={isNew ? 'is-new' : ''}>
              <path
                className={`link link--${l.style} ${on ? 'is-on' : ''}`}
                d={l.r.d}
                pathLength={l.style === 'solid' ? 1 : undefined}
                style={{ animationDelay: `${delay}ms` }}
              />
              {l.arrow && l.style === 'solid' && <Arrow p={l.r.end} dir={l.r.endDir} delay={delay + DRAW_MS - 90} />}
              {l.both && l.style === 'solid' && <Arrow p={l.r.start} dir={l.startDir} delay={delay + DRAW_MS - 90} />}
            </g>
          );
        })}
      </g>

      {/* pulso na base, depois que as setas terminam de ser desenhadas */}
      <g>
        {!reduce &&
          spotTargets.map((id) => {
            const e = ents[id];
            const { a, b } = dims(e);
            const g = 1.3;
            return (
              <path
                key={id + runKey}
                className="spot"
                style={{ animationDelay: `${spotAt}ms` }}
                d={rounded(
                  [
                    { x: e.x, y: e.y - b * g },
                    { x: e.x + a * g, y: e.y },
                    { x: e.x, y: e.y + b * g },
                    { x: e.x - a * g, y: e.y },
                  ],
                  7,
                )}
              />
            );
          })}
      </g>

      <g>
        {shown.map((id) => {
          const e = ents[id];
          const n = order.indexOf(id);
          const isNew = n >= 0;
          const d = dims(e);
          const sc = e.scale ?? 1;
          const flat = e.kind === 'queue';
          return (
            <g
              key={id + (isNew ? runKey : '')}
              className="ent-pos"
              style={{ transform: `translate(${e.x}px, ${e.y}px)`, transitionDuration: `${dl(MOVE_MS)}ms` }}
            >
              <g className={`ent ${isNew ? 'is-new' : ''}`} style={isNew ? { animationDelay: `${dl(n * ENT_GAP)}ms` } : undefined}>
                <g className="ent__body" style={{ transform: `scale(${sc})`, transitionDuration: `${dl(MOVE_MS)}ms` }}>
                  <Body e={e} id={id} />
                </g>
                {!flat && <Pill x={0} y={d.b + 24 * k} text={e.label} k={k} icon={e.kind === 'crowd' ? 'users' : undefined} />}
                {!flat && e.sub && (
                  <text className="ent__sub" x={0} y={d.b + 24 * k + 26 * k} textAnchor="middle" style={{ fontSize: 10.5 * k }}>
                    {e.sub}
                  </text>
                )}
                {e.gauge && <Gauge y={-d.h - d.b - 20 * k} v={e.gauge[0]} level={e.gauge[1]} k={k} />}
                {e.note && (
                  <g className="pill-in" key={e.note}>
                    <Pill x={d.a + 16 + (e.note.length * 7.3 + 38) * 0.5 * k} y={-d.h * 0.6} text={e.note} tone="warn" icon="warn" k={k} />
                  </g>
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
            <g key={id + text + runKey} className="pill-in" style={{ animationDelay: `${dl(drawEnd)}ms` }}>
              <Pill x={e.x} y={e.y - d.h - d.b - 22 * k} text={text} tone="note" k={k} />
            </g>
          );
        })}
      </g>

      {label && (
        <g key={`${round}-${idx}-${label.text}`} className="pill-in">
          <Pill x={label.x} y={label.y} text={label.text} tone={label.kind} k={k} />
        </g>
      )}
      {arrive && (
        <g key={arrive.key} className={`fx ${arrive.kind === 'err' ? 'fx--fail' : 'fx--ok'}`} transform={`translate(${f(arrive.x)} ${f(arrive.y)})`}>
          <circle r={arrive.kind === 'err' ? 7 : 6} className="fx-ring" />
          {arrive.kind === 'err' && <path className="fx-x" d="M-3,-3 L3,3 M3,-3 L-3,3" />}
        </g>
      )}
      {pkt && <Packet {...pkt} />}
    </svg>
  );
}
