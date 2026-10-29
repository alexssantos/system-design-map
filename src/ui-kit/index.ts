/**
 * Fachada tipada do Transly UI Kit (copiado de alexssantos/transly-ui-kit v1.3.0, ver README.md desta pasta).
 * Os componentes originais são JSX com JSDoc; aqui eles ganham tipos de props para o TypeScript do app.
 * Componentes novos deste projeto (Modal, NoteCard, TextField) seguem as mesmas regras do kit e o prefixo `tl-`.
 */
import type { MotionProps, Transition, Variants } from 'motion/react';
import type { ComponentType, CSSProperties, ReactNode } from 'react';
import { Alert as _Alert } from './components/Alert/Alert';
import { Avatar as _Avatar } from './components/Avatar/Avatar';
import { Badge as _Badge } from './components/Badge/Badge';
import { Button as _Button } from './components/Button/Button';
import { Card as _Card } from './components/Card/Card';
import { Chip as _Chip } from './components/Chip/Chip';
import { Icon as _Icon } from './components/Icon/Icon';
import { IconButton as _IconButton } from './components/IconButton/IconButton';
import { Kbd as _Kbd } from './components/Kbd/Kbd';
import { SectionLabel as _SectionLabel } from './components/SectionLabel/SectionLabel';
import { Slider as _Slider } from './components/Slider/Slider';
import { SegmentedControl as _SegmentedControl } from './components/SegmentedControl/SegmentedControl';
import { Switch as _Switch } from './components/Switch/Switch';
import { Tooltip as _Tooltip } from './components/Tooltip/Tooltip';
import { Waveform as _Waveform } from './components/Waveform/Waveform';

type Tone = 'accent' | 'neutral' | 'info' | 'voice' | 'success' | 'danger' | 'warning';
interface Base {
  className?: string;
  children?: ReactNode;
}

export const Icon = _Icon as unknown as ComponentType<{
  name: string;
  size?: number;
  anim?: 'hover' | 'loop' | 'play' | 'none';
  strokeWidth?: number;
  label?: string;
  className?: string;
  style?: CSSProperties;
}>;

export const Button = _Button as unknown as ComponentType<
  Base & {
    variant?: 'primary' | 'light' | 'dark' | 'ghost' | 'danger';
    size?: 'sm' | 'md' | 'lg';
    icon?: string;
    iconRight?: string;
    caps?: boolean;
    shine?: boolean;
    loading?: boolean;
    block?: boolean;
    disabled?: boolean;
    onClick?: () => void;
    title?: string;
  }
>;

export const IconButton = _IconButton as unknown as ComponentType<{
  icon: string;
  label: string;
  variant?: 'ghost' | 'soft' | 'solid' | 'accent' | 'outline';
  size?: 'sm' | 'md' | 'lg';
  active?: boolean;
  feedbackIcon?: string;
  feedbackLabel?: string;
  keys?: string[];
  tooltip?: boolean;
  anim?: 'hover' | 'loop' | 'none';
  onClick?: () => void;
  disabled?: boolean;
  className?: string;
}>;

export const Badge = _Badge as unknown as ComponentType<Base & { tone?: Tone; solid?: boolean; dot?: boolean; pulse?: boolean }>;

export const Alert = _Alert as unknown as ComponentType<{
  tone?: 'danger' | 'warning' | 'info' | 'voice';
  icon?: string;
  title: string;
  text?: string;
  action?: ReactNode;
  className?: string;
}>;

export const Card = _Card as unknown as ComponentType<
  Base & {
    variant?: 'surface' | 'sunken' | 'outline' | 'accent';
    padding?: 'none' | 'sm' | 'md' | 'lg';
    interactive?: boolean;
    onClick?: () => void;
    style?: CSSProperties;
  }
>;

export const Chip = _Chip as unknown as ComponentType<
  Base & { selected?: boolean; icon?: string; dot?: string; onClick?: () => void; onRemove?: () => void }
>;

export const SegmentedControl = _SegmentedControl as unknown as ComponentType<{
  options: { value: string; label: string; icon?: string; badge?: ReactNode }[];
  value: string;
  onChange: (v: string) => void;
  size?: 'sm' | 'md';
  iconOnly?: boolean;
  label?: string;
  className?: string;
}>;

export const Switch = _Switch as unknown as ComponentType<{
  checked: boolean;
  onChange: (v: boolean) => void;
  label?: string;
  hint?: string;
  disabled?: boolean;
  className?: string;
  'aria-label'?: string;
}>;

export const Tooltip = _Tooltip as unknown as ComponentType<
  Base & { label: string; keys?: string[]; side?: 'top' | 'bottom'; open?: boolean }
>;

export const Kbd = _Kbd as unknown as ComponentType<{ keys: string[]; size?: 'xs' | 'sm' | 'md' | 'lg'; lit?: boolean; className?: string }>;

export const SectionLabel = _SectionLabel as unknown as ComponentType<Base & { align?: 'center' | 'start'; action?: ReactNode }>;

export { cx } from './components/_utils/cx';
import * as m from './components/_utils/motion';

// Os presets do kit vêm de JS sem tipos literais; aqui recebem os tipos do motion.
export const spring = m.spring as unknown as Record<'snappy' | 'soft' | 'bouncy', Transition>;
export const ease = m.ease as unknown as Record<'out' | 'inOut' | 'in' | 'spring', [number, number, number, number]>;
export const duration = m.duration as Record<'instant' | 'fast' | 'base' | 'slow' | 'window' | 'loop', number>;
export const fadeUp = m.fadeUp as unknown as (i?: number) => MotionProps;
export const windowVariants = m.windowVariants as unknown as Variants;

export const Waveform = _Waveform as unknown as ComponentType<{
  live?: boolean;
  levels?: number[];
  bars?: number;
  height?: number;
  /** 0–1: barras já tocadas ficam acesas. */
  progress?: number;
  onLevel?: (v: number) => void;
  tone?: 'voice' | 'accent' | 'muted';
  className?: string;
}>;

export const Slider = _Slider as unknown as ComponentType<{
  value: number;
  onChange: (v: number) => void;
  min?: number;
  max?: number;
  step?: number;
  label?: string;
  format?: (v: number) => ReactNode;
  bubble?: boolean;
  disabled?: boolean;
  className?: string;
}>;

export const Avatar = _Avatar as unknown as ComponentType<{ name: string; src?: string; size?: number; className?: string }>;
