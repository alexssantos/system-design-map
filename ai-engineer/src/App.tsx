import { useCallback, useEffect, useLayoutEffect, useMemo, useRef, useState, type CSSProperties, type ReactNode } from 'react';
import {
  ArrowLeft, ArrowRight, BarChart3, BookOpen, Check, ChevronRight, Clock, FileText, Github, Keyboard, LayoutGrid,
  Lightbulb, ListOrdered, Maximize2, Menu, Minimize2, Moon, Pause, Play, RotateCcw, Search, Settings, Sparkles, Sun,
  TriangleAlert, AppWindow, X, Globe, ChevronDown, Scan,
} from 'lucide-react';
import { flushSync } from 'react-dom';
import { modules, lessons, lessonIndex } from './course';
import type { Ent, Lesson, Level, Step } from './types';
import { Stage, type StageScene } from './Stage';
import { inherited } from './wiring';
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
  const over: Record<string, Partial<Ent>> = {};
  let learn = 0;
  for (let i = 0; i <= upto; i++) {
    const s = lesson.steps[i];
    for (const id of s.rm ?? []) {
      const at = visible.indexOf(id);
      if (at >= 0) visible.splice(at, 1);
    }
    for (const id of s.add ?? []) if (!visible.includes(id)) visible.push(id);
    for (const [k, v] of Object.entries(s.hud ?? {})) hud[k] = typeof v === 'string' ? [v, undefined] : v;
    for (const [k, v] of Object.entries(s.set ?? {})) over[k] = { ...over[k], ...v };
    if (s.learn !== undefined) learn = s.learn;
  }
  return { visible, hud, learn, over };
}

function loadDone(): Record<string, boolean> {
  try {
    return JSON.parse(localStorage.getItem('aie-done') ?? '{}');
  } catch {
    return {};
  }
}

