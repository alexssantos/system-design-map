import { Avatar, Icon } from '../ui-kit';

export type Page = 'system-design' | 'ai';

const GITHUB_USER = 'alexssantos';

export const pageHref: Record<Page, string> = { 'system-design': '#/', ai: '#/ai' };

const items: { page: Page; icon: string; label: string; hint: string }[] = [
  { page: 'system-design', icon: 'grid', label: 'System Design', hint: 'Conceitos, padrões e os 15 casos de estudo' },
  { page: 'ai', icon: 'sparkles', label: 'Engenharia de AI', hint: 'Termos do livro AI Engineering, em ordem de estudo' },
];

/** Menu lateral que separa as páginas de mapa. A foto do GitHub fica no topo, com o pulse. */
export function SideNav({ page }: { page: Page }) {
  return (
    <nav className="sidenav" aria-label="Mapas">
      <a
        className="brand__avatar sidenav__avatar"
        href={`https://github.com/${GITHUB_USER}`}
        target="_blank"
        rel="noreferrer"
        title={`Perfil de ${GITHUB_USER} no GitHub`}
        aria-label={`Abrir o perfil de ${GITHUB_USER} no GitHub`}
      >
        <Avatar name={GITHUB_USER} src={`https://github.com/${GITHUB_USER}.png?size=96`} size={34} />
      </a>
      <ul className="sidenav__list">
        {items.map((it) => (
          <li key={it.page}>
            <a
              className="sidenav__item tl-animhost"
              href={pageHref[it.page]}
              aria-current={page === it.page ? 'page' : undefined}
              title={it.hint}
            >
              <Icon name={it.icon} size={20} />
              <span>{it.label}</span>
            </a>
          </li>
        ))}
      </ul>
    </nav>
  );
}
