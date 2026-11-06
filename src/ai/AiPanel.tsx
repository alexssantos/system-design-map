import { PanelHelp } from '../components/Toolbar';
import { Badge, Button, Card, Chip, Icon, IconButton, SectionLabel } from '../ui-kit';
import {
  aiCaseById,
  aiCases,
  aiGroupById,
  aiGroups,
  aiRelatedOf,
  aiStageByN,
  aiStages,
  aiTopicById,
  aiTopics,
  casesOfTopic,
  orderOf,
  prereqPath,
  unlocksOf,
} from './graph';
import type { AiCase } from './types';

interface Props {
  id: string | null;
  onSelect: (id: string) => void;
  onClose: () => void;
  onOpenDiagram: (caseId: string) => void;
}

const pad = (n: number) => String(n).padStart(2, '0');

function Ref({ id, onSelect }: { id: string; onSelect: (id: string) => void }) {
  const c = aiCaseById.get(id);
  if (c)
    return (
      <Chip dot="var(--color-accent)" onClick={() => onSelect(id)}>
        IA {pad(c.number)}: {c.title}
      </Chip>
    );
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

/** Painel de um caso: o ganho que justifica a arquitetura, quando não usar e os termos que ele exercita. */
function CasePanel({ c, onSelect, onClose, onOpenDiagram }: { c: AiCase } & Omit<Props, 'id'>) {
  const byGroup = new Map<string, AiCase['uses']>();
  for (const u of [...c.uses].sort((a, b) => orderOf.get(a.topic)! - orderOf.get(b.topic)!)) {
    const g = aiTopicById.get(u.topic)!.group;
    byGroup.set(g, [...(byGroup.get(g) ?? []), u]);
  }
  const groupsInOrder = aiGroups.filter((g) => byGroup.has(g.id));
  return (
    <aside className="panel">
      <div className="panel__close">
        <IconButton icon="close" label="Fechar" size="sm" onClick={onClose} />
      </div>
      <div className="eyebrow">
        <Badge tone="accent">IA {pad(c.number)}</Badge>
        <Badge tone={c.level === 'staff' ? 'voice' : 'info'}>{c.level}</Badge>
        <Badge>{c.uses.length} termos</Badge>
      </div>
      <h2>{c.title}</h2>
      <p className="muted">{c.examples}</p>
      <p>{c.summary}</p>
      <Button variant="primary" icon="grid" block onClick={() => onOpenDiagram(c.id)}>
        Ver diagrama de arquitetura
      </Button>
      <Card variant="sunken" padding="sm" className="gain">
        <Icon name="bolt" size={18} anim="loop" />
        <span>
          <b>Ganho real:</b> {c.gain}
        </span>
      </Card>
      <Section title="Quando não usar">
        <p>{c.whenNot}</p>
      </Section>
      <Section title="Perguntas de deep dive">
        <ul>
          {c.deepDive.map((q) => (
            <li key={q}>{q}</li>
          ))}
        </ul>
      </Section>
      <Section title="Projeto para implementar">
        <Card variant="sunken" padding="sm">
          {c.project}
        </Card>
      </Section>
      <Section title={`Termos que o caso exercita (${c.uses.length})`}>
        {groupsInOrder.map((g) => (
          <div key={g.id} className="applied-group">
            <div className="applied-group-name" style={{ color: g.color }}>
              {g.name}
            </div>
            <ul className="applied">
              {byGroup.get(g.id)!.map((u) => (
                <li key={u.topic}>
                  <Ref id={u.topic} onSelect={onSelect} />
                  <span className="why">{u.why}</span>
                </li>
              ))}
            </ul>
          </div>
        ))}
      </Section>
    </aside>
  );
}

export function AiPanel({ id, onSelect, onClose, onOpenDiagram }: Props) {
  const aiCase = id ? aiCaseById.get(id) : undefined;
  if (aiCase) return <CasePanel c={aiCase} onSelect={onSelect} onClose={onClose} onOpenDiagram={onOpenDiagram} />;
  const topic = id ? aiTopicById.get(id) : undefined;

  if (!topic) {
    return (
      <aside className="panel is-empty">
        <PanelHelp title="Trilha de estudo">
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
                Os {aiCases.length} <b>casos de estudo</b> ficam na faixa de baixo: clique num caso para ver os termos que ele usa e dê clique
                duplo para abrir o diagrama animado.
              </li>
              <li>
                <span className="badge ai-recent">novo</span> marca termos que surgiram depois do livro e não têm capítulo próprio.
              </li>
            </ul>
          </Section>
        </PanelHelp>
      </aside>
    );
  }

  const group = aiGroupById.get(topic.group)!;
  const stage = aiStageByN.get(topic.stage)!;
  const path = prereqPath(topic.id);
  const unlocks = unlocksOf.get(topic.id) ?? [];
  const related = [...(aiRelatedOf.get(topic.id) ?? [])];
  const usedIn = casesOfTopic.get(topic.id) ?? [];
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
      <Section title={`Usado nos casos (${usedIn.length})`}>
        {usedIn.length === 0 ? (
          <p className="muted">Nenhum dos {aiCases.length} casos depende diretamente dele.</p>
        ) : (
          <ul className="applied">
            {usedIn.map((u) => (
              <li key={u.case.id}>
                <Ref id={u.case.id} onSelect={onSelect} />
                <span className="why">{u.why}</span>
              </li>
            ))}
          </ul>
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