/** reinicia a animação de entrada do elemento a cada mudança de dep, sem remontá-lo (mantém as transições) */
function useFresh<T extends HTMLElement>(dep: unknown) {
  const ref = useRef<T>(null);
  const first = useRef(true);
  useLayoutEffect(() => {
    const el = ref.current;
    if (!el) return;
    if (first.current) {
      first.current = false;
      return;
    }
    el.classList.remove('is-fresh');
    void el.offsetWidth;
    el.classList.add('is-fresh');
  }, [dep]);
  return ref;
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
  const [zoomed, setZoomed] = useState(false);
  const [fitKey, setFitKey] = useState(0);
  const [toast, setToast] = useState('');
  const [done, setDone] = useState(loadDone);
  const [progOpen, setProgOpen] = useState(() => {
    try {
      return localStorage.getItem('aie-progress-open') === '1';
    } catch {
      return false;
    }
  });
  const toggleProg = () =>
    setProgOpen((o) => {
      try {
        localStorage.setItem('aie-progress-open', o ? '0' : '1');
      } catch {
        /* sem armazenamento */
      }
      return !o;
    });
  const guideRef = useRef<HTMLDivElement>(null);
  const winRef = useRef<HTMLDivElement>(null);
  const lastPos = useRef({ id: '', step: 0 });
  const slide = useMemo(() => {
    const p = lastPos.current;
    const v = p.id === route.id && route.step < p.step ? -14 : 14;
    lastPos.current = { id: route.id, step: route.step };
    return v;
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [route.id, route.step]);
  const [lang, setLang] = useState(false);

  // no desktop a janela inteira é desenhada para 1672x920 e escalada para caber na tela
  useLayoutEffect(() => {
    const fit = () => {
      const el = winRef.current;
      if (!el) return;
      const w = innerWidth;
      const h = innerHeight;
      const desk = w >= 1200 && h >= 560;
      document.documentElement.dataset.layout = desk ? 'desktop' : w >= 821 ? 'tablet' : 'stack';
      if (desk) {
        const z = Math.min(1, w / 1672, h / 920);
        el.style.zoom = String(z);
        el.style.width = `${w / z}px`;
        el.style.height = `${h / z}px`;
      } else {
        el.style.zoom = '';
        el.style.width = '';
        el.style.height = '';
      }
    };
    fit();
    addEventListener('resize', fit);
    return () => removeEventListener('resize', fit);
  }, []);

  const { lesson, module, moduleNo, lessonNo } = lessonIndex[route.id];
  const stepIdx = route.step - 1;
  // como no original: cabeçalho, chips, legenda, linha do tempo e lista entram de novo a cada passo
  const freshKey = `${route.id}/${route.step}`;
  const headRef = useFresh<HTMLDivElement>(freshKey);
  const hudRef = useFresh<HTMLDivElement>(freshKey);
  const legendRef = useFresh<HTMLDivElement>(freshKey);
  const tlRef = useFresh<HTMLElement>(freshKey);
  const learnRef = useFresh<HTMLElement>(freshKey);
  const step = lesson.steps[stepIdx];
  // ligações do passo mais as tracejadas herdadas, para nenhum objeto ficar solto
  const wiredLinks = useMemo(() => [...(step.links ?? []), ...inherited(lesson, stepIdx)], [lesson, stepIdx, step]);
  const state = useMemo(() => fold(lesson, stepIdx), [lesson, stepIdx]);
  // o passo anterior, de onde o Repetir parte (como no original)
  const fromScene = useMemo<StageScene | undefined>(() => {
    if (stepIdx === 0) return undefined;
    const p = fold(lesson, stepIdx - 1);
    const ps = lesson.steps[stepIdx - 1];
    return { visible: p.visible, over: p.over, links: [...(ps.links ?? []), ...inherited(lesson, stepIdx - 1)], flows: ps.flow ?? [], pills: ps.pills ?? {}, idle: ps.idle ?? [] };
  }, [lesson, stepIdx]);

  useEffect(() => {
    const on = () => setRoute(parseHash());
    addEventListener('hashchange', on);
    return () => removeEventListener('hashchange', on);
  }, []);

  /** troca de tema como no original: o tema novo cresce num círculo a partir do botão */
  const switchTheme = (btn: HTMLElement) => {
    const next = theme === 'dark' ? 'light' : 'dark';
    const apply = () => {
      document.documentElement.setAttribute('data-theme', next);
      flushSync(() => setTheme(next));
    };
    const doc = document as Document & { startViewTransition?: (cb: () => void) => { ready: Promise<void> } };
    if (!doc.startViewTransition || matchMedia('(prefers-reduced-motion: reduce)').matches) {
      apply();
      return;
    }
    const r = btn.getBoundingClientRect();
    const x = r.left + r.width / 2;
    const y = r.top + r.height / 2;
    const end = Math.hypot(Math.max(x, innerWidth - x), Math.max(y, innerHeight - y));
    doc.startViewTransition(apply).ready.then(() => {
      document.documentElement.animate(
        { clipPath: [`circle(0px at ${x}px ${y}px)`, `circle(${end}px at ${x}px ${y}px)`] },
        { duration: 560, easing: 'cubic-bezier(0.4, 0, 0.2, 1)', pseudoElement: '::view-transition-new(root)' },
      );
    });
  };

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
    saveRecent(lesson.id, route.step);
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
      if (e.key === '0') setFitKey((n) => n + 1);
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
        <svg width="22" height="18" viewBox="0 0 20 16" aria-hidden>
          <path d="M1 3a2 2 0 0 1 2-2h4.3l2 2.2H17a2 2 0 0 1 2 2V13a2 2 0 0 1-2 2H3a2 2 0 0 1-2-2Z" fill="currentColor" />
        </svg>
        <span>Curso</span>
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
                          {done[l.id] ? <Check size={15} className="lesson__mark is-done" /> : <FileText size={15} className="lesson__mark" />}
                          <span className="lesson__title">{l.title}</span>
                        </a>
                      </li>
                    ) : (
                      <li key={l.soon} className="lesson is-soon">
                        <span title="Em breve">
                          <FileText size={15} className="lesson__mark" />
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
      <section className={`card progress ${progOpen ? 'is-open' : ''}`}>
        <button className="progress__head" type="button" aria-expanded={progOpen} aria-controls="progress-body" onClick={toggleProg}>
          <span className="eyebrow">Progresso</span>
          <span className="progress__pct">
            {doneCount} / {total}
          </span>
          <ChevronRight size={14} strokeWidth={2.2} className="progress__chev" aria-hidden />
        </button>
        <div className="progress__body" id="progress-body">
          <div className="progress__clip">
            <div className="bar">
              <span style={{ width: `${Math.round((doneCount / total) * 100)}%` }} />
            </div>
            <ul className="progress__list">
              {modules.map((m) => {
                const real = m.lessons.filter((l): l is Lesson => 'id' in l);
                const n = real.filter((l) => done[l.id]).length;
                const state = n > 0 && n === m.lessons.length ? 'is-on' : n > 0 ? 'is-part' : '';
                return (
                  <li key={m.id}>
                    <span className={`check ${state}`}>
                      <Check size={11} strokeWidth={3} aria-hidden />
                    </span>
                    <span className="progress__label">{m.title}</span>
                    <span className="progress__count">
                      {n}/{m.lessons.length}
                    </span>
                  </li>
                );
              })}
            </ul>
          </div>
        </div>
      </section>
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
    <div className={`window ${full ? 'is-full' : ''}`} ref={winRef}>
      <header className="topbar">
        <button className="menu-btn tool" onClick={() => setDrawer(true)} aria-label="Abrir menu">
          <Menu size={18} />
        </button>
        <a className="brand" href="#/">
          {/* robô: cabeça violeta, antena verde, tela clara com olhos */}
          <svg className="logo" width="30" height="30" viewBox="0 0 32 32" aria-hidden>
            <g stroke="currentColor" strokeWidth="1.7" strokeLinejoin="round" strokeLinecap="round">
              <path d="M16 7V4.4" fill="none" />
              <circle cx="16" cy="3.3" r="1.9" fill="#a9d99a" />
              <rect x="2.4" y="13" width="3" height="6.4" rx="1.3" fill="#fcd4ad" />
              <rect x="26.6" y="13" width="3" height="6.4" rx="1.3" fill="#fcd4ad" />
              <rect x="5" y="7" width="22" height="18.4" rx="5.2" fill="#cbbae6" />
              <rect x="8.6" y="11" width="14.8" height="9.6" rx="3.2" fill="#fbf6ef" />
              <path d="M13.4 18.1q2.6 1.5 5.2 0" fill="none" />
              <path d="M11.5 25.4v2.4h9v-2.4" fill="#a9d99a" />
            </g>
            <circle cx="12.9" cy="14.9" r="1.45" fill="#2a2520" />
            <circle cx="19.1" cy="14.9" r="1.45" fill="#2a2520" />
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
              <n.icon size={17} /> {n.label}
            </button>
          ))}
        </nav>
        <button className="search" onClick={() => setSearch(true)} aria-label="Buscar">
          <Search size={16} />
          <span className="search__hint">Buscar lições e conceitos…</span>
          <kbd>Ctrl K</kbd>
        </button>
        <div className="lang">
          <button className={`lang__btn ${lang ? 'is-open' : ''}`} onClick={() => setLang((v) => !v)} aria-haspopup="menu" aria-expanded={lang} aria-label="Idioma">
            <Globe size={15} /> PT <ChevronDown size={14} className="lang__chev" />
          </button>
          {lang && (
            <div className="lang__menu" role="menu">
              <div className="lang__head">Idioma</div>
              <button className="lang__item is-on" role="menuitem" onClick={() => setLang(false)}>
                <span className="lang__tile">PT</span>
                <span className="lang__names">
                  <b>Português</b>
                  <span>Brasil</span>
                </span>
              </button>
              <button
                className="lang__item"
                role="menuitem"
                onClick={() => {
                  setLang(false);
                  setToast('A versão em inglês chega em breve');
                }}
              >
                <span className="lang__tile">EN</span>
                <span className="lang__names">
                  <b>English</b>
                  <span>Inglês</span>
                </span>
                <span className="lang__soon">em breve</span>
              </button>
            </div>
          )}
        </div>
        <button className="theme-btn" onClick={(ev) => switchTheme(ev.currentTarget)} aria-label={theme === 'dark' ? 'Mudar para o tema claro' : 'Mudar para o tema escuro'}>
          {theme === 'dark' ? <Sun size={16} /> : <Moon size={16} />}
        </button>
        <a className="credit" href="https://github.com/alexssantos" target="_blank" rel="noreferrer" title="Alex Santos no GitHub">
          <span className="credit__x">
            <Github size={15} />
          </span>
          <span className="credit__text">
            <small>feito por</small>
            <b>
              <span>@alexssantos</span>
            </b>
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
                <small>feito por</small>
                <b>
                  <span>@alexssantos</span>
                </b>
              </span>
            </a>
          </div>
        </aside>
        {drawer && <div className="drawer-backdrop" onClick={() => setDrawer(false)} />}

        <main className="sheet">
          <div className="lesson-head is-fresh" ref={headRef}>
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
            <div className="stage__hud is-fresh" ref={hudRef}>
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
              {zoomed && (
                <button className="tool tool--fit" onClick={() => setFitKey((n) => n + 1)} title="Voltar ao diagrama inteiro (0)">
                  <Scan size={14} /> <span>Ajustar</span>
                </button>
              )}
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
                hot={step.hot ?? []}
                flows={step.flow ?? []}
                links={wiredLinks}
                idle={step.idle ?? []}
                pills={step.pills ?? {}}
                paused={paused}
                runKey={runKey}
                over={state.over}
                from={fromScene}
                replay={replay}
                fitKey={fitKey}
                onZoom={setZoomed}
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
            <div className="stage__legend is-fresh" ref={legendRef}>
              <span className="lg lg--req">pedido</span>
              <span className="lg lg--res">resposta</span>
              <span className="lg lg--data">dados</span>
              <span className="lg lg--err">risco</span>
            </div>
          </section>

          <section className="card timeline is-fresh" ref={tlRef}>
            <div className="timeline__head">
              <span className="eyebrow">Nesta lição</span>
              <span className="timeline__count">
                Passo {route.step} de {lesson.steps.length}
              </span>
            </div>
            <div className="timeline__track" style={{ '--n': lesson.steps.length } as CSSProperties}>
              <div className="timeline__rail">
                <span style={{ width: `${lesson.steps.length > 1 ? (stepIdx / (lesson.steps.length - 1)) * 100 : 0}%` }} />
              </div>
              <ol className="timeline__steps">
                {lesson.steps.map((s, i) => (
                  <li key={i} className={i < stepIdx ? 'is-done' : i === stepIdx ? 'is-current' : ''}>
                    <a href={`#/${lesson.id}/${i + 1}`} title={s.title} aria-label={`Passo ${i + 1}: ${s.nav}`} aria-current={i === stepIdx ? 'step' : undefined}>
                      <span className="timeline__dot">{i + 1}</span>
                      <span className="timeline__label">{s.nav}</span>
                    </a>
                  </li>
                ))}
              </ol>
            </div>
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
            <div className="guide__content" ref={guideRef} key={`${lesson.id}-${route.step}`} style={{ ['--slide' as string]: `${slide}px` }}>
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

          <section className="card learn is-fresh" ref={learnRef}>
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
      {search && <SearchDialog onClose={() => setSearch(false)} onGo={go} done={done} />}
    </div>
  );
}

