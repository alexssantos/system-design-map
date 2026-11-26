/**
 * Verificador das lições. Roda antes do build (npm run check) e falha se alguma regra for quebrada.
 *
 * Regras:
 * 1. Tudo o que um passo cita (fluxos, ligações, destaques, notas) está visível naquele passo.
 * 2. Todo objeto visível num passo está ligado a pelo menos uma seta desse passo (fluxo ou ligação),
 *    a não ser que esteja desligado (ghost) ou marcado como fora de uso no passo (idle).
 *    Áreas no chão (zone) não precisam de seta.
 * 3. Chips do painel existem na lição; a contagem de "você vai aprender" não passa do total e chega ao fim.
 * 4. Cada passo tem título, rótulo curto (nav) e texto.
 */
import { lessons } from '../src/course';
import type { Ent } from '../src/types';
import { inherited, stillLoose } from '../src/wiring';

let bad = 0;
const fail = (lesson: string, step: number, msg: string) => {
  bad++;
  console.log(`✗ ${lesson} passo ${step}: ${msg}`);
};

for (const l of lessons) {
  const vis: string[] = [];
  const over: Record<string, Partial<Ent>> = {};
  l.steps.forEach((s, i) => {
    const n = i + 1;
    for (const x of s.rm ?? []) vis.splice(vis.indexOf(x) >>> 0, vis.includes(x) ? 1 : 0);
    for (const x of s.add ?? []) {
      if (!l.ents[x]) fail(l.id, n, `add de objeto desconhecido "${x}"`);
      if (!vis.includes(x)) vis.push(x);
    }
    for (const [k, v] of Object.entries(s.set ?? {})) over[k] = { ...over[k], ...v };
    const flows = s.flow ?? [];
    const links = s.links ?? [];
    const refs = [...flows.flatMap((f) => [f[0], f[1]]), ...links.flatMap((f) => [f[0], f[1]]), ...(s.hot ?? []), ...Object.keys(s.pills ?? {}), ...(s.idle ?? [])];
    for (const r of refs) if (!vis.includes(r)) fail(l.id, n, `"${r}" é citado mas não está visível`);
    for (const id of stillLoose(l, i)) fail(l.id, n, `"${id}" (${l.ents[id].label}) está solto: nenhuma seta neste nem em outro passo o liga a algo na tela`);
    if (process.argv.includes('--verbose')) for (const h of inherited(l, i)) console.log(`· ${l.id} passo ${n}: herda ${h[0]} ⇢ ${h[1]}`);
    for (const k of Object.keys(s.hud ?? {})) if (!l.hud.some((h) => h.id === k)) fail(l.id, n, `chip "${k}" não existe`);
    if ((s.learn ?? 0) > l.learn.length) fail(l.id, n, 'learn passa do total');
    if (!s.title || !s.nav || !s.body?.length) fail(l.id, n, 'falta título, nav ou texto');
  });
  const last = [...l.steps].reverse().find((s) => s.learn !== undefined)?.learn;
  if (last !== l.learn.length) fail(l.id, l.steps.length, `"você vai aprender" termina em ${last} de ${l.learn.length}`);
}

const steps = lessons.reduce((n, l) => n + l.steps.length, 0);
console.log(`${lessons.length} lições, ${steps} passos, ${bad} erro(s)`);
if (bad) process.exit(1);
