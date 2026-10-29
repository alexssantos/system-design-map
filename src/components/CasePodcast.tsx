import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { DiagramView } from '../diagrams/DiagramView';
import type { Diagram } from '../diagrams/types';
import type { PodcastTiming } from '../podcasts/types';
import { versionOf } from '../diagrams/data';
import { audioVersions, episodeFor, firstTurnWith, hosts, revealedAt, spoken, turnAt, type Episode } from '../podcasts';
import { Alert, Avatar, Button, IconButton, Slider, Switch, Waveform } from '../ui-kit';
import { PodcastTranscript, type PodcastSegment } from './kit/PodcastTranscript';
import './CasePodcast.css';

const clock = (s: number) => `${Math.floor(s / 60)}:${String(Math.floor(s % 60)).padStart(2, '0')}`;

/** Há roteiro para essa versão do diagrama (com ou sem áudio)? */
export const hasPodcast = (caseId: string, version: number) => Boolean(episodeFor(caseId, version));
/** O roteiro dessa versão já tem áudio gravado? */
export const hasAudio = (caseId: string, version: number) => Boolean(episodeFor(caseId, version)?.timing);

/** Num roteiro que monta o diagrama aos poucos, o que ainda não apareceu até a fala i. */
function hiddenAt(ep: Episode, diagram: Diagram, i: number): string[] {
  if (i < 0) return [];
  const shown = revealedAt(ep, i);
  if (!shown) return [];
  return [...diagram.components.map((c) => c.id), ...diagram.notes.map((_, n) => `note-${n}`)].filter((id) => !shown.has(id));
}

function useSegments(ep: Episode, time: (i: number) => string) {
  return useMemo<PodcastSegment[]>(
    () =>
      ep.turns.map((t, i) => ({
        time: time(i),
        speaker: hosts[t.host].name,
        speakerClass: `is-${t.host}`,
        text: spoken(t.text),
        chapter: i === 0 || ep.turns[i - 1].chapter !== t.chapter ? ep.script.chapters[t.chapter].title : undefined,
      })),
    [ep],
  );
}

function Head({ ep, eyebrow, speaking }: { ep: Episode; eyebrow: string; speaking?: string }) {
  return (
    <div className="pc__head">
      <div className="pc__eyebrow tl-caps">{eyebrow}</div>
      <h3 className="pc__title">{ep.script.title}</h3>
      <div className="pc__hosts">
        {Object.values(hosts).map((h) => (
          <span key={h.id} className={`pc__host${speaking === h.id ? ' is-speaking' : ''}`} title={h.role}>
            <Avatar name={h.name} size={28} className={`is-${h.id}`} />
            <span>
              <b>{h.name}</b>
              <small>{h.role}</small>
            </span>
          </span>
        ))}
      </div>
    </div>
  );
}

function ChapterNav({ ep, chapter, onJump }: { ep: Episode; chapter: number; onJump: (d: number) => void }) {
  return (
    <div className="pc__chapter">
      <IconButton icon="chevron-left" label="Capítulo anterior" size="sm" onClick={() => onJump(-1)} disabled={chapter === 0} />
      <div className="pc__chapter-name">
        <small className="tl-num">
          Capítulo {chapter + 1} de {ep.script.chapters.length}
        </small>
        {ep.script.chapters[chapter].title}
      </div>
      <IconButton
        icon="chevron-right"
        label="Próximo capítulo"
        size="sm"
        onClick={() => onJump(1)}
        disabled={chapter === ep.script.chapters.length - 1}
      />
    </div>
  );
}

