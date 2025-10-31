import { $, component$ } from "@builder.io/qwik";
import { Form, Link, routeAction$, routeLoader$ } from "@builder.io/qwik-city";
import Header from "~/components/layout/Header";
import HeaderButtons from "~/components/layout/HeaderButtons";
import HeaderTitle from "~/components/layout/HeaderTitle";
import { Budget } from "./types";
import { BudgetDeleteService } from "~/lib/prisma/budget-delete.service";
import { Prisma } from "~/lib/prisma";
import { useMinLoading } from "~/lib/delay";


export const useGetBudget = routeLoader$<Budget>(async (req) => {
  const service = new BudgetDeleteService(Prisma);
  const b = await service.getBudget(req.params.budgetId);

  if (!b) {
    throw req.redirect(307, "/budgets");
  }

  return b;
});

export const useDeleteBudgetAction = routeAction$(async (_, req) => {
  const service = new BudgetDeleteService(Prisma);
  await service.deleteBudget(req.params.budgetId);

  throw req.redirect(307, "/budgets");
});

export default component$(() => {
  const budget = useGetBudget();
  const deleteBudgetAction = useDeleteBudgetAction();
  const isLoading = useMinLoading($(() => deleteBudgetAction.isRunning));

  return (
    <>
      <Form action={deleteBudgetAction}>
        <Header>
          <HeaderTitle>
            <nav class="breadcrumb" aria-label="breadcrumbs">
              <ul>
                <li><Link href="/budgets">Haushaltspläne</Link></li>
                <li><Link href={`/budgets/${budget.value.id}`}>{budget.value.name}</Link></li>
                <li class="is-active"><Link href="#" aria-current="page">Entfernen</Link></li>
              </ul>
            </nav>
          </HeaderTitle>
          <HeaderButtons>
          </HeaderButtons>
        </Header>

        <div>
          <p class="has-text-centered is-size-5">Möchtest du den Haushaltsplan <strong>{budget.value.name}</strong> wirklich entfernen?</p>
        </div>

        <div class="buttons mt-6 is-centered">
          <button type="submit" class={[
            'button',
            'is-danger',
            {
              'is-loading': isLoading.value
            }
          ]}>Entfernen</button>
        </div>
      </Form>
    </>
  );
})
