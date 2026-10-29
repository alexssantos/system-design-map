import type { Chapter, Host, HostId, PodcastScript, PodcastTiming, Turn } from './types';
import { urlShortenerScript } from './url-shortener';
import urlShortenerTiming from './url-shortener.timing.json';
import { urlShortenerScriptV2 } from './url-shortener.v2';

export const hosts: Record<HostId, Host> = {
  ju: { id: 'ju', name: 'Juliana', role: 'pergunta como quem vai ser entrevistada', voice: 'Juliana - Bright and Encouraging' },
  jerri: { id: 'jerri', name: 'Jerri', role: 'explica cada peça e o porquê dela', voice: 'Jerri - Warm, Conversational, Friendly' },
};

export interface Episode {
  script: PodcastScript;
  /** Sem tempos = o áudio ainda não foi gravado; o roteiro aparece sem player. */
  timing?: PodcastTiming;
  /** Falas em ordem, com o capítulo e o foco já resolvidos; start/end ficam em 0 sem áudio. */
  turns: (Turn & { chapter: number; focus: string[]; start: number; end: number })[];
  /** Primeira fala de cada capítulo. */
  chapterFirst: number[];
  /** Início (s) de cada capítulo; vazio sem áudio. */
  chapterStart: number[];
}

function episode(script: PodcastScript, timing?: PodcastTiming): Episode {
  const turns: Episode['turns'] = [];
  const chapterFirst: number[] = [];
  script.chapters.forEach((ch: Chapter, ci) => {
    ch.turns.forEach((t) => {
      const tm = timing?.turns[turns.length];
      if (t === ch.turns[0]) chapterFirst.push(turns.length);
      turns.push({ ...t, chapter: ci, focus: t.focus ?? ch.focus, start: tm?.start ?? 0, end: tm?.end ?? 0 });
    });
  });
  const chapterStart = timing ? chapterFirst.map((i) => turns[i].start) : [];
  return { script, timing, turns, chapterFirst, chapterStart };
}

export const episodes = [episode(urlShortenerScript, urlShortenerTiming), episode(urlShortenerScriptV2)];

const versionOf = (e: Episode) => e.script.version ?? 1;

/** Episódio do caso para uma versão do diagrama, se o roteiro existir. */
export const episodeFor = (caseId: string, version: number) =>
  episodes.find((e) => e.script.caseId === caseId && versionOf(e) === version);

/** Versões do caso que já têm áudio gravado. */
export const audioVersions = (caseId: string) =>
  episodes.filter((e) => e.script.caseId === caseId && e.timing).map(versionOf);

/**
 * Num roteiro que monta o diagrama aos poucos, o que já apareceu até a fala i.
 * Uma fala sem foco próprio (diagrama inteiro) mostra tudo; aí o retorno é null.
 */
export function revealedAt(e: Episode, i: number): Set<string> | null {
  if (!e.script.reveal || e.turns[i].focus.length === 0) return null;
  return new Set(e.turns.slice(0, i + 1).flatMap((t) => t.focus));
}

/** Tira as tags de direção da ElevenLabs ([warmly], [short pause]...) para a transcrição. */
export const spoken = (text: string) => text.replace(/\s*\[[^\]]+\]\s*/g, ' ').trim();

/** Índice da fala em andamento no instante t (numa pausa, vale a fala anterior). Só para episódios com áudio. */
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
