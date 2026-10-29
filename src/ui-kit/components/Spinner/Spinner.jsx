import { cx } from '../_utils/cx';
import './Spinner.css';

/**
 * Spinner — indicador de carregamento. `ring` gira um arco; `dots` são três pontos "digitando" (usado enquanto a tradução chega).
 * @param {'ring'|'dots'} [variant='ring']
 * @param {number} [size=16] Diâmetro (ring) ou altura (dots) em px.
 * @param {string} [label='Carregando'] Texto para leitores de tela.
 */
export function Spinner({ variant = 'ring', size = 16, label = 'Carregando', className }) {
  if (variant === 'dots')
    return (
      <span className={cx('tl-dots', className)} role="status" aria-label={label} style={{ '--s': `${size / 2.2}px` }}>
        <i /><i /><i />
      </span>
    );
  return <span className={cx('tl-spin', className)} role="status" aria-label={label} style={{ width: size, height: size }} />;
}