function loadRecent(): { id: string; step: number }[] {
  try {
    const v = JSON.parse(localStorage.getItem('aie-recent') ?? '[]');
    return Array.isArray(v) ? v.filter((r) => r && lessonIndex[r.id]) : [];
  } catch {
    return [];
  }
}

function saveRecent(id: string, step: number) {
  try {
    const next = [{ id, step }, ...loadRecent().filter((r) => r.id !== id)].slice(0, 4);
    localStorage.setItem('aie-recent', JSON.stringify(next));
  } catch {
    /* armazenamento indisponível */
  }
}

type Hit =
  | { kind: 'lesson'; id: string; step: number; title: string; text: string; meta?: string; color: string }
  | { kind: 'step'; id: string; step: number; title: string; text: string; meta: string };

function FolderGlyph({ color }: { color: string }) {
  return (
    <svg className="folder" width="20" height="16" viewBox="0 0 20 16" aria-hidden style={{ color }}>
      <path d="M1 3a2 2 0 0 1 2-2h4.2l2 2.3H17a2 2 0 0 1 2 2V13a2 2 0 0 1-2 2H3a2 2 0 0 1-2-2Z" />
      <path className="folder__lip" d="M1 6.3h18" />
    </svg>
  );
}

const TOTAL_STEPS = lessons.reduce((n, l) => n + l.steps.length, 0);
const SUGGEST = ['RAG', 'agente', 'cache', 'evals', 'tokens', 'injeção'];

