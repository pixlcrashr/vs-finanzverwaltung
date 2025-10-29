import { component$, Slot, useStylesScoped$ } from "@builder.io/qwik";
import styles from "./Content.scss?inline";
import { useLocation } from "@builder.io/qwik-city";

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
            {menuItems.map(({name, path}) => <li>
              <a class={[{'is-active': location.url.pathname.startsWith(path)}]} href={path}>{name}</a>
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
})
