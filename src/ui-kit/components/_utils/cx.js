/** Junta classes CSS ignorando valores falsos. cx('a', cond && 'b') */
export const cx = (...parts) => parts.filter(Boolean).join(' ');
