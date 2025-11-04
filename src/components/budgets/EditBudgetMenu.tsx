import { component$, QRL, Resource, Signal, useResource$ } from "@builder.io/qwik";
import { server$ } from "@builder.io/qwik-city";
import { delay } from "~/lib/delay";
import { formatDateInputField } from "~/lib/format";
import EditBudgetMenuForm from "./EditBudgetMenuForm";
import { Prisma } from "~/lib/prisma";
import { BudgetStatus } from "~/lib/types";

interface EditBudgetMenuProps {
  budgetId: Signal<string>;
  onSaved$?: QRL<() => void>;
}

interface Revision {
  id: string;
  date: Date;
  description: string;
  createdAt: Date;
  updatedAt: Date;
}

interface Budget {
  id: string;
  name: string;
  description: string;
  startDate: Date;
  endDate: Date;
  is_closed: boolean;
  created_at: Date;
  updated_at: Date;
  revisions: Revision[];
  lastRevisionDate: Date;
}

async function getBudget(id: string): Promise<Budget | null> {
  try {
    const m = await Prisma.budgets.findUnique({
      include: {
        budget_revisions: true,
      },
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
      startDate: m.period_start,
      endDate: m.period_end,
      is_closed: m.is_closed,
      created_at: m.created_at,
      updated_at: m.updated_at,
      revisions: m.budget_revisions.map((r) => ({
        id: r.id,
        date: r.date,
        description: r.display_description,
        createdAt: r.created_at,
        updatedAt: r.updated_at,
      })),
      lastRevisionDate: m.budget_revisions[m.budget_revisions.length - 1].date ?? new Date(),
    };
  } catch {
    return null;
  }
}

export const fetchBudget = server$(async (budgetId: string) => {
  const b = await getBudget(budgetId);

  return b;
});

export default component$<EditBudgetMenuProps>(({ budgetId, onSaved$ }) => {
  const budgetResource = useResource$(async ({ track }) => {
    track(() => budgetId.value);

    if (budgetId.value === '') {
      return null;
    }

    const b = await fetchBudget(budgetId.value);

    await delay(300);

    return b;
  });

  return (
    <>
      <Resource value={budgetResource} onPending={() => {
        return <progress class="progress is-small is-primary" max="100"></progress>;
      }} onResolved={(budget) => {
        return (<>
          {budget !== null && <EditBudgetMenuForm onSubmit$={onSaved$} value={{
            id: budget.id,
            name: budget.name,
            description: budget.description,
            startDate: formatDateInputField(budget.startDate),
            endDate: formatDateInputField(budget.endDate),
            revisions: budget.revisions.map((r) => ({
              id: r.id,
              date: formatDateInputField(r.date),
              description: r.description,
            }))
          }} lastRevisionDate={formatDateInputField(budget.lastRevisionDate)} status={budget.is_closed ? BudgetStatus.Closed : BudgetStatus.Open} />}
        </>);
      }} />

    </>
  );
});
