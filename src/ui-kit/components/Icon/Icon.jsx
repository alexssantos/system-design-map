import { cx } from '../_utils/cx';
import './Icon.css';

const files = import.meta.glob('../../assets/icons/*.svg', { query: '?raw', import: 'default', eager: true });
const ICONS = Object.fromEntries(
  Object.entries(files).map(([path, svg]) => [path.split('/').pop().replace('.svg', ''), svg.replace(/^<svg[^>]*>|<\/svg>\s*$/g, '')]),
);
/** Nomes de todos os ícones de assets/icons. */
export const ICON_NAMES = Object.keys(ICONS).sort();

/**
 * Icon — ícone SVG de assets/icons, com micro-animação própria por ícone (troca: setas se cruzam; copiar: folha desliza; mic: cápsula sobe; engrenagem gira...).
 * A animação toca no hover de qualquer ancestral com a classe `tl-animhost` (Button, IconButton, TabBar já têm), ou sempre com `anim="loop"`.
 * @param {string} name Nome do arquivo em assets/icons, sem .svg (veja ICON_NAMES).
 * @param {number} [size=20] Lado em px.
 * @param {'hover'|'loop'|'play'|'none'} [anim='hover'] hover = toca ao passar o mouse no host; loop = repete (gravando, falando); play = toca uma vez ao montar (troque a `key` para repetir); none = estático.
 * @param {number} [strokeWidth] Espessura do traço (padrão 1.75).
 * @param {string} [label] Texto acessível; sem ele o ícone é decorativo (aria-hidden).
 * @param {string} [className]
 * Estados: hover (no host), loop, play, none.
 */
export function Icon({ name, size = 20, anim = 'hover', strokeWidth, label, className, style }) {
  const body = ICONS[name];
  if (!body && import.meta.env.DEV) console.warn(`Icon: "${name}" não existe em assets/icons`);
  return (
    <svg
      className={cx('tl-icon', className)}
      data-name={name}
      data-anim={anim}
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={strokeWidth ?? 1.75}
      strokeLinecap="round"
      strokeLinejoin="round"
      role={label ? 'img' : undefined}
      aria-label={label}
      aria-hidden={label ? undefined : true}
      style={style}
      dangerouslySetInnerHTML={{ __html: body || '' }}
    />
  );
}
