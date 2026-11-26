import { useEffect, useMemo, useRef, useState, type CSSProperties } from 'react';
import type { Ent, Flow, Lesson, PktKind, StaticLink } from './types';
import { Icon } from './icons';

/*
 * Palco isométrico.
 *
 * Geometria: malha de losangos 28x14. Toda entidade tem a base centrada num vértice da malha
 * (pontos 14m, 7n com m+n par) e as ligações correm só nos dois eixos da malha, em L com o canto
 * arredondado, saindo e chegando na borda da base de cada objeto.
 *
 * Troca de passo (tempos medidos no original): 1) o que sai some e afunda; 2) a câmera se reenquadra e o
 * que mudou desliza, com as setas acompanhando; 3) o que é novo cai, um por vez; 4) as ligações novas se
 * desenham quando as pontas chegam; 5) no fim, pulso verde sob o que entrou ou mudou e o tráfego começa.
 */


// tempos da sequência de entrada (ms)
const DRAW_MS = 560; // desenho de cada ligação
const SPOT_MS = 1500; // pulso na base

// tráfego
const TRAVEL_MS = 950; // viagem de um pacote
const FLOW_MS = 1320; // janela de cada fluxo (viagem + pulso de chegada)
const HOLD_MS = 700; // pausa antes de repetir
const INSET = 20; // o pacote para antes da ponta da seta
const ARRIVE_MS = 460;

const GAP = 6; // folga entre a ponta da seta e o desenho do objeto: a seta nunca encosta nem passa por baixo
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

/** o ponto cai dentro do desenho do objeto (base varrida pela altura, como aparece na tela)? */
function sil(e: Ent, p: P) {
  const { a, b, h, L, M } = dims(e);
  const dx = p.x - e.x;
  let dy = p.y - e.y;
  if (dy < 0) dy = dy > -h ? 0 : dy + h; // o corpo sobe a partir da base
  if (e.kind === 'cyl') return (dx / a) ** 2 + (dy / b) ** 2 < 1;
  if (L !== undefined && M !== undefined) {
    const k = uv(dx, dy);
    return Math.abs(k.p) < L && Math.abs(k.q) < M;
  }
  return Math.abs(dx) / a + Math.abs(dy) / b < 1;
}

/** quanto andar de o na direção d até sair do desenho do objeto */
function edge(e: Ent, d: P, o: P = e) {
  if (e.kind === 'zone') return 0;
  let lo = 0;
  let hi = 4;
  while (sil(e, add(o, d, hi)) && hi < 600) {
    lo = hi;
    hi += 8;
  }
  for (let i = 0; i < 10; i++) {
    const m = (lo + hi) / 2;
    if (sil(e, add(o, d, m))) lo = m;
    else hi = m;
  }
  return hi;
}

type Box = { x0: number; x1: number; y0: number; y1: number };

/**
 * Textos presos ao objeto ficam EM CIMA dele (regra prioritária do desenho): de cima para baixo,
 * medidor, nome, subtítulo e o objeto. Assim as ligações, que saem pela base, não cruzam nomes.
 * Posições relativas ao centro da base.
 */
function textLayout(e: Ent, k: number) {
  const d = dims(e);
  const top = -d.h - d.b - (e.kind === 'crowd' ? 24 * (e.scale ?? 1) : 0);
  const w = (e.label.length * 7.3 + 22 + (e.kind === 'crowd' ? 17 : 0)) * k;
  if (e.side === 'right' || e.side === 'left') {
    // ao lado, na altura do meio do corpo, como no original
    const sgn = e.side === 'right' ? 1 : -1;
    const lx = sgn * (d.a + 12 * k + w / 2);
    const ly = -d.h * 0.55 - (e.sub ? 8 * k : 0);
    return { top, lx, ly, sy: ly + 24 * k, gy: top - 21 * k, w };
  }
  const sy = e.sub ? top - 8 * k : 0; // linha de base do subtítulo
  const ly = (e.sub ? sy - 13 * k : top - 8 * k) - 13 * k; // centro do nome
  return { top, lx: 0, ly, sy, gy: ly - 28 * k, w };
}

/** escolhe o lado do nome: em cima, salvo quando ali ele cobriria outro objeto ou outro nome */
function placeLabels(ents: Record<string, Ent>, k: number) {
  const ids = Object.keys(ents).filter((id) => ents[id].kind !== 'zone' && ents[id].kind !== 'queue');
  const taken: Box[] = [];
  const out: Record<string, Ent> = { ...ents };
  const clash = (id: string, bxs: Box[]) => {
    let pen = 0;
    for (const bx of bxs) {
      for (let x = bx.x0; x <= bx.x1; x += 6)
        for (let y = bx.y0; y <= bx.y1; y += 5)
          for (const o of ids) if (o !== id && sil(ents[o], { x, y })) pen++;
      for (const t of taken) if (bx.x0 < t.x1 + 4 && bx.x1 > t.x0 - 4 && bx.y0 < t.y1 + 3 && bx.y1 > t.y0 - 3) pen += 20;
    }
    return pen;
  };
  // de cima para baixo na tela, para os de trás escolherem primeiro
  for (const id of [...ids].sort((p, q) => ents[p].y - ents[q].y)) {
    const e = ents[id];
    let best: { side: Ent['side']; pen: number; bxs: Box[] } | null = null;
    const sides: Ent['side'][] = e.side ? [e.side] : e.note ? ['top', 'left'] : ['top', 'right', 'left'];
    for (const side of sides) {
      const bxs = boxes({ ...e, side, gauge: undefined, note: undefined }, k);
      const pen = clash(id, bxs) + (side === 'top' ? 0 : 0.5);
      if (!best || pen < best.pen) best = { side, pen, bxs };
      if (pen === 0) break;
    }
    out[id] = { ...e, side: best!.side };
    taken.push(...best!.bxs);
  }
  return out;
}

/** caixas dos textos presos ao objeto: etiqueta, subtítulo, medidor e nota */
function boxes(e: Ent, k: number): Box[] {
  if (e.kind === 'zone' || e.kind === 'queue') return [];
  const d = dims(e);
  const out: Box[] = [];
  const pill = (cx: number, cy: number, w: number) => out.push({ x0: cx - (w / 2) * k, x1: cx + (w / 2) * k, y0: cy - 10 * k, y1: cy + 13 * k });
  const t = textLayout(e, k);
  pill(e.x + t.lx, e.y + t.ly, e.label.length * 7.3 + 22 + (e.kind === 'crowd' ? 17 : 0));
  if (e.sub) {
    const w = e.sub.length * 6.4 * k;
    out.push({ x0: e.x + t.lx - w / 2, x1: e.x + t.lx + w / 2, y0: e.y + t.sy - 10 * k, y1: e.y + t.sy + 3 * k });
  }
  if (e.gauge) pill(e.x, e.y + t.gy, 92);
  if (e.note) {
    const w = e.note.length * 7.3 + 22 + 17;
    pill(e.x + d.a + 16 + (e.note.length * 7.3 + 38) * 0.5 * k, e.y - d.h * 0.6, w);
  }
  return out;
}

const inBox = (p: P, bx: Box, pad: number) => p.x > bx.x0 - pad && p.x < bx.x1 + pad && p.y > bx.y0 - pad && p.y < bx.y1 + pad;

