import { motion } from 'motion/react';
import { Icon, cx, fadeUp } from '../../ui-kit';
import './NoteCard.css';

export type NoteTone = 'impl' | 'alert' | 'interview';

const META: Record<NoteTone, { icon: string; label: string }> = {
  impl: { icon: 'book', label: 'Implementação' },
  alert: { icon: 'alert', label: 'Atenção' },
  interview: { icon: 'sparkles', label: 'Na entrevista' },
};

interface Props {
  tone: NoteTone;
  title: string;
  text: string;
  index?: number;
  className?: string;
}

/**
 * NoteCard — nota fixada no diagrama. Três tons: implementação (azul), atenção (coral, ícone pulsa)
 * e entrevista (limão, brilho). Mesma anatomia do Alert do kit: quadrado com ícone, título forte, texto fraco.
 */
export function NoteCard({ tone, title, text, index = 0, className }: Props) {
  const m = META[tone];
  return (
    <motion.div {...fadeUp(index)} className={cx('tl-note', `tl-note--${tone}`, 'tl-animhost', className)}>
      <div className="tl-note__head">
        <span className="tl-note__icon">
          <Icon name={m.icon} size={16} anim={tone === 'alert' ? 'loop' : 'hover'} />
        </span>
        <span className="tl-note__kind tl-caps">{m.label}</span>
      </div>
      <strong className="tl-note__title">{title}</strong>
      <p className="tl-note__text">{text}</p>
    </motion.div>
  );
}
