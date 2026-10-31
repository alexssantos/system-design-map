import { Badge, Card, Chip, Icon, IconButton, SectionLabel } from '../ui-kit';
import { aiGroupById, aiRelatedOf, aiStageByN, aiStages, aiTopicById, aiTopics, orderOf, prereqPath, unlocksOf } from './graph';

interface Props {
  id: string | null;
  onSelect: (id: string) => void;
  onClose: () => void;
}

function Ref({ id, onSelect }: { id: string; onSelect: (id: string) => void }) {
  const t = aiTopicById.get(id);
  if (!t) return null;
  return (
    <Chip dot={aiGroupById.get(t.group)?.color} onClick={() => onSelect(id)}>
      {t.title}
    </Chip>
  );
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section className="panel__section">
      <SectionLabel align="start">{title}</SectionLabel>
      {children}
    </section>
  );
}

export function AiPanel({ id, onSelect, onClose }: Props) {
  const topic = id ? aiTopicById.get(id) : undefined;

  if (!topic) {
    return (
      <aside className="panel">
        <h2>Trilha de estudo</h2>
        <p className="muted">
          Da primeira aplicação até colocá-la em escala. O número em cada card é a posição na trilha: 1 é o primeiro a aprender,{' '}
          {aiTopics.length} é o último.
        </p>
        <ol className="ai-stages">
          {aiStages.map((s) => {
            const list = aiTopics.filter((t) => t.stage === s.n);
            return (
              <li key={s.n} style={{ '--step': (s.n - 1) / (aiStages.length - 1) } as React.CSSProperties}>
                <span className="ai-stages__n">{s.n}</span>
                <div>
                  <b>{s.name}</b>
                  <div className="muted">
                    {s.description} {list.length} termos, do {orderOf.get(list[0].id)} ao {orderOf.get(list[list.length - 1].id)}.
                  </div>
                </div>
              </li>
            );
          })}
        </ol>
        <Section title="Como usar">
          <ul className="howto">
            <li>Clique num termo: acende a trilha inteira de pré-requisitos até ele e o que ele destrava em seguida.</li>
            <li>Setas sólidas vão do pré-requisito para quem depende dele; tracejadas ligam termos relacionados sem ordem.</li>
            <li>
              <b>Trilha</b> mostra uma coluna por etapa; <b>Por área</b> agrupa pelos capítulos do livro.
            </li>
            <li>
              <span className="badge ai-recent">novo</span> marca termos que surgiram depois do livro e não têm capítulo próprio.
            </li>
          </ul>
        </Section>
      </aside>
    );
  }

  const group = aiGroupById.get(topic.group)!;
  const stage = aiStageByN.get(topic.stage)!;
  const path = prereqPath(topic.id);
  const unlocks = unlocksOf.get(topic.id) ?? [];
  const related = [...(aiRelatedOf.get(topic.id) ?? [])];
  return (
    <aside className="panel" style={{ '--accent': group.color } as React.CSSProperties}>
      <div className="panel__close">
        <IconButton icon="close" label="Fechar" size="sm" onClick={onClose} />
      </div>
      <div className="eyebrow">
        <Badge tone="accent">
          {orderOf.get(topic.id)}º de {aiTopics.length}
        </Badge>
        <Badge tone="info">
          Etapa {stage.n} · {stage.name}
        </Badge>
        {topic.recent ? <Badge tone="voice">termo recente, sem capítulo</Badge> : <Badge>cap. {group.chapters.join(' e ')}</Badge>}
      </div>
      <div className="panel__group" style={{ color: group.color }}>
        {group.name}
      </div>
      <h2>{topic.title}</h2>
      <p>{topic.summary}</p>
      <Card variant="sunken" padding="sm" className="gain">
        <Icon name="bolt" size={18} anim="loop" />
        <span>
          <b>Na prática:</b> {topic.inPractice}
        </span>
      </Card>
      <Section title={`Antes, aprenda (${topic.prereqs.length})`}>
        {topic.prereqs.length === 0 ? (
          <p className="muted">Nenhum pré-requisito: é um bom ponto de partida.</p>
        ) : (
          <div className="chips">
            {topic.prereqs.map((p) => (
              <Ref key={p} id={p} onSelect={onSelect} />
            ))}
          </div>
        )}
      </Section>
      {path.length > topic.prereqs.length && (
        <Section title={`Trilha completa até aqui (${path.length})`}>
          <ol className="ai-path">
            {path.map((p) => (
              <li key={p}>
                <span className="ai-path__n">{orderOf.get(p)}</span>
                <Ref id={p} onSelect={onSelect} />
              </li>
            ))}
          </ol>
        </Section>
      )}
      <Section title={`Destrava (${unlocks.length})`}>
        {unlocks.length === 0 ? (
          <p className="muted">Nada depende diretamente dele: é um ponto de chegada.</p>
        ) : (
          <div className="chips">
            {unlocks.map((u) => (
              <Ref key={u} id={u} onSelect={onSelect} />
            ))}
          </div>
        )}
      </Section>
      {related.length > 0 && (
        <Section title="Relacionados">
          <div className="chips">
            {related.map((r) => (
              <Ref key={r} id={r} onSelect={onSelect} />
            ))}
          </div>
        </Section>
      )}
    </aside>
  );
}
