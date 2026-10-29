import { useId, useState } from 'react';
import { motion } from 'motion/react';
import { cx } from '../_utils/cx';
import { spring } from '../_utils/motion';
import './Slider.css';

/**
 * Slider — controle deslizante (velocidade da voz, opacidade da janela). O polegar cresce ao arrastar e mostra o valor num balão.
 * @param {number} value @param {Function} onChange Recebe o número.
 * @param {number} [min=0] @param {number} [max=100] @param {number} [step=1]
 * @param {string} label Rótulo acima.
 * @param {Function} [format] Formata o valor (ex.: v => `${v}×`).
 * @param {boolean} [bubble] Balão com o valor sobre o polegar ao arrastar. Padrão: só sem `label`, porque com rótulo o valor já aparece no cabeçalho
 *   e o balão cobriria o rótulo (ex.: no BubbleMenu).
 * Estados: repouso, arrastando (polegar cresce; balão quando `bubble`), foco, desabilitado.
 */
export function Slider({ value, onChange, min = 0, max = 100, step = 1, label, format = (v) => v, bubble = !label, disabled = false, className }) {
  const id = useId();
  const [drag, setDrag] = useState(false);
  const pct = ((value - min) / (max - min)) * 100;
  return (
    <div className={cx('tl-slider', drag && 'is-drag', className)}>
      <label htmlFor={id} className="tl-slider__head"><span>{label}</span><span className="tl-slider__val tl-num">{format(value)}</span></label>
      <div className="tl-slider__track" style={{ '--p': `${pct}%` }}>
        <span className="tl-slider__fill" />
        <motion.span className="tl-slider__thumb" animate={{ scale: drag ? 1.25 : 1 }} transition={spring.snappy}>
          {bubble && <motion.span className="tl-slider__bubble tl-num" initial={false} animate={{ opacity: drag ? 1 : 0, y: drag ? 0 : 6 }} transition={spring.snappy}>{format(value)}</motion.span>}
        </motion.span>
        <input id={id} type="range" min={min} max={max} step={step} value={value} disabled={disabled} onChange={(e) => onChange?.(Number(e.target.value))} onPointerDown={() => setDrag(true)} onPointerUp={() => setDrag(false)} onPointerCancel={() => setDrag(false)} onLostPointerCapture={() => setDrag(false)} onBlur={() => setDrag(false)} />
      </div>
    </div>
  );
}
