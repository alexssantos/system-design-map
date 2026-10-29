import { motion } from 'motion/react';
import { cx } from '../_utils/cx';
import { spring } from '../_utils/motion';
import './Card.css';

/**
 * Card — superfície arredondada da referência (cartão VISA). Base de resultados, dicionário, estatísticas.
 * @param {'surface'|'sunken'|'outline'|'accent'} [variant='surface'] accent = cartão limão (destaque único).
 * @param {'none'|'sm'|'md'|'lg'} [padding='md'] 0 / 12 / 16 / 24 px.
 * @param {boolean} [interactive=false] Hover levanta 2px; clique encolhe.
 * @param {Function} [onClick]
 * Estados: repouso, hover (interativo), pressionado.
 */
export function Card({ variant = 'surface', padding = 'md', interactive = false, onClick, children, className, ...rest }) {
  return (
    <motion.div
      className={cx('tl-card', `tl-card--${variant}`, `tl-card--p-${padding}`, interactive && 'is-interactive tl-animhost', className)}
      onClick={onClick}
      whileHover={interactive ? { y: -2 } : undefined}
      whileTap={interactive ? { scale: 0.98 } : undefined}
      transition={spring.snappy}
      {...rest}
    >
      {children}
    </motion.div>
  );
}
