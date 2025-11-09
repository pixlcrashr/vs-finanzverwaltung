import { component$, useComputed$, useSignal, useStylesScoped$, useTask$ } from "@builder.io/qwik";
import { DocumentHead, Link, routeLoader$ } from "@builder.io/qwik-city";
import AddBudgetMenu from "~/components/budgets/CreateBudgetMenu";
import EditBudgetMenu from "~/components/budgets/EditBudgetMenu";
import Header from "~/components/layout/Header";
import HeaderButtons from "~/components/layout/HeaderButtons";
import HeaderTitle from "~/components/layout/HeaderTitle";
import MainContent from "~/components/layout/MainContent";
import MainContentMenu from "~/components/layout/MainContentMenu";
import MainContentMenuHeader from "~/components/layout/MainContentMenuHeader";
import { formatDateShort } from "~/lib/format";
import { Prisma } from "~/lib/prisma";
import styles from "./index.scss?inline";
import CreateBudgetMenu from "~/components/budgets/CreateBudgetMenu";



export enum MenuStatus {
  None,
  Create,
  Edit
}

interface Budget {
  id: string;
  display_name: string;
  display_description: string;
  period_start: Date;
  period_end: Date;
  is_closed: boolean;
}

async function getBudgets(offset: number, limit: number): Promise<Budget[]> {
  const res = await Prisma.budgets.findMany({
    skip: offset,
    take: limit,
  });

  return res.map((budget) => ({
    id: budget.id,
    display_name: budget.display_name,
    display_description: budget.display_description,
    is_closed: budget.is_closed,
    period_start: budget.period_start,
    period_end: budget.period_end,
  }));
}

export const useGetBudgets = routeLoader$<Budget[]>(async () => await getBudgets(0, 10));

export default component$(() => {
  useStylesScoped$(styles);

  const budgets = useGetBudgets();
  const menuStatus = useSignal<MenuStatus>(MenuStatus.None);
  const createMenuShown = useComputed$(() => menuStatus.value === MenuStatus.Create);
  const editMenuShown = useComputed$(() => menuStatus.value === MenuStatus.Edit);
  const editMenuBudgetId = useSignal<string>('');

  useTask$(({ track }) => {
    track(() => menuStatus.value);

    if (menuStatus.value !== MenuStatus.Edit) {
      editMenuBudgetId.value = '';
    }
  });

  return (
    <>
      <MainContent>
        <Header>
          <HeaderTitle>
            <nav class="breadcrumb" aria-label="breadcrumbs">
              <ul>
                <li class="is-active"><Link href="#" aria-current="page">Haushaltspläne</Link></li>
              </ul>
            </nav>
          </HeaderTitle>
          <HeaderButtons>
            <button class="button is-primary is-rounded"
              onClick$={() => menuStatus.value = menuStatus.value === MenuStatus.Create ? MenuStatus.None : MenuStatus.Create}>Hinzufügen</button>
          </HeaderButtons>
        </Header>
        <table class="table is-narrow is-hoverable">
          <thead>
            <tr>
              <th>Name</th>
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
                <td class="is-vcentered">{formatDateShort(budget.period_start)}</td>
                <td class="is-vcentered">{formatDateShort(budget.period_end)}</td>
                <td class="is-vcentered"><span class={[
                  'tag',
                  budget.is_closed ? 'is-danger' : 'is-success'
                ]}>{budget.is_closed ? 'Geschlossen' : 'Offen'}</span></td>
                <td class="is-vcentered">
                  <p class="buttons are-small is-right">
                    <button class="button" onClick$={() => {
                      editMenuBudgetId.value = budget.id;
                      menuStatus.value = MenuStatus.Edit;
                    }}>Bearbeiten</button>
                    <a class="button is-danger is-outlined" href={`/budgets/${budget.id}/delete`}>Entfernen</a>
                  </p>
                </td>
              </tr>
            ))}
            {budgets.value.length === 0 && (
              <tr>
                <td colSpan={6} class="has-text-centered">
                  <p class="is-size-6">Keine Haushaltspläne gefunden</p>
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </MainContent>

      <MainContentMenu isShown={editMenuShown}>
        <MainContentMenuHeader onClose$={() => menuStatus.value = MenuStatus.None}>
          Haushaltsplan bearbeiten
        </MainContentMenuHeader>

      </MainContentMenu>

      <MainContentMenu isShown={createMenuShown}>
        <MainContentMenuHeader onClose$={() => menuStatus.value = MenuStatus.None}>
          Haushaltsplan erstellen
        </MainContentMenuHeader>

        <CreateBudgetMenu />
      </MainContentMenu >
    </>
  );
});

export const head: DocumentHead = {
  title: "VSFV | Haushaltspläne",
  meta: [],
};
