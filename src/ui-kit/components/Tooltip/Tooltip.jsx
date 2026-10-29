import { useId, useLayoutEffect, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import { AnimatePresence, motion } from 'motion/react';
import { cx } from '../_utils/cx';
import { duration, ease } from '../_utils/motion';
import { Kbd } from '../Kbd/Kbd';
import './Tooltip.css';

const GAP = 8;
const EDGE = 6;

/** Onde o balão cabe: troca de lado se faltar espaço e encosta na borda da janela sem sair dela. */
export function placeTooltip(anchor, bubble, side, view) {
  let s = side;
  if (s === 'top' && anchor.top - GAP - bubble.height < EDGE) s = 'bottom';
  else if (s === 'bottom' && anchor.bottom + GAP + bubble.height > view.height - EDGE) s = 'top';
  const top = s === 'top' ? anchor.top - GAP - bubble.height : anchor.bottom + GAP;
  const center = anchor.left + anchor.width / 2 - bubble.width / 2;
  const left = Math.max(EDGE, Math.min(center, view.width - EDGE - bubble.width));
  return { side: s, top: Math.round(top), left: Math.round(left) };
}

/**
 * Tooltip — balão curto no hover/foco com rótulo e, opcional, o atalho de teclado.
 * O balão vai para o `body` (não é cortado pela janela) e troca de lado ou encosta na borda quando não cabe.
 * @param {string} label Texto do balão.
 * @param {string[]} [keys] Atalho mostrado ao lado (ex.: ['Ctrl','I']).
 * @param {'top'|'bottom'} [side='top'] Lado preferido.
 * @param {boolean} [open] Força aberto (catálogo/screenshots).
 * Estados: fechado, abrindo (sobe 4px + aparece), aberto.
 */
export function Tooltip({ label, keys, side = 'top', open, children, className }) {
  const [hover, setHover] = useState(false);
  const id = useId();
  const visible = open ?? hover;
  const anchor = useRef(null);
  const bubble = useRef(null);
  const [pos, setPos] = useState(null);

  useLayoutEffect(() => {
    if (!visible) { setPos(null); return; }
    const a = anchor.current?.getBoundingClientRect();
    const b = bubble.current;
    if (!a || !b) return;
    setPos(placeTooltip(a, { width: b.offsetWidth, height: b.offsetHeight }, side, { width: window.innerWidth, height: window.innerHeight }));
  }, [visible, side, label]);

  const s = pos?.side ?? side;
  return (
    <span
      ref={anchor}
      className={cx('tl-tip', className)}
      onPointerEnter={() => setHover(true)}
      onPointerLeave={() => setHover(false)}
      onFocus={() => setHover(true)}
      onBlur={() => setHover(false)}
      aria-describedby={visible ? id : undefined}
    >
      {children}
      {typeof document !== 'undefined' && createPortal(
        <AnimatePresence>
          {visible && (
            <motion.span
              ref={bubble}
              id={id}
              role="tooltip"
              className={cx('tl-tip__bubble', `tl-tip__bubble--${s}`)}
              style={{ top: pos?.top ?? 0, left: pos?.left ?? 0, visibility: pos ? 'visible' : 'hidden' }}
              initial={{ opacity: 0, y: s === 'top' ? 4 : -4, scale: 0.96 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, scale: 0.96, transition: { duration: duration.instant } }}
              transition={{ duration: duration.fast, ease: ease.out, delay: open ? 0 : 0.25 }}
            >
              {label}
              {keys && <Kbd keys={keys} size="xs" />}
            </motion.span>
          )}
        </AnimatePresence>,
        document.body,
      )}
    </span>
  );
}
