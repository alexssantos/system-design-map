import { describe, expect, it } from 'vitest';
import { diagramFor, versionOf } from '../diagrams/data';
import { audioVersions, episodeFor, episodes, firstTurnWith, revealedAt, spoken, turnAt } from '.';

describe('episódios do podcast', () => {
  for (const ep of episodes) {
    const version = ep.script.version ?? 1;
    describe(`${ep.script.caseId} v${version}`, () => {
      const d = diagramFor(ep.script.caseId, version);

      it('o caso tem diagrama nessa versão', () => {
        expect(d).toBeDefined();
        expect(versionOf(d!)).toBe(version);
      });

      it('todo foco aponta para um componente ou nota do diagrama', () => {
        const ids = new Set([...d!.components.map((c) => c.id), ...d!.notes.map((_, i) => `note-${i}`)]);
        for (const t of ep.turns) for (const id of t.focus) expect(ids.has(id), id).toBe(true);
      });

      it('cada componente aparece em destaque em alguma fala', () => {
        for (const c of d!.components) expect(firstTurnWith(ep, c.id), c.id).toBeGreaterThanOrEqual(0);
      });

      it('cada capítulo começa na fala certa', () => {
        ep.chapterFirst.forEach((i, c) => expect(ep.turns[i].chapter).toBe(c));
      });

      if (ep.script.reveal) {
        it('ao montar o diagrama, a primeira fala já mostra algo e o fim mostra tudo', () => {
          expect(revealedAt(ep, 0)?.size).toBeGreaterThan(0);
          expect(revealedAt(ep, ep.turns.length - 1)).toBeNull();
        });
      }

      if (!ep.timing) return;
      const timing = ep.timing;

      it('os tempos cobrem todas as falas, em ordem', () => {
        expect(timing.turns.length).toBe(ep.turns.length);
        ep.turns.forEach((t, i) => {
          expect(t.end).toBeGreaterThan(t.start);
          if (i > 0) expect(t.start).toBeGreaterThanOrEqual(ep.turns[i - 1].end);
        });
        expect(ep.turns.at(-1)!.end).toBeCloseTo(timing.duration, 1);
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

  it('o encurtador tem roteiro v2 sem áudio e áudio só na v1', () => {
    expect(episodeFor('url-shortener', 2)?.timing).toBeUndefined();
    expect(audioVersions('url-shortener')).toEqual([1]);
  });

  it('tira as tags de direção da transcrição', () => {
    expect(spoken('[warmly] Olá. [short pause] Tudo bem?')).toBe('Olá. Tudo bem?');
  });
});
