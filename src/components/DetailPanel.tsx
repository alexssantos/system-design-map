import { caseById, getItem, groupById, relatedOf, topicById, topicsByCase } from '../data/graph';
import { useState } from 'react';
import { PanelHelp } from './Toolbar';
import type { CaseEstimates, Level } from '../data/types';
import { diagramVersions, versionOf } from '../diagrams/data';
import { audioVersions } from '../podcasts';
import { Badge, Button, Card, Chip, Icon, IconButton, SectionLabel, SegmentedControl } from '../ui-kit';

interface Props {
  id: string | null;
  levelFocus: Level | 'all';
  onSelect: (id: string) => void;
  onClose: () => void;
  onOpenDiagram: (caseId: string, version?: number) => void;
}

const pad = (n: number) => String(n).padStart(2, '0');

function Ref({ id, onSelect }: { id: string; onSelect: (id: string) => void }) {
  const t = topicById.get(id);
  const c = caseById.get(id);
  const label = t ? t.title : c ? `Caso ${pad(c.number)}: ${c.title}` : id;
  const dot = t ? groupById.get(t.group)?.color : 'var(--color-accent)';
  return (
    <Chip dot={dot} onClick={() => onSelect(id)}>
      {label}
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

/** Botão do diagrama padrão (a versão mais nova), o que mudou nela e as versões anteriores. */
function DiagramVersions({ caseId, onOpen }: { caseId: string; onOpen: (caseId: string, version?: number) => void }) {
  const list = diagramVersions.get(caseId);
  if (!list) return null;
  const [latest, ...older] = list;
  const withAudio = new Set(audioVersions(caseId));
  return (
    <>
      <Button variant="primary" icon="grid" block onClick={() => onOpen(caseId)}>
        Ver diagrama de arquitetura{older.length > 0 && ` (v${versionOf(latest)})`}
      </Button>
      {older.length > 0 && (
        <Section title={`O que mudou na v${versionOf(latest)}`}>
          <ul>
            {latest.changes?.map((ch) => (
              <li key={ch}>{ch}</li>
            ))}
          </ul>
          <div className="versions">
            {older.map((d) => (
              <Button key={versionOf(d)} variant="light" size="sm" icon="history" onClick={() => onOpen(caseId, versionOf(d))}>
                Ver v{versionOf(d)}
                {withAudio.has(versionOf(d)) && ' · com áudio'}
              </Button>
            ))}
          </div>
        </Section>
      )}
    </>
  );
}

/** Contas de capacidade do caso, com troca entre cenários. */
function Estimates({ estimates }: { estimates: CaseEstimates }) {
  const [id, setId] = useState(estimates.scenarios[0].id);
  const s = estimates.scenarios.find((x) => x.id === id) ?? estimates.scenarios[0];
  return (
    <Section title="Estimativas">
      {estimates.scenarios.length > 1 && (
        <SegmentedControl
          size="sm"
          label="Cenário"
          value={s.id}
          onChange={setId}
          options={estimates.scenarios.map((x) => ({ value: x.id, label: x.label }))}
        />
      )}
      <table className="estimates">
        <tbody>
          {s.rows.map((r) => (
            <tr key={r.label}>
              <th scope="row">{r.label}</th>
              <td className="tl-num">{r.value}</td>
            </tr>
          ))}
        </tbody>
      </table>
      {s.source && <p className="muted estimates__source">Cenário de {s.source}.</p>}
      {estimates.note && <p className="muted">{estimates.note}</p>}
    </Section>
  );
}

function Close({ onClose }: { onClose: () => void }) {
  return (
    <div className="panel__close">
      <IconButton icon="close" label="Fechar" size="sm" onClick={onClose} />
    </div>
  );
}

export function DetailPanel({ id, levelFocus, onSelect, onClose, onOpenDiagram }: Props) {
  const item = id ? getItem(id) : undefined;

  if (!item) {
    return (
      <aside className="panel is-empty">
        <PanelHelp title="Como usar">
          <ul className="howto">
            <li>Clique num conceito, padrão ou caso para ver o resumo e as conexões.</li>
            <li>As linhas coloridas e animadas levam aos casos; as tracejadas, a tópicos relacionados.</li>
            <li>
              <b>●</b> é conceito, <b>◆</b> é padrão (arquitetura ou código).
            </li>
            <li>“Senior” esmaece o que costuma ser cobrado só de staff.</li>
            <li>Num caso, abra o diagrama de arquitetura animado (ou dê clique duplo no card).</li>
          </ul>
        </PanelHelp>
      </aside>
    );
  }

  if (item.type === 'case') {
    const used = topicsByCase.get(item.id) ?? [];
    const byGroup = new Map<string, typeof used>();
    for (const u of used) {
      const list = byGroup.get(u.topic.group) ?? [];
      list.push(u);
      byGroup.set(u.topic.group, list);
    }
    return (
      <aside className="panel">
        <Close onClose={onClose} />
        <div className="eyebrow">
          <Badge tone="accent">Caso {pad(item.number)}</Badge>
          <Badge>nível {item.tier}</Badge>
          <Badge>semana {item.week}</Badge>
        </div>
        <h2>{item.title}</h2>
        <p className="muted">{item.examples}</p>
        <p>{item.summary}</p>
        <DiagramVersions caseId={item.id} onOpen={onOpenDiagram} />
        {item.estimates && <Estimates estimates={item.estimates} />}
        <Section title="Perguntas de deep dive">
          <ul>
            {item.deepDive.map((q) => (
              <li key={q}>{q}</li>
            ))}
          </ul>
        </Section>
        <Section title="Projeto para implementar">
          <Card variant="sunken" padding="sm">
            {item.project}
          </Card>
        </Section>
        <Section title={`Tópicos que o caso exercita (${used.length})`}>
          {[...byGroup.entries()].map(([g, list]) => (
            <div key={g} className="applied-group">
              <div className="applied-group-name" style={{ color: groupById.get(g)?.color }}>
                {groupById.get(g)?.name}
              </div>
              <ul className="applied">
                {list.map(({ topic, why }) => (
                  <li key={topic.id}>
                    <Ref id={topic.id} onSelect={onSelect} />
                    <span className="why">{why}</span>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </Section>
      </aside>
    );
  }

  const group = groupById.get(item.group)!;
  const related = [...(relatedOf.get(item.id) ?? [])];
  return (
    <aside className="panel" style={{ '--accent': group.color } as React.CSSProperties}>
      <Close onClose={onClose} />
      <div className="eyebrow">
        <Badge tone={item.kind === 'pattern' ? 'voice' : 'info'}>{item.kind === 'pattern' ? '◆ Padrão' : '● Conceito'}</Badge>
        <Badge tone={item.level === 'staff' ? 'voice' : 'neutral'}>a partir de {item.level}</Badge>
      </div>
      <div className="panel__group" style={{ color: group.color }}>
        {group.name}
      </div>
      <h2>{item.title}</h2>
      <p>{item.summary}</p>
      {item.gain && (
        <Card variant="sunken" padding="sm" className="gain">
          <Icon name="bolt" size={18} anim="loop" />
          <span>
            <b>Ganho real:</b> {item.gain}
          </span>
        </Card>
      )}
      <Section title="Trade-offs">
        <ul>
          {item.tradeoffs.map((t) => (
            <li key={t}>{t}</li>
          ))}
        </ul>
      </Section>
      <Section title="O que o entrevistador espera">
        <div className="levels">
          <Card variant="sunken" padding="sm" className={levelFocus === 'staff' ? 'is-muted' : ''}>
            <div className="level-name">Senior</div>
            {item.expectations.senior}
          </Card>
          <Card variant="sunken" padding="sm" className={levelFocus === 'senior' ? 'is-muted' : ''}>
            <div className="level-name">Staff</div>
            {item.expectations.staff}
          </Card>
        </div>
      </Section>
      <Section title={`Aplicado em (${item.appliedIn.length})`}>
        {item.appliedIn.length === 0 ? (
          <p className="muted">Nenhum dos 15 casos depende diretamente dele; aparece em discussões de arquitetura e migração.</p>
        ) : (
          <ul className="applied">
            {item.appliedIn.map((a) => (
              <li key={a.case}>
                <Ref id={a.case} onSelect={onSelect} />
                <span className="why">{a.why}</span>
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
