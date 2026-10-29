import { motion } from 'motion/react';
import { cx } from '../_utils/cx';
import { spring } from '../_utils/motion';
import { Icon } from '../Icon/Icon';
import { Spinner } from '../Spinner/Spinner';
import './Button.css';

/**
 * Button — botão em pílula da referência (SEND / REQUEST / STATS). Um único `primary` por tela: cor de destaque sólida + brilho que varre (shine).
 * @param {'primary'|'light'|'dark'|'ghost'|'danger'} [variant='dark'] primary = CTA (limão sólido); light = pílula clara (SEND); dark = pílula escura (REQUEST); ghost = só texto; danger = ação destrutiva.
 * @param {'sm'|'md'|'lg'} [size='md'] Altura 32 / 40 / 48.
 * @param {string} [icon] Ícone à esquerda (anima no hover).
 * @param {string} [iconRight] Ícone à direita.
 * @param {boolean} [caps=false] Rótulo em caixa alta espaçada, como na referência.
 * @param {boolean} [shine] Brilho que varre o botão a cada 4 s. Padrão: ligado no primary.
 * @param {boolean} [loading=false] Troca o ícone por spinner e bloqueia clique.
 * @param {boolean} [block=false] Ocupa 100% da largura.
 * @param {boolean} [disabled=false]
 * @param {Function} [onClick]
 * Estados: repouso, hover (ícone anima, fundo clareia), pressionado (encolhe com mola), foco (anel limão), carregando, desabilitado.
 */
export function Button({ variant = 'dark', size = 'md', icon, iconRight, caps = false, shine, loading = false, block = false, disabled = false, children, className, type = 'button', ...rest }) {
  const withShine = shine ?? variant === 'primary';
  return (
    <motion.button
      type={type}
      className={cx('tl-btn', 'tl-animhost', `tl-btn--${variant}`, `tl-btn--${size}`, caps && 'tl-btn--caps', block && 'tl-btn--block', withShine && 'tl-btn--shine', loading && 'is-loading', className)}
      disabled={disabled || loading}
      whileTap={disabled || loading ? undefined : { scale: 0.95 }}
      transition={spring.snappy}
      aria-busy={loading || undefined}
      {...rest}
    >
      {(icon || loading) && (
        <span className="tl-btn__icon">{loading ? <Spinner size={size === 'sm' ? 14 : 16} /> : <Icon name={icon} size={size === 'lg' ? 20 : 18} />}</span>
      )}
      {children != null && <span className="tl-btn__label">{children}</span>}
      {iconRight && <Icon name={iconRight} size={18} className="tl-btn__icon-r" />}
    </motion.button>
  );
}
