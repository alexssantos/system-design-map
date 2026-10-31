import { Handle, Position, type Node, type NodeProps } from '@xyflow/react';
import type { AiGroup, AiStage, AiTopic } from './types';

/** focus = selecionado; path = pré-requisito (direto ou indireto); next = o que ele destrava; related = ligado sem ordem. */
export type AiEmphasis = 'normal' | 'focus' | 'path' | 'next' | 'related' | 'dim';

type TopicData = { topic: AiTopic; color: string; order: number; emphasis: AiEmphasis; stageLabel: string };
export type AiTrailNode = Node<TopicData, 'aiTrail'>;
export type AiAreaNode = Node<TopicData, 'aiArea'>;
export type StageNode = Node<{ stage: AiStage; count: number; total: number; dim: boolean }, 'stage'>;
export type AiGroupNode = Node<{ group: AiGroup; dim: boolean }, 'aiGroup'>;

const hidden = { className: 'handle', isConnectable: false } as const;

function Body({ data }: { data: TopicData }) {
  const { topic, color, order, emphasis, stageLabel } = data;
  return (
    <div
      className={`card topic ai-card is-${emphasis}`}
      style={{ '--accent': color } as React.CSSProperties}
      title={`${topic.title}: ${topic.summary}`}
    >
      <span className="ai-card__order" aria-label={`${order}º na trilha`}>
        {order}
      </span>
      <span className="card-title">{topic.title}</span>
      <span className="ai-card__tags">
        {stageLabel && <span className="badge ai-stage-badge">{stageLabel}</span>}
        {topic.recent && <span className="badge ai-recent">novo</span>}
      </span>
    </div>
  );
}

/** Na trilha as linhas andam da esquerda para a direita; entre tópicos da mesma etapa, fazem um arco pela direita. */
export function AiTrailCard({ data }: NodeProps<AiTrailNode>) {
  return (
    <>
      <Handle type="target" id="l" position={Position.Left} {...hidden} />
      <Handle type="target" id="rt" position={Position.Right} {...hidden} />
      <Handle type="source" id="r" position={Position.Right} {...hidden} />
      <Body data={data} />
    </>
  );
}

export function AiAreaCard({ data }: NodeProps<AiAreaNode>) {
  return (
    <>
      <Handle type="target" id="t" position={Position.Top} {...hidden} />
      <Handle type="source" id="b" position={Position.Bottom} {...hidden} />
      <Body data={data} />
    </>
  );
}

export function StageColumn({ data }: NodeProps<StageNode>) {
  const { stage, count, total, dim } = data;
  const tag = stage.n === 1 ? 'comece aqui' : stage.n === total ? 'por último' : null;
  return (
    <div className={`stage-col${dim ? ' is-dim' : ''}`} style={{ '--step': (stage.n - 1) / (total - 1) } as React.CSSProperties}>
      <div className="stage-col__top">
        <span className="stage-col__n">Etapa {stage.n}</span>
        {tag && <span className="stage-col__tag">{tag}</span>}
        <span className="stage-col__count">{count}</span>
      </div>
      <div className="group-title">{stage.name}</div>
      <div className="stage-col__desc">{stage.description}</div>
    </div>
  );
}

export function AiGroupBox({ data }: NodeProps<AiGroupNode>) {
  const { group, dim } = data;
  return (
    <div className={`group-box${dim ? ' is-dim' : ''}`} style={{ '--accent': group.color } as React.CSSProperties}>
      <div className="group-title">{group.name}</div>
      <div className="group-sub">
        <span>cap. {group.chapters.join(' e ')}</span> · {group.description}
      </div>
    </div>
  );
}

export const aiNodeTypes = { aiTrail: AiTrailCard, aiArea: AiAreaCard, stage: StageColumn, aiGroup: AiGroupBox };
