import { describe, expect, it } from 'vitest';
import { cases } from '../data/cases';
import { diagramByCase, diagramFor, diagrams, diagramVersions, versionOf } from './data';

describe('diagramas dos casos', () => {
  it('todo caso tem diagrama e nenhum diagrama fica sem caso', () => {
    const ids = new Set(cases.map((c) => c.id));
    for (const c of cases) expect(diagramByCase.has(c.id), c.id).toBe(true);
    for (const d of diagrams) expect(ids.has(d.caseId), d.caseId).toBe(true);
  });

  it('versões de um caso são únicas e a padrão é a mais nova', () => {
    for (const [id, list] of diagramVersions) {
      const vs = list.map(versionOf);
      expect(new Set(vs).size, id).toBe(vs.length);
      expect(versionOf(diagramByCase.get(id)!), id).toBe(Math.max(...vs));
    }
  });

  it('a partir da v2, toda versão diz o que mudou', () => {
    for (const d of diagrams) if (versionOf(d) > 1) expect(d.changes?.length, d.caseId).toBeGreaterThan(0);
  });

  it('o encurtador tem v2 padrão e a v1 continua acessível', () => {
    expect(versionOf(diagramByCase.get('url-shortener')!)).toBe(2);
    expect(versionOf(diagramFor('url-shortener', 1)!)).toBe(1);
    expect(diagramFor('url-shortener', 9)).toBe(diagramByCase.get('url-shortener'));
  });

  for (const d of diagrams) {
    describe(`${d.caseId} v${versionOf(d)}`, () => {
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

      it('com filtro de caminho, leitura e escrita têm fluxos', () => {
        const paths = new Set(d.flows.map((f) => f.path).filter(Boolean));
        if (paths.size === 0) return;
        for (const p of ['read', 'write'] as const) expect(d.flows.some((f) => f.path === p || f.path === 'both'), p).toBe(true);
      });
    });
  }
});
