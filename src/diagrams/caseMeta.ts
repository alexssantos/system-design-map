import { aiCases } from '../ai/cases';
import { cases } from '../data/cases';

/** O que o cabeçalho do diagrama precisa saber de um caso, venha ele do mapa de System Design ou do de IA. */
export interface CaseMeta {
  id: string;
  /** Selo curto, ex.: "Caso 01" ou "IA 02". */
  badge: string;
  title: string;
  /** Nível do caso, ex.: "nível 1" ou "staff". */
  level: string;
  /** Endereço do mapa de onde o caso vem. */
  home: string;
}

const pad = (n: number) => String(n).padStart(2, '0');

export const caseMeta = new Map<string, CaseMeta>([
  ...cases.map((c) => [c.id, { id: c.id, badge: `Caso ${pad(c.number)}`, title: c.title, level: `nível ${c.tier}`, home: '' }] as const),
  ...aiCases.map((c) => [c.id, { id: c.id, badge: `IA ${pad(c.number)}`, title: c.title, level: c.level, home: '#/ai' }] as const),
]);