/** o ponto cai sobre o objeto como ele aparece na tela (corpo ou textos dele)? */
function inside(e: Ent, p: P, k = 1, pad = 8) {
  if (e.kind === 'zone') return 0;
  const { a, b, h, L, M } = dims(e);
  let dy = p.y - e.y;
  if (dy < 0) dy = dy > -h ? 0 : dy + h; // o corpo sobe a partir da base
  if (L !== undefined && M !== undefined) {
    const q = uv(p.x - e.x, dy);
    return Math.abs(q.p) < L + pad && Math.abs(q.q) < M + pad ? 2 : 0;
  }
  if (Math.abs(p.x - e.x) / (a + pad) + Math.abs(dy) / (b + pad / 2) < 1) return 2;
  for (const bx of boxes(e, k)) if (inBox(p, bx, 5)) return 2;
  return 0;
}

/** distância do ponto ao segmento */
function segDist(p: P, a: P, b: P) {
  const vx = b.x - a.x;
  const vy = b.y - a.y;
  const l2 = vx * vx + vy * vy || 1;
  const t = Math.max(0, Math.min(1, ((p.x - a.x) * vx + (p.y - a.y) * vy) / l2));
  return Math.hypot(p.x - a.x - vx * t, p.y - a.y - vy * t);
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
  /** cantos da rota antes do arredondamento, para interpolar quando o objeto desliza */
  raw: P[];
  tail: number;
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

/** monta a ligação a partir dos pontos (início, cantos, ponta), com cantos arredondados */
function build(pts: P[], tail: number): Route {
  const dirOf = (p: P, q: P) => {
    const l = Math.hypot(q.x - p.x, q.y - p.y) || 1;
    return { x: (q.x - p.x) / l, y: (q.y - p.y) / l, l };
  };
  const start = pts[0];
  const tip = pts[pts.length - 1];
  const last = dirOf(pts[pts.length - 2], tip);
  const end = add(tip, last, -tail);
  let d = `M${f(start.x)},${f(start.y)}`;
  const poly: P[] = [start];
  let best = { l: -1, mid: start };
  for (let i = 1; i < pts.length; i++) {
    const g = dirOf(pts[i - 1], pts[i]);
    if (g.l > best.l) best = { l: g.l, mid: { x: (pts[i - 1].x + pts[i].x) / 2, y: (pts[i - 1].y + pts[i].y) / 2 } };
  }
  for (let i = 1; i < pts.length - 1; i++) {
    const c = pts[i];
    const din = dirOf(pts[i - 1], c);
    const dout = dirOf(c, pts[i + 1]);
    const r = Math.min(R, din.l / 2, dout.l / 2);
    const c1 = add(c, din, -r);
    const c2 = add(c, dout, r);
    d += ` L${f(c1.x)},${f(c1.y)} Q${f(c.x)},${f(c.y)} ${f(c2.x)},${f(c2.y)}`;
    poly.push(c1);
    for (let j = 1; j < 6; j++) {
      const k = j / 6;
      poly.push({
        x: (1 - k) * (1 - k) * c1.x + 2 * (1 - k) * k * c.x + k * k * c2.x,
        y: (1 - k) * (1 - k) * c1.y + 2 * (1 - k) * k * c.y + k * k * c2.y,
      });
    }
    poly.push(c2);
  }
  d += ` L${f(end.x)},${f(end.y)}`;
  poly.push(tip);
  return { d, ...polyline(poly), start, end: tip, endDir: { x: last.x, y: last.y }, mid: best.mid, raw: pts, tail };
}

/** traça a ligação de A até B só nos eixos da malha: reta, em L ou em Z */
function route(A: Ent, B: Ent, others: Ent[], arrow: boolean, k = 1, taken: P[][] = [], bounds?: Box): Route {
  const dx = B.x - A.x;
  const dy = B.y - A.y;
  // B = A + s·(2,1) + t·(2,−1)
  const s = (dx / 2 + dy) / 2;
  const t = (dx / 2 - dy) / 2;
  const tail = arrow ? 4 : 0; // a linha termina um pouco antes da ponta, que é desenhada à parte

  // praticamente alinhados num eixo: linha reta
  if (Math.abs(s) * S5 < 6 || Math.abs(t) * S5 < 6) {
    const dir = Math.abs(s) * S5 < 6 ? { x: Math.sign(t || 1) * V.x, y: Math.sign(t || 1) * V.y } : { x: Math.sign(s || 1) * U.x, y: Math.sign(s || 1) * U.y };
    return build([add(A, dir, edge(A, dir) + GAP), add(B, neg(dir), edge(B, neg(dir)) + GAP)], tail);
  }

  const su = { x: Math.sign(s) * U.x, y: Math.sign(s) * U.y };
  const tv = { x: Math.sign(t) * V.x, y: Math.sign(t) * V.y };
  const ls = Math.abs(s) * S5;
  const lt = Math.abs(t) * S5;
  const room = R + 6;

  const cands: { pts: P[]; pen: number; z: number }[] = [];
  // reta deslocada: quase alinhados num eixo, a linha corre paralela ao eixo, deslocada metade da diferença
  for (const [d1, l1, d2, l2] of [
    [su, ls, tv, lt],
    [tv, lt, su, ls],
  ] as [P, number, P, number][]) {
    const half = l2 / 2;
    if (half > 0.75 * Math.min(edge(A, d2), edge(B, d2))) continue;
    const oA = add(A, d2, half);
    const oB = add(B, d2, -half);
    const e1 = edge(A, d1, oA) + GAP;
    const e2 = edge(B, neg(d1), oB) + GAP;
    const pen = l1 < e1 + e2 + 12 ? 100 : 0;
    cands.push({ pts: [add(oA, d1, e1), add(oB, d1, -e2)], pen, z: -1 });
  }
  // em L: um eixo e depois o outro
  for (const [d1, l1, d2, l2] of [
    [su, ls, tv, lt],
    [tv, lt, su, ls],
  ] as [P, number, P, number][]) {
    // a saída e a chegada podem deslizar um pouco pela face, para duas ligações não correrem coladas
    const mo = 0.6 * edge(A, d2);
    const mp = 0.6 * edge(B, d1);
    for (const o of [0, 14, -14]) {
      if (Math.abs(o) > mo) continue;
      for (const q of [0, 14, -14]) {
        if (Math.abs(q) > mp) continue;
        const sA = add(A, d2, o); // saída deslocada pela face de A
        const sB = add(B, d1, -q); // chegada deslocada pela face de B
        const corner = add(sA, d1, l1 - q);
        const e1 = edge(A, d1, sA) + GAP;
        const e2 = edge(B, neg(d2), sB) + GAP;
        const pen = l1 - q < e1 + room || l2 - o < e2 + room ? 100 : 0; // o canto cairia dentro de um dos objetos
        cands.push({ pts: [add(sA, d1, e1), corner, add(sB, neg(d2), e2)], pen, z: o || q ? 0.4 : 0 });
      }
    }
  }
  // em Z: sai e chega pelo mesmo eixo, com um degrau no meio (objetos grandes ou próximos)
  for (const [d1, l1, d2, l2] of [
    [su, ls, tv, lt],
    [tv, lt, su, ls],
  ] as [P, number, P, number][]) {
    const eA = edge(A, d1) + GAP;
    const eB = edge(B, neg(d1)) + GAP;
    // o degrau fica no meio do vão livre; perto de uma das pontas, se o meio estiver ocupado
    for (const [frac, z] of [
      [0.5, 1],
      [0.25, 1.1],
      [0.75, 1.1],
    ]) {
      const m = eA + (l1 - eA - eB) * frac;
      const c1 = add(A, d1, m);
      const c2 = add(c1, d2, l2);
      const r = Math.min(R, l2 / 2);
      let pen = m - eA < r + 4 || l1 - m - eB < r + 4 ? 100 : 0;
      if (l2 < 2 * R) pen += 3; // degrau pequeno demais vira um "zigue-zague": só se não houver outra saída
      cands.push({ pts: [add(A, d1, eA), c1, c2, add(B, neg(d1), eB)], pen, z });
    }
  }
  for (const c of cands) {
    for (let i = 1; i < c.pts.length; i++) {
      const p = c.pts[i - 1];
      const q = c.pts[i];
      const l = Math.hypot(q.x - p.x, q.y - p.y);
      for (let k = 0; k < l; k += 8) {
        const pt = { x: p.x + ((q.x - p.x) * k) / l, y: p.y + ((q.y - p.y) * k) / l };
        for (const other of others) c.pen += 5 * inside(other, pt, k);
        if (sil(A, pt) || sil(B, pt)) c.pen += 50; // nunca passa por cima ou por baixo das pontas
        for (const bx of [...boxes(A, k), ...boxes(B, k)]) if (inBox(pt, bx, 4)) c.pen += 10; // nem pelos textos delas
        // não sai do quadro
        if (bounds && !inBox(pt, bounds, 0)) c.pen += 6;
        // não corre colada em outra ligação
        for (const t of taken) for (let j = 1; j < t.length; j++) if (segDist(pt, t[j - 1], t[j]) < 9) c.pen += 2;
      }
    }
  }
  // menos colisões; depois L antes de Z; empate: o canto mais à frente (mais embaixo na tela)
  cands.sort((p, q) => p.pen - q.pen || p.z - q.z || q.pts[1].y - p.pts[1].y);
  return build(cands[0].pts, tail);
}

function reverse(r: Route, startDir: P): Route {
  const pts = [...r.pts].reverse();
  const pl = polyline(pts);
  return { ...r, ...pl, start: pts[0], end: pts[pts.length - 1], endDir: startDir };
}

/** polígono com cantos arredondados */
function rounded(pts: P[], radius: number | number[]) {
  let d = '';
  pts.forEach((p, i) => {
    const r = Array.isArray(radius) ? radius[i] : radius;
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

/** raios dos cantos do casco (topo, lateral de cima à direita, lateral de baixo, base, ...) e do tampo, medidos no original */
const sideR = (h: number) => Math.min(9, h * 0.45);
const hullR = (h: number) => [10, sideR(h), sideR(h), 12, sideR(h), sideR(h)];
const topR = (h: number) => [10, sideR(h), 6, sideR(h)];

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
      hullR(h),
    );
    return (
      <g className="crowd">
        <path className="blk__shadow" d={plate} transform="translate(0 8)" />
        <path className="crowd__plate" d={plate} />
        <path className="crowd__top" d={rounded([{ x: 0, y: -h - b }, { x: a, y: -h }, { x: 0, y: -h + b }, { x: -a, y: -h }], topR(h))} />
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
      <g className={`blk blk--${e.color} ${e.ghost ? 'blk--ghost' : ''} ${e.down ? 'blk--down' : ''}`}>
        <ellipse className="blk__shadow" cx={0} cy={8} rx={a + 4} ry={b + 3} />
        <path className="blk__side" d={`M${-a},${-h} V0 A${a},${b} 0 0 0 ${a},0 V${-h} Z`} />
        <path className="blk__shade" d={`M0,${-h} V${b} A${a},${b} 0 0 0 ${a},0 V${-h} Z`} />
        <ellipse className="blk__top" cx={0} cy={-h} rx={a} ry={b} />
        <path className="blk__ring" d={`M${-a},${-h / 2} A${a},${b} 0 0 0 ${a},${-h / 2}`} />
        <g className="blk__icon" transform={`translate(-10 ${-h - 10})`}>
          <Icon name={e.down ? 'x' : e.icon} size={20} />
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
  // cantos arredondados com os raios do original: topo 10, laterais 9 (ou menos, se o lado for curto), base 12
  const hull = rounded(hullPts, hullR(h));
  const top = rounded(
    [
      { x: 0, y: -h - b },
      { x: a, y: -h },
      { x: 0, y: -h + b },
      { x: -a, y: -h },
    ],
    topR(h),
  );
  const right = `M${a + 2},${-h} L0,${-h + b} L0,${b + 2} L${a + 2},2 Z`;
  const clip = `clip-${id}`;
  const iconSize = e.kind === 'plate' ? 18 : 22;
  return (
    <g className={`blk blk--${e.color} ${e.kind === 'plate' ? 'blk--plate' : ''} ${e.ghost ? 'blk--ghost' : ''} ${e.down ? 'blk--down' : ''}`}>
      <clipPath id={clip}>
        <path d={hull} />
      </clipPath>
      <path className="blk__shadow" d={hull} transform="translate(0 9)" />
      <path className="blk__side" d={hull} />
      <path className="blk__shade" d={right} clipPath={`url(#${clip})`} />
      <path className="blk__top" d={top} clipPath={`url(#${clip})`} />
      <path className="blk__edge" d={`M${-a},${-h} L${f(-a * 0.128)},${f(-h + b - b * 0.128)} Q0,${-h + b} ${f(a * 0.128)},${f(-h + b - b * 0.128)} L${a},${-h}`} />
      <path className="blk__hull" d={hull} />
      <g className="blk__icon" transform={`translate(${-iconSize / 2} ${-h - iconSize / 2})`}>
        <Icon name={e.down ? 'x' : e.icon} size={iconSize} />
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
function Arrow({ p, dir, op, cls }: { p: P; dir: P; op: number; cls?: string }) {
  const ang = (Math.atan2(dir.y, dir.x) * 180) / Math.PI;
  return (
    <g transform={`translate(${f(p.x)} ${f(p.y)}) rotate(${f(ang)})`} opacity={op}>
      <path className={`arrow-head ${cls ?? ''}`} d="M-8,-3.9 L0.4,0 L-8,3.9 Z" />
    </g>
  );
}

/** estado de um passo que o palco sabe desenhar (usado no Repetir, que parte do passo anterior) */
export interface StageScene {
  visible: string[];
  over: Record<string, Partial<Ent>>;
  links: StaticLink[];
  flows: Flow[];
  pills: Record<string, string>;
  idle: string[];
}

export interface StageProps {
  lesson: Lesson;
  visible: string[];
  hot: string[];
  flows: Flow[];
  links: StaticLink[];
  pills: Record<string, string>;
  paused: boolean;
  runKey: string;
  /** propriedades trocadas pelos passos até aqui */
  over?: Record<string, Partial<Ent>>;
  /** objetos fora de uso neste passo: esmaecidos */
  idle?: string[];
  /** o passo anterior, de onde o Repetir parte */
  from?: StageScene;
  /** muda a cada clique em Repetir */
  replay?: number;
  /** muda quando o leitor pede para voltar ao quadro inteiro */
  fitKey?: number;
  /** avisa quando o leitor aproxima ou volta ao quadro */
  onZoom?: (zoomed: boolean) => void;
  /** há cartão de dados no canto direito: o diagrama se enquadra à esquerda dele */
  board?: boolean;
}

/** quadro do palco em px: a grade cobre tudo, o diagrama se enquadra dentro das folgas (chips, legenda, cartão) */
type Frame = { w: number; h: number; t: number; r: number; b: number; l: number };

/*
 * Tempos medidos no original (designed-to-scale), lição Redundância e failover, 2026-11-26.
 * Ordem da troca de passo: o que sai some; a câmera e o que mudou deslizam; o que é novo cai, um por vez;
 * as ligações novas se desenham quando as pontas chegam; no fim, pulso e tráfego.
 */
const EXIT_MS = 420;
const MOVE_MS = 820;
const ENTER_MS = 680;
const STAGGER_MS = 130;
const LINK_OUT_MS = 300;
const CAM_MS = 820;
const BLEND_MS = 360;
const PKT_OUT_MS = 260;
const ZOOM_MAX = 1.25; // a referência vai até 1,6, mas nossas cenas têm menos objetos e ficavam grandes demais
const ZOOM_MIN = 0.3;
const MARGIN = 16;

const inOut = (t: number) => (t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2);
const outC = (t: number) => 1 - Math.pow(1 - t, 3);
const backE = (t: number) => 1 + 2.35 * Math.pow(t - 1, 3) + 1.35 * Math.pow(t - 1, 2);
const clamp = (t: number) => Math.max(0, Math.min(1, t));
const lerp = (a: number, b: number, t: number) => a + (b - a) * t;

type Cam = { x: number; y: number; w: number; h: number };
type Line = { key: string; a: string; b: string; style: string; arrow: boolean; both: boolean; r: Route; startDir: P };
type Scene = { lesson: string; ents: Record<string, Ent>; visible: string[]; lines: Line[]; pills: Record<string, string>; idle: string[] };

/** entidades da lição com as trocas aplicadas, encaixadas na malha e com o lado do nome escolhido */
function resolveEnts(lesson: Lesson, over: Record<string, Partial<Ent>>, k: number) {
  const out: Record<string, Ent> = {};
  for (const [id, e] of Object.entries(lesson.ents)) {
    const m = { ...e, ...over[id] };
    out[id] = { ...m, ...snap(m.x, m.y) };
  }
  return placeLabels(out, k);
}

/** ligações: as estáticas mais um traço por par usado em algum fluxo */
function computeLines(ents: Record<string, Ent>, visible: string[], links: StaticLink[], flows: Flow[], k: number): Line[] {
  const out: Line[] = [];
  const seen = new Set<string>();
  const taken: P[][] = [];
  const all = Object.values(ents);
  const frame: Box = {
    x0: Math.min(...all.map((e) => e.x)) - 70,
    x1: Math.max(...all.map((e) => e.x)) + 70,
    y0: Math.min(...all.map((e) => e.y)) - 90,
    y1: Math.max(...all.map((e) => e.y)) + 50,
  };
  const push = (a: string, b: string, style: string, arrow: boolean) => {
    const key = [a, b].sort().join('~');
    if (seen.has(key) || !ents[a] || !ents[b] || !visible.includes(a) || !visible.includes(b)) return;
    seen.add(key);
    const others = visible.filter((id) => id !== a && id !== b && ents[id]).map((id) => ents[id]);
    const both = arrow && flows.some((x) => x[0] === b && x[1] === a) && flows.some((x) => x[0] === a && x[1] === b);
    const r = route(ents[a], ents[b], others, arrow, k, taken, frame);
    taken.push(r.pts);
    const p0 = r.pts[0];
    const p1 = r.pts[1];
    const l = Math.hypot(p1.x - p0.x, p1.y - p0.y) || 1;
    // uma ponta fora do ar: a ligação fica tracejada e apagada
    const st = ents[a].down || ents[b].down ? 'off' : style;
    out.push({ key, a, b, style: st, arrow, both, r, startDir: { x: -(p1.x - p0.x) / l, y: -(p1.y - p0.y) / l } });
  };
  for (const [a, b, style] of links) push(a, b, style ?? 'solid', false);
  for (const [a, b] of flows) push(a, b, 'solid', true);
  return out;
}

/** posição da etiqueta de passo (nota azul) acima do nome ou do medidor */
const pillY = (e: Ent, k: number) => {
  const t = textLayout(e, k);
  return (e.gauge ? t.gy : t.ly) - 28 * k;
};

/** caixa de tudo o que a cena desenha: corpos, textos, etiquetas e ligações */
function sceneBounds(sc: Scene, k: number): Box {
  const b: Box = { x0: Infinity, y0: Infinity, x1: -Infinity, y1: -Infinity };
  const grow = (x: number, y: number) => {
    b.x0 = Math.min(b.x0, x);
    b.y0 = Math.min(b.y0, y);
    b.x1 = Math.max(b.x1, x);
    b.y1 = Math.max(b.y1, y);
  };
  for (const id of sc.visible) {
    const e = sc.ents[id];
    if (!e) continue;
    const d = dims(e);
    if (d.L !== undefined && d.M !== undefined) for (const p of floorRect(d.L, d.M)) grow(e.x + p.x, e.y + p.y);
    else {
      grow(e.x - d.a, e.y - d.h - d.b - (e.kind === 'crowd' ? 30 : 0));
      grow(e.x + d.a, e.y + d.b + 9);
    }
    for (const bx of boxes(e, k)) {
      grow(bx.x0, bx.y0);
      grow(bx.x1, bx.y1);
    }
    const top = sc.pills[id] || e.down;
    if (top) grow(e.x, e.y + pillY(e, k) - (sc.pills[id] && e.down ? 28 * k : 0) - 12 * k);
  }
  for (const l of sc.lines) for (const p of l.r.raw) grow(p.x, p.y);
  if (b.x0 === Infinity) return { x0: -100, y0: -60, x1: 100, y1: 60 };
  return b;
}

/** enquadra a cena como o original: zoom em passos de 0,05 entre 0,3 e 1,25, margem de 16 px, e mantém o quadro quando ainda cabe */
function fitCam(b: Box, size: Frame, prev: { cam: Cam; zoom: number } | null) {
  const bw = Math.max(1, b.x1 - b.x0);
  const bh = Math.max(1, b.y1 - b.y0);
  const iw = Math.max(40, size.w - size.l - size.r);
  const ih = Math.max(40, size.h - size.t - size.b);
  const zoom = Math.max(ZOOM_MIN, Math.floor(Math.min(ZOOM_MAX, (iw - 2 * MARGIN) / bw, (ih - 2 * MARGIN) / bh) * 20 + 1e-6) / 20);
  const cam = { x: b.x0 - (size.l + (iw - bw * zoom) / 2) / zoom, y: b.y0 - (size.t + (ih - bh * zoom) / 2) / zoom, w: size.w / zoom, h: size.h / zoom };
  if (prev) {
    const same = Math.abs(prev.zoom - zoom) < 1e-6;
    const near = prev.zoom < zoom && prev.zoom >= zoom * 0.9;
    if (same || near) {
      const r = prev.cam;
      const i = 12 / prev.zoom;
      const z = prev.zoom;
      const ix = { x: r.x + size.l / z, y: r.y + size.t / z, w: r.w - (size.l + size.r) / z, h: r.h - (size.t + size.b) / z };
      const fits = b.x0 >= ix.x + i && b.y0 >= ix.y + i && b.x1 <= ix.x + ix.w - i && b.y1 <= ix.y + ix.h - i;
      const u = Math.abs((b.x0 + b.x1) / 2 - (ix.x + ix.w / 2)) / ix.w;
      const v = Math.abs((b.y0 + b.y1) / 2 - (ix.y + ix.h / 2)) / ix.h;
      const lim = same ? 0.12 : 0.18;
      if (fits && u < lim && v < lim) return { cam: r, zoom: prev.zoom };
    }
  }
  return { cam, zoom };
}

const lerpCam = (a: Cam, b: Cam, t: number): Cam => ({ x: lerp(a.x, b.x, t), y: lerp(a.y, b.y, t), w: lerp(a.w, b.w, t), h: lerp(a.h, b.h, t) });

/** o que o objeto mostra e que, se mudar, conta como mudança (desliza, troca o texto e ganha pulso) */
const looks = (e: Ent, pill?: string, idle?: boolean) =>
  JSON.stringify([e.x, e.y, e.scale ?? 1, e.label, e.sub, e.note, e.gauge, e.color, e.icon, e.ghost, e.down, e.count, e.w, e.d, pill, idle]);

export function Stage({ lesson, visible, hot, flows, links, pills, paused, runKey, over = {}, idle = [], from, replay = 0, fitKey = 0, onZoom, board = false }: StageProps) {
  const reduce = useMemo(() => matchMedia('(prefers-reduced-motion: reduce)').matches, []);
  // no celular o diagrama encolhe, então os rótulos crescem para continuar legíveis
  const [k, setK] = useState(() => (matchMedia('(max-width: 820px)').matches ? 1.45 : 1));
  useEffect(() => {
    const mq = matchMedia('(max-width: 820px)');
    const on = () => setK(mq.matches ? 1.45 : 1);
    mq.addEventListener('change', on);
    return () => mq.removeEventListener('change', on);
  }, []);

  // tamanho do quadro na tela, em px
  const svgRef = useRef<SVGSVGElement>(null);
  const [size, setSize] = useState({ w: 900, h: 600 });
  useEffect(() => {
    const host = svgRef.current?.parentElement;
    if (!host) return;
    const read = () => {
      const w = host.clientWidth;
      const h = host.clientHeight;
      if (w > 0 && h > 0) setSize((s) => (s.w === w && s.h === h ? s : { w, h }));
    };
    read();
    const ro = new ResizeObserver(read);
    ro.observe(host);
    return () => ro.disconnect();
  }, []);
  // no desktop o palco cobre o cartão inteiro, como no original: chips em cima, legenda embaixo e o cartão de dados
  // ficam por cima da grade, e o diagrama se enquadra no espaço que sobra
  const [desk, setDesk] = useState(() => matchMedia('(min-width: 1200px)').matches);
  useEffect(() => {
    const mq = matchMedia('(min-width: 1200px)');
    const on = () => setDesk(mq.matches);
    mq.addEventListener('change', on);
    return () => mq.removeEventListener('change', on);
  }, []);
  const frame: Frame = useMemo(
    () => (desk ? { ...size, t: 62, b: 34, l: 10, r: board ? Math.min(306, size.w * 0.46) : 10 } : { ...size, t: 0, b: 0, l: 0, r: 0 }),
    [size, desk, board],
  );

  const ents = useMemo(() => resolveEnts(lesson, over, k), [lesson, over, k]);
  const lines = useMemo(() => computeLines(ents, visible, links, flows, k), [ents, visible, links, flows, k]);
  const target: Scene = useMemo(() => ({ lesson: lesson.id, ents, visible, lines, pills, idle }), [lesson.id, ents, visible, lines, pills, idle]);

  // o que está desenhado agora, de onde a próxima troca parte
  const shown = useRef<Scene | null>(null);
  const shownCam = useRef<{ cam: Cam; zoom: number } | null>(null);
  const dispCam = useRef<Cam | null>(null);
  const lastReplay = useRef(replay);
  const lastPkt = useRef<{ x: number; y: number; kind: PktKind; back: boolean } | undefined>(undefined);

  // ───── plano da troca de passo ─────
  const plan = useMemo(() => {
    let prev: Scene | null = null;
    if (replay !== lastReplay.current && from) {
      const fe = resolveEnts(lesson, from.over, k);
      prev = { lesson: lesson.id, ents: fe, visible: from.visible, lines: computeLines(fe, from.visible, from.links, from.flows, k), pills: from.pills, idle: from.idle };
    } else if (shown.current && shown.current.lesson === lesson.id) prev = shown.current;
    const pv = prev ? prev.visible.filter((id) => prev!.ents[id]) : [];
    const exits = pv.filter((id) => !visible.includes(id) && prev!.ents[id]);
    const stay = visible.filter((id) => pv.includes(id) && ents[id]);
    // de trás para a frente: chão primeiro, depois quem está mais acima na tela
    const enters = visible
      .filter((id) => !pv.includes(id) && ents[id])
      .sort((p, q) => Number(ents[q].kind === 'zone') - Number(ents[p].kind === 'zone') || ents[p].y - ents[q].y);
    const changed = new Set(stay.filter((id) => looks(prev!.ents[id], prev!.pills[id], prev!.idle.includes(id)) !== looks(ents[id], pills[id], idle.includes(id))));
    const c = exits.length ? EXIT_MS * 0.55 : 0;
    const l0 = changed.size ? c + MOVE_MS * 0.75 : exits.length ? EXIT_MS * 0.7 : 0;
    const enterAt = new Map<string, number>();
    const ready: Record<string, number> = {};
    let end = 0;
    if (exits.length) end = EXIT_MS;
    for (const id of stay) ready[id] = changed.has(id) ? c + MOVE_MS : 0;
    if (changed.size) end = Math.max(end, c + MOVE_MS);
    enters.forEach((id, i) => {
      const at = l0 + i * STAGGER_MS;
      enterAt.set(id, at);
      ready[id] = at + ENTER_MS * 0.8;
      end = Math.max(end, at + ENTER_MS);
    });
    const prevKeys = new Set(prev ? prev.lines.map((l) => l.key) : []);
    const linkAt = new Map<string, number>();
    let n = 0;
    for (const l of lines) {
      if (prevKeys.has(l.key) && !enterAt.has(l.a) && !enterAt.has(l.b)) continue;
      const at = Math.max(ready[l.a] ?? 0, ready[l.b] ?? 0, c + (changed.size ? MOVE_MS * 0.6 : 0)) + 60 + n * 90;
      n += 1;
      linkAt.set(l.key, at);
      end = Math.max(end, at + DRAW_MS);
    }
    const keys = new Set(lines.map((l) => l.key));
    const exitLines = prev ? prev.lines.filter((l) => !keys.has(l.key)) : [];
    const camDelay = exits.length ? EXIT_MS * 0.4 : 0;
    end = Math.max(end, camDelay + CAM_MS);
    const fit = fitCam(sceneBounds(target, k), frame, prev && shownCam.current ? shownCam.current : null);
    const camFrom = prev && dispCam.current ? dispCam.current : fit.cam;
    const spot = [...enters, ...changed].filter((id) => ents[id] && ents[id].kind !== 'zone' && ents[id].kind !== 'queue');
    return { prev, exits, enterAt, changed, c, linkAt, exitLines, camDelay, camFrom, fit, size: frame, end: reduce ? 0 : end, spot, pkt: lastPkt.current };
    // o plano só muda numa troca de passo; o resto do palco acompanha k e o tamanho
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [runKey]);

  // ───── relógio: animação da troca e, depois do fim, o tráfego ─────
  const t0 = useRef(performance.now());
  const traf = useRef(0);
  const [, setFrame] = useState(0);
  const [view, setViewState] = useState<{ k: number; cx: number; cy: number } | null>(null);
  const blend = useRef<{ from: Cam; start: number } | null>(null);
  const [blendKey, setBlendKey] = useState(0);
  useEffect(() => {
    t0.current = performance.now();
    traf.current = 0;
    setViewState(null);
    blend.current = null;
    setFrame((n) => n + 1);
  }, [runKey]);
  useEffect(() => {
    let raf = 0;
    let last = performance.now();
    const tick = (ts: number) => {
      const it = ts - t0.current;
      const dt = Math.min(64, ts - last);
      last = ts;
      if ((reduce || it >= plan.end) && !paused) traf.current += dt;
      setFrame((n) => n + 1);
      const busy = (!reduce && it < plan.end + SPOT_MS + 200) || (flows.length > 0 && !paused) || (blend.current && ts - blend.current.start < BLEND_MS + 40);
      if (busy) raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, [plan, paused, flows.length, reduce, blendKey]);

  const t = reduce ? 1e9 : performance.now() - t0.current;
  const mv = clamp((t - plan.c) / MOVE_MS); // progresso das mudanças
  const ms = inOut(mv);
  const prev = plan.prev;

  // ───── câmera ─────
  const sameSize = plan.size.w === frame.w && plan.size.h === frame.h && plan.size.r === frame.r && plan.size.t === frame.t;
  const fitNow = useMemo(() => (sameSize ? plan.fit : fitCam(sceneBounds(target, k), frame, null)), [sameSize, plan, target, k, frame]);
  const camP = clamp((t - plan.camDelay) / CAM_MS);
  const base: Cam = sameSize && camP < 1 ? lerpCam(plan.camFrom, fitNow.cam, inOut(camP)) : fitNow.cam;
  const scale = size.w / base.w;
  const clampView = (v: { k: number; cx: number; cy: number } | null) => {
    if (!v) return null;
    const maxK = Math.max(1.5, Math.min(6, 3.2 / scale));
    const kk = Math.max(1, Math.min(maxK, v.k));
    if (kk <= 1.001) return null;
    const w = base.w / kk;
    const h = base.h / kk;
    return { k: kk, cx: Math.max(base.x + w / 2, Math.min(base.x + base.w - w / 2, v.cx)), cy: Math.max(base.y + h / 2, Math.min(base.y + base.h - h / 2, v.cy)) };
  };
  let cam: Cam = view ? { x: view.cx - base.w / view.k / 2, y: view.cy - base.h / view.k / 2, w: base.w / view.k, h: base.h / view.k } : base;
  if (blend.current) {
    const bp = clamp((performance.now() - blend.current.start) / BLEND_MS);
    if (bp < 1) cam = lerpCam(blend.current.from, cam, inOut(bp));
  }
  dispCam.current = cam;

  useEffect(() => {
    shown.current = target;
    shownCam.current = fitNow;
    lastReplay.current = replay;
  }, [target, fitNow, replay]);

  // ───── zoom do leitor: roda (com Ctrl), pinça, dois cliques e arrastar ─────
  const live = useRef({ cam, base, view, clampView });
  live.current = { cam, base, view, clampView };
  const setView = (v: { k: number; cx: number; cy: number } | null, smooth = false) => {
    if (smooth) {
      blend.current = { from: { ...live.current.cam }, start: performance.now() };
      setBlendKey((n) => n + 1);
    } else blend.current = null;
    setViewState(live.current.clampView(v));
  };
  const zoomAt = (fx: number, fy: number, factor: number) => {
    const { cam: r, base: b, view: v } = live.current;
    const px = r.x + fx * r.w;
    const py = r.y + fy * r.h;
    const o = (v ? v.k : 1) * factor;
    const w = b.w / o;
    const h = b.h / o;
    setView({ k: o, cx: px - fx * w + w / 2, cy: py - fy * h + h / 2 });
  };
  const panBy = (dx: number, dy: number) => {
    const { cam: r, view: v } = live.current;
    if (!v) return;
    setView({ ...v, cx: v.cx - dx * r.w, cy: v.cy - dy * r.h });
  };
  useEffect(() => onZoom?.(!!view), [view, onZoom]);
  const firstFit = useRef(fitKey);
  useEffect(() => {
    if (firstFit.current === fitKey) return;
    firstFit.current = fitKey;
    if (live.current.view) setView(null, true);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [fitKey]);
  useEffect(() => {
    const el = svgRef.current;
    if (!el) return;
    const rel = (x: number, y: number) => {
      const r = el.getBoundingClientRect();
      return [(x - r.left) / r.width, (y - r.top) / r.height] as const;
    };
    const wheel = (e: WheelEvent) => {
      const m = e.deltaMode === 1 ? 16 : 1;
      if (e.ctrlKey || e.metaKey) {
        e.preventDefault();
        const [fx, fy] = rel(e.clientX, e.clientY);
        zoomAt(fx, fy, Math.exp(-e.deltaY * m * 0.01));
      } else if (live.current.view) {
        e.preventDefault();
        const r = el.getBoundingClientRect();
        panBy((-e.deltaX * m) / r.width, (-e.deltaY * m) / r.height);
      }
    };
    const dbl = (e: MouseEvent) => {
      if (live.current.view) return setView(null, true);
      const [fx, fy] = rel(e.clientX, e.clientY);
      const r = live.current.base;
      const w = r.w / 2;
      const h = r.h / 2;
      const px = r.x + fx * r.w;
      const py = r.y + fy * r.h;
      setView({ k: 2, cx: px - fx * w + w / 2, cy: py - fy * h + h / 2 }, true);
    };
    const pts = new Map<number, { x: number; y: number }>();
    let pinch = 0;
    const down = (e: PointerEvent) => {
      pts.set(e.pointerId, { x: e.clientX, y: e.clientY });
      if (pts.size === 2) {
        const [a, b] = [...pts.values()];
        pinch = Math.hypot(a.x - b.x, a.y - b.y);
      }
      if (live.current.view || pts.size === 2) el.setPointerCapture(e.pointerId);
    };
    const move = (e: PointerEvent) => {
      const p = pts.get(e.pointerId);
      if (!p) return;
      const r = el.getBoundingClientRect();
      if (pts.size === 2) {
        pts.set(e.pointerId, { x: e.clientX, y: e.clientY });
        const [a, b] = [...pts.values()];
        const d = Math.hypot(a.x - b.x, a.y - b.y);
        if (pinch > 0 && d > 0) {
          const [fx, fy] = rel((a.x + b.x) / 2, (a.y + b.y) / 2);
          zoomAt(fx, fy, d / pinch);
        }
        pinch = d;
        e.preventDefault();
        return;
      }
      if (live.current.view) {
        panBy((e.clientX - p.x) / r.width, (e.clientY - p.y) / r.height);
        e.preventDefault();
      }
      pts.set(e.pointerId, { x: e.clientX, y: e.clientY });
    };
    const up = (e: PointerEvent) => {
      pts.delete(e.pointerId);
      pinch = 0;
    };
    el.addEventListener('wheel', wheel, { passive: false });
    el.addEventListener('dblclick', dbl);
    el.addEventListener('pointerdown', down);
    el.addEventListener('pointermove', move);
    el.addEventListener('pointerup', up);
    el.addEventListener('pointercancel', up);
    return () => {
      el.removeEventListener('wheel', wheel);
      el.removeEventListener('dblclick', dbl);
      el.removeEventListener('pointerdown', down);
      el.removeEventListener('pointermove', move);
      el.removeEventListener('pointerup', up);
      el.removeEventListener('pointercancel', up);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // ───── pose de cada objeto no instante t ─────
  type Pose = { e: Ent; op: number; dy: number; text: number; tag: number; pill?: string; idle: boolean };
  const pose = (id: string): Pose | null => {
    const to = ents[id];
    const at = plan.enterAt.get(id);
    if (at !== undefined) {
      if (t < at) return null;
      const p = clamp((t - at) / ENTER_MS);
      const flat = to.kind === 'zone' || to.kind === 'queue';
      const lift0 = flat ? 0 : to.kind === 'crowd' ? 26 : to.kind === 'plate' ? 40 : 120;
      const cnt = to.kind === 'crowd' || to.kind === 'queue' ? Math.round(lerp(0, to.count ?? (to.kind === 'crowd' ? 9 : 0), inOut(p))) : to.count;
      return { e: { ...to, count: cnt }, op: to.kind === 'queue' ? 1 : outC(p), dy: -lift0 * (1 - backE(p)), text: 1, tag: 1, pill: pills[id], idle: idle.includes(id) };
    }
    const fr = prev?.ents[id];
    if (fr && plan.changed.has(id) && mv < 1) {
      const late = mv >= 0.5;
      const base = late ? to : fr;
      const e: Ent = {
        ...base,
        x: lerp(fr.x, to.x, ms),
        y: lerp(fr.y, to.y, ms),
        scale: lerp(fr.scale ?? 1, to.scale ?? 1, ms),
        gauge: fr.gauge && to.gauge ? [lerp(fr.gauge[0], to.gauge[0], ms), late ? to.gauge[1] : fr.gauge[1]] : base.gauge,
        count: fr.count !== undefined && to.count !== undefined ? Math.round(lerp(fr.count, to.count, inOut(mv))) : base.count,
      };
      const fade = late ? clamp((mv - 0.55) / 0.4) : 1 - clamp(mv / 0.42);
      const textSwap = fr.label !== to.label || (fr.sub ?? '') !== (to.sub ?? '');
      const tagSwap = fr.note !== to.note || fr.down !== to.down || prev!.pills[id] !== pills[id];
      return {
        e,
        op: 1,
        dy: 0,
        text: textSwap ? fade : 1,
        tag: tagSwap ? fade : 1,
        pill: late ? pills[id] : prev!.pills[id],
        idle: late ? idle.includes(id) : prev!.idle.includes(id),
      };
    }
    return { e: to, op: 1, dy: 0, text: 1, tag: 1, pill: pills[id], idle: idle.includes(id) };
  };
  const poses: Record<string, Pose> = {};
  for (const id of visible) {
    if (!ents[id]) continue;
    const p = pose(id);
    if (p) poses[id] = p;
  }
  // o que sai: some e afunda
  const ex = inOut(clamp(t / EXIT_MS));
  const leaving = ex < 1 && prev ? plan.exits.map((id) => ({ id, e: prev.ents[id] })).filter((x) => x.e) : [];

  // rota que acompanha o objeto enquanto ele desliza
  const routeNow = (l: Line): Route => {
    if (!prev || mv >= 1 || !(plan.changed.has(l.a) || plan.changed.has(l.b))) return l.r;
    const old = prev.lines.find((o) => o.key === l.key);
    if (!old) return l.r;
    const flip = old.a !== l.a;
    const oraw = flip ? [...old.r.raw].reverse() : old.r.raw;
    if (oraw.length !== l.r.raw.length) return mv < 0.5 ? (flip ? reverse(old.r, old.startDir) : old.r) : l.r;
    return build(
      l.r.raw.map((p, i) => ({ x: lerp(oraw[i].x, p.x, ms), y: lerp(oraw[i].y, p.y, ms) })),
      l.r.tail,
    );
  };

  // ───── tráfego ─────
  const lineOf = (a: string, b: string) => lines.find((l) => l.key === [a, b].sort().join('~'));
  const pathOf = (a: string, b: string): Route | undefined => {
    const l = lineOf(a, b);
    if (!l) return undefined;
    return l.a === a ? l.r : reverse(l.r, l.startDir);
  };
  const cycle = flows.length * FLOW_MS + HOLD_MS;
  const settled = reduce || t >= plan.end;
  const tt = settled ? traf.current : -1;
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
      // o rótulo vai num trecho da ligação onde não cobre objeto, texto nem outra ligação
      const half = (active[3].length * 7.3 + 22) * 0.5 * k;
      const score = (cx: number, cy: number) => {
        const bx: Box = { x0: cx - half, x1: cx + half, y0: cy - 10 * k, y1: cy + 13 * k };
        let pen = 0;
        for (let x = bx.x0; x <= bx.x1; x += 8)
          for (let y = bx.y0; y <= bx.y1; y += 6) {
            const pt = { x, y };
            for (const id of visible) {
              const e = ents[id];
              if (e && e.kind !== 'zone' && inside(e, pt, k, 4)) pen += 3;
            }
            for (const l of lines) if (l.r !== path && l.r.pts.some((q, j) => j > 0 && segDist(pt, l.r.pts[j - 1], q) < 3)) pen += 1;
          }
        return pen;
      };
      let best = { x: path.mid.x, y: path.mid.y + 24 * k, pen: Infinity };
      for (const tq of [0.5, 0.4, 0.6, 0.3, 0.7, 0.22, 0.78])
        for (const off of [0, 24 * k, -24 * k, 46 * k, -46 * k, 68 * k, -68 * k]) {
          const q = at(path, path.len * tq);
          const sc = score(q.x, q.y + off) + Math.abs(tq - 0.5) * 2 + (Math.abs(off) / (24 * k)) * 0.5;
          if (sc < best.pen) best = { x: q.x, y: q.y + off, pen: sc };
        }
      label = { x: best.x, y: best.y, text: active[3], kind };
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
  if (pkt) lastPkt.current = pkt;
  else if (settled) lastPkt.current = undefined;
  const oldPkt = plan.pkt && t < PKT_OUT_MS ? plan.pkt : undefined;

  const shownIds = Object.keys(poses)
    .filter((id) => poses[id].e.kind !== 'zone')
    .sort((p, q) => poses[p].e.y - poses[q].e.y);
  const zoneIds = Object.keys(poses).filter((id) => poses[id].e.kind === 'zone');
  const showSpot = !reduce && settled && t < plan.end + SPOT_MS + 100;

  const renderEnt = (id: string, e: Ent, op: number, dy: number, text: number, tag: number, pill: string | undefined, isIdle: boolean, keyx = '') => {
    const d = dims(e);
    const sc = e.scale ?? 1;
    const flat = e.kind === 'queue';
    const tl = textLayout(e, k);
    return (
      <g key={id + keyx} transform={`translate(${f(e.x)} ${f(e.y + dy)})`} opacity={f(op)}>
        <g className={`ent ${isIdle ? 'ent--idle' : ''} ${e.down ? 'ent--down' : ''}`}>
          <g transform={sc !== 1 ? `scale(${f(sc)})` : undefined}>
            <Body e={e} id={id} />
          </g>
          {!flat && (
            <g opacity={f(text)}>
              <Pill x={tl.lx} y={tl.ly} text={e.label} k={k} icon={e.kind === 'crowd' ? 'users' : undefined} />
              {e.sub && (
                <text className="ent__sub" x={tl.lx} y={tl.sy} textAnchor="middle" style={{ fontSize: 10.5 * k }}>
                  {e.sub}
                </text>
              )}
            </g>
          )}
          {e.gauge && <Gauge y={tl.gy} v={e.gauge[0]} level={e.gauge[1]} k={k} />}
          <g opacity={f(tag)}>
            {e.note && <Pill x={d.a + 16 + (e.note.length * 7.3 + 38) * 0.5 * k} y={-d.h * 0.6} text={e.note} tone="warn" icon="warn" k={k} />}
            {pill && <Pill x={0} y={pillY(e, k)} text={pill} tone="note" k={k} />}
            {e.down && <Pill x={0} y={pillY(e, k) - (pill ? 28 * k : 0)} text="FORA DO AR" tone="down" icon="warn" k={k} />}
          </g>
        </g>
      </g>
    );
  };

  return (
    <svg
      ref={svgRef}
      className={`stage-svg ${paused ? 'is-paused' : ''} ${view ? 'is-zoomed' : ''}`}
      viewBox={`${f(cam.x)} ${f(cam.y)} ${f(cam.w)} ${f(cam.h)}`}
      preserveAspectRatio="xMidYMid meet"
      role="img"
      aria-label={`Diagrama animado: ${lesson.title}`}
    >
      <defs>
        <pattern id="iso" width="28" height="14" y="-7" patternUnits="userSpaceOnUse">
          <path d="M0 7 L14 0 L28 7 L14 14 Z" fill="none" className="stage-grid" />
        </pattern>
        {/* como a referência: elipse centrada no quadro, raio 0,56 da largura e achatada a 0,6 na vertical,
            então num palco largo a grade só some nas laterais */}
        <radialGradient
          id="fade"
          gradientUnits="userSpaceOnUse"
          cx={f(cam.x + cam.w / 2)}
          cy={f(cam.y + cam.h / 2)}
          r={f(cam.w * 0.56)}
          gradientTransform={`translate(${f(cam.x + cam.w / 2)} ${f(cam.y + cam.h / 2)}) scale(1 0.6) translate(${f(-(cam.x + cam.w / 2))} ${f(-(cam.y + cam.h / 2))})`}
        >
          <stop offset="0" stopColor="#fff" />
          <stop offset=".42" stopColor="#fff" stopOpacity=".92" />
          <stop offset=".78" stopColor="#fff" stopOpacity=".35" />
          <stop offset="1" stopColor="#fff" stopOpacity="0" />
        </radialGradient>
        <mask id="fade-mask">
          <rect x={f(cam.x)} y={f(cam.y)} width={f(cam.w)} height={f(cam.h)} fill="url(#fade)" />
        </mask>
        <filter id="soft" x="-30%" y="-30%" width="160%" height="160%">
          <feGaussianBlur stdDeviation="6" />
        </filter>
      </defs>

      <rect x={f(cam.x)} y={f(cam.y)} width={f(cam.w)} height={f(cam.h)} fill="url(#iso)" mask="url(#fade-mask)" />

      {/* áreas no chão ficam por baixo de tudo */}
      <g>
        {leaving.filter((x) => x.e.kind === 'zone').map((x) => renderEnt(x.id, x.e, 1 - ex, 22 * ex, 1, 1, undefined, false, '-out'))}
        {zoneIds.map((id) => {
          const p = poses[id];
          return renderEnt(id, p.e, p.op, p.dy, p.text, p.tag, undefined, p.idle);
        })}
      </g>

      {/* losango de destaque, no fim da troca */}
      <g>
        {settled &&
          hot
            .filter((id) => ents[id] && visible.includes(id))
            .map((id) => {
              const e = ents[id];
              const { a, b } = dims(e);
              return (
                <path
                  key={id + runKey}
                  className="pad"
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
        {plan.exitLines.map((l) => {
          const op = 1 - inOut(clamp(t / LINK_OUT_MS));
          if (op <= 0) return null;
          return <path key={l.key + '-out'} className={`link link--${l.style}`} d={l.r.d} opacity={f(op)} />;
        })}
        {lines.map((l) => {
          const on = !!active && [active[0], active[1]].sort().join('~') === l.key;
          const delay = plan.linkAt.get(l.key);
          const draw = delay === undefined ? 1 : inOut(clamp((t - delay) / DRAW_MS));
          if (draw <= 0) return null;
          const r = routeNow(l);
          const solid = l.style === 'solid';
          const head = draw > 0.97 ? 1 : 0;
          const st: CSSProperties = solid && draw < 1 ? { strokeDasharray: '1 1', strokeDashoffset: f(1 - draw) } : { opacity: solid ? 1 : f(clamp(draw * 1.4)) };
          return (
            <g key={l.key}>
              <path className={`link link--${l.style} ${on ? 'is-on' : ''}`} d={r.d} pathLength={solid && draw < 1 ? 1 : undefined} style={st} />
              {l.arrow && solid && <Arrow p={r.end} dir={r.endDir} op={head} />}
              {l.both && solid && <Arrow p={r.start} dir={l.startDir} op={head} />}
            </g>
          );
        })}
      </g>

      {/* pulso na base, no fim da troca, sob tudo o que entrou ou mudou */}
      <g>
        {showSpot &&
          plan.spot
            .filter((id) => ents[id] && visible.includes(id))
            .map((id) => {
              const e = ents[id];
              const { a, b } = dims(e);
              const g = 1.3;
              return (
                <path
                  key={id + runKey}
                  className="spot"
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
        {leaving.filter((x) => x.e.kind !== 'zone').map((x) => renderEnt(x.id, x.e, 1 - ex, 22 * ex, 1, 1, prev?.pills[x.id], false, '-out'))}
        {shownIds.map((id) => {
          const p = poses[id];
          return renderEnt(id, p.e, p.op, p.dy, p.text, p.tag, p.pill, p.idle);
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
      {oldPkt && (
        <g opacity={f(1 - t / PKT_OUT_MS)}>
          <Packet {...oldPkt} />
        </g>
      )}
      {pkt && <Packet {...pkt} />}
    </svg>
  );
}
