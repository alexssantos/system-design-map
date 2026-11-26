export type Color = 'yellow' | 'blue' | 'green' | 'violet' | 'rust' | 'sand' | 'teal' | 'pink' | 'ink';
/** block: serviço · plate: pessoa/origem · cyl: armazenamento · crowd: muitos usuários · zone: área no chão · queue: fila com itens */
export type EntKind = 'block' | 'plate' | 'cyl' | 'crowd' | 'zone' | 'queue';
export type PktKind = 'req' | 'res' | 'data' | 'err' | 'tok';
export type Level = 'good' | 'warn' | 'bad';

export interface Ent {
  x: number;
  y: number;
  kind?: EntKind;
  color: Color;
  icon: string;
  label: string;
  sub?: string;
  /** escala do corpo (1 = normal); muda com transição entre passos */
  scale?: number;
  /** contorno tracejado: algo que ainda não existe ou foi desligado */
  ghost?: boolean;
  /** medidor acima do objeto: [0..1, nível] */
  gauge?: [number, Level?];
  /** etiqueta de aviso ao lado do objeto */
  note?: string;
  /** zone/queue: comprimento e largura no chão (px, ao longo dos eixos da malha) */
  w?: number;
  d?: number;
  /** crowd: quantas pessoas; queue: quantos itens na fila */
  count?: number;
}

/** [de, para, tipo, rótulo opcional] */
export type Flow = [string, string, PktKind?, string?];
/** [de, para, estilo] para ligações estáticas, sem pacote */
export type StaticLink = [string, string, ('solid' | 'dashed' | 'off' | 'cut')?];

export interface BoardItem {
  t: string;
  /** 0..1 desenha uma barra */
  v?: number;
  tone?: 'good' | 'warn' | 'bad' | 'hl' | 'mute';
}

export interface Step {
  /** rótulo curto na linha do tempo */
  nav: string;
  chapter: 'problema' | 'tecnica' | 'ideia' | 'cuidado' | 'pratica' | 'entrevista' | 'resumo';
  title: string;
  body: string[];
  callout?: { kind: 'insight' | 'tip' | 'warn'; title: string; text: string };
  add?: string[];
  rm?: string[];
  hot?: string[];
  flow?: Flow[];
  links?: StaticLink[];
  pills?: Record<string, string>;
  /** muda propriedades de entidades a partir deste passo (posição, cor, escala, medidor…), com transição */
  set?: Record<string, Partial<Ent>>;
  hud?: Record<string, string | [string, Level]>;
  board?: { title: string; items: BoardItem[] };
  changes?: string[];
  /** quantos itens de "você vai aprender" ficam marcados ao chegar aqui */
  learn?: number;
}

export interface Lesson {
  id: string;
  title: string;
  subtitle: string;
  minutes: number;
  level: 'Iniciante' | 'Intermediário' | 'Avançado';
  learn: string[];
  hud: { id: string; label: string; icon: string }[];
  ents: Record<string, Ent>;
  steps: Step[];
}

export interface Module {
  id: string;
  title: string;
  color: string;
  lessons: (Lesson | { soon: string })[];
}
