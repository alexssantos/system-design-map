import { cx } from '../_utils/cx';
import './Avatar.css';

/**
 * Avatar — foto redonda ou iniciais (referência: "Hello Oleksandr").
 * @param {string} name Nome (gera iniciais e texto alternativo).
 * @param {string} [src] URL da foto.
 * @param {number} [size=36]
 */
export function Avatar({ name, src, size = 36, className }) {
  const ini = name.split(/\s+/).map((p) => p[0]).slice(0, 2).join('').toUpperCase();
  return (
    <span className={cx('tl-avatar', className)} style={{ width: size, height: size, fontSize: size * 0.38 }} role="img" aria-label={name}>
      {src ? <img src={src} alt="" /> : ini}
    </span>
  );
}
