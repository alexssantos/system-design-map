import { describe, expect, it } from 'vitest';
import { caseById, cases, groupById, groups, topicById, topics, topicsByCase } from './graph';

describe('dados do mapa', () => {
  it('ids são únicos entre tópicos, casos e grupos', () => {
    const ids = [...topics.map((t) => t.id), ...cases.map((c) => c.id), ...groups.map((g) => g.id)];
    expect(new Set(ids).size).toBe(ids.length);
  });

  it('todo tópico aponta para um grupo existente', () => {
    for (const t of topics) expect(groupById.has(t.group), `${t.id} → ${t.group}`).toBe(true);
  });

  it('relações apontam para tópicos existentes e não para si mesmos', () => {
    for (const t of topics) {
      for (const r of t.related) {
        expect(topicById.has(r), `${t.id} → ${r}`).toBe(true);
        expect(r).not.toBe(t.id);
      }
    }
  });

  it('aplicações apontam para casos existentes', () => {
    for (const t of topics) {
      for (const a of t.appliedIn) expect(caseById.has(a.case), `${t.id} → ${a.case}`).toBe(true);
    }
  });

  it('padrões explicam o ganho real', () => {
    for (const t of topics.filter((x) => x.kind === 'pattern')) expect(t.gain, t.id).toBeTruthy();
  });

  it('todo caso usa pelo menos 4 tópicos', () => {
    for (const c of cases) expect(topicsByCase.get(c.id)!.length, c.id).toBeGreaterThanOrEqual(4);
  });

  it('casos seguem a numeração do board (1 a 15)', () => {
    expect(cases.map((c) => c.number)).toEqual(Array.from({ length: 15 }, (_, i) => i + 1));
  });
});
