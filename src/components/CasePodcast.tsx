import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { DiagramView } from '../diagrams/DiagramView';
import type { Diagram } from '../diagrams/types';
import { episodeByCase, firstTurnWith, hosts, spoken, turnAt, type Episode } from '../podcasts';
import { Avatar, IconButton, Slider, Switch, Waveform } from '../ui-kit';
import { PodcastTranscript, type PodcastSegment } from './kit/PodcastTranscript';
import './CasePodcast.css';

const clock = (s: number) => `${Math.floor(s / 60)}:${String(Math.floor(s % 60)).padStart(2, '0')}`;

export const hasPodcast = (caseId: string) => episodeByCase.has(caseId);

/** Estado do áudio: tempo atual (suave enquanto toca), play/pause, velocidade e busca. */
function usePlayer(ep: Episode) {
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
 * Diagrama do caso com o episódio do podcast ao lado. O que está sendo explicado acende no diagrama;
 * clicar numa fala ou numa peça do diagrama leva o áudio até o trecho dela.
 */
export function CasePodcast({ diagram, colorMode }: { diagram: Diagram; colorMode: 'dark' | 'light' }) {
  const ep = episodeByCase.get(diagram.caseId)!;
  const p = usePlayer(ep);
  const [follow, setFollow] = useState(true);
  const started = p.time > 0 || p.playing;
  const idx = turnAt(ep, p.time);
  const turn = ep.turns[idx];
  const chapter = ep.script.chapters[turn.chapter];

  const segments = useMemo<PodcastSegment[]>(
    () =>
      ep.turns.map((t, i) => ({
        time: clock(t.start),
        speaker: hosts[t.host].name,
        speakerClass: `is-${t.host}`,
        text: spoken(t.text),
        chapter: i === 0 || ep.turns[i - 1].chapter !== t.chapter ? ep.script.chapters[t.chapter].title : undefined,
      })),
    [ep],
  );

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
        <DiagramView diagram={diagram} colorMode={colorMode} focus={started ? turn.focus : []} follow={follow && started} onPick={pick} />
      </div>
      <aside className="pc" aria-label="Episódio do podcast">
        {p.el}
        <div className="pc__head">
          <div className="pc__eyebrow tl-caps">Podcast · {clock(ep.timing.duration)}</div>
          <h3 className="pc__title">{ep.script.title}</h3>
          <div className="pc__hosts">
            {Object.values(hosts).map((h) => (
              <span key={h.id} className={`pc__host${started && turn.host === h.id && p.playing ? ' is-speaking' : ''}`} title={h.role}>
                <Avatar name={h.name} size={28} className={`is-${h.id}`} />
                <span>
                  <b>{h.name}</b>
                  <small>{h.role}</small>
                </span>
              </span>
            ))}
          </div>
        </div>

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

        <div className="pc__chapter">
          <IconButton icon="chevron-left" label="Capítulo anterior" size="sm" onClick={() => chapterJump(-1)} disabled={turn.chapter === 0} />
          <div className="pc__chapter-name">
            <small className="tl-num">
              Capítulo {turn.chapter + 1} de {ep.script.chapters.length}
            </small>
            {chapter.title}
          </div>
          <IconButton
            icon="chevron-right"
            label="Próximo capítulo"
            size="sm"
            onClick={() => chapterJump(1)}
            disabled={turn.chapter === ep.script.chapters.length - 1}
          />
        </div>

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
