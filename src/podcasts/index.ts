import type { Chapter, Host, HostId, PodcastScript, PodcastTiming, Turn } from './types';
import { urlShortenerScript } from './url-shortener';
import urlShortenerTiming from './url-shortener.timing.json';

export const hosts: Record<HostId, Host> = {
  ju: { id: 'ju', name: 'Juliana', role: 'pergunta como quem vai ser entrevistada', voice: 'Juliana - Bright and Encouraging' },
  jerri: { id: 'jerri', name: 'Jerri', role: 'explica cada peça e o porquê dela', voice: 'Jerri - Warm, Conversational, Friendly' },
};

export interface Episode {
  script: PodcastScript;
  timing: PodcastTiming;
  /** Falas em ordem, com o capítulo e o foco já resolvidos. */
  turns: (Turn & { chapter: number; focus: string[]; start: number; end: number })[];
  /** Início (s) de cada capítulo. */
  chapterStart: number[];
}

function episode(script: PodcastScript, timing: PodcastTiming): Episode {
  const turns: Episode['turns'] = [];
  const chapterStart: number[] = [];
  script.chapters.forEach((ch: Chapter, ci) => {
    ch.turns.forEach((t) => {
      const tm = timing.turns[turns.length];
      if (t === ch.turns[0]) chapterStart.push(tm.start);
      turns.push({ ...t, chapter: ci, focus: t.focus ?? ch.focus, start: tm.start, end: tm.end });
    });
  });
  return { script, timing, turns, chapterStart };
}

export const episodes = [episode(urlShortenerScript, urlShortenerTiming)];
export const episodeByCase = new Map(episodes.map((e) => [e.script.caseId, e]));

/** Tira as tags de direção da ElevenLabs ([warmly], [short pause]...) para a transcrição. */
export const spoken = (text: string) => text.replace(/\s*\[[^\]]+\]\s*/g, ' ').trim();

/** Índice da fala em andamento no instante t (numa pausa, vale a fala anterior). */
export function turnAt(e: Episode, t: number) {
  let lo = 0;
  let hi = e.turns.length - 1;
  while (lo < hi) {
    const mid = (lo + hi + 1) >> 1;
    if (e.turns[mid].start <= t) lo = mid;
    else hi = mid - 1;
  }
  return lo;
}

/** Primeira fala em que o componente (ou nota) aparece em destaque. */
export function firstTurnWith(e: Episode, id: string) {
  return e.turns.findIndex((t) => t.focus.includes(id));
}
