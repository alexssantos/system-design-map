import { describe, expect, it } from 'vitest';

// Uma var(--x) sem definição vira valor inválido e o navegador descarta a propriedade
// sem erro (foi assim que as linhas de "relacionados" sumiram ao trocar para o UI Kit).
const sources = import.meta.glob<string>(['./**/*.{ts,tsx,css}', '!./**/*.test.ts'], {
  query: '?raw',
  import: 'default',
  eager: true,
});

const all = Object.values(sources).join('\n');
const defined = new Set([...all.matchAll(/(--[\w-]+)\s*:|'(--[\w-]+)'/g)].map((m) => m[1] ?? m[2]));

describe('variáveis CSS', () => {
  it('toda var(--x) usada no app está definida em algum lugar', () => {
    const missing = new Set<string>();
    for (const [file, text] of Object.entries(sources)) {
      if (file.includes('ui-kit')) continue;
      for (const m of text.matchAll(/var\((--[\w-]+)\)/g)) {
        if (!defined.has(m[1])) missing.add(`${m[1]} em ${file}`);
      }
    }
    expect([...missing]).toEqual([]);
  });
});
