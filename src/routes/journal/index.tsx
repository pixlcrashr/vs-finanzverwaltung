import { component$ } from "@builder.io/qwik";
import { Link, routeLoader$ } from "@builder.io/qwik-city";
import Header from "~/components/layout/Header";
import HeaderButtons from "~/components/layout/HeaderButtons";
import HeaderTitle from "~/components/layout/HeaderTitle";
import MainContent from "~/components/layout/MainContent";
import { formatCurrency, formatDateShort } from "~/lib/format";
import { Prisma } from "~/lib/prisma";


export interface Transaction {
  id: string;
  date: Date;
  amount: string;
  debitAccountCode: string;
  debitAccountId: string;
  creditAccountCode: string;
  creditAccountId: string;
  description: string;
  assignedAccountId: string | null;
  assignedAccountName: string | null;
}

async function getTransactions(): Promise<Transaction[]> {
  const ts = await Prisma.transactions.findMany({
    include: {
      accounts: true,
      transaction_accounts_transactions_credit_transaction_account_idTotransaction_accounts: true,
      transaction_accounts_transactions_debit_transaction_account_idTotransaction_accounts: true
    },
    orderBy: {
      created_at: 'desc'
    },
    skip: 0,
    take: 100
  });

  return ts.map(t => {
    return {
      id: t.id,
      date: t.booked_at,
      amount: t.amount.toString(),
      debitAccountCode: t.transaction_accounts_transactions_debit_transaction_account_idTotransaction_accounts.code,
      debitAccountId: t.transaction_accounts_transactions_debit_transaction_account_idTotransaction_accounts.id,
      creditAccountCode: t.transaction_accounts_transactions_credit_transaction_account_idTotransaction_accounts.code,
      creditAccountId: t.transaction_accounts_transactions_credit_transaction_account_idTotransaction_accounts.id,
      description: t.description,
      assignedAccountId: t.assigned_account_id,
      assignedAccountName: t.accounts?.display_name ?? null
    };
  });
}

export const useGetTransactions = routeLoader$<Transaction[]>(async () => {
  return await getTransactions();
});

export default component$(() => {
  const transactions = useGetTransactions();

  return (<>
    <MainContent>
      <Header>
        <HeaderTitle>
          <nav class="breadcrumb" aria-label="breadcrumbs">
            <ul>
              <li class="is-active"><Link href="#" aria-current="page">Journal</Link></li>
            </ul>
          </nav>
        </HeaderTitle>
        <HeaderButtons>
          <Link href="/journal/import" class="button is-primary is-rounded">Importieren...</Link>
        </HeaderButtons>
      </Header>
      <table class="table is-narrow is-hoverable is-fullwidth is-striped">
        <thead>
          <tr>
            <th>Datum</th>
            <th>Betrag</th>
            <th>Sollkonto</th>
            <th>Habenkonto</th>
            <th>Buchungstext</th>
            <th>Haushaltskonto</th>
            <th></th>
          </tr>
        </thead>
        <tbody>
          {transactions.value.map(x => <tr>
            <td class="is-vcentered">{formatDateShort(x.date)}</td>
            <td class="is-vcentered">{formatCurrency(x.amount)}</td>
            <td class="is-vcentered"><Link href={`/transactionAccounts/${x.debitAccountId}`}>{x.debitAccountCode}</Link></td>
            <td class="is-vcentered"><Link href={`/transactionAccounts/${x.creditAccountId}`}>{x.creditAccountCode}</Link></td>
            <td class="is-vcentered">{x.description}</td>
            <td class="is-vcentered">
              {x.assignedAccountId === null ? '-' : <Link href={`/accounts/${x.assignedAccountId}`}>{x.assignedAccountName}</Link>}
            </td>
            <td class="is-vcentered">
              <div class="buttons are-small is-right">
                <button class="button is-danger is-outlined">Stornieren</button>
              </div>
            </td>
          </tr>)}
        </tbody>
      </table>
      <nav class="pagination is-small is-centered" role="navigation" aria-label="pagination">
        <a href="#" class="pagination-previous">Previous</a>
        <a href="#" class="pagination-next">Next page</a>
        <ul class="pagination-list">
          <li><a href="#" class="pagination-link" aria-label="Goto page 1">1</a></li>
          <li><span class="pagination-ellipsis">&hellip;</span></li>
          <li><a href="#" class="pagination-link" aria-label="Goto page 45">45</a></li>
          <li>
            <a
              class="pagination-link is-current"
              aria-label="Page 46"
              aria-current="page"
              >46</a>
          </li>
          <li><a href="#" class="pagination-link" aria-label="Goto page 47">47</a></li>
          <li><span class="pagination-ellipsis">&hellip;</span></li>
          <li><a href="#" class="pagination-link" aria-label="Goto page 86">86</a></li>
        </ul>
      </nav>
    </MainContent>
  </>);
})
