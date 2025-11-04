import { component$, QRL, Resource, Signal, useResource$ } from "@builder.io/qwik";
import { server$ } from "@builder.io/qwik-city";
import { delay } from "~/lib/delay";
import { Prisma } from "~/lib/prisma";
import EditAccountMenuForm from "./EditAccountMenuForm";
import { Account as FormAccount } from "./EditAccountMenuForm";

interface Account {
  id: string;
  name: string;
  description: string;
  code: string;
  parentAccountId: string | null;
}

async function getAccount(id: string): Promise<Account | null> {
  try {
    const m = await Prisma.accounts.findUnique({
      where: {
        id: id,
      },
    });
    if (!m) {
      return null;
    }

    return {
      id: m.id,
      name: m.display_name,
      description: m.display_description,
      code: m.display_code,
      parentAccountId: m.parent_account_id
    };
  } catch {
    return null;
  }
}

export const fetchAccount = server$(async (accountId: string) => {
  const a = await getAccount(accountId);

  return a;
});

export type EditAccountMenuProps = {
  accountId: Signal<string>;
  accounts: Signal<FormAccount[]>;
  onSaved$?: QRL<() => void>;
}

export default component$<EditAccountMenuProps>(({ accountId, accounts, onSaved$ }) => {
  const accountResource = useResource$(async ({ track }) => {
    track(() => accountId.value);

    if (accountId.value === '') {
      return null;
    }

    const a = await fetchAccount(accountId.value);

    await delay(300);

    return a;
  });

  return (
    <>
      <Resource value={accountResource} onPending={() => {
        return <progress class="progress is-small is-primary" max="100"></progress>;
      }} onResolved={(account) => {
        return (<>
          {account !== null && <EditAccountMenuForm accounts={accounts} onSave$={onSaved$} value={{
            id: account.id,
            name: account.name,
            description: account.description,
            code: account.code,
            parentAccountId: account.parentAccountId
          }} />}
        </>);
      }} />

    </>
  );
});
