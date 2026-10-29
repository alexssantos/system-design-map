import { motion } from 'motion/react';
import { cx } from '../_utils/cx';
import { spring } from '../_utils/motion';
import { Icon } from '../Icon/Icon';
import './Chip.css';

/**
 * Chip — etiqueta clicável (sinônimos, idiomas recentes, sugestões). Sobe 1px no hover, encolhe ao clicar.
 * @param {boolean} [selected=false] Selecionado (contorno + fundo de destaque).
 * @param {string} [icon] Ícone à esquerda.
 * @param {string} [dot] Cor CSS de um ponto à esquerda (ex.: var(--chart-1)).
 * @param {Function} [onClick]
 * @param {Function} [onRemove] Mostra um × para remover.
 * Estados: repouso, hover, pressionado, selecionado.
 */
export function Chip({ selected = false, icon, dot, onClick, onRemove, children, className }) {
  return (
    <motion.span layout className={cx('tl-chip', 'tl-animhost', selected && 'is-on', onClick && 'is-click', className)} whileTap={onClick ? { scale: 0.94 } : undefined} transition={spring.snappy}>
      <button type="button" className="tl-chip__main" onClick={onClick} disabled={!onClick} aria-pressed={onClick ? selected : undefined}>
        {dot && <span className="tl-chip__dot" style={{ background: dot }} />}
        {icon && <Icon name={icon} size={14} />}
        {children}
      </button>
      {onRemove && (
        <button type="button" className="tl-chip__x" aria-label={`Remover ${children}`} onClick={onRemove}>
          <Icon name="close" size={13} />
        </button>
      )}
    </motion.span>
  );
}
