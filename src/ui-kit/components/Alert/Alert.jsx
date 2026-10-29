import { motion } from 'motion/react';
import { cx } from '../_utils/cx';
import { fadeUp } from '../_utils/motion';
import { Icon } from '../Icon/Icon';
import './Alert.css';

/**
 * Alert — mensagem dentro da janela para erro, sem internet ou permissão de microfone. Ícone toca uma vez ao aparecer.
 * @param {'danger'|'warning'|'info'|'voice'} [tone='danger']
 * @param {string} [icon] Padrão por tom.
 * @param {string} title
 * @param {string} [text]
 * @param {React.ReactNode} [action] Botão (ex.: Tentar de novo).
 */
export function Alert({ tone = 'danger', icon, title, text, action, className }) {
  const ic = icon ?? { danger: 'alert', warning: 'wifi-off', info: 'info', voice: 'mic-off' }[tone];
  return (
    <motion.div role="alert" {...fadeUp()} className={cx('tl-alert', `tl-alert--${tone}`, className)}>
      <span className="tl-alert__icon"><Icon name={ic} size={20} anim="play" /></span>
      <div className="tl-alert__texts">
        <strong>{title}</strong>
        {text && <span>{text}</span>}
      </div>
      {action && <div className="tl-alert__action">{action}</div>}
    </motion.div>
  );
}
