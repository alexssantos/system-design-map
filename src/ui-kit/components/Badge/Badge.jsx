import { cx } from '../_utils/cx';
import './Badge.css';

/**
 * Badge — selo pequeno (referência: "$ 5,867" limão, "+14%"). Para idioma detectado, contagem, status.
 * @param {'accent'|'neutral'|'info'|'voice'|'success'|'danger'|'warning'} [tone='neutral']
 * @param {boolean} [solid=false] Fundo sólido (padrão: tom suave).
 * @param {boolean} [dot=false] Ponto colorido antes do texto (referência: legenda do gráfico).
 * @param {boolean} [pulse=false] Ponto pulsa (ex.: "Gravando").
 */
export function Badge({ tone = 'neutral', solid = false, dot = false, pulse = false, children, className }) {
  return (
    <span className={cx('tl-badge', `tl-badge--${tone}`, solid && 'is-solid', className)}>
      {dot && <span className={cx('tl-badge__dot', pulse && 'is-pulse')} />}
      {children}
    </span>
  );
}
