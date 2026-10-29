/** Tipos de componente: cada um tem um ícone animado próprio no diagrama. */
export type ComponentKind =
  | 'client'
  | 'mobile'
  | 'lb'
  | 'gateway'
  | 'service'
  | 'worker'
  | 'db'
  | 'replica'
  | 'cache'
  | 'queue'
  | 'stream'
  | 'storage'
  | 'cdn'
  | 'external'
  | 'coordinator'
  | 'websocket'
  | 'scheduler'
  | 'lock'
  | 'filter'
  | 'search'
  | 'geo'
  | 'ledger'
  | 'metrics';

/** sync = requisição/resposta, async = evento ou fila, replication = cópia de dados, read = leitura de cache. */
export type FlowKind = 'sync' | 'async' | 'replication' | 'read';

export type NoteKind = 'impl' | 'alert' | 'interview';

export interface DiagramComponent {
  id: string;
  kind: ComponentKind;
  label: string;
  /** Tecnologia ou detalhe curto, ex.: "Redis Sorted Set". */
  tech?: string;
  /** Posição em células da grade (coluna, linha); aceita frações. */
  at: [number, number];
  /** Quantidade de instâncias desenhadas empilhadas. */
  stack?: boolean;
}

export interface DiagramFlow {
  from: string;
  to: string;
  kind: FlowKind;
  label?: string;
  /** Desenha nos dois sentidos (ex.: WebSocket). */
  both?: boolean;
  /** Caminho a que o fluxo pertence, para o filtro leitura/escrita; sem caminho = fica fora dos dois. */
  path?: FlowPath;
}

/** read = redirect (clique), write = criação do link, both = usado pelos dois caminhos. */
export type FlowPath = 'read' | 'write' | 'both';

export interface DiagramNote {
  kind: NoteKind;
  title: string;
  text: string;
  at: [number, number];
  /** Componente ao qual a nota se refere (linha pontilhada). */
  target?: string;
}

export interface DiagramZone {
  label: string;
  /** Canto superior esquerdo e inferior direito, em células. */
  from: [number, number];
  to: [number, number];
}

export interface Diagram {
  caseId: string;
  /** Versão do desenho; sem número = 1. A maior versão de cada caso é a padrão. */
  version?: number;
  /** O que mudou em relação à versão anterior. */
  changes?: string[];
  /** Uma frase sobre a ideia central do desenho. */
  headline: string;
  components: DiagramComponent[];
  flows: DiagramFlow[];
  notes: DiagramNote[];
  zones?: DiagramZone[];
}
