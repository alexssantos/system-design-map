import type { Ent, Lesson, StaticLink } from './types';

/**
 * Regra do desenho: todo objeto visível está ligado a alguma seta, a não ser que esteja desligado
 * (ghost) ou fora de uso no passo (idle). Quando o passo não cita a ligação de um objeto, ela continua
 * como ligação tracejada (existe, mas não é o foco): vem do passo anterior mais próximo em que ele
 * estava ligado a alguém que ainda está na tela; se não houver, do próximo passo em que ele for ligado.
 */
export function visibleAt(lesson: Lesson, upto: number) {
  const vis: string[] = [];
  const over: Record<string, Partial<Ent>> = {};
  for (let i = 0; i <= upto; i++) {
    const s = lesson.steps[i];
    for (const id of s.rm ?? []) if (vis.includes(id)) vis.splice(vis.indexOf(id), 1);
    for (const id of s.add ?? []) if (!vis.includes(id)) vis.push(id);
    for (const [k, v] of Object.entries(s.set ?? {})) over[k] = { ...over[k], ...v };
  }
  return { vis, over };
}

const pairs = (lesson: Lesson, i: number): [string, string][] => {
  const s = lesson.steps[i];
  return [...(s.flow ?? []).map((f) => [f[0], f[1]] as [string, string]), ...(s.links ?? []).map((l) => [l[0], l[1]] as [string, string])];
};

/** ligações tracejadas que o passo herda para nenhum objeto ficar solto */
export function inherited(lesson: Lesson, idx: number): StaticLink[] {
  const step = lesson.steps[idx];
  const { vis, over } = visibleAt(lesson, idx);
  const wired = new Set(pairs(lesson, idx).flat());
  const out: StaticLink[] = [];
  const has = (a: string, b: string) => out.some((l) => (l[0] === a && l[1] === b) || (l[0] === b && l[1] === a));
  const loose = (id: string) => {
    const e = { ...lesson.ents[id], ...over[id] };
    return e.kind !== 'zone' && !e.ghost && !step.idle?.includes(id) && !wired.has(id);
  };
  for (const id of vis) {
    if (!loose(id)) continue;
    // anterior mais próximo, depois o próximo
    const order = [...Array.from({ length: idx }, (_, k) => idx - 1 - k), ...Array.from({ length: lesson.steps.length - idx - 1 }, (_, k) => idx + 1 + k)];
    for (const j of order) {
      const p = pairs(lesson, j).find(([a, b]) => (a === id && vis.includes(b)) || (b === id && vis.includes(a)));
      if (p) {
        if (!has(p[0], p[1])) out.push([p[0], p[1], 'dashed']);
        wired.add(p[0]);
        wired.add(p[1]);
        break;
      }
    }
  }
  return out;
}

/** objetos que continuam soltos mesmo com a herança (erro de lição) */
export function stillLoose(lesson: Lesson, idx: number): string[] {
  const step = lesson.steps[idx];
  const { vis, over } = visibleAt(lesson, idx);
  const wired = new Set([...pairs(lesson, idx).flat(), ...inherited(lesson, idx).flatMap((l) => [l[0], l[1]])]);
  return vis.filter((id) => {
    const e = { ...lesson.ents[id], ...over[id] };
    return e.kind !== 'zone' && !e.ghost && !step.idle?.includes(id) && !wired.has(id);
  });
}
