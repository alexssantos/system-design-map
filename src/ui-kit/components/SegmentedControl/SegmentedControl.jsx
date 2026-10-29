import { useId } from 'react';
import { motion } from 'motion/react';
import { cx } from '../_utils/cx';
import { spring } from '../_utils/motion';
import { Icon } from '../Icon/Icon';
import './SegmentedControl.css';

/**
 * SegmentedControl — seletor compacto em pílula (referência: Month / Year). A pílula clara desliza até a opção escolhida. Use para modos (Texto / Frase / Áudio), período, tema.
 * @param {{value:string,label:string,icon?:string,badge?:React.ReactNode}[]} options `badge` aparece depois do rótulo (ex.: <ProBadge /> num recurso do Pro).
 * @param {string} value Valor selecionado.
 * @param {Function} onChange Recebe o valor.
 * @param {'sm'|'md'} [size='sm']
 * @param {boolean} [iconOnly=false] Só ícones (rótulo vira aria-label).
 * @param {string} [label] Nome acessível do grupo.
 * Estados: opção ativa (pílula clara; o ícone toca a animação ao ser escolhido), hover (texto clareia), foco.
 */
export function SegmentedControl({ options, value, onChange, size = 'sm', iconOnly = false, label, className }) {
  const id = useId();
  return (
    <div className={cx('tl-seg', `tl-seg--${size}`, className)} role="radiogroup" aria-label={label}>
      {options.map((o) => {
        const on = o.value === value;
        return (
          <button key={o.value} type="button" role="radio" aria-checked={on} aria-label={iconOnly ? o.label : undefined} className={cx('tl-seg__opt', 'tl-animhost', on && 'is-on')} onClick={() => onChange?.(o.value)}>
            {on && <motion.span layoutId={`seg-${id}`} className="tl-seg__thumb" transition={spring.snappy} />}
            {o.icon && <Icon key={on ? 'on' : 'off'} name={o.icon} size={size === 'sm' ? 15 : 17} anim={on ? 'play' : 'hover'} />}
            {!iconOnly && <span>{o.label}</span>}
            {o.badge}
          </button>
        );
      })}
    </div>
  );
}
