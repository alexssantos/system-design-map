import { describe, expect, it } from 'vitest';
import { diagramByCase } from '../diagrams/data';
import { episodes, firstTurnWith, spoken, turnAt } from '.';

describe('episódios do podcast', () => {
  for (const ep of episodes) {
    describe(ep.script.caseId, () => {
      const d = diagramByCase.get(ep.script.caseId);

      it('o caso tem diagrama', () => {
        expect(d).toBeDefined();
      });

      it('todo foco aponta para um componente ou nota do diagrama', () => {
        const ids = new Set([...d!.components.map((c) => c.id), ...d!.notes.map((_, i) => `note-${i}`)]);
        for (const t of ep.turns) for (const id of t.focus) expect(ids.has(id), id).toBe(true);
      });

      it('cada componente aparece em destaque em alguma fala', () => {
        for (const c of d!.components) expect(firstTurnWith(ep, c.id), c.id).toBeGreaterThanOrEqual(0);
      });

      it('os tempos cobrem todas as falas, em ordem', () => {
        expect(ep.timing.turns.length).toBe(ep.turns.length);
        ep.turns.forEach((t, i) => {
          expect(t.end).toBeGreaterThan(t.start);
          if (i > 0) expect(t.start).toBeGreaterThanOrEqual(ep.turns[i - 1].end);
        });
        expect(ep.turns.at(-1)!.end).toBeCloseTo(ep.timing.duration, 1);
      });

      it('as duas vozes participam', () => {
        expect(new Set(ep.turns.map((t) => t.host)).size).toBe(2);
      });

      it('acha a fala certa pelo tempo', () => {
        expect(turnAt(ep, 0)).toBe(0);
        const t = ep.turns[10];
        expect(turnAt(ep, (t.start + t.end) / 2)).toBe(10);
        expect(turnAt(ep, t.end + 0.1)).toBe(10); // na pausa, vale a fala anterior
      });
    });
  }

  it('tira as tags de direção da transcrição', () => {
    expect(spoken('[warmly] Olá. [short pause] Tudo bem?')).toBe('Olá. Tudo bem?');
  });
});
