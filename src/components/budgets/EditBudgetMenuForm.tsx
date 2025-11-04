import { $, component$, QRL, useSignal } from "@builder.io/qwik";
import { formAction$, InitialValues, useForm, valiForm$ } from '@modular-forms/qwik';
import * as v from 'valibot';
import { BudgetStatus } from "~/lib/types";
import { Prisma } from "~/lib/prisma";
import { server$ } from "@builder.io/qwik-city";
import { formatDateInputField } from "~/lib/format";



const EditBudgetSchema = v.object({
  id: v.pipe(
    v.string(),
    v.uuid()
  ),
  name: v.pipe(
    v.string(),
    v.minLength(1)
  ),
  description: v.string(),
  startDate: v.pipe(
    v.string(),
    v.isoDate()
  ),
  endDate: v.pipe(
    v.string(),
    v.isoDate()
  ),
  revisions: v.array(
    v.object({
      id: v.pipe(
        v.string(),
        v.uuid()
      ),
      date: v.pipe(
        v.string(),
        v.isoDate()
      ),
      description: v.pipe(
        v.string()
      )
    })
  )
});

type EditBudgetForm = v.InferInput<typeof EditBudgetSchema>;

type EditBudgetMenuFormProps = {
  value: InitialValues<EditBudgetForm>;
  lastRevisionDate: string;
  status: BudgetStatus;
  onSubmit$?: QRL<() => void>;
}

async function saveBudget(id: string, name: string, description: string, startDate: Date, endDate: Date): Promise<void> {
  const m = await Prisma.budgets.findFirst({
    where: {
      id: id,
    },
  });
  if (!m) {
    return;
  }

  m.display_name = name;
  m.display_description = description;
  m.period_start = startDate;
  m.period_end = endDate;

  await Prisma.budgets.update({
    where: {
      id: id,
    },
    data: m,
  });
}

interface Revision {
  id: string;
  date: Date;
  description: string;
  createdAt: Date;
  updatedAt: Date;
}

async function listRevisions(budgetId: string): Promise<Revision[]> {
  const revisions = await Prisma.budget_revisions.findMany({
    where: {
      budget_id: budgetId,
    },
    orderBy: {
      created_at: "asc"
    }
  });

  return revisions.map((r) => ({
    id: r.id,
    date: r.date,
    description: r.display_description,
    createdAt: r.created_at,
    updatedAt: r.updated_at,
  }));
}

async function saveRevision(id: string, date: Date, description: string): Promise<void> {
  const m = await Prisma.budget_revisions.findFirst({
    where: {
      id: id,
    },
  });
  if (!m) {
    return;
  }

  m.display_description = description;
  m.date = date;

  await Prisma.budget_revisions.update({
    where: {
      id: id,
    },
    data: m,
  });
};

async function deleteRevision(id: string): Promise<void> {
  await Prisma.budget_revisions.delete({
    where: {
      id: id,
    },
  });
}

async function addRevision(budgetId: string): Promise<Revision> {
  const m = await Prisma.budget_revisions.create({
    data: {
      budget_id: budgetId,
      date: new Date(),
    }
  });

  return {
    id: m.id,
    date: m.date,
    description: m.display_description,
    createdAt: m.created_at,
    updatedAt: m.updated_at
  };
}

export const addRevisionServer = server$(async (budgetId: string) => {
  return await addRevision(budgetId);
});

export const useFormAction = formAction$<EditBudgetForm>(async (values) => {
  await saveBudget(
    values.id,
    values.name,
    values.description,
    new Date(values.startDate),
    new Date(values.endDate)
  );

  const rs = await listRevisions(values.id);

  for (const r of rs) {
    const v = values.revisions.find((v) => v.id === r.id);
    if (v) {
      await saveRevision(r.id, new Date(v.date), v.description);
    } else {
      await deleteRevision(r.id);
    }
  }

  return {
    status: "success"
  }
}, valiForm$(EditBudgetSchema));

