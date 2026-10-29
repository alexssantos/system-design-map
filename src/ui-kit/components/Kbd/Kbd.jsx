import { motion } from 'motion/react';
import { cx } from '../_utils/cx';
import { spring } from '../_utils/motion';
import './Kbd.css';

const GLYPH = { Cmd: '⌘', Shift: '⇧', Alt: '⌥', Option: '⌥', Enter: '↵', Esc: 'Esc', Up: '↑', Down: '↓', Left: '←', Right: '→', Space: 'Espaço' };

/**
 * Kbd — teclas de atalho em "keycaps". Com `play`, as teclas afundam uma a uma e ficam acesas (HUD do atalho global).
 * @param {string[]} keys Teclas na ordem (ex.: ['Ctrl','Shift','Space']). Cmd/Shift/Alt/Enter viram glifos.
 * @param {'xs'|'sm'|'md'|'lg'} [size='sm']
 * @param {boolean} [play=false] Anima a sequência de pressionar (troque `key` para repetir).
 * @param {boolean} [lit=false] Teclas acesas (cor de destaque) sem animar.
 * @param {boolean} [glyphs=false] Mostra ⌘ ⇧ ⌥ em vez dos nomes (macOS).
 * Estados: repouso, acesa (lit), animando (play).
 */
export function Kbd({ keys, size = 'sm', play = false, lit = false, glyphs = false, className }) {
  return (
    <span className={cx('tl-kbd', `tl-kbd--${size}`, className)} aria-label={keys.join(' + ')}>
      {keys.map((k, i) => (
        <motion.kbd
          key={k + i}
          className={cx('tl-kbd__key', lit && 'is-lit', play && 'is-play')}
          style={play ? { animationDelay: `${120 + i * 160}ms` } : undefined}
          initial={play ? { y: 0 } : false}
          animate={play ? { y: [0, 3, 1] } : undefined}
          transition={play ? { duration: 0.32, delay: 0.12 + i * 0.16, times: [0, 0.4, 1] } : spring.snappy}
        >
          {glyphs ? GLYPH[k] ?? k : k === 'Space' ? 'Espaço' : k}
        </motion.kbd>
      ))}
    </span>
  );
}