/** Estado do áudio: tempo atual (suave enquanto toca), play/pause, velocidade e busca. */
function usePlayer(ep: Episode & { timing: PodcastTiming }) {
  const audio = useRef<HTMLAudioElement>(null);
  const [time, setTime] = useState(0);
  const [playing, setPlaying] = useState(false);
  const [rate, setRate] = useState(1);

  useEffect(() => {
    if (!playing) return;
    let raf = 0;
    const tick = () => {
      setTime(audio.current?.currentTime ?? 0);
      raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, [playing]);

  useEffect(() => {
    if (audio.current) audio.current.playbackRate = rate;
  }, [rate]);

  const seek = useCallback(
    (t: number, play = true) => {
      const a = audio.current;
      if (!a) return;
      a.currentTime = Math.max(0, Math.min(ep.timing.duration, t));
      setTime(a.currentTime);
      if (play) void a.play();
    },
    [ep],
  );
  const toggle = () => {
    const a = audio.current;
    if (a) void (a.paused ? a.play() : a.pause());
  };

  const el = (
    <audio
      ref={audio}
      src={`${import.meta.env.BASE_URL}${ep.timing.audio}`}
      preload="metadata"
      onPlay={() => setPlaying(true)}
      onPause={() => setPlaying(false)}
      onEnded={() => setPlaying(false)}
      onSeeked={(e) => setTime(e.currentTarget.currentTime)}
    />
  );
  return { el, time, playing, rate, setRate, seek, toggle };
}

/**
 * Diagrama do caso com o episódio do podcast ao lado. Com áudio, o que está sendo explicado acende no diagrama
 * e clicar numa fala ou peça leva o áudio até ela. Sem áudio (roteiro novo ainda não gravado), o roteiro
 * é percorrido fala a fala e o aviso aponta a versão que tem áudio.
 */
export function CasePodcast({ diagram, colorMode, onVersion }: { diagram: Diagram; colorMode: 'dark' | 'light'; onVersion?: (v: number) => void }) {
  const ep = episodeFor(diagram.caseId, versionOf(diagram))!;
  return ep.timing ? (
    <AudioEpisode ep={ep as Episode & { timing: PodcastTiming }} diagram={diagram} colorMode={colorMode} />
  ) : (
    <ScriptEpisode ep={ep} diagram={diagram} colorMode={colorMode} onVersion={onVersion} />
  );
}

function AudioEpisode({ ep, diagram, colorMode }: { ep: Episode & { timing: PodcastTiming }; diagram: Diagram; colorMode: 'dark' | 'light' }) {
  const p = usePlayer(ep);
  const [follow, setFollow] = useState(true);
  const started = p.time > 0 || p.playing;
  const idx = turnAt(ep, p.time);
  const turn = ep.turns[idx];
  const segments = useSegments(ep, (i) => clock(ep.turns[i].start));

  const seekTurn = (i: number) => p.seek(ep.turns[i].start);
  const pick = (id: string) => {
    const i = firstTurnWith(ep, id);
    if (i >= 0) seekTurn(i);
  };
  const chapterJump = (d: number) => {
    const c = Math.max(0, Math.min(ep.chapterStart.length - 1, turn.chapter + d));
    p.seek(ep.chapterStart[c]);
  };

  const onWaveClick = (e: React.MouseEvent<HTMLDivElement>) => {
    const r = e.currentTarget.getBoundingClientRect();
    p.seek(((e.clientX - r.left) / r.width) * ep.timing.duration);
  };
  const onWaveKey = (e: React.KeyboardEvent) => {
    if (e.key === 'ArrowRight') p.seek(p.time + 10, p.playing);
    else if (e.key === 'ArrowLeft') p.seek(p.time - 10, p.playing);
    else return;
    e.preventDefault();
  };

  return (
    <div className="pc-layout">
      <div className="pc-layout__diagram">
        <DiagramView
          diagram={diagram}
          colorMode={colorMode}
          focus={started ? turn.focus : []}
          hidden={started ? hiddenAt(ep, diagram, idx) : []}
          follow={follow && started}
          onPick={pick}
        />
      </div>
      <aside className="pc" aria-label="Episódio do podcast">
        {p.el}
        <Head ep={ep} eyebrow={`Podcast · v${versionOf(diagram)} · ${clock(ep.timing.duration)}`} speaking={started && p.playing ? turn.host : undefined} />

        <div className="pc__player">
          <IconButton icon={p.playing ? 'pause' : 'play'} label={p.playing ? 'Pausar' : 'Ouvir'} variant="solid" onClick={p.toggle} />
          <div
            className="pc__wave"
            role="slider"
            tabIndex={0}
            aria-label="Posição do áudio"
            aria-valuemin={0}
            aria-valuemax={Math.round(ep.timing.duration)}
            aria-valuenow={Math.round(p.time)}
            aria-valuetext={clock(p.time)}
            onClick={onWaveClick}
            onKeyDown={onWaveKey}
          >
            <Waveform levels={ep.timing.levels} bars={ep.timing.levels.length} height={32} progress={p.time / ep.timing.duration} />
          </div>
          <span className="pc__clock tl-num">
            {clock(p.time)} / {clock(ep.timing.duration)}
          </span>
        </div>

        <ChapterNav ep={ep} chapter={turn.chapter} onJump={chapterJump} />

        <div className="pc__controls">
          <Slider label="Velocidade" value={p.rate} onChange={p.setRate} min={0.75} max={2} step={0.25} format={(v) => `${v}×`} />
          <Switch checked={follow} onChange={setFollow} label="Câmera acompanha a conversa" />
        </div>

        <div className="pc__tx">
          <PodcastTranscript segments={segments} activeIndex={started ? idx : -1} onSeek={seekTurn} follow={p.playing} />
        </div>
      </aside>
    </div>
  );
}

/** Roteiro sem áudio: percorre as falas com os botões, clicando numa fala ou numa peça do diagrama. */
function ScriptEpisode({ ep, diagram, colorMode, onVersion }: { ep: Episode; diagram: Diagram; colorMode: 'dark' | 'light'; onVersion?: (v: number) => void }) {
  const [idx, setIdx] = useState(-1);
  const [follow, setFollow] = useState(true);
  const turn = idx >= 0 ? ep.turns[idx] : undefined;
  const chapter = turn?.chapter ?? 0;
  const withAudio = audioVersions(diagram.caseId).filter((v) => v !== versionOf(diagram));
  const segments = useSegments(ep, (i) => String(i + 1).padStart(2, '0'));

  const go = (i: number) => setIdx(Math.max(0, Math.min(ep.turns.length - 1, i)));
  const pick = (id: string) => {
    const i = firstTurnWith(ep, id);
    if (i >= 0) go(i);
  };
  const chapterJump = (d: number) => go(ep.chapterFirst[Math.max(0, Math.min(ep.chapterFirst.length - 1, chapter + d))]);

  return (
    <div className="pc-layout">
      <div className="pc-layout__diagram">
        <DiagramView
          diagram={diagram}
          colorMode={colorMode}
          focus={turn?.focus ?? []}
          hidden={hiddenAt(ep, diagram, idx)}
          follow={follow && Boolean(turn)}
          onPick={pick}
        />
      </div>
      <aside className="pc" aria-label="Roteiro do podcast">
        <Head ep={ep} eyebrow={`Roteiro · v${versionOf(diagram)} · sem áudio`} />

        <Alert
          className="pc__noaudio"
          tone="info"
          icon="mic-off"
          title={`Áudio da v${versionOf(diagram)} ainda não gravado`}
          text={
            withAudio.length
              ? `O roteiro já está atualizado. O áudio está disponível na ${withAudio.map((v) => `v${v}`).join(', ')}.`
              : 'O roteiro já está atualizado; o áudio ainda não existe.'
          }
          action={
            withAudio.length > 0 &&
            onVersion && (
              <Button variant="light" size="sm" icon="waveform" onClick={() => onVersion(withAudio[0])}>
                Ouvir a v{withAudio[0]}
              </Button>
            )
          }
        />

        <div className="pc__player pc__player--script">
          <IconButton icon="chevron-left" label="Fala anterior" onClick={() => go(idx - 1)} disabled={idx <= 0} />
          <span className="pc__step tl-num">{turn ? `Fala ${idx + 1} de ${ep.turns.length}` : `${ep.turns.length} falas`}</span>
          <IconButton
            icon={turn ? 'chevron-right' : 'play'}
            label={turn ? 'Próxima fala' : 'Começar o roteiro'}
            variant="solid"
            onClick={() => go(idx + 1)}
            disabled={idx >= ep.turns.length - 1}
          />
        </div>

        <ChapterNav ep={ep} chapter={chapter} onJump={chapterJump} />

        <div className="pc__controls">
          <Switch checked={follow} onChange={setFollow} label="Câmera acompanha o roteiro" />
        </div>

        <div className="pc__tx">
          <PodcastTranscript segments={segments} activeIndex={idx} onSeek={go} follow />
        </div>
      </aside>
    </div>
  );
}
