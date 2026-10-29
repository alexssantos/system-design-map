import { toPng, toSvg } from 'html-to-image';

/** Margem em volta do recorte, em px do canvas. */
const PADDING = 48;
/** Maior lado da imagem final (antes do pixelRatio), para o navegador não estourar a memória do canvas. */
const MAX_SIDE = 6000;

export type ImageFormat = 'png' | 'svg';

export interface FlowImageOptions {
  fileName: string;
  /** PNG é uma foto do momento; SVG continua animado quando aberto no navegador. */
  format?: ImageFormat;
  /** Quais nós entram na imagem (pelo id do React Flow). Sem filtro, entram todos. */
  includeNode?: (id: string) => boolean;
  /** Quais arestas entram na imagem. Sem filtro, entram todas as que estão desenhadas. */
  includeEdge?: (id: string) => boolean;
  /** Nós de fundo (áreas, faixas): num recorte, entram só quando cruzam o quadro dos nós escolhidos. */
  isContainer?: (id: string) => boolean;
}

interface Box {
  x: number;
  y: number;
  w: number;
  h: number;
}

/** Lê a posição do nó no canvas a partir do transform que o React Flow escreve no estilo. */
function boxOf(el: HTMLElement): Box | null {
  const m = /translate\(\s*(-?[\d.]+)px\s*,\s*(-?[\d.]+)px\s*\)/.exec(el.style.transform);
  if (!m) return null;
  return { x: Number(m[1]), y: Number(m[2]), w: el.offsetWidth, h: el.offsetHeight };
}

const overlaps = (a: Box, b: Box) => a.x < b.x + b.w && b.x < a.x + a.w && a.y < b.y + b.h && b.y < a.y + a.h;

function slug(s: string) {
  return s
    .normalize('NFD')
    .replace(/\p{Diacritic}/gu, '')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-|-$/g, '');
}

/** Propriedades de SVG que vêm de classes CSS e precisam ir para o estilo inline antes da cópia. */
const SVG_PROPS = ['stroke', 'stroke-width', 'stroke-dasharray', 'stroke-opacity', 'fill', 'fill-opacity', 'opacity', 'filter', 'animation'] as const;

/**
 * O html-to-image não copia o estilo computado dos elementos dentro de um <svg> das arestas, então as linhas
 * que pegam a cor por classe (as dos diagramas) saíam invisíveis. Escreve o estilo inline e devolve como desfazer.
 */
function inlineEdgeStyles(viewport: HTMLElement) {
  const undo: (() => void)[] = [];
  for (const el of viewport.querySelectorAll<SVGElement>('.react-flow__edge path, .react-flow__edge circle')) {
    const before = el.getAttribute('style');
    const cs = getComputedStyle(el);
    for (const prop of SVG_PROPS) el.style.setProperty(prop, cs.getPropertyValue(prop));
    undo.push(() => (before === null ? el.removeAttribute('style') : el.setAttribute('style', before)));
  }
  return () => undo.forEach((fn) => fn());
}

/**
 * O SVG leva o estilo computado de cada elemento, inclusive o nome das animações CSS, mas não as regras
 * @keyframes. Junta as da página para o arquivo continuar animando sozinho.
 */
function pageKeyframes() {
  const out: string[] = [];
  for (const sheet of document.styleSheets) {
    let rules: CSSRuleList;
    try {
      rules = sheet.cssRules;
    } catch {
      continue; // folha de outra origem
    }
    for (const rule of rules) if (rule instanceof CSSKeyframesRule) out.push(rule.cssText);
  }
  return out.join('\n');
}

/** Monta o arquivo final: keyframes da página e um fundo fixo (o fundo do clone anda junto com o transform). */
function finishSvg(svgDataUrl: string, background: string) {
  const svg = decodeURIComponent(svgDataUrl.slice(svgDataUrl.indexOf(',') + 1));
  const head = `<style><![CDATA[${pageKeyframes()}]]></style><rect width="100%" height="100%" fill="${background}"/>`;
  return svg.replace(/^(<svg[^>]*>)/, `$1${head}`);
}

function download(href: string, fileName: string, format: ImageFormat) {
  const a = document.createElement('a');
  a.href = href;
  a.download = `${slug(fileName)}.${format}`;
  a.click();
}

