import { AnimatePresence, motion } from 'motion/react';
import { useEffect, type ReactNode } from 'react';
import { createPortal } from 'react-dom';
import { duration, ease, windowVariants } from '../../ui-kit';
import './Modal.css';

interface Props {
  open: boolean;
  onClose: () => void;
  title: ReactNode;
  subtitle?: ReactNode;
  /** Botões no canto do cabeçalho, antes do fechar. */
  actions?: ReactNode;
  children: ReactNode;
}

/**
 * Modal — janela grande sobre um véu escuro, com a mesma abertura da janela flutuante do kit
 * (escala + queda + desfoque, mola `soft`). Fecha com Esc ou clique no véu.
 */
export function Modal({ open, onClose, title, subtitle, actions, children }: Props) {
  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => e.key === 'Escape' && onClose();
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [open, onClose]);

  return createPortal(
    <AnimatePresence>
      {open && (
        <motion.div
          className="tl-modal__scrim"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0, transition: { duration: duration.base, ease: ease.in } }}
          onClick={onClose}
        >
          <motion.div
            className="tl-modal"
            role="dialog"
            aria-modal="true"
            variants={windowVariants}
            initial="hidden"
            animate="shown"
            exit="exit"
            onClick={(e) => e.stopPropagation()}
          >
            <header className="tl-modal__head">
              <div className="tl-modal__titles">
                <div className="tl-modal__title">{title}</div>
                {subtitle && <div className="tl-modal__sub">{subtitle}</div>}
              </div>
              <div className="tl-modal__actions">{actions}</div>
            </header>
            <div className="tl-modal__body">{children}</div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>,
    document.body,
  );
}
