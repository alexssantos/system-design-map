import { useEffect, useRef, useState, type RefObject } from 'react';
import type { Theme } from '../theme';
import { caseById } from '../data/graph';
import { DiagramView } from '../diagrams/DiagramView';
import { diagramFor, diagramVersions, versionOf } from '../diagrams/data';
import type { Diagram } from '../diagrams/types';
import { exportFlowImage, runExport, type ImageFormat } from '../export/flowImage';
import { FormatPicker } from './FormatPicker';
import { Badge, Button, IconButton, SegmentedControl } from '../ui-kit';
import { CasePodcast, hasAudio, hasPodcast } from './CasePodcast';
import { Modal } from './kit/Modal';

const pad = (n: number) => String(n).padStart(2, '0');
/** Link da página do diagrama; a versão só entra no endereço quando não é a padrão. */
export const diagramHref = (caseId: string, version?: number) => {
  const latest = diagramVersions.get(caseId)?.[0];
  const suffix = version && latest && version !== versionOf(latest) ? `/v${version}` : '';
  return `${window.location.pathname}#/diagrama/${caseId}${suffix}`;
};

/** Diagrama sozinho ou, quando a versão tem episódio e o painel está aberto, com o podcast ao lado. */
function CaseBody({
  diagram,
  theme,
  listen,
  bodyRef,
  onVersion,
}: {
  diagram: Diagram;
  theme: Theme;
  listen: boolean;
  bodyRef: RefObject<HTMLDivElement | null>;
  onVersion: (v: number) => void;
}) {
  return (
    <div className="case-body" ref={bodyRef}>
      {listen && hasPodcast(diagram.caseId, versionOf(diagram)) ? (
        <CasePodcast key={versionOf(diagram)} diagram={diagram} colorMode={theme} onVersion={onVersion} />
      ) : (
        <DiagramView diagram={diagram} colorMode={theme} />
      )}
    </div>
  );
}

/** Troca entre as versões do diagrama; a mais nova é a padrão. Some quando o caso tem uma versão só. */
function VersionPicker({ caseId, version, onChange }: { caseId: string; version: number; onChange: (v: number) => void }) {
  const list = diagramVersions.get(caseId) ?? [];
  if (list.length < 2) return null;
  return (
    <SegmentedControl
      size="sm"
      label="Versão do diagrama"
      value={String(version)}
      onChange={(v) => onChange(Number(v))}
      options={list.map((d, i) => ({ value: String(versionOf(d)), label: i === 0 ? `v${versionOf(d)} · atual` : `v${versionOf(d)}` }))}
    />
  );
}

/** Baixa o diagrama do caso inteiro do jeito que ele aparece agora (tema e destaques), em PNG ou SVG animado. */
function DownloadDiagram({ caseId, version, bodyRef }: { caseId: string; version: number; bodyRef: RefObject<HTMLDivElement | null> }) {
  const [busy, setBusy] = useState(false);
  const [format, setFormat] = useState<ImageFormat>('png');
  const c = caseById.get(caseId)!;
  return (
    <div className="diagram-download">
      <FormatPicker value={format} onChange={setFormat} />
      <IconButton
        icon="download"
        label={busy ? 'Gerando imagem…' : `Baixar diagrama (${format === 'svg' ? 'SVG animado' : 'PNG'})`}
        disabled={busy}
        onClick={() =>
          bodyRef.current && runExport(setBusy, () => exportFlowImage(bodyRef.current!, { fileName: `caso ${pad(c.number)} ${c.title} v${version}`, format }))
        }
      />
    </div>
  );
}

function ListenToggle({ caseId, version, listen, setListen }: { caseId: string; version: number; listen: boolean; setListen: (v: boolean) => void }) {
  if (!hasPodcast(caseId, version)) return null;
  const audio = hasAudio(caseId, version);
  return (
    <Button variant={listen ? 'light' : 'dark'} size="sm" icon={audio ? 'waveform' : 'text'} onClick={() => setListen(!listen)}>
      {listen ? (audio ? 'Esconder podcast' : 'Esconder roteiro') : audio ? 'Ouvir podcast' : 'Roteiro do podcast'}
    </Button>
  );
}

