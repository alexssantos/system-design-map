import { Handle, Position, type Node, type NodeProps } from '@xyflow/react';
import type { Group, StudyCase, Topic } from '../data/types';

export type Emphasis = 'normal' | 'focus' | 'neighbor' | 'dim';

export type GroupNode = Node<{ group: Group; dim: boolean }, 'area'>;
export type TopicNode = Node<{ topic: Topic; color: string; emphasis: Emphasis; faded: boolean }, 'topic'>;
export type CaseNode = Node<{ studyCase: StudyCase; emphasis: Emphasis; count: number }, 'case'>;
export type BandNode = Node<{ title: string; subtitle: string }, 'band'>;

const handles = (
  <>
    <Handle type="target" position={Position.Top} className="handle" isConnectable={false} />
    <Handle type="source" position={Position.Bottom} className="handle" isConnectable={false} />
  </>
);

export function GroupBox({ data }: NodeProps<GroupNode>) {
  const { group, dim } = data;
  return (
    <div className={`group-box${dim ? ' is-dim' : ''}`} style={{ '--accent': group.color } as React.CSSProperties}>
      <div className="group-title">{group.name}</div>
      <div className="group-sub">
        <span>{group.boardTheme}</span> · {group.description}
      </div>
    </div>
  );
}

export function TopicCard({ data }: NodeProps<TopicNode>) {
  const { topic, color, emphasis, faded } = data;
  return (
    <div
      className={`card topic is-${emphasis}${faded ? ' is-faded' : ''} kind-${topic.kind}`}
      style={{ '--accent': color } as React.CSSProperties}
      title={topic.summary}
    >
      {handles}
      <span className="kind-icon" aria-hidden>
        {topic.kind === 'pattern' ? '◆' : '●'}
      </span>
      <span className="card-title">{topic.title}</span>
      {topic.level === 'staff' && <span className="badge staff">staff</span>}
    </div>
  );
}

export function CaseCard({ data }: NodeProps<CaseNode>) {
  const { studyCase, emphasis, count } = data;
  return (
    <div className={`card case is-${emphasis}`} title={studyCase.summary}>
      {handles}
      <div className="case-top">
        <span className="case-num">Caso {String(studyCase.number).padStart(2, '0')}</span>
        <span className="case-meta">
          nível {studyCase.tier} · sem. {studyCase.week} · {count} tópicos
        </span>
      </div>
      <span className="card-title">{studyCase.title}</span>
    </div>
  );
}

export function Band({ data }: NodeProps<BandNode>) {
  return (
    <div className="band">
      <div className="group-title">{data.title}</div>
      <div className="group-sub">{data.subtitle}</div>
    </div>
  );
}

export const nodeTypes = { area: GroupBox, topic: TopicCard, case: CaseCard, band: Band };
