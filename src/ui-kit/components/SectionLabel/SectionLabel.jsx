import { cx } from '../_utils/cx';
import './SectionLabel.css';

/**
 * SectionLabel — rótulo de seção fraco e centralizado (referência: "Today", "November, 16"), ou alinhado à esquerda com ação.
 * @param {'center'|'start'} [align='center']
 * @param {React.ReactNode} [action] Elemento à direita (só com align='start').
 */
export function SectionLabel({ align = 'center', action, children, className }) {
  return (
    <div className={cx('tl-seclabel', `tl-seclabel--${align}`, className)}>
      <span>{children}</span>
      {align === 'start' && action}
    </div>
  );
}