export default component$<EditBudgetMenuFormProps>(({ value, onSubmit$, lastRevisionDate, status }) => {
  const valueStore = useSignal(value);

  const [form, { Form, Field, FieldArray }] = useForm({
    loader: valueStore,
    action: useFormAction(),
    fieldArrays: ['revisions'],
    validate: valiForm$(EditBudgetSchema)
  });

  return (
    <Form onSubmit$={onSubmit$}>
      <Field name="id">{(field, props) => <input {...props} hidden type="hidden" value={field.value} />}</Field>

      <div class="field">
        <label class="label">Status</label>
        <div class="control">
          <p>{status === BudgetStatus.Open ? 'Offen' : 'Geschlossen'}</p>
        </div>
      </div>

      <div class="field">
        <label class="label">Name</label>
        <div class="control">
          <Field name="name">{(field, props) => (
            <input {...props} class="input is-small" disabled={form.submitting} type="text" value={field.value} />
          )}</Field>
        </div>
      </div>

      <div class="field">
        <label class="label">Beschreibung</label>
        <div class="control">
          <Field name="description">{(field, props) => {
            return (<textarea {...props} class="textarea is-small" disabled={form.submitting} rows={10} value={field.value} />);
          }}</Field>
        </div>
      </div>

      <div class="field is-horizontal">
        <div class="field-body">
          <div class="field">
            <label class="label">Start Zeitraum</label>
            <div class="control">
              <Field name="startDate">{(field, props) => (
                <input {...props} class="input is-small" disabled={form.submitting} type="date" value={field.value} />
              )}</Field>
            </div>
          </div>
          <div class="field">
            <label class="label">Ende Zeitraum</label>
            <div class="control">
              <Field name="endDate">{(field, props) => (
                <input {...props} class="input is-small" disabled={form.submitting} type="date" value={field.value} />
              )}</Field>
            </div>
          </div>
        </div>
      </div>

      <div class="field">
        <label class="label">Revisionen</label>
        <table class="table is-narrow is-fullwidth">
          <thead>
            <tr>
              <th>Nr.</th>
              <th>Datum</th>
              <th>Beschreibung</th>
              <th></th>
            </tr>
          </thead>
          <tbody>
            <FieldArray name="revisions">
              {(fieldArray) => fieldArray.items.map((item, index) => (
                <tr key={item}>
                  <td class="is-vcentered">{index + 1}</td>
                  <td class="is-vcentered">
                    <Field name={`revisions.${index}.id`}>
                      {(field, props) => (
                        <input {...props} hidden disabled={index !== fieldArray.items.length - 1} type="hidden" value={field.value} />
                      )}
                    </Field>
                    <Field name={`revisions.${index}.date`}>
                      {(field, props) => (
                      <div class="field">
                        <div class="control is-small">
                          <input
                            {...props}
                            class="input is-small"
                            disabled={index !== fieldArray.items.length - 1}
                            type="date"
                            name={`revisions.${index}.date`}
                            placeholder="Revisionsdatum"
                            value={field.value}
                          />
                        </div>
                      </div>
                      )}
                    </Field>
                  </td>
                  <td class="is-vcentered">
                    <Field name={`revisions.${index}.description`}>
                      {(field, props) => (
                        <textarea
                          {...props}
                          class="textarea is-small"
                          disabled={index !== fieldArray.items.length - 1}
                          placeholder="Revisionsbeschreibung"
                          rows={3}
                          name={`revisions.${index}.description`}
                          value={field.value}
                        ></textarea>
                      )}
                    </Field>
                  </td>
                  <td class="is-vcentered">
                    {index === fieldArray.items.length - 1 && <button type="button" class="delete" onClick$={() => {
                      fieldArray.items.splice(index, 1);
                      fieldArray.dirty = true;
                    }}></button>}
                  </td>
                </tr>
              ))}
            </FieldArray>
          </tbody>
        </table>
        <div class="buttons is-right are-small">
          <button class="button" type="button" onClick$={async () => {
            const r = await addRevisionServer(value.id ?? '');

            const m = Object.assign({}, valueStore.value);
            m.revisions.push({
              id: r.id,
              date: formatDateInputField(r.date),
              description: r.description,
            });
            valueStore.value = m;
          }}>Revision hinzufügen</button>
        </div>
      </div>

      <div class="buttons mt-5 is-right are-small">
        <button type="submit" disabled={!form.dirty} class={["button", "is-warning", {
          'is-loading': form.submitting
        }]}>Speichern</button>
      </div>
    </Form>
  );
});
