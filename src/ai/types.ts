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
