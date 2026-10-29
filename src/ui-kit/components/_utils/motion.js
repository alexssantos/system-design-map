// Presets de movimento para motion/react, lidos de tokens.json (mesma fonte do CSS).
import tokens from '../../tokens.json';

const springOf = (name) => {
  const [stiffness, damping] = tokens.motion.spring[name].$value.split(' ').map(Number);
  return { type: 'spring', stiffness, damping };
};
// "cubic-bezier(0.55, 0, 1, 0.45)" → [0.55, 0, 1, 0.45] (só o que está entre parênteses: o hífen do nome não é número)
const bezier = (name) => tokens.motion.ease[name].$value.replace(/^[^(]*\(|\)\s*$/g, '').split(',').map(Number);
const ms = (name) => parseInt(tokens.motion.duration[name].$value, 10) / 1000;

export const spring = { snappy: springOf('snappy'), soft: springOf('soft'), bouncy: springOf('bouncy') };
export const ease = { out: bezier('out'), inOut: bezier('in-out'), in: bezier('in'), spring: bezier('spring') };
export const duration = { instant: ms('instant'), fast: ms('fast'), base: ms('base'), slow: ms('slow'), window: ms('window'), loop: ms('loop') };

/**
 * Entrada padrão de blocos (sobe 4px e aparece). Use com <motion.div {...fadeUp(i)} />.
 * Curta de propósito: ao trocar de tela o conteúdo precisa estar legível quase na hora (todo bloco visível em ~0,3 s).
 */
export const fadeUp = (i = 0) => ({
  initial: { opacity: 0, y: 4 },
  animate: { opacity: 1, y: 0 },
  exit: { opacity: 0, y: -4, transition: { duration: duration.instant, ease: ease.in } },
  transition: { duration: duration.fast, ease: ease.out, delay: Math.min(i, 5) * 0.02 },
});

/**
 * Abertura da janela flutuante: escala + desfoque + leve queda (ver DESIGN.md §5).
 * O desfoque termina em `none`: um `blur(0px)` que fica aplicado faz o navegador repintar a janela inteira a cada quadro.
 */
export const windowVariants = {
  hidden: { opacity: 0, scale: 0.94, y: -18, filter: 'blur(10px)' },
  shown: { opacity: 1, scale: 1, y: 0, filter: 'blur(0px)', transitionEnd: { filter: 'none' }, transition: { ...spring.soft, opacity: { duration: duration.base, ease: ease.out }, filter: { duration: duration.base } } },
  exit: { opacity: 0, scale: 0.96, y: -10, filter: 'blur(6px)', transition: { duration: duration.base, ease: ease.in } },
};
