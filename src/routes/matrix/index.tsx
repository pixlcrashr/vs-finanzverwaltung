import { component$, useComputed$, useSignal, useStylesScoped$ } from "@builder.io/qwik";
import styles from "./index.scss?inline";
import { routeLoader$ } from "@builder.io/qwik-city";
import { formatDateShort } from "~/lib/format";

type Matrix = {
  budgets: {
    id: string;
    name: string;
    description: string;
    revisions: {
      id: string;
      description: string;
      date: Date;
    }[]
  }[];
  rows: {
    accountId: string;
    accountName: string;
    accountCode: string;
    accountDescription: string;
    depth: number;
    values: {
      actualValue: number;
      revisions: {
        revisionId: string;
        targetValue: number;
        diffValue: number;
      }[];
    }[];
  }[];
}

const useGetMatrix = routeLoader$<Matrix>(() => {
  return {
    budgets: [
      {
        id: '1',
        name: 'HH 24/25',
        description: '',
        revisions: [
          {
            id: '2',
            description: 'Revision 1',
            date: new Date()
          },
          {
            id: '3',
            description: 'Revision 2',
            date: new Date()
          }
        ]
      }
    ],
    rows: [
      {
        accountId: '1',
        accountName: 'Konto 1',
        accountCode: '1',
        accountDescription: '',
        depth: 0,
        values: [
          {
            actualValue: 100,
            revisions: [
              {
                revisionId: '2',
                targetValue: 100,
                diffValue: 0
              },
              {
                revisionId: '3',
                targetValue: 100,
                diffValue: 0
              }
            ]
          }
        ]
      },
      {
        accountId: '2',
        accountName: 'Konto 2',
        accountCode: '2',
        accountDescription: '',
        depth: 1,
        values: [
          {
            actualValue: 200,
            revisions: [
              {
                revisionId: '2',
                targetValue: 100,
                diffValue: 100
              },
              {
                revisionId: '3',
                targetValue: 200,
                diffValue: 100
              }
            ]
          }
        ]
      }
    ]
  };
});

export default component$(() => {
  useStylesScoped$(styles);

  const matrix = useGetMatrix();

  const showTarget = useSignal(true);
  const showActual = useSignal(false);
  const showDiff = useSignal(false);
  const showDescription = useSignal(false);

  const budgetColSpan = useComputed$(() => {
    return (showTarget.value ? 1 : 0) + (showActual.value ? 1 : 0) + (showDiff.value ? 1 : 0);
  });

  return (<div class="matrix-container">
    <header class="matrix-header">
      <div class="buttons are-small has-addons">
        <button class={["button", { "is-active": showTarget.value }]} onClick$={() => showTarget.value = !showTarget.value}>
          Soll
        </button>
        <button class={["button", { "is-active": showActual.value }]} onClick$={() => showActual.value = !showActual.value}>
          Ist
        </button>
        <button class={["button", { "is-active": showDiff.value }]} onClick$={() => showDiff.value = !showDiff.value}>
          Diff.
        </button>
      </div>
      <div class="buttons are-small has-addons">
        <button class={["button", { "is-active": showDescription.value }]} onClick$={() => showDescription.value = !showDescription.value}>
          Beschreibung
        </button>
      </div>
    </header>
    <main class="matrix-content">
      <table class="table is-bordered">
        <thead>
          <tr>
            <th rowSpan={2}>Konto</th>
            <th rowSpan={2}>Titel</th>
            {showDescription.value && <th rowSpan={2}>Beschreibung</th>}
            {(showTarget.value || showActual.value || showDiff.value) && <>
              {matrix.value.budgets.map((budget) => <th key={budget.id} colSpan={budgetColSpan.value + (budget.revisions.length-1) * ((showTarget.value ? 1 : 0) + (showDiff.value ? 1 : 0))}>{budget.name}</th>)}
            </>}
          </tr>
          <tr>
            {matrix.value.budgets.map((budget) => <>
              {showTarget.value && budget.revisions.map((revision, i) => <th key={revision.id}>Soll{i > 0 ? ` (Rev. ${i + 1}, ${formatDateShort(revision.date)})` : ''}</th>)}
              {showActual.value && <th>Ist</th>}
              {showDiff.value && budget.revisions.map((revision, i) => <th key={revision.id}>Diff.{i > 0 ? ` (Rev. ${i + 1}, ${formatDateShort(revision.date)})` : ''}</th>)}
            </>)}
          </tr>
        </thead>
        <tbody>
          {matrix.value.rows.map((row, i) => <tr key={row.accountId}>
              <td>{row.accountCode}</td>
              <td>{row.accountName}</td>
              {showDescription.value && <td>{row.accountDescription}</td>}
              {row.values.map((value, j) => <>
                {showTarget.value && value.revisions.map((revision, k) => <td key={revision.revisionId}>{revision.targetValue}</td>)}
                {showActual.value && <td>{value.actualValue}</td>}
                {showDiff.value && value.revisions.map((revision, k) => <td key={revision.revisionId}>{revision.diffValue}</td>)}
              </>)}
            </tr>)}
        </tbody>
      </table>
    </main>
  </div>);
})
