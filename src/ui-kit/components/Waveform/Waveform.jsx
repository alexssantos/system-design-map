import { useEffect, useRef, useState } from 'react';
import { cx } from '../_utils/cx';
import './Waveform.css';

const reduce = () => typeof window !== 'undefined' && window.matchMedia?.('(prefers-reduced-motion: reduce)').matches;

/** Gera um volume "de fala" plausível (mock) para o instante t (s). */
export function mockLevel(t) {
  const syll = 0.22 + 0.78 * Math.abs(Math.sin(t * 6.1)) * (0.55 + 0.45 * Math.abs(Math.sin(t * 1.7 + 1)));
  const pause = Math.sin(t * 0.8) > -0.7 ? 1 : 0.2;
  return Math.min(1, syll * pause * (0.7 + Math.random() * 0.3));
}

/**
 * Waveform — barras de áudio. `live` rola da direita para a esquerda com o volume do microfone (mock incluso); senão desenha `levels` fixos (áudio gravado) com progresso de reprodução.
 * @param {boolean} [live=false] Captura ao vivo (anima com requestAnimationFrame; parado em movimento reduzido).
 * @param {number[]} [levels] Volumes 0–1 para o modo estático.
 * @param {number} [bars=48] Quantidade de barras.
 * @param {number} [height=48]
 * @param {number} [progress] 0–1: barras já tocadas ficam acesas.
 * @param {Function} [onLevel] Recebe o volume atual (para o MicButton).
 * @param {'voice'|'accent'|'muted'} [tone='voice']
 * Estados: ao vivo, estático, reproduzindo (progress), silêncio.
 */
export function Waveform({ live = false, levels, bars = 48, height = 48, progress, onLevel, tone = 'voice', className }) {
  const [data, setData] = useState(() => levels ?? Array.from({ length: bars }, (_, i) => Math.max(0.06, mockLevel(i / (live ? 9 : 6)) * (live ? i / bars : 1))));
  const last = useRef(0);
  useEffect(() => { if (levels) setData(levels); }, [levels]);
  useEffect(() => {
    if (!live || reduce()) return;
    let raf;
    const t0 = performance.now();
    const tick = (now) => {
      if (now - last.current > 70) {
        last.current = now;
        const v = mockLevel((now - t0) / 1000);
        onLevel?.(v);
        setData((d) => [...d.slice(1), Math.max(0.05, v)]);
      }
      raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, [live]);
  return (
    <div className={cx('tl-wave', `tl-wave--${tone}`, live && 'is-live', className)} style={{ height }} role="img" aria-label={live ? 'Captando áudio' : 'Forma de onda do áudio'}>
      {data.map((v, i) => (
        <i key={i} className={progress != null && i / data.length <= progress ? 'is-played' : undefined} style={{ transform: `scaleY(${Math.max(0.06, v)})` }} />
      ))}
    </div>
  );
}
