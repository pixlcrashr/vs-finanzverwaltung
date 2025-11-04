import { component$, QRL } from "@builder.io/qwik";
import { formAction$, useForm, valiForm$ } from "@modular-forms/qwik";
import * as v from 'valibot';
import { Prisma } from "~/lib/prisma";



const CreateBudgetSchema = v.object({
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
});

type CreateBudgetForm = v.InferInput<typeof CreateBudgetSchema>;

type CreateBudgetMenuFormProps = {
  onCreated$?: QRL<() => void>;
}

async function createBudget(name: string, description: string, startDate: Date, endDate: Date): Promise<void> {
  await Prisma.budgets.create({
    data: {
      display_name: name,
      display_description: description,
      period_start: startDate,
      period_end: endDate,
      budget_revisions: {
        create: {
          date: startDate,
        }
      }
    }
  });
}

export const useFormAction = formAction$<CreateBudgetForm>(async (values) => {
  await createBudget(values.name, values.description, new Date(values.startDate), new Date(values.endDate));
}, valiForm$(CreateBudgetSchema));

export default component$<CreateBudgetMenuFormProps>((props) => {
  const [form, { Form, Field }] = useForm({
    loader: { value: {
      name: '',
      description: '',
      startDate: '',
      endDate: ''
    }},
    action: useFormAction(),
    validate: valiForm$(CreateBudgetSchema)
  });

  return (
    <>
    <Form onSubmit$={props.onCreated$}>
      <div class="field">
        <label class="label">Name</label>
        <Field name="name">
          {(field, props) => (<>
            <div class="control">
              <input {...props} class="input is-small" disabled={form.submitting} type="text" value={field.value} />
            </div>

            {field.error && <p class="help is-danger">{field.error}</p>}
          </>)}
        </Field>
      </div>

      <div class="field">
        <label class="label">Beschreibung</label>
        <Field name="description">
          {(field, props) => (<>
            <div class="control">
              <textarea {...props} class="textarea is-small" disabled={form.submitting} rows={10} value={field.value} />
            </div>

            {field.error && <p class="help is-danger">{field.error}</p>}
          </>)}
        </Field>
      </div>

      <div class="field is-horizontal">
        <div class="field-body">
          <div class="field">
            <label class="label">Start Zeitraum</label>
            <Field name="startDate">
              {(field, props) => (<>
                <div class="control">
                  <input {...props} class="input is-small" disabled={form.submitting} type="date" value={field.value} />
                </div>

                {field.error && <p class="help is-danger">{field.error}</p>}
              </>)}
            </Field>
          </div>

          <div class="field">
            <label class="label">Ende Zeitraum</label>
            <Field name="endDate">
              {(field, props) => (<>
                <div class="control">
                  <input {...props} class="input is-small" disabled={form.submitting} type="date" value={field.value} />
                </div>

                {field.error && <p class="help is-danger">{field.error}</p>}
              </>)}
            </Field>
          </div>
        </div>
      </div>

      <div class="buttons mt-5 is-right are-small">
        <button type="submit" class={["button", "is-primary", {
          'is-loading': form.submitting
        }]}>Hinzufügen</button>
      </div>
    </Form>

    </>
  );
});
