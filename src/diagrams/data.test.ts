import { describe, expect, it } from 'vitest';
import { cases } from '../data/cases';
import { diagramByCase, diagrams } from './data';

describe('diagramas dos casos', () => {
  it('todo caso tem exatamente um diagrama', () => {
    expect(diagrams.length).toBe(cases.length);
    for (const c of cases) expect(diagramByCase.has(c.id), c.id).toBe(true);
  });

  for (const d of diagrams) {
    describe(d.caseId, () => {
      const ids = new Set(d.components.map((c) => c.id));

      it('ids de componentes são únicos', () => {
        expect(ids.size).toBe(d.components.length);
      });

      it('fluxos e notas apontam para componentes existentes', () => {
        for (const f of d.flows) {
          expect(ids.has(f.from), `${f.from} →`).toBe(true);
          expect(ids.has(f.to), `→ ${f.to}`).toBe(true);
        }
        for (const n of d.notes) if (n.target) expect(ids.has(n.target), n.target).toBe(true);
      });

      it('tem nota de implementação, alerta e dica de entrevista', () => {
        const kinds = new Set(d.notes.map((n) => n.kind));
        expect([...kinds].sort()).toEqual(['alert', 'impl', 'interview']);
      });

      it('todo componente participa de algum fluxo', () => {
        const used = new Set(d.flows.flatMap((f) => [f.from, f.to]));
        for (const c of d.components) expect(used.has(c.id), c.id).toBe(true);
      });
    });
  }
});
