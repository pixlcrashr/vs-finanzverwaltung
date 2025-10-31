import { component$, Slot, useStylesScoped$ } from "@builder.io/qwik";
import { Link, useLocation } from "@builder.io/qwik-city";
import styles from "./Content.scss?inline";

const menuItems = [
  {
    name: 'Haushaltsmatrix',
    path: '/matrix'
  },
  {
    name: 'Haushaltspläne',
    path: '/budgets'
  },
  {
    name: 'Haushaltskonten',
    path: '/accounts'
  },
  {
    name: 'Journal',
    path: '/journal'
  },
  {
    name: 'Buchhaltung importieren...',
    path: '/import'
  },
  {
    name: 'Einstellungen',
    path: '/settings'
  }
];

export default component$(() => {
  useStylesScoped$(styles);
  const location = useLocation();

  return (
    <div class="columns">
      <div class="nav-menu column">
        <div class="menu-logo">
          <img
            height="28"
            width="28"
            src="/assets/logo.svg"
            alt="Bulma logo"
          />
          <h1>AStA TUHH</h1>
        </div>

        <aside class="menu p-4">
          <ul class="menu-list">
            {menuItems.map(({ name, path }) => <li key="name">
              <Link class={["menu-list-link", { 'is-active': location.url.pathname.startsWith(path) }]} href={path}>{name}</Link>
            </li>)}
          </ul>
        </aside>
      </div>
      <div class="column content-column">
        <div class="content-container">
          <Slot />
        </div>
      </div>
    </div>
  );
});
