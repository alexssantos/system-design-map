import { caseById, getItem, groupById, relatedOf, topicById, topicsByCase } from '../data/graph';
import type { Level } from '../data/types';

interface Props {
  id: string | null;
  levelFocus: Level | 'all';
  onSelect: (id: string) => void;
  onClose: () => void;
}

function Chip({ id, onSelect }: { id: string; onSelect: (id: string) => void }) {
  const t = topicById.get(id);
  const c = caseById.get(id);
  const label = t ? t.title : c ? `Caso ${String(c.number).padStart(2, '0')}: ${c.title}` : id;
  const color = t ? groupById.get(t.group)?.color : undefined;
  return (
    <button className="chip" style={{ '--accent': color } as React.CSSProperties} onClick={() => onSelect(id)}>
      {t && (t.kind === 'pattern' ? '◆ ' : '● ')}
      {label}
    </button>
  );
}

export function DetailPanel({ id, levelFocus, onSelect, onClose }: Props) {
  const item = id ? getItem(id) : undefined;

  if (!item) {
    return (
      <aside className="panel">
        <h2>Como usar</h2>
        <ul className="howto">
          <li>Clique num conceito, padrão ou caso para ver o resumo e as conexões.</li>
          <li>As linhas aparecem para o item em foco: as coloridas e animadas levam aos casos, as cinza a tópicos relacionados.</li>
          <li>
            <b>●</b> é conceito, <b>◆</b> é padrão (arquitetura ou código).
          </li>
          <li>Use “Foco senior” para apagar o que é esperado só de staff.</li>
          <li>Selecione um caso para ver todos os tópicos que ele exercita, agrupados.</li>
        </ul>
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
        <button className="close" onClick={onClose} aria-label="Fechar">
          ×
        </button>
        <div className="eyebrow">
          Caso {String(item.number).padStart(2, '0')} · nível {item.tier} · semana {item.week}
        </div>
        <h2>{item.title}</h2>
        <p className="muted">{item.examples}</p>
        <p>{item.summary}</p>
        <h3>Perguntas de deep dive</h3>
        <ul>
          {item.deepDive.map((q) => (
            <li key={q}>{q}</li>
          ))}
        </ul>
        <h3>Projeto para implementar</h3>
        <p>{item.project}</p>
        <h3>Tópicos que o caso exercita ({used.length})</h3>
        {[...byGroup.entries()].map(([g, list]) => (
          <div key={g} className="applied-group">
            <div className="applied-group-name" style={{ color: groupById.get(g)?.color }}>
              {groupById.get(g)?.name}
            </div>
            <ul className="applied">
              {list.map(({ topic, why }) => (
                <li key={topic.id}>
                  <Chip id={topic.id} onSelect={onSelect} />
                  <span className="why">{why}</span>
                </li>
              ))}
            </ul>
          </div>
        ))}
      </aside>
    );
  }

  const group = groupById.get(item.group)!;
  const related = [...(relatedOf.get(item.id) ?? [])];
  return (
    <aside className="panel" style={{ '--accent': group.color } as React.CSSProperties}>
      <button className="close" onClick={onClose} aria-label="Fechar">
        ×
      </button>
      <div className="eyebrow">
        {item.kind === 'pattern' ? 'Padrão' : 'Conceito'} · {group.name}
        <span className={`badge ${item.level}`}>esperado a partir de {item.level}</span>
      </div>
      <h2>{item.title}</h2>
      <p>{item.summary}</p>
      {item.gain && (
        <div className="callout">
          <b>Ganho real:</b> {item.gain}
        </div>
      )}
      <h3>Trade-offs</h3>
      <ul>
        {item.tradeoffs.map((t) => (
          <li key={t}>{t}</li>
        ))}
      </ul>
      <h3>O que o entrevistador espera</h3>
      <div className="levels">
        <div className={`level-box${levelFocus === 'staff' ? ' is-muted' : ''}`}>
          <div className="level-name">Senior</div>
          {item.expectations.senior}
        </div>
        <div className={`level-box${levelFocus === 'senior' ? ' is-muted' : ''}`}>
          <div className="level-name">Staff</div>
          {item.expectations.staff}
        </div>
      </div>
      <h3>Aplicado em ({item.appliedIn.length})</h3>
      {item.appliedIn.length === 0 ? (
        <p className="muted">Nenhum dos 15 casos depende diretamente dele; aparece em discussões de arquitetura e migração.</p>
      ) : (
        <ul className="applied">
          {item.appliedIn.map((a) => (
            <li key={a.case}>
              <Chip id={a.case} onSelect={onSelect} />
              <span className="why">{a.why}</span>
            </li>
          ))}
        </ul>
      )}
      {related.length > 0 && (
        <>
          <h3>Relacionados</h3>
          <div className="chips">
            {related.map((r) => (
              <Chip key={r} id={r} onSelect={onSelect} />
            ))}
          </div>
        </>
      )}
    </aside>
  );
}
