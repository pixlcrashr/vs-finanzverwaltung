import { component$, useSignal } from "@builder.io/qwik";
import { Form, Link, routeLoader$ } from "@builder.io/qwik-city";
import Header from "~/components/layout/Header";
import HeaderButtons from "~/components/layout/HeaderButtons";
import HeaderTitle from "~/components/layout/HeaderTitle";
import { formatDateInputField } from "~/lib/format";
import { Prisma } from "~/lib/prisma";
import { BudgetService } from "~/lib/prisma/budget.service";
import { Budget } from "./types";



export const useGetBudget = routeLoader$<Budget>(async (req) => {
  const service = new BudgetService(Prisma);
  const b = await service.getBudget(req.params.budgetId);

  if (!b) {
    throw req.redirect(307, "/budgets");
  }

  return b;
});

export default component$(() => {
  const budget = useGetBudget();
  const isEditing = useSignal(false);
  const isLoading = useSignal(false);

  return (
    <>
      <Form>
        <Header>
          <HeaderTitle>
            <nav class="breadcrumb" aria-label="breadcrumbs">
              <ul>
                <li><Link href="/budgets">Haushaltspläne</Link></li>
                <li class="is-active"><Link href="#" aria-current="page">{budget.value.name}</Link></li>
              </ul>
            </nav>
          </HeaderTitle>
          <HeaderButtons>
            {isEditing.value && (
              <button type="submit"
                class={["button", "is-text", "is-rounded"]}
                onClick$={() => isEditing.value = false}
                disabled={isLoading.value}>Abbrechen</button>
            )}
            {isEditing.value ? (
              <button type="submit" class={["button", "is-warning", "is-rounded", {
                'is-loading': isLoading.value
              }]} onClick$={() => isEditing.value = false}>Speichern</button>
            ) : (
              <button type="submit"
                class={["button", "is-primary", "is-rounded"]}
                onClick$={() => isEditing.value = true}>Bearbeiten</button>
            )}

            {!isEditing.value && <Link href={`/budgets/${budget.value.id}/delete`} class={["button", "is-danger", "is-rounded", {
              'is-loading': isLoading.value
            }]}>Entfernen</Link>}
          </HeaderButtons>
        </Header>

        <div class="field">
          <label class="label">Name</label>
          <div class="control">
            <input class="input" disabled={!isEditing.value || isLoading.value} name="name" type="text" placeholder="Name" value={budget.value.name} />
            {true}
          </div>
        </div>

        <div class="field">
          <label class="label">Beschreibung</label>
          <div class="control">
            <textarea
              class="textarea"
              disabled={!isEditing.value || isLoading.value}
              placeholder="Beschreibung"
              name="description"
              rows="10"
              value={budget.value.description}
            ></textarea>
          </div>
        </div>

        <div class="field is-horizontal">
          <div class="field-body">
            <div class="field">
              <label class="label">Start Zeitraum</label>
              <div class="control">
                <input class="input" disabled={!isEditing.value || isLoading.value} name="startDate" type="date" placeholder="Start Zeitraum" value={formatDateInputField(budget.value.period_start)} />
              </div>
            </div>

            <div class="field">
              <label class="label">Ende Zeitraum</label>
              <div class="control">
                <input class="input" disabled={!isEditing.value || isLoading.value} name="endDate" type="date" placeholder="Ende Zeitraum" value={formatDateInputField(budget.value.period_end)} />
              </div>
            </div>
          </div>
        </div>

        <div class="field">
          <label class="label">Revisionen</label>
          <table class="table is-fullwidth">
            <thead>
              <tr>
                <th>Nr.</th>
                <th>Datum</th>
                <th>Beschreibung</th>
                <th></th>
              </tr>
            </thead>
            <tbody>
              {budget.value.revisions.map((revision, index) => (
                <tr key={revision.id}>
                  <td>{index + 1}</td>
                  <td>
                    <div class="field">
                      <div class="control is-small">
                        <input
                          class="input is-small"
                          type="date"
                          placeholder="Revisionsdatum"
                          value={formatDateInputField(revision.date)}
                        />
                      </div>
                    </div>
                  </td>
                  <td>{revision.description || "-"}</td>
                  <td></td>
                </tr>
              ))}
            </tbody>
          </table>
          {isEditing.value && (
            <div class="buttons are-small">
              <button class="button" disabled={isLoading.value}>Revision hinzufügen</button>
            </div>
          )}
        </div>
      </Form>
    </>
  );
});
