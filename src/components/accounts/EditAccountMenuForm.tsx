import { component$, QRL, Signal } from "@builder.io/qwik";
import { formAction$, InitialValues, useForm, valiForm$ } from "@modular-forms/qwik";
import * as v from 'valibot';
import { Prisma } from "~/lib/prisma";
import { Prisma as P } from '@prisma/client';


const EditAccountSchema = v.object({
  id: v.pipe(
    v.string(),
    v.uuid()
  ),
  code: v.pipe(
    v.string(),
    v.minLength(1)
  ),
  parentAccountId: v.pipe(
    v.nullable(v.pipe(
      v.string(),
      v.uuid()
    )),
  ),
  name: v.pipe(
    v.string(),
    v.minLength(1)
  ),
  description: v.string(),
});

type EditAccountForm = v.InferInput<typeof EditAccountSchema>;

export interface Account {
  id: string;
  name: string;
  code: string;
  description: string;
  depth: number;
}

type EditAccountMenuFormProps = {
  value: InitialValues<EditAccountForm>;
  accounts: Signal<Account[]>;
  onSave$?: QRL<() => void>;
}

export const useFormAction = formAction$<EditAccountForm>(async (values) => {

  if (values.parentAccountId !== null) {
    const q = P.sql`WITH RECURSIVE ancestors(id, parent_id) AS (
  SELECT id, parent_account_id FROM accounts WHERE id = $1::uuid
  UNION
  SELECT a.id, a.parent_account_id
  FROM accounts a
  JOIN ancestors an ON a.id = an.parent_id
)
SELECT EXISTS (SELECT 1 FROM ancestors WHERE id = $2::uuid) AS has_cycle`;
    q.values = [values.parentAccountId, values.id];

    const hasCycle = await Prisma.$queryRaw<{ has_cycle: boolean }[]>(q);

    if (hasCycle[0].has_cycle) {
      return {
        errors: {
          parentAccountId: "Konto kann nicht als übergeordnetes Konto verwendet werden, da es einen Zyklus erzeugt."
        },
        status: "error",
        message: "Konto kann nicht als übergeordnetes Konto verwendet werden, da es einen Zyklus erzeugt."
      };
    }
  }

  await Prisma.accounts.update({
    where: {
      id: values.id
    },
    data: {
      parent_account_id: values.parentAccountId,
      display_name: values.name,
      display_code: values.code,
      display_description: values.description
    }
  });

  return {
    status: "success"
  }
}, valiForm$(EditAccountSchema));

export default component$<EditAccountMenuFormProps>((compProps) => {
  const [form, { Form, Field }] = useForm({
    loader: { value: compProps.value },
    action: useFormAction(),
    validate: valiForm$(EditAccountSchema)
  });

  return (
    <Form onSubmit$={compProps.onSave$}>
      <Field name="id">{(field, props) => <input {...props} hidden type="hidden" value={field.value} />}</Field>

      <div class="field">
        <label class="label">Übergeordnetes Konto</label>
        <Field name="parentAccountId">
          {(field, props) => (<>
            <div class="select">
              <select {...props} disabled={form.submitting} value={field.value ?? ''}>
                <option value="">Kein übergeordnetes Konto</option>
                {compProps.accounts.value.map((account) => (
                  <option key={account.id} value={account.id}>
                      {`${"\u00A0".repeat(account.depth * 5)}└─ ${account.code} | ${account.name}`}
                  </option>
                ))}
              </select>
            </div>

            {field.error && <p class="help is-danger">{field.error}</p>}
          </>)}
        </Field>
      </div>

      <div class="field">
        <label class="label">Code</label>
        <Field name="code">
          {(field, props) => (<>
            <div class="control">
              <input {...props} class="input is-small" disabled={form.submitting} type="text" value={field.value} />
            </div>

            {field.error && <p class="help is-danger">{field.error}</p>}
          </>)}
        </Field>
      </div>

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

      <div class="buttons mt-5 is-right are-small">
        <button type="submit" disabled={!form.dirty} class={["button", "is-warning", {
          'is-loading': form.submitting
        }]}>Speichern</button>
      </div>
    </Form>
  );
});
