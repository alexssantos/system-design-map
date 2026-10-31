import { aiGroups, aiStages } from './groups';
import { aiTopics } from './topics';
import type { AiGroup, AiStage, AiTopic } from './types';

export const aiGroupById = new Map<string, AiGroup>(aiGroups.map((g) => [g.id, g]));
export const aiStageByN = new Map<number, AiStage>(aiStages.map((s) => [s.n, s]));
export const aiTopicById = new Map<string, AiTopic>(aiTopics.map((t) => [t.id, t]));

/** Posição na trilha de estudo (1 = primeiro a aprender). */
export const orderOf = new Map<string, number>(aiTopics.map((t, i) => [t.id, i + 1]));

/** Quem depende diretamente de cada tópico (o que ele destrava). */
export const unlocksOf = new Map<string, string[]>(aiTopics.map((t) => [t.id, []]));
for (const t of aiTopics) for (const p of t.prereqs) unlocksOf.get(p)?.push(t.id);

/** Relações sem ordem, simétricas. */
export const aiRelatedOf = new Map<string, Set<string>>(aiTopics.map((t) => [t.id, new Set<string>()]));
for (const t of aiTopics) {
  for (const r of t.related ?? []) {
    aiRelatedOf.get(t.id)?.add(r);
    aiRelatedOf.get(r)?.add(t.id);
  }
}

const byOrder = (a: string, b: string) => orderOf.get(a)! - orderOf.get(b)!;

/** Todos os pré-requisitos, diretos e indiretos, na ordem em que devem ser estudados. */
export function prereqPath(id: string): string[] {
  const seen = new Set<string>();
  const stack = [...(aiTopicById.get(id)?.prereqs ?? [])];
  while (stack.length) {
    const p = stack.pop()!;
    if (seen.has(p)) continue;
    seen.add(p);
    stack.push(...(aiTopicById.get(p)?.prereqs ?? []));
  }
  return [...seen].sort(byOrder);
}

export interface AiEdge {
  id: string;
  source: string;
  target: string;
  /** prereq: source deve ser aprendido antes de target. related: ligação sem ordem. */
  kind: 'prereq' | 'related';
}

export const aiEdges: AiEdge[] = [];
{
  const seen = new Set<string>();
  for (const t of aiTopics) {
    for (const p of t.prereqs) aiEdges.push({ id: `pre:${p}>${t.id}`, source: p, target: t.id, kind: 'prereq' });
    for (const r of t.related ?? []) {
      const key = [t.id, r].sort(byOrder).join('~');
      if (seen.has(key)) continue;
      seen.add(key);
      const [a, b] = [t.id, r].sort(byOrder);
      aiEdges.push({ id: `rel:${key}`, source: a, target: b, kind: 'related' });
    }
  }
}

/**
 * O que acender quando um tópico está em foco: a trilha inteira até ele (pré-requisitos diretos e indiretos)
 * e o que ele destrava logo em seguida.
 */
export function focusSets(id: string) {
  const path = new Set(prereqPath(id));
  const next = new Set(unlocksOf.get(id) ?? []);
  const related = aiRelatedOf.get(id) ?? new Set<string>();
  const inPath = new Set([id, ...path]);
  const edgeIds = new Set(
    aiEdges
      .filter((e) =>
        e.kind === 'prereq'
          ? (inPath.has(e.source) && inPath.has(e.target)) || (e.source === id && next.has(e.target))
          : e.source === id || e.target === id,
      )
      .map((e) => e.id),
  );
  return { path, next, related, edgeIds };
}

export { aiGroups, aiStages, aiTopics };
