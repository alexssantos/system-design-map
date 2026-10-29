import { useState } from 'react';
import type { Theme } from '../theme';
import { caseById } from '../data/graph';
import { DiagramView } from '../diagrams/DiagramView';
import { diagramByCase } from '../diagrams/data';
import { Badge, Button, IconButton } from '../ui-kit';
import { CasePodcast, hasPodcast } from './CasePodcast';
import { Modal } from './kit/Modal';

const pad = (n: number) => String(n).padStart(2, '0');
const hrefOf = (caseId: string) => `${window.location.pathname}#/diagrama/${caseId}`;

/** Diagrama sozinho ou, quando o caso tem episódio e o painel está aberto, com o podcast ao lado. */
function CaseBody({ caseId, theme, listen }: { caseId: string; theme: Theme; listen: boolean }) {
  const diagram = diagramByCase.get(caseId)!;
  return listen && hasPodcast(caseId) ? <CasePodcast diagram={diagram} colorMode={theme} /> : <DiagramView diagram={diagram} colorMode={theme} />;
}

function ListenToggle({ caseId, listen, setListen }: { caseId: string; listen: boolean; setListen: (v: boolean) => void }) {
  if (!hasPodcast(caseId)) return null;
  return (
    <Button variant={listen ? 'light' : 'dark'} size="sm" icon="waveform" onClick={() => setListen(!listen)}>
      {listen ? 'Esconder podcast' : 'Ouvir podcast'}
    </Button>
  );
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
export function DiagramModal({ caseId, theme, onClose }: { caseId: string | null; theme: Theme; onClose: () => void }) {
  const diagram = caseId ? diagramByCase.get(caseId) : undefined;
  const [listen, setListen] = useState(true);
  return (
    <Modal
      open={Boolean(diagram)}
      onClose={onClose}
      title={caseId && <Title caseId={caseId} />}
      subtitle={diagram?.headline}
      actions={
        caseId && (
          <>
            <ListenToggle caseId={caseId} listen={listen} setListen={setListen} />
            <IconButton icon="external" label="Abrir em nova guia" onClick={() => window.open(hrefOf(caseId), '_blank')} />
            <IconButton icon="close" label="Fechar" keys={['Esc']} onClick={onClose} />
          </>
        )
      }
    >
      {diagram && caseId && <CaseBody caseId={caseId} theme={theme} listen={listen} />}
    </Modal>
  );
}

/** Diagrama em página própria, para a guia nova (#/diagrama/<caso>). */
export function DiagramPage({ caseId, theme, toggleTheme }: { caseId: string; theme: Theme; toggleTheme: () => void }) {
  const diagram = diagramByCase.get(caseId);
  const [listen, setListen] = useState(true);
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
          <ListenToggle caseId={caseId} listen={listen} setListen={setListen} />
          <Button variant="dark" size="sm" icon="chevron-left" onClick={() => (window.location.hash = '')}>
            Mapa
          </Button>
          <IconButton icon={theme === 'dark' ? 'sun' : 'moon'} label="Trocar tema" variant="soft" onClick={toggleTheme} />
        </div>
      </header>
      <div className="diagram-page__body">
        <CaseBody caseId={caseId} theme={theme} listen={listen} />
      </div>
    </div>
  );
}
