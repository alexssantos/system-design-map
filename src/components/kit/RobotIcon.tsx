/**
 * Ícone de robô (agente) no mesmo traço do Icon do kit: 24×24, stroke 1.75, cantos arredondados.
 * O kit não tem robô; este fica fora de src/ui-kit para não alterar a cópia do kit.
 * No hover de um ancestral `tl-animhost`, os olhos piscam e a antena acende.
 */
export function RobotIcon({ size = 20 }: { size?: number }) {
  return (
    <svg
      className="tl-icon kit-robot"
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={1.75}
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden
    >
      <path d="M12 3.5v3" />
      <circle className="kit-robot__tip" cx="12" cy="3" r="1" />
      <rect x="4.5" y="6.5" width="15" height="12" rx="3.5" />
      <path d="M2.5 11.5v3M21.5 11.5v3" />
      <g className="kit-robot__eyes">
        <path d="M9.5 11v1.5M14.5 11v1.5" />
      </g>
      <path d="M9.5 15.5h5" />
    </svg>
  );
}
