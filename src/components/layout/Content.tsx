import { component$, Slot } from "@builder.io/qwik";

export default component$(() => {
  return (
    <div class="columns">
      <div class="column is-2">
        <aside class="menu p-4">
          <ul class="menu-list">
            <li>
              <a href="/budgets">Haushalt</a>
              <ul>
                <li><a href="/matrix">Matrix</a></li>
                <li><a href="/budgets">Pläne</a></li>
                <li><a href="/accounts">Konten</a></li>
              </ul>
            </li>
            <li>
              <a>Buchhaltung</a>
              <ul>
                <li><a>Journal</a></li>
                <li><a>Buchhalterische Konten</a></li>
                <li><a>Importieren...</a></li>
              </ul>
            </li>
          </ul>
        </aside>
      </div>
      <div class="column">
        <Slot />
      </div>
    </div>
  );
})
