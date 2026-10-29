export type NodeKind = 'concept' | 'pattern' | 'case';

/** Primeiro nível em que o entrevistador espera domínio do tópico. */
export type Level = 'senior' | 'staff';

export interface Group {
  id: string;
  name: string;
  /** Tema correspondente no board do Miro ("Temas por fase"). */
  boardTheme: string;
  color: string;
  description: string;
}

export interface Topic {
  id: string;
  kind: 'concept' | 'pattern';
  group: string;
  title: string;
  summary: string;
  /** Para padrões: o ganho concreto que justifica usar o padrão. */
  gain?: string;
  /** Quando NÃO usar, ou o custo que ele traz. */
  tradeoffs: string[];
  level: Level;
  expectations: { senior: string; staff: string };
  /** Outros conceitos ou padrões diretamente relacionados. */
  related: string[];
  /** Casos de estudo onde o tópico é aplicado, com o motivo. */
  appliedIn: { case: string; why: string }[];
}

export interface StudyCase {
  id: string;
  number: number;
  title: string;
  examples: string;
  /** Nível do caso no board (1 a 3). */
  tier: 1 | 2 | 3;
  week: number;
  summary: string;
  deepDive: string[];
  project: string;
  /** Contas de capacidade em um ou mais cenários de entrevista. */
  estimates?: CaseEstimates;
}

export interface EstimateScenario {
  id: string;
  label: string;
  /** De onde vem o cenário, ex.: um livro. */
  source?: string;
  rows: { label: string; value: string }[];
}

export interface CaseEstimates {
  scenarios: EstimateScenario[];
  /** Uma linha que vale para todos os cenários. */
  note?: string;
}
