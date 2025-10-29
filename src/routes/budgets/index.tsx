import { component$, useStylesScoped$ } from "@builder.io/qwik";
import { DocumentHead, routeLoader$ } from "@builder.io/qwik-city";
import { Prisma } from "~/lib/prisma";
import { Budget } from "./types";
import { BudgetsService } from "~/lib/prisma/budgets";
import { formatDateShort } from "~/lib/format";
import styles from "./index.scss?inline";
import Header from "~/components/layout/Header";
import HeaderTitle from "~/components/layout/HeaderTitle";
import HeaderButtons from "~/components/layout/HeaderButtons";



export const useGetBudgets = routeLoader$<Budget[]>(async ({params, status}) => {
  const service = new BudgetsService(Prisma);
  return await service.getBudgets(0, 10);
});

export default component$(() => {
  const budgets = useGetBudgets();
  useStylesScoped$(styles);

  return (
    <>
    <Header>
      <HeaderTitle>Haushaltspläne</HeaderTitle>
      <HeaderButtons>
          <a class="button is-primary is-rounded" href="/budgets/new">Hinzufügen</a>
      </HeaderButtons>
    </Header>
      <table class="table is-narrow is-hoverable">
        <thead>
          <tr>
            <th>Name</th>
            <th>Beschreibung</th>
            <th>Start Zeitraum</th>
            <th>Ende Zeitraum</th>
            <th>Status</th>
            <th></th>
          </tr>
        </thead>
        <tbody>
          {budgets.value.map((budget) => (
            <tr>
              <td>{budget.display_name}</td>
              <td>{budget.display_description === '' ? '-' : ''}</td>
              <td>{formatDateShort(budget.period_start)}</td>
              <td>{formatDateShort(budget.period_end)}</td>
              <td><span class={[
                'tag',
                budget.is_closed ? 'is-danger' : 'is-success'
              ]}>{budget.is_closed ? 'Geschlossen' : 'Offen'}</span></td>
              <td>
                <p class="buttons are-small is-right">
                  <a class="button is-primary is-outlined" href={`/budgets/${budget.id}`}>Bearbeiten</a>
                  <a class="button is-danger is-outlined" href={`/budgets/${budget.id}/delete`}>Entfernen</a>
                </p>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </>
  );
});

export const head: DocumentHead = {
  title: "Haushaltspläne",
  meta: [],
};
