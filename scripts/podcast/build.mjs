#!/usr/bin/env node
/**
 * Junta os áudios de cada fala (gerados na ElevenLabs, um arquivo por fala) num único mp3
 * e grava os tempos de início/fim de cada fala, para sincronizar transcrição e diagrama.
 *
 * Uso: node scripts/podcast/build.mjs <pasta-com-00.mp3...> <caso> [turnosPorCapitulo,...]
 *   ex.: node scripts/podcast/build.mjs ./audio url-shortener 6,4,4,4,4,8,4,6,4,6
 * Saída: public/podcasts/<caso>.mp3 e src/podcasts/<caso>.timing.json
 * Requer ffmpeg e ffprobe no PATH.
 */
import { execFileSync } from 'node:child_process';
import { mkdirSync, mkdtempSync, readdirSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';

const [dir, caseId, chapterSizes] = process.argv.slice(2);
if (!dir || !caseId) {
  console.error('uso: build.mjs <pasta> <caso> [turnosPorCapitulo,...]');
  process.exit(1);
}

const RATE = 44100;
const GAP = 0.35; // pausa entre falas
const CHAPTER_GAP = 0.9; // pausa maior na troca de capítulo
const BARS = 160; // barras da forma de onda

const files = readdirSync(dir).filter((f) => /^\d+\.mp3$/.test(f)).sort((a, b) => parseInt(a) - parseInt(b));
const chapterEnds = new Set();
if (chapterSizes) {
  let acc = 0;
  for (const n of chapterSizes.split(',').map(Number)) chapterEnds.add((acc += n) - 1);
}

// Decodifica tudo para PCM mono 16 bits e mede pelo número de amostras: tempos exatos, sem depender do cabeçalho mp3.
const decode = (file) => execFileSync('ffmpeg', ['-v', 'error', '-i', file, '-ac', '1', '-ar', String(RATE), '-f', 's16le', '-'], { maxBuffer: 1 << 28 });
const silence = (s) => Buffer.alloc(Math.round(s * RATE) * 2);

const parts = [];
const turns = [];
let samples = 0;
files.forEach((f, i) => {
  const pcm = decode(join(dir, f));
  const start = samples / RATE;
  parts.push(pcm);
  samples += pcm.length / 2;
  turns.push({ start: +start.toFixed(3), end: +(samples / RATE).toFixed(3) });
  if (i < files.length - 1) {
    const gap = silence(chapterEnds.has(i) ? CHAPTER_GAP : GAP);
    parts.push(gap);
    samples += gap.length / 2;
  }
});
const all = Buffer.concat(parts);
const duration = samples / RATE;

// Forma de onda: RMS por barra, normalizado pelo percentil 95 (um pico isolado não achata o resto).
const per = Math.floor(samples / BARS);
const rms = Array.from({ length: BARS }, (_, b) => {
  let sum = 0;
  for (let k = b * per; k < (b + 1) * per; k++) {
    const v = all.readInt16LE(k * 2) / 32768;
    sum += v * v;
  }
  return Math.sqrt(sum / per);
});
const ref = [...rms].sort((a, b) => a - b)[Math.floor(BARS * 0.95)];
const levels = rms.map((v) => +Math.min(1, Math.max(0.08, (v / ref) ** 0.7)).toFixed(2));

const tmp = mkdtempSync(join(tmpdir(), 'podcast-'));
const raw = join(tmp, 'all.pcm');
writeFileSync(raw, all);
mkdirSync('public/podcasts', { recursive: true });
const audio = `podcasts/${caseId}.mp3`;
execFileSync('ffmpeg', ['-v', 'error', '-y', '-f', 's16le', '-ar', String(RATE), '-ac', '1', '-i', raw, '-codec:a', 'libmp3lame', '-b:a', '64k', `public/${audio}`]);

writeFileSync(`src/podcasts/${caseId}.timing.json`, [
    '{',
    `  "audio": ${JSON.stringify(audio)},`,
    `  "duration": ${+duration.toFixed(3)},`,
    `  "levels": ${JSON.stringify(levels)},`,
    '  "turns": [',
    turns.map((t) => `    ${JSON.stringify(t)}`).join(',\n'),
    '  ]',
    '}',
    '',
  ].join('\n'));
console.log(`${files.length} falas, ${(duration / 60).toFixed(1)} min -> public/${audio}`);
