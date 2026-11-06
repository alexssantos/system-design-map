/** Área do mapa de Engenharia de AI, na ordem dos capítulos do livro (AI Engineering, Chip Huyen). */
export interface AiGroup {
  id: string;
  name: string;
  /** Capítulos do livro que tratam da área. */
  chapters: number[];
  color: string;
  description: string;
}

/** Etapa da trilha de estudo: da primeira aplicação até colocá-la em escala. */
export interface AiStage {
  /** 1 é a primeira etapa a estudar; a maior é a última. */
  n: number;
  name: string;
  description: string;
}

export interface AiTopic {
  id: string;
  group: string;
  title: string;
  /** Definição de uma linha. */
  summary: string;
  /** Onde o termo aparece no dia a dia de quem constrói a aplicação. */
  inPractice: string;
  /** Etapa da trilha (ver `stages`). */
  stage: number;
  /** Termo que surgiu depois do livro; não tem capítulo próprio. */
  recent?: boolean;
  /** Pré-requisitos diretos: tópicos que vale aprender antes deste. */
  prereqs: string[];
  /** Tópicos ligados sem ordem de estudo entre eles. */
  related?: string[];
}

/** Caso de estudo do mapa de IA: um sistema real em que os termos do mapa resolvem um problema concreto. */
export interface AiCase {
  id: string;
  /** 1 é o primeiro a estudar. */
  number: number;
  title: string;
  /** Produtos ou situações do mundo real parecidos com o caso. */
  examples: string;
  /** Primeiro nível em que o entrevistador espera que você desenhe o caso. */
  level: 'senior' | 'staff';
  summary: string;
  /** O ganho concreto que justifica a arquitetura. */
  gain: string;
  /** Quando essa arquitetura não vale o custo. */
  whenNot: string;
  deepDive: string[];
  project: string;
  /** Termos do mapa que o caso exercita, com o motivo. */
  uses: { topic: string; why: string }[];
}