/**
 * Exporta um React Flow como PNG ou SVG, enquadrando só os nós escolhidos.
 * Trabalha direto no DOM (`.react-flow__viewport`), então serve tanto para o mapa quanto para os diagramas.
 */
export async function exportFlowImage(root: HTMLElement, opts: FlowImageOptions) {
  const flow = root.matches('.react-flow') ? root : root.querySelector<HTMLElement>('.react-flow');
  const viewport = flow?.querySelector<HTMLElement>('.react-flow__viewport');
  if (!flow || !viewport) throw new Error('Canvas do diagrama não encontrado');

  const nodeEls = [...viewport.querySelectorAll<HTMLElement>('.react-flow__node')];
  const keep = new Set<string>();
  const boxes: Box[] = [];
  const containers: { id: string; box: Box }[] = [];
  for (const el of nodeEls) {
    const id = el.dataset.id;
    const box = boxOf(el);
    if (!id || !box || el.style.visibility === 'hidden') continue;
    // No mapa inteiro as áreas também definem o enquadramento; num recorte elas só entram se cruzarem o quadro.
    if (opts.isContainer?.(id) && opts.includeNode) {
      containers.push({ id, box });
      continue;
    }
    if (opts.includeNode && !opts.includeNode(id)) continue;
    keep.add(id);
    boxes.push(box);
  }
  if (!boxes.length) throw new Error('Nada para exportar');

  const minX = Math.min(...boxes.map((b) => b.x)) - PADDING;
  const minY = Math.min(...boxes.map((b) => b.y)) - PADDING;
  const maxX = Math.max(...boxes.map((b) => b.x + b.w)) + PADDING;
  const maxY = Math.max(...boxes.map((b) => b.y + b.h)) + PADDING;
  const frame = { x: minX, y: minY, w: maxX - minX, h: maxY - minY };
  // Áreas de fundo entram quando cruzam o recorte, para o grupo continuar legível.
  for (const c of containers) if (overlaps(c.box, frame)) keep.add(c.id);

  const scale = Math.min(1, MAX_SIDE / Math.max(frame.w, frame.h));
  const width = Math.ceil(frame.w * scale);
  const height = Math.ceil(frame.h * scale);

  const format = opts.format ?? 'png';
  const background = getComputedStyle(flow).getPropertyValue('--xy-background-color').trim() || getComputedStyle(document.body).backgroundColor;
  const restore = inlineEdgeStyles(viewport);
  const render = format === 'svg' ? toSvg : toPng;
  const dataUrl = await render(viewport, {
    width,
    height,
    pixelRatio: 2,
    backgroundColor: format === 'png' ? background : undefined,
    style: {
      width: `${width}px`,
      height: `${height}px`,
      transform: `translate(${-frame.x * scale}px, ${-frame.y * scale}px) scale(${scale})`,
    },
    filter: (el) => {
      // Nós de texto e comentários também passam por aqui e não têm classList.
      const cls = el.classList;
      if (!cls) return true;
      // Pontos que andam pelas linhas (animateMotion) ficariam parados no começo da aresta numa foto.
      if (format === 'png' && el.tagName === 'circle' && el.querySelector('animateMotion')) return false;
      if (cls.contains('react-flow__node')) return keep.has(el.getAttribute('data-id') ?? '');
      if (cls.contains('react-flow__edge') && opts.includeEdge) return opts.includeEdge(el.getAttribute('data-id') ?? '');
      return true;
    },
  }).finally(restore);
  if (format === 'png') return download(dataUrl, opts.fileName, format);
  const url = URL.createObjectURL(new Blob([finishSvg(dataUrl, background)], { type: 'image/svg+xml' }));
  download(url, opts.fileName, format);
  setTimeout(() => URL.revokeObjectURL(url), 10_000);
}

/** Guarda o estado "gerando imagem" de um botão de download e avisa no console se falhar. */
export function runExport(setBusy: (v: boolean) => void, job: () => Promise<void>) {
  setBusy(true);
  job()
    .catch((err) => console.error('Falha ao exportar imagem', err))
    .finally(() => setBusy(false));
}
