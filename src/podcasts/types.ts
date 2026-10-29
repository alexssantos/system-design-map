/** Apresentadores do podcast. Cada um tem uma voz própria na ElevenLabs. */
export type HostId = 'ju' | 'jerri';

export interface Host {
  id: HostId;
  name: string;
  role: string;
  /** Voz da ElevenLabs usada na geração (nome da biblioteca de vozes). */
  voice: string;
}

/** Uma fala. O texto pode ter tags de direção da ElevenLabs entre colchetes, ex.: [laughs]; elas não aparecem na transcrição. */
export interface Turn {
  host: HostId;
  text: string;
  /** Componentes (ou notas, `note-<i>`) em destaque durante a fala; se faltar, vale o foco do capítulo. */
  focus?: string[];
}

export interface Chapter {
  id: string;
  title: string;
  /** Componentes do diagrama em destaque no capítulo; vazio = diagrama inteiro. */
  focus: string[];
  turns: Turn[];
}

export interface PodcastScript {
  caseId: string;
  title: string;
  chapters: Chapter[];
}

/** Gerado por scripts/podcast/build.mjs a partir dos áudios de cada fala. */
export interface PodcastTiming {
  audio: string;
  duration: number;
  /** Volume 0–1 por barra da forma de onda. */
  levels: number[];
  /** Início e fim (s) de cada fala, na ordem do roteiro. */
  turns: { start: number; end: number }[];
}
