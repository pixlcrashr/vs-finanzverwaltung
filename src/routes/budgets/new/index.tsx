import { component$, $ } from "@builder.io/qwik";
import { Form, Link, routeAction$, zod$ } from "@builder.io/qwik-city";
import * as z from "zod";
import Header from "~/components/layout/Header";
import HeaderButtons from "~/components/layout/HeaderButtons";
import HeaderTitle from "~/components/layout/HeaderTitle";
import { Prisma } from "~/lib/prisma";
import { BudgetNewService } from "~/lib/prisma/budget-new.service";
import { useMinLoading } from "~/lib/delay";


export const useCreateBudgetAction = routeAction$(async ({ name, description, startDate, endDate }, { redirect }) => {
  const service = new BudgetNewService(Prisma);
  await service.createBudget(
    name,
    description,
    new Date(startDate),
    new Date(endDate)
  );

  throw redirect(307, "/budgets");
}, zod$({
  name: z.string().min(1),
  description: z.string(),
  startDate: z.string().date(),
  endDate: z.string().date()
}));


export default component$(() => {
  const createBudgetAction = useCreateBudgetAction();
  const isLoading = useMinLoading($(() => createBudgetAction.isRunning));

  const renderError = (errorMessage: string | undefined) => {
    if (!errorMessage) return null;
    return <p class="error">{errorMessage}</p>;
  };

  return (
    <>
      <Form action={createBudgetAction}>
        <Header>
          <HeaderTitle>
            <nav class="breadcrumb" aria-label="breadcrumbs">
              <ul>
                <li><Link href="/budgets">Haushaltspläne</Link></li>
                <li class="is-active"><Link href="#" aria-current="page">Erstellen</Link></li>
              </ul>
            </nav>
          </HeaderTitle>
        </Header>

        <div class="field">
          <label class="label">Name</label>
          <div class="control">
            <input class="input" disabled={isLoading.value} name="name" type="text" placeholder="Name" />
            {isLoading.value || renderError(createBudgetAction.value?.fieldErrors?.["name"])}
          </div>
        </div>

        <div class="field">
          <label class="label">Beschreibung</label>
          <div class="control">
            <textarea
              class="textarea"
              disabled={isLoading.value}
              placeholder="Beschreibung"
              name="description"
              rows="10"
            ></textarea>
          </div>
        </div>

        <div class="field is-horizontal">
          <div class="field-body">
            <div class="field">
              <label class="label">Start Zeitraum</label>
              <div class="control">
                <input class="input" disabled={isLoading.value} name="startDate" type="date" placeholder="Start Zeitraum" />
              </div>
            </div>

            <div class="field">
              <label class="label">Ende Zeitraum</label>
              <div class="control">
                <input class="input" disabled={isLoading.value} name="endDate" type="date" placeholder="Ende Zeitraum" />
              </div>
            </div>
          </div>
        </div>

        <div class="buttons mt-6 is-right">
          <button type="submit" class={["button", "is-primary", {
            'is-loading': isLoading.value
          }]}>Hinzufügen</button>
        </div>
      </Form>
    </>
  );
});
