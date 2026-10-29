import { useEffect, useRef } from 'react';
import { Avatar, cx } from '../../ui-kit';
import '../../ui-kit/components/Transcript/Transcript.css';
import './PodcastTranscript.css';

export interface PodcastSegment {
  time: string;
  speaker: string;
  /** Classe do avatar, para distinguir as vozes por cor. */
  speakerClass?: string;
  text: string;
  /** Título do capítulo, desenhado antes do trecho que o abre. */
  chapter?: string;
}

interface Props {
  segments: PodcastSegment[];
  activeIndex?: number;
  onSeek?: (i: number) => void;
  /** Mantém o trecho ativo visível dentro do contêiner com rolagem. */
  follow?: boolean;
  className?: string;
}

/**
 * PodcastTranscript — o `Transcript` do kit para conversa: cada trecho mostra o avatar e o nome de quem fala,
 * e os capítulos aparecem como divisórias. Clicar no tempo ou no texto leva o áudio até ali.
 * Estados: trecho ativo (tingido de voz), já ouvido (texto mais claro), a ouvir.
 */
export function PodcastTranscript({ segments, activeIndex = -1, onSeek, follow = true, className }: Props) {
  const active = useRef<HTMLDivElement>(null);
  useEffect(() => {
    if (follow) active.current?.scrollIntoView({ block: 'nearest', behavior: 'smooth' });
  }, [activeIndex, follow]);

  return (
    <ol className={cx('tl-tx', 'tl-ptx', className)}>
      {segments.map((s, i) => (
        <li key={i} className="tl-ptx__item">
          {s.chapter && <div className="tl-ptx__chapter tl-caps">{s.chapter}</div>}
          <div
            ref={i === activeIndex ? active : undefined}
            className={cx('tl-tx__seg', i === activeIndex && 'is-active', i < activeIndex && 'is-past')}
            onClick={() => onSeek?.(i)}
          >
            <button type="button" className="tl-tx__time tl-num" onClick={() => onSeek?.(i)} aria-label={`Ir para ${s.time}`}>
              {s.time}
            </button>
            <div className="tl-tx__texts">
              <span className="tl-ptx__who">
                <Avatar name={s.speaker} size={20} className={s.speakerClass} />
                {s.speaker}
              </span>
              <p className="tl-tx__text">{s.text}</p>
            </div>
          </div>
        </li>
      ))}
    </ol>
  );
}
