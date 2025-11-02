import { $, component$ } from "@builder.io/qwik";
import { Form, Link, routeAction$, routeLoader$ } from "@builder.io/qwik-city";
import Header from "~/components/layout/Header";
import HeaderButtons from "~/components/layout/HeaderButtons";
import HeaderTitle from "~/components/layout/HeaderTitle";
import { Prisma } from "~/lib/prisma";
import { useMinLoading } from "~/lib/delay";
import MainContent from "~/components/layout/MainContent";



interface Budget {
  id: string;
  name: string;
}

async function getBudget(id: string): Promise<Budget | null> {
  try {
    const m = await Prisma.budgets.findUnique({
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
    }
  } catch (error) {
    return null;
  }
}

async function deleteBudget(budgetId: string): Promise<void> {
  await Prisma.budgets.delete({
    where: {
      id: budgetId,
    },
  });
}

export const useGetBudget = routeLoader$<Budget>(async (req) => {
  const b = await getBudget(req.params.budgetId);

  if (!b) {
    throw req.redirect(307, "/budgets");
  }

  return b;
});

export const useDeleteBudgetAction = routeAction$(async (_, req) => {
  await deleteBudget(req.params.budgetId);

  throw req.redirect(307, "/budgets");
});

export default component$(() => {
  const budget = useGetBudget();
  const deleteBudgetAction = useDeleteBudgetAction();
  const isLoading = useMinLoading($(() => deleteBudgetAction.isRunning));

  return (
    <>
      <MainContent>
        <Form action={deleteBudgetAction}>
          <Header>
            <HeaderTitle>
              <nav class="breadcrumb" aria-label="breadcrumbs">
                <ul>
                  <li><Link href="/budgets">Haushaltspläne</Link></li>
                  <li class="is-active"><Link href="#" aria-current="page">Haushaltsplan {budget.value.name} entfernen</Link></li>
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
      </MainContent>
    </>
  );
})
