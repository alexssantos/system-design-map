import { useCallback, useEffect, useMemo, useRef, useState, type ReactNode } from 'react';
import {
  ArrowLeft, ArrowRight, BarChart3, BookOpen, Check, ChevronRight, Clock, FileText, Folder, Github, Keyboard, LayoutGrid,
  Lightbulb, ListOrdered, Maximize2, Menu, Minimize2, Moon, Pause, Play, RotateCcw, Search, Settings, Sparkles, Sun,
  TriangleAlert, AppWindow, X,
} from 'lucide-react';
import { modules, lessons, lessonIndex } from './course';
import type { Lesson, Level, Step } from './types';
import { Stage } from './Stage';
import { Icon } from './icons';

const CHAPTER: Record<Step['chapter'], [string, string]> = {
  problema: ['Problema', 'red'],
  tecnica: ['Técnica', 'blue'],
  ideia: ['Ideia', 'violet'],
  cuidado: ['Cuidado', 'amber'],
  pratica: ['Na prática', 'green'],
  entrevista: ['Entrevista', 'sand'],
  resumo: ['Resumo', 'ink'],
};

const NAV = [
  { id: 'aprender', label: 'Aprender', icon: BookOpen, soon: '' },
  { id: 'pratica', label: 'Prática', icon: Settings, soon: 'A prática chega em breve' },
  { id: 'lab', label: 'Laboratório', icon: AppWindow, soon: 'O laboratório chega em breve' },
  { id: 'resumos', label: 'Resumos', icon: LayoutGrid, soon: 'Os resumos chegam em breve' },
];

function parseHash(): { id: string; step: number } {
  const m = location.hash.match(/^#\/([\w-]+)(?:\/(\d+))?/);
  const id = m && lessonIndex[m[1]] ? m[1] : lessons[0].id;
  const max = lessonIndex[id].lesson.steps.length;
  const step = Math.min(max, Math.max(1, Number(m?.[2] ?? 1)));
  return { id, step };
}

/** **termo** e `código` dentro do texto das lições */
function rich(text: string): ReactNode[] {
  return text.split(/(\*\*[^*]+\*\*|`[^`]+`)/g).map((part, i) => {
    if (part.startsWith('**')) return <span key={i} className="term">{part.slice(2, -2)}</span>;
    if (part.startsWith('`')) return <code key={i}>{part.slice(1, -1)}</code>;
    return part;
  });
}

function fold(lesson: Lesson, upto: number) {
  const visible: string[] = [];
  const hud: Record<string, [string, Level | undefined]> = {};
  let learn = 0;
  for (let i = 0; i <= upto; i++) {
    const s = lesson.steps[i];
    for (const id of s.rm ?? []) {
      const at = visible.indexOf(id);
      if (at >= 0) visible.splice(at, 1);
    }
    for (const id of s.add ?? []) if (!visible.includes(id)) visible.push(id);
    for (const [k, v] of Object.entries(s.hud ?? {})) hud[k] = typeof v === 'string' ? [v, undefined] : v;
    if (s.learn !== undefined) learn = s.learn;
  }
  return { visible, hud, learn };
}

function loadDone(): Record<string, boolean> {
  try {
    return JSON.parse(localStorage.getItem('aie-done') ?? '{}');
  } catch {
    return {};
  }
}

