import { useEffect, useRef, useState } from 'react';
import { AnimatePresence, motion } from 'motion/react';
import { cx } from '../_utils/cx';
import { spring } from '../_utils/motion';
import { Icon } from '../Icon/Icon';
import { Tooltip } from '../Tooltip/Tooltip';
import './IconButton.css';

/**
 * IconButton — botão redondo só com ícone (ouvir, copiar, fixar, inverter...). O ícone anima no hover; com `feedbackIcon`, ao clicar ele vira outro ícone (copiar → check) com giro e mola e volta depois.
 * @param {string} icon Ícone do repouso.
 * @param {string} label Nome acessível e texto do tooltip.
 * @param {'ghost'|'soft'|'solid'|'accent'|'outline'} [variant='ghost'] ghost = transparente; soft = cinza escuro; solid = pílula clara; accent = limão; outline = contorno fino (referência: ícones do cartão).
 * @param {'sm'|'md'|'lg'} [size='md'] 32 / 40 / 52 px.
 * @param {boolean} [active=false] Estado ligado (ex.: fixado, falando). Fundo de destaque suave.
 * @param {string} [feedbackIcon] Ícone mostrado por `feedbackMs` após o clique (ex.: 'check').
 * @param {number} [feedbackMs=1400]
 * @param {string} [feedbackLabel] Tooltip mostrado (aberto) durante o feedback (ex.: 'Copiado').
 * @param {string[]} [keys] Atalho mostrado no tooltip.
 * @param {boolean} [tooltip=true] Mostra o tooltip com `label`.
 * @param {boolean} [dot=false] Ponto de notificação (referência: sino).
 * @param {'hover'|'loop'|'none'} [anim='hover'] Animação do ícone; 'loop' enquanto algo acontece (ex.: falando).
 * @param {Function} [onClick]
 * Estados: repouso, hover, pressionado, ativo, feedback (ícone trocado), desabilitado.
 */
export function IconButton({ icon, label, variant = 'ghost', size = 'md', active = false, feedbackIcon, feedbackMs = 1400, feedbackLabel, keys, tooltip = true, dot = false, anim = 'hover', onClick, disabled, className, ...rest }) {
  const [fb, setFb] = useState(false);
  const timer = useRef();
  useEffect(() => () => clearTimeout(timer.current), []);
  const handle = (e) => {
    onClick?.(e);
    if (feedbackIcon) {
      setFb(true);
      clearTimeout(timer.current);
      timer.current = setTimeout(() => setFb(false), feedbackMs);
    }
  };
  const iconSize = size === 'sm' ? 17 : size === 'lg' ? 24 : 20;
  const current = fb ? feedbackIcon : icon;
  const btn = (
    <motion.button
      type="button"
      className={cx('tl-iconbtn', 'tl-animhost', `tl-iconbtn--${variant}`, `tl-iconbtn--${size}`, active && 'is-active', fb && 'is-feedback', className)}
      aria-label={label}
      aria-pressed={active || undefined}
      disabled={disabled}
      onClick={handle}
      whileTap={disabled ? undefined : { scale: 0.86 }}
      transition={spring.snappy}
      {...rest}
    >
      <AnimatePresence mode="popLayout" initial={false}>
        <motion.span
          key={current}
          className="tl-iconbtn__glyph"
          initial={{ opacity: 0, scale: 0.4, rotate: -45 }}
          animate={{ opacity: 1, scale: 1, rotate: 0 }}
          exit={{ opacity: 0, scale: 0.4, rotate: 45 }}
          transition={spring.bouncy}
        >
          <Icon name={current} size={iconSize} anim={fb ? 'play' : anim} />
        </motion.span>
      </AnimatePresence>
      {dot && <span className="tl-iconbtn__dot" />}
    </motion.button>
  );
  return tooltip && label ? <Tooltip label={fb && feedbackLabel ? feedbackLabel : label} keys={fb ? undefined : keys} open={fb && feedbackLabel ? true : undefined}>{btn}</Tooltip> : btn;
}
