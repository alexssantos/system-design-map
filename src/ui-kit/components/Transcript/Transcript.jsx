import { AnimatePresence, motion } from 'motion/react';
import { cx } from '../_utils/cx';
import { duration, ease } from '../_utils/motion';
import './Transcript.css';

/**
 * Transcript — transcrição do áudio em trechos com tempo; o último trecho em andamento mostra cursor piscando e texto parcial mais claro. Cada trecho pode trazer a tradução logo abaixo.
 * @param {{time:string,text:string,translation?:string,final?:boolean}[]} segments Trechos em ordem; final=false = ainda ouvindo.
 * @param {boolean} [showTranslation=true]
 * @param {number} [activeIndex] Trecho em destaque (reprodução).
 * @param {Function} [onSeek] Recebe o índice clicado.
 * Estados: ouvindo (último parcial + cursor), finalizado, trecho ativo (tingido), vazio.
 */
export function Transcript({ segments = [], showTranslation = true, activeIndex, onSeek, className }) {
  return (
    <ol className={cx('tl-tx', className)}>
      <AnimatePresence initial={false}>
        {segments.map((s, i) => (
          <motion.li key={i} layout className={cx('tl-tx__seg', s.final === false && 'is-partial', i === activeIndex && 'is-active')} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: duration.slow, ease: ease.out }}>
            <button type="button" className="tl-tx__time tl-num" onClick={() => onSeek?.(i)} aria-label={`Ir para ${s.time}`}>{s.time}</button>
            <div className="tl-tx__texts">
              <p className="tl-tx__text">{s.text}{s.final === false && <span className="tl-tx__caret" aria-hidden />}</p>
              {showTranslation && s.translation && (
                <motion.p className="tl-tx__tr" initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.15, duration: duration.base }}>{s.translation}</motion.p>
              )}
            </div>
          </motion.li>
        ))}
      </AnimatePresence>
    </ol>
  );
}
