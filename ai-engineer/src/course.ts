import type { Lesson, Module } from './types';
import { llmGeraTexto, janelaContexto, promptInjection } from './lessons/fundamentos';
import { embeddings, rag, hibridaRerank, evals } from './lessons/rag';
import { toolUse, loopAgentico, finetuningVsRag } from './lessons/agentes';
import { latenciaCache, gateway, designBotSuporte } from './lessons/producao';

const soon = (title: string) => ({ soon: title });

export const modules: Module[] = [
  { id: 'fundamentos', title: 'Fundamentos', color: '#d9b77a', lessons: [llmGeraTexto, janelaContexto, soon('Alucinação e saída estruturada')] },
  { id: 'prompting', title: 'Prompting', color: '#3fa456', lessons: [soon('System prompt, exemplos e raciocínio'), promptInjection, soon('Engenharia de contexto')] },
  { id: 'rag', title: 'RAG', color: '#7c63d0', lessons: [embeddings, rag, hibridaRerank, soon('Chunking na prática'), soon('Reescrita de consulta'), soon('GraphRAG')] },
  { id: 'evals', title: 'Evals', color: '#e8834d', lessons: [evals, soon('Benchmarks e comparação entre modelos'), soon('Avaliando agentes')] },
  { id: 'agentes', title: 'Agentes', color: '#2f86ce', lessons: [toolUse, loopAgentico, soon('Memória de agentes'), soon('MCP'), soon('Sistemas multiagente')] },
  { id: 'ajuste', title: 'Ajuste fino e dados', color: '#2a9d8f', lessons: [finetuningVsRag, soon('LoRA e PEFT'), soon('Destilação e quantização'), soon('Dados sintéticos')] },
  { id: 'inferencia', title: 'Inferência', color: '#d9577a', lessons: [latenciaCache, soon('KV cache e batching'), soon('Servindo modelos abertos')] },
  { id: 'producao', title: 'Produção', color: '#8c9a3c', lessons: [gateway, soon('Guardrails'), soon('Cache semântico'), soon('Observabilidade e drift')] },
  {
    id: 'sistemas',
    title: 'Sistemas completos',
    color: '#64728a',
    lessons: [designBotSuporte, soon('Projete um agente de código'), soon('Projete extração de documentos em lote'), soon('Projete uma pesquisa multiagente')],
  },
];

export const lessons: Lesson[] = modules.flatMap((m) => m.lessons.filter((l): l is Lesson => 'id' in l));

export const lessonIndex: Record<string, { lesson: Lesson; module: Module; moduleNo: number; lessonNo: number }> = {};
modules.forEach((module, mi) =>
  module.lessons.forEach((lesson, li) => {
    if ('id' in lesson) lessonIndex[lesson.id] = { lesson, module, moduleNo: mi + 1, lessonNo: li + 1 };
  }),
);
