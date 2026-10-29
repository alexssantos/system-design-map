import { cases } from './cases';
import { groups } from './groups';
import { topics } from './topics';
import type { Group, StudyCase, Topic } from './types';

export type Item = ({ type: 'topic' } & Topic) | ({ type: 'case' } & StudyCase);

export const groupById = new Map<string, Group>(groups.map((g) => [g.id, g]));
export const topicById = new Map<string, Topic>(topics.map((t) => [t.id, t]));
export const caseById = new Map<string, StudyCase>(cases.map((c) => [c.id, c]));

export function getItem(id: string): Item | undefined {
  const t = topicById.get(id);
  if (t) return { type: 'topic', ...t };
  const c = caseById.get(id);
  if (c) return { type: 'case', ...c };
  return undefined;
}

/** Tópicos aplicados em cada caso, com o motivo. */
export const topicsByCase = new Map<string, { topic: Topic; why: string }[]>(
  cases.map((c) => [c.id, [] as { topic: Topic; why: string }[]]),
);
for (const t of topics) {
  for (const a of t.appliedIn) topicsByCase.get(a.case)?.push({ topic: t, why: a.why });
}

/** Relações entre tópicos são simétricas no mapa, mesmo se declaradas de um lado só. */
export const relatedOf = new Map<string, Set<string>>(topics.map((t) => [t.id, new Set<string>()]));
for (const t of topics) {
  for (const r of t.related) {
    relatedOf.get(t.id)?.add(r);
    relatedOf.get(r)?.add(t.id);
  }
}

/** Vizinhos diretos de um nó: tópicos relacionados e casos (ou tópicos, se for um caso). */
export function neighborsOf(id: string): Set<string> {
  const out = new Set<string>();
  const t = topicById.get(id);
  if (t) {
    relatedOf.get(id)?.forEach((r) => out.add(r));
    t.appliedIn.forEach((a) => out.add(a.case));
  } else {
    topicsByCase.get(id)?.forEach(({ topic }) => out.add(topic.id));
  }
  return out;
}

export interface GraphEdge {
  id: string;
  source: string;
  target: string;
  kind: 'related' | 'applied';
}

export const edges: GraphEdge[] = [];
{
  const seen = new Set<string>();
  for (const t of topics) {
    for (const r of t.related) {
      const key = [t.id, r].sort().join('~');
      if (seen.has(key)) continue;
      seen.add(key);
      edges.push({ id: `rel:${key}`, source: t.id, target: r, kind: 'related' });
    }
    for (const a of t.appliedIn) {
      edges.push({ id: `app:${t.id}~${a.case}`, source: t.id, target: a.case, kind: 'applied' });
    }
  }
}

export { cases, groups, topics };