function SearchDialog({ onClose, onGo, done }: { onClose: () => void; onGo: (id: string, n: number) => void; done: Record<string, boolean> }) {
  const [q, setQ] = useState('');
  const [sel, setSel] = useState(0);
  const listRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const norm = (s: string) => s.normalize('NFD').replace(/[̀-ͯ]/g, '').toLowerCase();
  const needle = norm(q.trim());

  // grupos: sem busca, recentes e módulos; com busca, lições e passos
  const groups = useMemo(() => {
    const out: { title: string; side: string; hits: Hit[] }[] = [];
    const lessonHit = (l: Lesson, step = 1, text?: string, withMeta = false): Hit => {
      const { module, moduleNo } = lessonIndex[l.id];
      return {
        kind: 'lesson',
        id: l.id,
        step,
        title: l.title,
        text: text ?? l.subtitle,
        meta: withMeta ? `${String(moduleNo).padStart(2, '0')} · ${module.title}` : undefined,
        color: module.color,
      };
    };
    if (!needle) {
      const rec = loadRecent();
      if (rec.length)
        out.push({
          title: 'Recentes',
          side: String(rec.length),
          hits: rec.map((r) => {
            const l = lessonIndex[r.id].lesson;
            return lessonHit(l, r.step, `Continuar no passo ${r.step}: ${l.steps[r.step - 1]?.title ?? ''}`, true);
          }),
        });
      modules.forEach((m, mi) => {
        const real = m.lessons.filter((l): l is Lesson => 'id' in l);
        if (!real.length) return;
        out.push({
          title: `${String(mi + 1).padStart(2, '0')} · ${m.title}`,
          side: `${real.filter((l) => done[l.id]).length}/${m.lessons.length} feitos`,
          hits: real.map((l) => lessonHit(l)),
        });
      });
      return out;
    }
    const ls = lessons.filter((l) => norm(l.title + ' ' + l.subtitle).includes(needle)).map((l) => lessonHit(l, 1, undefined, true));
    if (ls.length) out.push({ title: 'Lições', side: String(ls.length), hits: ls });
    const st: Hit[] = [];
    for (const l of lessons)
      l.steps.forEach((s2, i) => {
        if (norm(s2.title + ' ' + s2.body.join(' ')).includes(needle))
          st.push({ kind: 'step', id: l.id, step: i + 1, title: s2.title, text: s2.body[0].replace(/\*\*|`/g, ''), meta: l.title });
      });
    if (st.length) out.push({ title: 'Passos', side: String(st.length), hits: st.slice(0, 24) });
    return out;
  }, [needle, done]);

  const flat = groups.flatMap((g) => g.hits);
  useEffect(() => setSel(0), [needle]);
  useEffect(() => {
    listRef.current?.querySelector('.is-sel')?.scrollIntoView({ block: 'nearest' });
  }, [sel]);
  const pick = (h: Hit) => {
    onGo(h.id, h.step);
    onClose();
  };

  // realça o trecho buscado
  const mark = (text: string) => {
    if (!needle) return text;
    const i = norm(text).indexOf(needle);
    if (i < 0) return text;
    return (
      <>
        {text.slice(0, i)}
        <mark>{text.slice(i, i + needle.length)}</mark>
        {text.slice(i + needle.length)}
      </>
    );
  };

  let n = -1;
  return (
    <div className="sx is-open" role="dialog" aria-modal="true" aria-label="Buscar">
      <div className="sx__backdrop" onClick={onClose} />
      <div className="sx__dialog">
        <div className="sx__bar">
          <Search size={19} className="sx__glass" />
          <input
            ref={inputRef}
            autoFocus
            className="sx__input"
            placeholder="Buscar lições, conceitos, passos…"
            value={q}
            onChange={(e) => setQ(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'ArrowDown') {
                e.preventDefault();
                setSel((v) => Math.min(flat.length - 1, v + 1));
              }
              if (e.key === 'ArrowUp') {
                e.preventDefault();
                setSel((v) => Math.max(0, v - 1));
              }
              if (e.key === 'Enter' && flat[sel]) pick(flat[sel]);
            }}
          />
          {q && (
            <button className="sx__clear" onClick={() => { setQ(''); inputRef.current?.focus(); }}>
              limpar
            </button>
          )}
          <button className="sx__esc" onClick={onClose} aria-label="Fechar">
            esc
          </button>
        </div>
        <div className="sx__list" ref={listRef}>
          {groups.map((g) => (
            <div key={g.title}>
              <div className="sx__group">
                <span>{g.title}</span>
                <span>{g.side}</span>
              </div>
              {g.hits.map((h) => {
                n += 1;
                const i = n;
                const l = lessonIndex[h.id].lesson;
                return (
                  <button
                    key={`${g.title}-${h.id}-${h.step}`}
                    className={`sx__item ${i === sel ? 'is-sel' : ''}`}
                    onMouseMove={() => sel !== i && setSel(i)}
                    onClick={() => pick(h)}
                  >
                    {h.kind === 'lesson' ? (
                      <span className="sx__icon sx__icon--lesson">
                        <FolderGlyph color={h.color} />
                      </span>
                    ) : (
                      <span className="sx__icon sx__icon--step">{h.step}</span>
                    )}
                    <span className="sx__main">
                      <span className="sx__title">
                        {mark(h.title)}
                        {h.meta && <span className="sx__meta">{h.meta}</span>}
                      </span>
                      <span className="sx__text">{mark(h.text)}</span>
                    </span>
                    <span className="sx__side">
                      {h.kind === 'lesson' ? (
                        <span className={`sx__steps ${done[h.id] ? 'sx__done' : ''}`}>{done[h.id] ? 'feita' : `${l.steps.length} passos`}</span>
                      ) : (
                        <span className="sx__kind">passo</span>
                      )}
                      <kbd className="sx__enter">↵</kbd>
                    </span>
                  </button>
                );
              })}
            </div>
          ))}
          {flat.length === 0 && (
            <div className="sx__empty">
              <div className="sx__empty-title">Nada encontrado para “{q}”</div>
              <p>Tente um termo mais curto, ou um destes:</p>
              <div className="sx__chips">
                {SUGGEST.map((w) => (
                  <button key={w} onClick={() => setQ(w)}>
                    {w}
                  </button>
                ))}
              </div>
            </div>
          )}
        </div>
        <div className="sx__foot">
          <span>
            <kbd>↑</kbd>
            <kbd>↓</kbd> mover
          </span>
          <span>
            <kbd>↵</kbd> abrir
          </span>
          <span>
            <kbd>esc</kbd> fechar
          </span>
          <span className="sx__count">
            {lessons.length} lições · {TOTAL_STEPS} passos
          </span>
        </div>
      </div>
    </div>
  );
}
