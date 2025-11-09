import { component$, useComputed$, useSignal, useStylesScoped$ } from "@builder.io/qwik";
import { DocumentHead, Link, routeLoader$ } from "@builder.io/qwik-city";
import Header from "~/components/layout/Header";
import HeaderButtons from "~/components/layout/HeaderButtons";
import HeaderTitle from "~/components/layout/HeaderTitle";
import styles from "./index.scss?inline";
import MainContent from "~/components/layout/MainContent";
import MainContentMenu from "~/components/layout/MainContentMenu";
import MainContentMenuHeader from "~/components/layout/MainContentMenuHeader";
import { Prisma } from "~/lib/prisma";
import { accounts } from "@prisma/client";



enum MenuStatus {
  None,
  Create,
  Edit
}

interface Account {
  id: string;
  name: string;
  code: string;
  description: string;
  depth: number;
}

async function getAccounts(): Promise<Account[]> {
  const as = await Prisma.accounts.findMany({
    orderBy: {
      display_code: 'asc'
    }
  });

  const res: Account[] = [];

  const traverse = (parentAccount: accounts, childAccounts: accounts[], depth: number) => {
    res.push({
      id: parentAccount.id,
      name: parentAccount.display_name,
      code: parentAccount.display_code,
      description: parentAccount.display_description,
      depth: depth,
    });

    childAccounts.forEach(x => traverse(x, as.filter(y => y.parent_account_id === x.id), depth + 1));
  };

  as.filter(x => x.parent_account_id === null).forEach(x => traverse(x, as.filter(y => y.parent_account_id === x.id), 0));

  return res;
}

export const useGetAccounts = routeLoader$<Account[]>(async () => await getAccounts());

export default component$(() => {
  useStylesScoped$(styles);

  const accounts = useGetAccounts();
  const maxDepth = useComputed$(() => accounts.value.reduce((max, account) => Math.max(max, account.depth), 0));
  const menuStatus = useSignal<MenuStatus>(MenuStatus.None);
  const createMenuShown = useComputed$(() => menuStatus.value === MenuStatus.Create);
  const editMenuShown = useComputed$(() => menuStatus.value === MenuStatus.Edit);
  const editMenuAccountId = useSignal<string>('');

  return (
    <>
      <MainContent>
        <Header>
          <HeaderTitle>
            <nav class="breadcrumb" aria-label="breadcrumbs">
              <ul>
                <li class="is-active"><Link href="#" aria-current="page">Haushaltskonten</Link></li>
              </ul>
            </nav>
          </HeaderTitle>
          <HeaderButtons>
            <button class="button is-primary is-rounded" onClick$={() => menuStatus.value = MenuStatus.Create}>Hinzufügen</button>
          </HeaderButtons>
        </Header>
        <table class="table is-hoverable is-fullwidth is-narrow">
          <thead>
            <tr>
              <th colSpan={maxDepth.value + 1}>Code</th>
              <th>Name</th>
              <th class="cell-spaced">Beschreibung</th>
              <th></th>
            </tr>
          </thead>
          <tbody>
            {accounts.value.map((account) => <tr key={account.id}>
              {Array.from({ length: maxDepth.value + 1 }).map((_, index) => <td class="is-vcentered" key={index}>
                {index === account.depth ? account.code : ''}
              </td>)}
              <td class="is-vcentered">{account.name}</td>
              <td class="is-vcentered">{account.description}</td>
              <td class="is-vcentered">
                <div class="buttons are-small is-flex-wrap-nowrap">
                  <button class="button" onClick$={() => {
                    editMenuAccountId.value = account.id;
                    menuStatus.value = MenuStatus.Edit;
                  }}>Bearbeiten</button>
                  <button class="button is-warning is-outlined">Archivieren</button>
                  <button class="button is-danger is-outlined">Entfernen</button>
                </div>
              </td>
            </tr>)}
          </tbody>
        </table>
      </MainContent>
      <MainContentMenu isShown={createMenuShown}>
        <MainContentMenuHeader onClose$={() => menuStatus.value = MenuStatus.None}>
          Haushaltskonto erstellen
        </MainContentMenuHeader>

      </MainContentMenu>
      <MainContentMenu isShown={editMenuShown}>
        <MainContentMenuHeader onClose$={() => menuStatus.value = MenuStatus.None}>
          Haushaltskonto bearbeiten
        </MainContentMenuHeader>

      </MainContentMenu>
    </>
  );
});

export const head: DocumentHead = {
  title: "VSFV | Haushaltskonten",
  meta: [],
};
