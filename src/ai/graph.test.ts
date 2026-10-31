import { describe, expect, it } from 'vitest';
import { aiGroupById, aiGroups, aiStageByN, aiStages, aiTopicById, aiTopics, orderOf, prereqPath } from './graph';
import { groups, topics, cases } from '../data/graph';

describe('dados do mapa de Engenharia de AI', () => {
  it('ids são únicos, inclusive em relação ao mapa de System Design', () => {
    const ids = [
      ...aiTopics.map((t) => t.id),
      ...aiGroups.map((g) => g.id),
      ...topics.map((t) => t.id),
      ...groups.map((g) => g.id),
      ...cases.map((c) => c.id),
    ];
    expect(new Set(ids).size).toBe(ids.length);
  });

  it('todo tópico aponta para uma área e uma etapa existentes', () => {
    for (const t of aiTopics) {
      expect(aiGroupById.has(t.group), `${t.id} → ${t.group}`).toBe(true);
      expect(aiStageByN.has(t.stage), `${t.id} → etapa ${t.stage}`).toBe(true);
    }
  });

  it('etapas são numeradas de 1 em diante, sem buracos, e todas têm tópicos', () => {
    expect(aiStages.map((s) => s.n)).toEqual(aiStages.map((_, i) => i + 1));
    for (const s of aiStages) expect(aiTopics.some((t) => t.stage === s.n), `etapa ${s.n}`).toBe(true);
  });

  it('a lista está na ordem das etapas', () => {
    const stages = aiTopics.map((t) => t.stage);
    expect(stages).toEqual([...stages].sort((a, b) => a - b));
  });

  it('pré-requisitos existem e vêm antes na trilha (sem ciclos)', () => {
    for (const t of aiTopics) {
      for (const p of t.prereqs) {
        expect(aiTopicById.has(p), `${t.id} → ${p}`).toBe(true);
        expect(orderOf.get(p)!, `${p} deveria vir antes de ${t.id}`).toBeLessThan(orderOf.get(t.id)!);
        expect(aiTopicById.get(p)!.stage, `${p} está numa etapa depois de ${t.id}`).toBeLessThanOrEqual(t.stage);
      }
    }
  });

  it('pré-requisitos diretos não repetem um que já vem por outro caminho', () => {
    for (const t of aiTopics) {
      for (const p of t.prereqs) {
        const viaOthers = t.prereqs.filter((o) => o !== p).flatMap((o) => [o, ...prereqPath(o)]);
        expect(viaOthers, `${t.id}: ${p} já vem por outro pré-requisito`).not.toContain(p);
      }
    }
  });

  it('relações apontam para tópicos existentes e não repetem pré-requisitos', () => {
    for (const t of aiTopics) {
      for (const r of t.related ?? []) {
        expect(aiTopicById.has(r), `${t.id} → ${r}`).toBe(true);
        expect(r).not.toBe(t.id);
        expect(t.prereqs, `${t.id} ~ ${r}`).not.toContain(r);
        expect(aiTopicById.get(r)!.prereqs, `${r} ~ ${t.id}`).not.toContain(t.id);
      }
    }
  });

  it('todos os 68 termos da lista estão no mapa', () => {
    expect(aiTopics).toHaveLength(68);
  });
});
