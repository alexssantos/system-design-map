import { useState } from 'react';
import { motion } from 'motion/react';
import { cx } from '../_utils/cx';
import { spring } from '../_utils/motion';
import './Switch.css';

/**
 * Switch — liga/desliga com botão que desliza com mola e "estica" ao pressionar.
 * @param {boolean} checked
 * @param {Function} onChange Recebe o novo valor (boolean).
 * @param {string} [label] Rótulo à esquerda; sem ele, passe `aria-label`.
 * @param {string} [hint] Texto de apoio abaixo do rótulo.
 * @param {boolean} [disabled=false]
 * Estados: desligado, ligado (trilho limão), pressionado, foco, desabilitado.
 */
export function Switch({ checked, onChange, label, hint, disabled = false, className, ...rest }) {
  const [press, setPress] = useState(false);
  const up = () => setPress(false);
  // Desloca o botão com transform (x), não com animação de layout: assim ele não salta quando um ancestral se move,
  // escala ou re-renderiza (ex.: dentro do BubbleMenu, enquanto a bolha muda de opacidade).
  const control = (
    <button
      type="button"
      role="switch"
      aria-checked={checked}
      disabled={disabled}
      className={cx('tl-switch', checked && 'is-on')}
      onClick={() => onChange?.(!checked)}
      onPointerDown={() => setPress(true)}
      onPointerUp={up}
      onPointerLeave={up}
      onPointerCancel={up}
      {...(label ? {} : rest)}
    >
      <motion.span className="tl-switch__knob" initial={false} animate={{ x: checked ? (press ? 12 : 18) : 0, width: press ? 26 : 20 }} transition={spring.snappy} />
    </button>
  );
  if (!label) return control;
  return (
    <label className={cx('tl-switch-row', disabled && 'is-disabled', className)}>
      <span className="tl-switch-row__text">
        <span className="tl-switch-row__label">{label}</span>
        {hint && <span className="tl-switch-row__hint">{hint}</span>}
      </span>
      {control}
    </label>
  );
}
