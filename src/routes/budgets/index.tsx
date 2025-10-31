import { component$, useStylesScoped$ } from "@builder.io/qwik";
import { DocumentHead, Link, routeLoader$ } from "@builder.io/qwik-city";
import Header from "~/components/layout/Header";
import HeaderButtons from "~/components/layout/HeaderButtons";
import HeaderTitle from "~/components/layout/HeaderTitle";
import { formatDateShort } from "~/lib/format";
import { Prisma } from "~/lib/prisma";
import { BudgetsService } from "~/lib/prisma/budgets.service";
import styles from "./index.scss?inline";
import { Budget } from "./types";



export const useGetBudgets = routeLoader$<Budget[]>(async ({ params, status }) => {
  const service = new BudgetsService(Prisma);
  return await service.getBudgets(0, 10);
});

export default component$(() => {
  const budgets = useGetBudgets();
  useStylesScoped$(styles);

  return (
    <>
      <Header>
        <HeaderTitle>
          <nav class="breadcrumb" aria-label="breadcrumbs">
            <ul>
              <li class="is-active"><Link href="#" aria-current="page">Haushaltspläne</Link></li>
            </ul>
          </nav>
        </HeaderTitle>
        <HeaderButtons>
          <a class="button is-primary is-rounded" href="/budgets/new">Hinzufügen</a>
        </HeaderButtons>
      </Header>
      <table class="table is-narrow is-hoverable">
        <thead>
          <tr>
            <th>Name</th>
            <th>Beschreibung</th>
            <th>Beginn</th>
            <th>Ende</th>
            <th>Status</th>
            <th></th>
          </tr>
        </thead>
        <tbody>
          {budgets.value.map((budget) => (
            <tr key={budget.id}>
              <td class="is-vcentered">{budget.display_name}</td>
              <td class="is-vcentered">{budget.display_description === '' ? '-' : ''}</td>
              <td class="is-vcentered">{formatDateShort(budget.period_start)}</td>
              <td class="is-vcentered">{formatDateShort(budget.period_end)}</td>
              <td class="is-vcentered"><span class={[
                'tag',
                budget.is_closed ? 'is-danger' : 'is-success'
              ]}>{budget.is_closed ? 'Geschlossen' : 'Offen'}</span></td>
              <td class="is-vcentered">
                <p class="buttons are-small is-right">
                  <a class="button" href={`/budgets/${budget.id}`}>Anzeigen</a>
                  <a class="button is-danger is-outlined" href={`/budgets/${budget.id}/delete`}>Entfernen</a>
                </p>
              </td>
            </tr>
          ))}
          {budgets.value.length === 0 && (
            <tr>
              <td colSpan="6" class="has-text-centered">
                <p class="is-size-6">Keine Haushaltspläne gefunden</p>
              </td>
            </tr>
          )}
        </tbody>
      </table>
    </>
  );
});

export const head: DocumentHead = {
  title: "Haushaltspläne",
  meta: [],
};