/** Versão em exibição: começa na pedida (ou na padrão) e volta a ela quando outro caso é aberto. */
function useVersion(caseId: string | null, initial?: number) {
  const pickInitial = () => (caseId ? versionOf(diagramFor(caseId, initial)!) : 1);
  const [version, setVersion] = useState(pickInitial);
  useEffect(() => setVersion(pickInitial()), [caseId, initial]);
  return [version, setVersion] as const;
}

function Title({ caseId }: { caseId: string }) {
  const c = caseById.get(caseId)!;
  return (
    <>
      <Badge tone="accent">Caso {pad(c.number)}</Badge>
      {c.title}
      <Badge tone="neutral">nível {c.tier}</Badge>
    </>
  );
}

/** Diagrama do caso numa janela sobre o mapa. */
export function DiagramModal({
  caseId,
  version: initial,
  theme,
  onClose,
}: {
  caseId: string | null;
  version?: number;
  theme: Theme;
  onClose: () => void;
}) {
  const [version, setVersion] = useVersion(caseId, initial);
  const diagram = caseId ? diagramFor(caseId, version) : undefined;
  const [listen, setListen] = useState(true);
  const bodyRef = useRef<HTMLDivElement>(null);
  return (
    <Modal
      open={Boolean(diagram)}
      onClose={onClose}
      title={caseId && <Title caseId={caseId} />}
      subtitle={diagram?.headline}
      actions={
        caseId && (
          <>
            <VersionPicker caseId={caseId} version={version} onChange={setVersion} />
            <ListenToggle caseId={caseId} version={version} listen={listen} setListen={setListen} />
            <DownloadDiagram caseId={caseId} version={version} bodyRef={bodyRef} />
            <IconButton icon="external" label="Abrir em nova guia" onClick={() => window.open(diagramHref(caseId, version), '_blank')} />
            <IconButton icon="close" label="Fechar" keys={['Esc']} onClick={onClose} />
          </>
        )
      }
    >
      {diagram && <CaseBody diagram={diagram} theme={theme} listen={listen} bodyRef={bodyRef} onVersion={setVersion} />}
    </Modal>
  );
}

/** Diagrama em página própria, para a guia nova (#/diagrama/<caso>). */
export function DiagramPage({
  caseId,
  version: initial,
  theme,
  toggleTheme,
}: {
  caseId: string;
  version?: number;
  theme: Theme;
  toggleTheme: () => void;
}) {
  const [version, setVersion] = useVersion(caseId, initial);
  const diagram = diagramFor(caseId, version);
  const [listen, setListen] = useState(true);
  const changeVersion = (v: number) => {
    setVersion(v);
    window.history.replaceState(null, '', diagramHref(caseId, v));
  };
  const bodyRef = useRef<HTMLDivElement>(null);
  if (!diagram) {
    return (
      <div className="page-missing">
        <p>Não existe diagrama para “{caseId}”.</p>
        <Button variant="light" icon="chevron-left" onClick={() => (window.location.hash = '')}>
          Voltar ao mapa
        </Button>
      </div>
    );
  }
  return (
    <div className="diagram-page">
      <header className="tl-modal__head">
        <div className="tl-modal__titles">
          <div className="tl-modal__title">
            <Title caseId={caseId} />
          </div>
          <div className="tl-modal__sub">{diagram.headline}</div>
        </div>
        <div className="tl-modal__actions">
          <VersionPicker caseId={caseId} version={version} onChange={changeVersion} />
          <ListenToggle caseId={caseId} version={version} listen={listen} setListen={setListen} />
          <DownloadDiagram caseId={caseId} version={version} bodyRef={bodyRef} />
          <Button variant="dark" size="sm" icon="chevron-left" onClick={() => (window.location.hash = '')}>
            Mapa
          </Button>
          <IconButton icon={theme === 'dark' ? 'sun' : 'moon'} label="Trocar tema" variant="soft" onClick={toggleTheme} />
        </div>
      </header>
      <div className="diagram-page__body">
        <CaseBody diagram={diagram} theme={theme} listen={listen} bodyRef={bodyRef} onVersion={changeVersion} />
      </div>
    </div>
  );
}