export default function App() {
  const [route, setRoute] = useState(parseHash);
  const [theme, setTheme] = useState(() => document.documentElement.getAttribute('data-theme') ?? 'light');
  const [open, setOpen] = useState<Record<string, boolean>>({});
  const [drawer, setDrawer] = useState(false);
  const [search, setSearch] = useState(false);
  const [paused, setPaused] = useState(false);
  const [replay, setReplay] = useState(0);
  const [full, setFull] = useState(false);
  const [toast, setToast] = useState('');
  const [done, setDone] = useState(loadDone);
  const guideRef = useRef<HTMLDivElement>(null);

  const { lesson, module, moduleNo, lessonNo } = lessonIndex[route.id];
  const stepIdx = route.step - 1;
  const step = lesson.steps[stepIdx];
  const state = useMemo(() => fold(lesson, stepIdx), [lesson, stepIdx]);
  const prev = useMemo(() => (stepIdx > 0 ? fold(lesson, stepIdx - 1).visible : []), [lesson, stepIdx]);
  const fresh = state.visible.filter((id) => !prev.includes(id));

  useEffect(() => {
    const on = () => setRoute(parseHash());
    addEventListener('hashchange', on);
    return () => removeEventListener('hashchange', on);
  }, []);

  useEffect(() => {
    document.documentElement.setAttribute('data-theme', theme);
    try {
      localStorage.setItem('aie-theme', theme);
    } catch {
      /* armazenamento indisponível */
    }
  }, [theme]);

  useEffect(() => {
    document.title = `${lesson.title} · AI Engineer`;
    setOpen((o) => ({ ...o, [module.id]: true }));
  }, [lesson, module]);

  useEffect(() => {
    setPaused(false);
    guideRef.current?.scrollTo({ top: 0 });
    if (route.step === lesson.steps.length && !done[lesson.id]) {
      const next = { ...done, [lesson.id]: true };
      setDone(next);
      try {
        localStorage.setItem('aie-done', JSON.stringify(next));
      } catch {
        /* armazenamento indisponível */
      }
    }
  }, [route, lesson, done]);

  useEffect(() => {
    if (!toast) return;
    const id = setTimeout(() => setToast(''), 2200);
    return () => clearTimeout(id);
  }, [toast]);

  const go = useCallback((id: string, n: number) => {
    location.hash = `#/${id}/${n}`;
  }, []);

  const flat = lessons;
  const at = flat.findIndex((l) => l.id === lesson.id);
  const nextLesson = flat[at + 1];
  const isLast = route.step === lesson.steps.length;

  const forward = useCallback(() => {
    if (!isLast) go(lesson.id, route.step + 1);
    else if (nextLesson) go(nextLesson.id, 1);
  }, [isLast, go, lesson, route.step, nextLesson]);
  const back = useCallback(() => {
    if (route.step > 1) go(lesson.id, route.step - 1);
  }, [go, lesson, route.step]);

  useEffect(() => {
    const on = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'k') {
        e.preventDefault();
        setSearch(true);
        return;
      }
      if (e.key === 'Escape') {
        setSearch(false);
        setDrawer(false);
        setFull(false);
        return;
      }
      const tag = (e.target as HTMLElement)?.tagName;
      if (search || tag === 'INPUT' || e.ctrlKey || e.metaKey || e.altKey) return;
      if (e.key === 'ArrowRight') forward();
      else if (e.key === 'ArrowLeft') back();
      else if (e.key.toLowerCase() === 'r') setReplay((n) => n + 1);
      else if (e.key === ' ') {
        e.preventDefault();
        setPaused((p) => !p);
      }
    };
    addEventListener('keydown', on);
    return () => removeEventListener('keydown', on);
  }, [forward, back, search]);

  const total = lessons.length;
  const doneCount = lessons.filter((l) => done[l.id]).length;
  const nextLabel = !isLast ? `Próximo: ${lesson.steps[stepIdx + 1].nav}` : nextLesson ? `Próxima lição: ${nextLesson.title}` : 'Fim do curso';
  const [chapterLabel, chapterTone] = CHAPTER[step.chapter];
  const runKey = `${lesson.id}-${route.step}-${replay}`;

  const tree = (
    <>
      <div className="tree-root">
        <Folder size={18} fill="currentColor" />
        <b>Curso</b>
        <span className="tree-root__meta">{total} lições</span>
        <button className="drawer-close tool" onClick={() => setDrawer(false)} aria-label="Fechar menu">
          <X size={16} />
        </button>
      </div>
      <nav className="course" aria-label="Lições">
        {modules.map((m, mi) => {
          const real = m.lessons.filter((l): l is Lesson => 'id' in l);
          const isOpen = !!open[m.id];
          return (
            <div className={`mod ${isOpen ? 'is-open' : ''}`} key={m.id}>
              <button className="mod__head" onClick={() => setOpen((o) => ({ ...o, [m.id]: !isOpen }))} aria-expanded={isOpen}>
                <ChevronRight size={15} className="mod__chev" />
                <svg className="folder" width="20" height="16" viewBox="0 0 20 16" aria-hidden style={{ color: m.color }}>
                  <path d="M1 3a2 2 0 0 1 2-2h4.2l2 2.3H17a2 2 0 0 1 2 2V13a2 2 0 0 1-2 2H3a2 2 0 0 1-2-2Z" />
                  <path className="folder__lip" d="M1 6.3h18" />
                </svg>
                <span className="mod__title">
                  {String(mi + 1).padStart(2, '0')}. {m.title}
                </span>
                <span className="mod__count">
                  {real.filter((l) => done[l.id]).length}/{m.lessons.length}
                </span>
              </button>
              {isOpen && (
                <ul className="mod__lessons">
                  {m.lessons.map((l) =>
                    'id' in l ? (
                      <li key={l.id} className={`lesson ${l.id === lesson.id ? 'is-current' : ''}`}>
                        <a
                          href={`#/${l.id}/1`}
                          className={l.id === lesson.id ? 'btn-pop' : ''}
                          onClick={() => setDrawer(false)}
                          aria-current={l.id === lesson.id ? 'page' : undefined}
                        >
                          {done[l.id] ? <Check size={14} className="lesson__mark is-done" /> : <FileText size={14} className="lesson__mark" />}
                          <span className="lesson__title">{l.title}</span>
                        </a>
                      </li>
                    ) : (
                      <li key={l.soon} className="lesson is-soon">
                        <span title="Em breve">
                          <FileText size={14} className="lesson__mark" />
                          <span className="lesson__title">{l.soon}</span>
                          <em>em breve</em>
                        </span>
                      </li>
                    ),
                  )}
                </ul>
              )}
            </div>
          );
        })}
      </nav>
      <div className="card progress">
        <div className="progress__head">
          <span className="eyebrow">Progresso</span>
          <span className="progress__pct">
            {doneCount} / {total}
          </span>
        </div>
        <div className="bar">
          <span style={{ width: `${(doneCount / total) * 100}%` }} />
        </div>
      </div>
    </>
  );

  const navButtons = (
    <div className="guide__nav">
      <button className="btn-ghost" onClick={back} disabled={route.step === 1}>
        <ArrowLeft size={16} /> Voltar
      </button>
      <button className="btn-pop btn-next" onClick={forward} disabled={isLast && !nextLesson}>
        <span className="btn-next__label">{nextLabel}</span>
        <ArrowRight size={16} />
      </button>
    </div>
  );

  return (
    <div className={`window ${full ? 'is-full' : ''}`}>
      <header className="topbar">
        <button className="menu-btn tool" onClick={() => setDrawer(true)} aria-label="Abrir menu">
          <Menu size={18} />
        </button>
        <a className="brand" href="#/">
          <svg className="logo" width="30" height="30" viewBox="0 0 32 32" aria-hidden>
            <g stroke="currentColor" strokeWidth="1.6" strokeLinejoin="round">
              <path d="M16 4l10 5-10 5L6 9z" fill="var(--green)" />
              <path d="M6 9v11l10 5V14z" fill="var(--violet)" />
              <path d="M26 9v11l-10 5V14z" fill="var(--orange)" />
            </g>
            <circle cx="16" cy="9" r="1.9" fill="currentColor" />
          </svg>
          <span className="brand__name">
            AI <span>Engineer</span>
          </span>
        </a>
        <nav className="nav" aria-label="Seções">
          {NAV.map((n) => (
            <button
              key={n.id}
              className={`nav__item ${n.soon ? '' : 'is-active btn-pop'}`}
              onClick={() => n.soon && setToast(n.soon)}
            >
              <n.icon size={16} /> {n.label}
            </button>
          ))}
        </nav>
        <button className="search" onClick={() => setSearch(true)} aria-label="Buscar">
          <Search size={16} />
          <span className="search__hint">Buscar lições e conceitos…</span>
          <kbd>Ctrl K</kbd>
        </button>
        <button className="theme-btn tool" onClick={() => setTheme(theme === 'dark' ? 'light' : 'dark')} aria-label="Trocar tema">
          {theme === 'dark' ? <Sun size={16} /> : <Moon size={16} />}
        </button>
        <a className="credit" href="https://github.com/alexssantos" target="_blank" rel="noreferrer">
          <span className="credit__x">
            <Github size={15} />
          </span>
          <span className="credit__text">
            feito por <b>@alexssantos</b>
          </span>
        </a>
      </header>

      <div className="body">
        <aside className={`sidebar ${drawer ? 'is-open' : ''}`}>
          <div className="drawer-nav">
            {NAV.map((n) => (
              <button
                key={n.id}
                className={`nav__item ${n.soon ? '' : 'is-active btn-pop'}`}
                onClick={() => n.soon && setToast(n.soon)}
              >
                <n.icon size={17} /> {n.label}
              </button>
            ))}
          </div>
          {tree}
          <div className="drawer-foot">
            <a className="credit" href="https://github.com/alexssantos" target="_blank" rel="noreferrer">
              <span className="credit__x">
                <Github size={15} />
              </span>
              <span className="credit__text">
                feito por <b>@alexssantos</b>
              </span>
            </a>
          </div>
        </aside>
        {drawer && <div className="drawer-backdrop" onClick={() => setDrawer(false)} />}

        <main className="sheet">
          <div className="lesson-head">
            <div className="crumb">
              {String(moduleNo).padStart(2, '0')}. {module.title} <span>/</span> Lição {lessonNo} de {module.lessons.length}
            </div>
            <div className="lesson-head__row">
              <h1 className="title">{lesson.title}</h1>
              <div className="tags">
                <span className="tag tag--sand">
                  <Clock size={13} /> {lesson.minutes} min
                </span>
                <span className="tag tag--mint">
                  <BarChart3 size={13} /> {lesson.level}
                </span>
                <span className="tag tag--violet">
                  <ListOrdered size={13} /> {lesson.steps.length} passos
                </span>
              </div>
            </div>
            <p className="subtitle">{lesson.subtitle}</p>
          </div>

          <section className={`card stage ${step.board ? 'has-board' : ''}`}>
            <div className="stage__hud">
              {lesson.hud.map((h) => {
                const v = state.hud[h.id];
                return (
                  <div className="chip" key={h.id} data-level={v?.[1]}>
                    <span className="chip__label">
                      <Icon name={h.icon} size={12} /> {h.label}
                    </span>
                    <span className="chip__value" key={v?.[0]}>
                      {v?.[0] ?? '—'}
                    </span>
                  </div>
                );
              })}
            </div>
            <div className="stage__tools">
              <button className="tool" onClick={() => setReplay((n) => n + 1)} aria-label="Repetir animação">
                <RotateCcw size={14} /> <span>Repetir</span>
              </button>
              <button className={`tool ${paused ? 'is-on' : ''}`} onClick={() => setPaused((p) => !p)} aria-label={paused ? 'Continuar' : 'Pausar'}>
                {paused ? <Play size={14} /> : <Pause size={14} />} <span>{paused ? 'Continuar' : 'Pausar'}</span>
              </button>
              <button className="tool tool--full" onClick={() => setFull((f) => !f)} aria-label="Tela cheia">
                {full ? <Minimize2 size={14} /> : <Maximize2 size={14} />}
              </button>
            </div>
            <div className="stage__canvas">
              <Stage
                lesson={lesson}
                visible={state.visible}
                fresh={fresh}
                hot={step.hot ?? []}
                flows={step.flow ?? []}
                links={step.links ?? []}
                pills={step.pills ?? {}}
                paused={paused}
                runKey={runKey}
              />
            </div>
            {step.board && (
              <div className="board" key={runKey}>
                <div className="board__title">{step.board.title}</div>
                {step.board.items.map((it, i) => (
                  <div className={`board__row ${it.tone ? `is-${it.tone}` : ''}`} key={i} style={{ animationDelay: `${120 + i * 90}ms` }}>
                    <span className="board__text">{it.t}</span>
                    {it.v !== undefined && (
                      <span className="board__bar">
                        <i style={{ width: `${Math.round(it.v * 100)}%` }} />
                      </span>
                    )}
                    {it.v !== undefined && <span className="board__pct">{Math.round(it.v * 100)}%</span>}
                  </div>
                ))}
              </div>
            )}
            <div className="stage__legend">
              <span className="lg lg--req">pedido</span>
              <span className="lg lg--res">resposta</span>
              <span className="lg lg--data">dados</span>
              <span className="lg lg--err">risco</span>
            </div>
          </section>

          <section className="card timeline">
            <div className="timeline__head">
              <span className="eyebrow">Nesta lição</span>
              <span className="timeline__count">
                Passo {route.step} de {lesson.steps.length}
              </span>
            </div>
            <ol className="timeline__steps">
              {lesson.steps.map((s, i) => (
                <li key={i} className={i < stepIdx ? 'is-done' : i === stepIdx ? 'is-current' : ''}>
                  <a href={`#/${lesson.id}/${i + 1}`} aria-label={`Passo ${i + 1}: ${s.nav}`}>
                    <span className="timeline__dot">{i + 1}</span>
                    <span className="timeline__label">{s.nav}</span>
                  </a>
                </li>
              ))}
            </ol>
          </section>
        </main>

        <aside className="rail">
          <section className="card guide">
            <div className="guide__meta">
              <span className="eyebrow">
                Passo {route.step} / {lesson.steps.length}
              </span>
              <span className={`chapter chapter--${chapterTone}`} key={runKey}>
                {chapterLabel}
              </span>
            </div>
            <div className="guide__content" ref={guideRef} key={`${lesson.id}-${route.step}`}>
              <h2 className="guide__title">{step.title}</h2>
              <div className="guide__body">
                {step.body.map((p, i) => (
                  <p key={i}>{rich(p)}</p>
                ))}
              </div>
              {step.callout && (
                <div className={`callout callout--${step.callout.kind}`}>
                  <span className="callout__icon">
                    {step.callout.kind === 'warn' ? <TriangleAlert size={15} /> : step.callout.kind === 'tip' ? <Lightbulb size={15} /> : <Sparkles size={15} />}
                  </span>
                  <div>
                    <div className="callout__title">{step.callout.title}</div>
                    <p>{rich(step.callout.text)}</p>
                  </div>
                </div>
              )}
              {step.changes && (
                <div className="changes">
                  <div className="changes__title">O que mudou</div>
                  {step.changes.map((c) => {
                    const kind = c[0] === '+' ? 'add' : c[0] === '-' ? 'del' : 'mod';
                    return (
                      <div className={`chg chg--${kind}`} key={c}>
                        <b>{kind === 'add' ? '+' : kind === 'del' ? '−' : '~'}</b>
                        <span>{c.slice(1).trim()}</span>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
            {navButtons}
            <div className="guide__hint">
              <Keyboard size={13} /> <kbd>←</kbd>
              <kbd>→</kbd> passo · <kbd>R</kbd> repetir · <kbd>Espaço</kbd> pausar
            </div>
          </section>

          <section className="card learn">
            <span className="eyebrow">Você vai aprender</span>
            <ul>
              {lesson.learn.map((item, i) => (
                <li key={item} className={i < state.learn ? 'is-on' : ''}>
                  <span className={`check ${i < state.learn ? 'is-on' : ''}`}>
                    <Check size={12} strokeWidth={3} />
                  </span>
                  {item}
                </li>
              ))}
            </ul>
          </section>
          <p className="colophon">
            Conteúdo e código de Alex Santos. Formato de lição inspirado no curso Designed to Scale, de Dilum Sanjaya.
          </p>
        </aside>
      </div>

      <div className="dock">{navButtons}</div>

      {toast && (
        <div className="toast" role="status">
          <Settings size={15} /> {toast}
        </div>
      )}
      {search && <SearchDialog onClose={() => setSearch(false)} onGo={go} />}
    </div>
  );
}

function SearchDialog({ onClose, onGo }: { onClose: () => void; onGo: (id: string, n: number) => void }) {
  const [q, setQ] = useState('');
  const [sel, setSel] = useState(0);
  const norm = (s: string) => s.normalize('NFD').replace(/[̀-ͯ]/g, '').toLowerCase();
  const results = useMemo(() => {
    const needle = norm(q.trim());
    const out: { id: string; step: number; title: string; where: string }[] = [];
    for (const l of lessons) {
      const { module } = lessonIndex[l.id];
      if (!needle || norm(l.title + ' ' + l.subtitle).includes(needle)) out.push({ id: l.id, step: 1, title: l.title, where: module.title });
      if (needle)
        l.steps.forEach((s, i) => {
          if (norm(s.title + ' ' + s.body.join(' ')).includes(needle)) out.push({ id: l.id, step: i + 1, title: s.title, where: `${l.title} · passo ${i + 1}` });
        });
    }
    return out.slice(0, 30);
  }, [q]);
  useEffect(() => setSel(0), [q]);
  const pick = (r: (typeof results)[number]) => {
    onGo(r.id, r.step);
    onClose();
  };
  return (
    <div className="sx" role="dialog" aria-modal="true" aria-label="Buscar">
      <div className="sx__backdrop" onClick={onClose} />
      <div className="sx__dialog card">
        <div className="sx__bar">
          <Search size={17} />
          <input
            autoFocus
            className="sx__input"
            placeholder="Buscar lições e conceitos…"
            value={q}
            onChange={(e) => setQ(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'ArrowDown') { e.preventDefault(); setSel((s) => Math.min(results.length - 1, s + 1)); }
              if (e.key === 'ArrowUp') { e.preventDefault(); setSel((s) => Math.max(0, s - 1)); }
              if (e.key === 'Enter' && results[sel]) pick(results[sel]);
            }}
          />
          <button className="sx__esc" onClick={onClose}>
            Esc
          </button>
        </div>
        <ul className="sx__list">
          {results.map((r, i) => (
            <li key={`${r.id}-${r.step}-${i}`}>
              <button className={i === sel ? 'is-sel' : ''} onMouseEnter={() => setSel(i)} onClick={() => pick(r)}>
                <FileText size={15} />
                <span>
                  <b>{r.title}</b>
                  <small>{r.where}</small>
                </span>
              </button>
            </li>
          ))}
          {results.length === 0 && <li className="sx__empty">Nada encontrado para “{q}”.</li>}
        </ul>
        <div className="sx__foot">
          <span>{results.length} resultados</span>
          <span>↑ ↓ navegar · Enter abrir</span>
        </div>
      </div>
    </div>
  );
}
