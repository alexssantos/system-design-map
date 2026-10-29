import type { ImageFormat } from '../export/flowImage';
import { SegmentedControl } from '../ui-kit';

/** Escolhe o formato dos downloads: PNG é uma foto do momento, SVG continua animado no navegador. */
export function FormatPicker({ value, onChange }: { value: ImageFormat; onChange: (v: ImageFormat) => void }) {
  return (
    <SegmentedControl
      size="sm"
      label="Formato do download"
      value={value}
      onChange={(v) => onChange(v as ImageFormat)}
      options={[
        { value: 'png', label: 'PNG' },
        { value: 'svg', label: 'SVG animado' },
      ]}
    />
  );
}
