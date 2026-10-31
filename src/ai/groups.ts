import type { AiGroup, AiStage } from './types';

export const aiGroups: AiGroup[] = [
  {
    id: 'ai-modelos',
    name: 'Fundamentos de modelos',
    chapters: [2],
    color: '#4f7cff',
    description: 'O que é um LLM, como ele lê texto e por que às vezes erra.',
  },
  {
    id: 'ai-avaliacao',
    name: 'Avaliação',
    chapters: [3, 4],
    color: '#b08400',
    description: 'Medir se o modelo e a aplicação fazem o que deveriam.',
  },
  {
    id: 'ai-prompting',
    name: 'Prompting e contexto',
    chapters: [5],
    color: '#00a3a3',
    description: 'Instruir o modelo e decidir o que entra na janela.',
  },
  {
    id: 'ai-rag',
    name: 'RAG',
    chapters: [6],
    color: '#8b5cf6',
    description: 'Buscar conhecimento externo e colocá-lo no contexto.',
  },
  {
    id: 'ai-agentes',
    name: 'Agentes',
    chapters: [6],
    color: '#e0662d',
    description: 'Modelos que planejam e agem com ferramentas, em loop.',
  },
  {
    id: 'ai-ajuste',
    name: 'Ajuste fino',
    chapters: [7],
    color: '#d1477a',
    description: 'Mudar os pesos do modelo quando prompt e RAG não bastam.',
  },
  {
    id: 'ai-dados',
    name: 'Dados',
    chapters: [8],
    color: '#2e9e5b',
    description: 'Montar e limpar os datasets de treino e de avaliação.',
  },
  {
    id: 'ai-inferencia',
    name: 'Inferência',
    chapters: [9],
    color: '#0f8fb8',
    description: 'Servir o modelo rápido e barato.',
  },
  {
    id: 'ai-producao',
    name: 'Arquitetura e produção',
    chapters: [10],
    color: '#d64545',
    description: 'Proteger, rotear, observar e melhorar o sistema em uso.',
  },
];

/**
 * Trilha sugerida: tokens e contexto, prompting, RAG com embeddings, evals, agentes e ferramentas e, por fim,
 * inferência e produção. Ajuste fino e dados não estavam na ordem sugerida; entram antes da última etapa,
 * porque só valem a pena quando prompt e RAG já não resolvem.
 */
export const aiStages: AiStage[] = [
  { n: 1, name: 'Tokens e contexto', description: 'Como o modelo lê, escolhe a próxima palavra e erra.' },
  { n: 2, name: 'Prompting', description: 'Instruções, exemplos e o que entra na janela.' },
  { n: 3, name: 'RAG e embeddings', description: 'Dar ao modelo o conhecimento que ele não tem.' },
  { n: 4, name: 'Evals', description: 'Saber se a aplicação funciona antes de crescer.' },
  { n: 5, name: 'Agentes e ferramentas', description: 'O modelo passa a agir, em loop.' },
  { n: 6, name: 'Ajuste fino e dados', description: 'Mudar o modelo quando prompt e RAG não bastam.' },
  { n: 7, name: 'Inferência e produção', description: 'Servir rápido, barato e com segurança, em escala.' },
];
