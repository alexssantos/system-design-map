# Transly UI Kit (cópia local)

Tokens, estilos, ícones e componentes copiados de [alexssantos/transly-ui-kit](https://github.com/alexssantos/transly-ui-kit) **v1.3.0** (commit `728c6f6`, MIT, ver `LICENSE`). As regras de identidade e movimento estão no `DESIGN.md` do kit.

- `styles/`, `tokens.json`, `assets/icons/` e `components/*` são cópias sem alteração. Para atualizar, copie de novo a partir do kit e registre no CHANGELOG.
- `index.ts` é a fachada tipada que o app importa.
- Componentes copiados até agora: Alert, Avatar, Badge, Button, Card, Chip, Icon, IconButton, Kbd, SectionLabel, SegmentedControl, Slider, Spinner, Switch, Tooltip, Transcript e Waveform (Avatar, Slider, Transcript e Waveform entraram na 0.3.0, para o player do podcast).
- Componentes novos criados aqui, no estilo do kit (prefixo `tl-`): `Modal`, `NoteCard`, `TextField` e `PodcastTranscript` (transcrição com avatar de quem fala, usa o CSS do `Transcript` do kit) em `src/components/kit/`. São candidatos a voltar para o kit.
