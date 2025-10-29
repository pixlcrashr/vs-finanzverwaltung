import { component$ } from "@builder.io/qwik";
import { DocumentHead, routeLoader$ } from "@builder.io/qwik-city";
import { getBudgets } from "~/lib/prisma";

export interface Budget {
  id: string;
  display_name: string;
  display_description: string;
}

export const useGetBudgets = routeLoader$<Budget[]>(async ({params, status}) => {
    const budgets = await getBudgets(0, 10);
    return budgets.map((budget) => ({
      id: budget.id,
      display_name: budget.display_name,
      display_description: budget.display_description,
    }));
});

export default component$(() => {
  const budgets = useGetBudgets();

  return (
    <>
      <h1>Haushaltspläne</h1>
      <ul>
        {budgets.value.map((budget) => (
            <li key={budget.id}>{budget.display_name}</li>
        ))}
      </ul>
    </>
  );
});

export const head: DocumentHead = {
  title: "Haushaltspläne",
  meta: [],
};
