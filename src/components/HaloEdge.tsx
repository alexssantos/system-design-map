import { BaseEdge, Position, getBezierPath, type Edge, type EdgeProps } from '@xyflow/react';

export type HaloEdgeData = {
  /** Cor da linha, do ponto de saída e da seta. */
  color?: string;
  /** Mostra o ponto de saída (de onde a conexão vem). */
  dot?: boolean;
};
export type HaloEdgeType = Edge<HaloEdgeData, 'halo'>;

/** Distância mínima que a linha se afasta da caixa antes de fazer a curva. */
const OUT = 28;

/**
 * Linha com contorno da cor do fundo, ponto na saída e seta na chegada, para dar para ver de onde vem e para
 * onde vai mesmo passando perto de outras caixas. Quando saída e chegada estão do mesmo lado (dois tópicos
 * da mesma coluna), faz um arco largo por fora em vez de colar na borda.
 */
export function HaloEdge({ id, sourceX, sourceY, targetX, targetY, sourcePosition, targetPosition, style, markerEnd, data }: EdgeProps<HaloEdgeType>) {
  let path: string;
  if (sourcePosition === Position.Right && targetPosition === Position.Right) {
    const bulge = Math.max(sourceX, targetX) + OUT + Math.min(48, Math.abs(targetY - sourceY) * 0.15);
    path = `M ${sourceX},${sourceY} C ${bulge},${sourceY} ${bulge},${targetY} ${targetX},${targetY}`;
  } else {
    // Curvatura maior que a padrão afasta a linha da borda das caixas.
    [path] = getBezierPath({ sourceX, sourceY, targetX, targetY, sourcePosition, targetPosition, curvature: 0.45 });
  }
  const color = data?.color ?? (style?.stroke as string | undefined) ?? 'var(--color-text-2)';
  const width = Number(style?.strokeWidth ?? 1.5);
  return (
    <>
      <path className="halo-edge__halo" d={path} fill="none" strokeWidth={width + 5} style={{ opacity: style?.opacity }} />
      <BaseEdge id={id} path={path} style={style} markerEnd={markerEnd} />
      {data?.dot && <circle className="halo-edge__dot" cx={sourceX} cy={sourceY} r={4} fill={color} style={{ opacity: style?.opacity }} />}
    </>
  );
}

export const edgeTypes = { halo: HaloEdge };
