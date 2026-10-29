import { AnimatePresence, motion } from 'motion/react';
import { Icon, IconButton, cx, spring } from '../../ui-kit';
import './TextField.css';

interface Props {
  value: string;
  onChange: (v: string) => void;
  placeholder?: string;
  label: string;
  className?: string;
}

/** TextField — campo de busca de uma linha no estilo da SearchBar do kit (anel limão no foco, limpar com mola). */
export function TextField({ value, onChange, placeholder, label, className }: Props) {
  return (
    <div className={cx('tl-field', className)}>
      <Icon name="search" size={18} className="tl-field__icon" />
      <input
        className="tl-field__input"
        type="text"
        value={value}
        placeholder={placeholder}
        aria-label={label}
        spellCheck={false}
        onChange={(e) => onChange(e.target.value)}
        onKeyDown={(e) => e.key === 'Escape' && onChange('')}
      />
      <AnimatePresence>
        {value && (
          <motion.span initial={{ scale: 0, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ scale: 0, opacity: 0 }} transition={spring.bouncy}>
            <IconButton icon="close" label="Limpar" size="sm" onClick={() => onChange('')} keys={['Esc']} />
          </motion.span>
        )}
      </AnimatePresence>
    </div>
  );
}
