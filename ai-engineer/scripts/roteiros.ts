/**
 * Gera docs/ROTEIROS.md: o roteiro visual de cada lição, passo a passo, a partir dos dados.
 * Serve para revisar a história que o diagrama conta sem abrir o site, e fica sempre em dia
 * com as lições. Rode com: npm run roteiros
 */
import { writeFileSync, mkdirSync } from 'node:fs';
import { modules } from '../src/course';
import { inherited, visibleAt } from '../src/wiring';

const out: string[] = [
  '# Roteiros visuais das lições',
  '',
  'Gerado por `npm run roteiros` a partir de `src/lessons`. Não edite à mão.',
  '',
  'Ordem de cada passo no palco: os objetos novos entram um por vez, as setas novas são desenhadas, um pulso abre na base e só então o tráfego começa. Todo objeto na tela está ligado a alguma seta, salvo quando está desligado (tracejado) ou fora de uso (esmaecido). Os nomes ficam em cima dos objetos.',
  '',
];
const label = (l: { ents: Record<string, { label: string }> }, id: string) => l.ents[id]?.label ?? id;

for (const m of modules) {
  for (const l of m.lessons) {
    if (!('id' in l)) continue;
    out.push(`## ${m.title} · ${l.title}`, '', `_${l.subtitle}_`, '');
    let prev: string[] = [];
    l.steps.forEach((s, i) => {
      const { vis } = visibleAt(l, i);
      const enter = vis.filter((id) => !prev.includes(id));
      const leave = prev.filter((id) => !vis.includes(id));
      prev = vis;
      out.push(`### ${i + 1}. ${s.nav}: ${s.title}`, '');
      if (enter.length) out.push(`- **Entram:** ${enter.map((id) => label(l, id)).join(', ')}`);
      if (leave.length) out.push(`- **Saem:** ${leave.map((id) => label(l, id)).join(', ')}`);
      for (const [id, v] of Object.entries(s.set ?? {})) {
        const what = Object.entries(v).map(([k, val]) => `${k} = ${JSON.stringify(val)}`).join(', ');
        out.push(`- **Muda:** ${label(l, id)} (${what})`);
      }
      if (s.flow?.length) out.push(`- **Tráfego:** ${s.flow.map((f) => `${label(l, f[0])} → ${label(l, f[1])}${f[3] ? ` "${f[3]}"` : ''}`).join(' · ')}`);
      if (s.links?.length) out.push(`- **Ligações:** ${s.links.map((x) => `${label(l, x[0])} — ${label(l, x[1])} (${x[2] ?? 'sólida'})`).join(' · ')}`);
      const inh = inherited(l, i);
      if (inh.length) out.push(`- **Continuam tracejadas:** ${inh.map((x) => `${label(l, x[0])} — ${label(l, x[1])}`).join(' · ')}`);
      if (s.idle?.length) out.push(`- **Fora de uso:** ${s.idle.map((id) => label(l, id)).join(', ')}`);
      if (s.pills) out.push(`- **Notas:** ${Object.entries(s.pills).map(([id, t]) => `${label(l, id)}: "${t}"`).join(' · ')}`);
      out.push('');
    });
  }
}
mkdirSync('docs', { recursive: true });
writeFileSync('docs/ROTEIROS.md', out.join('\n'));
console.log('docs/ROTEIROS.md:', out.length, 'linhas');
